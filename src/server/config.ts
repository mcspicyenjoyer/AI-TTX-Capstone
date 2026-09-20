import { mkdirSync, realpathSync, lstatSync, existsSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

export function prepareDataDirectory(directory: string, sourceRoot = process.cwd()): string {
  if (!isAbsolute(directory))
    throw new Error('TTX_DATA_DIR must be an absolute directory outside the repository.');
  const forbidden = [
    sourceRoot,
    process.env.OneDrive,
    process.env.OneDriveCommercial,
    process.env.OneDriveConsumer,
  ].filter((path): path is string => !!path);
  const contained = (candidate: string, root: string) => {
    const path = relative(root, candidate);
    return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
  };
  const verify = (path: string) => {
    if (
      forbidden.some((root) =>
        contained(path, existsSync(root) ? realpathSync(root) : resolve(root)),
      )
    ) {
      throw new Error(
        'Runtime data must stay outside the repository and configured OneDrive locations.',
      );
    }
  };
  verify(resolve(directory));
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const canonical = realpathSync(directory);
  verify(canonical);
  for (const name of ['ttx.sqlite', 'ttx.sqlite-wal', 'ttx.sqlite-shm', 'demo-access.json']) {
    const file = resolve(canonical, name);
    if (existsSync(file) && lstatSync(file).isSymbolicLink())
      throw new Error('Runtime files must not be symbolic links.');
  }
  return canonical;
}

export function readConfig(env = process.env) {
  if (env.TTX_AI_ENABLED && env.TTX_AI_ENABLED !== 'false')
    throw new Error('AI is not implemented in this checkpoint.');
  if (!env.TTX_DATA_DIR)
    throw new Error('Set TTX_DATA_DIR to an approved absolute directory, or use Docker Compose.');
  const port = Number(env.TTX_PORT ?? 3000);
  const publicPort = Number(env.TTX_PUBLIC_PORT ?? port);
  if (![port, publicPort].every((value) => Number.isInteger(value) && value >= 1 && value <= 65535))
    throw new Error('Invalid application port.');
  const host = env.TTX_HOST ?? '127.0.0.1';
  if (host !== '127.0.0.1' && !(env.TTX_CONTAINER === 'true' && host === '0.0.0.0'))
    throw new Error('Only loopback hosting or the explicit Docker binding is supported.');
  return { port, publicPort, host, dataDirectory: prepareDataDirectory(env.TTX_DATA_DIR) };
}
