import type { Release } from '../contracts/exercise.js';

type ReleasedText = Pick<Release, 'id' | 'body' | 'deliveries'>;
const bodies = (release: ReleasedText) =>
  release.deliveries?.length ? release.deliveries.map((delivery) => delivery.body) : [release.body];

function referenceTime(line: string) {
  const match =
    /Company-wide fictional reference time: [^(\r\n]*\((\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(Z|[+-]\d{2}:\d{2})\)/.exec(
      line,
    );
  if (!match) return null;
  const local = match[1]!,
    offset = match[2]!,
    milliseconds = Date.parse(local + 'Z');
  if (
    !Number.isFinite(milliseconds) ||
    !Number.isFinite(Date.parse(local + offset)) ||
    new Date(milliseconds).toISOString().slice(0, 19) !== local
  )
    return null;
  return { local, offset, milliseconds };
}

// The frozen releases predate structured clock fields. Read only their known
// simulation header and explicit FACT reference, never response text or wall time.
export function releasedExerciseClocks(releases: ReleasedText[]) {
  const references = releases.flatMap((release) =>
    bodies(release).flatMap((body) =>
      body
        .split(/\r?\n/)
        .filter((line) =>
          /^FACT \/ .+ \/ description: Company-wide fictional reference time: /.test(line),
        )
        .map((line) => ({ releaseId: release.id, time: referenceTime(line) })),
    ),
  );
  const first = references[0];
  const reference =
    first?.time &&
    references.every(
      (item) => item.time?.local === first.time!.local && item.time?.offset === first.time!.offset,
    )
      ? first
      : null;

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
        minutes !== null && reference?.time
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
          citations: [
            ...new Set([
              release.id,
              ...(minutes !== null && reference ? [reference.releaseId] : []),
            ]),
          ],
        },
      ];
    }),
  );
}
