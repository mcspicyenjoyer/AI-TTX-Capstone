import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { Type } from '@sinclair/typebox';
import { PackageTargetSchema, type PackageTarget } from '../contracts/generation.js';
import { readStored } from './validation.js';
import { Store } from './storage.js';
import { contentHash } from './integrity.js';
import { packagePlayers } from './generation-service.js';
import { roleNames } from './generation-content.js';

export function readPackageTarget(directory: string): PackageTarget | null {
  const path = join(directory, 'package-target.json');
  return existsSync(path)
    ? readStored(PackageTargetSchema, JSON.parse(readFileSync(path, 'utf8')))
    : null;
}

export function initialisePackagePlayers(store: Store, directory: string): void {
  const path = join(directory, 'package-player-access.json');
  const names = packagePlayers.map((player) => player.actorId);
  if (!existsSync(path)) {
    if (names.some((name) => store.loginIdentity(name)))
      throw new Error(
        'Restore the existing package player access file; accounts were not replaced.',
      );
    writeFileSync(
      path,
      JSON.stringify(
        Object.fromEntries(names.map((name) => [name, randomBytes(24).toString('hex')])),
      ),
      { flag: 'wx', mode: 0o600 },
    );
  }
  const schema = Type.Object(
    Object.fromEntries(names.map((name) => [name, Type.String({ pattern: '^[a-f0-9]{48}$' })])),
    { additionalProperties: false },
  );
  const codes = readStored(schema, JSON.parse(readFileSync(path, 'utf8')));
  store.transaction(() => {
    for (const player of packagePlayers)
      store.addActor(
        { id: player.actorId, displayName: roleNames[player.roleId], role: 'participant' },
        player.actorId,
        contentHash(codes[player.actorId]!),
      );
  });
}
