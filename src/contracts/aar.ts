import { Type, type Static } from '@sinclair/typebox';
import { IdSchema } from './profile.js';
import { decisions } from './generation.js';
import { RecordReportViewSchema } from './record-report.js';

const strict = { additionalProperties: false };
const choice = <T extends string>(values: readonly T[]) =>
  Type.Union(values.map((value) => Type.Literal(value)));
const text = (maxLength: number) => Type.String({ minLength: 1, maxLength, pattern: '\\S' });
const hash = Type.String({ pattern: '^[a-f0-9]{64}$' });
const at = Type.String({ format: 'date-time' });
export const findingCategories = [
  'team-decision',
  'facilitator-observation',
  'reviewed-analysis',
  'profile-gap',
  'exercise-gap',
  'origin-not-established',
] as const;
export const AarEvidenceSchema = Type.Object(
  {
    recordId: IdSchema,
    field: text(160),
    quote: text(3000),
  },
  strict,
);
const FindingSchema = Type.Object(
  {
    id: IdSchema,
    category: choice(findingCategories),
    evidence: Type.Array(AarEvidenceSchema, { minItems: 1, maxItems: 4 }),
  },
  strict,
);
export const AarOutputSchema = Type.Object(
  {
    scope: Type.Literal('discussion-only'),
    objectives: Type.Array(
      Type.Object(
        {
          objectiveId: choice(decisions),
          strengths: Type.Array(FindingSchema, { maxItems: 4 }),
          areasForImprovement: Type.Array(FindingSchema, { maxItems: 4 }),
        },
        strict,
      ),
      { minItems: 3, maxItems: 3 },
    ),
    improvementActions: Type.Array(
      Type.Object(
        {
          id: IdSchema,
          findingIds: Type.Array(IdSchema, { minItems: 1, maxItems: 4, uniqueItems: true }),
          proposal: text(800),
          status: Type.Literal('proposed'),
          owner: Type.Literal(''),
        },
        strict,
      ),
      { maxItems: 12 },
    ),
  },
  strict,
);
const nullableOutput = Type.Union([AarOutputSchema, Type.Null()]);
export const AarRecordSchema = Type.Object(
  {
    id: IdSchema,
    runId: IdSchema,
    ownerId: IdSchema,
    snapshotId: IdSchema,
    snapshotHash: hash,
    revision: Type.Integer({ minimum: 1 }),
    status: choice(['queued', 'running', 'ready', 'failed', 'manual'] as const),
    promptVersion: text(100),
    createdAt: at,
    updatedAt: at,
    startedAt: Type.Union([at, Type.Null()]),
    finishedAt: Type.Union([at, Type.Null()]),
    error: Type.Union([text(300), Type.Null()]),
    inputTokens: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
    outputTokens: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
    proposal: nullableOutput,
    review: Type.Union([
      Type.Object(
        {
          decision: choice(['accept', 'edit', 'reject', 'override'] as const),
          notes: text(1500),
          actorId: IdSchema,
          recordedAt: at,
          output: nullableOutput,
        },
        strict,
      ),
      Type.Null(),
    ]),
  },
  strict,
);
export const AarViewSchema = Type.Object({ record: AarRecordSchema, hash }, strict);
export const AarListSchema = Type.Object(
  {
    enabled: Type.Boolean(),
    remainingCalls: Type.Integer({ minimum: 0, maximum: 3 }),
    records: Type.Array(AarViewSchema, { maxItems: 20 }),
  },
  strict,
);
export const RequestAarSchema = Type.Object(
  {
    commandId: IdSchema,
    snapshotId: IdSchema,
    snapshotHash: hash,
    mode: choice(['ai', 'manual'] as const),
  },
  strict,
);
export const ReviewAarSchema = Type.Object(
  {
    commandId: IdSchema,
    expectedRevision: Type.Integer({ minimum: 1 }),
    expectedHash: hash,
    decision: choice(['accept', 'edit', 'reject', 'override'] as const),
    notes: text(1500),
    output: nullableOutput,
  },
  strict,
);
export const AarJobSchema = Type.Object(
  {
    id: IdSchema,
    snapshot: RecordReportViewSchema,
    promptVersion: text(100),
  },
  strict,
);
export const AarResultSchema = Type.Object(
  {
    id: IdSchema,
    failed: Type.Boolean(),
    output: Type.Unknown(),
    inputTokens: Type.Integer({ minimum: -1 }),
    outputTokens: Type.Integer({ minimum: -1 }),
  },
  strict,
);
export type AarOutput = Static<typeof AarOutputSchema>;
export type AarFinding = AarOutput['objectives'][number]['strengths'][number];
export type AarRecord = Static<typeof AarRecordSchema>;
export type AarView = Static<typeof AarViewSchema>;
export type RequestAar = Static<typeof RequestAarSchema>;
export type ReviewAar = Static<typeof ReviewAarSchema>;
