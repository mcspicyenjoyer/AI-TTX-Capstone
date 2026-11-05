import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exerciseText, optionLabel, sourceTitle } from '../src/ui/exercise-format.js';

test('source-title aliases remove only the four fixture labels without changing source identity', () => {
  const sources = [
    { id: 'setup-v1', title: 'Synthetic organisation brief' },
    { id: 'network-v1', title: 'Synthetic network inventory' },
    { id: 'bcp-v1', title: 'Synthetic continuity notes' },
    { id: 'drp-v1', title: 'Synthetic recovery notes' },
  ];
  const original = JSON.stringify(sources);
  assert.deepEqual(
    sources.map((source) => sourceTitle(source.title)),
    ['Organisation brief', 'Network inventory', 'Continuity notes', 'Recovery notes'],
  );
  assert.equal(JSON.stringify(sources), original);
  for (const title of [
    'Synthetic biology network',
    'Synthetic draft BCP',
    'Teralqen draft BCP',
    'constructor',
    '',
  ]) {
    assert.equal(sourceTitle(title), title);
  }
});

test('controlled option labels use sentence case and preserve domain acronyms and values', () => {
  const values = [
    'obtain-isolation-authority',
    'ransom-note',
    'clarification-required',
    'mfa',
    'rto-hours',
    'rpo-hours',
    'internal-it',
    'msp-and-mssp',
    'bcp-drp-bia-soc',
    'JSON status',
    '',
  ];
  const original = JSON.stringify(values);
  assert.deepEqual(values.map(optionLabel), [
    'Obtain isolation authority',
    'Ransom note',
    'Clarification required',
    'MFA',
    'RTO hours',
    'RPO hours',
    'Internal IT',
    'MSP and MSSP',
    'BCP DRP BIA SOC',
    'JSON status',
    '',
  ]);
  assert.equal(JSON.stringify(values), original);
});

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
  assert.equal(exerciseText('SIMULATED SCENARIO: suspected ransomware.'), 'Suspected ransomware.');
  assert.equal(exerciseText('lowercase original quotation.'), 'lowercase original quotation.');
});

test('presentation is not a general word scrubber and leaves arbitrary story and source wording intact', () => {
  const message =
    'The synthetic workload failed during a simulation. This is a fictional example in the supplied source.\r\nPayment and recovery remain unverified.';
  assert.equal(exerciseText(message), message);
  assert.equal(exerciseText('FACT / Backup tested: unknown'), 'FACT / Backup tested: unknown');
});
