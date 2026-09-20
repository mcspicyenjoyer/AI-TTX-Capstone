import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const directory = process.env.TTX_DATA_DIR;
if (!directory) throw new Error('TTX_DATA_DIR is required.');
// Explicit operator command only; never invoked by the HTTP server or its logs.
const codes = JSON.parse(readFileSync(join(directory, 'demo-access.json'), 'utf8')) as Record<
  string,
  string
>;
for (const [username, code] of Object.entries(codes)) console.log(`${username}: ${code}`);
