import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import type { Actor } from '../src/contracts/profile.js';
import type { PackageDraftView } from '../src/contracts/generation.js';
import { Store } from '../src/server/storage.js';
import { buildApp } from '../src/server/app.js';
import { GenerationService, packagePlayers } from '../src/server/generation-service.js';
import { ArtefactImageService } from '../src/server/artefact-image-service.js';
import { checkedPng, artefactImagePrompt } from '../src/server/artefact-image-content.js';
import { ExerciseService } from '../src/server/exercise-service.js';
import { codexImageArgs, collectCodexImage } from '../src/server/codex-images.js';
import { codexArgs } from '../src/server/codex-extraction.js';
import { generationProfile, generationTarget, generationPlan } from './generation-fixture.js';
import { fakeImage } from './artefact-image-fixture.js';

let directory: string,
  app: FastifyInstance,
  store: Store,
  generator: GenerationService,
  service: ArtefactImageService,
  actor: Actor,
  view: PackageDraftView;
let cookies: Record<string, string>;
const headers = { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' };
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'ttx-images-'));
  app = await buildApp({
    dataDirectory: directory,
    publicPort: 3000,
    packageTarget: generationTarget,
    subscriptionEnabled: true,
  });
  store = new Store(join(directory, 'ttx.sqlite'));
  actor = store.loginIdentity('facilitator')!.actor;
  store.transaction(() => store.publishIntakeProfile(structuredClone(generationProfile), actor));
  generator = new GenerationService(store, generationTarget, true);
  service = new ArtefactImageService(store, generator, true);
  view = proposed();
  const codes = {
    ...JSON.parse(readFileSync(join(directory, 'demo-access.json'), 'utf8')),
    ...JSON.parse(readFileSync(join(directory, 'demo-track-access.json'), 'utf8')),
    ...JSON.parse(readFileSync(join(directory, 'package-player-access.json'), 'utf8')),
  };
  cookies = {};
  for (const [username, accessCode] of Object.entries(codes)) {
    const result = await app.inject({
      method: 'POST',
      url: '/api/session',
      headers,
      payload: { username, accessCode },
    });
    assert.equal(result.statusCode, 200);
    cookies[username] = `ttx_session=${result.cookies[0]!.value}`;
  }
});
afterEach(async () => {
  store.close();
  await app.close();
  rmSync(directory, { recursive: true, force: true });
});
function proposed() {
  const draft = generator.generate(actor, { ...generationTarget, commandId: randomUUID() });
  generator.claim();
  generator.complete({
    id: draft.draft.id,
    failed: false,
    output: generationPlan(),
    inputTokens: 1,
    outputTokens: 1,
  });
  return generator.get(actor, draft.draft.id);
}
function command(value = view, position = 1) {
  return {
    commandId: randomUUID(),
    expectedRevision: value.draft.revision,
    expectedHash: value.hash,
    position,
    artefactIndex: 0,
  };
}
function request(url: string, payload?: object, username = 'facilitator') {
  return app.inject({
    method: payload ? 'POST' : 'GET',
    url,
    headers: { ...headers, cookie: cookies[username] ?? '' },
    ...(payload ? { payload } : {}),
  });
}
function db<T>(operation: (db: DatabaseSync) => T) {
  const db = new DatabaseSync(join(directory, 'ttx.sqlite'));
  try {
    return operation(db);
  } finally {
    db.close();
  }
}
function ready(position = 1) {
  view = service.generate(actor, view.draft.id, command(view, position));
  const job = service.claim()!;
  assert(job);
  assert.equal(
    service.complete({
      id: job.id,
      failed: false,
      pngBase64: fakeImage().toString('base64'),
      inputTokens: 20,
      outputTokens: 10,
    }).saved,
    true,
  );
  view = generator.get(actor, view.draft.id);
  return job.id;
}
function attach(id = ready(), position = 1) {
  view = service.attach(actor, view.draft.id, { ...command(view, position), imageId: id });
  return id;
}
function freeze() {
  for (const position of view.draft.plan!.positions)
    view = generator.review(actor, view.draft.id, { ...command(), position, decision: 'accepted' });
  view = generator.freeze(actor, view.draft.id, command());
}
function releaseFirst(recipients = packagePlayers.map((player) => player.actorId)) {
  const exercises = new ExerciseService(store),
    runId = view.draft.runId!;
  const state = () => ({
    idempotencyKey: randomUUID(),
    expectedRunRevision: store.exercises.run(runId)!.revision,
  });
  const context = exercises.review(actor, 'technical', runId);
  exercises.recordStep0(actor, 'technical', runId, {
    ...state(),
    packageHash: context.packageHash,
    assignmentHash: context.assignmentHash,
    respondentIds: packagePlayers.map((p) => p.actorId),
    firstContact: 'Facilitator',
    contactRoute: 'Synthetic route',
    fallback: 'Controller',
    decision: 'ready',
    rationale: 'Test only',
  });
  exercises.start(actor, 'technical', runId, {
    ...state(),
    packageHash: context.packageHash,
    assignmentHash: context.assignmentHash,
    acknowledgeBriefing: true,
    acknowledgeGaps: true,
    acknowledgeSimulation: true,
  });
  const current = exercises.review(actor, 'technical', runId),
    inject = current.package.injects[0]!;
  const approval = exercises.approve(actor, 'technical', runId, {
    ...state(),
    packageHash: current.packageHash,
    injectId: inject.id,
    injectRevisionId: inject.revisionId,
    contentHash: current.nextInject!.contentHash,
    recipientIds: recipients,
  });
  return exercises.release(actor, 'technical', runId, { ...state(), approvalId: approval.id });
}

