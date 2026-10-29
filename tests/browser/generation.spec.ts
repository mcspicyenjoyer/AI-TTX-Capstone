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
  // The controlled library states whether its family fits the confirmed profile (ADR-037).
  const family = page.getByLabel('Threat library family', { exact: true });
  await expect(family).toContainText('Applicable');
  await expect(family).toContainText('Eligible pathways: TE-FS01 -> Engineering service');
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
  // The facilitator sees the mapped pathway, with access links marked as hypotheses.
  const pathway = page.getByRole('region', { name: 'Threat pathway', exact: true });
  await expect(pathway).toContainText('Target system: TE-FS01');
  await expect(pathway).toContainText('Entry point not established.');
  await pathway.getByText('TE-VPN01', { exact: false }).first().click();
  await expect(pathway.getByText('Hypothesis', { exact: true })).toBeVisible();
  await expect(pathway).toContainText('TE-VPN01 / access-to: TE-FS01');
  await expect(pathway).toContainText('UNKNOWN TE-FS01 / restore-tested: no value recorded');
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
  // Dropping the containment decision's own criterion blocks freezing until it is restored.
  const criteria = page.getByLabel('evaluationCriteria', { exact: true });
  const covered = [
    'record-owner-and-review-time',
    'establish-scope',
    'preserve-evidence',
    'obtain-isolation-authority',
  ];
  await criteria.selectOption(covered.slice(0, 3));
  await page.getByRole('button', { name: 'Save edit', exact: true }).click();
  const coverage = page.getByRole('status', { name: 'Objective coverage', exact: true });
  await expect(coverage).toContainText(
    'Position 1 (containment decision) must evaluate obtain-isolation-authority.',
  );
  await criteria.selectOption(covered);
  await page.getByRole('button', { name: 'Save edit', exact: true }).click();
  await expect(coverage).toHaveCount(0);
  for (let position = 0; position < 5; position++) {
    await page.getByRole('tab', { name: new RegExp(`^${position + 1}\\.`) }).click();
    await page.getByRole('button', { name: 'Accept inject', exact: true }).click();
    await expect(page.getByRole('tab', { name: new RegExp(`^${position + 1}\\.`) })).toContainText(
      'accepted',
    );
  }
  await expect(freeze).toBeEnabled();
  await page.getByLabel('Plan being exercised', { exact: true }).selectOption('test-plan');
  await page.getByLabel('Shared Step 0 references', { exact: true }).selectOption('shared-route');
  await page.getByLabel('Internal IT briefing', { exact: true }).selectOption(['it', 'restore']);
  await page.getByLabel('Business leadership people', { exact: true }).selectOption(['imran']);
  await page.getByLabel('Internal IT people', { exact: true }).selectOption(['ethan']);
  await expect(freeze).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Accept inject', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Save preparation', exact: true }).click();
  await expect(
    page.getByText('Facilitator review / 0 of 5 injects accepted', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/EXERCISE ASSUMPTION: Synthetic draft BCP/)).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Package generation', exact: true }).click();
  await expect(page.getByLabel('Internal IT briefing', { exact: true })).toHaveValues([
    'it',
    'restore',
  ]);
  await expect(page.getByLabel('Business leadership people', { exact: true })).toHaveValues([
    'imran',
  ]);
  await expect(page.getByLabel('Internal IT people', { exact: true })).toHaveValues(['ethan']);
  await expect(page.getByText(/^Represent: Imran\./)).toBeAttached();
  for (let position = 0; position < 5; position++) {
    await page.getByRole('tab', { name: new RegExp(`^${position + 1}\\.`) }).click();
    await page.getByRole('button', { name: 'Accept inject', exact: true }).click();
    await expect(page.getByRole('tab', { name: new RegExp(`^${position + 1}\\.`) })).toContainText(
      'accepted',
    );
  }
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
