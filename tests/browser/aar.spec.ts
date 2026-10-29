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

for (const action of ['draft', 'snapshot', 'manual', 'ai', 'capture', 'refresh'] as const) {
  test(`unsaved AAR edits require confirmation before ${action} replacement`, async ({
    page,
    exerciseServer,
  }) => {
    const store = new Store(join(exerciseServer, 'ttx.sqlite'));
    try {
      const context = prepareInterpretationRun(store, true);
      const reports = new RecordReportService(store),
        service = new AarService(store, true);
      const first = reports.capture(context.actor, context.runId, randomUUID());
      const snapshot = reports.capture(context.actor, context.runId, randomUUID());
      const create = (mode: 'ai' | 'manual') =>
        service.request(context.actor, context.runId, {
          commandId: randomUUID(),
          snapshotId: snapshot.report.id,
          snapshotHash: snapshot.hash,
          mode,
        });
      const manual = create('manual');
      const ready = create('ai');
      const job = service.claim()!;
      service.complete({
        id: job.id,
        failed: false,
        output: fakeAar(snapshot),
        inputTokens: 10,
        outputTokens: 10,
      });
      await login(page, 'facilitator');
      await page.getByRole('button', { name: 'Exercises', exact: true }).click();
      await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
      await page.getByRole('tab', { name: 'Record report', exact: true }).click();
      const workspace = page.getByRole('region', { name: 'AAR workspace', exact: true });
      const draft = workspace.locator(':scope > label > select');
      const snapshots = page.getByLabel('Snapshot', { exact: true });
      await expect(draft).toHaveValue(ready.record.id);
      await workspace.getByRole('button', { name: 'Edit draft', exact: true }).click();
      const proposal = workspace.getByLabel('Improvement proposal 1', { exact: true });
      const owner = workspace.getByLabel('Improvement owner 1', { exact: true });
      const due = workspace.getByLabel('Improvement due date 1', { exact: true });
      const rationale = workspace.getByLabel('AAR review rationale', { exact: true });
      await proposal.fill('Unsaved evidence-review proposal.');
      await owner.selectOption({ label: 'Imran' });
      const ownerId = await owner.inputValue();
      await due.fill('2026-11-30');
      await rationale.fill('Unsaved reviewer rationale.');
      if (action === 'refresh') {
        const current = service.get(context.actor, context.runId, ready.record.id);
        service.review(context.actor, context.runId, ready.record.id, {
          commandId: randomUUID(),
          expectedRevision: current.record.revision,
          expectedHash: current.hash,
          decision: 'accept',
          notes: 'Saved review from another session.',
          output: null,
        });
      }
      const replace = () => {
        switch (action) {
          case 'draft':
            return draft.selectOption(manual.record.id);
          case 'snapshot':
            return snapshots.selectOption(first.report.id);
          case 'manual':
            return workspace.getByRole('button', { name: 'New manual AAR', exact: true }).click();
          case 'ai':
            return workspace.getByRole('button', { name: 'Draft AAR', exact: true }).click();
          case 'capture':
            return page
              .getByRole('button', { name: 'Capture record snapshot', exact: true })
              .click();
          case 'refresh':
            return workspace.getByRole('button', { name: 'Refresh AAR', exact: true }).click();
        }
      };
      const before = service.list(context.actor, context.runId);
      const saved = service.get(context.actor, context.runId, ready.record.id);
      let message = '';
      page.once('dialog', (dialog) => {
        message = dialog.message();
        void dialog.dismiss();
      });
      await replace();
      expect(message).toBe('Discard unsaved changes in this view?');
      await expect(draft).toHaveValue(ready.record.id);
      await expect(snapshots).toHaveValue(snapshot.report.id);
      await expect(proposal).toHaveValue('Unsaved evidence-review proposal.');
      await expect(owner).toHaveValue(ownerId);
      await expect(due).toHaveValue('2026-11-30');
      await expect(rationale).toHaveValue('Unsaved reviewer rationale.');
      expect(service.list(context.actor, context.runId)).toEqual(before);
      expect(reports.list(context.actor, context.runId)).toHaveLength(2);

      const debrief = page
        .getByRole('region', { name: 'Debrief', exact: true })
        .getByRole('textbox', { name: 'Facilitator observations', exact: true });
      if (action === 'draft') {
        message = '';
        page.once('dialog', (dialog) => {
          message = dialog.message();
          void dialog.dismiss();
        });
        await page.getByRole('button', { name: 'Organisation profile', exact: true }).click();
        expect(message).toBe('Discard unsaved changes in this view?');
        await expect(rationale).toHaveValue('Unsaved reviewer rationale.');
        await debrief.fill('Unrelated unsaved debrief.');
      }
      const captureCommands: string[] = [];
      if (action === 'capture')
        await page.route('**/record-reports', async (route) => {
          if (route.request().method() !== 'POST') return route.continue();
          captureCommands.push(route.request().postData()!);
          if (captureCommands.length === 1) {
            await route.fetch();
            await route.abort();
          } else await route.continue();
        });
      page.once('dialog', (dialog) => void dialog.accept());
      await replace();
      if (action === 'capture') {
        await expect(page.getByRole('alert')).toBeVisible();
        await expect(rationale).toHaveValue('Unsaved reviewer rationale.');
        await expect(rationale).toBeDisabled();
        await expect(workspace.getByRole('button', { name: 'New manual AAR' })).toBeDisabled();
        await expect(snapshots).toBeDisabled();
        await page.getByRole('button', { name: 'Retry snapshot request', exact: true }).click();
        await expect(snapshots).not.toHaveValue(snapshot.report.id);
        expect(captureCommands).toHaveLength(2);
        expect(captureCommands[1]).toBe(captureCommands[0]);
      }
      if (action === 'snapshot' || action === 'capture') {
        await expect(snapshots).not.toHaveValue(snapshot.report.id);
        if (action === 'snapshot') await expect(snapshots).toHaveValue(first.report.id);
        await expect(draft).toHaveCount(0);
        expect(reports.list(context.actor, context.runId)).toHaveLength(
          action === 'capture' ? 3 : 2,
        );
      } else if (action === 'refresh') {
        await expect(draft).toHaveValue(ready.record.id);
        await expect(rationale).toHaveValue('');
        await expect(workspace).toContainText('Facilitator-reviewed: accept');
      } else {
        await expect(draft).not.toHaveValue(ready.record.id);
        if (action === 'draft') await expect(draft).toHaveValue(manual.record.id);
        else expect(service.list(context.actor, context.runId).records).toHaveLength(3);
        if (action === 'ai') await expect(workspace).toContainText('Status: queued');
        else await expect(rationale).toHaveValue('');
      }
      if (action === 'draft') {
        await expect(debrief).toHaveValue('Unrelated unsaved debrief.');
        message = '';
        page.once('dialog', (dialog) => {
          message = dialog.message();
          void dialog.dismiss();
        });
        await page.getByRole('button', { name: 'Organisation profile', exact: true }).click();
        expect(message).toBe('Discard unsaved changes in this view?');
        await expect(debrief).toHaveValue('Unrelated unsaved debrief.');
        await debrief.fill('');
      }
      // A discarded editor must not leave a stale dirty flag in the shared guard.
      message = '';
      page.once('dialog', (dialog) => {
        message = dialog.message();
        void dialog.dismiss();
      });
      await page.getByRole('button', { name: 'Organisation profile', exact: true }).click();
      expect(message).toBe('');
      expect(service.get(context.actor, context.runId, ready.record.id)).toEqual(saved);
    } finally {
      store.close();
    }
  });
}

