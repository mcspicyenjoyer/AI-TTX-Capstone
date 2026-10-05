import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, mock } from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server/app.js';
import { contentHash } from '../src/server/integrity.js';
import { readPackage, checkRunBinding } from '../src/server/exercise-validation.js';
import { technicalPackage } from '../src/server/technical-fixture.js';
import { operationalPackage } from '../src/server/operational-fixture.js';
import { Store } from '../src/server/storage.js';
import {
  ReviewSchema,
  type Approval,
  type ExercisePackage,
  type Review,
} from '../src/contracts/exercise.js';
import { readResponse } from '../src/ui/api.js';

const headers = { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' };
const root = '/api/tracks/technical/runs/technical-check-01';
const operationalRoot = '/api/tracks/operational/runs/operational-dev-01';
let directory: string;
let app: FastifyInstance;
let codes: Record<string, string>;
let cookies: Record<string, string>;

async function login(username: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/session',
    headers,
    payload: { username, accessCode: codes[username] },
  });
  assert.equal(response.statusCode, 200, response.body);
  return `ttx_session=${response.cookies[0]!.value}`;
}

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'ttx-exercise-test-'));
  app = await buildApp({ dataDirectory: directory, publicPort: 3000 });
  codes = {
    ...JSON.parse(readFileSync(join(directory, 'demo-access.json'), 'utf8')),
    ...JSON.parse(readFileSync(join(directory, 'demo-track-access.json'), 'utf8')),
  };
  cookies = {};
  for (const username of Object.keys(codes)) cookies[username] = await login(username);
});
afterEach(async () => {
  await app.close();
  rmSync(directory, { recursive: true, force: true });
});

function query(url: string, payload?: Record<string, unknown>, actor = 'facilitator') {
  return app.inject({
    method: payload === undefined ? 'GET' : 'POST',
    url,
    headers: { ...headers, cookie: cookies[actor] ?? '' },
    ...(payload === undefined ? {} : { payload }),
  });
}
async function review(path = root): Promise<Review> {
  const response = await query(`${path}/review`);
  assert.equal(response.statusCode, 200, response.body);
  return readResponse(ReviewSchema, response.json());
}
async function confirmProfile() {
  const snapshot = (await query('/api/profiles/example-sme-01/revisions/profile-r1')).json();
  const response = await query('/api/profile-confirmations', {
    profileId: 'example-sme-01',
    revisionId: 'profile-r1',
    contentHash: snapshot.contentHash,
    acknowledgeUncertainties: true,
  });
  assert.equal(response.statusCode, 200, response.body);
}
function startInput(view: Review) {
  return {
    expectedRunRevision: view.run.revision,
    idempotencyKey: randomUUID(),
    packageHash: view.packageHash,
    assignmentHash: view.assignmentHash,
    acknowledgeBriefing: true,
    acknowledgeGaps: true,
    acknowledgeSimulation: true,
  };
}
async function start(path = root) {
  await confirmProfile();
  await recordStep0(path);
  const response = await query(`${path}/start`, startInput(await review(path)));
  assert.equal(response.statusCode, 200, response.body);
  return review(path);
}
function step0Input(view: Review, decision = 'ready') {
  return {
    expectedRunRevision: view.run.revision,
    idempotencyKey: randomUUID(),
    packageHash: view.packageHash,
    assignmentHash: view.assignmentHash,
    respondentIds: view.members
      .filter(
        (member) =>
          member.kind === 'participant' &&
          member.roleId &&
          view.package.injects[0]!.recipientRoleIds.includes(member.roleId),
      )
      .map((member) => member.actorId),
    firstContact: 'The incident lead, represented by the synthetic controller.',
    contactRoute: 'Use the synthetic contact card supplied for this check.',
    fallback: 'Ask the controller to represent the alternate route; no real calls.',
    decision,
    rationale: 'Oral answer recorded for the engineering fixture, not verified contactability.',
  };
}
async function recordStep0(path = root, decision = 'ready') {
  const response = await query(`${path}/step0`, step0Input(await review(path), decision));
  assert.equal(response.statusCode, 200, response.body);
  return response.json();
}
function approvalInput(view: Review, recipients = ['demo-participant']) {
  const inject = view.package.injects.find((item) => item.id === view.nextInject!.id)!;
  return {
    expectedRunRevision: view.run.revision,
    idempotencyKey: randomUUID(),
    packageHash: view.packageHash,
    injectId: inject.id,
    injectRevisionId: inject.revisionId,
    contentHash: view.nextInject!.contentHash,
    recipientIds: recipients,
  };
}
async function approve(path = root): Promise<Approval> {
  const response = await query(`${path}/approvals`, approvalInput(await review(path)));
  assert.equal(response.statusCode, 200, response.body);
  return response.json();
}
function releaseInput(approval: Approval) {
  return {
    approvalId: approval.id,
    expectedRunRevision: approval.runRevision,
    idempotencyKey: randomUUID(),
  };
}
function database<T>(operation: (db: DatabaseSync) => T): T {
  const db = new DatabaseSync(join(directory, 'ttx.sqlite'));
  try {
    return operation(db);
  } finally {
    db.close();
  }
}
function editPackage(edit: (definition: ExercisePackage) => void, updateHash = true) {
  database((db) => {
    const value: ExercisePackage = JSON.parse(
      String(
        db.prepare('SELECT payload FROM exercise_packages WHERE id = ?').get(technicalPackage.id)!
          .payload,
      ),
    );
    edit(value);
    const payload = JSON.stringify(value);
    if (updateHash)
      db.prepare('UPDATE exercise_packages SET payload = ?, content_hash = ? WHERE id = ?').run(
        payload,
        contentHash(payload),
        value.id,
      );
    else db.prepare('UPDATE exercise_packages SET payload = ? WHERE id = ?').run(payload, value.id);
  });
}

