import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import type { Actor } from '../src/contracts/profile.js';
import type {
  PackageDraftView,
  GeneratedPlan,
  ReviewPreparation,
} from '../src/contracts/generation.js';
import type { Review } from '../src/contracts/exercise.js';
import { buildApp } from '../src/server/app.js';
import { Store } from '../src/server/storage.js';
import { GenerationService, packagePlayers } from '../src/server/generation-service.js';
import {
  validateGeneratedPlan,
  generationPrompt,
  compileGeneratedPackage,
} from '../src/server/generation-content.js';
import { generationProfile, generationTarget, generationPlan } from './generation-fixture.js';
import { codexOutputSchema } from '../src/server/codex-extraction.js';
import { GeneratedPlanSchema } from '../src/contracts/generation.js';
import { readPackage } from '../src/server/exercise-validation.js';
import { contentHash } from '../src/server/integrity.js';

let directory: string, app: FastifyInstance, store: Store, service: GenerationService, actor: Actor;
let cookies: Record<string, string>;
const headers = { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' };
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'ttx-generation-'));
  app = await buildApp({
    dataDirectory: directory,
    publicPort: 3000,
    packageTarget: generationTarget,
    subscriptionEnabled: true,
  });
  store = new Store(join(directory, 'ttx.sqlite'));
  actor = store.loginIdentity('facilitator')!.actor;
  store.transaction(() => store.publishIntakeProfile(structuredClone(generationProfile), actor));
  service = new GenerationService(store, generationTarget, true);
  const codes = {
    ...JSON.parse(readFileSync(join(directory, 'demo-access.json'), 'utf8')),
    ...JSON.parse(readFileSync(join(directory, 'package-player-access.json'), 'utf8')),
  };
  cookies = {};
  for (const [username, accessCode] of Object.entries(codes)) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/session',
      headers,
      payload: { username, accessCode },
    });
    assert.equal(response.statusCode, 200, response.body);
    cookies[username] = `ttx_session=${response.cookies[0]!.value}`;
  }
});
afterEach(async () => {
  store.close();
  await app.close();
  rmSync(directory, { recursive: true, force: true });
});
function query(url: string, payload?: object, username = 'facilitator') {
  return app.inject({
    method: payload ? 'POST' : 'GET',
    url,
    headers: { ...headers, cookie: cookies[username] ?? '' },
    ...(payload ? { payload } : {}),
  });
}
function binding() {
  const { profileId, profileRevisionId, profileHash } = generationTarget;
  return { profileId, profileRevisionId, profileHash, commandId: randomUUID() };
}
function command(view: PackageDraftView) {
  return {
    commandId: randomUUID(),
    expectedRevision: view.draft.revision,
    expectedHash: view.hash,
  };
}
function proposed(plan: unknown = generationPlan()): PackageDraftView {
  const queued = service.generate(actor, binding());
  assert.equal(service.claim()?.id, queued.draft.id);
  service.complete({
    id: queued.draft.id,
    failed: false,
    output: plan,
    inputTokens: 100,
    outputTokens: 50,
  });
  return service.get(actor, queued.draft.id);
}
function acceptAll(view: PackageDraftView): PackageDraftView {
  for (const position of view.draft.plan!.positions)
    view = service.review(actor, view.draft.id, {
      ...command(view),
      position,
      decision: 'accepted',
    });
  return view;
}
function preparationCommand(view: PackageDraftView): ReviewPreparation {
  return {
    ...command(view),
    preparation: {
      sharedEvidence: [{ claimId: 'shared-route', status: 'fact' }],
      exercisedPlanSourceId: 'test-plan',
    },
    roles: view.draft.plan!.roles.map(({ roleId, briefingEvidence }) => ({
      roleId,
      briefingEvidence: [
        ...briefingEvidence,
        ...(roleId === 'internal-it' ? [{ claimId: 'restore', status: 'unknown' as const }] : []),
      ],
    })),
  };
}