test('image requests bind exact saved story content, require owner and AI availability, and replay without another job', async () => {
  const url = `/api/packages/${view.draft.id}/images`,
    input = command();
  assert.equal((await request(url, input, 'player-engineering')).statusCode, 403);
  assert.equal((await request(url, input, 'missing')).statusCode, 401);
  assert.throws(
    () => new ArtefactImageService(store, generator, false).generate(actor, view.draft.id, input),
    /disabled/,
  );
  const result = await request(url, input);
  assert.equal(result.statusCode, 200, result.body);
  assert.equal(result.json().imageRequests.length, 1);
  assert.equal(result.json().draft.revision, view.draft.revision);
  assert.equal((await request(url, input)).json().imageRequests.length, 1);
  assert.equal((await request(url, { ...input, position: 2 })).statusCode, 409);
  assert.throws(() => service.generate(actor, view.draft.id, command()), /already pending/);
  const job = service.claim()!;
  assert.equal(service.claim(), null);
  assert(job.prompt.includes('STORY_1: test in-story message.'));
  assert(!job.prompt.includes('STORY_2:') && !job.prompt.includes(generationTarget.profileHash));
  assert(!job.prompt.includes('expectedActions') && !job.prompt.includes('facilitatorNotes'));
  assert.throws(
    () => service.generate({ ...actor, id: 'not-owner' }, view.draft.id, command()),
    /cannot read/,
  );
});

test('PNG proposal is not attached automatically; attachment resets acceptance, persists exact bytes, and freezes immutably', async () => {
  view = generator.review(actor, view.draft.id, {
    ...command(),
    position: view.draft.plan!.positions[0]!,
    decision: 'accepted',
  });
  const id = ready();
  assert.equal(view.draft.images, undefined);
  assert.equal(view.draft.reviews[0], 'accepted');
  const input = { ...command(), imageId: id };
  const result = await request(`/api/packages/${view.draft.id}/images/attach`, input);
  assert.equal(result.statusCode, 200, result.body);
  view = result.json();
  assert.equal(view.draft.reviews[0], 'pending');
  assert.equal(view.draft.images!.length, 1);
  assert.equal(view.preview!.injects[0]!.images![0]!.id, id);
  const repeat = await request(`/api/packages/${view.draft.id}/images/attach`, input);
  assert.equal(repeat.json().draft.revision, view.draft.revision);
  const image = await request(`/api/artefact-images/${id}`);
  assert.equal(image.statusCode, 200);
  assert.equal(image.headers['content-type'], 'image/png');
  assert.equal(image.headers['cache-control'], 'no-store');
  assert.equal(checkedPng(image.rawPayload).sha256, view.draft.images![0]!.image.sha256);
  const reopened = new Store(join(directory, 'ttx.sqlite'));
  try {
    assert.deepEqual(reopened.artefactImages.bytes(id), image.rawPayload);
  } finally {
    reopened.close();
  }
  freeze();
  assert.throws(() => service.generate(actor, view.draft.id, command()), /frozen/);
  assert.throws(
    () => service.attach(actor, view.draft.id, { ...command(), imageId: null }),
    /frozen/,
  );
  assert.equal(
    service.complete({
      id,
      failed: false,
      pngBase64: fakeImage().toString('base64'),
      inputTokens: 1,
      outputTokens: 1,
    }).saved,
    false,
  );
});

