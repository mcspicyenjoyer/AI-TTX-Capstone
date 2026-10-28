import { createInterface } from 'node:readline';
import { join } from 'node:path';
import { Store } from './storage.js';
import { AarService } from './aar-service.js';
import { readConfig } from './config.js';

const config = readConfig();
if (!config.subscriptionEnabled) throw new Error('Subscription AAR is disabled.');
const store = new Store(join(config.dataDirectory, 'ttx.sqlite'));
const service = new AarService(store, true);
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
      let result: unknown;
      if (request.method === 'claim' && Object.keys(request).length === 1) result = service.claim();
      else if (request.method === 'complete' && Object.keys(request).length === 2)
        result = service.complete(request.value);
      else throw new Error('Unknown operation.');
      process.stdout.write(JSON.stringify({ result }) + '\n');
    } catch {
      process.stdout.write(JSON.stringify({ error: 'Worker operation rejected.' }) + '\n');
    }
  }
} finally {
  store.close();
}
