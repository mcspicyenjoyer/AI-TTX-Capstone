import assert from 'node:assert/strict';
import { test } from 'node:test';
import { releasedExerciseClocks } from '../src/server/record-report-clock.js';

const reference = (time = '2026-09-28T09:00:00+08:00') =>
  `FACT / Test service / description: Company-wide fictional reference time: synthetic reference (${time}).`;
const release = (id: string, minutes: number, fact = '') => ({
  id,
  body: 'Role-specific simulation.',
  deliveries: [
    { actorId: 'business', body: `SIMULATION / +${minutes} elapsed minutes\n${fact}` },
    { actorId: 'engineering', body: `SIMULATION / +${minutes} elapsed minutes\nTest event.` },
    { actorId: 'it', body: `SIMULATION / +${minutes} elapsed minutes\nTest event.` },
  ],
});

test('fictional clocks use released offsets and the released reference, with exact source IDs', () => {
  const inputs = [0, 30, 90, 180, 240].map((minutes, i) =>
    release('release-' + i, minutes, i ? '' : reference()),
  );
  const original = structuredClone(inputs),
    clocks = releasedExerciseClocks(inputs);
  assert.deepEqual(
    [...clocks.values()].map((clock) => clock.value),
    [
      '+0 elapsed minutes / 2026-09-28 09:00:00 (UTC+08:00)',
      '+30 elapsed minutes / 2026-09-28 09:30:00 (UTC+08:00)',
      '+90 elapsed minutes / 2026-09-28 10:30:00 (UTC+08:00)',
      '+180 elapsed minutes / 2026-09-28 12:00:00 (UTC+08:00)',
      '+240 elapsed minutes / 2026-09-28 13:00:00 (UTC+08:00)',
    ],
  );
  assert.deepEqual(clocks.get('release-0')!.citations, ['release-0']);
  assert.deepEqual(clocks.get('release-3')!.citations, ['release-3', 'release-0']);
  assert.deepEqual(inputs, original);
});

test('clock arithmetic retains the explicit timezone and rolls over dates, not the host timezone', () => {
  for (const offset of ['+08:00', '-04:00', 'Z']) {
    const clock = releasedExerciseClocks([
      release('r', 90, reference('2026-09-30T23:30:00' + offset)),
    ]).get('r')!;
    assert.equal(
      clock.value,
      '+90 elapsed minutes / 2026-10-01 01:00:00 (UTC' + (offset === 'Z' ? '+00:00' : offset) + ')',
    );
  }
});

test('missing malformed proposed and conflicting references do not become exercise times', () => {
  for (const fact of [
    '',
    reference().replace('FACT', 'PROPOSAL'),
    reference().replace('FACT', 'UNKNOWN'),
    reference('2026-02-30T09:00:00+08:00'),
    reference('2026-09-28T09:00:00+99:00'),
  ]) {
    const clock = releasedExerciseClocks([release('r', 30, fact)]).get('r')!;
    assert.equal(clock.value, '+30 elapsed minutes / exercise time unavailable');
  }
  const clocks = releasedExerciseClocks([
    release('r1', 0, reference()),
    release('r2', 30, reference('2026-09-28T10:00:00+08:00')),
  ]);
  assert([...clocks.values()].every((clock) => clock.value.endsWith('exercise time unavailable')));
});

test('missing inconsistent and out-of-range role headers never borrow another position clock', () => {
  for (const badBody of [
    'No clock supplied.',
    'SIMULATION / +60 elapsed minutes\nEvent.',
    'SIMULATION / +999 elapsed minutes\nEvent.',
  ]) {
    const input = release('r', 30, reference());
    input.deliveries[1]!.body = badBody;
    const clock = releasedExerciseClocks([input]).get('r')!;
    assert.equal(clock.value, 'elapsed minutes unavailable / exercise time unavailable');
    assert.deepEqual(clock.citations, ['r']);
  }
});