test('image bytes and metadata reach only released assigned recipients; future images and other roles stay private', async () => {
  const first = attach();
  const future = attach(ready(2), 2);
  assert.equal(
    (await request(`/api/artefact-images/${first}`, undefined, 'player-engineering')).statusCode,
    403,
  );
  freeze();
  assert.equal(
    (await request(`/api/artefact-images/${first}`, undefined, 'player-engineering')).statusCode,
    403,
  );
  releaseFirst();
  const exercises = new ExerciseService(store);
  for (const player of packagePlayers) {
    const inbox = exercises.inbox(store.actor(player.actorId)!, 'technical', view.draft.runId!);
    assert.equal(inbox[0]!.images?.length, player.roleId === 'engineering-projects' ? 1 : 0);
    assert(!JSON.stringify(inbox).includes(future));
    if (player.roleId !== 'engineering-projects') assert(!JSON.stringify(inbox).includes(first));
    assert.equal(
      (await request(`/api/artefact-images/${first}`, undefined, player.actorId)).statusCode,
      player.roleId === 'engineering-projects' ? 200 : 403,
    );
    assert.equal(
      (await request(`/api/artefact-images/${future}`, undefined, player.actorId)).statusCode,
      403,
    );
  }
  assert.equal(
    (await request(`/api/artefact-images/${first}`, undefined, 'observer')).statusCode,
    403,
  );
  assert.equal(
    (await request(`/api/artefact-images/${first}`, undefined, 'missing')).statusCode,
    401,
  );
});

test('an image role that was not selected for release cannot fetch the bytes', async () => {
  const id = attach();
  freeze();
  releaseFirst(['player-it', 'player-business']);
  assert.equal(
    (await request(`/api/artefact-images/${id}`, undefined, 'player-engineering')).statusCode,
    403,
  );
});

test('text, recipient or removal edits detach stale images and refuse reattachment; manual text play remains available', () => {
  for (const field of ['text', 'recipients', 'removed']) {
    const id = attach();
    const position = structuredClone(view.draft.plan!.positions[0]!);
    if (field === 'text') position.artefacts![0]!.body += ' Changed.';
    if (field === 'recipients') position.artefacts![0]!.recipientRoleIds = ['internal-it'];
    if (field === 'removed') position.artefacts = [];
    view = generator.review(actor, view.draft.id, { ...command(), position, decision: 'pending' });
    assert.equal(view.draft.images!.length, 0);
    assert.equal(view.imageRequests!.find((job) => job.id === id)!.current, false);
    assert.throws(
      () => service.attach(actor, view.draft.id, { ...command(), imageId: id }),
      /match|Select a saved/,
    );
    if (field !== 'removed') view = proposed();
  }
  freeze();
  assert.equal(view.draft.status, 'frozen');
});

test('clock and preparation changes invalidate image approval without rewriting image bytes', () => {
  const id = attach(ready(2), 2),
    bytes = store.artefactImages.bytes(id);
  const position = structuredClone(view.draft.plan!.positions[1]!);
  position.elapsedMinutes++;
  view = generator.review(actor, view.draft.id, { ...command(), position, decision: 'pending' });
  assert.equal(view.draft.images!.length, 0);
  assert.throws(
    () => service.attach(actor, view.draft.id, { ...command(view, 2), imageId: id }),
    /does not match/,
  );
  attach();
  view = generator.reviewPreparation(actor, view.draft.id, {
    ...command(),
    preparation: { sharedEvidence: [], exercisedPlanSourceId: 'test-plan' },
    roles: view.draft.plan!.roles,
    storyline: view.draft.plan!.storyline,
  });
  assert.equal(view.draft.images!.length, 0);
  assert(view.draft.reviews.every((review) => review === 'pending'));
  assert.deepEqual(store.artefactImages.bytes(id), bytes);
});

