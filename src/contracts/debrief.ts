import { Type, type Static } from '@sinclair/typebox';
import { IdSchema } from './profile.js';
const strict = { additionalProperties: false };
const note = Type.String({ maxLength: 4000 });
// Recorded by the facilitator after the run is completed. Participant feedback is the
// facilitator's summary of what respondents said, not verbatim or evidence of executed actions.
// Exercise design notes record limits of the exercise materials, not organisational capability.
export const DebriefInputSchema = Type.Object(
  {
    commandId: IdSchema,
    participantFeedback: note,
    facilitatorObservations: note,
    exerciseDesignNotes: note,
    respondentIds: Type.Array(IdSchema, { maxItems: 50, uniqueItems: true }),
  },
  strict,
);
export const DebriefSchema = Type.Object(
  {
    ...DebriefInputSchema.properties,
    id: IdSchema,
    runId: IdSchema,
    actorId: IdSchema,
    recordedAt: Type.String({ format: 'date-time' }),
    runRevision: Type.Integer({ minimum: 1 }),
  },
  strict,
);
export const DebriefListSchema = Type.Array(DebriefSchema, { maxItems: 20 });
export type Debrief = Static<typeof DebriefSchema>;
export type DebriefInput = Static<typeof DebriefInputSchema>;
