import { randomUUID } from 'node:crypto';
import type { Actor, Profile } from '../contracts/profile.js';
import {
  GenerationResultSchema,
  type PackageTarget,
  type PackageDraft,
  type PackageDraftView,
  type GenerationContext,
  type GeneratePackage,
  type ReviewPosition,
  type ReviewPreparation,
  type FreezePackage,
} from '../contracts/generation.js';
import { Store } from './storage.js';
import { AppError } from './errors.js';
import { contentHash, fingerprint } from './integrity.js';
import { readStored } from './validation.js';
import {
  compileGeneratedPackage,
  objectiveCoverageProblems,
  sameBinding,
  validateGeneratedPlan,
} from './generation-content.js';

function conflict(message: string): never {
  throw new AppError(409, 'PACKAGE_CONFLICT', message);
}
export const packagePlayers = [
  { actorId: 'player-business', roleId: 'business-leadership' },
  { actorId: 'player-engineering', roleId: 'engineering-projects' },
  { actorId: 'player-it', roleId: 'internal-it' },
] as const;

export class GenerationService {
  constructor(
    private readonly store: Store,
    private readonly target: PackageTarget | null,
    private readonly enabled = false,
  ) {}

  private facilitator(actor: Actor): void {
    if (actor.role !== 'facilitator')
      throw new AppError(403, 'FORBIDDEN', 'Package drafts are facilitator-only.');
  }

  requireTarget(actor: Actor, binding: GeneratePackage | PackageTarget): Profile {
    this.facilitator(actor);
    if (!this.target || !sameBinding(binding, this.target))
      conflict('Only the pinned confirmed Teralqen review-8 profile may be used.');
    if (!this.store.mayReview(actor.id, this.target.profileId))
      throw new AppError(403, 'FORBIDDEN', 'This account cannot use that confirmed profile.');
    const snapshot = this.store.profile(this.target.profileId, this.target.profileRevisionId);
    const confirmation = this.store.confirmation(
      this.target.profileId,
      this.target.profileRevisionId,
    );
    if (
      !snapshot ||
      !confirmation ||
      !this.store.isCurrent(this.target.profileId, this.target.profileRevisionId) ||
      snapshot.contentHash !== this.target.profileHash ||
      confirmation.contentHash !== this.target.profileHash
    )
      conflict(
        'The exact pinned profile must be current and confirmed before generation or approval.',
      );
    return snapshot.profile;
  }

  context(actor: Actor): GenerationContext {
    this.facilitator(actor);
    if (!this.target)
      return {
        target: null,
        profile: null,
        ready: false,
        reason: 'No confirmed generation target is configured.',
        drafts: [],
      };
    const profile = this.requireTarget(actor, this.target);
    // Like the AAR and interpretation lists, a read shows a stalled worker as failed.
    this.store.transaction(() => this.expire());
    return {
      target: this.target,
      profile,
      ready: this.enabled,
      reason: this.enabled
        ? ''
        : 'Subscription generation is disabled; saved packages remain available for manual review.',
      drafts: this.store.generation.list(actor.id).map((draft) => this.get(actor, draft.id)),
    };
  }

  get(actor: Actor, id: string): PackageDraftView {
    this.facilitator(actor);
    const saved = this.store.generation.get(id);
    if (!saved || saved.draft.ownerId !== actor.id)
      throw new AppError(403, 'FORBIDDEN', 'This account cannot read that package draft.');
    const { draft } = saved;
    const profile = this.requireTarget(actor, draft.target);
    const preview =
      draft.status === 'frozen'
        ? this.store.exercises.package(id, `package-${draft.revision}`).definition
        : draft.plan
          ? compileGeneratedPackage(draft, profile)
          : null;
    const coverage =
      draft.status !== 'frozen' && draft.plan ? objectiveCoverageProblems(draft.plan) : [];
    return { ...saved, preview, coverage };
  }

  private replay(actor: Actor, commandId: string, hash: string): PackageDraftView | null {
    const receipt = this.store.generation.receipt(actor.id, commandId);
    if (!receipt) return null;
    if (receipt.hash !== hash)
      conflict('This package command key was already used for different content.');
    return this.get(actor, receipt.id);
  }

