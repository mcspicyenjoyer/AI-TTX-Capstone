import { test as base, expect, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

// Each exercise case has its own real server and disposable database.
export const test = base.extend<{ exerciseServer: string }>({
  exerciseServer: [
    async ({ baseURL }, use) => {
      const directory = mkdtempSync(join(tmpdir(), 'ttx-browser-case-'));
      let server: ChildProcess | undefined;
      let startupError: Error | undefined;
      process.env.TTX_EXERCISE_BROWSER_DATA_DIR = directory;
      try {
        server = spawn(process.execPath, ['--import', 'tsx', 'scripts/browser-server.ts'], {
          env: {
            ...process.env,
            TTX_DATA_DIR: directory,
            TTX_BROWSER_PORT: new URL(baseURL!).port,
          },
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
        await use(directory);
      } finally {
        if (server && server.exitCode === null && server.signalCode === null) {
          const closed = once(server, 'close');
          server.kill('SIGTERM');
          await closed;
        }
        delete process.env.TTX_EXERCISE_BROWSER_DATA_DIR;
        rmSync(directory, { recursive: true, force: true });
      }
    },
    { auto: true },
  ],
});
export { expect };

export function access(username: string): string {
  const directory = process.env.TTX_EXERCISE_BROWSER_DATA_DIR;
  if (!directory) throw new Error('Missing exercise test directory.');
  const filename = ['facilitator', 'participant'].includes(username)
    ? 'demo-access.json'
    : 'demo-track-access.json';
  return JSON.parse(readFileSync(join(directory, filename), 'utf8'))[username];
}
export async function login(page: Page, username: string) {
  await page.goto('/');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Access code', { exact: true }).fill(access(username));
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
export const root = '/api/tracks/technical/runs/technical-check-01';
export async function command(
  page: Page,
  baseURL: string,
  action: string,
  extra: Record<string, unknown> = {},
) {
  const review = await (await page.request.get(`${root}/review`)).json();
  const response = await page.request.post(`${root}/${action}`, {
    headers: { origin: baseURL },
    data: { expectedRunRevision: review.run.revision, idempotencyKey: randomUUID(), ...extra },
  });
  expect(response.status()).toBe(200);
  return response.json();
}
export async function prepare(page: Page, baseURL: string, paused = false) {
  await login(page, 'facilitator');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Confirm revision', exact: true }).click();
  await expect(page.getByText('Revision confirmed', { exact: true })).toBeVisible();
  const review = await (await page.request.get(`${root}/review`)).json();
  await command(page, baseURL, 'step0', {
    packageHash: review.packageHash,
    assignmentHash: review.assignmentHash,
    respondentIds: ['demo-participant', 'demo-observer'],
    firstContact: 'Incident lead.',
    contactRoute: 'Synthetic card.',
    fallback: 'Alternate controller.',
    decision: 'ready',
    rationale: 'Both assigned roles represented in the fixture.',
  });
  await command(page, baseURL, 'start', {
    packageHash: review.packageHash,
    assignmentHash: review.assignmentHash,
    acknowledgeBriefing: true,
    acknowledgeGaps: true,
    acknowledgeSimulation: true,
  });
  await command(page, baseURL, 'approvals', {
    packageHash: review.packageHash,
    injectId: review.nextInject.id,
    injectRevisionId: review.package.injects[0].revisionId,
    contentHash: review.nextInject.contentHash,
    recipientIds: ['demo-participant'],
  });
  if (paused) await command(page, baseURL, 'pause');
  await page.getByRole('button', { name: 'Exercises', exact: true }).click();
  await expect(page.locator('.run-meta')).toBeVisible();
}
export async function answerStep0(page: Page, decision: string, rationale: string) {
  await page
    .getByLabel('Who would the team contact first?', { exact: true })
    .fill('Incident lead.');
  await page
    .getByLabel('How would they contact them or find the details?', { exact: true })
    .fill('Consult the synthetic contact card.');
  await page
    .getByLabel('What is their fallback or escalation route?', { exact: true })
    .fill('Controller represents the alternate route.');
  await page.getByLabel('Facilitator decision', { exact: true }).selectOption(decision);
  await page.getByLabel('Decision rationale and gap disposition', { exact: true }).fill(rationale);
}
export async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await page.locator('.run-actions').evaluateAll((groups) =>
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
    ),
  ).toBe(false);
}