test('owned package contracts reject unknown tracks, real data, invalid roles and mismatched bindings', async () => {
  assert.deepEqual(readPackage(technicalPackage), technicalPackage);
  assert.deepEqual(readPackage(operationalPackage), operationalPackage);
  for (const value of [
    { ...technicalPackage, track: 'mixed' },
    { ...technicalPackage, synthetic: false },
    { ...technicalPackage, extra: 'not allowed' },
    { ...operationalPackage, injects: technicalPackage.injects },
    { ...technicalPackage, roles: [technicalPackage.roles[0], technicalPackage.roles[0]] },
  ])
    assert.throws(() => readPackage(value));
  const missingRole = structuredClone(technicalPackage);
  missingRole.injects[0]!.recipientRoleIds = ['missing-role'];
  assert.throws(() => readPackage(missingRole), /Unknown recipient/);
  const view = await review();
  assert.throws(
    () => checkRunBinding({ ...view.run, track: 'operational' }, technicalPackage, view.members),
    /binding mismatch/,
  );
  assert.throws(
    () => checkRunBinding(view.run, technicalPackage, [{ ...view.members[0]!, roleId: 'missing' }]),
    /membership/,
  );
  assert.equal((await query('/api/tracks/mixed/runs')).statusCode, 400);
});

test('operational developer has a real isolated read path, no technical review authority and no fake play', async () => {
  const list = await query('/api/tracks/operational/runs', undefined, 'operational');
  assert.equal(list.statusCode, 200);
  assert.equal(list.json()[0].id, 'operational-dev-01');
  const response = await query(`${operationalRoot}/review`, undefined, 'operational');
  const view = readResponse(ReviewSchema, response.json());
  assert.equal(view.package.kind, 'development-skeleton');
  assert.deepEqual(view.package.injects, []);
  assert.ok(!response.body.includes('PRIVATE CONTROL NOTE'));
  assert.equal((await query(`${root}/review`, undefined, 'operational')).statusCode, 403);
  assert.deepEqual((await query('/api/profiles', undefined, 'operational')).json(), []);
  assert.equal(
    (await query('/api/profiles/example-sme-01/revisions/profile-r1', undefined, 'operational'))
      .statusCode,
    403,
  );
  assert.equal(
    (await query(`${operationalRoot}/start`, startInput(view), 'operational')).statusCode,
    409,
  );
  assert.deepEqual(
    (await query(`${operationalRoot}/activity`, undefined, 'operational')).json(),
    [],
  );
  assert.equal((await query(`${operationalRoot}/review`)).statusCode, 403);
  assert.equal(
    (await query('/api/tracks/operational/runs/technical-check-01/review')).statusCode,
    404,
  );
});

