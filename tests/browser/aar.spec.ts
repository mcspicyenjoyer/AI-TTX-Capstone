import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { test, expect, login, fits } from './exercise-fixture.js';
import { Store } from '../../src/server/storage.js';
import { AarService } from '../../src/server/aar-service.js';
import { RecordReportService } from '../../src/server/record-report-service.js';
import { prepareInterpretationRun } from '../interpretation-fixture.js';
import { fakeAar } from '../aar-fixture.js';
import { generationProfile } from '../generation-fixture.js';

test.use({ subscriptionEnabled: true, generationEnabled: true });
test('AAR draft is bound to snapshot, quoted and facilitator-reviewed with unassigned proposals on desktop and mobile', async ({
  page,
  browser,
  exerciseServer,
  baseURL,
}, testInfo) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const context = prepareInterpretationRun(store, true),
      service = new AarService(store, true);
    const snapshot = new RecordReportService(store).capture(
      context.actor,
      context.runId,
      randomUUID(),
    );
    const before = context.outcomes.review(context.actor, 'technical', context.runId);
    await login(page, 'facilitator');
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    await page.getByRole('tab', { name: 'Record report', exact: true }).click();
    const workspace = page.getByRole('region', { name: 'AAR workspace', exact: true });
    await expect(workspace).toContainText(snapshot.hash);
    await workspace.getByRole('button', { name: 'Draft AAR', exact: true }).click();
    await expect(workspace).toContainText('Status: queued');
    const job = service.claim()!;
    expect(job.snapshot).toEqual(snapshot);
    const output = fakeAar(snapshot);
    output.improvementActions[0]!.proposal =
      '<script>window.aarInjected=true</script> Review the evidence requirements.';
    service.complete({ id: job.id, failed: false, output, inputTokens: 10, outputTokens: 20 });
    await workspace.getByRole('button', { name: 'Refresh AAR', exact: true }).click();
    const draft = workspace.getByRole('article', { name: 'After-action review draft' });
    await expect(draft).toContainText('Unreviewed draft');
    await expect(draft.locator('.aar-finding')).toHaveCount(6);
    expect(
      await draft
        .locator('.aar-finding')
        .evaluateAll((nodes) => nodes.every((node) => node.querySelector('.record-citation'))),
    ).toBe(true);
    expect(await page.evaluate(() => 'aarInjected' in window)).toBe(false);
    await expect(draft.getByRole('cell', { name: 'Unassigned owner', exact: true })).toHaveText('');
    await draft.getByRole('button', { name: 'Edit draft', exact: true }).click();
    await draft
      .getByLabel('Improvement proposal 1', { exact: true })
      .fill('Document the agreed evidence requirements before the next exercise.');
    await draft
      .getByLabel('AAR review rationale', { exact: true })
      .fill('Reviewed against the fixed app snapshot.');
    await expect(draft.getByRole('button', { name: 'Accept AAR', exact: true })).toBeDisabled();
    await draft.getByRole('button', { name: 'Save AAR edits', exact: true }).click();
    await expect(draft).toContainText('Facilitator-reviewed: edit');
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 960 });
      await draft.scrollIntoViewIfNeeded();
      await fits(page);
      await page.screenshot({ path: testInfo.outputPath('aar-' + width + '.png') });
      await draft
        .getByRole('region', { name: 'Proposed improvement actions' })
        .scrollIntoViewIfNeeded();
      await fits(page);
      await page.screenshot({ path: testInfo.outputPath('aar-actions-' + width + '.png') });
    }
    expect(context.outcomes.review(context.actor, 'technical', context.runId)).toEqual(before);
    const participant = await browser.newPage({ baseURL });
    try {
      await login(participant, 'player-it');
      const result = await participant.request.get(
        '/api/tracks/technical/runs/' + context.runId + '/aars',
      );
      expect(result.status()).toBe(403);
      expect(await result.text()).not.toContain('agreed evidence');
      await expect(
        participant.getByRole('heading', { name: 'Participant workspace', exact: true }),
      ).toBeVisible();
      await expect(
        participant.getByRole('region', { name: 'AAR workspace', exact: true }),
      ).toHaveCount(0);
    } finally {
      await participant.close();
    }
  } finally {
    store.close();
  }
});

