import assert from 'node:assert/strict';
import { beforeEach, afterEach, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server/app.js';
import { Store } from '../src/server/storage.js';
import { DebriefService } from '../src/server/debrief-service.js';
import { RecordReportService } from '../src/server/record-report-service.js';
import { validateAar } from '../src/server/aar-content.js';
import type { DebriefInput } from '../src/contracts/debrief.js';
import { prepareInterpretationRun } from './interpretation-fixture.js';
import { generationTarget } from './generation-fixture.js';
import { fakeAar } from './aar-fixture.js';

let directory: string, app: FastifyInstance, store: Store, service: DebriefService;
let context: ReturnType<typeof prepareInterpretationRun>;
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'ttx-debrief-'));
  app = await buildApp({
    dataDirectory: directory,
    publicPort: 3000,
    packageTarget: generationTarget,
  });
  store = new Store(join(directory, 'ttx.sqlite'));
  context = prepareInterpretationRun(store, true);
  service = new DebriefService(store);
});
afterEach(async () => {
  store.close();
  await app.close();
  assert(resolve(directory).startsWith(join(resolve(tmpdir()), 'ttx-debrief-')));
  rmSync(directory, { recursive: true, force: true });
});
const entry = (change: Partial<DebriefInput> = {}): DebriefInput => ({
  commandId: randomUUID(),
  participantFeedback: 'Players said the restore evidence they needed was never supplied.',
  facilitatorObservations: '',
  exerciseDesignNotes: 'The package had no simulated supplier reply with restore-test evidence.',
  respondentIds: ['player-it', 'player-business'],
  ...change,
});

test('debrief is facilitator-only, after completion, attributable and append-only', () => {
  const active = prepareInterpretationRun(store);
  assert.throws(
    () => service.record(active.actor, active.runId, entry()),
    /after the run is completed/,
  );
  assert.throws(() => service.record(context.player, context.runId, entry()), /cannot access/);
  assert.throws(
    () =>
      service.record(
        context.actor,
        context.runId,
        entry({ participantFeedback: ' ', exerciseDesignNotes: '', respondentIds: [] }),
      ),
    /at least one debrief note/,
  );
  assert.throws(
    () => service.record(context.actor, context.runId, entry({ respondentIds: [] })),
    /Name the participants/,
  );
  for (const respondentIds of [[context.actor.id], ['invented-player']])
    assert.throws(
      () => service.record(context.actor, context.runId, entry({ respondentIds })),
      /participants in this run/,
    );
  assert.equal(service.list(context.actor, context.runId).length, 0);
  const before = store.exercises.run(context.runId)!;
  const input = entry();
  const saved = service.record(context.actor, context.runId, input);
  assert.deepEqual(saved.respondentIds, ['player-business', 'player-it']);
  assert.deepEqual(service.record(context.actor, context.runId, input), saved);
  assert.throws(
    () =>
      service.record(context.actor, context.runId, { ...input, exerciseDesignNotes: 'Changed.' }),
    /different content/,
  );
  assert.deepEqual(store.exercises.run(context.runId), before);
  assert.equal(saved.runRevision, before.revision);
  // Observations alone need no respondents.
  service.record(
    context.actor,
    context.runId,
    entry({
      participantFeedback: '',
      facilitatorObservations: 'Hot wash ran short.',
      respondentIds: [],
    }),
  );
  for (let index = 2; index < 20; index++) service.record(context.actor, context.runId, entry());
  assert.throws(() => service.record(context.actor, context.runId, entry()), /limit/);
  assert.equal(service.list(context.actor, context.runId).length, 20);
});

test('debrief entries reach new snapshots only, omitting blank notes, and the AAR can cite them', () => {
  const reports = new RecordReportService(store);
  const earlier = reports.capture(context.actor, context.runId, randomUUID());
  const debrief = service.record(context.actor, context.runId, entry());
  const snapshot = reports.capture(context.actor, context.runId, randomUUID());
  assert.equal(earlier.report.records.filter((r) => r.kind === 'debrief').length, 0);
  assert.deepEqual(store.recordReports.get(earlier.report.id), earlier);
  const record = snapshot.report.records.find((r) => r.id === debrief.id)!;
  assert.equal(record.kind, 'debrief');
  assert.equal(record.position, null);
  assert(snapshot.report.timeline.includes(debrief.id));
  assert.deepEqual(
    record.fields.map((field) => field.label),
    ['basis', 'participantFeedback', 'exerciseDesignNotes', 'respondentIds', 'runRevision'],
  );
  const cite = (category: string, field: string) => {
    const output = fakeAar(snapshot);
    const value = record.fields.find((f) => f.label === field)!.value;
    output.objectives[2]!.areasForImprovement.push({
      id: 'debrief-finding',
      category: category as never,
      evidence: [{ recordId: debrief.id, field, quote: value }],
    });
    return () => validateAar(output, snapshot);
  };
  assert.doesNotThrow(cite('facilitator-observation', 'participantFeedback'));
  assert.doesNotThrow(cite('exercise-gap', 'exerciseDesignNotes'));
  // Participant feedback does not establish where a gap came from.
  assert.throws(cite('exercise-gap', 'participantFeedback'), /origin/);
  assert.throws(cite('team-decision', 'participantFeedback'), /attribution/);
  assert.throws(cite('origin-not-established', 'exerciseDesignNotes'), /attribution/);
});

test('debrief API is facilitator-only with an application-owned schema', async () => {
  const headers = { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' };
  const url = '/api/tracks/technical/runs/' + context.runId + '/debriefs';
  const codes = {
    ...JSON.parse(readFileSync(join(directory, 'demo-access.json'), 'utf8')),
    ...JSON.parse(readFileSync(join(directory, 'package-player-access.json'), 'utf8')),
  };
  const login = async (username: string) => {
    const code = codes[username];
    const signed = await app.inject({
      method: 'POST',
      url: '/api/session',
      headers,
      payload: { username, accessCode: code },
    });
    return { ...headers, cookie: signed.cookies.map((c) => c.name + '=' + c.value).join('; ') };
  };
  const facilitator = await login('facilitator');
  const write = (auth: typeof headers, payload: object) =>
    app.inject({ method: 'POST', url, headers: auth, payload });
  // A player in this run and a participant outside it are both refused.
  for (const username of ['player-it', 'participant']) {
    const participant = await login(username);
    assert.equal((await write(participant, entry())).statusCode, 403);
    const read = await app.inject({ url, headers: participant });
    assert.equal(read.statusCode, 403);
  }
  assert.equal((await write(facilitator, { ...entry(), runId: 'other-run' })).statusCode, 400);
  const saved = await write(facilitator, entry());
  assert.equal(saved.statusCode, 200, saved.body);
  const listed = await app.inject({ url, headers: facilitator });
  assert.equal(listed.statusCode, 200);
  assert.equal(JSON.parse(listed.body).length, 1);
});