test('changed revisions fail before claim and after completion; disabled claims never start work', () => {
  view = service.generate(actor, view.draft.id, command());
  view = generator.review(actor, view.draft.id, {
    ...command(),
    position: view.draft.plan!.positions[0]!,
    decision: 'pending',
  });
  assert.equal(service.claim(), null);
  assert.equal(store.artefactImages.list()[0]!.status, 'failed');
  view = service.generate(actor, view.draft.id, command());
  assert.equal(new ArtefactImageService(store, generator, false).claim(), null);
  const job = service.claim()!;
  view = generator.review(actor, view.draft.id, {
    ...command(),
    position: view.draft.plan!.positions[0]!,
    decision: 'pending',
  });
  assert.equal(
    service.complete({
      id: job.id,
      failed: false,
      pngBase64: fakeImage().toString('base64'),
      inputTokens: 1,
      outputTokens: 1,
    }).saved,
    false,
  );
  assert.equal(store.artefactImages.get(job.id)!.status, 'failed');
  assert.equal(store.artefactImages.get(job.id)!.inputTokens, 1);
  assert.equal(store.artefactImages.get(job.id)!.outputTokens, 1);
  assert.equal(view.draft.images, undefined);
});

test('failure, malformed image and ten-request cap preserve manual continuation and never retry automatically', () => {
  for (let i = 0; i < 10; i++) {
    view = service.generate(actor, view.draft.id, command());
    const job = service.claim()!;
    assert.equal(
      service.complete({
        id: job.id,
        failed: i % 2 === 0,
        pngBase64: i % 2 ? Buffer.from('<svg/>').toString('base64') : null,
        inputTokens: -1,
        outputTokens: -1,
      }).saved,
      false,
    );
    assert.equal(service.claim(), null);
  }
  assert.throws(() => service.generate(actor, view.draft.id, command()), /ten-image/);
  assert.equal(store.artefactImages.list().length, 10);
  assert(
    store.artefactImages.list().every((job) => job.image === null && job.inputTokens === null),
  );
  freeze();
  assert.equal(view.draft.status, 'frozen');
});

test('running image timeout and startup recovery reject late completion without a retry', async () => {
  view = service.generate(actor, view.draft.id, command());
  const job = service.claim()!;
  store.transaction(() =>
    store.artefactImages.save({
      ...store.artefactImages.get(job.id)!,
      revision: 3,
      updatedAt: new Date(Date.now() - 360_000).toISOString(),
    }),
  );
  generator.context(actor);
  assert.equal(store.artefactImages.get(job.id)!.status, 'failed');
  view = service.generate(actor, view.draft.id, command());
  const second = service.claim()!;
  await app.close();
  app = await buildApp({
    dataDirectory: directory,
    publicPort: 3000,
    packageTarget: generationTarget,
    subscriptionEnabled: true,
  });
  assert.equal(store.artefactImages.get(second.id)!.status, 'failed');
  assert.equal(
    service.complete({
      id: second.id,
      failed: false,
      pngBase64: fakeImage().toString('base64'),
      inputTokens: 1,
      outputTokens: 1,
    }).saved,
    false,
  );
});

test('cross-package images, missing bytes and tampered bytes cannot be attached, frozen or served', async () => {
  const id = ready(),
    original = view;
  view = proposed();
  assert.throws(
    () => service.attach(actor, view.draft.id, { ...command(), imageId: id }),
    /does not match/,
  );
  view = original;
  attach(id);
  db((db) =>
    db.prepare('UPDATE artefact_images SET png=? WHERE id=?').run(Buffer.from('corrupt'), id),
  );
  assert.equal((await request(`/api/artefact-images/${id}`)).statusCode, 500);
  assert.throws(freeze, /integrity failure/);
  assert.equal(generator.get(actor, view.draft.id).draft.status, 'review');
});

