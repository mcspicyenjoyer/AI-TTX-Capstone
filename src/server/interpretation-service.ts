import { randomUUID } from 'node:crypto';
import type { Actor } from '../contracts/profile.js';
import { actionKinds } from '../contracts/generation.js';
import {
  InterpretationInputSchema,
  InterpretationResultSchema,
  type InterpretationRecord,
  type InterpretationView,
  type InterpretationInput,
  type InterpretationResponse,
  type RequestInterpretation,
  type ReviewInterpretation,
} from '../contracts/interpretation.js';
import type { Store } from './storage.js';
import { ExerciseService } from './exercise-service.js';
import { expectedActionText } from './generation-content.js';
import { AppError } from './errors.js';
import { fingerprint } from './integrity.js';
import { readStored } from './validation.js';
import { interpretationPromptVersion, validateInterpretation } from './interpretation-content.js';

function conflict(message: string): never {
  throw new AppError(409, 'INTERPRETATION_CONFLICT', message);
}
type Evaluation = {
  purpose: 'development' | 'holdout';
  caseId: string;
  response: InterpretationResponse;
};

export class InterpretationService {
  private readonly exercises: ExerciseService;
  constructor(
    private readonly store: Store,
    private readonly enabled = false,
  ) {
    this.exercises = new ExerciseService(store);
  }
  private source(actor: Actor, runId: string, releaseId: string) {
    const context = this.exercises.context(actor, 'technical', runId, true);
    if (context.definition.kind !== 'generated-five-inject')
      conflict('Interpretation requires a frozen generated package.');
    const release = this.store.exercises.releases(runId).find((item) => item.id === releaseId);
    const response = this.store.outcomes.responses(releaseId).at(-1);
    const inject = context.definition.injects.find((item) => item.id === release?.injectId);
    if (!release || !response || !inject?.expectedActions || !inject.evaluationCriteria)
      conflict('A released position and recorded team response are required.');
    const releasedRoleBodies: InterpretationInput['releasedRoleBodies'] = [];
    for (const delivery of release.deliveries ?? []) {
      const member = context.members.find((item) => item.actorId === delivery.actorId);
      if (!member?.roleId || !release.recipientIds.includes(delivery.actorId))
        conflict('Released role evidence is inconsistent.');
      const previous = releasedRoleBodies.find((item) => item.roleId === member.roleId);
      if (previous && previous.body !== delivery.body) conflict('Released role bodies disagree.');
      if (!previous) releasedRoleBodies.push({ roleId: member.roleId, body: delivery.body });
    }
    const input = readStored(InterpretationInputSchema, {
      releasedRoleBodies,
      expectedActions: inject.expectedActions.map((text) => {
        const key = actionKinds.find((item) => expectedActionText[item] === text);
        if (!key) conflict('This expected action is not supported by the interpretation contract.');
        return { key, text };
      }),
      evaluationCriteria: inject.evaluationCriteria,
      response: {
        actions: response.actions,
        rationale: response.rationale,
        informationRequests: response.informationRequests,
      },
    });
    return {
      context,
      response,
      input,
      sourceHash: fingerprint({
        release,
        response,
        input,
        packageHash: context.hash,
        assignmentHash: context.assignmentHash,
      }),
    };
  }
  private stale(record: InterpretationRecord): boolean {
    try {
      const source = this.source(this.store.actor(record.ownerId)!, record.runId, record.releaseId);
      return (
        source.response.id !== record.responseId ||
        source.sourceHash !== record.sourceHash ||
        source.context.hash !== record.packageHash
      );
    } catch {
      return true;
    }
  }
  get(actor: Actor, runId: string, id: string): InterpretationView {
    this.exercises.context(actor, 'technical', runId, true);
    const saved = this.store.interpretations.get(id);
    if (!saved || saved.record.runId !== runId || saved.record.ownerId !== actor.id)
      throw new AppError(403, 'FORBIDDEN', 'This account cannot read that interpretation.');
    return { ...saved, stale: this.stale(saved.record) };
  }
  list(actor: Actor, runId: string) {
    const context = this.exercises.context(actor, 'technical', runId, true);
    this.store.transaction(() => this.expire());
    return {
      supported: context.definition.kind === 'generated-five-inject',
      enabled: this.enabled,
      remainingCalls: Math.max(
        0,
        30 - this.store.interpretations.list().filter((item) => item.startedAt).length,
      ),
      records: this.store.interpretations
        .list(runId)
        .filter((item) => item.ownerId === actor.id && item.purpose === 'run')
        .map((item) => this.get(actor, runId, item.id)),
    };
  }
  request(
    actor: Actor,
    runId: string,
    input: RequestInterpretation,
    evaluation?: Evaluation,
  ): InterpretationView {
    return this.store.transaction(() => {
      const source = this.source(actor, runId, input.releaseId);
      const requestHash = fingerprint({
        operation: 'interpretation-request',
        actorId: actor.id,
        input,
        evaluation: evaluation ?? null,
      });
      const previous = this.store.exercises.command(runId, input.commandId);
      if (previous) {
        if (previous.hash !== requestHash)
          conflict('This interpretation request key was already used for different content.');
        return this.get(actor, runId, (previous.result as { id: string }).id);
      }
      if (!['active', 'completed'].includes(source.context.run.state))
        conflict('Resume the run before requesting an interpretation.');
      if (source.response.id !== input.responseId)
        conflict('The team response changed. Review its current revision.');
      const all = this.store.interpretations.list();
      if (all.length >= 200) conflict('The bounded interpretation record limit has been reached.');
      if (input.mode === 'ai') {
        if (!this.enabled)
          conflict('AI interpretation is disabled. Manual review remains available.');
        if (all.some((item) => ['queued', 'running'].includes(item.status)))
          conflict('An interpretation request is already pending.');
        if (all.filter((item) => item.startedAt).length >= 30)
          conflict('The thirty-call interpretation budget is exhausted. Continue manually.');
        if (
          evaluation?.purpose === 'development' &&
          all.some((item) => item.purpose === 'holdout' && item.startedAt)
        )
          conflict('Development calls are closed after holdout begins.');
        if (
          evaluation &&
          all.filter((item) => item.purpose === evaluation.purpose && item.startedAt).length >=
            (evaluation.purpose === 'development' ? 20 : 5)
        )
          conflict('The evaluation partition call budget is exhausted.');
        if (
          evaluation?.purpose === 'holdout' &&
          all.some((item) => item.purpose === 'holdout' && item.caseId === evaluation.caseId)
        )
          conflict('A held-out case may be scored only once.');
      }
      const packet = structuredClone(source.input);
      if (evaluation) packet.response = structuredClone(evaluation.response);
      readStored(InterpretationInputSchema, packet);
      const at = new Date().toISOString();
      const record: InterpretationRecord = {
        id: 'interpretation-' + randomUUID(),
        ownerId: actor.id,
        runId,
        releaseId: input.releaseId,
        responseId: input.responseId,
        packageHash: source.context.hash,
        sourceHash: source.sourceHash,
        inputHash: fingerprint(packet),
        input: packet,
        purpose: evaluation?.purpose ?? 'run',
        caseId: evaluation?.caseId ?? null,
        revision: 1,
        status: input.mode === 'ai' ? 'queued' : 'manual',
        promptVersion: interpretationPromptVersion,
        createdAt: at,
        updatedAt: at,
        startedAt: null,
        finishedAt: null,
        error: null,
        inputTokens: null,
        outputTokens: null,
        proposal: null,
        review: null,
      };
      this.store.interpretations.save(record);
      this.store.exercises.saveCommand(runId, input.commandId, requestHash, { id: record.id });
      return this.get(actor, runId, record.id);
    });
  }
  claim() {
    if (!this.enabled) return null;
    return this.store.transaction(() => {
      this.expire();
      const all = this.store.interpretations.list();
      if (
        all.some((item) => item.status === 'running') ||
        this.store.extractions.active() ||
        this.store.generation.list().some((item) => item.status === 'running')
      )
        return null;
      const record = all.find((item) => item.status === 'queued');
      if (!record) return null;
      const run = this.store.exercises.run(record.runId);
      if (
        this.stale(record) ||
        !run ||
        !['active', 'completed'].includes(run.state) ||
        all.filter((item) => item.startedAt).length >= 30
      ) {
        this.fail(
          record,
          'The source response, run state or call budget changed before interpretation.',
        );
        return null;
      }
      const at = new Date().toISOString();
      this.store.interpretations.save({
        ...record,
        revision: record.revision + 1,
        status: 'running',
        startedAt: at,
        updatedAt: at,
      });
      return { id: record.id, input: record.input, promptVersion: record.promptVersion };
    });
  }
  complete(value: unknown): { saved: boolean } {
    const input = readStored(InterpretationResultSchema, value);
    return this.store.transaction(() => {
      this.expire();
      const record = this.store.interpretations.get(input.id)?.record;
      if (!record || record.status !== 'running') return { saved: false };
      const usage = {
        inputTokens: input.inputTokens < 0 ? null : input.inputTokens,
        outputTokens: input.outputTokens < 0 ? null : input.outputTokens,
      };
      try {
        if (input.failed || this.stale(record))
          throw new Error('Provider failure or stale response');
        const proposal = validateInterpretation(input.output, record.input);
        this.store.interpretations.save({
          ...record,
          ...usage,
          proposal,
          status: 'ready',
          revision: record.revision + 1,
          updatedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        });
        return { saved: true };
      } catch {
        this.fail(
          { ...record, ...usage },
          'Interpretation failed, became stale or contained invalid evidence. Continue manually; no automatic retry.',
        );
        return { saved: false };
      }
    });
  }
  private fail(record: InterpretationRecord, error: string): void {
    this.store.interpretations.save({
      ...record,
      revision: record.revision + 1,
      status: 'failed',
      error,
      updatedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    });
  }
  private expire(): void {
    for (const record of this.store.interpretations
      .list()
      .filter(
        (item) =>
          ['queued', 'running'].includes(item.status) &&
          Date.now() - Date.parse(item.updatedAt) > 300_000,
      ))
      this.fail(
        record,
        'The interpretation worker did not finish within five minutes. Continue manually; no automatic retry.',
      );
  }
  review(actor: Actor, runId: string, id: string, input: ReviewInterpretation): InterpretationView {
    return this.store.transaction(() => {
      const view = this.get(actor, runId, id);
      const requestHash = fingerprint({
        operation: 'interpretation-review',
        actorId: actor.id,
        id,
        input,
      });
      const previous = this.store.exercises.command(runId, input.commandId);
      if (previous) {
        if (previous.hash !== requestHash)
          conflict('This review request key was already used for different content.');
        return this.get(actor, runId, id);
      }
      const { record } = view;
      if (view.stale)
        conflict('The response changed; this interpretation and its review are stale.');
      if (record.revision !== input.expectedRevision || view.hash !== input.expectedHash)
        conflict('The interpretation changed. Review the current revision.');
      if (!['active', 'completed'].includes(this.store.exercises.run(runId)!.state))
        conflict('Resume the run before reviewing an interpretation.');
      if (['queued', 'running'].includes(record.status))
        conflict('Wait for the attempt or create a separate manual assessment.');
      let output = input.output;
      if (input.decision === 'accept') {
        if (!record.proposal || input.output !== null)
          conflict('Accept the existing proposal without supplying a replacement.');
        output = record.proposal;
      } else if (input.decision === 'reject') {
        if (input.output !== null)
          conflict('A rejected interpretation has no accepted assessment.');
      } else {
        if (!output || (input.decision === 'edit' && !record.proposal))
          conflict('An edited or overridden assessment is required.');
        try {
          output = validateInterpretation(output, record.input);
        } catch {
          throw new AppError(
            400,
            'INVALID_INTERPRETATION',
            'The edited assessment contains invalid actions or evidence.',
          );
        }
      }
      this.store.interpretations.save({
        ...record,
        revision: record.revision + 1,
        updatedAt: new Date().toISOString(),
        review: {
          decision: input.decision,
          actorId: actor.id,
          recordedAt: new Date().toISOString(),
          notes: input.notes,
          output,
        },
      });
      this.store.exercises.saveCommand(runId, input.commandId, requestHash, { id });
      return this.get(actor, runId, id);
    });
  }
}
