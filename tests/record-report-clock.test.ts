import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  planClockReference,
  releasedExerciseClocks,
  type ClockReference,
} from '../src/server/record-report-clock.js';
import { parseReferenceTime } from '../src/server/threat-library.js';
import { generationProfile } from './generation-fixture.js';

const reference = (time = '2026-09-28T09:00:00+08:00'): ClockReference => ({
  text: `FACT / Test service / description: Synthetic reference ${time} Test evidence.`,
  time: parseReferenceTime(time)!,
});
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
    release('release-' + i, minutes, i === 1 ? reference().text : ''),
  );
  const original = structuredClone(inputs),
    clocks = releasedExerciseClocks(inputs, reference());
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
  assert.deepEqual(clocks.get('release-0')!.citations, ['release-0', 'release-1']);
  assert.deepEqual(clocks.get('release-1')!.citations, ['release-1']);
  assert.deepEqual(inputs, original);
});

test('clock arithmetic retains the explicit timezone and rolls over dates, not the host timezone', () => {
  for (const offset of ['+08:00', '-04:00', 'Z']) {
    const ref = reference('2026-09-30T23:30:00' + offset);
    const clock = releasedExerciseClocks([release('r', 90, ref.text)], ref).get('r')!;
    assert.equal(
      clock.value,
      '+90 elapsed minutes / 2026-10-01 01:00:00 (UTC' + (offset === 'Z' ? '+00:00' : offset) + ')',
    );
  }
});

test('reference times must be real calendar times with an explicit offset', () => {
  assert.deepEqual(parseReferenceTime('Studio start 2026-11-02T08:30Z (GMT)'), {
    local: '2026-11-02T08:30:00',
    offset: 'Z',
    milliseconds: Date.parse('2026-11-02T08:30:00Z'),
  });
  assert.equal(parseReferenceTime('2028-02-29T09:00:00+08:00')?.local, '2028-02-29T09:00:00');
  for (const value of [
    '2026-02-30T09:00:00+08:00',
    '2026-02-29T09:00+08:00',
    '2026-04-31T09:00Z',
    '2026-13-01T09:00Z',
    '2026-02-28T24:30Z',
    '2026-09-28T09:00:00+99:00',
    '2026-09-28T09:00:00',
    '28 September 2026 09:00 SGT',
  ])
    assert.equal(parseReferenceTime(value), null, value);
});

test('only the plan reference claim, rendered exactly and released, sets exercise time', () => {
  const planned = planClockReference(generationProfile, 'reference')!;
  assert.equal(
    planned.text,
    'FACT / Engineering service / description: 2026-09-28T09:00:00+08:00 Test evidence reference.',
  );
  // Not released, or a different reference-looking line, leaves the time unavailable.
  for (const fact of [
    '',
    'FACT / Test service / description: Company-wide fictional reference time: synthetic reference (2026-09-28T11:00:00+08:00).',
    planned.text.replace('FACT', 'PROPOSAL'),
    planned.text + ' Additional text.',
  ]) {
    const clock = releasedExerciseClocks([release('r', 30, fact)], planned).get('r')!;
    assert.equal(clock.value, '+30 elapsed minutes / exercise time unavailable');
    assert.deepEqual(clock.citations, ['r']);
  }
  assert.equal(
    releasedExerciseClocks([release('r', 30, planned.text)], null).get('r')!.value,
    '+30 elapsed minutes / exercise time unavailable',
  );
  // Proposed, unknown, impossible or absent reference claims never become a clock.
  const variant = (value: string | null, status: 'fact' | 'proposal' | 'unknown') => {
    const profile = structuredClone(generationProfile);
    const claim = profile.environment!.claims.find((item) => item.id === 'reference')!;
    Object.assign(claim, { value, status });
    return planClockReference(profile, 'reference');
  };
  assert.equal(variant('2026-09-28T09:00:00+08:00', 'proposal'), null);
  assert.equal(variant(null, 'unknown'), null);
  assert.equal(variant('2026-02-30T09:00:00+08:00', 'fact'), null);
  assert.equal(planClockReference(generationProfile, 'missing-claim'), null);
});

for (const field of ['value', 'explanation'] as const) {
  for (const [referenceLabel, referenceEnding] of [
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ] as const) {
    for (const [releaseLabel, releaseEnding] of [
      ['LF', '\n'],
      ['CRLF', '\r\n'],
    ] as const) {
      test(`clock matches ${field} with ${referenceLabel} reference and ${releaseLabel} release line endings`, () => {
        const profile = structuredClone(generationProfile);
        const claim = profile.environment!.claims.find((item) => item.id === 'reference')!;
        claim[field] = `${claim[field]}${referenceEnding}Synthetic continuation.`;
        const planned = planClockReference(profile, 'reference')!;
        const inputs = [
          release('reference-release', 0, planned.text),
          release('later-release', 30),
        ];
        for (const input of inputs)
          for (const delivery of input.deliveries)
            delivery.body = delivery.body.replace(/\r?\n/g, releaseEnding);
        const original = structuredClone({ profile, planned, inputs });
        const clocks = releasedExerciseClocks(inputs, planned);
        assert.deepEqual(
          [...clocks.values()],
          [
            {
              value: '+0 elapsed minutes / 2026-09-28 09:00:00 (UTC+08:00)',
              citations: ['reference-release'],
            },
            {
              value: '+30 elapsed minutes / 2026-09-28 09:30:00 (UTC+08:00)',
              citations: ['later-release', 'reference-release'],
            },
          ],
        );
        assert.deepEqual({ profile, planned, inputs }, original);
      });
    }
  }
}

test('clock line-ending tolerance does not accept changed words whitespace or knowledge state', () => {
  const profile = structuredClone(generationProfile);
  const claim = profile.environment!.claims.find((item) => item.id === 'reference')!;
  claim.explanation = 'Synthetic reference.\r\nConfirmed for this exercise.';
  const planned = planClockReference(profile, 'reference')!;
  for (const fact of [
    planned.text.replace('Synthetic', 'Altered'),
    planned.text.replace('Synthetic reference.', 'Synthetic  reference.'),
    planned.text.replace(/\r\n/g, ' '),
    planned.text.replace(/\r\n/g, '\r'),
    planned.text.replace('FACT /', 'PROPOSAL /'),
    ' ' + planned.text,
    planned.text + ' Additional text.',
  ]) {
    const clock = releasedExerciseClocks([release('r', 30, fact)], planned).get('r')!;
    assert.equal(clock.value, '+30 elapsed minutes / exercise time unavailable');
    assert.deepEqual(clock.citations, ['r']);
  }
});

test('missing inconsistent and out-of-range role headers never borrow another position clock', () => {
  for (const badBody of [
    'No clock supplied.',
    'SIMULATION / +60 elapsed minutes\nEvent.',
    'SIMULATION / +999 elapsed minutes\nEvent.',
  ]) {
    const input = release('r', 30, reference().text);
    input.deliveries[1]!.body = badBody;
    const clock = releasedExerciseClocks([input], reference()).get('r')!;
    assert.equal(clock.value, 'elapsed minutes unavailable / exercise time unavailable');
    assert.deepEqual(clock.citations, ['r']);
  }
});