test('preparation review invalidates every acceptance persists and rejects stale or frozen edits', async () => {
  let view = acceptAll(proposed());
  const old = command(view);
  const input = preparationCommand(view);
  const profileBefore = store.profile(
    generationTarget.profileId,
    generationTarget.profileRevisionId,
  );
  const url = `/api/packages/${view.draft.id}/preparation`;
  assert.equal((await query(url, input, 'player-it')).statusCode, 403);
  const response = await query(url, input);
  assert.equal(response.statusCode, 200, response.body);
  view = response.json();
  assert.deepEqual(view.draft.reviews, Array(5).fill('pending'));
  assert.equal((await query(url, input)).json().draft.revision, view.draft.revision);
  assert.equal((await query(url, { ...input, commandId: randomUUID() })).statusCode, 409);
  assert.throws(() => service.freeze(actor, view.draft.id, old), /changed/);
  assert.throws(() => service.freeze(actor, view.draft.id, command(view)), /accept all five/);
  assert.deepEqual(
    store.profile(generationTarget.profileId, generationTarget.profileRevisionId),
    profileBefore,
  );
  assert.equal(view.preview!.briefing.gaps[0]!.disposition, 'exercise-assumption');
  assert.match(view.preview!.briefing.gaps[0]!.description, /Synthetic draft BCP.*PROPOSAL/);
  assert.match(view.preview!.roles[2]!.briefing, /UNKNOWN.*restore-tested/);
  assert.ok(!view.preview!.injects[0]!.roleBodies![2]!.body.includes('IT_ONLY'));
  assert.ok(view.preview!.injects[0]!.groundingClaimIds!.includes('it'));
  view = acceptAll(view);
  view = service.freeze(actor, view.draft.id, command(view));
  assert.equal((await query(url, preparationCommand(view))).statusCode, 409);
  const reopened = new Store(join(directory, 'ttx.sqlite'));
  try {
    assert.deepEqual(reopened.generation.get(view.draft.id)!.draft.preparation, input.preparation);
  } finally {
    reopened.close();
  }
});

test('preparation rejects invalid plan source role coverage and changed knowledge states', async () => {
  const view = proposed();
  const url = `/api/packages/${view.draft.id}/preparation`;
  for (const id of ['not-a-source', 'test-source']) {
    const input = preparationCommand(view);
    input.preparation.exercisedPlanSourceId = id;
    assert.equal((await query(url, input)).statusCode, 400);
  }
  for (const claimId of ['missing', 'restore', 'target', 'comparison']) {
    const input = preparationCommand(view);
    input.preparation.sharedEvidence = [{ claimId, status: 'fact' }];
    assert.equal((await query(url, input)).statusCode, 400);
  }
  const rolePromotion = preparationCommand(view);
  rolePromotion.roles[2]!.briefingEvidence = [{ claimId: 'restore', status: 'fact' }];
  assert.equal((await query(url, rolePromotion)).statusCode, 400);
  const missingRole = preparationCommand(view);
  missingRole.roles[2] = missingRole.roles[0]!;
  assert.equal((await query(url, missingRole)).statusCode, 409);
  assert.equal(service.get(actor, view.draft.id).draft.revision, view.draft.revision);
});

