import { test, expect, login, fits } from './exercise-fixture.js';
import type { Page } from '@playwright/test';
import { diagram, docxBase64 } from '../intake-fixtures.js';
import type { IntakeView } from '../../src/contracts/intake.js';

async function createDraft(page: Page) {
  await login(page, 'facilitator');
  await page.getByRole('button', { name: 'Source intake', exact: true }).click();
  await page
    .getByLabel('Organisation name', { exact: true })
    .fill('Synthetic intake demonstration');
  await page.getByLabel('Synthetic organisation only', { exact: true }).check();
  await page.getByRole('button', { name: 'Create draft', exact: true }).click();
  await expect(page.getByText('Revision 1', { exact: true })).toBeVisible();
}
async function upload(page: Page, kind: string, name: string, buffer: Buffer) {
  await page.getByLabel('Source title', { exact: true }).fill(name);
  await page.getByLabel('Source type', { exact: true }).selectOption(kind);
  await page
    .getByLabel('Source file', { exact: true })
    .setInputFiles({ name, buffer, mimeType: 'application/octet-stream' });
  await page
    .getByLabel('This source contains synthetic information only.', { exact: true })
    .check();
  const imported = page.waitForResponse(
    (response) => response.url().endsWith('/sources') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Import source', exact: true }).click();
  const response = await imported;
  expect(response.status()).toBe(200);
  await expect(page.getByRole('button', { name: 'Import source', exact: true })).toBeEnabled();
  return response.json() as Promise<IntakeView>;
}

test('network and DOCX evidence become a reviewed typed snapshot, export and survive reload on desktop and mobile', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await createDraft(page);
  const imported = await upload(page, 'network', 'Network.drawio', Buffer.from(diagram));
  expect(imported.draft.entities).toHaveLength(2);
  expect(imported.draft.claims[0]!.status).toBe('proposal');
  await expect(page.getByRole('button', { name: 'Extract candidates' })).toBeDisabled();
  await upload(page, 'bcp', 'BCP.docx', Buffer.from(docxBase64, 'base64'));
  await page.getByRole('tab', { name: 'Entities (2)', exact: true }).click();
  for (let n = 1; n <= 2; n++) {
    await page.getByLabel(`Entity kind ${n}`, { exact: true }).selectOption('system');
    await page.getByLabel(`Entity decision ${n}`, { exact: true }).selectOption('accepted');
  }
  await page.getByLabel('Evidence source', { exact: true }).selectOption({ label: 'BCP.docx' });
  await expect(page.locator('.intake-source-pane pre')).toContainText(
    'Proposed engineering RTO: 4 hours.',
  );
  await page.getByRole('button', { name: 'Add entity', exact: true }).click();
  await page.getByLabel('Entity name 3', { exact: true }).fill('Engineering service');
  await page.getByLabel('Entity kind 3', { exact: true }).selectOption('service');
  await page.getByLabel('Entity decision 3', { exact: true }).selectOption('accepted');
  await fits(page);
  await page.screenshot({ path: info.outputPath('intake-entities-desktop.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Claims (1)', exact: true }).click();
  await page.locator('.intake-claim summary').first().click();
  await page.getByLabel('Claim decision 1', { exact: true }).selectOption('accepted');
  await page.getByRole('button', { name: 'Add claim', exact: true }).click();
  await page.locator('.intake-claim summary').nth(1).click();
  await page
    .getByLabel('Claim subject 2', { exact: true })
    .selectOption({ label: 'Engineering service' });
  await page.getByLabel('Claim property 2', { exact: true }).selectOption('rto-hours');
  await page.getByLabel('Claim status 2', { exact: true }).selectOption('proposal');
  await page.getByLabel('Claim value 2', { exact: true }).fill('4');
  await page
    .getByLabel('Claim explanation 2', { exact: true })
    .fill('Proposed target from BCP; recovery capability remains unverified.');
  await page.getByLabel('Claim decision 2', { exact: true }).selectOption('accepted');
  await page
    .getByLabel('Review rationale', { exact: true })
    .fill('Compared sources; retained the connector and RTO as proposals.');
  await page.getByRole('button', { name: 'Save review', exact: true }).click();
  await expect(page.getByText('Unsaved review', { exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Review', exact: true }).click();
  await page
    .getByLabel('I reviewed the source evidence, proposals, assumptions and remaining gaps.', {
      exact: true,
    })
    .check();
  await page.getByRole('button', { name: 'Confirm profile snapshot', exact: true }).click();
  await expect(page.getByText('Confirmed snapshot', { exact: true })).toBeVisible();
  const draft = (await (
    await page.request.get(`/api/intakes/${imported.draft.id}`)
  ).json()) as IntakeView;
  expect(draft.draft.confirmedProfile).not.toBeNull();
  const ref = draft.draft.confirmedProfile!;
  const snapshot = await (
    await page.request.get(`/api/profiles/${ref.profileId}/revisions/${ref.revisionId}`)
  ).json();
  expect(snapshot.profile.environment.claims[1]).toMatchObject({
    predicate: 'rto-hours',
    value: 4,
    status: 'proposal',
  });
  expect(snapshot.confirmation.contentHash).toBe(snapshot.contentHash);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export confirmed profile' }).click();
  expect((await download).suggestedFilename()).toBe(`${imported.draft.id}.json`);
  await page.reload();
  await page.getByRole('button', { name: 'Source intake', exact: true }).click();
  await page.getByLabel('Preparation draft', { exact: true }).selectOption(imported.draft.id);
  await expect(page.getByText('Confirmed snapshot', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Review', exact: true }).click();
  await fits(page);
  await page.screenshot({ path: info.outputPath('intake-review-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await fits(page);
  await page.screenshot({ path: info.outputPath('intake-review-mobile.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Entities (3)', exact: true }).click();
  await expect(page.getByLabel('Entity name 1', { exact: true })).toBeDisabled();
  await fits(page);
  await page.screenshot({ path: info.outputPath('intake-entities-mobile.png'), fullPage: true });
});

test('a committed-but-lost create response is retried exactly once without duplicate drafts or unsafe navigation', async ({
  page,
}) => {
  await login(page, 'facilitator');
  await page.getByRole('button', { name: 'Source intake', exact: true }).click();
  const bodies: string[] = [];
  await page.route('**/api/intakes', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    bodies.push(route.request().postData()!);
    if (bodies.length === 1) {
      const committed = await route.fetch();
      expect(committed.status()).toBe(200);
      await route.abort('failed');
    } else await route.continue();
  });
  await page.getByLabel('Organisation name', { exact: true }).fill('Lost response test');
  await page.getByLabel('Synthetic organisation only', { exact: true }).check();
  await page.getByRole('button', { name: 'Create draft', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry same request' })).toBeVisible();
  await page.getByRole('button', { name: 'Exercises', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Source intake', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Retry same request' }).click();
  await expect(page.getByText('Revision 1', { exact: true })).toBeVisible();
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toBe(bodies[1]);
  expect(await (await page.request.get('/api/intakes')).json()).toHaveLength(1);
});

test('unsaved edits need explicit discard and participants cannot see or fetch preparation evidence', async ({
  page,
  browser,
  baseURL,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createDraft(page);
  await fits(page);
  await page.screenshot({ path: info.outputPath('intake-source-mobile.png'), fullPage: true });
  const imported = await upload(page, 'network', 'Network.drawio', Buffer.from(diagram));
  await page.getByRole('tab', { name: 'Entities (2)' }).click();
  await page.getByLabel('Entity name 1', { exact: true }).fill('Unsaved name');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Exercises', exact: true }).click();
  await expect(page.getByLabel('Entity name 1', { exact: true })).toHaveValue('Unsaved name');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Exercises', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Source intake', exact: true })).toHaveCount(0);
  const context = await browser.newContext({ baseURL });
  const participant = await context.newPage();
  try {
    await login(participant, 'participant');
    await expect(
      participant.getByRole('button', { name: 'Source intake', exact: true }),
    ).toHaveCount(0);
    const response = await participant.request.get(`/api/intakes/${imported.draft.id}`);
    expect(response.status()).toBe(403);
    expect(await response.text()).not.toContain('File server');
  } finally {
    await context.close();
  }
});
