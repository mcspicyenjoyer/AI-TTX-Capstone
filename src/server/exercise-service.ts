import { randomUUID } from 'node:crypto';
import type { TSchema, Static } from '@sinclair/typebox';
import type { Actor } from '../contracts/profile.js';
import {
  ApprovalSchema,
  ReleaseSchema,
  RunSchema,
  type ApproveRequest,
  type Approval,
  type BriefingView,
  type Inbox,
  type Release,
  type ReleaseRequest,
  type Review,
  type Run,
  type RunList,
  type StartRequest,
  type StateRequest,
  type Track,
} from '../contracts/exercise.js';
import { Store } from './storage.js';
import { AppError } from './errors.js';
import { checkRunBinding } from './exercise-validation.js';
import { fingerprint } from './integrity.js';
import { readStored } from './validation.js';

function conflict(message: string): never {
  throw new AppError(409, 'RUN_CONFLICT', message);
}

export class ExerciseService {
  constructor(private readonly store: Store) {}

  private context(actor: Actor, track: Track, runId: string, facilitator: boolean) {
    const member = this.store.exercises.member(runId, actor.id);
    if (!member || member.kind !== actor.role || (facilitator && member.kind !== 'facilitator'))
      throw new AppError(403, 'FORBIDDEN', 'This account cannot access that exercise operation.');
    const run = this.store.exercises.run(runId);
    if (!run || run.track !== track)
      throw new AppError(404, 'NOT_FOUND', 'That exercise is unavailable in this track.');
    const { definition, hash } = this.store.exercises.package(run.packageId, run.packageRevisionId);
    const members = this.store.exercises.members(runId);
    checkRunBinding(run, definition, members);
    return { run, definition, hash, members, member, assignmentHash: fingerprint(members) };
  }

  list(actor: Actor, track: Track): RunList {
    return this.store.exercises.listRunIds(actor.id, track).map((id) => {
      const { run, definition } = this.context(actor, track, id, false);
      return { id, track, title: definition.title, state: run.state, kind: definition.kind };
    });
  }

  private profileConfirmed(context: ReturnType<ExerciseService['context']>): boolean {
    const definition = context.definition;
    const profile = this.store.profile(definition.profileId, definition.profileRevisionId);
    const confirmation = this.store.confirmation(
      definition.profileId,
      definition.profileRevisionId,
    );
    return (
      !!profile &&
      !!confirmation &&
      this.store.isCurrent(definition.profileId, definition.profileRevisionId) &&
      profile.contentHash === definition.profileHash &&
      confirmation.contentHash === definition.profileHash
    );
  }

  private requirePlayable(context: ReturnType<ExerciseService['context']>): void {
    if (context.definition.kind === 'development-skeleton')
      conflict('This development fixture has no approved playable content.');
    if (!this.profileConfirmed(context))
      conflict('Confirm the bound profile revision before exercise play.');
  }

  private requirePreparation(context: ReturnType<ExerciseService['context']>): void {
    this.requirePlayable(context);
    const preparation = this.store.exercises.preparation(context.run.id);
    if (
      !preparation ||
      preparation.packageHash !== context.hash ||
      preparation.assignmentHash !== context.assignmentHash ||
      preparation.briefingRevisionId !== context.definition.briefing.revisionId
    )
      conflict('The starting arrangements have changed or have not been confirmed.');
  }

  review(actor: Actor, track: Track, runId: string): Review {
    const context = this.context(actor, track, runId, true);
    const releases = this.store.exercises.releases(runId);
    const next = context.definition.injects.find(
      (inject) => !releases.some((release) => release.injectId === inject.id),
    );
    const approval = this.store.exercises.latestApproval(runId);
    return {
      run: context.run,
      package: context.definition,
      packageHash: context.hash,
      assignmentHash: context.assignmentHash,
      members: context.members,
      profileConfirmed: this.profileConfirmed(context),
      preparation: this.store.exercises.preparation(runId),
      approval:
        approval?.runRevision === context.run.revision &&
        approval.packageHash === context.hash &&
        approval.assignmentHash === context.assignmentHash &&
        context.run.state === 'active'
          ? approval
          : null,
      nextInject: next ? { id: next.id, contentHash: fingerprint(next) } : null,
      releases,
    };
  }

