import { resolve } from 'node:path';
import { buildApp } from '../src/server/app.js';
import { prepareDataDirectory } from '../src/server/config.js';
import { Store } from '../src/server/storage.js';
import { generationProfile, generationTarget } from '../tests/generation-fixture.js';
import { join } from 'node:path';

if (!process.env.TTX_DATA_DIR) throw new Error('Browser-test data directory required.');
const port = Number(process.env.TTX_BROWSER_PORT ?? 3001);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Invalid browser-test port.');
const app = await buildApp({
  dataDirectory: prepareDataDirectory(process.env.TTX_DATA_DIR),
  publicPort: port,
  staticDirectory: resolve('dist/ui'),
  subscriptionEnabled: process.env.TTX_BROWSER_SUBSCRIPTION === 'true',
  ...(process.env.TTX_BROWSER_GENERATION === 'true' ? { packageTarget: generationTarget } : {}),
});
if (process.env.TTX_BROWSER_GENERATION === 'true') {
  const store = new Store(join(process.env.TTX_DATA_DIR, 'ttx.sqlite'));
  try {
    store.transaction(() =>
      store.publishIntakeProfile(generationProfile, store.loginIdentity('facilitator')!.actor),
    );
  } finally {
    store.close();
  }
}
await app.listen({ host: '127.0.0.1', port });
for (const signal of ['SIGTERM', 'SIGINT'] as const)
  process.once(signal, () => {
    void app.close().then(() => process.exit(0));
  });
