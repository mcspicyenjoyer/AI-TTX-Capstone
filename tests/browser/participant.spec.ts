import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Route } from '@playwright/test';
import { test, expect, login, fits, prepare } from './exercise-fixture.js';
import { Store } from '../../src/server/storage.js';
import { GenerationService, packagePlayers } from '../../src/server/generation-service.js';
import { ExerciseService } from '../../src/server/exercise-service.js';
import { OutcomeService } from '../../src/server/outcome-service.js';
import type { PackageDraftView } from '../../src/contracts/generation.js';
import { generationTarget, generationPlan } from '../generation-fixture.js';

test.use({ generationEnabled: true });
test('participant keeps an unsaved response after a failed exercise refresh', async ({
  page,
  browser,
  baseURL,
}) => {
  await prepare(page, baseURL!);
  await page.getByRole('button', { name: 'Release to inbox', exact: true }).click();
  const context = await browser.newContext({ baseURL });
  try {
    const participant = await context.newPage();
    await login(participant, 'participant');
    const actions = participant.getByLabel('Agreed actions', { exact: true });
    await actions.fill('Keep this unsaved response while the connection recovers.');
    await participant.route('**/briefing', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Temporary briefing failure' } }),
      }),
    );
    await participant.getByRole('button', { name: 'Refresh exercises', exact: true }).click();
    await expect(participant.getByRole('alert')).toContainText('Temporary briefing failure');
    await expect(actions).toHaveValue('Keep this unsaved response while the connection recovers.');
    await participant.unroute('**/briefing');
    await participant.getByRole('button', { name: 'Refresh exercises', exact: true }).click();
    await expect(participant.getByRole('alert')).toHaveCount(0);
    await expect(actions).toHaveValue('Keep this unsaved response while the connection recovers.');

    await participant.route('**/briefing', (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Exercise access removed' } }),
      }),
    );
    await participant.getByRole('button', { name: 'Refresh exercises', exact: true }).click();
    await expect(participant.getByRole('alert')).toContainText('Exercise access removed');
    await expect(participant.locator('.participant-run')).toHaveCount(0);
    await participant.unroute('**/briefing');
    let heldRefresh: Route | undefined;
    await participant.route('**/briefing', (route) => {
      heldRefresh = route;
    });
    await participant.getByRole('button', { name: 'Refresh exercises', exact: true }).click();
    await expect.poll(() => !!heldRefresh).toBe(true);
    await expect(participant.getByText('Loading exercise...', { exact: true })).toBeVisible();
    await expect(participant.locator('.participant-run')).toHaveCount(0);
    await heldRefresh!.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'Exercise access removed' } }),
    });
    await expect(participant.getByRole('alert')).toContainText('Exercise access removed');
  } finally {
    await context.close();
  }
});