  briefing(actor: Actor, track: Track, runId: string): BriefingView {
    const { run, definition, member } = this.context(actor, track, runId, false);
    const role = definition.roles.find((role) => role.id === member.roleId);
    if (member.kind !== 'participant' || !role)
      throw new AppError(403, 'FORBIDDEN', 'This account has no participant briefing.');
    return {
      runId,
      track,
      state: run.state,
      revisionId: definition.briefing.revisionId,
      common: definition.briefing.common,
      references: definition.briefing.references,
      role,
    };
  }

  inbox(actor: Actor, track: Track, runId: string): Inbox {
    const { member } = this.context(actor, track, runId, false);
    if (member.kind !== 'participant')
      throw new AppError(403, 'FORBIDDEN', 'This account has no participant inbox.');
    return this.store.exercises.releases(runId, actor.id).map((release) => ({
      id: release.id,
      runId,
      injectId: release.injectId,
      injectRevisionId: release.injectRevisionId,
      title: release.title,
      body: release.body,
      releasedAt: release.releasedAt,
    }));
  }

  activity(actor: Actor, track: Track, runId: string) {
    this.context(actor, track, runId, true);
    return this.store.exercises.activity(runId);
  }

  // State, receipt, inbox and audit writes share one immediate SQLite transaction.
  private execute<T extends TSchema>(
    actor: Actor,
    track: Track,
    runId: string,
    operation: string,
    input: StateRequest,
    resultSchema: T,
    apply: (context: ReturnType<ExerciseService['context']>) => Static<T>,
  ): Static<T> {
    return this.store.transaction(() => {
      const context = this.context(actor, track, runId, true);
      const requestHash = fingerprint({ operation, actorId: actor.id, input });
      const previous = this.store.exercises.command(runId, input.idempotencyKey);
      if (previous) {
        if (previous.hash !== requestHash)
          conflict('This request key was already used for different content.');
        return readStored(resultSchema, previous.result);
      }
      if (input.expectedRunRevision !== context.run.revision)
        conflict('The exercise has changed. Refresh and review it again.');
      const result = readStored(resultSchema, apply(context));
      this.store.exercises.saveCommand(runId, input.idempotencyKey, requestHash, result);
      return result;
    });
  }

  start(actor: Actor, track: Track, runId: string, input: StartRequest): Run {
    return this.execute(actor, track, runId, 'start', input, RunSchema, (context) => {
      this.requirePlayable(context);
      if (context.run.state !== 'draft') conflict('Only a draft exercise can be started.');
      if (context.hash !== input.packageHash || context.assignmentHash !== input.assignmentHash)
        conflict('The package or assignments have changed. Review the briefing again.');
      if (!input.acknowledgeBriefing || !input.acknowledgeGaps || !input.acknowledgeSimulation)
        conflict('Confirm the briefing, gap dispositions and simulation boundary.');
      if (
        context.definition.briefing.gaps.some((gap) => gap.disposition === 'hold') ||
        context.definition.roles.some(
          (role) => !context.members.some((member) => member.roleId === role.id),
        )
      )
        conflict('Resolve the preparation hold or missing role assignments before starting.');
      this.store.exercises.savePreparation(runId, {
        actorId: actor.id,
        confirmedAt: new Date().toISOString(),
        packageHash: context.hash,
        assignmentHash: context.assignmentHash,
        briefingRevisionId: context.definition.briefing.revisionId,
      });
      const run = this.store.exercises.updateRun(context.run, 'active');
      this.store.exercises.event(
        run,
        'briefing-confirmed',
        actor.id,
        context.definition.briefing.revisionId,
      );
      return run;
    });
  }

  changeState(
    actor: Actor,
    track: Track,
    runId: string,
    input: StateRequest,
    action: 'pause' | 'resume',
  ): Run {
    return this.execute(actor, track, runId, action, input, RunSchema, (context) => {
      if (action === 'pause' && context.run.state !== 'active')
        conflict('Only an active exercise can be paused.');
      if (action === 'resume') {
        if (context.run.state !== 'paused') conflict('Only a paused exercise can be resumed.');
        this.requirePreparation(context);
      }
      const run = this.store.exercises.updateRun(
        context.run,
        action === 'pause' ? 'paused' : 'active',
      );
      this.store.exercises.event(run, action === 'pause' ? 'run-paused' : 'run-resumed', actor.id);
      return run;
    });
  }

