import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function access(username: string): string {
  const directory = process.env.TTX_EXERCISE_BROWSER_DATA_DIR;
  if (!directory) throw new Error('Missing exercise test directory.');
  const filename = ['facilitator', 'participant'].includes(username)
    ? 'demo-access.json'
    : 'demo-track-access.json';
  return (JSON.parse(readFileSync(join(directory, filename), 'utf8')) as Record<string, string>)[
    username
  ]!;
}
async function login(page: Page, username: string) {
  await page.goto('/');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Access code', { exact: true }).fill(access(username));
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const overlap = await page.locator('.run-actions').evaluateAll((groups) =>
    groups.some((group) => {
      const boxes = [...group.children].map((child) => child.getBoundingClientRect());
      return boxes.some((a, index) =>
        boxes
          .slice(index + 1)
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
  expect(overlap).toBe(false);
}

test('brief, approve, pause, reapprove and release with uncertain-response retry and recipient isolation', async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await login(page, 'facilitator');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Confirm revision', exact: true }).click();
  await expect(page.getByText('Revision confirmed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Exercises', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Step 0: Starting arrangements' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve inject', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Release to inbox', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Confirm briefing and start' })).toBeDisabled();

  const participantContext = await browser.newContext({ baseURL });
  const observerContext = await browser.newContext({ baseURL });
  try {
    const participant = await participantContext.newPage();
    await login(participant, 'participant');
    await expect(
      participant.getByText('No injects released to you.', { exact: true }),
    ).toBeVisible();
    await expect(participant.getByText('PRIVATE CONTROL NOTE', { exact: false })).toHaveCount(0);
    await page.getByLabel('I have briefed the assigned roles', { exact: false }).check();
    await page.getByRole('button', { name: 'Confirm briefing and start' }).click();
    await expect(page.getByRole('button', { name: 'Approve inject', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Approve inject', exact: true }).click();
    await expect(
      page.getByText('Exact revision and recipients approved.', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Pause run', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Release to inbox', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Resume run', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Release to inbox', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Approve inject', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Release to inbox', exact: true })).toBeEnabled();
    await fits(page);
    await page.screenshot({
      path: testInfo.outputPath('release-review-desktop.png'),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await fits(page);
    await page.screenshot({
      path: testInfo.outputPath('release-review-mobile.png'),
      fullPage: true,
    });

    await page.route('**/releases', async (route) => {
      const committed = await route.fetch();
      expect(committed.status()).toBe(200);
      await route.abort('failed');
    });
    await page.getByRole('button', { name: 'Release to inbox', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Retry last request', exact: true }),
    ).toBeVisible();
    await page.unroute('**/releases');
    await page.getByRole('button', { name: 'Retry last request', exact: true }).click();
    await expect(
      page.getByText('Prepared release sequence exhausted.', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Inject available in recipient inbox', { exact: true }),
    ).toHaveCount(1);

    await participant.reload();
    await expect(
      participant.getByRole('heading', { name: 'File access report', exact: true }),
    ).toBeVisible();
    await expect(participant.locator('.inbox-item')).toHaveCount(1);
    await participant.setViewportSize({ width: 390, height: 844 });
    await fits(participant);
    await participant.screenshot({
      path: testInfo.outputPath('participant-inbox-mobile.png'),
      fullPage: true,
    });
    const inbox = await participant.request.get(
      '/api/tracks/technical/runs/technical-check-01/inbox',
    );
    expect(await inbox.text()).not.toContain('facilitatorNotes');
    expect(await inbox.text()).not.toContain('recipientIds');
    const privateRead = await participant.request.get(
      '/api/tracks/technical/runs/technical-check-01/review',
    );
    expect(privateRead.status()).toBe(403);
    expect(await privateRead.text()).not.toContain('PRIVATE CONTROL NOTE');

    const observer = await observerContext.newPage();
    await login(observer, 'observer');
    await expect(observer.getByText('No injects released to you.', { exact: true })).toBeVisible();
    await expect(observer.getByText('File access report', { exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await participantContext.close();
    await observerContext.close();
  }
});

test('operational workspace loads its own fixture, recovers from errors and exposes no fake play controls', async ({
  page,
}, testInfo) => {
  await page.route('**/operational-dev-01/review', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'TEST_ERROR', message: 'Synthetic read failure.' } }),
    }),
  );
  await login(page, 'operational');
  await expect(page.getByRole('alert')).toContainText('Synthetic read failure.');
  await page.unroute('**/operational-dev-01/review');
  await page.getByRole('button', { name: 'Refresh exercises', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Operational development workspace', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Development / Not playable', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm briefing and start' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Approve inject', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Organisation profile', exact: true })).toHaveCount(
    0,
  );
  const forbidden = await page.request.get('/api/tracks/technical/runs/technical-check-01/review');
  expect(forbidden.status()).toBe(403);
  expect(await forbidden.text()).not.toContain('PRIVATE CONTROL NOTE');
  await page.setViewportSize({ width: 1440, height: 1080 });
  await fits(page);
  await page.screenshot({ path: testInfo.outputPath('operational-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await fits(page);
  await page.screenshot({ path: testInfo.outputPath('operational-mobile.png'), fullPage: true });
});
