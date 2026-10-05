import { Type, type Static } from '@sinclair/typebox';
import { IdSchema } from './profile.js';
import { RunSchema, StateRequestSchema } from './exercise.js';

const strict = { additionalProperties: false };
const text = (maxLength = 3000) => Type.String({ minLength: 1, maxLength, pattern: '\\S' });
const note = Type.String({ maxLength: 3000 });
const nullableId = Type.Union([IdSchema, Type.Null()]);
const stamp = {
  id: IdSchema,
  runId: IdSchema,
  actorId: IdSchema,
  recordedAt: Type.String({ format: 'date-time' }),
  runRevision: Type.Integer({ minimum: 1 }),
};
const responseFields = {
  actions: text(),
  rationale: text(),
  informationRequests: note,
};
export const TeamResponseSchema = Type.Object(
  {
    ...stamp,
    releaseId: IdSchema,
    teamId: IdSchema,
    revision: Type.Integer({ minimum: 1 }),
    assignmentHash: Type.String({ pattern: '^[a-f0-9]{64}$' }),
    ...responseFields,
  },
  strict,
);
export const ResponseViewSchema = Type.Omit(TeamResponseSchema, ['assignmentHash']);
const dispositionFields = {
  releaseId: IdSchema,
  responseId: nullableId,
  decision: Type.Union([
    Type.Literal('reviewed'),
    Type.Literal('clarification-required'),
    Type.Literal('hold'),
  ]),
  observations: text(),
  unresolvedGaps: note,
};
export const DispositionSchema = Type.Object({ ...stamp, ...dispositionFields }, strict);
export const ClosureSchema = Type.Object(
  { ...stamp, releaseId: IdSchema, dispositionId: IdSchema, rationale: text() },
  strict,
);
export const CompletionSchema = Type.Object(
  {
    ...stamp,
    closureIds: Type.Array(IdSchema, { minItems: 1, maxItems: 15, uniqueItems: true }),
    rationale: text(),
  },
  strict,
);
const command = StateRequestSchema.properties;
export const ResponseRequestSchema = Type.Object(
  { ...command, releaseId: IdSchema, previousResponseId: nullableId, ...responseFields },
  strict,
);
export const DispositionRequestSchema = Type.Object({ ...command, ...dispositionFields }, strict);
export const ClosureRequestSchema = Type.Object(
  { ...command, releaseId: IdSchema, dispositionId: IdSchema, rationale: text() },
  strict,
);
export const CompletionRequestSchema = Type.Object({ ...command, rationale: text() }, strict);
const position = {
  releaseId: IdSchema,
  position: Type.Integer({ minimum: 1, maximum: 15 }),
  response: Type.Union([ResponseViewSchema, Type.Null()]),
  closed: Type.Boolean(),
};
export const TeamOutcomesSchema = Type.Object(
  { run: RunSchema, positions: Type.Array(Type.Object(position, strict), { maxItems: 15 }) },
  strict,
);
export const OutcomeReviewSchema = Type.Object(
  {
    run: RunSchema,
    positions: Type.Array(
      Type.Object(
        {
          ...position,
          responses: Type.Array(TeamResponseSchema),
          dispositions: Type.Array(DispositionSchema),
          closure: Type.Union([ClosureSchema, Type.Null()]),
        },
        strict,
      ),
      { maxItems: 15 },
    ),
    completion: Type.Union([CompletionSchema, Type.Null()]),
    canComplete: Type.Boolean(),
  },
  strict,
);

export type TeamResponse = Static<typeof TeamResponseSchema>;
export type ResponseView = Static<typeof ResponseViewSchema>;
export type Disposition = Static<typeof DispositionSchema>;
export type Closure = Static<typeof ClosureSchema>;
export type Completion = Static<typeof CompletionSchema>;
export type ResponseRequest = Static<typeof ResponseRequestSchema>;
export type DispositionRequest = Static<typeof DispositionRequestSchema>;
export type ClosureRequest = Static<typeof ClosureRequestSchema>;
export type CompletionRequest = Static<typeof CompletionRequestSchema>;
export type TeamOutcomes = Static<typeof TeamOutcomesSchema>;
export type OutcomeReview = Static<typeof OutcomeReviewSchema>;
