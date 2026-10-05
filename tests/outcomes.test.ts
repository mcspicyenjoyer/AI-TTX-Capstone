import assert from 'node:assert/strict';
import { beforeEach, afterEach, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server/app.js';
import { OutcomeReviewSchema, TeamOutcomesSchema } from '../src/contracts/outcomes.js';
import { readResponse } from '../src/ui/api.js';

const root = '/api/tracks/technical/runs/technical-check-01';
const headers = { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' };
let directory: string;
let app: FastifyInstance;
let cookies: Record<string, string>;
let releaseId: string;
let releaseCommand: Record<string, unknown>;
let releaseReceipt: unknown;
async function boot() {
  app = await buildApp({ dataDirectory: directory, publicPort: 3000 });
  const codes = {
    ...JSON.parse(readFileSync(join(directory, 'demo-access.json'), 'utf8')),
    ...JSON.parse(readFileSync(join(directory, 'demo-track-access.json'), 'utf8')),
  };
  cookies = {};
  for (const username of Object.keys(codes)) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/session',
      headers,
      payload: { username, accessCode: codes[username] },
    });
    assert.equal(response.statusCode, 200, response.body);
    cookies[username] = `ttx_session=${response.cookies[0]!.value}`;
  }
}
function query(path: string, payload?: Record<string, unknown>, actor = 'facilitator') {
  return app.inject({
    method: payload ? 'POST' : 'GET',
    url: path,
    headers: { ...headers, cookie: cookies[actor] ?? '' },
    ...(payload ? { payload } : {}),
  });
}
async function view() {
  const response = await query(`${root}/outcomes`);
  assert.equal(response.statusCode, 200, response.body);
  return readResponse(OutcomeReviewSchema, response.json());
}
async function body(extra: Record<string, unknown> = {}) {
  const current = (await query(`${root}/review`)).json();
  return { expectedRunRevision: current.run.revision, idempotencyKey: randomUUID(), ...extra };
}
async function write(action: string, extra: Record<string, unknown> = {}, actor = 'facilitator') {
  return query(`${root}/${action}`, await body(extra), actor);
}
async function ok(action: string, extra: Record<string, unknown> = {}, actor = 'facilitator') {
  const response = await write(action, extra, actor);
  assert.equal(response.statusCode, 200, response.body);
  return response.json();
}
const answer = () => ({
  releaseId,
  previousResponseId: null,
  actions: 'Ask the team to compare scope and notify the controller.',
  rationale: 'Discuss evidence before proposing a change.',
  informationRequests: 'Which other project files are affected?',
});
const assessment = (responseId: string | null) => ({
  releaseId,
  responseId,
  decision: 'reviewed',
  observations: 'PRIVATE OBSERVATION: the agreed response was discussed, not performed.',
  unresolvedGaps: 'The extent remains unknown.',
});
function database<T>(operation: (db: DatabaseSync) => T): T {
  const db = new DatabaseSync(join(directory, 'ttx.sqlite'));
  try {
    return operation(db);
  } finally {
    db.close();
  }
}
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'ttx-outcome-test-'));
  await boot();
  const profile = (await query('/api/profiles/example-sme-01/revisions/profile-r1')).json();
  assert.equal(
    (
      await query('/api/profile-confirmations', {
        profileId: 'example-sme-01',
        revisionId: 'profile-r1',
        contentHash: profile.contentHash,
        acknowledgeUncertainties: true,
      })
    ).statusCode,
    200,
  );
  const review = (await query(`${root}/review`)).json();
  await ok('step0', {
    packageHash: review.packageHash,
    assignmentHash: review.assignmentHash,
    respondentIds: ['demo-participant', 'demo-observer'],
    firstContact: 'Controller.',
    contactRoute: 'Synthetic card.',
    fallback: 'Alternate controller route.',
    decision: 'ready',
    rationale: 'Both fixture roles represented.',
  });
  await ok('start', {
    packageHash: review.packageHash,
    assignmentHash: review.assignmentHash,
    acknowledgeBriefing: true,
    acknowledgeGaps: true,
    acknowledgeSimulation: true,
  });
  const approval = await ok('approvals', {
    packageHash: review.packageHash,
    injectId: review.nextInject.id,
    injectRevisionId: review.package.injects[0].revisionId,
    contentHash: review.nextInject.contentHash,
    recipientIds: ['demo-participant'],
  });
  releaseCommand = await body({ approvalId: approval.id });
  const release = await query(`${root}/releases`, releaseCommand);
  assert.equal(release.statusCode, 200, release.body);
  releaseReceipt = release.json();
  releaseId = release.json().id;
});
afterEach(async () => {
  await app.close();
  rmSync(directory, { recursive: true, force: true });
});

