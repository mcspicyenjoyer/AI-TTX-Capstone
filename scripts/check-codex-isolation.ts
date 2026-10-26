import { resolve } from 'node:path';
import { auditCodexBoundary } from '../src/server/codex-isolation.js';
import { prepareDataDirectory } from '../src/server/config.js';

const [executable, root] = process.argv.slice(2);
if (!executable || !root) throw new Error('Provide CODEX_EXE and an external test directory.');
console.log(
  JSON.stringify(await auditCodexBoundary(resolve(executable), prepareDataDirectory(root))),
);
