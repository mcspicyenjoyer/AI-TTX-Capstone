import { randomUUID } from 'node:crypto';
import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';
import { ErrorSchema, IdSchema, type Actor } from '../contracts/profile.js';
import {
  DebriefInputSchema,
  DebriefListSchema,
  DebriefSchema,
  type Debrief,
  type DebriefInput,
} from '../contracts/debrief.js';
import type { Store } from './storage.js';
import type { Sessions } from './access.js';
import { ExerciseService } from './exercise-service.js';
import { AppError } from './errors.js';
import { fingerprint } from './integrity.js';

function conflict(message: string): never {
  throw new AppError(409, 'DEBRIEF_CONFLICT', message);
}
function invalid(message: string): never {
  throw new AppError(400, 'INVALID_DEBRIEF', message);
}
export class DebriefService {
  private readonly exercises: ExerciseService;
  constructor(private readonly store: Store) {
    this.exercises = new ExerciseService(store);
  }
  list(actor: Actor, runId: string) {
    this.exercises.context(actor, 'technical', runId, true);
    return this.store.debriefs.list(runId);
  }
  record(actor: Actor, runId: string, input: DebriefInput): Debrief {
    const value = { ...input, respondentIds: [...input.respondentIds].sort() };
    return this.store.transaction(() => {
      const context = this.exercises.context(actor, 'technical', runId, true);
      const hash = fingerprint({ operation: 'debrief', actorId: actor.id, input: value });
      const previous = this.store.exercises.command(runId, value.commandId);
      if (previous) {
        if (previous.hash !== hash) conflict('This debrief key has different content.');
        return this.store.debriefs
          .list(runId)
          .find((r) => r.id === (previous.result as { id: string }).id)!;
      }
      if (context.run.state !== 'completed')
        conflict('Record the debrief after the run is completed.');
      if (this.store.debriefs.list(runId).length >= 20)
        conflict('The debrief record limit is reached.');
      if (
        ![value.participantFeedback, value.facilitatorObservations, value.exerciseDesignNotes].some(
          (note) => note.trim(),
        )
      )
        invalid('Record at least one debrief note.');
      if (
        value.respondentIds.some(
          (id) =>
            !context.members.some(
              (member) => member.actorId === id && member.kind === 'participant',
            ),
        )
      )
        invalid('Respondents must be participants in this run.');
      if (value.participantFeedback.trim() && !value.respondentIds.length)
        invalid('Name the participants whose feedback is summarised.');
      const record: Debrief = {
        ...value,
        id: 'debrief-' + randomUUID(),
        runId,
        actorId: actor.id,
        recordedAt: new Date().toISOString(),
        runRevision: context.run.revision,
      };
      this.store.debriefs.save(record);
      this.store.exercises.saveCommand(runId, value.commandId, hash, { id: record.id });
      return record;
    });
  }
}
export function registerDebriefRoutes(
  app: FastifyInstance,
  sessions: Sessions,
  service: DebriefService,
) {
  const params = Type.Object({ runId: IdSchema }, { additionalProperties: false });
  const errors = Object.fromEntries(
    [400, 401, 403, 404, 409, 500].map((code) => [code, ErrorSchema]),
  );
  const base = '/api/tracks/technical/runs/:runId/debriefs';
  app.get<{ Params: { runId: string } }>(
    base,
    { schema: { params, response: { 200: DebriefListSchema, ...errors } } },
    async (req) => service.list(sessions.actor(req.cookies.ttx_session), req.params.runId),
  );
  app.post<{ Params: { runId: string }; Body: DebriefInput }>(
    base,
    {
      schema: { params, body: DebriefInputSchema, response: { 200: DebriefSchema, ...errors } },
    },
    async (req) =>
      service.record(sessions.actor(req.cookies.ttx_session), req.params.runId, req.body),
  );
}