test('participants receive only their briefing and no future inject, other role or private evidence', async () => {
  for (const actor of ['participant', 'observer']) {
    const context = await query(`${root}/briefing`, undefined, actor);
    assert.equal(context.statusCode, 200);
    for (const secret of [
      'facilitatorNotes',
      'PRIVATE CONTROL NOTE',
      'File access report',
      'recipientIds',
      'profileHash',
      'preparation.gaps',
    ])
      assert.ok(!context.body.includes(secret));
    assert.equal(context.json().role.id, actor === 'participant' ? 'it-coordinator' : 'observer');
    assert.deepEqual((await query(`${root}/inbox`, undefined, actor)).json(), []);
    assert.equal((await query(`${root}/review`, undefined, actor)).statusCode, 403);
    assert.equal((await query(`${root}/activity`, undefined, actor)).statusCode, 403);
  }
  const anonymous = await app.inject({
    url: `${root}/review`,
    headers: { ...headers, 'x-role': 'facilitator', 'x-actor-id': 'demo-facilitator' },
  });
  assert.equal(anonymous.statusCode, 401);
});

test('Step 0 requires confirmed exact profile, current assignments and explicit acknowledgements', async () => {
  let view = await review();
  assert.equal((await query(`${root}/start`, startInput(view))).statusCode, 409);
  await confirmProfile();
  assert.equal((await query(`${root}/start`, startInput(view))).statusCode, 409);
  assert.deepEqual((await query(`${root}/activity`)).json(), []);
  await recordStep0();
  view = await review();
  for (const changes of [{ packageHash: '0'.repeat(64) }, { assignmentHash: '0'.repeat(64) }])
    assert.equal(
      (await query(`${root}/start`, { ...startInput(view), ...changes })).statusCode,
      409,
    );
  for (const changes of [
    { acknowledgeBriefing: false },
    { acknowledgeGaps: 'true' },
    { acknowledgeSimulation: false },
    { actorId: 'demo-facilitator' },
  ])
    assert.equal(
      (await query(`${root}/start`, { ...startInput(view), ...changes })).statusCode,
      400,
    );
  const input = startInput(view);
  const response = await query(`${root}/start`, input);
  assert.equal(response.statusCode, 200);
  assert.deepEqual((await query(`${root}/start`, input)).json(), response.json());
  view = await review();
  assert.equal(view.run.state, 'active');
  assert.equal(view.preparation!.assignmentHash, view.assignmentHash);
  assert.equal((await query(`${root}/activity`)).json().length, 2);
  const profile = (await query('/api/profiles/example-sme-01/revisions/profile-r1')).json().profile;
  assert.ok(
    profile.statements.some(
      (item: { status: string; value: unknown }) =>
        item.status === 'unknown' && item.value === null,
    ),
  );
});

test('preparation holds and missing role assignments cannot become ready by acknowledgement', async () => {
  await confirmProfile();
  editPackage((definition) => {
    definition.briefing.gaps[0]!.disposition = 'hold';
  });
  await recordStep0();
  assert.equal((await query(`${root}/start`, startInput(await review()))).statusCode, 409);
  editPackage((definition) => {
    definition.briefing.gaps[0]!.disposition = 'exercise-assumption';
  });
  database((db) => db.prepare("DELETE FROM run_members WHERE actor_id = 'demo-observer'").run());
  await recordStep0();
  assert.equal((await query(`${root}/start`, startInput(await review()))).statusCode, 409);
  assert.equal((await review()).preparation, null);
});

test('all write operations enforce membership, roles, origin and strict request contracts', async () => {
  const view = await start();
  const commands = [
    ['step0', step0Input(view)],
    ['start', startInput(view)],
    ['pause', { expectedRunRevision: view.run.revision, idempotencyKey: randomUUID() }],
    ['resume', { expectedRunRevision: view.run.revision, idempotencyKey: randomUUID() }],
    ['approvals', approvalInput(view)],
    [
      'releases',
      {
        expectedRunRevision: view.run.revision,
        idempotencyKey: randomUUID(),
        approvalId: 'not-approved',
      },
    ],
  ] as const;
  for (const [path, payload] of commands) {
    assert.equal((await query(`${root}/${path}`, payload, 'participant')).statusCode, 403);
    assert.equal((await query(`${root}/${path}`, payload, 'operational')).statusCode, 403);
    const foreign = await app.inject({
      method: 'POST',
      url: `${root}/${path}`,
      headers: { ...headers, cookie: cookies.facilitator, origin: 'https://elsewhere.invalid' },
      payload,
    });
    assert.equal(foreign.statusCode, 403);
  }
  for (const changes of [
    { expectedRunRevision: '2' },
    { recipientIds: ['demo-participant', 'demo-participant'] },
    { actorId: 'demo-facilitator' },
  ])
    assert.equal(
      (await query(`${root}/approvals`, { ...approvalInput(view), ...changes })).statusCode,
      400,
    );
  assert.equal((await review()).approval, null);
});

