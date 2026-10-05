import { Check } from 'lucide-react';
import { Step0CheckSchema } from '../contracts/exercise.js';
import type { ExerciseWorkspaceModel } from './use-exercise-workspace.js';
import { date } from './exercise-format.js';

export function Step0Form({ vm }: { vm: ExerciseWorkspaceModel }) {
  const {
    review: current,
    isSkeleton,
    editing,
    disabled,
    draftMatches,
    step0OutcomeUnknown,
    pending,
    draftRevision,
    draftContext,
    setDraftContext,
    respondents,
    beginStep0Edit,
    setRespondents,
    step0,
    editStep0,
    canRecordStep0,
    submit,
  } = vm;
  if (!current) return null;
  const review = current;
  return (
    <>
      {' '}
      {review.run.track === 'technical' && !isSkeleton && (
        <>
          <h3>Team contact-route check</h3>
          <p className="run-notice">
            {review.step0Ready
              ? 'Current Ready decision recorded.'
              : 'A current Ready decision is required before play.'}
          </p>
          {review.step0Checks.length > 0 && (
            <ol className="step0-history">
              {review.step0Checks.map((check) => (
                <li key={check.id}>
                  <details>
                    <summary>
                      {check.decision.replaceAll('-', ' ')} / {date(check.recordedAt)}
                    </summary>
                    <p>
                      <strong>Respondents:</strong>{' '}
                      {check.respondentIds
                        .map(
                          (id) =>
                            review.members.find((member) => member.actorId === id)?.displayName ??
                            id,
                        )
                        .join(', ')}
                    </p>
                    <p>
                      <strong>First contact:</strong> {check.firstContact}
                    </p>
                    <p>
                      <strong>Contact route:</strong> {check.contactRoute}
                    </p>
                    <p>
                      <strong>Fallback:</strong> {check.fallback}
                    </p>
                    <p>
                      <strong>Facilitator decision:</strong> {check.rationale}
                    </p>
                  </details>
                </li>
              ))}
            </ol>
          )}
          {(['draft', 'paused'].includes(review.run.state) || editing.current) && (
            <fieldset className="step0-form" disabled={disabled || !draftMatches}>
              <legend>Record the team's oral answers</legend>
              {editing.current && (
                <p className="run-notice" role="status">
                  {step0OutcomeUnknown
                    ? 'An earlier Step 0 request has an unconfirmed outcome. Review saved history; this local draft cannot be submitted as a replacement.'
                    : pending?.path.endsWith('/step0')
                      ? 'Step 0 request awaiting confirmation.'
                      : 'Unsaved contact-route check. It has not changed the recorded decision.'}{' '}
                  Original run revision: {draftRevision.current}. Current run revision:{' '}
                  {review.run.revision}.
                </p>
              )}
              {!draftMatches ? (
                <p className="run-notice" role="status">
                  The package or participants changed. This draft belongs to the earlier context;
                  discard it before recording a new check.
                </p>
              ) : !['draft', 'paused'].includes(review.run.state) ? (
                <p className="run-notice" role="status">
                  The run is {review.run.state}. The draft is retained but cannot be recorded in
                  this state.
                </p>
              ) : draftContext === 'stale' ? (
                <p className="run-notice" role="status">
                  Refresh the context before reviewing and resubmitting this draft.
                </p>
              ) : ['review', 'confirmed'].includes(draftContext) ? (
                <label className="acknowledgement">
                  <input
                    type="checkbox"
                    checked={draftContext === 'confirmed'}
                    onChange={(event) =>
                      setDraftContext(event.target.checked ? 'confirmed' : 'review')
                    }
                  />
                  <span>I have reviewed this draft against the refreshed context.</span>
                </label>
              ) : null}
              <div className="recipient-list">
                {review.members
                  .filter((member) => member.kind === 'participant')
                  .map((member) => (
                    <label key={member.actorId}>
                      <input
                        type="checkbox"
                        checked={respondents.includes(member.actorId)}
                        onChange={(event) => {
                          beginStep0Edit();
                          setRespondents(
                            event.target.checked
                              ? [...respondents, member.actorId]
                              : respondents.filter((id) => id !== member.actorId),
                          );
                        }}
                      />
                      {member.displayName}
                    </label>
                  ))}
              </div>
              <label>
                Who would the team contact first?
                <textarea
                  aria-label="Who would the team contact first?"
                  value={step0.firstContact}
                  maxLength={1500}
                  onChange={(event) => editStep0('firstContact', event.target.value)}
                />
              </label>
              <label>
                How would they contact them or find the details?
                <textarea
                  aria-label="How would they contact them or find the details?"
                  value={step0.contactRoute}
                  maxLength={1500}
                  onChange={(event) => editStep0('contactRoute', event.target.value)}
                />
              </label>
              <label>
                What is their fallback or escalation route?
                <textarea
                  aria-label="What is their fallback or escalation route?"
                  value={step0.fallback}
                  maxLength={1500}
                  onChange={(event) => editStep0('fallback', event.target.value)}
                />
              </label>
              <label>
                Facilitator decision
                <select
                  aria-label="Facilitator decision"
                  value={step0.decision}
                  onChange={(event) => editStep0('decision', event.target.value)}
                >
                  <option value="clarification-required">Clarification required</option>
                  <option value="hold">Hold</option>
                  <option value="ready">Ready</option>
                </select>
              </label>
              <label>
                Decision rationale and gap disposition
                <textarea
                  aria-label="Decision rationale and gap disposition"
                  value={step0.rationale}
                  maxLength={2000}
                  onChange={(event) => editStep0('rationale', event.target.value)}
                />
              </label>
              <div className="run-actions">
                <button
                  className="secondary"
                  disabled={
                    disabled ||
                    !canRecordStep0 ||
                    !review.profileConfirmed ||
                    !respondents.length ||
                    [step0.firstContact, step0.contactRoute, step0.fallback, step0.rationale].some(
                      (value) => !value.trim(),
                    )
                  }
                  onClick={() =>
                    submit(Step0CheckSchema, 'step0', {
                      ...step0,
                      respondentIds: respondents,
                      packageHash: review.packageHash,
                      assignmentHash: review.assignmentHash,
                    })
                  }
                >
                  <Check size={17} />
                  Record Step 0 decision
                </button>
              </div>
            </fieldset>
          )}
          <h3>Prepared briefing</h3>
        </>
      )}
    </>
  );
}