test('one team response is revisable by any assigned participant; private evidence stays private', async () => {
  const input = await body(answer());
  const first = await query(`${root}/team-responses`, input, 'participant');
  assert.equal(first.statusCode, 200, first.body);
  const receipt = first.json();
  assert.equal(receipt.teamId, 'technical-check-01');
  assert.equal(receipt.actorId, 'demo-participant');
  assert.ok(!first.body.includes('assignmentHash'));
  assert.deepEqual((await query(`${root}/team-responses`, input, 'participant')).json(), receipt);
  assert.equal(
    (
      await query(
        `${root}/team-responses`,
        { ...input, actions: 'Changed content.' },
        'participant',
      )
    ).statusCode,
    409,
  );
  await ok('dispositions', assessment(receipt.id));
  const revised = await ok(
    'team-responses',
    {
      ...answer(),
      previousResponseId: receipt.id,
      actions: 'Revised agreed action from the other participant.',
    },
    'observer',
  );
  assert.equal(revised.revision, 2);
  const reviewed = await view();
  assert.equal(reviewed.positions[0]!.responses.length, 2);
  for (const actor of ['participant', 'observer']) {
    const raw = await query(`${root}/team-responses`, undefined, actor);
    const team = readResponse(TeamOutcomesSchema, raw.json());
    assert.equal(team.positions[0]!.response!.id, revised.id);
    assert.ok(!raw.body.includes('PRIVATE OBSERVATION'));
    assert.ok(!raw.body.includes('assignmentHash'));
    assert.ok(!raw.body.includes(receipt.actions));
    assert.ok(!raw.body.includes('facilitatorNotes'));
  }
  assert.deepEqual((await query(`${root}/inbox`, undefined, 'observer')).json(), []);
  assert.equal((await query(`${root}/inbox`, undefined, 'participant')).json().length, 1);
});

test('outcome authority and strict inputs reject forged actors, teams, inaccessible releases and tracks', async () => {
  for (const actor of ['operational', 'anonymous']) {
    assert.ok(
      [401, 403].includes((await query(`${root}/team-responses`, undefined, actor)).statusCode),
    );
    assert.ok([401, 403].includes((await write('team-responses', answer(), actor)).statusCode));
  }
  assert.equal((await write('team-responses', answer())).statusCode, 403);
  for (const extra of [
    { actorId: 'demo-facilitator' },
    { teamId: 'another-team' },
    { actions: '   ' },
    { previousResponseId: 2 },
  ])
    assert.equal(
      (await write('team-responses', { ...answer(), ...extra }, 'participant')).statusCode,
      400,
    );
  assert.equal(
    (await write('team-responses', { ...answer(), releaseId: 'unreleased' }, 'participant'))
      .statusCode,
    404,
  );
  assert.equal((await query(`${root}/outcomes`, undefined, 'participant')).statusCode, 403);
  for (const action of ['dispositions', 'closures', 'complete']) {
    const extra =
      action === 'dispositions'
        ? assessment(null)
        : action === 'closures'
          ? { releaseId, dispositionId: 'forged', rationale: 'No authority.' }
          : { rationale: 'No authority.' };
    assert.equal((await write(action, extra, 'participant')).statusCode, 403);
  }
  assert.equal(
    (
      await query(
        '/api/tracks/operational/runs/operational-dev-01/outcomes',
        undefined,
        'operational',
      )
    ).statusCode,
    409,
  );
  assert.equal((await view()).positions[0]!.responses.length, 0);
});