test('release rejects missing approval, stale content, invalid recipients and changed release payloads', async () => {
  const view = await start();
  assert.equal(
    (
      await query(`${root}/releases`, {
        expectedRunRevision: view.run.revision,
        idempotencyKey: randomUUID(),
        approvalId: 'missing',
      })
    ).statusCode,
    409,
  );
  for (const changes of [
    { contentHash: '0'.repeat(64) },
    { injectRevisionId: 'old-revision' },
    { expectedRunRevision: 1 },
    { injectId: 'future-inject' },
  ])
    assert.equal(
      (await query(`${root}/approvals`, { ...approvalInput(view), ...changes })).statusCode,
      409,
    );
  for (const recipient of [
    'demo-observer',
    'demo-facilitator',
    'demo-operational',
    'missing-person',
  ])
    assert.equal(
      (await query(`${root}/approvals`, approvalInput(view, [recipient]))).statusCode,
      400,
    );
  const approval = await approve();
  assert.equal(
    (
      await query(`${root}/releases`, {
        ...releaseInput(approval),
        recipientIds: ['demo-observer'],
      })
    ).statusCode,
    400,
  );
  assert.deepEqual((await query(`${root}/inbox`, undefined, 'participant')).json(), []);
});

test('approval and release retries are atomic, durable receipts rather than duplicate delivery', async () => {
  const view = await start();
  const input = approvalInput(view);
  const approvals = await Promise.all([
    query(`${root}/approvals`, input),
    query(`${root}/approvals`, input),
  ]);
  assert.ok(approvals.every((response) => response.statusCode === 200));
  assert.deepEqual(approvals[0]!.json(), approvals[1]!.json());
  const release = releaseInput(approvals[0]!.json());
  const results = await Promise.all([
    query(`${root}/releases`, release),
    query(`${root}/releases`, release),
  ]);
  assert.ok(results.every((response) => response.statusCode === 200));
  assert.deepEqual(results[0]!.json(), results[1]!.json());
  assert.equal(
    (await query(`${root}/releases`, { ...release, approvalId: 'changed' })).statusCode,
    409,
  );
  assert.equal(
    (await query(`${root}/releases`, { ...release, idempotencyKey: randomUUID() })).statusCode,
    409,
  );
  const inbox = await query(`${root}/inbox`, undefined, 'participant');
  assert.equal(inbox.json().length, 1);
  assert.equal(inbox.json()[0].title, 'File access report');
  for (const forbidden of [
    'PRIVATE CONTROL NOTE',
    'facilitatorNotes',
    'recipientIds',
    'approvalId',
    'contentHash',
    codes.facilitator!,
  ])
    assert.ok(!inbox.body.includes(forbidden));
  assert.deepEqual((await query(`${root}/inbox`, undefined, 'observer')).json(), []);
  const events = (await query(`${root}/activity`)).json();
  assert.deepEqual(
    events.map((event: { kind: string }) => event.kind),
    ['step0-recorded', 'briefing-confirmed', 'inject-approved', 'inject-released'],
  );
  database((db) => {
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM inject_releases').get()!.count, 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM release_recipients').get()!.count, 1);
  });
});

test('new recipient approval supersedes the old revision and delivers only the approved set', async () => {
  editPackage((definition) => {
    definition.injects[0]!.recipientRoleIds.push('observer');
  });
  await start();
  const old = await approve();
  const response = await query(
    `${root}/approvals`,
    approvalInput(await review(), ['demo-observer']),
  );
  assert.equal(response.statusCode, 200);
  const next: Approval = response.json();
  assert.equal(
    (
      await query(`${root}/releases`, {
        ...releaseInput(old),
        expectedRunRevision: next.runRevision,
      })
    ).statusCode,
    409,
  );
  assert.equal((await query(`${root}/releases`, releaseInput(next))).statusCode, 200);
  assert.deepEqual((await query(`${root}/inbox`, undefined, 'participant')).json(), []);
  assert.equal((await query(`${root}/inbox`, undefined, 'observer')).json().length, 1);
});

