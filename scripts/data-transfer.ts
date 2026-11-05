// Moves one Compose project's saved exercise data between laptops as a single archive.
// The archive holds the database and the access codes, so it stays outside the repository
// and travels privately (USB drive or a private cloud folder), never through Git.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const usage = `Usage:
  node --import tsx scripts/data-transfer.ts export <compose-project> <output-folder>
  node --import tsx scripts/data-transfer.ts import <compose-project> <archive.tgz> --replace`;

export function insideRepository(path: string, root = repository): boolean {
  const offset = relative(root, resolve(path));
  return offset === '' || (!offset.startsWith('..') && !isAbsolute(offset));
}
export function archiveName(project: string, at = new Date()): string {
  const stamp = at
    .toISOString()
    .replace(/\.\d+Z$/, '')
    .replace(/[-:]/g, '')
    .replace('T', '-');
  return `${project}-data-${stamp}.tgz`;
}
export function projectName(value: string | undefined): string {
  if (!value || !/^[a-z0-9][a-z0-9_-]{0,62}$/.test(value))
    throw new Error('Give the Compose project name, for example ai-ttx-intake-preview.');
  return value;
}

function run(command: string, args: string[], allowFailure = false): string {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0 && !allowFailure)
    throw new Error(`${command} ${args[0]} failed: ${(result.stderr || result.stdout).trim()}`);
  return (result.stdout ?? '').trim();
}
const docker = (...args: string[]) => run('docker', args);
function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}
function commit(): string {
  return run('git', ['-C', repository, 'rev-parse', 'HEAD'], true) || 'unknown';
}

// The project's own app image carries tar and Node, so no other image is downloaded.
function prerequisites(project: string) {
  const volume = `${project}_exercise-data`,
    image = `${project}-app`;
  const exists = (...args: string[]) =>
    spawnSync('docker', args, { stdio: 'ignore', windowsHide: true }).status === 0;
  if (!exists('volume', 'inspect', volume))
    throw new Error(
      `No volume ${volume}. Start the app once with: docker compose -p ${project} up --build -d --wait`,
    );
  if (!exists('image', 'inspect', image))
    throw new Error(`No image ${image}. Build it with: docker compose -p ${project} build`);
  // A copy taken while the app writes could be inconsistent.
  const users = docker('ps', '-q', '--filter', `volume=${volume}`);
  if (users)
    throw new Error(
      `Stop the app first so the data is not changing: docker compose -p ${project} stop`,
    );
  return { volume, image };
}

function exportVolume(project: string, folder: string): string {
  const { volume, image } = prerequisites(project);
  const output = resolve(folder);
  if (insideRepository(output))
    throw new Error('Choose a folder outside the repository; the archive contains access codes.');
  mkdirSync(output, { recursive: true });
  const name = archiveName(project);
  docker(
    ...['run', '--rm', '--network', 'none', '--user', '0:0', '--entrypoint', 'tar'],
    ...['-v', `${volume}:/data:ro`, '-v', `${output}:/backup`, image],
    ...['--numeric-owner', '-czf', `/backup/${name}`, '-C', '/data', '.'],
  );
  const archive = join(output, name);
  const manifest = {
    project,
    createdAt: new Date().toISOString(),
    gitCommit: commit(),
    bytes: statSync(archive).size,
    sha256: sha256(archive),
  };
  writeFileSync(`${archive}.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  return archive;
}

function importVolume(project: string, file: string, replace: boolean): void {
  const archive = resolve(file);
  if (!existsSync(archive) || !archive.endsWith('.tgz'))
    throw new Error('Give the path of an exported .tgz archive.');
  const manifestPath = `${archive}.json`;
  if (!existsSync(manifestPath))
    throw new Error('The archive manifest (.tgz.json) must sit next to the archive.');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.sha256 !== sha256(archive))
    throw new Error('The archive does not match its manifest; copy it again.');
  const { volume, image } = prerequisites(project);
  const contents = docker(
    ...['run', '--rm', '--network', 'none', '--user', '0:0', '--entrypoint', 'ls'],
    ...['-v', `${volume}:/data:ro`, image, '-A', '/data'],
  );
  if (contents && !replace)
    throw new Error(
      `${volume} already holds data. Add --replace; its current data is saved first.`,
    );
  if (contents) {
    const kept = exportVolume(project, dirname(archive));
    console.log(`Current data saved first: ${kept}`);
  }
  docker(
    ...['run', '--rm', '--network', 'none', '--user', '0:0', '--entrypoint', 'sh'],
    ...['-v', `${volume}:/data`, '-v', `${dirname(archive)}:/backup:ro`, image],
    '-c',
    `find /data -mindepth 1 -delete && tar --numeric-owner -xzf "/backup/${basename(archive)}" -C /data && test -f /data/ttx.sqlite`,
  );
  // Opening the database as the app user replays any pending write-ahead log.
  const check = docker(
    ...['run', '--rm', '--network', 'none', '--entrypoint', 'node', '-v', `${volume}:/data`, image],
    '-e',
    "const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('/data/ttx.sqlite');console.log(Object.values(db.prepare('pragma integrity_check').get())[0]);db.close()",
  );
  if (check !== 'ok') throw new Error(`Imported database failed its integrity check: ${check}`);
  if (manifest.gitCommit !== commit())
    console.log(
      `Note: exported from commit ${manifest.gitCommit}; this checkout is ${commit()}. Run the same or a newer commit; older code cannot open a newer database.`,
    );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [action, project, path, flag] = process.argv.slice(2);
  try {
    if (action === 'export' && path)
      console.log(`Exported: ${exportVolume(projectName(project), path)}`);
    else if (action === 'import' && path) {
      importVolume(projectName(project), path, flag === '--replace');
      console.log(
        `Imported into ${project}. Start it with: docker compose -p ${project} up -d --wait`,
      );
    } else throw new Error(usage);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
