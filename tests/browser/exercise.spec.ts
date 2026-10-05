import { test, expect, login, fits } from './exercise-fixture.js';

test('brief, approve, pause, reapprove and release with uncertain-response retry and recipient isolation', async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  test.setTimeout(60000);
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
  let finishPoll!: () => void;
  let signalPoll!: () => void;
  const pollStarted = new Promise<void>((resolve) => {
    signalPoll = resolve;
  });
  const pollHeld = new Promise<void>((resolve) => {
    finishPoll = resolve;
  });
  await page.route('**/technical-check-01/review', async (route) => {
    const response = await route.fetch();
    const detail = await response.json();
    // Distinguish this delayed read fixture from the currently displayed server revision.
    detail.run.revision = 999;
    signalPoll();
    await pollHeld;
    await route.fulfill({ response, json: detail });
  });
  const latePoll = page.waitForResponse((response) =>
    response.url().endsWith('/technical-check-01/review'),
  );
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await pollStarted;
  await page
    .getByLabel('Who would the team contact first?', { exact: true })
    .fill('Synthetic incident lead through the controller.');
  finishPoll();
  await latePoll;
  await page.unroute('**/technical-check-01/review');
  await expect(page.locator('.run-meta')).toContainText('Run revision 1');
  await page
    .getByLabel('How would they contact them or find the details?', { exact: true })
    .fill('Consult the supplied synthetic contact card.');
  await page
    .getByLabel('What is their fallback or escalation route?', { exact: true })
    .fill('Ask the controller to represent the alternate route, without making calls.');
  await page
    .getByLabel('Decision rationale and gap disposition', { exact: true })
    .fill('Team oral response recorded; controller cover is a reviewed exercise assumption.');
  await page.getByLabel('Facilitator decision', { exact: true }).selectOption('ready');
  // Cross a polling interval with an unsaved oral answer; do not overwrite its context or text.
  await page.waitForTimeout(5500);
  await expect(page.getByLabel('Who would the team contact first?', { exact: true })).toHaveValue(
    'Synthetic incident lead through the controller.',
  );
  await fits(page);
  await page.screenshot({ path: testInfo.outputPath('step0-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await fits(page);
  await page.screenshot({ path: testInfo.outputPath('step0-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1080 });

  const participantContext = await browser.newContext({ baseURL });
  const observerContext = await browser.newContext({ baseURL });
  try {
    const participant = await participantContext.newPage();
    await login(participant, 'participant');
    await expect(
      participant.getByText('No injects released to you.', { exact: true }),
    ).toBeVisible();
    await expect(participant.getByText('PRIVATE CONTROL NOTE', { exact: false })).toHaveCount(0);
    await expect(
      participant.getByText('same controller as the simulated alternative channel', {
        exact: false,
      }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Record Step 0 decision', exact: true }).click();
    await expect(
      page.getByText('Team contact-route check recorded', { exact: true }),
    ).toBeVisible();
    await page.getByLabel('I have briefed the assigned roles', { exact: false }).check();
    await page.getByLabel('Facilitator decision', { exact: true }).selectOption('hold');
    await page
      .getByLabel('Decision rationale and gap disposition', { exact: true })
      .fill('Unsaved correction must not be hidden by starting.');
    await expect(page.getByRole('button', { name: 'Confirm briefing and start' })).toBeDisabled();
    await expect(page.getByLabel('Exercise', { exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Discard unsaved check', exact: true }).click();
    await page.getByLabel('I have briefed the assigned roles', { exact: false }).check();
    await page.getByRole('button', { name: 'Confirm briefing and start' }).click();
    await expect(page.getByRole('button', { name: 'Approve inject', exact: true })).toBeEnabled();
    const recipient = page
      .getByRole('group', { name: 'Recipients', exact: true })
      .getByRole('checkbox');
    await recipient.uncheck();
    const polled = page.waitForResponse(
      (response) =>
        response.url().endsWith('/technical-check-01/review') &&
        response.request().method() === 'GET',
    );
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await polled;
    await expect(recipient).not.toBeChecked();
    await recipient.check();
    await page.getByRole('button', { name: 'Approve inject', exact: true }).click();
    await expect(
      page.getByText('Exact revision and recipients approved.', { exact: true }),
    ).toBeVisible();
    const current = await (
      await page.request.get('/api/tracks/technical/runs/technical-check-01/review')
    ).json();
    const pause = await page.request.post('/api/tracks/technical/runs/technical-check-01/pause', {
      headers: { origin: baseURL! },
      data: { expectedRunRevision: current.run.revision, idempotencyKey: crypto.randomUUID() },
    });
    expect(pause.status()).toBe(200);
    // The facilitator learns about an external state change without pressing Refresh.
    await expect(page.getByRole('button', { name: 'Resume run', exact: true })).toBeVisible({
      timeout: 12000,
    });
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

    let releaseRequests = 0;
    await page.route('**/releases', async (route) => {
      releaseRequests++;
      const committed = await route.fetch();
      expect(committed.status()).toBe(200);
      await route.abort('failed');
    });
    await page.getByRole('button', { name: 'Release to inbox', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Retry last request', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Refresh exercises', exact: true }),
    ).toBeDisabled();
    await page.waitForTimeout(5500);
    expect(releaseRequests).toBe(1);
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

    await expect(
      participant.getByRole('heading', { name: 'File access report', exact: true }),
    ).toBeVisible({ timeout: 12000 });
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
