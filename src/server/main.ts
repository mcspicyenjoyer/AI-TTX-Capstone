import { resolve } from 'node:path';
import { buildApp } from './app.js';
import { readConfig } from './config.js';

process.umask(0o077);
const config = readConfig();
const app = await buildApp({ ...config, staticDirectory: resolve('dist/ui') });
await app.listen({ host: config.host, port: config.port });
console.log(`TTX Platform ready on port ${config.port}. AI disabled. Synthetic data only.`);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().then(() => process.exit(0));
  });
}
