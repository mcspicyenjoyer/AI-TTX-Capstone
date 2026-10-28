import assert from 'node:assert/strict';
import { beforeEach, afterEach, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server/app.js';
import { Store } from '../src/server/storage.js';
import { RecordReportService } from '../src/server/record-report-service.js';
import { InterpretationService } from '../src/server/interpretation-service.js';
import { contentHash } from '../src/server/integrity.js';
import { checkReportReferences, type RecordReportView } from '../src/contracts/record-report.js';
import type { InterpretationView, ReviewInterpretation } from '../src/contracts/interpretation.js';
import { generationTarget } from './generation-fixture.js';
import { prepareInterpretationRun, fakeInterpretation } from './interpretation-fixture.js';

let directory: string, app: FastifyInstance, store: Store, service: RecordReportService;
let context: ReturnType<typeof prepareInterpretationRun>;
const headers = { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' };
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'ttx-record-report-'));
  app = await buildApp({
    dataDirectory: directory,
    publicPort: 3000,
    packageTarget: generationTarget,
  });
  store = new Store(join(directory, 'ttx.sqlite'));
  context = prepareInterpretationRun(store, true);
  service = new RecordReportService(store);
});
afterEach(async () => {
  store.close();
  await app.close();
  assert(resolve(directory).startsWith(join(resolve(tmpdir()), 'ttx-record-report-')));
  rmSync(directory, { recursive: true, force: true });
});
function database<T>(fn: (db: DatabaseSync) => T) {
  const db = new DatabaseSync(join(directory, 'ttx.sqlite'));
  try {
    return fn(db);
  } finally {
    db.close();
  }
}
function sourceRows() {
  return database((db) =>
    Object.fromEntries(
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name!='record_reports' ORDER BY name",
        )
        .all()
        .map((row) => [
          row.name,
          db.prepare('SELECT * FROM "' + row.name + '" ORDER BY rowid').all(),
        ]),
    ),
  );
}
function capture(commandId = randomUUID()) {
  return service.capture(context.actor, context.runId, commandId);
}
function ready(index = 0, evaluation = false) {
  const interpreter = new InterpretationService(store, true);
  const release = store.exercises.releases(context.runId)[index]!;
  const response = store.outcomes.responses(release.id).at(-1)!;
  const view = interpreter.request(
    context.actor,
    context.runId,
    { commandId: randomUUID(), releaseId: release.id, responseId: response.id, mode: 'ai' },
    evaluation
      ? {
          purpose: 'development',
          caseId: 'test-case',
          response: {
            actions: 'Evaluation-only response',
            rationale: 'Evaluation rationale',
            informationRequests: '',
          },
        }
      : undefined,
  );
  const job = interpreter.claim()!;
  assert(job);
  interpreter.complete({
    id: job.id,
    failed: false,
    output: fakeInterpretation(job.input),
    inputTokens: 10,
    outputTokens: 10,
  });
  return interpreter.get(context.actor, context.runId, view.record.id);
}
function review(view: InterpretationView, decision: ReviewInterpretation['decision'] = 'accept') {
  const output = fakeInterpretation(view.record.input);
  output.actions[0]!.label = 'present';
  return new InterpretationService(store).review(context.actor, context.runId, view.record.id, {
    commandId: randomUUID(),
    expectedRevision: view.record.revision,
    expectedHash: view.hash,
    decision,
    notes: 'Reviewer <script>not executed</script> observation.',
    output: ['edit', 'override'].includes(decision) ? output : null,
  });
}

