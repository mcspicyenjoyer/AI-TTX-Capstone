import { auditCodexBoundary } from '../src/server/codex-isolation.js';
import { resolveCodexExecutable } from '../src/server/codex-extraction.js';
import { prepareDataDirectory } from '../src/server/config.js';

const [executable, root] = process.argv.slice(2);
if (!executable || !root)
  throw new Error('Provide CODEX_EXE (or auto) and an external test directory.');
console.log(
  JSON.stringify(
    await auditCodexBoundary(resolveCodexExecutable(executable), prepareDataDirectory(root)),
  ),
);
