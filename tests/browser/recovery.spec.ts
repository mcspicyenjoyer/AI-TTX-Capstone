import { test, expect, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

test('real server restart returns to sign-in without reload and requires manual resume and fresh approval', async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(60000);
  const directory = mkdtempSync(join(tmpdir(), 'ttx-browser-restart-'));
  let server: ChildProcess | undefined;
  let startupError: Error | undefined;
  async function boot() {
    startupError = undefined;
    server = spawn(process.execPath, ['--import', 'tsx', 'scripts/browser-server.ts'], {
      env: { ...process.env, TTX_DATA_DIR: directory, TTX_BROWSER_PORT: '3003' },
      stdio: 'ignore',
    });
    server.once('error', (error) => {
      startupError = error;
    });
    await expect
      .poll(async () => {
        if (startupError) throw startupError;
        try {
          return (await fetch(`${baseURL}/healthz`)).status;
        } catch {
          return 0;
        }
      })
      .toBe(200);
  }
  async function stop() {
    if (server && server.exitCode === null && server.signalCode === null) {
      const closed = once(server, 'close');
      server.kill('SIGTERM');
      await closed;
    }
  }
  async function signIn(target: Page, username = 'facilitator') {
    const codes = JSON.parse(readFileSync(join(directory, 'demo-access.json'), 'utf8'));
    await target.getByLabel('Username', { exact: true }).fill(username);
    await target.getByLabel('Access code', { exact: true }).fill(codes[username]);
    await target.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  const root = '/api/tracks/technical/runs/technical-check-01';
  const participantContext = await browser.newContext({ baseURL });
  try {
    await boot();
    await page.goto('/');
    await signIn(page);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Confirm revision', exact: true }).click();
    await expect(page.getByText('Revision confirmed', { exact: true })).toBeVisible();
    async function review() {
      return (await page.request.get(`${root}/review`)).json();
    }
    async function command(action: string, data: Record<string, unknown> = {}) {
      const view = await review();
      const response = await page.request.post(`${root}/${action}`, {
        headers: { origin: baseURL! },
        data: { expectedRunRevision: view.run.revision, idempotencyKey: randomUUID(), ...data },
      });
      expect(response.status()).toBe(200);
      return response.json();
    }
    const view = await review();
    await command('step0', {
      packageHash: view.packageHash,
      assignmentHash: view.assignmentHash,
      respondentIds: ['demo-participant'],
      firstContact: 'Simulated incident lead.',
      contactRoute: 'Synthetic contact card.',
      fallback: 'Controller represents the alternate route.',
      decision: 'ready',
      rationale: 'Oral evidence for this fixture, not a contactability test.',
    });
    await command('start', {
      packageHash: view.packageHash,
      assignmentHash: view.assignmentHash,
      acknowledgeBriefing: true,
      acknowledgeGaps: true,
      acknowledgeSimulation: true,
    });
    await page.getByRole('button', { name: 'Exercises', exact: true }).click();
    await page.getByRole('button', { name: 'Approve inject', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Release to inbox', exact: true })).toBeEnabled();
    const participant = await participantContext.newPage();
    await participant.goto('/');
    await signIn(participant, 'participant');
    await expect(
      participant.getByText('No injects released to you.', { exact: true }),
    ).toBeVisible();
    await stop();
    await boot();
    // Exercise polling encounters the new process's invalidated sessions in both browser contexts.
    for (const target of [page, participant]) {
      await expect(target.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible({
        timeout: 15000,
      });
      await expect(
        target.getByText('Your session expired. Sign in again to check saved state.', {
          exact: true,
        }),
      ).toBeVisible();
    }
    await signIn(page);
    await signIn(participant, 'participant');
    await expect(page.getByRole('button', { name: 'Resume run', exact: true })).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Release to inbox', exact: true }),
    ).toBeDisabled();
    await expect(page.getByText('Restart detected; run paused', { exact: true })).toBeVisible();
    await expect(page.getByText('Team contact-route check recorded', { exact: true })).toHaveCount(
      1,
    );
    await page.getByRole('button', { name: 'Resume run', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Release to inbox', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Approve inject', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Release to inbox', exact: true })).toBeEnabled();

    // A mutation can also encounter expiry before the next poll. Neither sign-in nor polling retries it.
    await page.request.delete('/api/session', { headers: { origin: baseURL! } });
    await page.getByRole('button', { name: 'Release to inbox', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    await signIn(page);
    expect((await review()).releases).toHaveLength(0);
    await page.getByRole('button', { name: 'Release to inbox', exact: true }).click();
    await expect(
      participant.getByRole('heading', { name: 'File access report', exact: true }),
    ).toBeVisible({ timeout: 12000 });
    await expect(participant.locator('.inbox-item')).toHaveCount(1);
    expect((await review()).releases).toHaveLength(1);
  } finally {
    await participantContext.close();
    await stop();
    rmSync(directory, { recursive: true, force: true });
  }
});
