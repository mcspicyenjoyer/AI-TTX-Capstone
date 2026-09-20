import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server/app.js';
import { syntheticProfile } from '../src/server/fixture.js';
import { readProfile } from '../src/server/validation.js';
import { ProfileService } from '../src/server/profile-service.js';
import { Store } from '../src/server/storage.js';
import { Sessions } from '../src/server/access.js';
import { prepareDataDirectory, readConfig } from '../src/server/config.js';
import { ProfileViewSchema, type ProfileView } from '../src/contracts/profile.js';
import { readResponse } from '../src/ui/api.js';

const directory = mkdtempSync(join(tmpdir(), 'ttx-api-test-'));
const origin = 'http://127.0.0.1:3000';
const headers = { host: '127.0.0.1:3000', origin };
let app: FastifyInstance;
let facilitator: string;
let participant: string;
let snapshot: ProfileView;
let codes: { facilitator: string; participant: string };
const profilePath = '/api/profiles/example-sme-01/revisions/profile-r1';
const body = () => ({
  profileId: snapshot.profile.profileId,
  revisionId: snapshot.profile.revisionId,
  contentHash: snapshot.contentHash,
  acknowledgeUncertainties: true,
});

async function login(username: 'facilitator' | 'participant') {
  const response = await app.inject({
    method: 'POST',
    url: '/api/session',
    headers,
    payload: { username, accessCode: codes[username] },
  });
  assert.equal(response.statusCode, 200);
  assert.match(String(response.headers['set-cookie']), /HttpOnly/);
  assert.match(String(response.headers['set-cookie']), /SameSite=Strict/i);
  const cookie = response.cookies[0];
  assert.ok(cookie);
  return `ttx_session=${cookie.value}`;
}

before(async () => {
  app = await buildApp({ dataDirectory: directory, publicPort: 3000 });
  codes = JSON.parse(readFileSync(join(directory, 'demo-access.json'), 'utf8'));
  facilitator = await login('facilitator');
  participant = await login('participant');
  snapshot = (
    await app.inject({ url: profilePath, headers: { ...headers, cookie: facilitator } })
  ).json();
});
after(async () => {
  await app.close();
  rmSync(directory, { recursive: true, force: true });
});

test('synthetic fixture validates with separate facts, assumptions, unknowns, conflicts and source locators', () => {
  const profile = readProfile(structuredClone(syntheticProfile));
  assert.deepEqual(
    new Set(profile.statements.map((item) => item.status)),
    new Set(['fact', 'assumption', 'unknown', 'conflict']),
  );
  assert.ok(profile.sources.every((source) => source.synthetic));
});
test('schema rejects real-data classification, extra keys, missing provenance, fabricated unknown values and bad references', () => {
  for (const mutate of [
    (value: Record<string, unknown>) => {
      value.synthetic = false;
    },
    (value: Record<string, unknown>) => {
      value.secret = 'not-a-profile-field';
    },
  ]) {
    const value = structuredClone(syntheticProfile);
    mutate(value);
    assert.throws(() => readProfile(value));
  }
  const noProvenance = structuredClone(syntheticProfile);
  noProvenance.statements[0]!.evidence = [];
  assert.throws(() => readProfile(noProvenance), /provenance/);
  const unknown = structuredClone(syntheticProfile);
  unknown.statements.find((item) => item.status === 'unknown')!.value = 'invented';
  assert.throws(() => readProfile(unknown), /selected value/);
  const badReference = structuredClone(syntheticProfile);
  badReference.statements[0]!.evidence[0]!.sourceId = 'missing';
  assert.throws(() => readProfile(badReference), /Unknown profile evidence/);
  const duplicate = structuredClone(syntheticProfile);
  duplicate.sources.push(duplicate.sources[0]!);
  assert.throws(() => readProfile(duplicate), /Duplicate/);
});
test('anonymous reads and forged client actor headers never grant review access', async () => {
  for (const url of [profilePath, '/api/profiles', '/api/profiles/example-sme-01/activity']) {
    const response = await app.inject({
      url,
      headers: { ...headers, 'x-role': 'facilitator', 'x-actor-id': 'demo-facilitator' },
    });
    assert.equal(response.statusCode, 401);
    assert.ok(!response.body.includes('Engineering services'));
  }
});
test('participant cannot read profiles, list evidence, inspect activity or confirm through direct API', async () => {
  for (const url of [profilePath, '/api/profiles', '/api/profiles/example-sme-01/activity']) {
    const response = await app.inject({ url, headers: { ...headers, cookie: participant } });
    assert.equal(response.statusCode, 403);
    assert.ok(!response.body.includes('MSSP'));
  }
  const response = await app.inject({
    method: 'POST',
    url: '/api/profile-confirmations',
    headers: { ...headers, cookie: participant },
    payload: body(),
  });
  assert.equal(response.statusCode, 403);
});
test('reviewer sees no access code or stored credential hash in any profile projection', () => {
  assert.equal(snapshot.profile.organisationName, 'Example SME 01');
  assert.equal(snapshot.confirmation, null);
  assert.ok(!JSON.stringify(snapshot).includes(codes.facilitator));
  assert.ok(!JSON.stringify(snapshot).includes('code_hash'));
});

