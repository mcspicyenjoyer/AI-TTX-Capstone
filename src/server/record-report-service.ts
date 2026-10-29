import { randomUUID } from 'node:crypto';
import type { Actor } from '../contracts/profile.js';
import { decisions } from '../contracts/generation.js';
import type { InterpretationOutput } from '../contracts/interpretation.js';
import {
  type ReportRecord,
  type RecordReport,
  type RecordReportView,
} from '../contracts/record-report.js';
import type { Store } from './storage.js';
import { ExerciseService } from './exercise-service.js';
import { InterpretationService } from './interpretation-service.js';
import { validateInterpretation } from './interpretation-content.js';
import { AppError } from './errors.js';
import { releasedExerciseClocks } from './record-report-clock.js';

function conflict(message: string): never {
  throw new AppError(409, 'REPORT_CONFLICT', message);
}

export class RecordReportService {
  private readonly exercises: ExerciseService;
  constructor(private readonly store: Store) {
    this.exercises = new ExerciseService(store);
  }
  list(actor: Actor, runId: string) {
    this.exercises.context(actor, 'technical', runId, true);
    return this.store.recordReports.list(runId, actor.id);
  }
  get(actor: Actor, runId: string, id: string): RecordReportView {
    this.exercises.context(actor, 'technical', runId, true);
    const view = this.store.recordReports.get(id);
    if (!view || view.report.runId !== runId || view.report.ownerId !== actor.id)
      throw new AppError(403, 'FORBIDDEN', 'This account cannot read that record report.');
    return view;
  }
  capture(actor: Actor, runId: string, commandId: string): RecordReportView {
    return this.store.transaction(() => {
      const context = this.exercises.context(actor, 'technical', runId, true);
      const previous = this.store.recordReports.receipt(runId, commandId);
      if (previous) return this.get(actor, runId, previous);
      const { run, definition } = context;
      if (
        run.state !== 'completed' ||
        definition.kind !== 'generated-five-inject' ||
        definition.injects.length !== 5 ||
        definition.objectives?.length !== 3
      )
        conflict('A completed frozen five-position run is required.');
      if (this.list(actor, runId).length >= 100)
        conflict('The report snapshot limit has been reached.');
      const completion = this.store.outcomes.completion(runId);
      const releases = this.store.exercises.releases(runId);
      if (!completion || releases.length !== 5 || completion.closureIds.length !== 5)
        conflict('The completed run record is incomplete.');
      const id = 'report-' + randomUUID(),
        createdAt = new Date().toISOString();
      const report: RecordReport = {
        id,
        version: 'app-record-report-1',
        runId,
        ownerId: actor.id,
        createdAt,
        packageId: definition.id,
        packageRevisionId: definition.revisionId,
        packageHash: context.hash,
        objectives: decisions.map((key, index) => ({
          id: key,
          text: definition.objectives![index]!,
          positions: [],
        })),
        records: [],
        timeline: [],
      };
      const add = (
        recordId: string,
        kind: ReportRecord['kind'],
        fields: Record<string, string>,
        position: number | null = null,
        recordedAt: string | null = null,
        actorId: string | null = null,
        revision: number | null = null,
      ) => {
        const record: ReportRecord = {
          id: recordId,
          kind,
          position,
          recordedAt,
          actorId,
          revision,
          fields: Object.entries(fields).map(([label, value]) => ({
            label,
            value,
            citations: [recordId],
          })),
        };
        report.records.push(record);
        return record;
      };
      add(run.id, 'run', {
        state: run.state,
        revision: String(run.revision),
        packageId: run.packageId,
        packageRevisionId: run.packageRevisionId,
      });
      const packageRecord = add(definition.id, 'package', {
        title: definition.title,
        revision: definition.revisionId,
        contentHash: context.hash,
        grouping:
          'Injects are grouped by the next named decision point in this frozen package; this is a presentation mapping, not an assessment.',
      });
      for (const objective of report.objectives)
        packageRecord.fields.push({
          label: 'objective.' + objective.id,
          value: objective.text,
          citations: [definition.id],
        });
      for (const check of this.store.exercises.step0Checks(runId, true))
        add(
          check.id,
          'step0',
          {
            firstContact: check.firstContact,
            contactRoute: check.contactRoute,
            fallback: check.fallback,
            decision: check.decision,
            rationale: check.rationale,
            respondentIds: check.respondentIds.join(', '),
            packageHash: check.packageHash,
            assignmentHash: check.assignmentHash,
            runRevision: String(check.runRevision),
          },
          null,
          check.recordedAt,
          check.actorId,
        );
      const releasePositions = new Map<string, number>();
      const clocks = releasedExerciseClocks(releases);
      const responseIds = new Set<string>();
      for (const [index, inject] of definition.injects.entries()) {
        const position = index + 1;
        const release = releases.find((item) => item.injectId === inject.id);
        if (!release || release.injectRevisionId !== inject.revisionId)
          conflict('Released inject binding is inconsistent.');
        const decision = definition.injects
          .slice(index)
          .find((item) => item.decisionPoint)?.decisionPoint;
        const objective = report.objectives.find((item) => item.id === decision);
        if (!objective) conflict('The frozen objective mapping is unavailable.');
        objective.positions.push(position);
        releasePositions.set(release.id, position);
        add(
          release.id,
          'release',
          {
            title: release.title,
            injectId: release.injectId,
            injectRevisionId: release.injectRevisionId,
            approvalId: release.approvalId,
            recipientIds: release.recipientIds.join(', '),
            body: release.body,
            ...Object.fromEntries(
              (release.deliveries ?? []).map((delivery) => [
                'delivery.' + delivery.actorId,
                delivery.body,
              ]),
            ),
          },
          position,
          release.releasedAt,
        );
        const responses = this.store.outcomes.responses(release.id);
        for (const response of responses) {
          responseIds.add(response.id);
          add(
            response.id,
            'response',
            {
              actions: response.actions,
              rationale: response.rationale,
              informationRequests: response.informationRequests,
              teamId: response.teamId,
              runRevision: String(response.runRevision),
            },
            position,
            response.recordedAt,
            response.actorId,
            response.revision,
          );
        }
        const dispositions = this.store.outcomes.dispositions(release.id);
        for (const disposition of dispositions) {
          if (
            disposition.responseId &&
            !responses.some((response) => response.id === disposition.responseId)
          )
            conflict('A disposition references an absent response.');
          add(
            disposition.id,
            'disposition',
            {
              decision: disposition.decision,
              observations: disposition.observations,
              unresolvedGaps: disposition.unresolvedGaps,
              responseId: disposition.responseId ?? '[unanswered]',
              runRevision: String(disposition.runRevision),
            },
            position,
            disposition.recordedAt,
            disposition.actorId,
          );
        }
        const closure = this.store.outcomes.closure(release.id);
        if (
          !closure ||
          !dispositions.some((item) => item.id === closure.dispositionId) ||
          !completion.closureIds.includes(closure.id)
        )
          conflict('A closure or completion reference is unresolved.');
        add(
          closure.id,
          'closure',
          {
            dispositionId: closure.dispositionId,
            rationale: closure.rationale,
            runRevision: String(closure.runRevision),
          },
          position,
          closure.recordedAt,
          closure.actorId,
        );
        const clock = clocks.get(release.id)!;
        for (const record of report.records.filter((item) => item.position === position))
          record.fields.push({
            label: 'fictionalExerciseClock',
            value: clock.value,
            citations: [...new Set([record.id, ...clock.citations])],
          });
      }
      add(
        completion.id,
        'completion',
        {
          closureIds: completion.closureIds.join(', '),
          rationale: completion.rationale,
          runRevision: String(completion.runRevision),
        },
        null,
        completion.recordedAt,
        completion.actorId,
      );
      for (const debrief of this.store.debriefs.list(runId))
        add(
          debrief.id,
          'debrief',
          {
            basis:
              'Facilitator-recorded debrief after completion. Participant feedback is the facilitator summary, not verbatim and not evidence of executed actions.',
            // Blank notes are omitted rather than shown as quotable placeholders.
            ...Object.fromEntries(
              (
                [
                  ['participantFeedback', debrief.participantFeedback],
                  ['facilitatorObservations', debrief.facilitatorObservations],
                  ['exerciseDesignNotes', debrief.exerciseDesignNotes],
                ] as const
              ).filter(([, value]) => value.trim()),
            ),
            respondentIds: debrief.respondentIds.join(', ') || '[none]',
            runRevision: String(debrief.runRevision),
          },
          null,
          debrief.recordedAt,
          debrief.actorId,
        );
      for (const answer of this.store.clarifications.list(runId))
        add(
          answer.id,
          'clarification',
          {
            question: answer.question ?? '[question not recorded]',
            text: answer.text,
            claimIds: answer.claimIds.join(', '),
            knowledge: answer.unknown
              ? 'Information request; not known at this time.'
              : 'Facilitator-supplied answer citing confirmed-profile claims; not execution evidence.',
            releaseId: answer.releaseId,
            profileId: answer.profileId,
            profileRevisionId: answer.profileRevisionId,
            profileHash: answer.profileHash,
          },
          answer.position,
          answer.recordedAt,
          answer.actorId,
        );
      for (const event of this.store.exercises.activity(runId, true))
        add(
          'activity-' + event.sequence,
          'activity',
          {
            sequence: String(event.sequence),
            kind: event.kind,
            referenceId: event.referenceId ?? '[none]',
            runRevision: String(event.runRevision),
          },
          null,
          event.occurredAt,
          event.actorId,
        );

      const interpretations = new InterpretationService(this.store);
      let unreviewed = 0,
        stale = 0,
        reviewed = 0;
      for (const saved of this.store.interpretations
        .list(runId)
        .filter((item) => item.purpose === 'run' && item.ownerId === actor.id)) {
        if (!saved.review) {
          unreviewed++;
          continue;
        }
        const view = interpretations.get(actor, runId, saved.id);
        if (view.stale) {
          stale++;
          continue;
        }
        const review = saved.review,
          position = releasePositions.get(saved.releaseId);
        if (!position || !responseIds.has(saved.responseId))
          conflict('Reviewed interpretation source is unresolved.');
        if (review.decision === 'reject' ? review.output !== null : !review.output)
          conflict('Reviewed interpretation has inconsistent acceptance state.');
        if (review.output) validateInterpretation(review.output, saved.input);
        const record = add(
          saved.id,
          'interpretation',
          {
            reviewed: 'true',
            analysisPhase: 'Post-exercise analysis; not an exercise event.',
            decision: review.decision,
            notes: review.notes,
            responseId: saved.responseId,
            releaseId: saved.releaseId,
            assessmentStatus:
              review.decision === 'reject'
                ? 'Rejected; no assessment included.'
                : 'Facilitator-reviewed analysis; not evidence that actions were executed.',
          },
          position,
          review.recordedAt,
          review.actorId,
          saved.revision,
        );
        const evidence = (
          label: string,
          value: InterpretationOutput['actions'][number]['evidence'],
        ) => {
          if (value === 'no supporting text')
            record.fields.push({ label, value, citations: [record.id] });
          else
            for (const [index, quote] of value.entries())
              record.fields.push({
                label: label + '.' + (index + 1) + '.' + quote.field,
                value: quote.quote,
                citations: [record.id, saved.responseId],
              });
        };
        if (review.output) {
          for (const action of review.output.actions) {
            record.fields.push({
              label: 'assessment.' + action.actionKey,
              value: action.label,
              citations: [record.id],
            });
            evidence('evidence.' + action.actionKey, action.evidence);
          }
          evidence('decisionSummary', review.output.summary.decision);
          evidence('rationaleSummary', review.output.summary.rationale);
          for (const [index, risk] of review.output.risks.entries())
            evidence('flag.' + (index + 1) + '.' + risk.kind, risk.evidence);
        }
        reviewed++;
      }
      add(
        id,
        'boundary',
        {
          method:
            'Deterministic app-record snapshot. No AI drafting, strengths, areas for improvement or new exercise run.',
          clarificationLimit: this.store.clarifications.list(runId).length
            ? 'Only the facilitator clarification answers explicitly logged in this snapshot are evidence. Unlogged answers remain outside the app record.'
            : "This trial's clarification answers are outside the app record and are not included.",
          evidenceLimit:
            'Team statements and facilitator-reviewed interpretations are not evidence of executed actions or successful recovery.',
          snapshotPolicy:
            'Fixed at capture. Later interpretation reviews and debrief entries require a new snapshot; earlier reports do not change.',
          clockPolicy:
            'Fictional exercise clocks use each released simulation offset and the explicit fictional reference recorded in the releases, not app recording timestamps. Related responses, dispositions and closures inherit their release position, not a separately observed action time. Missing or conflicting clock evidence stays unavailable. Interpretation reviews are post-exercise analysis, not exercise events.',
          reviewedInterpretations: String(reviewed),
          excludedUnreviewedInterpretations: String(unreviewed),
          excludedStaleInterpretations: String(stale),
        },
        null,
        createdAt,
        actor.id,
      );
      report.timeline = report.records
        .filter(
          (record) => record.recordedAt && !['boundary', 'run', 'package'].includes(record.kind),
        )
        .sort((a, b) => a.recordedAt!.localeCompare(b.recordedAt!))
        .map((record) => record.id);
      this.store.recordReports.save(report, commandId);
      return this.get(actor, runId, id);
    });
  }
}
