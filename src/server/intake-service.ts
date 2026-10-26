import { createHash, randomUUID } from 'node:crypto';
import {
  IntakeSchema,
  IntakeSourceSchema,
  ProposalSchema,
  type Intake,
  type IntakeView,
  type IntakeSource,
  type Proposal,
  type IntakeCommand,
  type CreateIntake,
  type UploadSource,
  type ReviewIntake,
  type ConfirmIntake,
} from '../contracts/intake.js';
import type { Actor, Profile, ProfileView } from '../contracts/profile.js';
import { Store } from './storage.js';
import { AppError } from './errors.js';
import { fingerprint } from './integrity.js';
import { readStored } from './validation.js';
import { validateProposal } from './organisation-validation.js';
import { parseInWorker } from './intake-parser.js';

// Offline tests inject this interface; live subscription extraction uses the durable worker queue.
export interface ExtractionProvider {
  extract(sources: readonly IntakeSource[], signal: AbortSignal): Promise<unknown>;
}
function invalid(message: string): never {
  throw new AppError(400, 'INVALID_REVIEW', message);
}
const evidence = (source: IntakeSource, unit: IntakeSource['units'][number]) => [
  { sourceId: source.id, locator: unit.locator, excerpt: unit.text.slice(0, 1000) },
];
const idFor = (sourceId: string, unitId: string) =>
  `entity-${createHash('sha256').update(`${sourceId}:${unitId}`).digest('hex').slice(0, 24)}`;