test('competing approvals with different keys cannot both win the same expected revision', async () => {
  const view = await start();
  const results = await Promise.all([
    query(`${root}/approvals`, approvalInput(view)),
    query(`${root}/approvals`, approvalInput(view)),
  ]);
  assert.deepEqual(results.map((response) => response.statusCode).sort(), [200, 409]);
  assert.equal((await query(`${root}/activity`)).json().length, 3);
});

test('changed package or membership invalidates preparation and release approval', async () => {
  await start();
  const approval = await approve();
  editPackage((definition) => {
    definition.injects[0]!.body = 'Changed reviewed content';
  });
  assert.equal((await review()).step0Ready, false);
  assert.equal((await query(`${root}/releases`, releaseInput(approval))).statusCode, 409);
  database((db) => {
    const payload = JSON.stringify(technicalPackage);
    db.prepare('UPDATE exercise_packages SET payload = ?, content_hash = ? WHERE id = ?').run(
      payload,
      contentHash(payload),
      technicalPackage.id,
    );
    db.prepare(
      "UPDATE run_members SET role_id = 'observer' WHERE actor_id = 'demo-participant'",
    ).run();
  });
  assert.equal((await review()).step0Ready, false);
  assert.equal((await query(`${root}/releases`, releaseInput(approval))).statusCode, 409);
  assert.deepEqual((await query(`${root}/inbox`, undefined, 'participant')).json(), []);
});

test('stored package corruption fails closed without exposing altered text', async () => {
  editPackage((definition) => {
    definition.title = 'CORRUPTED PRIVATE PAYLOAD';
  }, false);
  const response = await query(`${root}/review`);
  assert.equal(response.statusCode, 500);
  assert.ok(!response.body.includes('CORRUPTED PRIVATE PAYLOAD'));
  assert.equal((await query(`${root}/briefing`, undefined, 'participant')).statusCode, 500);
});

test('paused and completed states reject releases; resume requires renewed approval', async () => {
  await start();
  const old = await approve();
  const paused = await query(`${root}/pause`, {
    expectedRunRevision: old.runRevision,
    idempotencyKey: randomUUID(),
  });
  assert.equal(paused.statusCode, 200);
  assert.equal(
    (
      await query(`${root}/releases`, {
        ...releaseInput(old),
        expectedRunRevision: paused.json().revision,
      })
    ).statusCode,
    409,
  );
  const resumed = await query(`${root}/resume`, {
    expectedRunRevision: paused.json().revision,
    idempotencyKey: randomUUID(),
  });
  assert.equal(resumed.statusCode, 200);
  assert.equal(
    (
      await query(`${root}/releases`, {
        ...releaseInput(old),
        expectedRunRevision: resumed.json().revision,
      })
    ).statusCode,
    409,
  );
  const current = await approve();
  database((db) =>
    db.exec("UPDATE exercise_runs SET state = 'completed' WHERE id = 'technical-check-01'"),
  );
  const response = await query(`${root}/releases`, releaseInput(current));
  assert.equal(response.statusCode, 409);
  assert.match(response.json().error.message, /active exercise/);
});

test('a release activity failure rolls back the receipt, inbox, command and revision together', async () => {
  await start();
  const approval = await approve();
  const input = releaseInput(approval);
  database((db) =>
    db.exec(
      "CREATE TRIGGER fail_release BEFORE INSERT ON run_activity WHEN NEW.kind = 'inject-released' BEGIN SELECT RAISE(FAIL, 'test failure'); END",
    ),
  );
  const failed = await query(`${root}/releases`, input);
  assert.equal(failed.statusCode, 500);
  assert.ok(!failed.body.includes('test failure'));
  const view = await review();
  assert.equal(view.run.revision, approval.runRevision);
  assert.deepEqual(view.releases, []);
  database((db) => {
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM release_recipients').get()!.count, 0);
    assert.equal(
      db
        .prepare('SELECT COUNT(*) AS count FROM run_commands WHERE key = ?')
        .get(input.idempotencyKey)!.count,
      0,
    );
    db.exec('DROP TRIGGER fail_release');
  });
  assert.equal((await query(`${root}/releases`, input)).statusCode, 200);
});

