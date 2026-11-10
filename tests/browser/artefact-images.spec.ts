import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { test, expect, login, fits } from './exercise-fixture.js';
import { Store } from '../../src/server/storage.js';
import { GenerationService, packagePlayers } from '../../src/server/generation-service.js';
import { ArtefactImageService } from '../../src/server/artefact-image-service.js';
import { ExerciseService } from '../../src/server/exercise-service.js';
import { generationTarget, generationPlan } from '../generation-fixture.js';
import { fakeImage } from '../artefact-image-fixture.js';
import { exerciseText } from '../../src/ui/exercise-format.js';

test.use({ subscriptionEnabled: true, generationEnabled: true });
test('generate review attach freeze and release a PowerShell image with reload and responsive rendering', async ({
  page,
  exerciseServer,
  browser,
  baseURL,
}, testInfo) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  const actor = store.loginIdentity('facilitator')!.actor;
  const generator = new GenerationService(store, generationTarget, true);
  const images = new ArtefactImageService(store, generator, true);
  let view = generator.generate(actor, { ...generationTarget, commandId: randomUUID() });
  generator.claim();
  generator.complete({
    id: view.draft.id,
    failed: false,
    output: generationPlan(),
    inputTokens: 1,
    outputTokens: 1,
  });
  const errors: string[] = [];
  const transcript = [
    "PS C:\\> Write-Output 'fictional reference'",
    'fictional reference',
    '',
    'FACT / Backup / description: quoted output only, not verified recovery',
    '',
    'Discussion:',
    '- quoted command output, not an exercise question',
    '',
    'Email from Quoted sender: not another story message',
    '  indented output with trailing spaces  ',
    '',
    'PS C:\\>',
  ].join('\n');
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', (dialog) => dialog.accept());
  try {
    await login(page, 'facilitator');
    await expect(page.locator('.sidebar-bottom')).not.toContainText('Synthetic');
    await page.getByRole('button', { name: 'Package generation', exact: true }).click();
    await expect(
      page.locator('.preserve-lines').filter({ hasText: /^SIMULATED SCENARIO:/ }),
    ).toHaveCount(0);
    const panel = page.getByRole('region', { name: 'Story message 1 image', exact: true });
    await expect(panel.getByRole('button', { name: 'Generate image', exact: true })).toBeEnabled();
    await page.getByLabel('Story message 1 text', { exact: true }).fill('UNSAVED STORY');
    await expect(panel.getByRole('button', { name: 'Generate image', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Discard inject edits', exact: true }).click();
    const kind = page.getByLabel('Story message 1 kind', { exact: true });
    await expect(kind.locator('option[value="powershell-transcript"]')).toHaveText(
      'PowerShell transcript',
    );
    await kind.selectOption('powershell-transcript');
    await page.getByLabel('Story message 1 text', { exact: true }).fill(transcript);
    await expect(panel.getByRole('button', { name: 'Generate image', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Save edit', exact: true }).click();
    await expect(kind).toHaveValue('powershell-transcript');
    await expect(page.getByLabel('Story message 1 text', { exact: true })).toHaveValue(transcript);
    await page.getByRole('tab', { name: 'Engineering/project operations', exact: true }).click();
    const saved = page.locator('.role-message');
    const savedBody = generator
      .get(actor, view.draft.id)
      .preview!.injects[0]!.roleBodies!.find(
        (body) => body.roleId === 'engineering-projects',
      )!.body;
    const literalBody = exerciseText(savedBody).replace(/^\+0 elapsed minutes\n/, '');
    await expect(saved.locator('.exercise-text')).toHaveJSProperty('textContent', literalBody);
    await expect(saved.locator('.story-message, .fact-section, .discussion')).toHaveCount(0);
    await panel.getByRole('button', { name: 'Generate image', exact: true }).click();
    await expect(panel).toContainText('Queued for image worker.');
    const job = images.claim()!;
    expect(job.prompt).toContain('generic PowerShell console screenshot');
    expect(job.prompt).toContain(JSON.stringify(transcript));
    expect(
      images.complete({
        id: job.id,
        failed: false,
        pngBase64: fakeImage().toString('base64'),
        inputTokens: 4,
        outputTokens: 2,
      }).saved,
    ).toBe(true);
    await expect(panel).toContainText('Image ready for review.', { timeout: 10_000 });
    await expect(panel.getByRole('img')).toBeVisible();
    await panel.getByRole('button', { name: 'Attach image', exact: true }).click();
    await expect(panel).toContainText('Image attached.');
    await page.reload();
    await page.getByRole('button', { name: 'Package generation', exact: true }).click();
    await expect(panel).toContainText('Image attached.');
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await panel.scrollIntoViewIfNeeded();
      await fits(page);
      expect(
        await panel
          .getByRole('img')
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 480),
      ).toBe(true);
      const colors = await panel.getByRole('img').evaluate((img: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        return new Set(ctx.getImageData(0, 0, canvas.width, canvas.height).data).size;
      });
      expect(colors).toBeGreaterThan(4);
      await page.screenshot({ path: testInfo.outputPath(`image-review-${width}.png`) });
    }
    const downloaded = page.waitForEvent('download');
    await panel.getByRole('link', { name: 'Download Story update 1', exact: true }).click();
    expect((await downloaded).suggestedFilename()).toBe(`${job.id}.png`);
    await panel.getByRole('button', { name: 'Generate image', exact: true }).click();
    await expect(panel).toContainText('Queued for image worker.');
    const replacement = images.claim()!;
    expect(
      images.complete({
        id: replacement.id,
        failed: false,
        pngBase64: fakeImage().toString('base64'),
        inputTokens: 4,
        outputTokens: 2,
      }).saved,
    ).toBe(true);
    await expect(panel.getByRole('img')).toHaveAttribute(
      'src',
      `/api/artefact-images/${replacement.id}`,
      { timeout: 10_000 },
    );
    for (let i = 0; i < 5; i++) {
      await page.getByRole('tab', { name: new RegExp(`^${i + 1}\\.`) }).click();
      await page.getByRole('button', { name: 'Accept inject', exact: true }).click();
      await expect(page.getByRole('tab', { name: new RegExp(`^${i + 1}\\.`) })).toContainText(
        'Accepted',
      );
    }
    await page.getByRole('button', { name: 'Approve and freeze package', exact: true }).click();
    await expect(
      page.getByText('Approved and frozen / 5 of 5 injects accepted', { exact: true }),
    ).toBeVisible();
    await page.getByRole('tab', { name: /^1\./ }).click();
    await expect(page.getByRole('img')).toHaveCount(1);
    await expect(page.getByRole('img')).toHaveAttribute('src', `/api/artefact-images/${job.id}`);
    await expect(page.getByRole('button', { name: 'Attach image', exact: true })).toHaveCount(0);
    view = generator.get(actor, view.draft.id);
    const runId = view.draft.runId!,
      exercises = new ExerciseService(store);
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
      contactRoute: 'Test route',
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
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption(`technical/${runId}`);
    await page.getByRole('tab', { name: 'Engineering/project operations', exact: true }).click();
    const runPreview = page.locator('.role-message');
    await expect(runPreview.locator('.exercise-text')).toHaveJSProperty('textContent', literalBody);
    await expect(runPreview.locator('.story-message, .fact-section, .discussion')).toHaveCount(0);
    const current = exercises.review(actor, 'technical', runId),
      inject = current.package.injects[0]!;
    const approval = exercises.approve(actor, 'technical', runId, {
      ...state(),
      packageHash: current.packageHash,
      injectId: inject.id,
      injectRevisionId: inject.revisionId,
      contentHash: current.nextInject!.contentHash,
      recipientIds: packagePlayers.map((p) => p.actorId),
    });
    exercises.release(actor, 'technical', runId, { ...state(), approvalId: approval.id });
    for (const username of ['player-engineering', 'player-it']) {
      const session = await browser.newContext({ baseURL }),
        participant = await session.newPage();
      try {
        await login(participant, username);
        await participant
          .getByRole('combobox', { name: 'Exercise', exact: true })
          .selectOption(`technical/${runId}`);
        const inbox = participant.getByRole('region', { name: 'Released inbox', exact: true });
        const literal = inbox.locator('.exercise-text');
        await expect(inbox.getByRole('img')).toHaveCount(username === 'player-engineering' ? 1 : 0);
        if (username === 'player-engineering') {
          await expect(literal).toHaveJSProperty('textContent', literalBody);
          await expect(inbox.locator('.story-message, .fact-section, .discussion')).toHaveCount(0);
          await expect(inbox.locator('.image-thumb').getByRole('img')).toHaveCount(1);
          await inbox.getByRole('button', { name: 'Enlarge image', exact: true }).click();
          const dialog = participant.getByRole('dialog');
          await expect(dialog.getByRole('img')).toBeVisible();
          await dialog.getByRole('button', { name: 'Close', exact: true }).click();
          await expect(participant.getByRole('dialog')).toHaveCount(0);
        } else {
          await expect(inbox.locator('.story-message')).toHaveCount(0);
          await expect(inbox).not.toContainText(transcript);
        }
        await expect(inbox).not.toContainText('SIMULATION');
        const stored = store.exercises.releases(runId)[0]!;
        expect(stored.deliveries!.find((delivery) => delivery.body === savedBody)?.body).toBe(
          savedBody,
        );
        expect(
          stored.deliveries!.some((delivery) => delivery.body.startsWith('SIMULATION /')),
        ).toBe(true);
        const response = await participant.request.get(`/api/artefact-images/${job.id}`);
        expect(response.status()).toBe(username === 'player-engineering' ? 200 : 403);
        for (const width of [1440, 390]) {
          await participant.setViewportSize({ width, height: 1000 });
          await inbox.scrollIntoViewIfNeeded();
          await fits(participant);
          if (username === 'player-engineering') {
            await expect(inbox.getByRole('img')).toBeVisible();
            await participant.screenshot({
              path: testInfo.outputPath(`image-participant-${width}.png`),
            });
          }
        }
      } finally {
        await session.close();
      }
    }
    expect(errors).toEqual([]);
  } finally {
    store.close();
  }
});

test('failed image generation permits manual review and uncertain requests retry the exact job', async ({
  page,
  exerciseServer,
}) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const actor = store.loginIdentity('facilitator')!.actor,
      generator = new GenerationService(store, generationTarget, true);
    const images = new ArtefactImageService(store, generator, true);
    const draft = generator.generate(actor, { ...generationTarget, commandId: randomUUID() });
    generator.claim();
    generator.complete({
      id: draft.draft.id,
      failed: false,
      output: generationPlan(),
      inputTokens: 1,
      outputTokens: 1,
    });
    await login(page, 'facilitator');
    await page.getByRole('button', { name: 'Package generation', exact: true }).click();
    page.on('dialog', (dialog) => dialog.accept());
    let lost = false;
    await page.route('**/api/packages/*/images', async (route) => {
      if (lost) return route.continue();
      lost = true;
      await route.fetch();
      await route.abort('failed');
    });
    await page.getByRole('button', { name: 'Generate image', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Retry exact request', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Retry exact request', exact: true }).click();
    await expect(page.getByText('Queued for image worker.', { exact: true })).toBeVisible();
    expect(store.artefactImages.list().length).toBe(1);
    const job = images.claim()!;
    images.complete({
      id: job.id,
      failed: true,
      pngBase64: null,
      inputTokens: -1,
      outputTokens: -1,
    });
    await expect(page.getByText(/Image generation failed, returned an invalid image/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: 'Accept inject', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Accept inject', exact: true }).click();
    await expect(page.getByRole('tab', { name: /^1\./ })).toContainText('Accepted');
  } finally {
    store.close();
  }
});