  generate(actor: Actor, input: GeneratePackage): PackageDraftView {
    return this.store.transaction(() => {
      this.requireTarget(actor, input);
      const hash = fingerprint({ action: 'generate', input });
      const replay = this.replay(actor, input.commandId, hash);
      if (replay) return replay;
      if (!this.enabled) conflict('Subscription generation is disabled.');
      this.expire();
      const all = this.store.generation.list();
      if (all.some((draft) => ['queued', 'running'].includes(draft.status)))
        conflict('A generation request is already pending.');
      if (all.filter((draft) => draft.ownerId === actor.id).length >= 10)
        conflict('The bounded ten-draft generation limit has been reached.');
      const at = new Date().toISOString();
      const draft: PackageDraft = {
        id: `package-${randomUUID()}`,
        ownerId: actor.id,
        revision: 1,
        target: this.target!,
        status: 'queued',
        plan: null,
        reviews: [],
        error: null,
        createdAt: at,
        updatedAt: at,
        runId: null,
        frozenPackageHash: null,
        inputTokens: null,
        outputTokens: null,
      };
      this.store.generation.save(draft, 'generation-requested');
      this.store.generation.record(actor.id, input.commandId, hash, draft.id);
      return this.get(actor, draft.id);
    });
  }

  claim() {
    if (!this.enabled) return null;
    return this.store.transaction(() => {
      this.expire();
      if (
        this.store.generation.list().some((draft) => draft.status === 'running') ||
        this.store.extractions.active()
      )
        return null;
      const draft = this.store.generation.list().find((item) => item.status === 'queued');
      if (!draft) return null;
      try {
        const profile = this.requireTarget(this.store.actor(draft.ownerId)!, draft.target);
        this.store.generation.save(
          {
            ...draft,
            revision: draft.revision + 1,
            status: 'running',
            updatedAt: new Date().toISOString(),
          },
          'generation-started',
        );
        return { id: draft.id, target: draft.target, profile };
      } catch {
        this.fail(draft, 'The confirmed profile binding changed before generation.');
        return null;
      }
    });
  }

  complete(value: unknown): { saved: boolean } {
    const input = readStored(GenerationResultSchema, value);
    return this.store.transaction(() => {
      this.expire();
      const draft = this.store.generation.get(input.id)?.draft;
      if (!draft || draft.status !== 'running') return { saved: false };
      try {
        if (input.failed) throw new Error('Provider failure');
        const profile = this.requireTarget(this.store.actor(draft.ownerId)!, draft.target);
        const plan = validateGeneratedPlan(input.output, profile, draft.target);
        const next: PackageDraft = {
          ...draft,
          revision: draft.revision + 1,
          status: 'review',
          plan,
          reviews: Array(5).fill('pending'),
          updatedAt: new Date().toISOString(),
          inputTokens: input.inputTokens < 0 ? null : input.inputTokens,
          outputTokens: input.outputTokens < 0 ? null : input.outputTokens,
        };
        compileGeneratedPackage(next, profile);
        this.store.generation.save(next, 'proposal-saved');
        return { saved: true };
      } catch {
        this.fail(
          draft,
          'Generation failed or its proposal did not satisfy the profile/content rules. No automatic retry.',
        );
        return { saved: false };
      }
    });
  }

  private fail(draft: PackageDraft, error: string): void {
    this.store.generation.save(
      {
        ...draft,
        revision: draft.revision + 1,
        status: 'failed',
        error,
        updatedAt: new Date().toISOString(),
      },
      'generation-failed',
    );
  }

  private expire(): void {
    for (const draft of this.store.generation
      .list()
      .filter(
        (item) => item.status === 'running' && Date.now() - Date.parse(item.updatedAt) > 300_000,
      ))
      this.fail(
        draft,
        'The local generation worker did not finish within five minutes. No automatic retry.',
      );
  }

  private editable(actor: Actor, id: string, input: FreezePackage): PackageDraftView {
    const saved = this.get(actor, id);
    if (saved.draft.status !== 'review')
      conflict('Only a generated draft under review may be changed or approved.');
    if (saved.draft.revision !== input.expectedRevision || saved.hash !== input.expectedHash)
      conflict('The package changed. Review its current revision before approval.');
    return saved;
  }