test('restart retains test-entered release and briefing, invalidates sessions and pauses without re-delivery', async () => {
  await start();
  const approval = await approve();
  const input = releaseInput(approval);
  const released = (await query(`${root}/releases`, input)).json();
  const before = await review();
  await app.close();
  app = await buildApp({ dataDirectory: directory, publicPort: 3000 });
  assert.equal((await query(`${root}/review`)).statusCode, 401);
  for (const username of Object.keys(codes)) cookies[username] = await login(username);
  const restored = await review();
  assert.equal(restored.run.state, 'paused');
  assert.deepEqual(restored.preparation, before.preparation);
  assert.deepEqual(restored.step0Checks, before.step0Checks);
  assert.deepEqual(restored.releases, [released]);
  assert.deepEqual((await query(`${root}/releases`, input)).json(), released);
  assert.equal((await query(`${root}/inbox`, undefined, 'participant')).json().length, 1);
  const events = (await query(`${root}/activity`)).json();
  assert.equal(events.at(-1).kind, 'run-recovered');
  assert.equal(events.at(-1).actorId, null);
  assert.equal(events.length, 5);
});

test('pending approval cannot release after restart or resume without renewed exact approval', async () => {
  await start();
  const old = await approve();
  await app.close();
  app = await buildApp({ dataDirectory: directory, publicPort: 3000 });
  cookies.facilitator = await login('facilitator');
  let view = await review();
  assert.equal(view.run.state, 'paused');
  assert.equal(view.approval, null);
  assert.equal(
    (
      await query(`${root}/releases`, {
        ...releaseInput(old),
        expectedRunRevision: view.run.revision,
      })
    ).statusCode,
    409,
  );
  assert.equal(
    (
      await query(`${root}/resume`, {
        expectedRunRevision: view.run.revision,
        idempotencyKey: randomUUID(),
      })
    ).statusCode,
    200,
  );
  view = await review();
  assert.equal(
    (
      await query(`${root}/releases`, {
        ...releaseInput(old),
        expectedRunRevision: view.run.revision,
      })
    ).statusCode,
    409,
  );
  assert.equal((await query(`${root}/releases`, releaseInput(await approve()))).statusCode, 200);
});

test('an approval for another run cannot be borrowed even by the same facilitator', async () => {
  const view = await start();
  const first = await approve();
  const store = new Store(join(directory, 'ttx.sqlite'));
  try {
    store.transaction(() => store.exercises.seedRun('other-check', technicalPackage, view.members));
  } finally {
    store.close();
  }
  const other = '/api/tracks/technical/runs/other-check';
  const otherView = await start(other);
  assert.equal(
    (
      await query(`${other}/releases`, {
        ...releaseInput(first),
        expectedRunRevision: otherView.run.revision,
      })
    ).statusCode,
    409,
  );
  assert.deepEqual((await review(other)).releases, []);
});

test('the shared release sequence supports five and ten entries without a global one- or five-slot limit', async () => {
  for (const length of [5, 10]) {
    const definition = structuredClone(technicalPackage);
    definition.id = `sequence-${length}`;
    definition.injects = Array.from({ length }, (_, index) => ({
      ...definition.injects[0]!,
      id: `inject-${index + 1}`,
      title: `Synthetic contract entry ${index + 1}`,
    }));
    const store = new Store(join(directory, 'ttx.sqlite'));
    const members = (await review()).members;
    try {
      store.transaction(() => {
        store.exercises.seedPackage(definition);
        store.exercises.seedRun(`sequence-${length}`, definition, members);
      });
    } finally {
      store.close();
    }
    const path = `/api/tracks/technical/runs/sequence-${length}`;
    await start(path);
    for (let index = 0; index < length; index++) {
      assert.equal((await review(path)).nextInject!.id, `inject-${index + 1}`);
      assert.equal(
        (await query(`${path}/releases`, releaseInput(await approve(path)))).statusCode,
        200,
      );
    }
    const end = await review(path);
    assert.equal(end.nextInject, null);
    assert.equal(end.releases.length, length);
    assert.equal((await query(`${path}/inbox`, undefined, 'participant')).json().length, length);
  }
});

