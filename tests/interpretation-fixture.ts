import { randomUUID } from 'node:crypto';
import type { Store } from '../src/server/storage.js';
import { GenerationService, packagePlayers } from '../src/server/generation-service.js';
import { ExerciseService } from '../src/server/exercise-service.js';
import { OutcomeService } from '../src/server/outcome-service.js';
import { generationPlan, generationProfile, generationTarget } from './generation-fixture.js';
import type { InterpretationInput, InterpretationOutput } from '../src/contracts/interpretation.js';

export function prepareInterpretationRun(
  store: Store,
  complete = false,
  onResponse?: (runId: string, releaseId: string) => void,
  unanswered: number[] = [],
  plan = generationPlan(),
) {
  const actor = store.loginIdentity('facilitator')!.actor;
  if (!store.profile(generationProfile.profileId, generationProfile.revisionId))
    store.transaction(() => store.publishIntakeProfile(structuredClone(generationProfile), actor));
  const generator = new GenerationService(store, generationTarget, true);
  let draft = generator.generate(actor, { ...generationTarget, commandId: randomUUID() });
  generator.claim();
  generator.complete({
    id: draft.draft.id,
    failed: false,
    output: plan,
    inputTokens: 1,
    outputTokens: 1,
  });
  draft = generator.get(actor, draft.draft.id);
  const revision = () => ({
    commandId: randomUUID(),
    expectedRevision: draft.draft.revision,
    expectedHash: draft.hash,
  });
  for (const position of draft.draft.plan!.positions)
    draft = generator.review(actor, draft.draft.id, {
      ...revision(),
      position,
      decision: 'accepted',
    });
  draft = generator.freeze(actor, draft.draft.id, revision());
  const runId = draft.draft.runId!;
  const exercises = new ExerciseService(store),
    outcomes = new OutcomeService(store, exercises);
  const state = () => ({
    expectedRunRevision: store.exercises.run(runId)!.revision,
    idempotencyKey: randomUUID(),
  });
  const initial = exercises.review(actor, 'technical', runId);
  exercises.recordStep0(actor, 'technical', runId, {
    ...state(),
    packageHash: initial.packageHash,
    assignmentHash: initial.assignmentHash,
    respondentIds: packagePlayers.map((player) => player.actorId),
    firstContact: 'Facilitator.',
    contactRoute: 'Test route.',
    fallback: 'Test cover.',
    decision: 'ready',
    rationale: 'Synthetic test only.',
  });
  exercises.start(actor, 'technical', runId, {
    ...state(),
    packageHash: initial.packageHash,
    assignmentHash: initial.assignmentHash,
    acknowledgeBriefing: true,
    acknowledgeGaps: true,
    acknowledgeSimulation: true,
  });
  const player = store.actor('player-it')!;
  for (let i = 0; i < (complete ? 5 : 1); i++) {
    const current = exercises.review(actor, 'technical', runId),
      inject = current.package.injects[i]!;
    const approval = exercises.approve(actor, 'technical', runId, {
      ...state(),
      packageHash: current.packageHash,
      injectId: inject.id,
      injectRevisionId: inject.revisionId,
      contentHash: current.nextInject!.contentHash,
      recipientIds: packagePlayers.map((item) => item.actorId),
    });
    const release = exercises.release(actor, 'technical', runId, {
      ...state(),
      approvalId: approval.id,
    });
    const answer = unanswered.includes(i + 1)
      ? null
      : outcomes.respond(player, 'technical', runId, {
          ...state(),
          releaseId: release.id,
          previousResponseId: null,
          actions: 'Ethan proposes a hold; Imran owns follow-up. No reconnection; review at 13:30.',
          rationale: 'Evidence is not ready.',
          informationRequests: 'What remains unknown?',
        });
    if (answer) onResponse?.(runId, release.id);
    if (complete) {
      const disposition = outcomes.disposition(actor, 'technical', runId, {
        ...state(),
        releaseId: release.id,
        responseId: answer?.id ?? null,
        decision: 'reviewed',
        observations: 'Separate facilitator observation, never interpreter ground truth.',
        unresolvedGaps: answer
          ? 'Test evidence absent.'
          : 'Unanswered; no team response is inferred.',
      });
      outcomes.close(actor, 'technical', runId, {
        ...state(),
        releaseId: release.id,
        dispositionId: disposition.id,
        rationale: 'Discussion closed, not an executed action.',
      });
    }
  }
  if (complete)
    outcomes.complete(actor, 'technical', runId, {
      ...state(),
      rationale: 'All test positions closed.',
    });
  const release = store.exercises.releases(runId)[0]!;
  const response = store.outcomes.responses(release.id).at(-1)!;
  return { actor, player, runId, release, response, state, exercises, outcomes };
}

export function fakeInterpretation(input: InterpretationInput): InterpretationOutput {
  return {
    actions: input.expectedActions.map((action) => ({
      actionKey: action.key,
      label: 'partial',
      evidence: [{ field: 'actions', quote: input.response.actions }],
    })),
    summary: {
      decision: [{ field: 'actions', quote: input.response.actions.slice(0, 500) }],
      rationale: [{ field: 'rationale', quote: input.response.rationale.slice(0, 500) }],
    },
    risks: [],
    recommendedFollowUpId: null,
  };
}