  review(actor: Actor, id: string, input: ReviewPosition): PackageDraftView {
    return this.store.transaction(() => {
      this.facilitator(actor);
      const hash = fingerprint({ action: 'review', id, input });
      const replay = this.replay(actor, input.commandId, hash);
      if (replay) return replay;
      const { draft } = this.editable(actor, id, input);
      const next = structuredClone(draft);
      next.plan!.positions[input.position.position - 1] = input.position;
      next.reviews[input.position.position - 1] = input.decision;
      next.revision++;
      next.updatedAt = new Date().toISOString();
      try {
        compileGeneratedPackage(next, this.requireTarget(actor, next.target));
      } catch {
        throw new AppError(
          400,
          'INVALID_PACKAGE',
          'The inject edit violates the profile, sequence or content rules.',
        );
      }
      this.store.generation.save(next, `inject-${input.position.position}-${input.decision}`);
      this.store.generation.record(actor.id, input.commandId, hash, id);
      return this.get(actor, id);
    });
  }

  reviewPreparation(actor: Actor, id: string, input: ReviewPreparation): PackageDraftView {
    return this.store.transaction(() => {
      this.facilitator(actor);
      const hash = fingerprint({ action: 'preparation', id, input });
      const replay = this.replay(actor, input.commandId, hash);
      if (replay) return replay;
      const { draft } = this.editable(actor, id, input);
      if (
        new Set(input.roles.map((role) => role.roleId)).size !== 3 ||
        draft.plan!.roles.some((role) => !input.roles.some((item) => item.roleId === role.roleId))
      )
        conflict('Preparation must cover each player role exactly once.');
      const next = structuredClone(draft);
      next.preparation = structuredClone(input.preparation);
      // The reviewer may correct which confirmed people represent each function. The plan
      // validator still rejects unknown, non-person or duplicated assignments.
      for (const role of next.plan!.roles) {
        const edit = input.roles.find((item) => item.roleId === role.roleId)!;
        role.personIds = [...edit.personIds];
        role.briefingEvidence = structuredClone(edit.briefingEvidence);
      }
      next.reviews = next.reviews.map(() => 'pending');
      next.revision++;
      next.updatedAt = new Date().toISOString();
      try {
        compileGeneratedPackage(next, this.requireTarget(actor, next.target));
      } catch {
        throw new AppError(
          400,
          'INVALID_PACKAGE',
          'Preparation violates the confirmed people, claims, plan source or content bounds.',
        );
      }
      this.store.generation.save(next, 'preparation-reviewed');
      this.store.generation.record(actor.id, input.commandId, hash, id);
      return this.get(actor, id);
    });
  }

  freeze(actor: Actor, id: string, input: FreezePackage): PackageDraftView {
    return this.store.transaction(() => {
      this.facilitator(actor);
      const hash = fingerprint({ action: 'freeze', id, input });
      const replay = this.replay(actor, input.commandId, hash);
      if (replay) return replay;
      const { draft } = this.editable(actor, id, input);
      if (draft.reviews.length !== 5 || draft.reviews.some((decision) => decision !== 'accepted'))
        conflict('Review and accept all five exact injects before freezing the package.');
      const coverage = objectiveCoverageProblems(draft.plan!);
      if (coverage.length)
        conflict(('Resolve objective coverage before freezing. ' + coverage[0]).slice(0, 300));
      const next: PackageDraft = {
        ...draft,
        revision: draft.revision + 1,
        status: 'frozen',
        updatedAt: new Date().toISOString(),
        runId: `run-${randomUUID()}`,
      };
      const definition = compileGeneratedPackage(next, this.requireTarget(actor, next.target));
      next.frozenPackageHash = contentHash(JSON.stringify(definition));
      const members = [
        {
          actorId: actor.id,
          displayName: actor.displayName,
          kind: 'facilitator' as const,
          roleId: null,
        },
        ...packagePlayers.map(({ actorId, roleId }) => {
          const player = this.store.actor(actorId);
          if (!player || player.role !== 'participant')
            conflict('The three local player identities are not configured.');
          return { actorId, roleId, displayName: player.displayName, kind: 'participant' as const };
        }),
      ];
      this.store.generation.save(next, 'package-approved-and-frozen');
      if (this.store.exercises.seedPackage(definition))
        conflict('An immutable package identity already contains different content.');
      this.store.exercises.seedRun(next.runId!, definition, members);
      this.store.generation.record(actor.id, input.commandId, hash, id);
      return this.get(actor, id);
    });
  }
}