test('additive v1 migration preserves saved profiles, confirmations and original credentials', async () => {
  await confirmProfile();
  const profile = (await query('/api/profiles/example-sme-01/revisions/profile-r1')).json();
  const originalCodes = readFileSync(join(directory, 'demo-access.json'), 'utf8');
  await app.close();
  // Reconstruct the previous schema in this disposable test DB, never demonstration data.
  database((db) =>
    db.exec(`
    DROP TABLE step0_checks; DROP TABLE release_recipients; DROP TABLE inject_releases; DROP TABLE inject_approvals;
    DROP TABLE run_commands; DROP TABLE run_activity; DROP TABLE run_preparations;
    DROP TABLE run_members; DROP TABLE exercise_runs; DROP TABLE exercise_packages;
    DELETE FROM actors WHERE username IN ('observer','operational'); PRAGMA user_version = 1;
  `),
  );
  unlinkSync(join(directory, 'demo-track-access.json'));
  app = await buildApp({ dataDirectory: directory, publicPort: 3000 });
  cookies.facilitator = await login('facilitator');
  assert.deepEqual(
    (await query('/api/profiles/example-sme-01/revisions/profile-r1')).json(),
    profile,
  );
  assert.equal(readFileSync(join(directory, 'demo-access.json'), 'utf8'), originalCodes);
  assert.equal((await review()).run.state, 'draft');
  database((db) => assert.equal(db.prepare('PRAGMA user_version').get()!.user_version, 3));
});

test('startup does not overwrite package content or restore revoked exercise membership', async () => {
  const warning = mock.method(console, 'warn', () => {});
  editPackage((definition) => {
    definition.title = 'Saved local fixture title';
  });
  database((db) => db.prepare("DELETE FROM run_members WHERE actor_id = 'demo-observer'").run());
  await app.close();
  app = await buildApp({ dataDirectory: directory, publicPort: 3000 });
  cookies.facilitator = await login('facilitator');
  cookies.observer = await login('observer');
  assert.equal((await review()).package.title, 'Saved local fixture title');
  assert.equal((await query(`${root}/inbox`, undefined, 'observer')).statusCode, 403);
  assert.equal(warning.mock.calls.length, 1);
  assert.match(
    String(warning.mock.calls[0]!.arguments[0]),
    /Fixture revision conflict: technical-delivery-check\/package-r1/,
  );
  assert.ok(!String(warning.mock.calls[0]!.arguments[0]).includes('Saved local fixture title'));
  warning.mock.restore();
});

test('Step 0 records evidence before revealing the prepared answer and preserves clarification history', async () => {
  await confirmProfile();
  let view = await review();
  const before = await query(`${root}/briefing`, undefined, 'participant');
  assert.equal(before.json().step0Status, 'pending');
  assert.ok(!before.body.includes('same controller as the simulated alternative channel'));
  assert.ok(!before.body.includes(technicalPackage.roles[0]!.briefing));
  assert.equal((await query(`${root}/start`, startInput(view))).statusCode, 409);
  for (const decision of ['clarification-required', 'hold']) {
    await recordStep0(root, decision);
    view = await review();
    assert.equal(view.step0Ready, false);
    assert.equal((await query(`${root}/start`, startInput(view))).statusCode, 409);
    assert.equal(
      (await query(`${root}/briefing`, undefined, 'participant')).json().step0Status,
      decision,
    );
  }
  await recordStep0();
  view = await review();
  assert.equal(view.step0Ready, true);
  assert.deepEqual(
    view.step0Checks.map((check) => check.decision),
    ['clarification-required', 'hold', 'ready'],
  );
  const after = await query(`${root}/briefing`, undefined, 'participant');
  assert.equal(after.json().common, technicalPackage.briefing.common);
  assert.equal(after.json().role.briefing, technicalPackage.roles[0]!.briefing);
  for (const privateValue of [
    'respondentIds',
    'rationale',
    'step0Checks',
    view.step0Checks[0]!.rationale,
  ])
    assert.ok(!after.body.includes(privateValue));
  assert.equal((await query(`${root}/start`, startInput(view))).statusCode, 200);
});

test('Step 0 validates evidence, respondents, exact context and idempotency rather than trusting a checkbox', async () => {
  await confirmProfile();
  const view = await review();
  for (const change of [
    { firstContact: '   ' },
    { contactRoute: '' },
    { fallback: '' },
    { rationale: '' },
    { decision: 'passed-ctm' },
    { respondentIds: [] },
    { respondentIds: ['demo-facilitator'] },
    { respondentIds: ['demo-observer'] },
    { respondentIds: ['missing'] },
    { respondentIds: ['demo-participant', 'demo-participant'] },
    { actorId: 'forged' },
  ])
    assert.equal(
      (await query(`${root}/step0`, { ...step0Input(view), ...change })).statusCode,
      400,
    );
  for (const change of [
    { packageHash: '0'.repeat(64) },
    { assignmentHash: '0'.repeat(64) },
    { expectedRunRevision: 99 },
  ])
    assert.equal(
      (await query(`${root}/step0`, { ...step0Input(view), ...change })).statusCode,
      409,
    );
  const input = step0Input(view);
  const saved = await query(`${root}/step0`, input);
  assert.equal(saved.statusCode, 200);
  assert.deepEqual((await query(`${root}/step0`, input)).json(), saved.json());
  assert.equal(
    (await query(`${root}/step0`, { ...input, firstContact: 'Changed answer' })).statusCode,
    409,
  );
  assert.equal((await review()).step0Checks.length, 1);
  assert.equal((await query(`${root}/activity`)).json().length, 1);
});