test('interpreted browser validation uses the same strict contract and date-time format', () => {
  assert.deepEqual(readResponse(ProfileViewSchema, snapshot), snapshot);
  assert.throws(() => readResponse(ProfileViewSchema, { ...snapshot, secret: 'extra' }));
  const invalidDate = structuredClone(snapshot);
  invalidDate.profile.createdAt = '2026-02-30T00:00:00Z';
  assert.throws(() => readResponse(ProfileViewSchema, invalidDate));
});
test('facilitator role without profile membership does not grant access', () => {
  const store = new Store(join(directory, 'ttx.sqlite'));
  try {
    assert.throws(
      () =>
        new ProfileService(store).get(
          { id: 'unassigned-reviewer', role: 'facilitator', displayName: 'Other reviewer' },
          'example-sme-01',
          'profile-r1',
        ),
      /cannot review/,
    );
  } finally {
    store.close();
  }
});
test('unknown revision returns not found', async () => {
  const response = await app.inject({
    url: '/api/profiles/example-sme-01/revisions/missing',
    headers: { ...headers, cookie: facilitator },
  });
  assert.equal(response.statusCode, 404);
});
test('DNS-rebinding hosts and missing or cross-site write origins are rejected', async () => {
  assert.equal(
    (
      await app.inject({
        url: '/api/me',
        headers: { host: 'attacker.invalid:3000', cookie: facilitator },
      })
    ).statusCode,
    403,
  );
  for (const origin of [undefined, 'http://attacker.invalid']) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/profile-confirmations',
      headers: { host: headers.host, ...(origin ? { origin } : {}), cookie: facilitator },
      payload: body(),
    });
    assert.equal(response.statusCode, 403);
  }
});
test('bad hash and stale revision reject confirmation without recording activity', async () => {
  for (const input of [
    { ...body(), contentHash: '0'.repeat(64) },
    { ...body(), revisionId: 'old-revision' },
  ]) {
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/profile-confirmations',
          headers: { ...headers, cookie: facilitator },
          payload: input,
        })
      ).statusCode,
      409,
    );
  }
  assert.deepEqual(
    (
      await app.inject({
        url: '/api/profiles/example-sme-01/activity',
        headers: { ...headers, cookie: facilitator },
      })
    ).json(),
    [],
  );
});
test('schema does not coerce, strip authority fields, or accept a missing acknowledgement', async () => {
  for (const payload of [
    { ...body(), actorId: 'demo-facilitator' },
    { ...body(), acknowledgeUncertainties: false },
    { ...body(), acknowledgeUncertainties: 'true' },
    { ...body(), profileId: 1 },
  ]) {
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/profile-confirmations',
          headers: { ...headers, cookie: facilitator },
          payload,
        })
      ).statusCode,
      400,
    );
  }
});
test('confirmation, single activity entry and retry result are durable across a new server instance', async () => {
  const responses = await Promise.all(
    [1, 2].map(() =>
      app.inject({
        method: 'POST',
        url: '/api/profile-confirmations',
        headers: { ...headers, cookie: facilitator },
        payload: body(),
      }),
    ),
  );
  assert.ok(responses.every((response) => response.statusCode === 200));
  const confirmation = responses[0]!.json();
  assert.deepEqual(responses[1]!.json(), confirmation);
  assert.equal(confirmation.confirmedBy.id, 'demo-facilitator');
  await app.close();
  app = await buildApp({ dataDirectory: directory, publicPort: 3000 });
  assert.equal(
    (await app.inject({ url: '/api/me', headers: { ...headers, cookie: facilitator } })).statusCode,
    401,
  );
  facilitator = await login('facilitator');
  const restored: ProfileView = (
    await app.inject({ url: profilePath, headers: { ...headers, cookie: facilitator } })
  ).json();
  assert.deepEqual(restored.confirmation, confirmation);
  assert.deepEqual(restored.profile, snapshot.profile);
  const events = (
    await app.inject({
      url: '/api/profiles/example-sme-01/activity',
      headers: { ...headers, cookie: facilitator },
    })
  ).json();
  assert.equal(events.length, 1);
  assert.equal(events[0].actorName, 'Demo facilitator');
});
test('activity failure rolls back confirmation instead of reporting a partially saved result', async () => {
  const isolated = mkdtempSync(join(tmpdir(), 'ttx-rollback-test-'));
  const server = await buildApp({ dataDirectory: isolated, publicPort: 3000 });
  const access = JSON.parse(readFileSync(join(isolated, 'demo-access.json'), 'utf8')) as {
    facilitator: string;
  };
  const signedIn = await server.inject({
    method: 'POST',
    url: '/api/session',
    headers,
    payload: { username: 'facilitator', accessCode: access.facilitator },
  });
  const cookie = `ttx_session=${signedIn.cookies[0]!.value}`;
  const db = new DatabaseSync(join(isolated, 'ttx.sqlite'));
  try {
    db.exec(
      "CREATE TRIGGER fail_activity BEFORE INSERT ON activity BEGIN SELECT RAISE(FAIL, 'test failure'); END",
    );
    const response = await server.inject({
      method: 'POST',
      url: '/api/profile-confirmations',
      headers: { ...headers, cookie },
      payload: body(),
    });
    assert.equal(response.statusCode, 500);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM confirmations').get()!.count, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM activity').get()!.count, 0);
    assert.ok(!response.body.includes('test failure'));
  } finally {
    db.close();
    await server.close();
    rmSync(isolated, { recursive: true, force: true });
  }
});

