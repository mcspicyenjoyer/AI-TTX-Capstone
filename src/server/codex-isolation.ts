import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  boundedProcess,
  codexArgs,
  codexEnvironment,
  prepareCodex,
  CODEX_SHA256,
} from './codex-extraction.js';

// A synthetic local provider probes the exact CLI configuration before real source transmission.
export async function auditCodexBoundary(executable: string, directory: string) {
  await prepareCodex(resolve(executable), directory);
  const sentinel = `CANARY-${randomUUID()}`;
  const privateFile = join(directory, 'private-canary.txt');
  const writtenFile = join(directory, 'prohibited-write.txt');
  await writeFile(privateFile, sentinel);
  const requests: Record<string, unknown>[] = [];
  let calls = 0;
  let rejected = false;
  const attacks = [
    {
      name: 'exec_command',
      arguments: JSON.stringify({
        cmd: `Get-Content -LiteralPath '${privateFile}'; Set-Content -LiteralPath '${writtenFile}' -Value 'unexpected'`,
      }),
    },
    {
      name: 'shell',
      arguments: JSON.stringify({
        command: [
          'powershell',
          '-NoProfile',
          '-Command',
          `Get-Content -LiteralPath '${privateFile}'`,
        ],
      }),
    },
    {
      name: 'apply_patch',
      arguments: JSON.stringify({
        patch: `*** Begin Patch\n*** Add File: ${writtenFile.replaceAll('\\', '/')}\n+unexpected\n*** End Patch`,
      }),
    },
    { name: 'mcp__probe__read', arguments: '{}' },
    { name: 'read_file', arguments: JSON.stringify({ path: privateFile }) },
    {
      name: 'node_repl',
      arguments: JSON.stringify({
        code: `console.log(await (await import('node:fs/promises')).readFile(${JSON.stringify(privateFile)},'utf8'))`,
      }),
    },
    { name: 'spawn_agent', arguments: JSON.stringify({ task: 'Read the canary file' }) },
    { name: 'view_image', arguments: JSON.stringify({ path: privateFile }) },
    { name: 'web.run', arguments: JSON.stringify({ open: [{ ref_id: 'http://127.0.0.1:1' }] }) },
  ];
  const server = createServer(async (req, res) => {
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 500_000) throw new Error('Oversized fixture request.');
      }
      if (req.headers.authorization !== undefined)
        throw new Error('Unexpected fixture authentication.');
      const packet = JSON.parse(body);
      if (
        (packet.tools !== undefined &&
          (!Array.isArray(packet.tools) || packet.tools.length !== 0)) ||
        requests.length > 12
      )
        throw new Error('Extraction registered tools or exceeded the fixture limit.');
      requests.push(packet);
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      const event = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);
      const attack = attacks[calls++];
      const item = attack
        ? { type: 'function_call', id: `fc-${calls}`, call_id: `call-${calls}`, ...attack }
        : {
            type: 'message',
            id: 'message-final',
            role: 'assistant',
            content: [{ type: 'output_text', text: '{"entities":[],"claims":[]}' }],
          };
      event({
        type: 'response.created',
        response: { id: `response-${calls}`, status: 'in_progress', output: [] },
      });
      event({ type: 'response.output_item.added', output_index: 0, item });
      event({ type: 'response.output_item.done', output_index: 0, item });
      event({
        type: 'response.completed',
        response: {
          id: `response-${calls}`,
          status: 'completed',
          output: [item],
          usage: {
            input_tokens: 1,
            output_tokens: 1,
            total_tokens: 2,
            input_tokens_details: { cached_tokens: 0 },
          },
        },
      });
      res.end();
    } catch {
      rejected = true;
      res.writeHead(403).end();
    }
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  assert(address && typeof address === 'object');
  try {
    const result = await boundedProcess(
      resolve(executable),
      codexArgs(directory, `http://127.0.0.1:${address.port}/v1`),
      {
        directory,
        input: 'Synthetic offline isolation fixture. No network model call is permitted.',
        deadlineMs: 30_000,
        env: codexEnvironment(),
      },
    );
    assert(
      !rejected && requests.length === attacks.length + 1,
      'All forced calls must be exercised without tools or credentials.',
    );
    assert(!JSON.stringify(requests).includes(sentinel), 'Canary content reached a model request.');
    assert(!result.stdout.includes(sentinel));
    await assert.rejects(access(writtenFile), 'Forced write must not execute.');
    assert.equal(await readFile(privateFile, 'utf8'), sentinel);
    const report = {
      codexSha256: CODEX_SHA256,
      at: new Date().toISOString(),
      passed: true,
      registeredTools: [],
      forcedCalls: attacks.map((attack) => attack.name),
      requests: requests.length,
      canaryUnchanged: true,
      noCanaryDisclosure: true,
      noWrite: true,
      noAuthSentToFixture: true,
      boundary: 'Pinned local tool registry, not an OS sandbox or arbitrary future Codex versions.',
    };
    await writeFile(join(directory, 'isolation-result.json'), JSON.stringify(report, null, 2));
    return report;
  } finally {
    server.closeAllConnections();
    await new Promise<void>((done) => server.close(() => done()));
  }
}
