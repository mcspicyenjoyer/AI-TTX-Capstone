import { Type, type Static } from '@sinclair/typebox';
import { actionKinds } from './generation.js';
import { TeamResponseSchema } from './outcomes.js';

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
export type InterpretationResponse = Static<typeof InterpretationResponseSchema>;
export type ActionAssessment = Static<typeof ActionAssessmentSchema>;