test('manual AAR adds a cited finding for an objective whose positions closed unanswered', async ({
  page,
  exerciseServer,
}) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const context = prepareInterpretationRun(store, true, undefined, [2, 3, 4, 5]);
    const snapshot = new RecordReportService(store).capture(
      context.actor,
      context.runId,
      randomUUID(),
    );
    const disposition = snapshot.report.records.find(
      (r) => r.kind === 'disposition' && r.position === 2,
    )!;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await login(page, 'facilitator');
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    await page.getByRole('tab', { name: 'Record report', exact: true }).click();
    const workspace = page.getByRole('region', { name: 'AAR workspace', exact: true });
    await workspace.getByRole('button', { name: 'New manual AAR', exact: true }).click();
    await expect(workspace).toContainText('Status: manual');
    const objective = workspace.getByRole('region', {
      name: 'AAR minimum-continuity',
      exact: true,
    });
    await objective.getByRole('button', { name: 'Add strength', exact: true }).click();
    const finding = objective.locator('.aar-finding');
    await expect(finding).toHaveCount(1);
    await expect(finding.getByLabel('Finding category')).toHaveValue('facilitator-observation');
    await expect(finding.getByLabel(/^Record/)).toHaveValue(disposition.id);
    await finding
      .getByLabel('Exact excerpt', { exact: true })
      .fill(disposition.fields.find((f) => f.label === 'observations')!.value);
    await workspace
      .getByLabel('AAR review rationale', { exact: true })
      .fill('Manual finding for an objective closed without a team response.');
    await workspace.getByRole('button', { name: 'Save manual AAR', exact: true }).click();
    await expect(workspace).toContainText('Facilitator-reviewed: override');
    expect(errors).toEqual([]);
  } finally {
    store.close();
  }
});

test('failed AAR leaves a manual draft and future clarification log never backfills a completed run', async ({
  page,
  exerciseServer,
}) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const context = prepareInterpretationRun(store, true),
      service = new AarService(store, true);
    new RecordReportService(store).capture(context.actor, context.runId, randomUUID());
    await login(page, 'facilitator');
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    await expect(page.getByRole('region', { name: 'Facilitator clarification log' })).toHaveCount(
      0,
    );
    await page.getByRole('tab', { name: 'Record report', exact: true }).click();
    const workspace = page.getByRole('region', { name: 'AAR workspace', exact: true });
    await workspace.getByRole('button', { name: 'Draft AAR', exact: true }).click();
    await expect(workspace).toContainText('Status: queued');
    const job = service.claim()!;
    service.complete({ id: job.id, failed: true, output: null, inputTokens: -1, outputTokens: -1 });
    await workspace.getByRole('button', { name: 'Refresh AAR', exact: true }).click();
    await expect(workspace).toContainText('Input tokens: unknown');
    await workspace.getByRole('button', { name: 'New manual AAR', exact: true }).click();
    await expect(workspace).toContainText('Status: manual');
    await workspace
      .getByLabel('AAR review rationale', { exact: true })
      .fill('Manual continuation after provider failure.');
    await workspace.getByRole('button', { name: 'Save manual AAR', exact: true }).click();
    await expect(workspace).toContainText('Facilitator-reviewed: override');
    expect(service.list(context.actor, context.runId).remainingCalls).toBe(2);
  } finally {
    store.close();
  }
});

test('facilitator records future active-position clarification and unknown without participant delivery', async ({
  page,
  exerciseServer,
}) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const context = prepareInterpretationRun(store),
      before = context.exercises.inbox(context.player, 'technical', context.runId);
    await login(page, 'facilitator');
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    const panel = page.getByRole('region', { name: 'Facilitator clarification log', exact: true });
    await panel.getByLabel('Not known at this time', { exact: true }).check();
    await panel.getByRole('button', { name: 'Record clarification', exact: true }).click();
    await expect(panel.locator('.report-record')).toHaveCount(1);
    await panel.getByLabel('Not known at this time', { exact: true }).uncheck();
    await panel
      .getByLabel('Clarification answer', { exact: true })
      .fill(
        'The cited profile claim is the current discussion source; no executed action is asserted.',
      );
    await panel
      .getByLabel('Confirmed claim IDs', { exact: true })
      .fill(generationProfile.environment!.claims[0]!.id);
    await panel.getByRole('button', { name: 'Record clarification', exact: true }).click();
    await expect(panel.locator('.report-record')).toHaveCount(2);
    expect(store.clarifications.list(context.runId).every((r) => r.position === 1)).toBe(true);
    expect(context.exercises.inbox(context.player, 'technical', context.runId)).toEqual(before);
  } finally {
    store.close();
  }
});