test('preparation shared Step 0 references do not disclose role knowledge or future injects', async () => {
  let view = proposed();
  view = service.reviewPreparation(actor, view.draft.id, preparationCommand(view));
  view = acceptAll(view);
  view = service.freeze(actor, view.draft.id, command(view));
  const root = `/api/tracks/technical/runs/${view.draft.runId}`;
  for (const player of packagePlayers) {
    const response = await query(`${root}/briefing`, undefined, player.actorId);
    assert.equal(response.statusCode, 200);
    const briefing = response.json();
    assert.equal(briefing.step0Status, 'pending');
    assert.match(briefing.references.join(' '), /SHARED_ROUTE/);
    assert.match(briefing.references.join(' '), /EXERCISE ASSUMPTION.*PROPOSAL/);
    assert.doesNotMatch(
      response.body,
      /IT_ONLY|ENGINEERING_ONLY|LEADERSHIP_ONLY|restore-tested|simulated user report|evaluationCriteria/,
    );
    assert.deepEqual((await query(`${root}/inbox`, undefined, player.actorId)).json(), []);
  }
  const review = (await query(`${root}/review`)).json();
  assert.equal(
    (
      await query(`${root}/start`, {
        idempotencyKey: randomUUID(),
        expectedRunRevision: review.run.revision,
        packageHash: review.packageHash,
        assignmentHash: review.assignmentHash,
        acknowledgeBriefing: true,
        acknowledgeGaps: true,
        acknowledgeSimulation: true,
      })
    ).statusCode,
    409,
  );
  const ready = await query(`${root}/step0`, {
    idempotencyKey: randomUUID(),
    expectedRunRevision: review.run.revision,
    packageHash: review.packageHash,
    assignmentHash: review.assignmentHash,
    respondentIds: packagePlayers.map((player) => player.actorId),
    firstContact: 'Facilitator',
    contactRoute: 'Reviewed synthetic reference',
    fallback: 'Record a gap',
    decision: 'ready',
    rationale: 'References reviewed by all roles.',
  });
  assert.equal(ready.statusCode, 200, ready.body);
  const markers = ['LEADERSHIP_ONLY', 'ENGINEERING_ONLY', 'IT_ONLY'];
  for (const [index, player] of packagePlayers.entries()) {
    const response = await query(`${root}/briefing`, undefined, player.actorId);
    assert.ok(response.body.includes(markers[index]!));
    for (const other of markers.filter((_, i) => i !== index))
      assert.ok(!response.body.includes(other));
    if (player.actorId === 'player-it') assert.match(response.body, /UNKNOWN.*restore-tested/);
    else assert.doesNotMatch(response.body, /restore-tested/);
  }
});
function database(fn: (db: DatabaseSync) => void) {
  const db = new DatabaseSync(join(directory, 'ttx.sqlite'));
  try {
    fn(db);
  } finally {
    db.close();
  }
}

