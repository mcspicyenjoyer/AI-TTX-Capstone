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
} from './codex-extraction.js';
import { auditCodexBoundary } from './codex-isolation.js';
import { PROMPT_VERSION } from './extraction-prompt.js';
import { IntakeSourceSchema, type IntakeSource } from '../contracts/intake.js';
import { readStored } from './validation.js';
import { Type } from '@sinclair/typebox';
import { IdSchema } from '../contracts/profile.js';

const [executable, root, container] = process.argv.slice(2);
if (!executable || !root || !container || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,100}$/.test(container))
  throw new Error('Usage: subscription-worker CODEX_EXE ABSOLUTE_WORKER_DIRECTORY CONTAINER_NAME');
const directory = prepareDataDirectory(root);
await auditCodexBoundary(resolve(executable), directory);
await checkChatGptLogin(resolve(executable), directory);
const bridge = spawn(
  'docker',
  ['exec', '-i', container, 'node', 'dist/server/extraction-bridge.js'],
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
console.log('Local ChatGPT subscription worker ready. Waiting for explicit extraction requests.');
try {
  while (!stopped) {
    const value = await rpc({ method: 'claim' });
    if (!value) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }
    const job = readStored(JobSchema, value);
    const started = Date.now();
    let result: { output: unknown; inputTokens: number; outputTokens: number; failed: boolean };
    try {
      await auditCodexBoundary(resolve(executable), directory);
      result = {
        ...(await runCodexExtraction(
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
          promptVersion: PROMPT_VERSION,
          at: new Date().toISOString(),
          elapsedMs: Date.now() - started,
          sourceHashes: job.sources.map((s) => ({ title: s.title, hash: s.contentHash })),
          ...result,
          saved: completion.saved,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    console.log(
      `Extraction ${job.id}: ${completion.saved ? 'pending candidates saved' : 'not saved'}.`,
    );
  }
} finally {
  bridge.stdin.end();
  bridge.kill();
}
