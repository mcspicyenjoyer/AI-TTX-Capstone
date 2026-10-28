import { Type, type Static } from '@sinclair/typebox';
import { IdSchema } from './profile.js';
const strict = { additionalProperties: false };
export const ClarificationInputSchema = Type.Object(
  {
    commandId: IdSchema,
    releaseId: IdSchema,
    text: Type.String({ minLength: 1, maxLength: 2000, pattern: '\\S' }),
    claimIds: Type.Array(IdSchema, { maxItems: 6, uniqueItems: true }),
    unknown: Type.Boolean(),
  },
  strict,
);
export const ClarificationSchema = Type.Object(
  {
    ...ClarificationInputSchema.properties,
    id: IdSchema,
    runId: IdSchema,
    actorId: IdSchema,
    position: Type.Integer({ minimum: 1, maximum: 5 }),
    recordedAt: Type.String({ format: 'date-time' }),
    profileId: IdSchema,
    profileRevisionId: IdSchema,
    profileHash: Type.String({ pattern: '^[a-f0-9]{64}$' }),
  },
  strict,
);
export const ClarificationListSchema = Type.Array(ClarificationSchema, { maxItems: 100 });
export type Clarification = Static<typeof ClarificationSchema>;
export type ClarificationInput = Static<typeof ClarificationInputSchema>;