  approve(actor: Actor, track: Track, runId: string, request: ApproveRequest): Approval {
    const input = { ...request, recipientIds: [...request.recipientIds].sort() };
    return this.execute(actor, track, runId, 'approve', input, ApprovalSchema, (context) => {
      this.requirePreparation(context);
      if (context.run.state !== 'active') conflict('Approval requires an active exercise.');
      const releases = this.store.exercises.releases(runId);
      const inject = context.definition.injects.find(
        (item) => !releases.some((release) => release.injectId === item.id),
      );
      if (
        !inject ||
        input.injectId !== inject.id ||
        input.injectRevisionId !== inject.revisionId ||
        input.contentHash !== fingerprint(inject) ||
        input.packageHash !== context.hash
      )
        conflict('The selected inject is stale, already released or not next in this package.');
      const allowed = context.members
        .filter(
          (member) =>
            member.kind === 'participant' &&
            member.roleId &&
            inject.recipientRoleIds.includes(member.roleId),
        )
        .map((member) => member.actorId);
      if (
        !input.recipientIds.length ||
        new Set(input.recipientIds).size !== input.recipientIds.length ||
        input.recipientIds.some((id) => !allowed.includes(id))
      )
        throw new AppError(
          400,
          'INVALID_RECIPIENTS',
          'Choose only assigned recipients for this inject.',
        );
      const run = this.store.exercises.updateRun(context.run);
      const approval: Approval = {
        id: `approval-${randomUUID()}`,
        runId,
        runRevision: run.revision,
        packageRevisionId: context.definition.revisionId,
        packageHash: context.hash,
        assignmentHash: context.assignmentHash,
        injectId: inject.id,
        injectRevisionId: inject.revisionId,
        contentHash: fingerprint(inject),
        recipientIds: input.recipientIds,
        actorId: actor.id,
        approvedAt: new Date().toISOString(),
      };
      this.store.exercises.saveApproval(approval);
      this.store.exercises.event(run, 'inject-approved', actor.id, approval.id);
      return approval;
    });
  }

  release(actor: Actor, track: Track, runId: string, input: ReleaseRequest): Release {
    return this.execute(actor, track, runId, 'release', input, ReleaseSchema, (context) => {
      this.requirePreparation(context);
      if (context.run.state !== 'active') conflict('Release requires an active exercise.');
      const approval = this.store.exercises.approval(input.approvalId);
      const releases = this.store.exercises.releases(runId);
      const inject = context.definition.injects.find(
        (item) => !releases.some((release) => release.injectId === item.id),
      );
      if (
        !approval ||
        !inject ||
        approval.runId !== runId ||
        approval.runRevision !== context.run.revision ||
        approval.packageRevisionId !== context.definition.revisionId ||
        approval.packageHash !== context.hash ||
        approval.assignmentHash !== context.assignmentHash ||
        approval.injectId !== inject.id ||
        approval.injectRevisionId !== inject.revisionId ||
        approval.contentHash !== fingerprint(inject)
      )
        conflict('A current approval for the exact next inject and recipients is required.');
      const recipients = approval.recipientIds;
      if (
        recipients.some(
          (id) =>
            !context.members.some(
              (member) =>
                member.actorId === id &&
                member.kind === 'participant' &&
                member.roleId &&
                inject.recipientRoleIds.includes(member.roleId),
            ),
        )
      )
        conflict('The approved recipients are no longer eligible.');
      const run = this.store.exercises.updateRun(context.run);
      const release: Release = {
        id: `release-${randomUUID()}`,
        runId,
        approvalId: approval.id,
        injectId: inject.id,
        injectRevisionId: inject.revisionId,
        title: inject.title,
        body: inject.body,
        releasedAt: new Date().toISOString(),
        recipientIds: [...recipients],
      };
      this.store.exercises.saveRelease(release);
      this.store.exercises.event(run, 'inject-released', actor.id, release.id);
      return release;
    });
  }
}
