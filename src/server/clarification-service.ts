import { randomUUID } from 'node:crypto';
import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';
import { ErrorSchema, IdSchema, type Actor } from '../contracts/profile.js';
import {
  ClarificationInputSchema,
  ClarificationListSchema,
  ClarificationSchema,
  type Clarification,
  type ClarificationInput,
} from '../contracts/clarification.js';
import type { Store } from './storage.js';
import type { Sessions } from './access.js';
import { ExerciseService } from './exercise-service.js';
import { AppError } from './errors.js';
import { fingerprint } from './integrity.js';

function conflict(message: string): never {
  throw new AppError(409, 'CLARIFICATION_CONFLICT', message);
}
export class ClarificationService {
  private readonly exercises: ExerciseService;
  constructor(private readonly store: Store) {
    this.exercises = new ExerciseService(store);
  }
  list(actor: Actor, runId: string) {
    this.exercises.context(actor, 'technical', runId, true);
    return this.store.clarifications.list(runId);
  }
  record(actor: Actor, runId: string, input: ClarificationInput) {
    return this.store.transaction(() => {
      const context = this.exercises.context(actor, 'technical', runId, true);
      const hash = fingerprint({ operation: 'clarification', actorId: actor.id, input });
      const previous = this.store.exercises.command(runId, input.commandId);
      if (previous) {
        if (previous.hash !== hash) conflict('This clarification key has different content.');
        return this.store.clarifications
          .list(runId)
          .find((r) => r.id === (previous.result as { id: string }).id)!;
      }
      if (context.run.state !== 'active' || context.definition.kind !== 'generated-five-inject')
        conflict(
          'Clarifications may be logged only during an active generated run. No completed-run backfill.',
        );
      const release = this.store.exercises.releases(runId).at(-1);
      if (!release || release.id !== input.releaseId || this.store.outcomes.closure(release.id))
        conflict('Log the answer against the current open released position.');
      if (this.store.clarifications.list(runId).length >= 100)
        conflict('The clarification record limit is reached.');
      const definition = context.definition;
      const profile = this.store.profile(definition.profileId, definition.profileRevisionId);
      const confirmation = this.store.confirmation(
        definition.profileId,
        definition.profileRevisionId,
      );
      if (
        !profile ||
        !confirmation ||
        profile.contentHash !== definition.profileHash ||
        confirmation.contentHash !== definition.profileHash
      )
        conflict('The confirmed profile binding is unavailable.');
      if (
        input.unknown
          ? input.text !== 'not known at this time' || input.claimIds.length !== 0
          : input.claimIds.length === 0
      )
        conflict(
          'A sourced answer needs claim IDs; an unknown answer must remain "not known at this time" without fact citations.',
        );
      if (
        input.claimIds.some((id) => !profile.profile.environment?.claims.some((c) => c.id === id))
      )
        conflict('A cited claim is absent from the confirmed profile.');
      const record: Clarification = {
        ...input,
        id: 'clarification-' + randomUUID(),
        runId,
        actorId: actor.id,
        position: definition.injects.findIndex((i) => i.id === release.injectId) + 1,
        recordedAt: new Date().toISOString(),
        profileId: definition.profileId,
        profileRevisionId: definition.profileRevisionId,
        profileHash: definition.profileHash,
      };
      this.store.clarifications.save(record);
      this.store.exercises.saveCommand(runId, input.commandId, hash, { id: record.id });
      return record;
    });
  }
}
export function registerClarificationRoutes(
  app: FastifyInstance,
  sessions: Sessions,
  service: ClarificationService,
) {
  const params = Type.Object({ runId: IdSchema }, { additionalProperties: false });
  const errors = Object.fromEntries(
    [400, 401, 403, 404, 409, 500].map((code) => [code, ErrorSchema]),
  );
  const base = '/api/tracks/technical/runs/:runId/clarifications';
  app.get<{ Params: { runId: string } }>(
    base,
    { schema: { params, response: { 200: ClarificationListSchema, ...errors } } },
    async (req) => service.list(sessions.actor(req.cookies.ttx_session), req.params.runId),
  );
  app.post<{ Params: { runId: string }; Body: ClarificationInput }>(
    base,
    {
      schema: {
        params,
        body: ClarificationInputSchema,
        response: { 200: ClarificationSchema, ...errors },
      },
    },
    async (req) =>
      service.record(sessions.actor(req.cookies.ttx_session), req.params.runId, req.body),
  );
}
