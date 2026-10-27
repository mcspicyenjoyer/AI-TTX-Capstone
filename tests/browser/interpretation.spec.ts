import { join } from 'node:path';
import { test, expect, login, fits } from './exercise-fixture.js';
import { Store } from '../../src/server/storage.js';
import { InterpretationService } from '../../src/server/interpretation-service.js';
import { prepareInterpretationRun, fakeInterpretation } from '../interpretation-fixture.js';

test.use({ subscriptionEnabled: true, generationEnabled: true });
test('facilitator reviews interpretations on a completed run without changing its outcomes', async ({
  page,
  browser,
  exerciseServer,
  baseURL,
}, testInfo) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const context = prepareInterpretationRun(store, true);
    const before = context.outcomes.review(context.actor, 'technical', context.runId);
    const service = new InterpretationService(store, true);
    await login(page, 'facilitator');
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    const panel = page
      .getByRole('region', { name: 'Response interpretation', exact: true })
      .first();
    await panel.getByRole('button', { name: 'Interpret response', exact: true }).click();
    await expect(
      panel.getByText('Queued for the local interpretation worker.', { exact: true }),
    ).toBeVisible();
    const job = service.claim()!;
    expect(
      service.complete({
        id: job.id,
        failed: false,
        output: fakeInterpretation(job.input),
        inputTokens: 100,
        outputTokens: 50,
      }).saved,
    ).toBe(true);
    await page.getByRole('button', { name: 'Refresh interpretations', exact: true }).click();
    await expect(panel.getByLabel('record-owner-and-review-time coverage')).toHaveValue('partial');
    await panel
      .getByLabel('Interpretation review rationale', { exact: true })
      .fill('Reviewed against the team statement, not verified execution.');
    await panel.getByRole('button', { name: 'Accept interpretation', exact: true }).click();
    await expect(panel.locator('.badge')).toHaveText('accept');
    await panel.getByLabel('record-owner-and-review-time coverage').selectOption('present');
    await panel
      .getByLabel('Interpretation review rationale', { exact: true })
      .fill('Facilitator edit for this software test.');
    await panel.getByRole('button', { name: 'Save edited assessment', exact: true }).click();
    await expect(panel.locator('.badge')).toHaveText('edit');
    await expect(
      panel.getByRole('button', { name: 'Accept interpretation', exact: true }),
    ).toBeDisabled();
    await panel
      .getByLabel('Interpretation review rationale', { exact: true })
      .fill('Reject this test proposal.');
    await panel.getByRole('button', { name: 'Reject interpretation', exact: true }).click();
    await expect(panel.locator('.badge')).toHaveText('reject');
    await panel.getByRole('button', { name: 'Interpret response', exact: true }).click();
    const failed = service.claim()!;
    service.complete({
      id: failed.id,
      failed: true,
      output: null,
      inputTokens: -1,
      outputTokens: -1,
    });
    await page.getByRole('button', { name: 'Refresh interpretations', exact: true }).click();
    await expect(panel.getByText(/Interpretation failed/)).toBeVisible();
    await panel.getByRole('button', { name: 'New manual assessment', exact: true }).click();
    await panel
      .getByLabel('Interpretation review rationale', { exact: true })
      .fill('Manual continuation despite provider failure.');
    await panel.getByRole('button', { name: 'Record manual override', exact: true }).click();
    await expect(panel.locator('.badge')).toHaveText('override');
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 960 });
      await panel.scrollIntoViewIfNeeded();
      await fits(page);
      await page.screenshot({ path: testInfo.outputPath('interpretation-' + width + '.png') });
    }
    await page.reload();
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    await expect(
      page
        .getByRole('region', { name: 'Response interpretation', exact: true })
        .first()
        .locator('.badge'),
    ).toHaveText('override');
    expect(context.outcomes.review(context.actor, 'technical', context.runId)).toEqual(before);
    const playerContext = await browser.newContext({ baseURL });
    try {
      const participant = await playerContext.newPage();
      await login(participant, 'player-it');
      await expect(
        participant.getByRole('heading', { name: 'Participant workspace', exact: true }),
      ).toBeVisible();
      await participant
        .getByLabel('Exercise', { exact: true })
        .selectOption('technical/' + context.runId);
      await expect(
        participant.getByRole('region', { name: 'Response interpretation', exact: true }),
      ).toHaveCount(0);
      expect(
        (
          await participant.request.get(
            '/api/tracks/technical/runs/' + context.runId + '/interpretations',
          )
        ).status(),
      ).toBe(403);
    } finally {
      await playerContext.close();
    }
  } finally {
    store.close();
  }
});

test('a revised response disables the old interpretation review', async ({
  page,
  exerciseServer,
}) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const context = prepareInterpretationRun(store),
      service = new InterpretationService(store, true);
    const view = service.request(context.actor, context.runId, {
      commandId: crypto.randomUUID(),
      releaseId: context.release.id,
      responseId: context.response.id,
      mode: 'ai',
    });
    const job = service.claim()!;
    service.complete({
      id: job.id,
      failed: false,
      output: fakeInterpretation(job.input),
      inputTokens: 1,
      outputTokens: 1,
    });
    await login(page, 'facilitator');
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    const panel = page.getByRole('region', { name: 'Response interpretation', exact: true });
    await expect(panel.getByLabel('record-owner-and-review-time coverage')).toBeEnabled();
    context.outcomes.respond(context.player, 'technical', context.runId, {
      ...context.state(),
      releaseId: context.release.id,
      previousResponseId: context.response.id,
      actions: 'Revised proposal.',
      rationale: 'New evidence needed.',
      informationRequests: '',
    });
    await page.getByRole('button', { name: 'Refresh interpretations', exact: true }).click();
    await expect(panel.locator('.badge')).toHaveText('Stale');
    await expect(panel.getByLabel('record-owner-and-review-time coverage')).toBeDisabled();
    expect(service.get(context.actor, context.runId, view.record.id).stale).toBe(true);
  } finally {
    store.close();
  }
});
