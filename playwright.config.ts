import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = process.env.TTX_BROWSER_DATA_DIR ?? join(tmpdir(), `ttx-browser-${randomUUID()}`);
process.env.TTX_BROWSER_DATA_DIR = directory;
const exerciseDirectory =
  process.env.TTX_EXERCISE_BROWSER_DATA_DIR ??
  join(tmpdir(), `ttx-exercise-browser-${randomUUID()}`);
process.env.TTX_EXERCISE_BROWSER_DATA_DIR = exerciseDirectory;

export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'profile', testMatch: 'profile.spec.ts', use: { baseURL: 'http://127.0.0.1:3001' } },
    { name: 'exercise', testMatch: 'exercise.spec.ts', use: { baseURL: 'http://127.0.0.1:3002' } },
  ],
  webServer: [
    {
      command: 'node --import tsx scripts/browser-server.ts',
      url: 'http://127.0.0.1:3001/healthz',
      reuseExistingServer: false,
      env: { TTX_DATA_DIR: directory, TTX_BROWSER_PORT: '3001' },
    },
    {
      command: 'node --import tsx scripts/browser-server.ts',
      url: 'http://127.0.0.1:3002/healthz',
      reuseExistingServer: false,
      env: { TTX_DATA_DIR: exerciseDirectory, TTX_BROWSER_PORT: '3002' },
    },
  ],
});