export class IntakeService {
  private busy = false;
  constructor(
    private readonly store: Store,
    private readonly provider?: ExtractionProvider,
    private readonly providerTimeoutMs = 5000,
    private readonly subscriptionEnabled = false,
  ) {}
  private reviewer(actor: Actor, id?: string): void {
    if (actor.role !== 'facilitator' || (id && this.store.intakes.owner(id) !== actor.id))
      throw new AppError(403, 'FORBIDDEN', 'This account cannot access that preparation draft.');
  }
  list(actor: Actor) {
    this.reviewer(actor);
    return this.store.intakes.list(actor.id);
  }
  get(actor: Actor, id: string, revision?: number): IntakeView {
    this.reviewer(actor, id);
    this.store.extractions.expire();
    const result = this.store.intakes.get(id, revision);
    if (!result) throw new AppError(404, 'NOT_FOUND', 'Preparation draft not found.');
    const { draft } = result;
    const questions: string[] = [];
    if (!draft.sources.some((source) => source.kind === 'network'))
      questions.push('Which supported diagram describes the organisation network?');
    for (const [kind, question] of [
      [
        'service',
        'Which business services must continue, and what is each minimum service outcome?',
      ],
      ['role', 'Who owns decisions, and who acts when the owner is unavailable?'],
      [
        'third-party',
        'Which third parties support the services, and what authority or service limits apply?',
      ],
      ['data', 'Which working records are needed for recovery?'],
    ])
      if (!draft.entities.some((item) => item.kind === kind && item.review === 'accepted'))
        questions.push(question!);
    if (!draft.claims.some((item) => item.predicate === 'rto-hours' && item.review === 'accepted'))
      questions.push(
        'What are the proposed service RTO/RPO targets, and what evidence supports feasibility?',
      );
    if (!draft.claims.some((item) => item.predicate === 'depends-on' && item.review === 'accepted'))
      questions.push('Which systems, people and suppliers does each service depend on?');
    for (const service of draft.entities.filter(
      (item) => item.kind === 'service' && item.review === 'accepted',
    )) {
      for (const predicate of ['rto-hours', 'rpo-hours', 'recovery-priority', 'depends-on']) {
        if (
          !draft.claims.some(
            (item) =>
              item.subjectId === service.id &&
              item.predicate === predicate &&
              item.review === 'accepted' &&
              !['unknown', 'conflict'].includes(item.status),
          )
        )
          questions.push(
            `${service.name}: what evidence establishes ${predicate}, or why should it remain unresolved?`,
          );
      }
    }
    return {
      ...result,
      questions:
        questions.length <= 20
          ? questions
          : [
              ...questions.slice(0, 19),
              `${questions.length - 19} further service context gaps remain. Review each accepted service's recovery targets and dependencies.`,
            ],
      extractionAvailable:
        !!this.provider || (this.subscriptionEnabled && this.store.extractions.available()),
      extractionJob: this.store.extractions.latest(id),
      events: this.store.intakes.events(id),
    };
  }
  private replay(actor: Actor, requestHash: string, commandId: string): IntakeView | null {
    const receipt = this.store.intakes.receipt(actor.id, commandId);
    if (!receipt) return null;
    if (receipt.requestHash !== requestHash)
      throw new AppError(
        409,
        'COMMAND_REUSED',
        'That command identifier was already used for different content.',
      );
    return this.get(actor, receipt.id, receipt.revision);
  }
  create(actor: Actor, input: CreateIntake): IntakeView {
    this.reviewer(actor);
    const requestHash = fingerprint({ action: 'create', input });
    return this.store.transaction(() => {
      const prior = this.replay(actor, requestHash, input.commandId);
      if (prior) return prior;
      if (this.list(actor).length >= 20)
        throw new AppError(
          409,
          'DRAFT_LIMIT',
          'This local prototype supports twenty preparation drafts per reviewer.',
        );
      const at = new Date().toISOString();
      const draft: Intake = {
        id: `intake-${randomUUID()}`,
        revision: 1,
        organisationName: input.organisationName,
        synthetic: true,
        createdAt: at,
        updatedAt: at,
        sources: [],
        entities: [],
        claims: [],
        confirmedProfile: null,
      };
      this.store.intakes.save(draft, actor, 'created', 'New synthetic organisation preparation.');
      this.store.intakes.saveReceipt(actor.id, input.commandId, requestHash, draft);
      return this.get(actor, draft.id);
    });
  }
  private current(actor: Actor, id: string, input: IntakeCommand): Intake {
    const view = this.get(actor, id);
    if (view.draft.revision !== input.expectedRevision || view.contentHash !== input.expectedHash)
      throw new AppError(
        409,
        'STALE_REVISION',
        'The draft changed. Reload and review it before making another change.',
      );
    if (view.draft.confirmedProfile)
      throw new AppError(
        409,
        'FROZEN_PROFILE',
        'This intake is confirmed and immutable. Start a new preparation draft for changed inputs.',
      );
    if (view.draft.revision >= 200)
      throw new AppError(
        409,
        'REVISION_LIMIT',
        'The draft reached the local prototype revision limit.',
      );
    return view.draft;
  }
  private commit(
    actor: Actor,
    id: string,
    input: IntakeCommand,
    action: string,
    requestHash: string,
    change: (draft: Intake) => void,
    rationale: string,
  ): IntakeView {
    return this.store.transaction(() => {
      this.reviewer(actor, id);
      const prior = this.replay(actor, requestHash, input.commandId);
      if (prior) return prior;
      const draft = this.current(actor, id, input);
      change(draft);
      draft.revision++;
      draft.updatedAt = new Date().toISOString();
      try {
        readStored(IntakeSchema, draft);
        validateProposal(draft, draft.sources);
        if (JSON.stringify(draft).length > 1_500_000)
          invalid('The preparation draft exceeds its supported size.');
      } catch (error) {
        invalid(error instanceof Error ? error.message : 'Invalid draft.');
      }
      this.store.intakes.save(draft, actor, action, rationale);
      this.store.intakes.saveReceipt(actor.id, input.commandId, requestHash, draft);
      return this.get(actor, id);
    });
  }
  async upload(actor: Actor, id: string, input: UploadSource): Promise<IntakeView> {
    this.reviewer(actor, id);
    const requestHash = fingerprint({ action: 'source-imported', id, input });
    const prior = this.replay(actor, requestHash, input.commandId);
    if (prior) return prior;
    this.current(actor, id, input);
    if (input.kind === 'network' && !['drawio', 'drawio-svg'].includes(input.format))
      invalid('Network input must be editable draw.io XML.');
    if (input.kind !== 'network' && ['drawio', 'drawio-svg'].includes(input.format))
      invalid('Classify diagram sources as network inputs.');
    if (this.busy)
      throw new AppError(
        429,
        'INTAKE_BUSY',
        'Another source operation is running. Retry this same command later.',
      );
    this.busy = true;
    try {
      const parsed = await parseInWorker(input);
      const source: IntakeSource = {
        id: `source-${randomUUID()}`,
        title: input.title,
        version: input.version,
        kind: input.kind,
        synthetic: true,
        format: input.format,
        contentHash: createHash('sha256')
          .update(
            input.format === 'guided'
              ? Buffer.from(input.content)
              : Buffer.from(input.content, 'base64'),
          )
          .digest('hex'),
        ...parsed,
      };
      readStored(IntakeSourceSchema, source);
      return this.commit(
        actor,
        id,
        input,
        'source-imported',
        requestHash,
        (draft) => {
          if (
            draft.sources.some(
              (item) => item.contentHash === source.contentHash && item.format === source.format,
            )
          )
            invalid('This exact source is already imported.');
          draft.sources.push(source);
          const nodeIds = new Map<string, string>();
          for (const unit of source.units.filter((item) => item.kind === 'node')) {
            const entityId = idFor(source.id, unit.id);
            if (unit.nodeId) nodeIds.set(unit.nodeId, entityId);
            draft.entities.push({
              id: entityId,
              kind: 'unclassified',
              name: unit.text.split('\n')[0]!.slice(0, 160),
              evidence: evidence(source, unit),
              review: 'pending',
            });
          }
          for (const unit of source.units.filter((item) => item.kind === 'edge')) {
            const subjectId = nodeIds.get(unit.from ?? '');
            const objectId = nodeIds.get(unit.to ?? '');
            if (!subjectId || !objectId) continue;
            draft.claims.push({
              id: `claim-${randomUUID()}`,
              subjectId,
              predicate: 'diagram-link',
              objectId,
              value: null,
              status: 'proposal',
              explanation:
                'Explicit drawing connector only; review its meaning, direction and endpoints before acceptance.',
              evidence: evidence(source, unit),
              review: 'pending',
            });
          }
        },
        `Imported synthetic source: ${source.title}. Native extraction is not reviewer acceptance.`,
      );
    } finally {
      this.busy = false;
    }
  }
  review(actor: Actor, id: string, input: ReviewIntake): IntakeView {
    return this.commit(
      actor,
      id,
      input,
      'reviewed',
      fingerprint({ action: 'reviewed', id, input }),
      (draft) => {
        const entityIds = new Set(input.entities.map((item) => item.id));
        const claimIds = new Set(input.claims.map((item) => item.id));
        if (
          draft.entities.some((item) => !entityIds.has(item.id)) ||
          draft.claims.some((item) => !claimIds.has(item.id))
        )
          invalid('Retain rejected candidates in the review record rather than deleting them.');
        draft.organisationName = input.organisationName;
        draft.entities = input.entities;
        draft.claims = input.claims;
      },
      input.rationale,
    );
  }
  async extract(actor: Actor, id: string, input: IntakeCommand): Promise<IntakeView> {
    this.reviewer(actor, id);
    const requestHash = fingerprint({ action: 'proposal-added', id, input });
    if (this.subscriptionEnabled) {
      return this.store.transaction(() => {
        const job = this.store.extractions.receipt(actor.id, input.commandId);
        if (job) {
          if (job.requestHash !== requestHash)
            throw new AppError(409, 'COMMAND_REUSED', 'Command content changed.');
          return this.get(actor, id);
        }
        const prior = this.replay(actor, requestHash, input.commandId);
        if (prior) return prior;
        const draft = this.current(actor, id, input);
        if (!draft.sources.length) invalid('Import a source first.');
        if (!this.store.extractions.available())
          throw new AppError(
            503,
            'AI_UNAVAILABLE',
            'Local subscription worker is offline. Manual review remains available.',
          );
        if (this.store.extractions.active())
          throw new AppError(429, 'INTAKE_BUSY', 'An extraction job is already queued or running.');
        if (this.store.extractions.count(id) >= 10)
          throw new AppError(
            429,
            'JOB_LIMIT',
            'Ten extraction requests per draft is the local prototype limit.',
          );
        this.store.extractions.create(
          `extraction-${randomUUID()}`,
          actor.id,
          id,
          input,
          requestHash,
        );
        return this.get(actor, id);
      });
    }
    const prior = this.replay(actor, requestHash, input.commandId);
    if (prior) return prior;
    const draft = this.current(actor, id, input);
    if (!this.provider)
      throw new AppError(
        503,
        'AI_UNAVAILABLE',
        'No extraction provider is connected. Source review and guided completion remain available.',
      );
    if (!draft.sources.length) invalid('Import a source first.');
    if (this.busy) throw new AppError(429, 'INTAKE_BUSY', 'Another source operation is running.');
    this.busy = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const output = await Promise.race([
        this.provider.extract(structuredClone(draft.sources), controller.signal),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error('timeout'));
          }, this.providerTimeoutMs);
        }),
      ]);
      return this.addProposal(actor, id, input, output);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        503,
        'EXTRACTION_FAILED',
        'Extraction failed or timed out. No proposal was saved; manual review remains available.',
      );
    } finally {
      clearTimeout(timer);
      controller.abort();
      this.busy = false;
    }
  }
  addProposal(
    actor: Actor,
    id: string,
    input: IntakeCommand,
    output: unknown,
    onCommit?: () => void,
  ): IntakeView {
    const draft = this.current(actor, id, input);
    let proposal: Proposal;
    try {
      proposal = readStored(ProposalSchema, output);
      if (!proposal.entities.length && !proposal.claims.length) throw new Error('Empty proposal.');
      if ([...proposal.entities, ...proposal.claims].some((item) => item.review !== 'pending'))
        throw new Error('Provider attempted acceptance.');
      validateProposal(
        {
          entities: [...draft.entities, ...proposal.entities],
          claims: [...draft.claims, ...proposal.claims],
        },
        draft.sources,
      );
    } catch {
      throw new AppError(
        502,
        'INVALID_PROPOSAL',
        'The provider returned an invalid or ungrounded proposal. Nothing was accepted.',
      );
    }
    return this.commit(
      actor,
      id,
      input,
      'proposal-added',
      fingerprint({ action: 'proposal-added', id, input }),
      (current) => {
        current.entities.push(...proposal.entities);
        current.claims.push(...proposal.claims);
        onCommit?.();
      },
      'Untrusted extraction proposal stored for human review.',
    );
  }
  confirm(
    actor: Actor,
    id: string,
    input: ConfirmIntake,
  ): { intake: IntakeView; profile: ProfileView } {
    const intake = this.commit(
      actor,
      id,
      input,
      'confirmed',
      fingerprint({ action: 'confirmed', id, input }),
      (draft) => {
        if (!input.acknowledgeUncertainties) invalid('Acknowledge unresolved uncertainty.');
        if (
          !draft.sources.some(
            (source) =>
              source.kind === 'network' && ['drawio', 'drawio-svg'].includes(source.format),
          )
        )
          invalid('A supported network diagram is required before confirmation.');
        if ([...draft.entities, ...draft.claims].some((item) => item.review === 'pending'))
          invalid('Review or reject every pending candidate before confirmation.');
        const entities = draft.entities
          .filter((item) => item.review === 'accepted')
          .map(({ id, kind, name, evidence }) => ({ id, kind, name, evidence }));
        const claims = draft.claims
          .filter((item) => item.review === 'accepted')
          .map(({ id, subjectId, predicate, objectId, value, status, explanation, evidence }) => ({
            id,
            subjectId,
            predicate,
            objectId,
            value,
            status,
            explanation,
            evidence,
          }));
        if (!entities.length || !claims.length)
          invalid(
            'Confirm at least one sourced entity and claim; do not invent information to fill gaps.',
          );
        const profile: Profile = {
          profileId: draft.id,
          revisionId: `profile-${randomUUID()}`,
          revisionNumber: 1,
          organisationName: draft.organisationName,
          synthetic: true,
          createdAt: new Date().toISOString(),
          sources: draft.sources.map(({ id, title, version, kind, synthetic, contentHash }) => ({
            id,
            title,
            version,
            kind,
            synthetic,
            contentHash,
          })),
          environment: { entities, claims },
          statements: claims.map((claim) => ({
            id: claim.id,
            category: ['rto-hours', 'rpo-hours', 'recovery-priority'].includes(claim.predicate)
              ? 'continuity'
              : 'network',
            label:
              `${entities.find((entity) => entity.id === claim.subjectId)!.name}: ${claim.predicate}`.slice(
                0,
                120,
              ),
            status: claim.status,
            value: claim.objectId
              ? entities.find((entity) => entity.id === claim.objectId)!.name
              : claim.value === null
                ? null
                : String(claim.value),
            explanation: claim.explanation,
            evidence: claim.evidence,
          })),
        };
        this.store.publishIntakeProfile(profile, actor);
        draft.confirmedProfile = { profileId: profile.profileId, revisionId: profile.revisionId };
      },
      'Reviewer confirmed the exact typed profile and acknowledged remaining uncertainty.',
    );
    const reference = intake.draft.confirmedProfile!;
    const snapshot = this.store.profile(reference.profileId, reference.revisionId)!;
    return {
      intake,
      profile: {
        ...snapshot,
        confirmation: this.store.confirmation(reference.profileId, reference.revisionId),
      },
    };
  }
}
