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
import { AarService } from '../src/server/aar-service.js';
import { RecordReportService } from '../src/server/record-report-service.js';
import { InterpretationService } from '../src/server/interpretation-service.js';
import { aarPrompt, validateAar } from '../src/server/aar-content.js';
import { ClarificationService } from '../src/server/clarification-service.js';
import { prepareInterpretationRun, fakeInterpretation } from './interpretation-fixture.js';
import { generationTarget, generationProfile } from './generation-fixture.js';
import { fakeAar } from './aar-fixture.js';
import { findingDefault } from '../src/ui/aar-draft.js';
import type { RecordReportView } from '../src/contracts/record-report.js';
import type { AarOutput, AarView } from '../src/contracts/aar.js';

let directory: string,
  app: FastifyInstance,
  store: Store,
  service: AarService,
  snapshot: RecordReportView;
let context: ReturnType<typeof prepareInterpretationRun>;
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'ttx-aar-'));
  app = await buildApp({
    dataDirectory: directory,
    publicPort: 3000,
    packageTarget: generationTarget,
    subscriptionEnabled: true,
  });
  store = new Store(join(directory, 'ttx.sqlite'));
  context = prepareInterpretationRun(store, true);
  const interpreter = new InterpretationService(store);
  for (const release of store.exercises.releases(context.runId)) {
    const view = interpreter.request(context.actor, context.runId, {
      commandId: randomUUID(),
      releaseId: release.id,
      responseId: store.outcomes.responses(release.id)[0]!.id,
      mode: 'manual',
    });
    interpreter.review(context.actor, context.runId, view.record.id, {
      commandId: randomUUID(),
      expectedRevision: view.record.revision,
      expectedHash: view.hash,
      decision: 'override',
      notes: 'Synthetic approved review.',
      output: fakeInterpretation(view.record.input),
    });
  }
  snapshot = new RecordReportService(store).capture(context.actor, context.runId, randomUUID());
  service = new AarService(store, true);
});
afterEach(async () => {
  store.close();
  await app.close();
  assert(resolve(directory).startsWith(join(resolve(tmpdir()), 'ttx-aar-')));
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
          "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT IN ('aar_revisions','run_commands') ORDER BY name",
        )
        .all()
        .map((row) => [
          row.name,
          db.prepare('SELECT * FROM "' + row.name + '" ORDER BY rowid').all(),
        ]),
    ),
  );
}
function request(mode: 'ai' | 'manual' = 'ai', commandId = randomUUID()) {
  return service.request(context.actor, context.runId, {
    commandId,
    snapshotId: snapshot.report.id,
    snapshotHash: snapshot.hash,
    mode,
  });
}
function finish(output: unknown = fakeAar(snapshot), failed = false) {
  const job = service.claim()!;
  assert(job);
  return service.complete({
    id: job.id,
    output,
    failed,
    inputTokens: failed ? -1 : 10,
    outputTokens: failed ? -1 : 20,
  });
}
function review(
  view: AarView,
  decision: 'accept' | 'edit' | 'reject' | 'override' = 'accept',
  output: unknown = null,
) {
  return service.review(context.actor, context.runId, view.record.id, {
    commandId: randomUUID(),
    expectedRevision: view.record.revision,
    expectedHash: view.hash,
    decision,
    notes: 'Independent synthetic review.',
    output: output as never,
  });
}

