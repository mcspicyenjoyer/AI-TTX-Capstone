import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { IntakeSource } from '../contracts/intake.js';
import { ExtractionOutputSchema } from '../contracts/extraction.js';
import { extractionPrompt } from './extraction-prompt.js';

export const CODEX_VERSION = 'codex-cli 0.164.0-alpha.11.1';
export const CODEX_SHA256 = '1103e9e09c71fa2cd0afd6d8f3b9a2d63174fe8efd7cb5bd09f1cb14ef58a098';
export const EXTRACTION_MODEL = 'gpt-6.1-sol';
export function isDisabledCodeModeNotice(
  item: { type?: string; message?: string } | undefined,
): boolean {
  return (
    item?.type === 'error' &&
    item.message ===
      'Code Mode is unavailable because code-mode host is disabled. Code mode will fail closed; enable `features.code_mode_host` and install `codex-code-mode-host`.'
  );
}
const disabled = [
  'shell_tool',
  'unified_exec',
  'shell_snapshot',
  'apps',
  'plugins',
  'hooks',
  'multi_agent',
  'multi_agent_v2',
  'browser_use',
  'browser_use_external',
  'browser_use_full_cdp_access',
  'computer_use',
  'image_generation',
  'view_image',
  'code_mode',
  'code_mode_host',
  'artifact',
  'auth_elicitation',
  'tool_suggest',
  'skill_search',
  'skill_mcp_dependency_install',
  'goals',
  'sleep_tool',
  'memories',
  'unbounded_connection_retries',
  'request_permissions_tool',
  'workspace_dependencies',
];

export function codexEnvironment(env = process.env): NodeJS.ProcessEnv {
  return Object.fromEntries(
    ['LOCALAPPDATA', 'PATH', 'SYSTEMROOT', 'TEMP', 'TMP', 'USERPROFILE', 'WINDIR']
      .filter((key) => env[key] !== undefined)
      .map((key) => [key, env[key]]),
  );
}
export function codexArgs(directory: string, fixtureProvider?: string): string[] {
  const configs = [
    'forced_login_method="chatgpt"',
    'approval_policy="never"',
    'web_search="disabled"',
    'project_doc_max_bytes=0',
    'history.persistence="none"',
    'model_reasoning_effort="low"',
    'agents.enabled=false',
    'skills.bundled.enabled=false',
    'skills.include_instructions=false',
    'suppress_unstable_features_warning=true',
    `model_catalog_json=${JSON.stringify(join(directory, 'model.json'))}`,
    'model_provider="openai"',
  ];
  // Only the separate offline protocol test supplies a loopback fake provider.
  if (fixtureProvider) {
    if (!/^http:\/\/127\.0\.0\.1:\d+\/v1$/.test(fixtureProvider))
      throw new Error('Invalid fixture provider.');
    configs.splice(0, 1);
    configs.push(
      'model_provider="fixture"',
      'model_providers.fixture.name="Offline fixture"',
      `model_providers.fixture.base_url=${JSON.stringify(fixtureProvider)}`,
      'model_providers.fixture.wire_api="responses"',
      'model_providers.fixture.requires_openai_auth=false',
      'model_providers.fixture.request_max_retries=0',
      'model_providers.fixture.stream_max_retries=0',
    );
  }
  return [
    'exec',
    '--ignore-user-config',
    '--ignore-rules',
    '--ephemeral',
    '--strict-config',
    '--skip-git-repo-check',
    '--cd',
    directory,
    '--sandbox',
    'read-only',
    '--color',
    'never',
    '--json',
    '--model',
    EXTRACTION_MODEL,
    '--output-schema',
    join(directory, 'schema.json'),
    ...configs.flatMap((value) => ['-c', value]),
    '--enable',
    'skip_host_skill_discovery',
    ...disabled.flatMap((value) => ['--disable', value]),
    '--',
    '-',
  ];
}

