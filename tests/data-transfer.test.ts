import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join, resolve } from 'node:path';
import { archiveName, insideRepository, projectName } from '../scripts/data-transfer.js';

// ADR-040: archives carry access codes, so they must never be written into the checkout.
test('data transfer refuses archive folders inside the repository and names archives safely', () => {
  const root = resolve('C:/work/AI-TTX-Capstone');
  assert.equal(insideRepository(root, root), true);
  assert.equal(insideRepository(join(root, 'backups'), root), true);
  assert.equal(insideRepository(resolve('C:/work/elsewhere'), root), false);
  assert.equal(insideRepository(resolve('C:/work/AI-TTX-Capstone-data'), root), false);
  assert.equal(insideRepository(resolve('D:/transfers'), root), false);
  assert.equal(
    archiveName('ai-ttx-intake-preview', new Date('2026-11-05T06:22:18.123Z')),
    'ai-ttx-intake-preview-data-20261105-062218.tgz',
  );
  assert.equal(projectName('ttx-storyline'), 'ttx-storyline');
  for (const bad of [undefined, '', 'Bad Name', '../escape', '-leading'])
    assert.throws(() => projectName(bad), /Compose project name/);
});
