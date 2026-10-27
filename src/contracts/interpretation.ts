import { Type, type Static } from '@sinclair/typebox';
import { actionKinds } from './generation.js';
import { TeamResponseSchema } from './outcomes.js';
import { IdSchema } from './profile.js';

const strict = { additionalProperties: false };
const choice = <T extends string>(values: readonly T[]) =>
  Type.Union(values.map((value) => Type.Literal(value)));

export const InterpretationResponseSchema = Type.Pick(TeamResponseSchema, [
  'actions',
  'rationale',
  'informationRequests',
]);
export const ResponseQuoteSchema = Type.Object(
  {
    field: choice(['actions', 'rationale', 'informationRequests'] as const),
    quote: Type.String({ minLength: 1, maxLength: 3000, pattern: '\\S' }),
  },
  strict,
);
export const ActionAssessmentSchema = Type.Object(
  {
    actionKey: choice(actionKinds),
    label: choice(['present', 'partial', 'missing', 'unclear'] as const),
    evidence: Type.Union([
      Type.Array(ResponseQuoteSchema, { minItems: 1, maxItems: 3, uniqueItems: true }),
      Type.Literal('no supporting text'),
    ]),
  },
  strict,
);
export const ActionAssessmentsSchema = Type.Array(ActionAssessmentSchema, {
  minItems: 1,
  maxItems: 6,
});
export const ResponseEvidenceSchema = ActionAssessmentSchema.properties.evidence;
export const EvaluationCaseIdSchema = Type.String({ pattern: '^[A-Za-z0-9][A-Za-z0-9-]{0,63}$' });
const summaryEvidence = Type.Union([
  Type.Array(
    Type.Object(
      {
        ...ResponseQuoteSchema.properties,
        quote: Type.String({ minLength: 1, maxLength: 500, pattern: '\\S' }),
      },
      strict,
    ),
    { minItems: 1, maxItems: 2, uniqueItems: true },
  ),
  Type.Literal('no supporting text'),
]);
export const InterpretationOutputSchema = Type.Object(
  {
    actions: ActionAssessmentsSchema,
    summary: Type.Object({ decision: summaryEvidence, rationale: summaryEvidence }, strict),
    risks: Type.Array(
      Type.Object(
        {
          kind: choice([
            'unverified-team-claim',
            'unresolved-disagreement',
            'ai-directed-instruction',
          ] as const),
          evidence: Type.Array(ResponseQuoteSchema, {
            minItems: 1,
            maxItems: 3,
            uniqueItems: true,
          }),
        },
        strict,
      ),
      { maxItems: 6 },
    ),
    recommendedFollowUpId: Type.Null(),
  },
  strict,
);
export const InterpretationInputSchema = Type.Object(
  {
    releasedRoleBodies: Type.Array(
      Type.Object(
        { roleId: IdSchema, body: Type.String({ minLength: 1, maxLength: 6000 }) },
        strict,
      ),
      { minItems: 1, maxItems: 3 },
    ),
    expectedActions: Type.Array(
      Type.Object(
        { key: choice(actionKinds), text: Type.String({ minLength: 1, maxLength: 500 }) },
        strict,
      ),
      { minItems: 1, maxItems: 6 },
    ),
    evaluationCriteria: Type.Array(Type.String({ minLength: 1, maxLength: 700 }), {
      minItems: 1,
      maxItems: 6,
    }),
    response: InterpretationResponseSchema,
  },
  strict,
);
const hash = Type.String({ pattern: '^[a-f0-9]{64}$' });
const at = Type.String({ format: 'date-time' });
const nullableAt = Type.Union([at, Type.Null()]);
const nullableOutput = Type.Union([InterpretationOutputSchema, Type.Null()]);
const reviewDecision = choice(['accept', 'edit', 'reject', 'override'] as const);
export const InterpretationRecordSchema = Type.Object(
  {
    id: IdSchema,
    ownerId: IdSchema,
    runId: IdSchema,
    releaseId: IdSchema,
    responseId: IdSchema,
    packageHash: hash,
    sourceHash: hash,
    inputHash: hash,
    input: InterpretationInputSchema,
    purpose: choice(['run', 'development', 'holdout'] as const),
    caseId: Type.Union([EvaluationCaseIdSchema, Type.Null()]),
    revision: Type.Integer({ minimum: 1 }),
    status: choice(['queued', 'running', 'ready', 'failed', 'manual'] as const),
    promptVersion: Type.String({ minLength: 1, maxLength: 100 }),
    createdAt: at,
    updatedAt: at,
    startedAt: nullableAt,
    finishedAt: nullableAt,
    error: Type.Union([Type.String({ maxLength: 300 }), Type.Null()]),
    inputTokens: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
    outputTokens: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
    proposal: nullableOutput,
    review: Type.Union([
      Type.Object(
        {
          decision: reviewDecision,
          actorId: IdSchema,
          recordedAt: at,
          notes: Type.String({ minLength: 1, maxLength: 1500, pattern: '\\S' }),
          output: nullableOutput,
        },
        strict,
      ),
      Type.Null(),
    ]),
  },
  strict,
);
export const InterpretationViewSchema = Type.Object(
  { record: InterpretationRecordSchema, hash, stale: Type.Boolean() },
  strict,
);
export const InterpretationListSchema = Type.Object(
  {
    supported: Type.Boolean(),
    enabled: Type.Boolean(),
    remainingCalls: Type.Integer({ minimum: 0, maximum: 30 }),
    records: Type.Array(InterpretationViewSchema, { maxItems: 200 }),
  },
  strict,
);
export const RequestInterpretationSchema = Type.Object(
  {
    commandId: IdSchema,
    releaseId: IdSchema,
    responseId: IdSchema,
    mode: choice(['ai', 'manual'] as const),
  },
  strict,
);
export const ReviewInterpretationSchema = Type.Object(
  {
    commandId: IdSchema,
    expectedRevision: Type.Integer({ minimum: 1 }),
    expectedHash: hash,
    decision: reviewDecision,
    notes: Type.String({ minLength: 1, maxLength: 1500, pattern: '\\S' }),
    output: nullableOutput,
  },
  strict,
);
export const InterpretationJobSchema = Type.Object(
  { id: IdSchema, input: InterpretationInputSchema, promptVersion: Type.String() },
  strict,
);
export const InterpretationResultSchema = Type.Object(
  {
    id: IdSchema,
    failed: Type.Boolean(),
    output: Type.Unknown(),
    inputTokens: Type.Integer({ minimum: -1 }),
    outputTokens: Type.Integer({ minimum: -1 }),
  },
  strict,
);
export type InterpretationResponse = Static<typeof InterpretationResponseSchema>;
export type ActionAssessment = Static<typeof ActionAssessmentSchema>;
export type InterpretationOutput = Static<typeof InterpretationOutputSchema>;
export type InterpretationInput = Static<typeof InterpretationInputSchema>;
export type InterpretationRecord = Static<typeof InterpretationRecordSchema>;
export type InterpretationView = Static<typeof InterpretationViewSchema>;
export type RequestInterpretation = Static<typeof RequestInterpretationSchema>;
export type ReviewInterpretation = Static<typeof ReviewInterpretationSchema>;