test('image request and acceptance roll back with failed durable writes', () => {
  db((db) =>
    db.exec(
      "CREATE TRIGGER reject_image_history BEFORE INSERT ON artefact_image_history BEGIN SELECT RAISE(ABORT, 'test failure'); END;",
    ),
  );
  assert.throws(() => service.generate(actor, view.draft.id, command()), /test failure/);
  assert.equal(store.artefactImages.list().length, 0);
  db((db) => db.exec('DROP TRIGGER reject_image_history'));
  const id = ready();
  const before = store.generation.get(view.draft.id);
  db((db) =>
    db.exec(
      "CREATE TRIGGER reject_attachment BEFORE INSERT ON package_draft_history BEGIN SELECT RAISE(ABORT, 'test failure'); END;",
    ),
  );
  assert.throws(
    () => service.attach(actor, view.draft.id, { ...command(), imageId: id }),
    /test failure/,
  );
  assert.deepEqual(store.generation.get(view.draft.id), before);
});

test('PNG validation rejects corrupt CRCs, fake images, oversized dimensions, and preserves bounded pixel content', () => {
  const png = fakeImage(),
    decoded = checkedPng(png);
  assert.equal(decoded.width, 480);
  assert.equal(decoded.height, 180);
  assert.throws(() => checkedPng(Buffer.from('<svg/>')), /PNG/);
  const corrupt = Buffer.from(png);
  corrupt[30] = corrupt[30]! ^ 1;
  assert.throws(() => checkedPng(corrupt));
  const huge = Buffer.from(png);
  huge.writeUInt32BE(100_000, 16);
  assert.throws(() => checkedPng(huge), /dimensions/);
  assert.throws(() => checkedPng(Buffer.concat([png, Buffer.from('untrusted appended metadata')])));
  const prompt = artefactImagePrompt(generationPlan().positions[0]!, 0);
  assert(prompt.includes('No "TTX ARTEFACT PREVIEW" caption'));
});

test('image CLI changes only the image capability and output schema, and collects only its exact thread PNG', async () => {
  const ordinary = codexArgs(directory),
    images = codexImageArgs(directory);
  const expected = [...ordinary];
  expected[expected.indexOf('image_generation') - 1] = '--enable';
  expected.splice(expected.indexOf('--output-schema'), 2);
  assert.deepEqual(images, expected);
  assert.equal(ordinary[ordinary.indexOf('image_generation') - 1], '--disable');
  const root = join(directory, 'generated'),
    thread = randomUUID(),
    output = join(root, thread);
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, 'call_test.png'), fakeImage());
  assert.deepEqual(await collectCodexImage(thread, root), checkedPng(fakeImage()).png);
  await assert.rejects(collectCodexImage('../escape', root), /identity/);
  await assert.rejects(collectCodexImage(randomUUID(), root));
  writeFileSync(join(output, 'second.png'), fakeImage());
  await assert.rejects(collectCodexImage(thread, root), /exactly one/);
});

test('v11 migration preserves existing package and profile bytes and adds no image records', async () => {
  const before = db((db) => ({
    profiles: db.prepare('SELECT * FROM profile_revisions').all(),
    packages: db.prepare('SELECT * FROM package_drafts').all(),
  }));
  store.close();
  await app.close();
  db((db) =>
    db.exec(
      'DROP TABLE artefact_image_history; DROP TABLE artefact_images; PRAGMA user_version=11;',
    ),
  );
  store = new Store(join(directory, 'ttx.sqlite'));
  assert.equal(
    db((db) => db.prepare('PRAGMA user_version').get()!.user_version),
    12,
  );
  assert.deepEqual(
    db((db) => ({
      profiles: db.prepare('SELECT * FROM profile_revisions').all(),
      packages: db.prepare('SELECT * FROM package_drafts').all(),
    })),
    before,
  );
  assert.deepEqual(store.artefactImages.list(), []);
});
