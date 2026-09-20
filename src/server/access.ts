import { randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Actor } from '../contracts/profile.js';
import { AppError } from './errors.js';
import { Store, contentHash } from './storage.js';
import { syntheticProfile } from './fixture.js';

type AccessCodes = { facilitator: string; participant: string };
export const accessFilename = 'demo-access.json';

export function initialiseDemo(store: Store, directory: string): void {
  const path = join(directory, accessFilename);
  if (!existsSync(path)) {
    if (store.hasActors())
      throw new Error(
        'Demo access file is missing. Restore it from the data backup; existing identities were not replaced.',
      );
    writeFileSync(
      path,
      JSON.stringify({
        facilitator: randomBytes(24).toString('hex'),
        participant: randomBytes(24).toString('hex'),
      }),
      { flag: 'wx', mode: 0o600 },
    );
  }
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (
    !value ||
    typeof value !== 'object' ||
    !('facilitator' in value) ||
    !('participant' in value) ||
    Object.keys(value).length !== 2 ||
    typeof value.facilitator !== 'string' ||
    !/^[a-f0-9]{48}$/.test(value.facilitator) ||
    typeof value.participant !== 'string' ||
    !/^[a-f0-9]{48}$/.test(value.participant)
  ) {
    throw new Error('Invalid demo access file.');
  }
  const codes = value as AccessCodes;
  store.seed(syntheticProfile, [
    {
      actor: { id: 'demo-facilitator', displayName: 'Demo facilitator', role: 'facilitator' },
      username: 'facilitator',
      codeHash: contentHash(codes.facilitator),
    },
    {
      actor: { id: 'demo-participant', displayName: 'Demo participant', role: 'participant' },
      username: 'participant',
      codeHash: contentHash(codes.participant),
    },
  ]);
}

export class Sessions {
  private readonly sessions = new Map<string, { actor: Actor; expires: number }>();
  private attempts = 0;
  private windowEnds = 0;
  constructor(
    private readonly store: Store,
    private readonly now: () => number = Date.now,
  ) {}

  login(username: string, accessCode: string): { token: string; actor: Actor } {
    const now = this.now();
    if (now >= this.windowEnds) {
      this.attempts = 0;
      this.windowEnds = now + 60_000;
    }
    if (++this.attempts > 15)
      throw new AppError(429, 'RATE_LIMITED', 'Too many sign-in attempts. Try again in a minute.');
    const identity = this.store.loginIdentity(username);
    const expected = Buffer.from(identity?.codeHash ?? '0'.repeat(64), 'hex');
    const actual = Buffer.from(contentHash(accessCode), 'hex');
    if (!timingSafeEqual(expected, actual) || !identity)
      throw new AppError(401, 'INVALID_SIGN_IN', 'The username or access code is incorrect.');
    for (const [key, session] of this.sessions)
      if (session.expires <= now) this.sessions.delete(key);
    if (this.sessions.size >= 100)
      throw new AppError(429, 'SESSION_LIMIT', 'Too many active demo sessions.');
    const token = randomBytes(32).toString('hex');
    this.sessions.set(contentHash(token), {
      actor: identity.actor,
      expires: now + 8 * 60 * 60 * 1000,
    });
    return { token, actor: identity.actor };
  }

  actor(token: string | undefined): Actor {
    const key = contentHash(token ?? '');
    const session = this.sessions.get(key);
    if (!session || session.expires <= this.now()) {
      this.sessions.delete(key);
      throw new AppError(401, 'SIGN_IN_REQUIRED', 'Sign in to continue.');
    }
    return session.actor;
  }

  logout(token: string | undefined): void {
    this.sessions.delete(contentHash(token ?? ''));
  }
}