test('uncertain AAR review keeps edits and exact retry while draft and snapshot replacement are blocked', async ({
  page,
  exerciseServer,
}) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const context = prepareInterpretationRun(store, true);
    const reports = new RecordReportService(store),
      service = new AarService(store, true);
    const first = reports.capture(context.actor, context.runId, randomUUID());
    const snapshot = reports.capture(context.actor, context.runId, randomUUID());
    const manual = service.request(context.actor, context.runId, {
      commandId: randomUUID(),
      snapshotId: snapshot.report.id,
      snapshotHash: snapshot.hash,
      mode: 'manual',
    });
    await login(page, 'facilitator');
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByLabel('Exercise', { exact: true }).selectOption('technical/' + context.runId);
    await page.getByRole('tab', { name: 'Record report', exact: true }).click();
    const workspace = page.getByRole('region', { name: 'AAR workspace', exact: true });
    const rationale = workspace.getByLabel('AAR review rationale', { exact: true });
    await rationale.fill('Retain this exact review until the outcome is confirmed.');
    const commands: string[] = [];
    await page.route('**/aars/*/review', async (route) => {
      commands.push(route.request().postData()!);
      if (commands.length === 1) {
        await route.fetch();
        await route.abort();
      } else await route.continue();
    });
    await workspace.getByRole('button', { name: 'Save manual AAR', exact: true }).click();
    await expect(workspace.getByRole('alert')).toBeVisible();
    const saved = service.get(context.actor, context.runId, manual.record.id);
    expect(saved.record.review!.notes).toBe(await rationale.inputValue());
    await expect(rationale).toBeDisabled();
    await expect(workspace.getByLabel('AAR draft', { exact: true })).toBeDisabled();
    await page.getByLabel('Snapshot', { exact: true }).selectOption(first.report.id);
    await expect(page.getByLabel('Snapshot', { exact: true })).toHaveValue(snapshot.report.id);
    await expect(
      page.getByText('Resolve the pending request before leaving this view.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Capture record snapshot', exact: true }).click();
    expect(reports.list(context.actor, context.runId)).toHaveLength(2);
    await expect(rationale).toHaveValue('Retain this exact review until the outcome is confirmed.');
    await workspace.getByRole('button', { name: 'Retry same AAR request', exact: true }).click();
    await expect(workspace).toContainText('Facilitator-reviewed: override');
    await expect(rationale).toHaveValue('');
    expect(commands).toHaveLength(2);
    expect(commands[1]).toBe(commands[0]);
    expect(service.get(context.actor, context.runId, manual.record.id)).toEqual(saved);
    await page.getByLabel('Snapshot', { exact: true }).selectOption(first.report.id);
    await expect(page.getByLabel('Snapshot', { exact: true })).toHaveValue(first.report.id);
  } finally {
    store.close();
  }
});

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
    const due = draft.getByLabel('Improvement due date 1', { exact: true });
    await expect(due).toBeDisabled();
    await draft.getByLabel('Improvement owner 1', { exact: true }).selectOption({ label: 'Imran' });
    await draft
      .getByLabel('AAR review rationale', { exact: true })
      .fill('Reviewed against the fixed app snapshot.');
    await expect(draft.getByRole('button', { name: 'Accept AAR', exact: true })).toBeDisabled();
    const save = draft.getByRole('button', { name: 'Save AAR edits', exact: true });
    await expect(save).toBeDisabled();
    await due.fill('2026-11-30');
    await save.click();
    await expect(draft).toContainText('Facilitator-reviewed: edit');
    const actions = draft.getByRole('region', { name: 'Proposed improvement actions' });
    await expect(actions).toContainText('Imran');
    await expect(actions).toContainText('2026-11-30');
    await expect(actions).toContainText('Assigned');
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
    const record = panel.getByRole('button', { name: 'Record clarification', exact: true });
    await panel.getByLabel('Not known at this time', { exact: true }).check();
    await expect(record).toBeDisabled();
    await panel
      .getByLabel('Participant question', { exact: true })
      .fill('Has the MSP confirmed a clean restore point?');
    await record.click();
    await expect(panel.locator('.report-record')).toHaveCount(1);
    await expect(panel.locator('.report-record')).toContainText(
      'Question: Has the MSP confirmed a clean restore point?',
    );
    await panel.getByLabel('Not known at this time', { exact: true }).uncheck();
    await panel
      .getByLabel('Clarification answer', { exact: true })
      .fill(
        'The cited profile claim is the current discussion source; no executed action is asserted.',
      );
    await panel
      .getByLabel('Confirmed claim IDs', { exact: true })
      .fill(generationProfile.environment!.claims[0]!.id);
    await expect(record).toBeDisabled();
    await panel
      .getByLabel('Participant question', { exact: true })
      .fill('Which route do we use for the SOC?');
    await record.click();
    await expect(panel.locator('.report-record')).toHaveCount(2);
    expect(store.clarifications.list(context.runId).every((r) => r.position === 1)).toBe(true);
    expect(store.clarifications.list(context.runId).map((r) => r.question)).toEqual([
      'Has the MSP confirmed a clean restore point?',
      'Which route do we use for the SOC?',
    ]);
    expect(context.exercises.inbox(context.player, 'technical', context.runId)).toEqual(before);
  } finally {
    store.close();
  }
});
