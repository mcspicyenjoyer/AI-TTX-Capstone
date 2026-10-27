import { join } from 'node:path';
import { test, expect, login } from './exercise-fixture.js';
import { Store } from '../../src/server/storage.js';
import { GenerationService } from '../../src/server/generation-service.js';
import { generationTarget, generationPlan } from '../generation-fixture.js';

test.use({ subscriptionEnabled: true, generationEnabled: true });
test('generated package review edit reject freeze at desktop and mobile widths', async ({
  page,
  exerciseServer,
}, testInfo) => {
  await login(page, 'facilitator');
  await page.getByRole('button', { name: 'Package generation', exact: true }).click();
  await expect(page.getByText(generationTarget.profileHash, { exact: true })).toBeVisible();
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Generate draft', exact: true }).click();
  await expect(
    page.getByText('Queued for the local package worker.', { exact: true }),
  ).toBeVisible();
  const store = new Store(join(exerciseServer, 'ttx.sqlite'));
  try {
    const service = new GenerationService(store, generationTarget, true);
    const job = service.claim()!;
    expect(
      service.complete({
        id: job.id,
        failed: false,
        output: generationPlan(),
        inputTokens: 100,
        outputTokens: 50,
      }).saved,
    ).toBe(true);
  } finally {
    store.close();
  }
  await page.getByRole('button', { name: 'Refresh packages', exact: true }).click();
  await expect(page.getByRole('tab', { name: /1. Shared engineering files/ })).toBeVisible();
  const freeze = page.getByRole('button', { name: 'Approve and freeze package', exact: true });
  await expect(freeze).toBeDisabled();
  await page.getByRole('button', { name: 'Reject inject', exact: true }).click();
  await expect(page.getByRole('tab', { name: /1. Shared engineering files/ })).toContainText(
    'rejected',
  );
  await page
    .getByLabel('business-leadership questions', { exact: true })
    .selectOption(['preserve-evidence']);
  await page.getByRole('button', { name: 'Save edit', exact: true }).click();
  await expect(page.getByRole('tab', { name: /1. Shared engineering files/ })).toContainText(
    'pending',
  );
  await expect(
    page
      .getByText('What evidence should be preserved before disruptive action?', { exact: false })
      .first(),
  ).toBeVisible();
  for (let position = 0; position < 5; position++) {
    await page.getByRole('tab', { name: new RegExp(`^${position + 1}\\.`) }).click();
    await page.getByRole('button', { name: 'Accept inject', exact: true }).click();
    await expect(page.getByRole('tab', { name: new RegExp(`^${position + 1}\\.`) })).toContainText(
      'accepted',
    );
  }
  await expect(freeze).toBeEnabled();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`generation-${width}.png`), fullPage: true });
  }
  await freeze.click();
  await expect(
    page.getByText('Approved and frozen / 5 of 5 injects accepted', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save edit', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Exercises', exact: true }).click();
  await expect(
    page
      .getByRole('heading', {
        name: 'Teralqen test context: shared engineering file disruption',
        exact: true,
      })
      .first(),
  ).toBeVisible();
});
