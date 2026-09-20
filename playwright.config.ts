import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = process.env.TTX_BROWSER_DATA_DIR ?? join(tmpdir(), `ttx-browser-${randomUUID()}`);
process.env.TTX_BROWSER_DATA_DIR = directory;

export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3001',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node --import tsx scripts/browser-server.ts',
    url: 'http://127.0.0.1:3001/healthz',
    reuseExistingServer: false,
    env: { TTX_DATA_DIR: directory },
  },
});
