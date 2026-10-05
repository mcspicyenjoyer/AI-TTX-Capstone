import { test, expect, prepare, login, access, fits } from './exercise-fixture.js';

test('team response, exact retry, revision, private facilitator review and explicit completion', async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await prepare(page, baseURL!);
  await page.getByRole('button', { name: 'Release to inbox', exact: true }).click();
  const participantContext = await browser.newContext({ baseURL });
  const observerContext = await browser.newContext({ baseURL });
  try {
    const participant = await participantContext.newPage();
    const observer = await observerContext.newPage();
    for (const target of [participant, observer])
      target.on('pageerror', (error) => errors.push(error.message));
    await login(participant, 'participant');
    await login(observer, 'observer');
    await participant
      .getByLabel('Agreed actions', { exact: true })
      .fill('Compare affected project files and notify the controller.');
    await participant
      .getByLabel('Team rationale', { exact: true })
      .fill('Discuss scope before proposing a change.');
    await participant
      .getByLabel('Information requests', { exact: true })
      .fill('Which other projects are affected?');
    let posts = 0;
    let original: string | null = null;
    await participant.route('**/team-responses', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      posts++;
      original = route.request().postData();
      expect((await route.fetch()).status()).toBe(200);
      await route.abort('failed');
    });
    await participant.getByRole('button', { name: 'Submit team response', exact: true }).click();
    await expect(
      participant.getByRole('button', { name: 'Retry outcome request', exact: true }),
    ).toBeVisible();
    await participant.waitForTimeout(5500);
    expect(posts).toBe(1);
    await participant.unroute('**/team-responses');
    await participant.route('**/team-responses', async (route) => {
      if (route.request().method() === 'POST') expect(route.request().postData()).toBe(original);
      await route.continue();
    });
    await participant.getByRole('button', { name: 'Retry outcome request', exact: true }).click();
    await expect(participant.locator('.saved-response')).toContainText(
      'Compare affected project files',
    );
    await expect(observer.locator('.saved-response')).toContainText(
      'Compare affected project files',
      { timeout: 12000 },
    );
    await expect(observer.getByText('No injects released to you.', { exact: true })).toBeVisible();
    await expect(
      observer.getByRole('heading', { name: 'File access report', exact: true }),
    ).toHaveCount(0);
    await observer.getByRole('button', { name: 'Revise team response', exact: true }).click();
    await observer
      .getByLabel('Agreed actions', { exact: true })
      .fill('Compare scope and preserve the reported details for the team.');
    await observer.getByRole('button', { name: 'Submit team response', exact: true }).click();
    await expect(observer.locator('.saved-response')).toContainText('Revision 2');
    await expect(
      page
        .locator('.outcomes')
        .getByText('Compare scope and preserve the reported details for the team.', { exact: true })
        .first(),
    ).toBeVisible({ timeout: 12000 });
    await participant.getByRole('button', { name: 'Refresh outcomes', exact: true }).click();
    await participant.setViewportSize({ width: 1440, height: 1080 });
    await fits(participant);
    await participant
      .locator('.outcomes')
      .screenshot({ path: testInfo.outputPath('team-response-desktop.png') });
    await participant.setViewportSize({ width: 390, height: 844 });
    await fits(participant);
    await participant
      .locator('.outcomes')
      .screenshot({ path: testInfo.outputPath('team-response-mobile.png') });

    await page
      .getByLabel('Facilitator observations', { exact: true })
      .fill('PRIVATE REVIEW: the team proposed actions; none were performed.');
    await page
      .getByLabel('Unresolved gaps', { exact: true })
      .fill('Affected scope remains uncertain.');
    await page.getByRole('button', { name: 'Review latest state', exact: true }).click();
    await page.getByRole('button', { name: 'Record disposition', exact: true }).click();
    await expect(page.locator('.outcomes')).toContainText('PRIVATE REVIEW:');
    await page
      .getByLabel('Closure rationale', { exact: true })
      .fill('Close the discussion and carry the scope gap.');
    await page.getByRole('button', { name: 'Close position', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Complete run', exact: true })).toBeDisabled();
    await page
      .getByLabel('Completion rationale', { exact: true })
      .fill('One engineering position completed with a recorded gap, not a recovery verdict.');
    await page.getByRole('button', { name: 'Complete run', exact: true }).click();
    await expect(page.locator('.outcomes')).toContainText('Run completed:');
    await page.reload();
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await expect(page.locator('.outcomes')).toContainText(
      'Close the discussion and carry the scope gap.',
    );
    await expect(page.locator('.outcomes')).toContainText('Run completed:');
    await expect(page.getByRole('button', { name: 'Resume run', exact: true })).toHaveCount(0);
    for (const target of [participant, observer]) {
      await target.getByRole('button', { name: 'Refresh outcomes', exact: true }).click();
      await expect(target.getByLabel('Agreed actions', { exact: true })).toHaveCount(0);
      const projection = await target.request.get(
        '/api/tracks/technical/runs/technical-check-01/team-responses',
      );
      expect(await projection.text()).not.toContain('PRIVATE REVIEW');
      expect(await projection.text()).not.toContain('dispositions');
    }
    await fits(page);
    await page
      .locator('.outcomes')
      .screenshot({ path: testInfo.outputPath('completed-outcomes-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await fits(page);
    await page
      .locator('.outcomes')
      .screenshot({ path: testInfo.outputPath('completed-outcomes-mobile.png') });
    expect(errors).toEqual([]);
  } finally {
    await participantContext.close();
    await observerContext.close();
  }
});

test('pause retains participant drafts and an obsolete mutation cannot sign out a newer login', async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(45000);
  await prepare(page, baseURL!);
  await page.getByRole('button', { name: 'Release to inbox', exact: true }).click();
  const context = await browser.newContext({ baseURL });
  try {
    const participant = await context.newPage();
    await login(participant, 'participant');
    await participant
      .getByLabel('Agreed actions', { exact: true })
      .fill('Retain this local draft during Pause.');
    await participant
      .getByLabel('Team rationale', { exact: true })
      .fill('Await explicit facilitator resume.');
    await page.getByRole('button', { name: 'Pause run', exact: true }).click();
    await expect(participant.locator('.outcomes')).toContainText('Paused. Submissions', {
      timeout: 12000,
    });
    await expect(participant.getByLabel('Agreed actions', { exact: true })).toHaveValue(
      'Retain this local draft during Pause.',
    );
    await expect(
      participant.getByRole('button', { name: 'Submit team response', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Resume run', exact: true }).click();
    await expect(participant.locator('.outcomes')).not.toContainText('Paused. Submissions', {
      timeout: 12000,
    });
    await participant.getByRole('button', { name: 'Review latest state', exact: true }).click();
    await participant.getByRole('button', { name: 'Submit team response', exact: true }).click();
    await expect(participant.locator('.saved-response')).toContainText(
      'Retain this local draft during Pause.',
    );

    // UI-only delayed old-session failure, after a real logout and new login.
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started!: () => void;
    const requested = new Promise<void>((resolve) => {
      started = resolve;
    });
    await page.route('**/pause', async (route) => {
      started();
      await held;
      await route.fulfill({ status: 401, json: { error: { message: 'Old session expired.' } } });
    });
    await page.getByRole('button', { name: 'Pause run', exact: true }).click();
    await requested;
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByLabel('Username', { exact: true }).fill('facilitator');
    await page.getByLabel('Access code', { exact: true }).fill(access('facilitator'));
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
    const oldReply = page.waitForResponse(
      (response) => response.url().endsWith('/pause') && response.status() === 401,
    );
    release();
    await oldReply;
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
