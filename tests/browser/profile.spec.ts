import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProfileView } from '../../src/contracts/profile.js';

function code(role: 'facilitator' | 'participant'): string {
  const directory = process.env.TTX_BROWSER_DATA_DIR;
  if (!directory) throw new Error('Missing browser-test data directory.');
  return (
    JSON.parse(readFileSync(join(directory, 'demo-access.json'), 'utf8')) as Record<string, string>
  )[role]!;
}
async function login(page: Page, role: 'facilitator' | 'participant') {
  await page.goto('/');
  await expect(page).toHaveTitle('TTX Platform | Workspace');
  await expect(page.getByRole('banner').getByText('TTX Platform', { exact: true })).toBeVisible();
  await expect(page.getByText('EXERCISE WORKSPACE', { exact: true })).toBeVisible();
  await expect(page.getByText(/technical/i)).toHaveCount(0);
  await page.getByLabel('Username', { exact: true }).fill(role);
  await page.getByLabel('Access code', { exact: true }).fill(code(role));
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const overlapping = await page.locator('.entry-row').evaluateAll((rows) =>
    rows.some((row) => {
      const children = [...row.children].map((child) => child.getBoundingClientRect());
      return children.some((a, i) =>
        children
          .slice(i + 1)
          .some(
            (b) =>
              a.left < b.right - 1 &&
              a.right > b.left + 1 &&
              a.top < b.bottom - 1 &&
              a.bottom > b.top + 1,
          ),
      );
    }),
  );
  expect(overlapping).toBe(false);
}

test('facilitator reviews evidence, filters, confirms, reloads and sees durable activity', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await login(page, 'facilitator');
  await expect(page.getByRole('heading', { name: 'Example SME 01' })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('TTX Platform');
  await expect(page.locator('.page-heading')).toContainText('Track: Technical');
  await expect(page.locator('.page-heading strong').filter({ hasText: /^Track:$/ })).toBeVisible();
  const profileUrl = '/api/profiles/example-sme-01/revisions/profile-r1';
  const originalResponse = await page.request.get(profileUrl);
  expect(originalResponse.ok()).toBe(true);
  const original = (await originalResponse.json()) as ProfileView;
  expect(original.profile.sources.map((source) => source.title)).toEqual([
    'Synthetic organisation brief',
    'Synthetic network inventory',
    'Synthetic continuity notes',
    'Synthetic recovery notes',
  ]);
  const register = page.locator('.sources-section');
  await expect(register).not.toContainText('Synthetic');
  for (const title of [
    'Organisation brief',
    'Network inventory',
    'Continuity notes',
    'Recovery notes',
  ]) {
    await expect(register.getByRole('button', { name: new RegExp(`^${title}`) })).toBeVisible();
  }
  const organisationSource = register.getByRole('button', { name: /^Organisation brief/ });
  await organisationSource.click();
  await expect(organisationSource).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.filter-state')).toContainText('All statuses / Organisation brief');
  await expect(page.locator('.entry')).toHaveCount(4);
  await page.getByRole('button', { name: /Staff and location/ }).click();
  await expect(page.locator('#evidence-staff .source-excerpt strong')).toHaveText(
    'Organisation brief',
  );
  await expect(page.locator('#evidence-staff blockquote')).toHaveText(
    'The synthetic organisation has 42 staff working from one office.',
  );
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirm revision', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: /File service recovery target/ }).click();
  await expect(
    page.getByText('The target restoration time for the file service is four hours.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('The target restoration time for the file service is eight hours.', {
      exact: true,
    }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('profile-desktop.png'), fullPage: true });
  await page.getByLabel('Search profile').fill('MSSP');
  await expect(page.locator('.entry')).toHaveCount(2);
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await page.getByLabel('Filter category').selectOption('network');
  await expect(page.locator('.entry')).toHaveCount(2);
  await page.getByLabel('Filter category').selectOption('all');
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('profile-mobile.png'), fullPage: true });
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Confirm revision', exact: true }).click();
  await expect(page.getByText('Revision confirmed', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Revision confirmed', { exact: true })).toBeVisible();
  const savedResponse = await page.request.get(profileUrl);
  expect(savedResponse.ok()).toBe(true);
  const saved = (await savedResponse.json()) as ProfileView;
  expect(saved.profile).toEqual(original.profile);
  expect(saved.contentHash).toBe(original.contentHash);
  await expect(page.getByRole('button', { name: /MSSP containment authority/ })).toContainText(
    'Unknown',
  );
  await page.getByRole('tab', { name: /Activity/ }).click();
  await expect(page.locator('.activity-list li')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('participant cannot see facilitator context in UI or direct API', async ({ page }) => {
  await login(page, 'participant');
  await expect(page.getByRole('heading', { name: 'Participant workspace' })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('TTX Platform');
  await expect(page.getByText('Example SME 01', { exact: true })).toHaveCount(0);
  const response = await page.request.get('/api/profiles/example-sme-01/revisions/profile-r1');
  expect(response.status()).toBe(403);
  expect(await response.text()).not.toContain('MSSP');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Workspace sign-in' })).toBeVisible();
});

test('sign-in errors are visible without exposing account details', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Username', { exact: true }).fill('not-a-user');
  await page.getByLabel('Access code', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('username or access code is incorrect');
});
