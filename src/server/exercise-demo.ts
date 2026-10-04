import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Store } from './storage.js';
import { contentHash } from './integrity.js';
import { technicalPackage } from './technical-fixture.js';
import { operationalPackage } from './operational-fixture.js';

export const trackAccessFilename = 'demo-track-access.json';

export function initialiseExercises(store: Store, directory: string): void {
  const path = join(directory, trackAccessFilename);
  if (!existsSync(path)) {
    if (store.loginIdentity('observer') || store.loginIdentity('operational'))
      throw new Error(
        'Track access file is missing. Restore it; existing identities were not replaced.',
      );
    writeFileSync(
      path,
      JSON.stringify({
        observer: randomBytes(24).toString('hex'),
        operational: randomBytes(24).toString('hex'),
      }),
      { flag: 'wx', mode: 0o600 },
    );
  }
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (
    !value ||
    typeof value !== 'object' ||
    !('observer' in value) ||
    !('operational' in value) ||
    Object.keys(value).length !== 2 ||
    typeof value.observer !== 'string' ||
    typeof value.operational !== 'string' ||
    !/^[a-f0-9]{48}$/.test(value.observer) ||
    !/^[a-f0-9]{48}$/.test(value.operational)
  )
    throw new Error('Invalid track access file.');
  const observer = {
    id: 'demo-observer',
    displayName: 'Unaddressed participant',
    role: 'participant' as const,
  };
  const operational = {
    id: 'demo-operational',
    displayName: 'Operational developer',
    role: 'facilitator' as const,
  };
  const observerHash = contentHash(value.observer);
  const operationalHash = contentHash(value.operational);
  store.transaction(() => {
    store.addActor(observer, 'observer', observerHash);
    store.addActor(operational, 'operational', operationalHash);
    store.exercises.seedPackage(technicalPackage);
    store.exercises.seedPackage(operationalPackage);
    store.exercises.seedRun('technical-check-01', technicalPackage, [
      {
        actorId: 'demo-facilitator',
        displayName: 'Demo facilitator',
        kind: 'facilitator',
        roleId: null,
      },
      {
        actorId: 'demo-participant',
        displayName: 'Demo participant',
        kind: 'participant',
        roleId: 'it-coordinator',
      },
      {
        actorId: observer.id,
        displayName: observer.displayName,
        kind: 'participant',
        roleId: 'observer',
      },
    ]);
    store.exercises.seedRun('operational-dev-01', operationalPackage, [
      {
        actorId: operational.id,
        displayName: operational.displayName,
        kind: 'facilitator',
        roleId: null,
      },
    ]);
    store.exercises.recoverActiveRuns();
  });
}
