import { Type, type Static } from '@sinclair/typebox';
import { IdSchema } from './profile.js';
import { decisions } from './generation.js';

const strict = { additionalProperties: false };
const hash = Type.String({ pattern: '^[a-f0-9]{64}$' });
const at = Type.String({ format: 'date-time' });
const text = (maxLength: number) => Type.String({ minLength: 1, maxLength });
export const ReportRecordSchema = Type.Object(
  {
    id: IdSchema,
    kind: Type.Union(
      (
        [
          'boundary',
          'run',
          'package',
          'step0',
          'release',
          'response',
          'disposition',
          'closure',
          'completion',
          'activity',
          'interpretation',
        ] as const
      ).map((value) => Type.Literal(value)),
    ),
    revision: Type.Union([Type.Integer({ minimum: 1 }), Type.Null()]),
    recordedAt: Type.Union([at, Type.Null()]),
    actorId: Type.Union([IdSchema, Type.Null()]),
    position: Type.Union([Type.Integer({ minimum: 1, maximum: 5 }), Type.Null()]),
    fields: Type.Array(
      Type.Object(
        {
          label: text(160),
          value: Type.String({ maxLength: 12000 }),
          citations: Type.Array(IdSchema, { minItems: 1, maxItems: 3, uniqueItems: true }),
        },
        strict,
      ),
      { minItems: 1, maxItems: 120 },
    ),
  },
  strict,
);
export const RecordReportSchema = Type.Object(
  {
    id: IdSchema,
    version: Type.Literal('app-record-report-1'),
    runId: IdSchema,
    ownerId: IdSchema,
    createdAt: at,
    packageId: IdSchema,
    packageRevisionId: IdSchema,
    packageHash: hash,
    objectives: Type.Array(
      Type.Object(
        {
          id: Type.Union(decisions.map((value) => Type.Literal(value))),
          text: text(700),
          positions: Type.Array(Type.Integer({ minimum: 1, maximum: 5 }), {
            minItems: 1,
            maxItems: 5,
            uniqueItems: true,
          }),
        },
        strict,
      ),
      { minItems: 3, maxItems: 3 },
    ),
    records: Type.Array(ReportRecordSchema, { minItems: 1, maxItems: 12000 }),
    timeline: Type.Array(IdSchema, { maxItems: 12000, uniqueItems: true }),
  },
  strict,
);
export const RecordReportViewSchema = Type.Object({ report: RecordReportSchema, hash }, strict);
export const RecordReportListSchema = Type.Array(
  Type.Object({ id: IdSchema, createdAt: at, hash }, strict),
  { maxItems: 100 },
);
export const CaptureRecordReportSchema = Type.Object({ commandId: IdSchema }, strict);
export type ReportRecord = Static<typeof ReportRecordSchema>;
export type RecordReport = Static<typeof RecordReportSchema>;
export type RecordReportView = Static<typeof RecordReportViewSchema>;

// Citations resolve inside the immutable snapshot, not against later mutable reviews.
export function checkReportReferences(report: RecordReport): void {
  const ids = new Set(report.records.map((record) => record.id));
  if (
    ids.size !== report.records.length ||
    !ids.has(report.id) ||
    !ids.has(report.runId) ||
    !ids.has(report.packageId)
  )
    throw new Error('Record report inventory is inconsistent.');
  const positions = report.objectives.flatMap((objective) => objective.positions).sort();
  if (
    JSON.stringify(positions) !== JSON.stringify([1, 2, 3, 4, 5]) ||
    JSON.stringify(report.objectives.map((objective) => objective.id)) !== JSON.stringify(decisions)
  )
    throw new Error('Record report objective mapping is inconsistent.');
  for (const record of report.records) {
    for (const field of record.fields)
      if (!field.citations.includes(record.id) || field.citations.some((id) => !ids.has(id)))
        throw new Error('Unresolvable record report citation.');
  }
  if (report.timeline.some((id) => !ids.has(id)))
    throw new Error('Unresolvable timeline citation.');
  const timed = report.records.filter(
    (record) => record.recordedAt && !['boundary', 'run', 'package'].includes(record.kind),
  );
  if (
    report.timeline.length !== timed.length ||
    timed.some((record) => !report.timeline.includes(record.id))
  )
    throw new Error('Incomplete record report timeline.');
}