test('participant reads one inject per tab beside the team response and keeps drafts', async ({
  page,
  browser,
  baseURL,
  exerciseServer,
}, testInfo) => {
  test.setTimeout(90000);
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    const actor = store.loginIdentity('facilitator')!.actor;
    const generator = new GenerationService(store, generationTarget, true);
    const revision = (view: PackageDraftView) => ({
      commandId: randomUUID(),
      expectedRevision: view.draft.revision,
      expectedHash: view.hash,
    });
    let view = generator.generate(actor, { ...generationTarget, commandId: randomUUID() });
    generator.claim();
    generator.complete({
      id: view.draft.id,
      failed: false,
      output: generationPlan(),
      inputTokens: 1,
      outputTokens: 1,
    });
    view = generator.get(actor, view.draft.id);
    for (const position of view.draft.plan!.positions)
      view = generator.review(actor, view.draft.id, {
        ...revision(view),
        position,
        decision: 'accepted',
      });
    view = generator.freeze(actor, view.draft.id, revision(view));
    const runId = view.draft.runId!;
    const exercises = new ExerciseService(store);
    const outcomes = new OutcomeService(store, exercises);
    const state = () => ({
      idempotencyKey: randomUUID(),
      expectedRunRevision: store.exercises.run(runId)!.revision,
    });
    const context = exercises.review(actor, 'technical', runId);
    exercises.recordStep0(actor, 'technical', runId, {
      ...state(),
      packageHash: context.packageHash,
      assignmentHash: context.assignmentHash,
      respondentIds: packagePlayers.map((player) => player.actorId),
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
    const release = (index: number) => {
      const current = exercises.review(actor, 'technical', runId),
        inject = current.package.injects[index]!;
      const approval = exercises.approve(actor, 'technical', runId, {
        ...state(),
        packageHash: current.packageHash,
        injectId: inject.id,
        injectRevisionId: inject.revisionId,
        contentHash: current.nextInject!.contentHash,
        recipientIds: packagePlayers.map((player) => player.actorId),
      });
      return {
        release: exercises.release(actor, 'technical', runId, {
          ...state(),
          approvalId: approval.id,
        }),
        title: inject.title,
      };
    };
    const close = (releaseId: string) => {
      const disposition = outcomes.disposition(actor, 'technical', runId, {
        ...state(),
        releaseId,
        responseId: store.outcomes.responses(releaseId).at(-1)?.id ?? null,
        decision: 'reviewed',
        observations: 'Test observation.',
        unresolvedGaps: 'Test gap.',
      });
      outcomes.close(actor, 'technical', runId, {
        ...state(),
        releaseId,
        dispositionId: disposition.id,
        rationale: 'Test closure.',
      });
    };

    const first = release(0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, 'player-it');
    await page
      .getByRole('combobox', { name: 'Exercise', exact: true })
      .selectOption(`technical/${runId}`);
    const tabs = page.getByRole('tablist', { name: 'Exercise inbox', exact: true });
    const tab = (n: number) => tabs.getByRole('tab', { name: new RegExp(`^Inject ${n}: `) });
    const inbox = page.getByRole('region', { name: 'Released inbox', exact: true });
    const panel = inbox.getByRole('tabpanel');
    const response = panel.getByRole('complementary', { name: 'Team response', exact: true });
    await expect(tabs.getByRole('tab')).toHaveCount(2);
    await expect(tab(1)).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByRole('heading', { name: first.title, exact: true })).toBeVisible();
    // The fixture's first story message reaches engineering only.
    await expect(panel.locator('.story-message')).toHaveCount(0);
    await expect(panel.locator('.fact-tag').first()).toBeVisible();
    await expect(panel.getByRole('region', { name: 'Discussion questions' })).toBeVisible();
    await expect(panel).not.toContainText('SIMULATION');

    // On a laptop screen the answer form sits beside the inject, inside the first screen.
    const article = await panel.locator('.inbox-item').boundingBox();
    const form = await response.getByLabel('Agreed actions', { exact: true }).boundingBox();
    const aside = await response.boundingBox();
    expect(aside!.x).toBeGreaterThanOrEqual(article!.x + article!.width);
    expect(Math.abs(aside!.y - article!.y)).toBeLessThan(2);
    expect(form!.y + form!.height).toBeLessThan(900);
    await fits(page);
    await page.screenshot({ path: testInfo.outputPath('participant-tabs-1440.png') });

    await tabs.getByRole('tab', { name: 'Briefing', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Starting arrangements' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Your role', exact: true })).toContainText(
      'Internal IT',
    );
    await expect(inbox.getByRole('tabpanel')).toHaveCount(0);
    await tab(1).click();

    await response
      .getByLabel('Agreed actions', { exact: true })
      .fill('Preserve TE-FS01 evidence first.');
    await response.getByLabel('Team rationale', { exact: true }).fill('Scope is unconfirmed.');
    await response.getByRole('button', { name: 'Submit team response', exact: true }).click();
    await expect(response.locator('.saved-response')).toContainText(
      'Preserve TE-FS01 evidence first.',
    );

    // A newly released inject opens when the player was following the latest one.
    close(first.release.id);
    const second = release(1);
    await expect(tab(2)).toHaveAttribute('aria-selected', 'true', { timeout: 15000 });
    await expect(panel.getByRole('heading', { name: second.title, exact: true })).toBeVisible();
    const story = panel.getByRole('region', { name: 'Chat message from Project team chat' });
    await expect(story.locator('.story-kind')).toHaveText('Chat message');
    await expect(story.getByRole('heading', { name: 'Story update 2' })).toBeVisible();
    await expect(story.locator('.story-body')).toHaveText('STORY_2: test in-story message.');
    const actions = panel.getByLabel('Agreed actions', { exact: true });
    await actions.fill('Draft kept across tabs.');
    await tab(1).click();
    await expect(response.getByText('Closed', { exact: true })).toBeVisible();
    await expect(actions).toHaveCount(0);
    await tab(2).click();
    await expect(actions).toHaveValue('Draft kept across tabs.');

    // Reading an older inject is not interrupted; the new one is marked instead.
    await tab(1).click();
    close(second.release.id);
    const third = release(2);
    await expect(tab(3)).toHaveAttribute('aria-label', /, new$/, { timeout: 15000 });
    await expect(tab(3).locator('.tab-new')).toHaveText('New');
    await expect(tab(1)).toHaveAttribute('aria-selected', 'true');
    await tab(3).click();
    await expect(panel.getByRole('heading', { name: third.title, exact: true })).toBeVisible();
    await expect(tab(3).locator('.tab-new')).toHaveCount(0);

    // A fresh sign-in treats everything already released as read and opens the latest inject.
    const later = await browser.newContext({ baseURL });
    try {
      const fresh = await later.newPage();
      await login(fresh, 'player-engineering');
      await fresh
        .getByRole('combobox', { name: 'Exercise', exact: true })
        .selectOption(`technical/${runId}`);
      const freshTabs = fresh.getByRole('tablist', { name: 'Exercise inbox', exact: true });
      await expect(freshTabs.getByRole('tab')).toHaveCount(4);
      await expect(freshTabs.getByRole('tab', { name: /^Inject 3: / })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(freshTabs.locator('.tab-new')).toHaveCount(0);
    } finally {
      await later.close();
    }

    // Narrow screens stack the response below the inject without sideways scrolling.
    await page.setViewportSize({ width: 390, height: 844 });
    const narrowArticle = await panel.locator('.inbox-item').boundingBox();
    const narrowAside = await response.boundingBox();
    expect(narrowAside!.y).toBeGreaterThanOrEqual(narrowArticle!.y + narrowArticle!.height);
    await fits(page);
    await page.screenshot({
      path: testInfo.outputPath('participant-tabs-390.png'),
      fullPage: true,
    });
    expect(errors).toEqual([]);
  } finally {
    store.close();
  }
});
