import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const directory = process.env.TTX_DATA_DIR;
if (!directory) throw new Error('TTX_DATA_DIR is required.');
// Explicit operator command only; never invoked by the HTTP server or its logs.
for (const filename of ['demo-access.json', 'demo-track-access.json']) {
  const path = join(directory, filename);
  if (!existsSync(path)) continue;
  const codes = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
  for (const [username, code] of Object.entries(codes)) console.log(`${username}: ${code}`);
}