export async function boundedProcess(
  executable: string,
  args: string[],
  options: {
    directory: string;
    input?: string;
    deadlineMs?: number;
    env?: NodeJS.ProcessEnv;
    maxOutputBytes?: number;
    signal?: AbortSignal;
    onLine?: (line: string) => void;
  },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(executable, args, {
      cwd: options.directory,
      env: options.env ?? codexEnvironment(),
      windowsHide: true,
      shell: false,
    });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    let stdout = '',
      stderr = '',
      pending = '',
      failure: Error | undefined;
    const stop = (error: Error) => {
      failure ??= error;
      child.kill();
    };
    const timer = setTimeout(
      () => stop(new Error('Codex deadline exceeded.')),
      options.deadlineMs ?? 180_000,
    );
    const abort = () => stop(new Error('Codex extraction interrupted.'));
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) abort();
    child.on('error', () => {
      clearTimeout(timer);
      reject(new Error('Cannot start the configured local process.'));
    });
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
      pending += chunk;
      if (
        Buffer.byteLength(stdout) + Buffer.byteLength(stderr) >
        (options.maxOutputBytes ?? 650_000)
      ) {
        stop(new Error('Codex output limit exceeded.'));
        return;
      }
      let end: number;
      while ((end = pending.indexOf('\n')) !== -1) {
        const line = pending.slice(0, end);
        pending = pending.slice(end + 1);
        try {
          options.onLine?.(line);
        } catch {
          stop(new Error('Prohibited or invalid Codex event.'));
        }
      }
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
      if (Buffer.byteLength(stderr) > 64_000) stop(new Error('Codex diagnostic limit exceeded.'));
      if (
        Buffer.byteLength(stdout) + Buffer.byteLength(stderr) >
        (options.maxOutputBytes ?? 650_000)
      )
        stop(new Error('Codex output limit exceeded.'));
    });
    child.stdin.on('error', () => {
      /* A failed child may close stdin before the prompt is written. */
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
      if (failure || code !== 0)
        reject(
          Object.assign(
            failure ??
              new Error(
                'Codex did not complete. Check the local login and subscription availability.',
              ),
            { diagnostic: 'Raw provider diagnostics withheld.' },
          ),
        );
      else resolvePromise({ stdout, stderr });
    });
    child.stdin.end(options.input ?? '');
  });
}

export async function prepareCodex(executable: string, directory: string) {
  if (process.platform !== 'win32')
    throw new Error('This reviewed local subscription adapter currently supports Windows only.');
  if (
    createHash('sha256')
      .update(await readFile(executable))
      .digest('hex') !== CODEX_SHA256
  )
    throw new Error(
      'Codex binary differs from the verified version. Re-run the isolation audit before updating the pin.',
    );
  await mkdir(directory, { recursive: true });
  const version = await boundedProcess(executable, ['--version'], {
    directory,
    deadlineMs: 10_000,
  });
  if (version.stdout.trim() !== CODEX_VERSION) throw new Error('Unsupported Codex version.');
  const result = await boundedProcess(executable, ['debug', 'models', '--bundled'], {
    directory,
    deadlineMs: 10_000,
    maxOutputBytes: 8_000_000,
  });
  const catalog = JSON.parse(result.stdout);
  const model = catalog.models.find((item: { slug: string }) => item.slug === EXTRACTION_MODEL);
  if (!model) throw new Error('Required model absent from the installed catalog.');
  model.shell_type = 'disabled';
  model.apply_patch_tool_type = null;
  model.experimental_supported_tools = [];
  model.node_repl_disabled = true;
  model.supports_search_tool = false;
  delete model.tool_mode;
  model.base_instructions =
    'You extract structured synthetic organisation evidence. Do not use tools. Return only the requested JSON.';
  delete model.model_messages;
  await writeFile(join(directory, 'model.json'), JSON.stringify({ models: [model] }), {
    mode: 0o600,
  });
  await writeFile(join(directory, 'schema.json'), JSON.stringify(ExtractionOutputSchema), {
    mode: 0o600,
  });
}

export async function checkChatGptLogin(executable: string, directory: string) {
  const status = await boundedProcess(
    executable,
    ['-c', 'forced_login_method="chatgpt"', 'login', 'status'],
    { directory, deadlineMs: 15_000 },
  );
  if (!/Logged in using ChatGPT/.test(status.stdout + status.stderr))
    throw new Error('Sign into Codex with ChatGPT first. API keys are not supported.');
}

export async function runCodexExtraction(
  executable: string,
  directory: string,
  sources: readonly IntakeSource[],
  signal?: AbortSignal,
) {
  let output: unknown,
    completed = false,
    inputTokens = 0,
    outputTokens = 0;
  await checkChatGptLogin(executable, directory);
  await boundedProcess(resolve(executable), codexArgs(directory), {
    directory,
    input: extractionPrompt(sources),
    signal,
    onLine: (line) => {
      const event = JSON.parse(line);
      if (
        event.type === 'item.started' ||
        event.type === 'item.updated' ||
        event.type === 'item.completed'
      ) {
        if (isDisabledCodeModeNotice(event.item)) return;
        if (!['agent_message', 'reasoning'].includes(event.item?.type))
          throw new Error('Tools are prohibited.');
        if (event.type === 'item.completed' && event.item.type === 'agent_message')
          output = JSON.parse(event.item.text);
      } else if (event.type === 'turn.completed') {
        completed = true;
        inputTokens =
          Number.isInteger(event.usage?.input_tokens) && event.usage.input_tokens >= 0
            ? event.usage.input_tokens
            : -1;
        outputTokens =
          Number.isInteger(event.usage?.output_tokens) && event.usage.output_tokens >= 0
            ? event.usage.output_tokens
            : -1;
      } else if (!['thread.started', 'turn.started'].includes(event.type))
        throw new Error('Unexpected Codex event.');
    },
  });
  if (!completed || output === undefined) throw new Error('No completed structured result.');
  return { output, inputTokens, outputTokens };
}
