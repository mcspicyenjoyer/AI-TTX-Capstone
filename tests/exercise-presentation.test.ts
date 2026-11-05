import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exerciseText } from '../src/ui/exercise-format.js';

test('exercise presentation removes known stock labels without changing the source record or clock', () => {
  const record = {
    body: 'SIMULATION / +45 elapsed minutes\nA simulated user report says shared files cannot be opened. Ransomware is suspected, not established.\nFACT / Company-wide fictional reference time: Monday 28 September 2026, 09:00 Singapore time (2026-09-28T09:00:00+08:00). All calls, payments, filings and external contacts are simulated.\nUNKNOWN / restore-tested: no value recorded',
  };
  const original = JSON.stringify(record);
  const display = exerciseText(record.body);
  assert(display.startsWith('+45 elapsed minutes\nA user report says'));
  assert(!/SIMULATION|fictional|simulated/.test(display));
  assert(display.includes('2026-09-28T09:00:00+08:00'));
  assert(display.includes('Ransomware is suspected, not established.'));
  assert(display.includes('UNKNOWN / restore-tested: no value recorded'));
  assert.equal(JSON.stringify(record), original);
  assert.equal(exerciseText('SIMULATED SCENARIO: Files unavailable.'), 'Files unavailable.');
});

test('presentation is not a general word scrubber and leaves arbitrary story and source wording intact', () => {
  const message =
    'The synthetic workload failed during a simulation. This is a fictional example in the supplied source.\r\nPayment and recovery remain unverified.';
  assert.equal(exerciseText(message), message);
  assert.equal(exerciseText('FACT / Backup tested: unknown'), 'FACT / Backup tested: unknown');
});
