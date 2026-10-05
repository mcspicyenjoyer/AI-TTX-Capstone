import { test, expect, prepare, command, root, answerStep0, fits } from './exercise-fixture.js';

test('stale Step 0 save retains answers and respondents through failed and reviewed refresh', async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await prepare(page, baseURL!, true);
  const recordCheck = page.getByRole('button', { name: 'Record Step 0 decision', exact: true });
  const refreshDraft = page.getByRole('button', {
    name: 'Refresh context and keep draft',
    exact: true,
  });
  const discardDraft = page.getByRole('button', { name: 'Discard unsaved check', exact: true });
  const reviewedDraft = page.getByLabel(
    'I have reviewed this draft against the refreshed context.',
    { exact: true },
  );
  await answerStep0(page, 'hold', 'Local unsaved correction after another facilitator decision.');
  const observerRespondent = page
    .getByRole('group', { name: "Record the team's oral answers", exact: true })
    .getByLabel('Unaddressed participant', { exact: true });
  await observerRespondent.check();
  await expect(page.getByRole('button', { name: 'Resume run', exact: true })).toBeDisabled();
  const beforeCorrection = await (
    await page.request.get('/api/tracks/technical/runs/technical-check-01/review')
  ).json();
  const otherCheck = await page.request.post(
    '/api/tracks/technical/runs/technical-check-01/step0',
    {
      headers: { origin: baseURL! },
      data: {
        expectedRunRevision: beforeCorrection.run.revision,
        idempotencyKey: crypto.randomUUID(),
        packageHash: beforeCorrection.packageHash,
        assignmentHash: beforeCorrection.assignmentHash,
        respondentIds: ['demo-participant', 'demo-observer'],
        firstContact: 'Controller as incident lead.',
        contactRoute: 'Synthetic card.',
        fallback: 'Alternate controller route.',
        decision: 'hold',
        rationale: 'Another facilitator records a Hold pending clarification.',
      },
    },
  );
  expect(otherCheck.status()).toBe(200);
  const staleCheck = page.waitForResponse(
    (response) => response.url().endsWith('/step0') && response.status() === 409,
  );
  await recordCheck.click();
  await staleCheck;
  await expect(recordCheck).toBeDisabled();
  await expect(page.getByLabel('Facilitator decision', { exact: true })).toHaveValue('hold');
  await expect(observerRespondent).toBeChecked();
  await page.route('**/technical-check-01/review', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'Synthetic draft refresh failure.' } }),
    }),
  );
  await refreshDraft.click();
  await expect(page.getByRole('alert')).toContainText('Synthetic draft refresh failure.');
  await expect(page.getByLabel('Facilitator decision', { exact: true })).toHaveValue('hold');
  await expect(recordCheck).toBeDisabled();
  await expect(discardDraft).toBeEnabled();
  await page.unroute('**/technical-check-01/review');
  await refreshDraft.click();
  await expect(reviewedDraft).toBeVisible();
  await expect(
    page.getByText('Original run revision: 5. Current run revision: 6.', { exact: false }),
  ).toBeVisible();
  await expect(recordCheck).toBeDisabled();
  await expect(observerRespondent).toBeChecked();
  await expect(page.getByLabel('Who would the team contact first?', { exact: true })).toHaveValue(
    'Incident lead.',
  );
  await expect(page.getByText('Team contact-route check recorded', { exact: true })).toHaveCount(2);
  await fits(page);
  await page.screenshot({
    path: testInfo.outputPath('retained-draft-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await fits(page);
  await page.screenshot({
    path: testInfo.outputPath('retained-draft-mobile.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1080 });
  await reviewedDraft.check();
  await recordCheck.click();
  await expect(page.getByText('Team contact-route check recorded', { exact: true })).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Resume run', exact: true })).toBeDisabled();

  expect(errors).toEqual([]);
});

test('uncertain Step 0 receipt preserves a newer Hold and terminal access recovery', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await prepare(page, baseURL!, true);
  const initial = await (await page.request.get(`${root}/review`)).json();
  for (let index = 0; index < 2; index++)
    await command(page, baseURL!, 'step0', {
      packageHash: initial.packageHash,
      assignmentHash: initial.assignmentHash,
      respondentIds: ['demo-participant', 'demo-observer'],
      firstContact: 'Incident lead.',
      contactRoute: 'Synthetic card.',
      fallback: 'Alternate route unclear.',
      decision: 'hold',
      rationale: 'Earlier clarification history for the retry fixture.',
    });
  await page.getByRole('button', { name: 'Refresh exercises', exact: true }).click();
  const recordCheck = page.getByRole('button', { name: 'Record Step 0 decision', exact: true });
  const refreshDraft = page.getByRole('button', {
    name: 'Refresh context and keep draft',
    exact: true,
  });
  const discardDraft = page.getByRole('button', { name: 'Discard unsaved check', exact: true });
  const reviewedDraft = page.getByLabel(
    'I have reviewed this draft against the refreshed context.',
    { exact: true },
  );
  await answerStep0(page, 'ready', 'Reviewed clarification permits continuing the fixture.');
  let step0Requests = 0;
  await page.route('**/step0', async (route) => {
    step0Requests++;
    const committed = await route.fetch();
    expect(committed.status()).toBe(200);
    await route.abort('failed');
  });
  await recordCheck.click();
  await expect(page.getByRole('button', { name: 'Retry last request', exact: true })).toBeVisible();
  await expect(refreshDraft).toBeDisabled();
  await expect(discardDraft).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Refresh exercises', exact: true })).toBeDisabled();
  await page.waitForTimeout(5500);
  expect(step0Requests).toBe(1);
  const beforeRetry = await (
    await page.request.get('/api/tracks/technical/runs/technical-check-01/review')
  ).json();
  const newerHold = await page.request.post('/api/tracks/technical/runs/technical-check-01/step0', {
    headers: { origin: baseURL! },
    data: {
      expectedRunRevision: beforeRetry.run.revision,
      idempotencyKey: crypto.randomUUID(),
      packageHash: beforeRetry.packageHash,
      assignmentHash: beforeRetry.assignmentHash,
      respondentIds: ['demo-participant', 'demo-observer'],
      firstContact: 'Incident lead.',
      contactRoute: 'Synthetic card.',
      fallback: 'Alternate route remains unclear.',
      decision: 'hold',
      rationale: 'A newer Hold must remain current after retrying the earlier saved Ready.',
    },
  });
  expect(newerHold.status()).toBe(200);
  await page.unroute('**/step0');
  await page.route('**/technical-check-01/review', (route) =>
    route.fulfill({
      status: 500,
      json: { error: { message: 'Synthetic post-retry read failure.' } },
    }),
  );
  await page.getByRole('button', { name: 'Retry last request', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Synthetic post-retry read failure.');
  await expect(page.getByRole('button', { name: 'Resume run', exact: true })).toHaveCount(0);
  await page.unroute('**/technical-check-01/review');
  await page.getByRole('button', { name: 'Refresh exercises', exact: true }).click();
  await expect(page.getByText('Team contact-route check recorded', { exact: true })).toHaveCount(5);
  await expect(
    page.getByText('A current Ready decision is required before play.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume run', exact: true })).toBeDisabled();
  await answerStep0(page, 'ready', 'Clarification reviewed after the newer Hold.');
  await recordCheck.click();
  await expect(page.getByRole('button', { name: 'Resume run', exact: true })).toBeEnabled();

  // UI-only terminal-access fixtures: the outcome remains unknown, but retry cannot trap private state.
  for (const status of [403, 404]) {
    await answerStep0(page, 'hold', `Unknown command followed by ${status}.`);
    let originalBody: string | null = null;
    await page.route('**/step0', async (route) => {
      originalBody = route.request().postData();
      await route.abort('failed');
    });
    await recordCheck.click();
    await expect(
      page.getByRole('button', { name: 'Retry last request', exact: true }),
    ).toBeVisible();
    await page.unroute('**/step0');
    await page.route('**/step0', async (route) => {
      expect(route.request().postData()).toBe(originalBody);
      await route.fulfill({
        status,
        json: { error: { message: 'Synthetic access unavailable.' } },
      });
    });
    await page.getByRole('button', { name: 'Retry last request', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Synthetic access unavailable.');
    await expect(page.getByRole('button', { name: 'Retry last request', exact: true })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole('heading', { name: 'Step 0: Starting arrangements', exact: true }),
    ).toHaveCount(0);
    await expect(discardDraft).toBeEnabled();
    await page.unroute('**/step0');
    await refreshDraft.click();
    await expect(
      page.getByText('An earlier Step 0 request has an unconfirmed outcome.', { exact: false }),
    ).toBeVisible();
    await reviewedDraft.check();
    await expect(recordCheck).toBeDisabled();
    await discardDraft.click();
    await expect(page.getByRole('button', { name: 'Resume run', exact: true })).toBeEnabled();
  }

  expect(errors).toEqual([]);
});

test('changed bindings and external resume retain Step 0 draft recovery', async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await prepare(page, baseURL!, true);
  const recordCheck = page.getByRole('button', { name: 'Record Step 0 decision', exact: true });
  const refreshDraft = page.getByRole('button', {
    name: 'Refresh context and keep draft',
    exact: true,
  });
  const discardDraft = page.getByRole('button', { name: 'Discard unsaved check', exact: true });
  const reviewedDraft = page.getByLabel(
    'I have reviewed this draft against the refreshed context.',
    { exact: true },
  );
  // A changed binding must not silently reattach the retained answers to different context.
  for (const field of ['assignmentHash', 'packageHash']) {
    await answerStep0(page, 'hold', `Draft for the previous ${field}.`);
    await page.route('**/technical-check-01/review', async (route) => {
      const response = await route.fetch();
      const detail = await response.json();
      detail[field] = 'f'.repeat(64);
      await route.fulfill({ response, json: detail });
    });
    await refreshDraft.click();
    await expect(
      page.getByText('The package or participants changed.', { exact: false }),
    ).toBeVisible();
    await expect(recordCheck).toBeDisabled();
    await expect(
      page.getByLabel('Decision rationale and gap disposition', { exact: true }),
    ).toHaveValue(`Draft for the previous ${field}.`);
    await expect(discardDraft).toBeEnabled();
    await page.unroute('**/technical-check-01/review');
    await discardDraft.click();
    await expect(page.getByRole('button', { name: 'Resume run', exact: true })).toBeEnabled();
  }

  await answerStep0(page, 'hold', 'A removed assignment must leave recovery reachable.');
  await page.route('**/api/tracks/technical/runs', (route) => route.fulfill({ json: [] }));
  await refreshDraft.click();
  await expect(page.getByRole('alert')).toContainText('This exercise is no longer assigned.');
  await expect(recordCheck).toHaveCount(0);
  await expect(discardDraft).toBeEnabled();
  await page.unroute('**/api/tracks/technical/runs');
  await discardDraft.click();
  await expect(page.getByRole('button', { name: 'Resume run', exact: true })).toBeEnabled();

  // Another session can resume while this browser is editing; retain the draft and recovery controls.
  await answerStep0(page, 'hold', 'Retain this correction across an external resume.');
  const beforeResume = await (
    await page.request.get('/api/tracks/technical/runs/technical-check-01/review')
  ).json();
  const externalResume = await page.request.post(
    '/api/tracks/technical/runs/technical-check-01/resume',
    {
      headers: { origin: baseURL! },
      data: {
        expectedRunRevision: beforeResume.run.revision,
        idempotencyKey: crypto.randomUUID(),
      },
    },
  );
  expect(externalResume.status()).toBe(200);
  await refreshDraft.click();
  await expect(page.getByText('The run is active.', { exact: false })).toBeVisible();
  await expect(recordCheck).toBeDisabled();
  await expect(page.getByLabel('Facilitator decision', { exact: true })).toHaveValue('hold');
  await expect(discardDraft).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Approve inject', exact: true })).toBeDisabled();
  await fits(page);
  await page.screenshot({
    path: testInfo.outputPath('active-draft-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await fits(page);
  await page.screenshot({ path: testInfo.outputPath('active-draft-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.getByRole('button', { name: 'Pause run', exact: true }).click();
  await expect(reviewedDraft).toBeVisible();
  await expect(recordCheck).toBeDisabled();
  await expect(
    page.getByLabel('Decision rationale and gap disposition', { exact: true }),
  ).toHaveValue('Retain this correction across an external resume.');
  await discardDraft.click();

  await page.getByRole('button', { name: 'Resume run', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Approve inject', exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});
