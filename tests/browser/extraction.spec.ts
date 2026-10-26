import { test, expect, login, fits } from './exercise-fixture.js';
import { Store } from '../../src/server/storage.js';
import { ExtractionJobs } from '../../src/server/extraction-jobs.js';
import { extractionPacket } from '../../src/server/extraction-prompt.js';
import { join } from 'node:path';
import { diagram } from '../intake-fixtures.js';
import type { Page } from '@playwright/test';

test.use({ subscriptionEnabled: true });
async function draft(page: Page) {
  await login(page, 'facilitator');
  await page.getByRole('button', { name: 'Source intake', exact: true }).click();
  await page.getByLabel('Organisation name', { exact: true }).fill('Subscription fixture');
  await page.getByLabel('Synthetic organisation only', { exact: true }).check();
  await page.getByRole('button', { name: 'Create draft', exact: true }).click();
  await page.getByLabel('Source title', { exact: true }).fill('Synthetic diagram');
  await page
    .getByLabel('Source file', { exact: true })
    .setInputFiles({ name: 'network.drawio', buffer: Buffer.from(diagram), mimeType: 'text/xml' });
  await page
    .getByLabel('This source contains synthetic information only.', { exact: true })
    .check();
  await page.getByRole('button', { name: 'Import source', exact: true }).click();
  await expect(page.getByText('Revision 2', { exact: true })).toBeVisible();
}
test('queued subscription request survives lost response, completion polling, reload and mobile review', async ({
  page,
  exerciseServer,
}, info) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  const jobs = new ExtractionJobs(store);
  try {
    await draft(page);
    jobs.claim();
    await expect(page.getByRole('button', { name: 'Extract candidates' })).toBeEnabled();
    let first = true;
    const bodies: string[] = [];
    await page.route('**/api/intakes/*/extract', async (route) => {
      bodies.push(route.request().postData()!);
      if (!first) {
        await route.continue();
        return;
      }
      first = false;
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      await route.abort('failed');
    });
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Extract candidates' }).click();
    await page.getByRole('button', { name: 'Retry same request' }).click();
    await expect(page.getByText('Extraction queued', { exact: true })).toBeVisible();
    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toBe(bodies[1]);
    const job = jobs.claim()!;
    const unit = extractionPacket(job.sources).units[0]!;
    const evidence = [{ ref: unit.ref, quote: unit.text }];
    await expect(page.getByText('Extraction running', { exact: true })).toBeVisible();
    expect(
      jobs.complete({
        id: job.id,
        failed: false,
        inputTokens: 100,
        outputTokens: 50,
        output: {
          entities: [{ key: 'system', kind: 'system', name: 'AI proposed system', evidence }],
          claims: [
            {
              key: 'description',
              subject: 'system',
              object: null,
              predicate: 'description',
              value: 'Candidate only',
              status: 'proposal',
              explanation: 'Needs human review.',
              evidence,
            },
          ],
        },
      }),
    ).toEqual({ saved: true });
    await expect(page.getByText('Extraction succeeded', { exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Entities (3)' })).toBeVisible();
    await fits(page);
    await page.screenshot({ path: info.outputPath('subscription-desktop.png'), fullPage: true });
    await page.reload();
    await page.getByRole('button', { name: 'Source intake', exact: true }).click();
    await page
      .getByLabel('Preparation draft', { exact: true })
      .selectOption({ label: 'Subscription fixture / revision 3' });
    await expect(page.getByText('Extraction succeeded', { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await fits(page);
    await page.screenshot({ path: info.outputPath('subscription-mobile.png'), fullPage: true });
    await page.getByRole('tab', { name: 'Entities (3)' }).click();
    await expect(page.getByLabel('Entity decision 3', { exact: true })).toHaveValue('pending');
  } finally {
    store.close();
  }
});

test('provider failure is visible and leaves manual reconciliation available', async ({
  page,
  exerciseServer,
}) => {
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  const jobs = new ExtractionJobs(store);
  try {
    await draft(page);
    jobs.claim();
    await expect(page.getByRole('button', { name: 'Extract candidates' })).toBeEnabled();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Extract candidates' }).click();
    await expect(page.getByText('Extraction queued', { exact: true })).toBeVisible();
    const job = jobs.claim()!;
    jobs.complete({ id: job.id, failed: true, output: null, inputTokens: 0, outputTokens: 0 });
    await expect(page.getByText('Extraction failed', { exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Entities (2)' }).click();
    await page.getByLabel('Entity name 1', { exact: true }).fill('Manual correction after outage');
    await expect(page.getByLabel('Entity name 1', { exact: true })).toHaveValue(
      'Manual correction after outage',
    );
  } finally {
    store.close();
  }
});