test('record report captures all five positions under three objectives with resolvable line citations and no source writes', () => {
  for (let i = 0; i < 110; i++)
    store.exercises.event(store.exercises.run(context.runId)!, 'run-paused', context.actor.id);
  const before = sourceRows(),
    view = capture(),
    report = view.report;
  assert.deepEqual(sourceRows(), before);
  assert.equal(report.packageId, store.exercises.run(context.runId)!.packageId);
  assert.equal(
    report.packageHash,
    context.exercises.review(context.actor, 'technical', context.runId).packageHash,
  );
  assert.deepEqual(
    report.objectives.map((o) => o.positions),
    [[1], [2, 3], [4, 5]],
  );
  for (const kind of ['release', 'response', 'disposition', 'closure'])
    assert.equal(report.records.filter((r) => r.kind === kind).length, 5);
  assert.equal(report.records.filter((r) => r.kind === 'step0').length, 1);
  assert.equal(report.records.filter((r) => r.kind === 'completion').length, 1);
  assert(report.records.filter((r) => r.kind === 'activity').length > 100);
  assert.equal(
    report.records.filter((r) => r.kind === 'activity').length,
    store.exercises.activity(context.runId, true).length,
  );
  assert.equal(
    report.records
      .find((r) => r.id === context.response.id)!
      .fields.find((f) => f.label === 'actions')!.value,
    context.response.actions,
  );
  assert(
    report.records
      .find((r) => r.id === report.id)!
      .fields.some((f) => f.value.includes('clarification answers are outside the app record')),
  );
  const dates = report.timeline.map((id) => report.records.find((r) => r.id === id)!.recordedAt!);
  assert.deepEqual(dates, [...dates].sort());
  checkReportReferences(report);
  assert.equal(contentHash(JSON.stringify(report)), view.hash);
});

test('report excludes all unreviewed output, stale assessments and evaluation cases; only accepted edited and overridden review output is included', () => {
  const pending = ready(0),
    accepted = review(ready(1)),
    edited = review(ready(2), 'edit');
  const rejected = review(ready(3), 'reject');
  const interpreter = new InterpretationService(store);
  const release = store.exercises.releases(context.runId)[4]!;
  const manual = interpreter.request(context.actor, context.runId, {
    commandId: randomUUID(),
    releaseId: release.id,
    responseId: store.outcomes.responses(release.id)[0]!.id,
    mode: 'manual',
  });
  const override = review(manual, 'override');
  const stale = review(ready(0));
  store.interpretations.save({
    ...stale.record,
    revision: stale.record.revision + 1,
    sourceHash: '0'.repeat(64),
  });
  const evaluation = review(ready(0, true));
  const before = sourceRows(),
    view = capture();
  assert.deepEqual(sourceRows(), before);
  const records = view.report.records.filter((r) => r.kind === 'interpretation');
  assert.deepEqual(
    records.map((r) => r.id).sort(),
    [accepted, edited, rejected, override].map((v) => v.record.id).sort(),
  );
  for (const r of records)
    assert(r.fields.some((f) => f.label === 'reviewed' && f.value === 'true'));
  for (const excluded of [pending, stale, evaluation])
    assert(!JSON.stringify(view).includes(excluded.record.id));
  assert(!JSON.stringify(view).includes('Evaluation-only response'));
  const editedRecord = records.find((r) => r.id === edited.record.id)!;
  assert.equal(
    editedRecord.fields.find((f) => f.label.startsWith('assessment.'))!.value,
    'present',
  );
  assert.equal(edited.record.proposal!.actions[0]!.label, 'partial');
  assert(
    !records
      .find((r) => r.id === rejected.record.id)!
      .fields.some((f) => /^(assessment\.|evidence\.|decisionSummary)/.test(f.label)),
  );
  for (const r of records)
    assert.equal(r.revision, store.interpretations.get(r.id)!.record.revision);
});

test('later facilitator review needs a new snapshot; retries and reopening preserve the earlier bytes', () => {
  const pending = ready(),
    key = randomUUID(),
    first = capture(key);
  assert.equal(first.report.records.filter((r) => r.kind === 'interpretation').length, 0);
  review(pending);
  assert.deepEqual(capture(key), first);
  const second = capture();
  assert.equal(second.report.records.filter((r) => r.kind === 'interpretation').length, 1);
  assert.notEqual(second.hash, first.hash);
  store.close();
  store = new Store(join(directory, 'ttx.sqlite'));
  service = new RecordReportService(store);
  assert.deepEqual(service.get(context.actor, context.runId, first.report.id), first);
  assert.equal(service.list(context.actor, context.runId).length, 2);
});