test('current response and reviewed disposition are mandatory for closure, with gaps preserved', async () => {
  const first = await ok('team-responses', answer(), 'participant');
  const old = await ok('dispositions', assessment(first.id));
  const second = await ok(
    'team-responses',
    { ...answer(), previousResponseId: first.id, rationale: 'Revised rationale.' },
    'observer',
  );
  assert.equal(
    (await write('closures', { releaseId, dispositionId: old.id, rationale: 'Stale review.' }))
      .statusCode,
    409,
  );
  assert.equal((await write('dispositions', assessment(first.id))).statusCode, 409);
  const hold = await ok('dispositions', { ...assessment(second.id), decision: 'hold' });
  assert.equal(
    (
      await write('closures', {
        releaseId,
        dispositionId: hold.id,
        rationale: 'Must not close Hold.',
      })
    ).statusCode,
    409,
  );
  assert.equal(
    (await write('complete', { rationale: 'Last release is not completion.' })).statusCode,
    409,
  );
  const reviewed = await ok('dispositions', assessment(second.id));
  const closureInput = await body({
    releaseId,
    dispositionId: reviewed.id,
    rationale: 'Proceed carrying the recorded uncertainty.',
  });
  const closure = await query(`${root}/closures`, closureInput);
  assert.equal(closure.statusCode, 200, closure.body);
  assert.deepEqual((await query(`${root}/closures`, closureInput)).json(), closure.json());
  assert.equal(
    (await write('team-responses', { ...answer(), previousResponseId: second.id }, 'participant'))
      .statusCode,
    409,
  );
  assert.equal(
    (
      await write('closures', {
        releaseId,
        dispositionId: reviewed.id,
        rationale: 'Duplicate closure.',
      })
    ).statusCode,
    409,
  );
  const completeInput = await body({
    rationale: 'Exercise record closed, not successful incident recovery.',
  });
  const completion = await query(`${root}/complete`, completeInput);
  assert.equal(completion.statusCode, 200, completion.body);
  assert.deepEqual((await query(`${root}/complete`, completeInput)).json(), completion.json());
  assert.equal((await view()).run.state, 'completed');
  assert.equal(
    (await view()).positions[0]!.dispositions.at(-1)!.unresolvedGaps,
    'The extent remains unknown.',
  );
  assert.equal((await write('resume')).statusCode, 409);
});

test('unanswered closure needs an explicit finding and does not fabricate a team answer', async () => {
  assert.equal(
    (await write('dispositions', { ...assessment(null), unresolvedGaps: ' ' })).statusCode,
    409,
  );
  const disposition = await ok('dispositions', {
    ...assessment(null),
    observations: 'No answer received.',
    unresolvedGaps: 'This position remains unanswered.',
  });
  await ok('closures', {
    releaseId,
    dispositionId: disposition.id,
    rationale: 'Carry the unanswered finding to review.',
  });
  await ok('complete', {
    rationale: 'All positions explicitly closed with an unresolved finding.',
  });
  const result = await view();
  assert.equal(result.positions[0]!.response, null);
  assert.deepEqual(result.positions[0]!.responses, []);
});

test('pause freezes new submissions, dispositions, closure and completion but preserves reads and receipts', async () => {
  const responseInput = await body(answer());
  const response = await query(`${root}/team-responses`, responseInput, 'participant');
  assert.equal(response.statusCode, 200);
  const disposition = await ok('dispositions', assessment(response.json().id));
  await ok('pause');
  assert.deepEqual(
    (await query(`${root}/team-responses`, responseInput, 'participant')).json(),
    response.json(),
  );
  for (const [action, data, actor] of [
    ['team-responses', { ...answer(), previousResponseId: response.json().id }, 'participant'],
    ['dispositions', assessment(response.json().id), 'facilitator'],
    ['closures', { releaseId, dispositionId: disposition.id, rationale: 'Paused.' }, 'facilitator'],
    ['complete', { rationale: 'Paused.' }, 'facilitator'],
  ] as const)
    assert.equal((await write(action, data, actor)).statusCode, 409);
  assert.equal((await query(`${root}/team-responses`, undefined, 'observer')).statusCode, 200);
  await ok('resume');
  await ok('closures', {
    releaseId,
    dispositionId: disposition.id,
    rationale: 'Explicitly resumed.',
  });
});

test('competing submissions and a pause at the same run revision cannot both commit', async () => {
  const revision = (await view()).run.revision;
  const first = { ...(await body(answer())), expectedRunRevision: revision };
  const second = {
    ...(await body(answer())),
    expectedRunRevision: revision,
    actions: 'Another agreed draft.',
  };
  const replies = await Promise.all([
    query(`${root}/team-responses`, first, 'participant'),
    query(`${root}/team-responses`, second, 'observer'),
  ]);
  assert.deepEqual(replies.map((item) => item.statusCode).sort(), [200, 409]);
  const beforePause = await body({
    ...answer(),
    previousResponseId: (await view()).positions[0]!.response!.id,
  });
  const pause = {
    expectedRunRevision: beforePause.expectedRunRevision,
    idempotencyKey: randomUUID(),
  };
  const race = await Promise.all([
    query(`${root}/pause`, pause),
    query(`${root}/team-responses`, beforePause, 'participant'),
  ]);
  assert.deepEqual(race.map((item) => item.statusCode).sort(), [200, 409]);
});

