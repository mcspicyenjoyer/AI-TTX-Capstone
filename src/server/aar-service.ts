import { randomUUID } from 'node:crypto';
import type { Actor } from '../contracts/profile.js';
import {
  AarResultSchema,
  type AarRecord,
  type RequestAar,
  type ReviewAar,
} from '../contracts/aar.js';
import type { Store } from './storage.js';
import { ExerciseService } from './exercise-service.js';
import { RecordReportService } from './record-report-service.js';
import { aarPromptVersion, validateAar } from './aar-content.js';
import { fingerprint } from './integrity.js';
import { readStored } from './validation.js';
import { AppError } from './errors.js';

function conflict(message: string): never {
  throw new AppError(409, 'AAR_CONFLICT', message);
}
export class AarService {
  private readonly reports: RecordReportService;
  private readonly exercises: ExerciseService;
  constructor(
    private readonly store: Store,
    private readonly enabled = false,
  ) {
    this.reports = new RecordReportService(store);
    this.exercises = new ExerciseService(store);
  }
  private source(actor: Actor, record: Pick<AarRecord, 'runId' | 'snapshotId' | 'snapshotHash'>) {
    const view = this.reports.get(actor, record.runId, record.snapshotId);
    if (view.hash !== record.snapshotHash) conflict('The selected snapshot hash does not match.');
    return view;
  }
  get(actor: Actor, runId: string, id: string) {
    this.exercises.context(actor, 'technical', runId, true);
    const view = this.store.aars.get(id);
    if (!view || view.record.runId !== runId || view.record.ownerId !== actor.id)
      throw new AppError(403, 'FORBIDDEN', 'This account cannot read that AAR.');
    this.source(actor, view.record);
    return view;
  }
  list(actor: Actor, runId: string) {
    this.exercises.context(actor, 'technical', runId, true);
    this.store.transaction(() => this.expire());
    return {
      enabled: this.enabled,
      remainingCalls: Math.max(0, 3 - this.store.aars.list().filter((r) => r.startedAt).length),
      records: this.store.aars
        .list()
        .filter((r) => r.runId === runId && r.ownerId === actor.id)
        .map((r) => this.get(actor, runId, r.id)),
    };
  }
  request(actor: Actor, runId: string, input: RequestAar) {
    return this.store.transaction(() => {
      const snapshot = this.source(actor, { runId, ...input });
      const hash = fingerprint({ operation: 'aar-request', actorId: actor.id, input });
      const previous = this.store.exercises.command(runId, input.commandId);
      if (previous) {
        if (previous.hash !== hash) conflict('This AAR request key has different content.');
        return this.get(actor, runId, (previous.result as { id: string }).id);
      }
      const all = this.store.aars.list();
      if (all.filter((r) => r.runId === runId).length >= 20)
        conflict('The bounded AAR record limit is reached.');
      if (input.mode === 'ai') {
        if (!this.enabled) conflict('AI AAR is disabled. Manual review remains available.');
        if (all.some((r) => ['queued', 'running'].includes(r.status)))
          conflict('An AAR attempt is already pending.');
        if (all.filter((r) => r.startedAt).length >= 3)
          conflict('The three-call AAR budget is exhausted. Continue manually.');
      }
      if (!snapshot.report.records.some((r) => r.kind === 'completion'))
        conflict('A completed run snapshot is required.');
      const at = new Date().toISOString();
      const record: AarRecord = {
        id: 'aar-' + randomUUID(),
        runId,
        ownerId: actor.id,
        snapshotId: input.snapshotId,
        snapshotHash: input.snapshotHash,
        revision: 1,
        status: input.mode === 'ai' ? 'queued' : 'manual',
        promptVersion: aarPromptVersion,
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
      this.store.aars.save(record);
      this.store.exercises.saveCommand(runId, input.commandId, hash, { id: record.id });
      return this.get(actor, runId, record.id);
    });
  }
  claim() {
    if (!this.enabled) return null;
    return this.store.transaction(() => {
      this.expire();
      const all = this.store.aars.list();
      if (
        all.some((r) => r.status === 'running') ||
        this.store.extractions.active() ||
        this.store.generation.list().some((r) => r.status === 'running') ||
        this.store.interpretations.list().some((r) => r.status === 'running')
      )
        return null;
      const record = all.find((r) => r.status === 'queued');
      if (!record) return null;
      if (all.filter((r) => r.startedAt).length >= 3) {
        this.store.aars.fail(record, 'The three-call AAR budget is exhausted.');
        return null;
      }
      const snapshot = this.source(this.store.actor(record.ownerId)!, record);
      const at = new Date().toISOString();
      this.store.aars.save({
        ...record,
        revision: record.revision + 1,
        status: 'running',
        startedAt: at,
        updatedAt: at,
      });
      return { id: record.id, snapshot, promptVersion: record.promptVersion };
    });
  }
  complete(value: unknown) {
    const input = readStored(AarResultSchema, value);
    return this.store.transaction(() => {
      this.expire();
      const record = this.store.aars.get(input.id)?.record;
      if (!record || record.status !== 'running') return { saved: false };
      const usage = {
        inputTokens: input.inputTokens < 0 ? null : input.inputTokens,
        outputTokens: input.outputTokens < 0 ? null : input.outputTokens,
      };
      try {
        if (input.failed) throw new Error('Provider failed.');
        const snapshot = this.source(this.store.actor(record.ownerId)!, record);
        const proposal = validateAar(input.output, snapshot),
          at = new Date().toISOString();
        this.store.aars.save({
          ...record,
          ...usage,
          proposal,
          status: 'ready',
          revision: record.revision + 1,
          updatedAt: at,
          finishedAt: at,
        });
        return { saved: true };
      } catch {
        this.store.aars.fail(
          { ...record, ...usage },
          'AAR failed or contained invalid snapshot evidence. Continue manually; no automatic retry.',
        );
        return { saved: false };
      }
    });
  }
  private expire() {
    for (const record of this.store.aars
      .list()
      .filter(
        (r) =>
          ['queued', 'running'].includes(r.status) &&
          Date.now() - Date.parse(r.updatedAt) > 300_000,
      ))
      this.store.aars.fail(
        record,
        'AAR worker did not finish within five minutes. Usage may be unknown. Continue manually; no automatic retry.',
      );
  }
  review(actor: Actor, runId: string, id: string, input: ReviewAar) {
    return this.store.transaction(() => {
      const view = this.get(actor, runId, id),
        record = view.record;
      const hash = fingerprint({ operation: 'aar-review', actorId: actor.id, id, input });
      const previous = this.store.exercises.command(runId, input.commandId);
      if (previous) {
        if (previous.hash !== hash) conflict('This review key has different content.');
        return view;
      }
      if (record.revision !== input.expectedRevision || view.hash !== input.expectedHash)
        conflict('The AAR changed. Review its current revision.');
      if (['queued', 'running'].includes(record.status))
        conflict('Wait for this attempt or continue with a separate manual draft.');
      let output = input.output;
      if (input.decision === 'accept') {
        if (!record.proposal || output !== null)
          conflict('Accept the existing proposal without a replacement.');
        output = record.proposal;
      } else if (input.decision === 'reject') {
        if (output !== null) conflict('Rejection has no accepted output.');
      } else if (!output || (input.decision === 'edit' && !record.proposal))
        conflict('Edited or overridden output is required.');
      if (output) {
        try {
          output = validateAar(output, this.source(actor, record));
        } catch {
          throw new AppError(
            400,
            'INVALID_AAR',
            'The AAR has invalid findings, citations, origin or action ownership.',
          );
        }
      }
      const at = new Date().toISOString();
      this.store.aars.save({
        ...record,
        revision: record.revision + 1,
        updatedAt: at,
        review: {
          decision: input.decision,
          notes: input.notes,
          actorId: actor.id,
          recordedAt: at,
          output,
        },
      });
      this.store.exercises.saveCommand(runId, input.commandId, hash, { id });
      return this.get(actor, runId, id);
    });
  }
}