test('report rejects unresolved citations, incomplete inventories, identity and byte corruption', () => {
  const original = capture();
  const bad = structuredClone(original.report);
  bad.records[0]!.fields[0]!.citations.push('nonexistent-record');
  assert.throws(() => store.recordReports.save(bad, randomUUID()), /citation/);
  bad.records[0]!.fields[0]!.citations = [bad.records[0]!.id];
  bad.timeline.pop();
  assert.throws(() => store.recordReports.save(bad, randomUUID()), /timeline/);
  const change = (view: RecordReportView, recompute = true) =>
    database((db) => {
      const payload = JSON.stringify(view.report);
      db.prepare('UPDATE record_reports SET payload=?, content_hash=? WHERE id=?').run(
        payload,
        recompute ? contentHash(payload) : original.hash,
        original.report.id,
      );
    });
  const broken = structuredClone(original);
  broken.report.records[0]!.fields[0]!.citations.push('unresolvable');
  change(broken);
  assert.throws(() => service.get(context.actor, context.runId, original.report.id), /citation/);
  change(broken, false);
  assert.throws(() => service.get(context.actor, context.runId, original.report.id), /integrity/);
  const identity = structuredClone(original);
  identity.report.ownerId = 'other-owner';
  change(identity);
  assert.throws(() => service.get(context.actor, context.runId, original.report.id), /identity/);
});

test('report requires a complete frozen run and does not silently publish partial source records', () => {
  const active = prepareInterpretationRun(store);
  assert.throws(() => service.capture(active.actor, active.runId, randomUUID()), /completed/);
  database((db) =>
    db.prepare('DELETE FROM position_closures WHERE release_id=?').run(context.release.id),
  );
  assert.throws(() => capture(), /closure/);
  assert.equal(service.list(context.actor, context.runId).length, 0);
});

test('report API is facilitator-only, owner/run-bound and rejects client-supplied report content', async () => {
  const view = capture(),
    base = '/api/tracks/technical/runs/' + context.runId + '/record-reports';
  const outsider = { id: 'other-facilitator', role: 'facilitator' as const, displayName: 'Other' };
  store.addActor(outsider, 'other-facilitator', 'test-only-not-a-credential');
  assert.throws(
    () => service.get(outsider, context.runId, view.report.id),
    /cannot|assigned|permission/i,
  );
  const other = prepareInterpretationRun(store, true);
  assert.throws(() => service.get(context.actor, other.runId, view.report.id), /cannot/);
  assert.equal((await app.inject({ method: 'GET', url: base, headers })).statusCode, 401);
  for (const username of ['player-it', 'facilitator']) {
    const file = username === 'facilitator' ? 'demo-access.json' : 'package-player-access.json';
    const code = JSON.parse(readFileSync(join(directory, file), 'utf8'))[username];
    const login = await app.inject({
      method: 'POST',
      url: '/api/session',
      headers,
      payload: { username, accessCode: code },
    });
    const auth = { ...headers, cookie: 'ttx_session=' + login.cookies[0]!.value };
    for (const url of [base, base + '/' + view.report.id])
      assert.equal(
        (await app.inject({ method: 'GET', url, headers: auth })).statusCode,
        username === 'facilitator' ? 200 : 403,
      );
    const result = await app.inject({
      method: 'POST',
      url: base,
      headers: auth,
      payload: { commandId: randomUUID() },
    });
    assert.equal(result.statusCode, username === 'facilitator' ? 200 : 403);
    if (username === 'facilitator')
      assert.equal(
        (
          await app.inject({
            method: 'POST',
            url: base,
            headers: auth,
            payload: { commandId: randomUUID(), report: view.report },
          })
        ).statusCode,
        400,
      );
  }
});

test('v8 to v9 adds snapshot storage without altering completed runs or pending interpretations', () => {
  ready();
  const before = sourceRows();
  store.close();
  database((db) => db.exec('DROP TABLE record_reports; PRAGMA user_version=8;'));
  store = new Store(join(directory, 'ttx.sqlite'));
  service = new RecordReportService(store);
  assert.equal(
    database((db) => db.prepare('PRAGMA user_version').get()!.user_version),
    9,
  );
  assert.deepEqual(sourceRows(), before);
  assert.equal(capture().report.records.filter((r) => r.kind === 'interpretation').length, 0);
});