test('generation binding rejects every non-pinned profile ID revision and hash', async () => {
  for (const changed of [
    { profileId: 'example-sme-01' },
    { profileRevisionId: 'profile-r1' },
    { profileHash: 'a'.repeat(64) },
  ]) {
    const response = await query('/api/packages', { ...binding(), ...changed });
    assert.equal(response.statusCode, 409, response.body);
  }
  assert.equal(store.generation.list().length, 0);
  assert.equal((await query('/api/packages', binding())).statusCode, 200);
});
test('generation requires the exact current confirmation', () => {
  database((db) =>
    db.prepare('DELETE FROM confirmations WHERE profile_id=?').run(generationTarget.profileId),
  );
  assert.throws(() => service.generate(actor, binding()), /current and confirmed/);
  store.saveConfirmation(
    generationTarget.profileId,
    generationTarget.profileRevisionId,
    'a'.repeat(64),
    actor,
  );
  assert.throws(() => service.generate(actor, binding()), /current and confirmed/);
  database((db) => {
    db.prepare('UPDATE confirmations SET content_hash=? WHERE profile_id=?').run(
      generationTarget.profileHash,
      generationTarget.profileId,
    );
    db.exec('PRAGMA foreign_keys=OFF');
    db.prepare('UPDATE profiles SET current_revision=? WHERE id=?').run(
      'later-revision',
      generationTarget.profileId,
    );
  });
  assert.throws(() => service.generate(actor, binding()), /current and confirmed/);
});
test('generation provider binding cannot substitute a different profile', () => {
  const plan = generationPlan();
  plan.profileHash = 'a'.repeat(64);
  assert.throws(() => validateGeneratedPlan(plan, generationProfile, generationTarget), /binding/);
});
test('generation authority requires facilitator profile membership and draft ownership', () => {
  const view = proposed();
  const other: Actor = {
    id: 'other-reviewer',
    displayName: 'Other test reviewer',
    role: 'facilitator',
  };
  store.addActor(other, other.id, 'a'.repeat(64));
  assert.throws(() => service.generate(other, binding()), /cannot use that confirmed profile/);
  database((db) =>
    db.prepare('INSERT INTO reviewers VALUES (?,?)').run(other.id, generationTarget.profileId),
  );
  assert.throws(() => service.get(other, view.draft.id), /cannot read that package draft/);
  // Role checks must not be replaced by owner/profile membership alone.
  assert.throws(
    () => service.get({ ...actor, role: 'participant' }, view.draft.id),
    /facilitator-only/,
  );
});
test('generation rejects invented and incorrectly typed entities', () => {
  const changes: ((plan: GeneratedPlan) => void)[] = [
    (p) => {
      p.roles[0]!.personIds = ['invented-person'];
    },
    (p) => {
      p.roles[0]!.personIds = ['fs'];
    },
    (p) => {
      p.scenario.systemId = 'invented-system';
    },
    (p) => {
      p.scenario.serviceId = 'invented-service';
    },
    (p) => {
      p.facilitatorSupplierIds[0] = 'invented-supplier';
    },
  ];
  for (const change of changes) {
    const plan = generationPlan();
    change(plan);
    assert.throws(
      () => validateGeneratedPlan(plan, generationProfile, generationTarget),
      /organisation reference/,
    );
  }
});
test('generation rejects unknown claims and knowledge-state promotion', () => {
  for (const claimId of ['not-in-profile', 'restore', 'comparison', 'target']) {
    const plan = generationPlan();
    plan.positions[0]!.messages[0]!.evidence = [{ claimId, status: 'fact' }];
    assert.throws(
      () => validateGeneratedPlan(plan, generationProfile, generationTarget),
      /claim|knowledge state/,
    );
  }
  const plan = generationPlan();
  plan.positions[0]!.messages[0]!.evidence = [
    { claimId: 'restore', status: 'unknown' },
    { claimId: 'comparison', status: 'conflict' },
    { claimId: 'target', status: 'proposal' },
  ];
  const view = proposed(plan);
  assert.match(view.preview!.injects[0]!.roleBodies![0]!.body, /UNKNOWN.*restore-tested/);
  assert.match(view.preview!.injects[0]!.roleBodies![0]!.body, /CONFLICT.*rto-hours/);
  assert.match(view.preview!.injects[0]!.roleBodies![0]!.body, /PROPOSAL.*rto-hours/);
});
test('generation bounded schema rejects agent alerts corrupt backups arbitrary prose and branches', () => {
  for (const event of ['agent-alert', 'backups-corrupt', 'successful-restoration']) {
    const plan = generationPlan();
    Object.assign(plan.positions[0]!, { event });
    assert.throws(() => validateGeneratedPlan(plan, generationProfile, generationTarget), /schema/);
  }
  for (const extra of [
    { body: 'An invented supplier reported backup corruption.' },
    { branches: [] },
  ]) {
    const plan = generationPlan();
    Object.assign(plan.positions[0]!, extra);
    assert.throws(() => validateGeneratedPlan(plan, generationProfile, generationTarget), /schema/);
  }
});
test('generation provider schema omits unsupported uniqueness but the application still rejects duplicates', () => {
  assert.ok(!JSON.stringify(codexOutputSchema(GeneratedPlanSchema)).includes('uniqueItems'));
  assert.ok(JSON.stringify(GeneratedPlanSchema).includes('uniqueItems'));
  const plan = generationPlan();
  plan.objectives[1] = plan.objectives[0]!;
  assert.throws(() => validateGeneratedPlan(plan, generationProfile, generationTarget), /schema/);
});
test('generation enforces TE-FS01 dependency reference time role coverage and decision sequence', () => {
  const badProfile = structuredClone(generationProfile);
  badProfile.environment!.claims.find((c) => c.id === 'dependency')!.status = 'assumption';
  assert.throws(
    () => validateGeneratedPlan(generationPlan(), badProfile, generationTarget),
    /dependency/,
  );
  const wrongSupplier = structuredClone(generationProfile);
  wrongSupplier.environment!.entities.find((entity) => entity.id === 'msp')!.name =
    'Different test supplier';
  assert.throws(
    () => validateGeneratedPlan(generationPlan(), wrongSupplier, generationTarget),
    /facilitator represents/,
  );
  const changes: ((p: GeneratedPlan) => void)[] = [
    (p) => {
      p.scenario.referenceClaimId = 'it';
    },
    (p) => {
      p.roles[1]!.roleId = 'business-leadership';
    },
    (p) => {
      p.roles[1]!.personIds = ['ethan'];
    },
    (p) => {
      p.positions[1]!.messages[1]!.roleId = 'business-leadership';
    },
    (p) => {
      p.positions[0]!.decision = null;
    },
    (p) => {
      p.positions[1]!.elapsedMinutes = 0;
    },
    (p) => {
      p.positions[1]!.evaluationCriteria = ['preserve-evidence'];
    },
  ];
  for (const change of changes) {
    const plan = generationPlan();
    change(plan);
    assert.throws(() => validateGeneratedPlan(plan, generationProfile, generationTarget));
  }
});
test('generation disabled queue and claim preserve manual review', () => {
  const view = proposed();
  const disabled = new GenerationService(store, generationTarget);
  assert.throws(() => disabled.generate(actor, binding()), /disabled/);
  assert.equal(disabled.claim(), null);
  assert.equal(disabled.context(actor).ready, false);
  assert.equal(
    disabled.review(actor, view.draft.id, {
      ...command(view),
      position: view.draft.plan!.positions[0]!,
      decision: 'accepted',
    }).draft.reviews[0],
    'accepted',
  );
});
test('generation proposals stay private until all exact injects are accepted and frozen', async () => {
  let view = proposed();
  assert.equal(view.draft.status, 'review');
  assert.deepEqual(view.draft.reviews, Array(5).fill('pending'));
  assert.equal(view.draft.runId, null);
  assert.match(view.preview!.injects[0]!.expectedActions![0]!, /^Record the decision/);
  for (const player of packagePlayers) {
    assert.equal((await query('/api/packages', undefined, player.actorId)).statusCode, 403);
    assert.equal(
      (await query(`/api/packages/${view.draft.id}`, undefined, player.actorId)).statusCode,
      403,
    );
    assert.equal(
      (await query(`/api/packages/${view.draft.id}/freeze`, command(view), player.actorId))
        .statusCode,
      403,
    );
    assert.equal((await query('/api/tracks/technical/runs', undefined, player.actorId)).body, '[]');
  }
  assert.throws(() => service.freeze(actor, view.draft.id, command(view)), /accept all five/);
  view = acceptAll(view);
  view = service.review(actor, view.draft.id, {
    ...command(view),
    position: view.draft.plan!.positions[3]!,
    decision: 'rejected',
  });
  assert.throws(() => service.freeze(actor, view.draft.id, command(view)), /accept all five/);
  view = service.review(actor, view.draft.id, {
    ...command(view),
    position: view.draft.plan!.positions[3]!,
    decision: 'accepted',
  });
  const freeze = command(view);
  const frozen = service.freeze(actor, view.draft.id, freeze);
  assert.equal(frozen.draft.status, 'frozen');
  assert.equal(service.freeze(actor, view.draft.id, freeze).hash, frozen.hash);
  assert.equal(frozen.preview!.profileHash, generationTarget.profileHash);
  assert.throws(
    () =>
      service.review(actor, view.draft.id, {
        ...command(frozen),
        position: view.draft.plan!.positions[0]!,
        decision: 'pending',
      }),
    /under review/,
  );
});
test('generation edit invalidates acceptance and stale package approval', () => {
  let view = acceptAll(proposed());
  const stale = command(view);
  const position = structuredClone(view.draft.plan!.positions[0]!);
  position.messages[0]!.questions = ['preserve-evidence'];
  view = service.review(actor, view.draft.id, { ...command(view), position, decision: 'pending' });
  assert.equal(view.draft.reviews[0], 'pending');
  assert.throws(() => service.freeze(actor, view.draft.id, stale), /changed/);
  assert.throws(() => service.freeze(actor, view.draft.id, command(view)), /accept all five/);
  assert.throws(
    () => service.review(actor, view.draft.id, { ...stale, position, decision: 'accepted' }),
    /changed/,
  );
});
test('generation invalid or late provider completion never approves or releases', () => {
  const view = proposed({ malicious: 'raw prose' });
  assert.equal(view.draft.status, 'failed');
  assert.equal(view.preview, null);
  assert.equal(
    service.complete({
      id: view.draft.id,
      failed: false,
      output: generationPlan(),
      inputTokens: 1,
      outputTokens: 1,
    }).saved,
    false,
  );
  assert.equal(store.generation.get(view.draft.id)!.draft.status, 'failed');
});
test('generation request replay is single-call and worker recovery retains failure', () => {
  const input = binding();
  const view = service.generate(actor, input);
  assert.equal(service.generate(actor, input).draft.id, view.draft.id);
  assert.throws(() => service.generate(actor, binding()), /pending/);
  assert.equal(service.claim()!.id, view.draft.id);
  assert.equal(service.claim(), null);
  store.transaction(() => store.generation.recover());
  assert.equal(service.get(actor, view.draft.id).draft.status, 'failed');
  assert.equal(service.claim(), null);
});
test('generation prompt contains only confirmed profile packet not intake source documents', () => {
  const prompt = generationPrompt(generationProfile, generationTarget);
  const packet = JSON.parse(prompt.split('CONFIRMED PROFILE PACKET: ')[1]!);
  assert.deepEqual(Object.keys(packet), ['target', 'organisationName', 'environment', 'sources']);
  assert.equal(packet.target.profileHash, generationTarget.profileHash);
  assert.equal(packet.sources[0].title, 'Synthetic generation test');
  assert.equal(packet.sources[0].units, undefined);
  assert.equal(packet.sources[0].content, undefined);
});
test('generation engine refuses an unpublished or altered frozen package', async () => {
  const view = proposed();
  const definition = compileGeneratedPackage(view.draft, generationProfile);
  store.exercises.seedPackage(definition);
  store.exercises.seedRun('unpublished', definition, [
    { actorId: actor.id, displayName: actor.displayName, kind: 'facilitator', roleId: null },
    ...packagePlayers.map((p) => ({ ...p, displayName: p.roleId, kind: 'participant' as const })),
  ]);
  assert.equal((await query('/api/tracks/technical/runs/unpublished/review')).statusCode, 409);
  assert.equal(
    (await query('/api/tracks/technical/runs/unpublished/briefing', undefined, 'player-it'))
      .statusCode,
    409,
  );
});
test('generation engine contract rejects missing fields and mismatched role bodies', () => {
  const definition = proposed().preview!;
  const missing = structuredClone(definition);
  delete missing.injects[0]!.expectedActions;
  assert.throws(() => readPackage(missing), /content is incomplete/);
  const wrongRole = structuredClone(definition);
  wrongRole.injects[0]!.roleBodies![0]!.roleId = 'another-role';
  assert.throws(() => readPackage(wrongRole), /exact recipient roles/);
});
test('generation frozen content hash rejects a rehashed storage edit', async () => {
  const accepted = acceptAll(proposed());
  const frozen = service.freeze(actor, accepted.draft.id, command(accepted));
  const changed = structuredClone(frozen.preview!);
  changed.injects[0]!.title = 'Altered after package approval';
  const payload = JSON.stringify(changed);
  database((db) =>
    db
      .prepare('UPDATE exercise_packages SET payload=?,content_hash=? WHERE id=?')
      .run(payload, contentHash(payload), changed.id),
  );
  assert.equal(
    (await query(`/api/tracks/technical/runs/${frozen.draft.runId}/review`)).statusCode,
    409,
  );
});
test('generation five positions deliver only each role body and retain the existing response closure loop', async () => {
  const accepted = acceptAll(proposed());
  const frozen = service.freeze(actor, accepted.draft.id, command(accepted));
  const root = `/api/tracks/technical/runs/${frozen.draft.runId}`;
  const review = async (): Promise<Review> => {
    const response = await query(`${root}/review`);
    assert.equal(response.statusCode, 200, response.body);
    return response.json();
  };
  const post = async (action: string, extra: object) => {
    const response = await query(`${root}/${action}`, {
      expectedRunRevision: (await review()).run.revision,
      idempotencyKey: randomUUID(),
      ...extra,
    });
    assert.equal(response.statusCode, 200, response.body);
    return response.json();
  };
  const initial = await review();
  await post('step0', {
    packageHash: initial.packageHash,
    assignmentHash: initial.assignmentHash,
    respondentIds: packagePlayers.map((p) => p.actorId),
    firstContact: 'Facilitator simulates contact.',
    contactRoute: 'Synthetic arrangement.',
    fallback: 'Facilitator represents the alternate.',
    decision: 'ready',
    rationale: 'Three synthetic role representatives.',
  });
  const markers = ['LEADERSHIP_ONLY', 'ENGINEERING_ONLY', 'IT_ONLY'];
  for (const [index, player] of packagePlayers.entries()) {
    const briefing = await query(`${root}/briefing`, undefined, player.actorId);
    assert.equal(briefing.statusCode, 200, briefing.body);
    assert.ok(briefing.body.includes(markers[index]!));
    for (const other of markers.filter((_, i) => i !== index))
      assert.ok(!briefing.body.includes(other));
    assert.equal((await query(`${root}/review`, undefined, player.actorId)).statusCode, 403);
  }
  await post('start', {
    packageHash: initial.packageHash,
    assignmentHash: initial.assignmentHash,
    acknowledgeBriefing: true,
    acknowledgeGaps: true,
    acknowledgeSimulation: true,
  });
  for (let position = 0; position < 5; position++) {
    const view = await review(),
      inject = view.package.injects[position]!;
    const approval = await post('approvals', {
      packageHash: view.packageHash,
      injectId: inject.id,
      injectRevisionId: inject.revisionId,
      contentHash: view.nextInject!.contentHash,
      recipientIds: packagePlayers.map((p) => p.actorId),
    });
    const release = await post('releases', { approvalId: approval.id });
    for (const [index, player] of packagePlayers.entries()) {
      const response = await query(`${root}/inbox`, undefined, player.actorId);
      assert.equal(response.statusCode, 200, response.body);
      const inbox = response.json();
      assert.equal(inbox.length, position + 1);
      const item = inbox[position];
      assert.equal(item.body, inject.roleBodies!.find((m) => m.roleId === player.roleId)!.body);
      assert.ok(item.body.includes(markers[index]!));
      for (const other of markers.filter((_, i) => i !== index))
        assert.ok(!response.body.includes(other));
      assert.ok(!response.body.includes('evaluationCriteria'));
      assert.ok(!response.body.includes('facilitatorNotes'));
      assert.ok(!response.body.includes('groundingClaimIds'));
    }
    const answer = await query(
      `${root}/team-responses`,
      {
        expectedRunRevision: (await review()).run.revision,
        idempotencyKey: randomUUID(),
        releaseId: release.id,
        previousResponseId: null,
        actions: 'Synthetic team proposal with all three roles consulted.',
        rationale: 'Test response, not an observed real action.',
        informationRequests: 'Ask the facilitator for missing evidence.',
      },
      'player-it',
    );
    assert.equal(answer.statusCode, 200, answer.body);
    const disposition = await post('dispositions', {
      releaseId: release.id,
      responseId: answer.json().id,
      decision: 'reviewed',
      observations: 'Controlled test reviewed.',
      unresolvedGaps: 'Restore capability remains unknown.',
    });
    await post('closures', {
      releaseId: release.id,
      dispositionId: disposition.id,
      rationale: 'Facilitator closure for this controlled test.',
    });
  }
  await post('complete', {
    rationale: 'All five positions delivered and closed in the deterministic test.',
  });
  assert.equal((await review()).run.state, 'completed');
});
