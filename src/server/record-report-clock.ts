import type { Release } from '../contracts/exercise.js';
import type { Profile } from '../contracts/profile.js';
import { evidenceText } from './generation-content.js';
import { isReferenceTime, parseReferenceTime, type ReferenceTime } from './threat-library.js';

type ReleasedText = Pick<Release, 'id' | 'body' | 'deliveries'>;
export type ClockReference = { text: string; time: ReferenceTime };
const bodies = (release: ReleasedText) =>
  release.deliveries?.length ? release.deliveries.map((delivery) => delivery.body) : [release.body];

// The frozen plan names its reference claim. The clock needs that confirmed claim's exact
// rendered evidence line in a release; its time comes from the claim value, never other text.
export function planClockReference(profile: Profile, claimId: string): ClockReference | null {
  const claim = profile.environment?.claims.find((item) => item.id === claimId);
  if (!claim || !isReferenceTime(claim)) return null;
  const time = parseReferenceTime(String(claim.value));
  return time && { text: evidenceText({ claimId }, profile), time };
}

// The frozen releases predate structured clock fields. Read only their simulation header and
// the plan's released reference line, never response text or wall time.
export function releasedExerciseClocks(releases: ReleasedText[], reference: ClockReference | null) {
  // Compare line endings only; keep source text and all other characters unchanged.
  const line = reference && '\n' + reference.text.replace(/\r\n/g, '\n') + '\n';
  const source =
    line &&
    releases.find((release) =>
      bodies(release).some((body) => ('\n' + body.replace(/\r\n/g, '\n') + '\n').includes(line)),
    );

  return new Map(
    releases.map((release) => {
      const offsets = bodies(release).map((body) => {
        const match = /^SIMULATION \/ \+(0|[1-9]\d*) elapsed minutes(?:\r?\n|$)/.exec(body);
        const minutes = match ? Number(match[1]) : NaN;
        return Number.isInteger(minutes) && minutes >= 0 && minutes <= 240 ? minutes : null;
      });
      const minutes =
        offsets[0] !== null && offsets.every((value) => value === offsets[0]) ? offsets[0]! : null;
      const time =
        minutes !== null && source && reference
          ? new Date(reference.time.milliseconds + minutes * 60_000)
              .toISOString()
              .slice(0, 19)
              .replace('T', ' ') +
            ' (UTC' +
            (reference.time.offset === 'Z' ? '+00:00' : reference.time.offset) +
            ')'
          : 'exercise time unavailable';
      return [
        release.id,
        {
          value:
            (minutes === null
              ? 'elapsed minutes unavailable'
              : '+' + minutes + ' elapsed minutes') +
            ' / ' +
            time,
          citations: [...new Set([release.id, ...(minutes !== null && source ? [source.id] : [])])],
        },
      ];
    }),
  );
}