test('each outcome mutation rolls back its record, activity, receipt and revision on audit failure', async () => {
  const stages = [
    ['team-responses', 'response-recorded', 'team_responses', 'participant'],
    ['dispositions', 'disposition-recorded', 'response_dispositions', 'facilitator'],
    ['closures', 'position-closed', 'position_closures', 'facilitator'],
    ['complete', 'run-completed', 'run_completions', 'facilitator'],
  ] as const;
  let responseId = '';
  let dispositionId = '';
  for (const [action, event, table, actor] of stages) {
    const extra =
      action === 'team-responses'
        ? answer()
        : action === 'dispositions'
          ? assessment(responseId)
          : action === 'closures'
            ? { releaseId, dispositionId, rationale: 'Explicit closure.' }
            : { rationale: 'Explicit completion.' };
    const input = await body(extra);
    const prior = (await view()).run;
    database((db) =>
      db.exec(
        `CREATE TRIGGER reject_outcome BEFORE INSERT ON run_activity WHEN NEW.kind = '${event}' BEGIN SELECT RAISE(ABORT, 'test audit failure'); END;`,
      ),
    );
    const failed = await query(`${root}/${action}`, input, actor);
    assert.equal(failed.statusCode, 500);
    assert.deepEqual((await view()).run, prior);
    database((db) => {
      assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()!.count, 0);
      assert.equal(
        db
          .prepare('SELECT COUNT(*) AS count FROM run_commands WHERE key = ?')
          .get(input.idempotencyKey)!.count,
        0,
      );
      db.exec('DROP TRIGGER reject_outcome');
    });
    const saved = await query(`${root}/${action}`, input, actor);
    assert.equal(saved.statusCode, 200, saved.body);
    if (action === 'team-responses') responseId = saved.json().id;
    if (action === 'dispositions') dispositionId = saved.json().id;
  }
});

test('test-entered response, review, closure and completed run survive real server reopening', async () => {
  const response = await ok('team-responses', answer(), 'participant');
  async function restart() {
    await app.close();
    await boot();
  }
  await restart();
  assert.equal((await view()).run.state, 'paused');
  assert.equal((await view()).positions[0]!.response!.id, response.id);
  await ok('resume');
  const disposition = await ok('dispositions', assessment(response.id));
  await restart();
  assert.equal((await view()).positions[0]!.dispositions[0]!.id, disposition.id);
  await ok('resume');
  const closure = await ok('closures', {
    releaseId,
    dispositionId: disposition.id,
    rationale: 'Persist this closure.',
  });
  await restart();
  assert.equal((await view()).positions[0]!.closure!.id, closure.id);
  await ok('resume');
  const completed = await ok('complete', { rationale: 'Completed with recorded gaps.' });
  await restart();
  assert.equal((await view()).run.state, 'completed');
  assert.deepEqual((await view()).completion, completed);
  assert.deepEqual((await query(`${root}/releases`, releaseCommand)).json(), releaseReceipt);
});

test('additive v3 migration preserves existing records, credentials and historical command decoding', async () => {
  await ok('pause');
  const old = (await query(`${root}/review`)).json();
  const oldCodes = readFileSync(join(directory, 'demo-access.json'), 'utf8');
  await app.close();
  database((db) =>
    db.exec(
      'DROP TABLE run_completions; DROP TABLE position_closures; DROP TABLE response_dispositions; DROP TABLE team_responses; PRAGMA user_version = 3;',
    ),
  );
  await boot();
  assert.deepEqual((await query(`${root}/review`)).json(), old);
  assert.equal(readFileSync(join(directory, 'demo-access.json'), 'utf8'), oldCodes);
  assert.deepEqual((await query(`${root}/releases`, releaseCommand)).json(), releaseReceipt);
  const result = await view();
  assert.deepEqual(result.positions[0]!.responses, []);
  assert.deepEqual(result.positions[0]!.dispositions, []);
  assert.equal(result.positions[0]!.closure, null);
  assert.equal(result.completion, null);
  database((db) => assert.equal(db.prepare('PRAGMA user_version').get()!.user_version, 4));
});