test('AAR uses the exact fixed reviewed snapshot, excludes later reviews, and never changes exercise evidence', () => {
  const before = sourceRows(),
    initial = request(),
    job = service.claim()!;
  assert.deepEqual(job.snapshot, snapshot);
  assert.equal(job.snapshot.report.records.filter((r) => r.kind === 'interpretation').length, 5);
  assert.equal(service.claim(), null);
  assert(
    service.complete({
      id: job.id,
      output: fakeAar(snapshot),
      failed: false,
      inputTokens: 10,
      outputTokens: 20,
    }).saved,
  );
  let current = service.get(context.actor, context.runId, initial.record.id);
  assert.equal(current.record.review, null);
  current = review(current);
  assert.deepEqual(current.record.review!.output, fakeAar(snapshot));
  assert.deepEqual(sourceRows(), before);
  const old = store.interpretations.list(context.runId)[0]!;
  const interpreter = new InterpretationService(store),
    iv = interpreter.get(context.actor, context.runId, old.id);
  interpreter.review(context.actor, context.runId, old.id, {
    commandId: randomUUID(),
    expectedRevision: old.revision,
    expectedHash: iv.hash,
    decision: 'reject',
    notes: 'Later changed opinion must not replace captured evidence.',
    output: null,
  });
  const second = request(),
    next = service.claim()!;
  assert.equal(next.id, second.record.id);
  assert.deepEqual(next.snapshot, snapshot);
  assert(!aarPrompt(next.snapshot).includes('Later changed opinion'));
  assert(!aarPrompt(next.snapshot).includes('accessCode'));
  assert.deepEqual(service.get(context.actor, context.runId, initial.record.id), current);
});
test('AAR rejects another hash, unresolvable citations, invented quotes and another objective position', () => {
  assert.throws(
    () =>
      service.request(context.actor, context.runId, {
        commandId: randomUUID(),
        snapshotId: snapshot.report.id,
        snapshotHash: '0'.repeat(64),
        mode: 'ai',
      }),
    /hash/,
  );
  for (const change of [
    (o: ReturnType<typeof fakeAar>) => {
      o.objectives[0]!.strengths[0]!.evidence[0]!.recordId = 'private-transcript';
    },
    (o: ReturnType<typeof fakeAar>) => {
      o.objectives[0]!.strengths[0]!.evidence[0]!.quote = 'Backup restored fine; Ethan approved.';
    },
    (o: ReturnType<typeof fakeAar>) => {
      o.objectives[0]!.strengths[0]!.evidence[0]!.field = 'nonexistent';
    },
    (o: ReturnType<typeof fakeAar>) => {
      o.objectives[0]!.strengths[0]!.evidence = o.objectives[2]!.strengths[0]!.evidence;
    },
  ]) {
    const output = fakeAar(snapshot);
    change(output);
    assert.throws(() => validateAar(output, snapshot));
  }
});
test('AAR rejects false attribution, unsupported gap origins, execution fields and assigned owners', () => {
  for (const change of [
    (o: ReturnType<typeof fakeAar>) => {
      o.objectives[0]!.strengths[0]!.category = 'facilitator-observation';
    },
    (o: ReturnType<typeof fakeAar>) => {
      o.objectives[0]!.areasForImprovement[0]!.category = 'profile-gap';
    },
    (o: ReturnType<typeof fakeAar>) => {
      Object.assign(o.objectives[0]!.strengths[0]!, {
        summary: 'The backups were successfully restored.',
      });
    },
    (o: ReturnType<typeof fakeAar>) => {
      Object.assign(o.improvementActions[0]!, { owner: 'Imran' });
    },
    (o: ReturnType<typeof fakeAar>) => {
      Object.assign(o.improvementActions[0]!, { status: 'completed' });
    },
    (o: ReturnType<typeof fakeAar>) => {
      o.improvementActions[0]!.findingIds = ['imaginary-finding'];
    },
  ]) {
    const output = fakeAar(snapshot);
    change(output);
    assert.throws(() => validateAar(output, snapshot));
  }
  const output = fakeAar(snapshot);
  const finding = output.objectives[0]!.areasForImprovement[0]!;
  finding.category = 'exercise-gap';
  assert.throws(() => validateAar(output, snapshot), /origin/);
  finding.evidence = output.objectives[0]!.strengths[0]!.evidence;
  assert.throws(() => validateAar(output, snapshot), /attribution/);
  const step0 = snapshot.report.records.find((r) => r.kind === 'step0')!;
  const field = step0.fields.find((f) => f.label === 'rationale')!;
  finding.category = 'origin-not-established';
  finding.evidence = [{ recordId: step0.id, field: field.label, quote: field.value }];
  assert.throws(() => validateAar(output, snapshot), /attribution/);
  finding.category = 'facilitator-observation';
  assert.deepEqual(validateAar(output, snapshot), output);
});
test('AAR distinguishes supported profile gaps from missing provenance and keeps unknown origins explicit', () => {
  const sample = structuredClone(snapshot),
    output = fakeAar(sample);
  const release = sample.report.records.find((r) => r.kind === 'release')!;
  const line =
    'CONFLICT / File service / recovery-target: Four and eight hours have different scopes.';
  release.fields.push({ label: 'delivery.test', value: line, citations: [release.id] });
  const finding = output.objectives[0]!.areasForImprovement[0]!;
  finding.category = 'profile-gap';
  finding.evidence = [{ recordId: release.id, field: 'delivery.test', quote: line }];
  assert.deepEqual(validateAar(output, sample), output);
  finding.evidence[0]!.quote = 'Four and eight hours have different scopes.';
  assert.throws(() => validateAar(output, sample), /origin/);
  finding.category = 'origin-not-established';
  assert.deepEqual(validateAar(output, sample), output);
  finding.category = 'exercise-gap';
  const boundary = sample.report.records.find((r) => r.kind === 'boundary')!;
  finding.evidence = [
    {
      recordId: boundary.id,
      field: 'clarificationLimit',
      quote: boundary.fields.find((f) => f.label === 'clarificationLimit')!.value,
    },
  ];
  assert.deepEqual(validateAar(output, sample), output);
});
test('AAR manual review validates citations and version, with accept edit reject override independent of outcomes', () => {
  const before = sourceRows(),
    manual = request('manual');
  assert.throws(() => review(manual, 'accept'), /Accept/);
  const invalid = fakeAar(snapshot);
  invalid.improvementActions[0]!.findingIds = ['unknown'];
  assert.throws(() => review(manual, 'override', invalid), /invalid/);
  let edited = review(manual, 'override', fakeAar(snapshot));
  assert.throws(() => review(manual, 'override', fakeAar(snapshot)), /changed/);
  edited = review(edited, 'reject');
  assert.equal(edited.record.review!.output, null);
  const ai = request();
  finish();
  let ready = service.get(context.actor, context.runId, ai.record.id);
  const output = fakeAar(snapshot);
  output.improvementActions[0]!.proposal = 'Review the evidence requirements in the draft plan.';
  ready = review(ready, 'edit', output);
  assert.deepEqual(ready.record.review!.output, output);
  assert.deepEqual(sourceRows(), before);
});
test('new AAR findings start from a facilitator record when an objective has no team response', () => {
  const partial = prepareInterpretationRun(store, true, undefined, [2, 3, 4, 5]);
  const view = new RecordReportService(store).capture(partial.actor, partial.runId, randomUUID());
  const records = view.report.records;
  assert.deepEqual(
    records.filter((r) => r.kind === 'response').map((r) => r.position),
    [1],
  );
  const defaults = view.report.objectives.map((_, i) => findingDefault(view.report, i)!);
  assert.deepEqual(
    defaults.map((d) => [d.category, records.find((r) => r.id === d.evidence[0]!.recordId)!.kind]),
    [
      ['team-decision', 'response'],
      ['facilitator-observation', 'disposition'],
      ['facilitator-observation', 'disposition'],
    ],
  );
  for (const [i, d] of defaults.entries()) {
    const record = records.find((r) => r.id === d.evidence[0]!.recordId)!;
    assert.ok(view.report.objectives[i]!.positions.includes(record.position!));
  }
  // Filling only the exact excerpt yields an AAR the server accepts, with no invented response.
  const output: AarOutput = {
    scope: 'discussion-only',
    objectives: view.report.objectives.map((objective, i) => {
      const evidence = defaults[i]!.evidence[0]!;
      const quote = records
        .find((r) => r.id === evidence.recordId)!
        .fields.find((f) => f.label === evidence.field)!.value;
      return {
        objectiveId: objective.id,
        strengths: [],
        areasForImprovement: [
          { id: 'finding-' + i, ...defaults[i]!, evidence: [{ ...evidence, quote }] },
        ],
      };
    }),
    improvementActions: [],
  };
  assert.deepEqual(validateAar(output, view), output);
  assert.equal(findingDefault({ ...view.report, records: [] }, 1), null);
});
test('AAR three-attempt budget counts failures invalid output and unknown usage; manual continuation stays available', () => {
  for (let i = 0; i < 3; i++) {
    const view = request();
    assert.throws(() => request(), /pending/);
    assert.equal(finish(i === 1 ? { bad: true } : null, i !== 1).saved, false);
    const failed = service.get(context.actor, context.runId, view.record.id).record;
    assert.equal(failed.status, 'failed');
    assert.equal(failed.inputTokens, i === 1 ? 10 : null);
    assert.equal(failed.outputTokens, i === 1 ? 20 : null);
  }
  assert.equal(service.list(context.actor, context.runId).remainingCalls, 0);
  assert.throws(() => request(), /budget/);
  assert.equal(service.claim(), null);
  assert.equal(
    review(request('manual'), 'override', fakeAar(snapshot)).record.review!.decision,
    'override',
  );
});
test('AAR timeout restart and late completion never retry automatically or reopen the run', () => {
  const before = context.outcomes.review(context.actor, 'technical', context.runId);
  const first = request();
  service.claim();
  const running = store.aars.get(first.record.id)!.record;
  store.aars.save({
    ...running,
    revision: running.revision + 1,
    updatedAt: '2000-01-01T00:00:00.000Z',
  });
  assert.equal(service.list(context.actor, context.runId).records[0]!.record.status, 'failed');
  assert.equal(
    service.complete({
      id: first.record.id,
      failed: false,
      output: fakeAar(snapshot),
      inputTokens: 12,
      outputTokens: 20,
    }).saved,
    false,
  );
  request();
  service.claim();
  store.transaction(() => store.aars.recover());
  assert.equal(service.list(context.actor, context.runId).remainingCalls, 1);
  assert.equal(service.claim(), null);
  assert.deepEqual(context.outcomes.review(context.actor, 'technical', context.runId), before);
});
test('AAR command receipts prevent duplicate calls and reject a reused request with another binding', () => {
  const key = randomUUID(),
    first = request('ai', key);
  assert.deepEqual(request('ai', key), first);
  const changed = new RecordReportService(store).capture(
    context.actor,
    context.runId,
    randomUUID(),
  );
  assert.throws(
    () =>
      service.request(context.actor, context.runId, {
        commandId: key,
        snapshotId: changed.report.id,
        snapshotHash: changed.hash,
        mode: 'ai',
      }),
    /different/,
  );
  finish();
  assert.equal(service.list(context.actor, context.runId).remainingCalls, 2);
  assert.equal(request('ai', key).record.id, first.record.id);
});
test('AAR API is owner-facilitator only with application-owned schemas and no participant disclosure', async () => {
  const initial = request('manual'),
    base = '/api/tracks/technical/runs/' + context.runId;
  const headers = { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' };
  for (const username of ['facilitator', 'participant', 'observer']) {
    const filename = username === 'observer' ? 'demo-track-access.json' : 'demo-access.json';
    const code = JSON.parse(readFileSync(join(directory, filename), 'utf8'))[username];
    const signed = await app.inject({
      method: 'POST',
      url: '/api/session',
      headers,
      payload: { username, accessCode: code },
    });
    const auth = {
      ...headers,
      cookie: signed.cookies.map((c) => c.name + '=' + c.value).join('; '),
    };
    const result = await app.inject({ url: base + '/aars', headers: auth });
    assert.equal(result.statusCode, username === 'facilitator' ? 200 : 403);
    const write = await app.inject({
      method: 'POST',
      url: base + '/aars/' + initial.record.id + '/review',
      headers: auth,
      payload: {
        commandId: randomUUID(),
        expectedRevision: initial.record.revision,
        expectedHash: initial.hash,
        decision: 'override',
        notes: 'API review.',
        output: fakeAar(snapshot),
      },
    });
    assert.equal(write.statusCode, username === 'facilitator' ? 200 : 403);
    if (username === 'facilitator')
      assert.equal(
        (
          await app.inject({
            method: 'POST',
            url: base + '/aars',
            headers: auth,
            payload: {
              commandId: randomUUID(),
              snapshotId: snapshot.report.id,
              snapshotHash: snapshot.hash,
              mode: 'ai',
              snapshot: snapshot.report,
            },
          })
        ).statusCode,
        400,
      );
    else assert(!result.body.includes('Synthetic approved review'));
  }
});
test('v9 migration preserves the exact captured bytes and completed evidence', () => {
  const before = sourceRows();
  store.close();
  database((db) =>
    db.exec('DROP TABLE aar_revisions; DROP TABLE clarification_records; PRAGMA user_version=9;'),
  );
  store = new Store(join(directory, 'ttx.sqlite'));
  service = new AarService(store, true);
  assert.deepEqual(sourceRows(), before);
  assert.deepEqual(store.recordReports.get(snapshot.report.id), snapshot);
  assert.equal(
    database((db) => db.prepare('PRAGMA user_version').get()!.user_version),
    10,
  );
});
test('future clarification logging requires current open release and bound claims; no completed trial backfill or delivery', () => {
  const clarifications = new ClarificationService(store);
  const input = {
    commandId: randomUUID(),
    releaseId: context.release.id,
    text: 'not known at this time',
    claimIds: [],
    unknown: true,
  };
  assert.throws(() => clarifications.record(context.actor, context.runId, input), /backfill/);
  const future = prepareInterpretationRun(store),
    base = { ...input, commandId: randomUUID(), releaseId: future.release.id };
  const inbox = future.exercises.inbox(future.player, 'technical', future.runId),
    before = future.outcomes.review(future.actor, 'technical', future.runId);
  const unknown = clarifications.record(future.actor, future.runId, base);
  assert.equal(unknown.unknown, true);
  assert.deepEqual(clarifications.record(future.actor, future.runId, base), unknown);
  assert.throws(
    () => clarifications.record(future.player, future.runId, { ...base, commandId: randomUUID() }),
    /access/,
  );
  assert.throws(
    () =>
      clarifications.record(future.actor, future.runId, {
        ...base,
        commandId: randomUUID(),
        unknown: false,
        text: 'A purported answer.',
        claimIds: ['invented-claim'],
      }),
    /absent/,
  );
  assert.throws(
    () =>
      clarifications.record(future.actor, future.runId, {
        ...base,
        commandId: randomUUID(),
        text: 'Backup restored fine.',
      }),
    /unknown/,
  );
  const claim = generationProfile.environment!.claims[0]!;
  const answer = clarifications.record(future.actor, future.runId, {
    ...base,
    commandId: randomUUID(),
    unknown: false,
    text: 'See the cited confirmed-profile claim; no action execution is asserted.',
    claimIds: [claim.id],
  });
  assert.equal(answer.profileHash, generationTarget.profileHash);
  assert.deepEqual(future.exercises.inbox(future.player, 'technical', future.runId), inbox);
  assert.deepEqual(future.outcomes.review(future.actor, 'technical', future.runId), before);
  assert.deepEqual(store.recordReports.get(snapshot.report.id), snapshot);
  future.exercises.changeState(future.actor, 'technical', future.runId, future.state(), 'pause');
  assert.throws(
    () => clarifications.record(future.actor, future.runId, { ...base, commandId: randomUUID() }),
    /active/,
  );
});
test('future clarification answers appear as cited timeline records in their completed snapshot only', () => {
  const service = new ClarificationService(store);
  const future = prepareInterpretationRun(store, true, (runId, releaseId) => {
    service.record(context.actor, runId, {
      commandId: randomUUID(),
      releaseId,
      text: 'not known at this time',
      unknown: true,
      claimIds: [],
    });
  });
  const captured = new RecordReportService(store).capture(
    context.actor,
    future.runId,
    randomUUID(),
  );
  const answers = captured.report.records.filter((r) => r.kind === 'clarification');
  assert.equal(answers.length, 5);
  for (const answer of answers) {
    assert(captured.report.timeline.includes(answer.id));
    assert.equal(answer.fields.find((f) => f.label === 'text')!.value, 'not known at this time');
    assert(answer.fields.every((f) => f.citations.includes(answer.id)));
  }
  assert(
    captured.report.records
      .find((r) => r.kind === 'boundary')!
      .fields.find((f) => f.label === 'clarificationLimit')!
      .value.includes('Only the facilitator clarification answers explicitly logged'),
  );
  assert.deepEqual(store.recordReports.get(snapshot.report.id), snapshot);
  assert.equal(
    store.recordReports
      .get(snapshot.report.id)!
      .report.records.filter((r) => r.kind === 'clarification').length,
    0,
  );
});
