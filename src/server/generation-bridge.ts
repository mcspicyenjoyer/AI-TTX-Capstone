import { createInterface } from 'node:readline';
import { join } from 'node:path';
import { Store } from './storage.js';
import { GenerationService } from './generation-service.js';
import { readPackageTarget } from './generation-setup.js';
import { readConfig } from './config.js';

// Operator-only stdio, using the existing local subscription-worker transport.
const config = readConfig();
if (!config.subscriptionEnabled) throw new Error('Subscription generation is disabled.');
const store = new Store(join(config.dataDirectory, 'ttx.sqlite'));
const service = new GenerationService(store, readPackageTarget(config.dataDirectory), true);
const lines = createInterface({ input: process.stdin });
let bytes = 0;
process.stdin.on('data', (chunk: Buffer) => {
  bytes += chunk.length;
  if (bytes > 750_000) process.exit(1);
});
try {
  for await (const line of lines) {
    bytes = 0;
    try {
      if (Buffer.byteLength(line) > 700_000) throw new Error('Input too large.');
      const request = JSON.parse(line);
      const result =
        request.method === 'claim' && Object.keys(request).length === 1
          ? service.claim()
          : request.method === 'complete' && Object.keys(request).length === 2
            ? service.complete(request.value)
            : (() => {
                throw new Error('Unknown operation.');
              })();
      process.stdout.write(`${JSON.stringify({ result })}\n`);
    } catch {
      process.stdout.write(`${JSON.stringify({ error: 'Worker operation rejected.' })}\n`);
    }
  }
} finally {
  store.close();
}
