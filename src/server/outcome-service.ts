import { randomUUID } from 'node:crypto';
import type { Static, TSchema } from '@sinclair/typebox';
import type { Actor } from '../contracts/profile.js';
import type { StateRequest, Track } from '../contracts/exercise.js';
import {
  TeamResponseSchema,
  DispositionSchema,
  ClosureSchema,
  CompletionSchema,
  type TeamResponse,
  type ResponseView,
  type Disposition,
  type Closure,
  type Completion,
  type ResponseRequest,
  type DispositionRequest,
  type ClosureRequest,
  type CompletionRequest,
  type OutcomeReview,
  type TeamOutcomes,
} from '../contracts/outcomes.js';
import type { Store } from './storage.js';
import type { ExerciseService } from './exercise-service.js';
import { AppError } from './errors.js';
import { fingerprint } from './integrity.js';
import { readStored } from './validation.js';

type Context = ReturnType<ExerciseService['context']>;
function conflict(message: string): never {
  throw new AppError(409, 'OUTCOME_CONFLICT', message);
}
function responseView(value: TeamResponse | undefined): ResponseView | null {
  if (!value) return null;
  return {
    id: value.id,
    runId: value.runId,
    releaseId: value.releaseId,
    teamId: value.teamId,
    actorId: value.actorId,
    recordedAt: value.recordedAt,
    runRevision: value.runRevision,
    revision: value.revision,
    actions: value.actions,
    rationale: value.rationale,
    informationRequests: value.informationRequests,
  };
}

export class OutcomeService {
  constructor(
    private readonly store: Store,
    private readonly exercises: ExerciseService,
  ) {}

  private context(actor: Actor, track: Track, runId: string, facilitator: boolean): Context {
    const context = this.exercises.context(actor, track, runId, facilitator);
    if (track !== 'technical') conflict('The response workflow is not enabled for this track.');
    if (context.definition.kind === 'development-skeleton')
      conflict('This fixture is not playable.');
    return context;
  }

  private positions(runId: string) {
    return this.store.exercises.releases(runId).map((release, index) => {
      const responses = this.store.outcomes.responses(release.id);
      const closure = this.store.outcomes.closure(release.id);
      return {
        releaseId: release.id,
        position: index + 1,
        responses,
        response: responseView(responses.at(-1)),
        dispositions: this.store.outcomes.dispositions(release.id),
        closure,
        closed: !!closure,
      };
    });
  }

  review(actor: Actor, track: Track, runId: string): OutcomeReview {
    const { run, definition } = this.context(actor, track, runId, true);
    const positions = this.positions(runId);
    return {
      run,
      positions,
      completion: this.store.outcomes.completion(runId),
      canComplete:
        run.state === 'active' &&
        positions.length > 0 &&
        positions.length === definition.injects.length &&
        positions.every((item) => item.closed),
    };
  }

  team(actor: Actor, track: Track, runId: string): TeamOutcomes {
    const { run, member } = this.context(actor, track, runId, false);
    if (member.kind !== 'participant')
      throw new AppError(403, 'FORBIDDEN', 'Participant access required.');
    // Team discussion is shared; inject bodies and facilitator observations are not.
    return {
      run,
      positions: this.positions(runId).map(({ releaseId, position, response, closed }) => ({
        releaseId,
        position,
        response,
        closed,
      })),
    };
  }

  private execute<T extends TSchema>(
    actor: Actor,
    track: Track,
    runId: string,
    operation: string,
    input: StateRequest,
    schema: T,
    participant: boolean,
    apply: (context: Context) => Static<T>,
  ): Static<T> {
    return this.store.transaction(() => {
      const context = this.context(actor, track, runId, !participant);
      if (participant && context.member.kind !== 'participant')
        throw new AppError(
          403,
          'FORBIDDEN',
          'Only assigned participants may submit the team response.',
        );
      const hash = fingerprint({ operation, actorId: actor.id, input });
      const previous = this.store.exercises.command(runId, input.idempotencyKey);
      if (previous) {
        if (previous.hash !== hash)
          conflict('This request key was already used for different content.');
        return readStored(schema, previous.result);
      }
      if (input.expectedRunRevision !== context.run.revision)
        conflict('The exercise has changed. Refresh and review before submitting again.');
      if (context.run.state !== 'active')
        conflict('Resume the run before recording responses or outcomes.');
      this.exercises.requirePreparation(context);
      const result = readStored(schema, apply(context));
      this.store.exercises.saveCommand(runId, input.idempotencyKey, hash, result);
      return result;
    });
  }

