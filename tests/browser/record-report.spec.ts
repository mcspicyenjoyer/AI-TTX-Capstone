import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test, expect, login, fits } from './exercise-fixture.js';
import { Store } from '../../src/server/storage.js';
import { InterpretationService } from '../../src/server/interpretation-service.js';
import { prepareInterpretationRun, fakeInterpretation } from '../interpretation-fixture.js';
import { generationProfile } from '../generation-fixture.js';
import { evidenceText } from '../../src/server/generation-content.js';

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
    const release = store.exercises.releases(context.runId)[0]!;
    release.deliveries![0]!.body +=
      '\n' + evidenceText({ claimId: 'reference' }, generationProfile);
    const fixtureDb = new DatabaseSync(join(exerciseServer, 'ttx.sqlite'));
    try {
      fixtureDb
        .prepare('UPDATE inject_releases SET payload=? WHERE id=?')
        .run(JSON.stringify(release), release.id);
    } finally {
      fixtureDb.close();
    }
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
    const events = timeline.getByRole('region', { name: 'Exercise event records', exact: true });
    const analysis = timeline.getByRole('region', { name: 'Post-exercise analysis', exact: true });
    await expect(events.locator('.report-clock')).toHaveCount(20);
    await expect(events.getByRole('heading', { name: /Reviewed interpretation/ })).toHaveCount(0);
    await expect(analysis.locator('.report-clock')).toHaveCount(0);
    await expect(analysis.locator('.report-analysis')).toContainText(
      'Post-exercise analysis / Not an exercise event.',
    );
    const snapshot = store.recordReports.get(secondId)!.report;
    for (const record of snapshot.records.filter((r) =>
      ['release', 'response', 'disposition', 'closure'].includes(r.kind),
    )) {
      const panel = events.locator('[data-record-id="' + record.id + '"]');
      const expectedTime = ['09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00'][
        record.position! - 1
      ];
      await expect(panel.locator('.report-clock')).toContainText(
        `+${(record.position! - 1) * 30} elapsed minutes / 2026-09-28 ${expectedTime} (UTC+08:00)`,
      );
      await expect(panel.locator('p.muted')).toContainText('Recorded ');
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 960 });
      await events
        .locator('[data-record-id="' + context.response.id + '"]')
        .scrollIntoViewIfNeeded();
      await fits(page);
      await page.screenshot({ path: testInfo.outputPath('timeline-clock-' + width + '.png') });
    }
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

test('facilitator records a debrief that only a later snapshot includes', async ({
  page,
  exerciseServer,
}, testInfo) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const context = prepareInterpretationRun(store, true);
    await login(page, 'facilitator');
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    await page.getByRole('tab', { name: 'Record report', exact: true }).click();
    await page.getByRole('button', { name: 'Capture record snapshot', exact: true }).click();
    const report = page.getByRole('article', { name: 'Fixed app-record report' });
    await expect(report).toBeVisible();
    const debrief = page.getByRole('region', { name: 'Debrief', exact: true });
    const record = debrief.getByRole('button', { name: 'Record debrief', exact: true });
    const feedback = debrief.getByLabel('Participant feedback (your summary)', { exact: true });
    const design = 'No simulated supplier reply carried restore-test evidence.';
    await expect(record).toBeDisabled();
    await feedback.fill('Players wanted supplier restore evidence before deciding.');
    await expect(record).toBeDisabled();
    await debrief.getByLabel('Internal IT', { exact: true }).check();
    await debrief.getByLabel('Exercise design limitations', { exact: true }).fill(design);
    await record.click();
    await expect(debrief.locator('.report-record')).toHaveCount(1);
    await expect(debrief.locator('.report-record')).toContainText('Participants: Internal IT');
    await expect(feedback).toHaveValue('');
    // The captured snapshot is fixed; the debrief appears only in a new capture.
    await expect(report.getByText(design)).toHaveCount(0);
    await page.getByRole('button', { name: 'Capture record snapshot', exact: true }).click();
    const section = report.getByRole('region', { name: 'Post-exercise debrief', exact: true });
    await expect(section).toContainText(design);
    await report.getByRole('tab', { name: 'Timeline', exact: true }).click();
    await expect(
      report.getByRole('region', { name: 'Exercise event records', exact: true }),
    ).not.toContainText(design);
    await expect(section).toContainText(design);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 960 });
      await debrief.scrollIntoViewIfNeeded();
      await fits(page);
      await page.screenshot({ path: testInfo.outputPath('debrief-' + width + '.png') });
    }
    expect(store.debriefs.list(context.runId)).toHaveLength(1);
    expect(store.recordReports.list(context.runId, context.actor.id)).toHaveLength(2);
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

test('a hidden record report still loading does not block leaving the exercise view', async ({
  page,
  exerciseServer,
}) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const context = prepareInterpretationRun(store, true);
    // Hold the hidden Record report view's snapshot read open while the facilitator leaves.
    let finish!: () => void;
    const held = new Promise<void>((resolve) => (finish = resolve));
    await page.route('**/record-reports', async (route) => {
      if (route.request().method() === 'GET') await held;
      await route.continue();
    });
    await login(page, 'facilitator');
    const reading = page.waitForRequest(
      (request) => request.method() === 'GET' && request.url().endsWith('/record-reports'),
    );
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    await reading;
    await page.getByRole('button', { name: 'Package generation', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Package generation', exact: true })).toHaveClass(
      /selected/,
    );
    await expect(
      page.getByText('Resolve the pending request before leaving this view.'),
    ).toHaveCount(0);
    finish();
  } finally {
    store.close();
  }
});
