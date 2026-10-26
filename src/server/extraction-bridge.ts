import { createInterface } from 'node:readline';
import { join } from 'node:path';
import { Store } from './storage.js';
import { ExtractionJobs } from './extraction-jobs.js';
import { readConfig } from './config.js';

// Local operator-only stdio over docker exec, not a network or browser API.
const config = readConfig();
if (!config.subscriptionEnabled) throw new Error('Subscription extraction is disabled.');
const store = new Store(join(config.dataDirectory, 'ttx.sqlite'));
const jobs = new ExtractionJobs(store);
const lines = createInterface({ input: process.stdin });
let bytes = 0;
process.stdin.on('data', (chunk: Buffer) => {
  bytes += chunk.length;
  if (bytes > 750_000) process.exit(1);
});
for await (const line of lines) {
  bytes = 0;
  try {
    if (Buffer.byteLength(line) > 700_000) throw new Error('Input too large.');
    const request = JSON.parse(line);
    const result =
      request.method === 'claim' && Object.keys(request).length === 1
        ? jobs.claim()
        : request.method === 'complete' && Object.keys(request).length === 2
          ? jobs.complete(request.value)
          : (() => {
              throw new Error('Unknown operation.');
            })();
    process.stdout.write(`${JSON.stringify({ result })}\n`);
  } catch {
    process.stdout.write(`${JSON.stringify({ error: 'Worker operation rejected.' })}\n`);
  }
}
store.close();
