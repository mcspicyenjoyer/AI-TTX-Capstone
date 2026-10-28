import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { test, expect, login, fits } from './exercise-fixture.js';
import { Store } from '../../src/server/storage.js';
import { InterpretationService } from '../../src/server/interpretation-service.js';
import { prepareInterpretationRun, fakeInterpretation } from '../interpretation-fixture.js';

test.use({ subscriptionEnabled: false, generationEnabled: true });
test('facilitator captures immutable cited reports after review; participant cannot read them', async ({
  page,
  browser,
  exerciseServer,
  baseURL,
}, testInfo) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const context = prepareInterpretationRun(store, true),
      interpreter = new InterpretationService(store);
    const draft = interpreter.request(context.actor, context.runId, {
      commandId: randomUUID(),
      releaseId: context.release.id,
      responseId: context.response.id,
      mode: 'manual',
    });
    const before = context.outcomes.review(context.actor, 'technical', context.runId);
    await login(page, 'facilitator');
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    const assessment = page
      .getByRole('region', { name: 'Response interpretation', exact: true })
      .first();
    await assessment
      .getByLabel('Interpretation review rationale', { exact: true })
      .fill('Unsaved review draft.');
    await page.getByRole('tab', { name: 'Record report', exact: true }).click();
    await expect(page.getByText('No captured report.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Capture record snapshot', exact: true }).click();
    const report = page.getByRole('article', { name: 'Fixed app-record report' });
    await expect(report).toBeVisible();
    await expect(
      report.getByText(/clarification answers are outside the app record/),
    ).toBeVisible();
    await expect(report.locator('[data-record-id="' + draft.record.id + '"]')).toHaveCount(0);
    const firstId = await page.getByLabel('Snapshot', { exact: true }).inputValue();
    await page.getByRole('tab', { name: 'Run', exact: true }).click();
    await expect(
      assessment.getByLabel('Interpretation review rationale', { exact: true }),
    ).toHaveValue('Unsaved review draft.');
    await page.getByRole('tab', { name: 'Record report', exact: true }).click();
    interpreter.review(context.actor, context.runId, draft.record.id, {
      commandId: randomUUID(),
      expectedRevision: draft.record.revision,
      expectedHash: draft.hash,
      decision: 'override',
      notes: '<script>window.reportInjected=true</script> Independent review.',
      output: fakeInterpretation(draft.record.input),
    });
    await page.getByRole('button', { name: 'Capture record snapshot', exact: true }).click();
    const reviewed = report.locator('[data-record-id="' + draft.record.id + '"]');
    await expect(reviewed).toBeVisible();
    await expect(reviewed.getByRole('heading', { name: /Reviewed interpretation/ })).toBeVisible();
    await expect(reviewed.getByText(/<script>window.reportInjected/)).toBeVisible();
    expect(await page.evaluate(() => 'reportInjected' in window)).toBe(false);
    expect(
      await report
        .locator('p, dt, h2, h3, h4')
        .evaluateAll((lines) => lines.every((line) => line.querySelector('.record-citation'))),
    ).toBe(true);
    const secondId = await page.getByLabel('Snapshot', { exact: true }).inputValue();
    expect(secondId).not.toBe(firstId);
    await page.getByLabel('Snapshot', { exact: true }).selectOption(firstId);
    await expect(report.locator('[data-record-id="' + draft.record.id + '"]')).toHaveCount(0);
    await page.getByLabel('Snapshot', { exact: true }).selectOption(secondId);
    await expect(reviewed).toBeVisible();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 960 });
      await reviewed.scrollIntoViewIfNeeded();
      await fits(page);
      await page.screenshot({ path: testInfo.outputPath('record-report-' + width + '.png') });
    }
    await page.getByRole('tab', { name: 'Timeline', exact: true }).click();
    const timeline = page.getByRole('region', { name: 'Record timeline', exact: true });
    await expect(timeline.getByRole('heading', { name: /Reviewed interpretation/ })).toBeVisible();
    const sourceIds = await timeline
      .locator('[data-record-id]')
      .evaluateAll((items) => items.map((item) => item.getAttribute('data-record-id')));
    expect(sourceIds).toEqual(store.recordReports.get(secondId)!.report.timeline);
    await page.reload();
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    await page.getByRole('tab', { name: 'Record report', exact: true }).click();
    await expect(page.getByLabel('Snapshot', { exact: true })).toHaveValue(secondId);
    expect(context.outcomes.review(context.actor, 'technical', context.runId)).toEqual(before);
    expect(store.interpretations.list().filter((r) => r.startedAt)).toHaveLength(0);
    const other = await browser.newContext({ baseURL });
    try {
      const participant = await other.newPage();
      await login(participant, 'player-it');
      await expect(
        participant.getByRole('heading', { name: 'Participant workspace', exact: true }),
      ).toBeVisible();
      await expect(
        participant.getByRole('tab', { name: 'Record report', exact: true }),
      ).toHaveCount(0);
      const base = '/api/tracks/technical/runs/' + context.runId + '/record-reports';
      expect((await participant.request.get(base + '/' + secondId)).status()).toBe(403);
    } finally {
      await other.close();
    }
  } finally {
    store.close();
  }
});

test('lost snapshot response retries the exact capture without creating a duplicate', async ({
  page,
  exerciseServer,
}) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const context = prepareInterpretationRun(store, true);
    await login(page, 'facilitator');
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    await page.getByRole('tab', { name: 'Record report', exact: true }).click();
    await expect(page.getByText('No captured report.', { exact: true })).toBeVisible();
    let first = true;
    const commands: string[] = [];
    await page.route('**/record-reports', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      commands.push(route.request().postDataJSON().commandId);
      if (first) {
        first = false;
        await route.fetch();
        await route.abort();
      } else await route.continue();
    });
    await page.getByRole('button', { name: 'Capture record snapshot', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Capture record snapshot', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Retry snapshot request', exact: true }).click();
    await expect(page.getByRole('article', { name: 'Fixed app-record report' })).toBeVisible();
    expect(commands).toHaveLength(2);
    expect(commands[0]).toBe(commands[1]);
    expect(store.recordReports.list(context.runId, context.actor.id)).toHaveLength(1);
  } finally {
    store.close();
  }
});