test('a Step 0 activity failure rolls back evidence, command and run revision', async () => {
  await confirmProfile();
  const before = await review();
  const input = step0Input(before);
  database((db) =>
    db.exec(
      "CREATE TRIGGER fail_step0 BEFORE INSERT ON run_activity WHEN NEW.kind = 'step0-recorded' BEGIN SELECT RAISE(FAIL, 'test failure'); END",
    ),
  );
  assert.equal((await query(`${root}/step0`, input)).statusCode, 500);
  assert.deepEqual(await review(), before);
  database((db) => {
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM run_commands').get()!.count, 0);
    db.exec('DROP TRIGGER fail_step0');
  });
  assert.equal((await query(`${root}/step0`, input)).statusCode, 200);
});

test('a later Step 0 hold blocks resume; correction preserves history and needs new release approval', async () => {
  await start();
  const approval = await approve();
  const active = await review();
  assert.equal((await query(`${root}/step0`, step0Input(active, 'hold'))).statusCode, 409);
  assert.equal(
    (
      await query(`${root}/pause`, {
        expectedRunRevision: active.run.revision,
        idempotencyKey: randomUUID(),
      })
    ).statusCode,
    200,
  );
  await recordStep0(root, 'hold');
  let view = await review();
  assert.equal(
    (
      await query(`${root}/resume`, {
        expectedRunRevision: view.run.revision,
        idempotencyKey: randomUUID(),
      })
    ).statusCode,
    409,
  );
  await recordStep0();
  view = await review();
  assert.equal(
    (
      await query(`${root}/resume`, {
        expectedRunRevision: view.run.revision,
        idempotencyKey: randomUUID(),
      })
    ).statusCode,
    200,
  );
  assert.equal(
    (
      await query(`${root}/releases`, {
        ...releaseInput(approval),
        expectedRunRevision: (await review()).run.revision,
      })
    ).statusCode,
    409,
  );
  assert.equal((await review()).step0Checks.length, 3);
  assert.equal((await query(`${root}/releases`, releaseInput(await approve()))).statusCode, 200);
});

test('v2 migration preserves records but never invents Step 0 evidence for an old active run', async () => {
  await start();
  const approval = await approve();
  const released = (await query(`${root}/releases`, releaseInput(approval))).json();
  const preparation = (await review()).preparation;
  await app.close();
  database((db) =>
    db.exec(
      "DROP TABLE step0_checks; DELETE FROM run_activity WHERE kind = 'step0-recorded'; DELETE FROM run_commands; PRAGMA user_version = 2;",
    ),
  );
  app = await buildApp({ dataDirectory: directory, publicPort: 3000 });
  cookies.facilitator = await login('facilitator');
  let view = await review();
  assert.equal(view.run.state, 'paused');
  assert.deepEqual(view.releases, [released]);
  assert.deepEqual(view.preparation, preparation);
  assert.deepEqual(view.step0Checks, []);
  assert.equal(view.step0Ready, false);
  assert.equal(
    (
      await query(`${root}/resume`, {
        expectedRunRevision: view.run.revision,
        idempotencyKey: randomUUID(),
      })
    ).statusCode,
    409,
  );
  assert.equal(
    (
      await query(`${root}/releases`, {
        ...releaseInput(approval),
        expectedRunRevision: view.run.revision,
      })
    ).statusCode,
    409,
  );
  await recordStep0();
  view = await review();
  assert.equal(
    (
      await query(`${root}/resume`, {
        expectedRunRevision: view.run.revision,
        idempotencyKey: randomUUID(),
      })
    ).statusCode,
    200,
  );
  assert.deepEqual((await review()).releases, [released]);
  database((db) => assert.equal(db.prepare('PRAGMA user_version').get()!.user_version, 3));
});