test('stored revision integrity failures never return altered profile content', async () => {
  const db = new DatabaseSync(join(directory, 'ttx.sqlite'));
  const original = db.prepare('SELECT payload FROM profile_revisions').get()!.payload;
  db.prepare('UPDATE profile_revisions SET payload = ?').run(
    JSON.stringify({ ...syntheticProfile, organisationName: 'Changed without revision' }),
  );
  try {
    const response = await app.inject({
      url: profilePath,
      headers: { ...headers, cookie: facilitator },
    });
    assert.equal(response.statusCode, 500);
    assert.ok(!response.body.includes('Changed without revision'));
  } finally {
    db.prepare('UPDATE profile_revisions SET payload = ?').run(original!);
    db.close();
  }
});
test('logout invalidates the server session', async () => {
  const token = await login('participant');
  assert.equal(
    (
      await app.inject({
        method: 'DELETE',
        url: '/api/session',
        headers: { ...headers, cookie: token },
      })
    ).statusCode,
    204,
  );
  assert.equal(
    (await app.inject({ url: '/api/me', headers: { ...headers, cookie: token } })).statusCode,
    401,
  );
});
test('session expiry and invalid credentials do not grant access; repeated failures are bounded', () => {
  const store = new Store(join(directory, 'ttx.sqlite'));
  let now = Date.now();
  const sessions = new Sessions(store, () => now);
  try {
    const session = sessions.login('facilitator', codes.facilitator);
    assert.equal(sessions.actor(session.token).role, 'facilitator');
    now += 8 * 60 * 60 * 1000;
    assert.throws(() => sessions.actor(session.token), /Sign in/);
    for (let i = 0; i < 15; i++)
      assert.throws(() => sessions.login('facilitator', 'incorrect'), /incorrect/);
    assert.throws(() => sessions.login('facilitator', codes.facilitator), /Too many/);
  } finally {
    store.close();
  }
});
test('configuration rejects repository data, relative paths, invalid ports, AI and unapproved network bindings', () => {
  assert.throws(() => prepareDataDirectory('runtime-data'), /absolute/);
  assert.throws(() => prepareDataDirectory(join(process.cwd(), 'runtime-data')), /outside/);
  for (const override of [
    { TTX_AI_ENABLED: 'true' },
    { TTX_HOST: '0.0.0.0' },
    { TTX_PORT: 'not-a-port' },
  ]) {
    assert.throws(() => readConfig({ TTX_DATA_DIR: directory, ...override }));
  }
  assert.equal(readConfig({ TTX_DATA_DIR: directory }).host, '127.0.0.1');
});