  private openRelease(context: Context, releaseId: string): void {
    if (!this.store.exercises.releases(context.run.id).some((release) => release.id === releaseId))
      throw new AppError(404, 'NOT_FOUND', 'That released position is unavailable in this run.');
    if (this.store.outcomes.closure(releaseId)) conflict('This position is already closed.');
  }

  private stamp(context: Context, actor: Actor, kind: string) {
    const run = this.store.exercises.updateRun(context.run);
    return {
      id: `${kind}-${randomUUID()}`,
      runId: run.id,
      actorId: actor.id,
      recordedAt: new Date().toISOString(),
      runRevision: run.revision,
    };
  }

  respond(actor: Actor, track: Track, runId: string, input: ResponseRequest): TeamResponse {
    return this.execute(
      actor,
      track,
      runId,
      'response',
      input,
      TeamResponseSchema,
      true,
      (context) => {
        this.openRelease(context, input.releaseId);
        const previous = this.store.outcomes.responses(input.releaseId).at(-1);
        if ((previous?.id ?? null) !== input.previousResponseId)
          conflict('Review the latest team response before revising it.');
        const value: TeamResponse = {
          ...this.stamp(context, actor, 'response'),
          releaseId: input.releaseId,
          teamId: runId,
          revision: (previous?.revision ?? 0) + 1,
          assignmentHash: context.assignmentHash,
          actions: input.actions,
          rationale: input.rationale,
          informationRequests: input.informationRequests,
        };
        this.store.outcomes.saveResponse(value);
        this.store.exercises.event(
          { ...context.run, revision: value.runRevision },
          'response-recorded',
          actor.id,
          value.id,
        );
        return value;
      },
    );
  }

  disposition(actor: Actor, track: Track, runId: string, input: DispositionRequest): Disposition {
    return this.execute(
      actor,
      track,
      runId,
      'disposition',
      input,
      DispositionSchema,
      false,
      (context) => {
        this.openRelease(context, input.releaseId);
        const response = this.store.outcomes.responses(input.releaseId).at(-1);
        if ((response?.id ?? null) !== input.responseId)
          conflict('Review the current response revision.');
        if (!response && !input.unresolvedGaps.trim())
          conflict('Record the unanswered position as an unresolved gap.');
        const value: Disposition = {
          ...this.stamp(context, actor, 'disposition'),
          releaseId: input.releaseId,
          responseId: input.responseId,
          decision: input.decision,
          observations: input.observations,
          unresolvedGaps: input.unresolvedGaps,
        };
        this.store.outcomes.saveDisposition(value);
        this.store.exercises.event(
          { ...context.run, revision: value.runRevision },
          'disposition-recorded',
          actor.id,
          value.id,
        );
        return value;
      },
    );
  }

  close(actor: Actor, track: Track, runId: string, input: ClosureRequest): Closure {
    return this.execute(actor, track, runId, 'close', input, ClosureSchema, false, (context) => {
      this.openRelease(context, input.releaseId);
      const disposition = this.store.outcomes.dispositions(input.releaseId).at(-1);
      const response = this.store.outcomes.responses(input.releaseId).at(-1);
      if (
        !disposition ||
        disposition.id !== input.dispositionId ||
        disposition.responseId !== (response?.id ?? null) ||
        disposition.decision !== 'reviewed'
      )
        conflict(
          'Closure requires the latest reviewed disposition of the current response or unanswered gap.',
        );
      const value: Closure = {
        ...this.stamp(context, actor, 'closure'),
        releaseId: input.releaseId,
        dispositionId: input.dispositionId,
        rationale: input.rationale,
      };
      this.store.outcomes.saveClosure(value);
      this.store.exercises.event(
        { ...context.run, revision: value.runRevision },
        'position-closed',
        actor.id,
        value.id,
      );
      return value;
    });
  }

  complete(actor: Actor, track: Track, runId: string, input: CompletionRequest): Completion {
    return this.execute(
      actor,
      track,
      runId,
      'complete',
      input,
      CompletionSchema,
      false,
      (context) => {
        const positions = this.positions(runId);
        if (
          !positions.length ||
          positions.length !== context.definition.injects.length ||
          positions.some((p) => !p.closure)
        )
          conflict('Release and explicitly close every position before completing the run.');
        const run = this.store.exercises.updateRun(context.run, 'completed');
        const value: Completion = {
          id: `completion-${randomUUID()}`,
          runId,
          actorId: actor.id,
          recordedAt: new Date().toISOString(),
          runRevision: run.revision,
          closureIds: positions.map((p) => p.closure!.id),
          rationale: input.rationale,
        };
        this.store.outcomes.saveCompletion(value);
        this.store.exercises.event(run, 'run-completed', actor.id, value.id);
        return value;
      },
    );
  }
}
