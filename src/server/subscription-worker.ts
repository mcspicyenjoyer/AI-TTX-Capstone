import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { resolve, join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { prepareDataDirectory } from './config.js';
import {
  checkChatGptLogin,
  runCodexExtraction,
  CODEX_VERSION,
  EXTRACTION_MODEL,
  prepareCodex,
  runCodexStructured,
} from './codex-extraction.js';
import { auditCodexBoundary } from './codex-isolation.js';
import { PROMPT_VERSION } from './extraction-prompt.js';
import { IntakeSourceSchema, type IntakeSource } from '../contracts/intake.js';
import { readStored } from './validation.js';
import { Type } from '@sinclair/typebox';
import { IdSchema } from '../contracts/profile.js';
import { GeneratedPlanSchema, GenerationJobSchema } from '../contracts/generation.js';
import { generationPrompt, generationPromptVersion } from './generation-content.js';

const [executable, root, container, mode = 'extraction', execution = 'continuous'] =
  process.argv.slice(2);
if (!['continuous', 'once'].includes(execution))
  throw new Error('Worker execution must be continuous or once.');
if (!['extraction', 'packages'].includes(mode))
  throw new Error('Worker mode must be extraction or packages.');
if (!executable || !root || !container || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,100}$/.test(container))
  throw new Error('Usage: subscription-worker CODEX_EXE ABSOLUTE_WORKER_DIRECTORY CONTAINER_NAME');
const directory = prepareDataDirectory(root);
await auditCodexBoundary(resolve(executable), directory);
await checkChatGptLogin(resolve(executable), directory);
const bridge = spawn(
  'docker',
  [
    'exec',
    '-i',
    container,
    'node',
    mode === 'packages' ? 'dist/server/generation-bridge.js' : 'dist/server/extraction-bridge.js',
  ],
  { windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'] },
);
const lines = createInterface({ input: bridge.stdout });
const iterator = lines[Symbol.asyncIterator]();
let stopped = false;
const controller = new AbortController();
bridge.stderr.resume();
bridge.on('error', () => {
  stopped = true;
});
bridge.on('exit', () => {
  stopped = true;
  controller.abort();
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    stopped = true;
    controller.abort();
    bridge.stdin.end();
  });
async function rpc(request: unknown) {
  bridge.stdin.write(`${JSON.stringify(request)}\n`);
  const response = await iterator.next();
  if (response.done || response.value.length > 1_000_000)
    throw new Error('Local worker bridge closed.');
  const data = JSON.parse(response.value);
  if (data.error) throw new Error('Local worker request rejected.');
  return data.result;
}
const JobSchema = Type.Object(
  { id: IdSchema, sources: Type.Array(IntakeSourceSchema, { minItems: 1, maxItems: 10 }) },
  { additionalProperties: false },
);
console.log(`Local ChatGPT subscription worker ready. Waiting for explicit ${mode} requests.`);
try {
  while (!stopped) {
    const value = await rpc({ method: 'claim' });
    if (!value) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }
    const job =
      mode === 'packages' ? readStored(GenerationJobSchema, value) : readStored(JobSchema, value);
    const started = Date.now();
    let result: { output: unknown; inputTokens: number; outputTokens: number; failed: boolean };
    try {
      await auditCodexBoundary(resolve(executable), directory);
      if ('profile' in job)
        await prepareCodex(
          resolve(executable),
          directory,
          GeneratedPlanSchema,
          'Compose structured synthetic tabletop packages from confirmed profile evidence. Do not use tools. Return only the requested JSON.',
        );
      result = {
        ...('profile' in job
          ? await runCodexStructured(
              resolve(executable),
              directory,
              generationPrompt(job.profile, job.target),
              controller.signal,
            )
          : await runCodexExtraction(
              resolve(executable),
              directory,
              job.sources as IntakeSource[],
              controller.signal,
            )),
        failed: false,
      };
    } catch {
      result = { output: null, inputTokens: -1, outputTokens: -1, failed: true };
    }
    if (stopped) break;
    const completion = await rpc({ method: 'complete', value: { id: job.id, ...result } });
    await writeFile(
      join(directory, `${job.id}.json`),
      JSON.stringify(
        {
          id: job.id,
          model: EXTRACTION_MODEL,
          codexVersion: CODEX_VERSION,
          promptVersion: 'profile' in job ? generationPromptVersion : PROMPT_VERSION,
          at: new Date().toISOString(),
          elapsedMs: Date.now() - started,
          ...('profile' in job
            ? { target: job.target }
            : { sourceHashes: job.sources.map((s) => ({ title: s.title, hash: s.contentHash })) }),
          ...result,
          saved: completion.saved,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    console.log(`${mode} ${job.id}: ${completion.saved ? 'pending proposal saved' : 'not saved'}.`);
    if (execution === 'once') {
      process.exitCode = completion.saved ? 0 : 1;
      break;
    }
  }
} finally {
  bridge.stdin.end();
  bridge.kill();
}
