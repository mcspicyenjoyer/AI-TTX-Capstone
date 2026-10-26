import { Type } from '@sinclair/typebox';
import { IdSchema } from '../contracts/profile.js';
import { Store } from './storage.js';
import { IntakeService } from './intake-service.js';
import { extractionPacket, resolveExtraction } from './extraction-prompt.js';
import { readStored } from './validation.js';

const CompletionSchema = Type.Object(
  {
    id: IdSchema,
    output: Type.Unknown(),
    inputTokens: Type.Integer({ minimum: -1, maximum: 10_000_000 }),
    outputTokens: Type.Integer({ minimum: -1, maximum: 1_000_000 }),
    failed: Type.Boolean(),
  },
  { additionalProperties: false },
);

export class ExtractionJobs {
  constructor(private readonly store: Store) {}
  claim() {
    return this.store.transaction(() => {
      this.store.extractions.expire();
      this.store.extractions.heartbeat();
      const next = this.store.extractions.queued();
      if (!next) return null;
      const entry = this.store.extractions.get(String(next.id))!;
      const snapshot = this.store.intakes.get(entry.intakeId, entry.command.expectedRevision);
      const current = this.store.intakes.get(entry.intakeId);
      if (
        !snapshot ||
        snapshot.contentHash !== entry.command.expectedHash ||
        current?.contentHash !== snapshot.contentHash
      ) {
        this.store.extractions.update(
          entry.job.id,
          'failed',
          'Source draft changed before extraction; nothing was sent.',
        );
        return null;
      }
      try {
        extractionPacket(snapshot.draft.sources);
      } catch {
        this.store.extractions.update(
          entry.job.id,
          'failed',
          'Source packet exceeds the supported extraction limit; manual review remains available.',
        );
        return null;
      }
      this.store.extractions.update(
        entry.job.id,
        'running',
        'Extracting through the local ChatGPT subscription.',
        { inputTokens: -1, outputTokens: -1 },
      );
      return { id: entry.job.id, sources: snapshot.draft.sources };
    });
  }
  complete(value: unknown) {
    const input = readStored(CompletionSchema, value);
    this.store.extractions.expire();
    const entry = this.store.extractions.get(input.id);
    if (!entry || entry.job.status !== 'running') return { saved: false };
    const usage = { inputTokens: input.inputTokens, outputTokens: input.outputTokens };
    if (input.failed) {
      this.store.extractions.update(
        input.id,
        'failed',
        'Codex failed, timed out, or requested a prohibited tool. No automatic retry; manual review remains available.',
        usage,
      );
      return { saved: false };
    }
    try {
      const actor = this.store.actor(entry.actorId);
      if (!actor) throw new Error('Reviewer no longer available.');
      const snapshot = this.store.intakes.get(entry.intakeId, entry.command.expectedRevision)!;
      if (snapshot.contentHash !== entry.command.expectedHash)
        throw new Error('Source snapshot changed.');
      const proposal = resolveExtraction(input.output, snapshot.draft.sources);
      new IntakeService(this.store).addProposal(
        actor,
        entry.intakeId,
        entry.command,
        proposal,
        () => {
          if (this.store.extractions.get(input.id)?.job.status !== 'running')
            throw new Error('Job no longer active.');
          this.store.extractions.update(
            input.id,
            'succeeded',
            'AI candidates added for review. Existing candidates are unchanged; nothing is accepted.',
            usage,
            proposal,
          );
        },
      );
      return { saved: true };
    } catch {
      if (this.store.extractions.get(input.id)?.job.status === 'running')
        this.store.extractions.update(
          input.id,
          'failed',
          'Output was invalid, ungrounded, over capacity, or the draft changed. No candidates were saved; review manually.',
          usage,
        );
      return { saved: false };
    }
  }
}
