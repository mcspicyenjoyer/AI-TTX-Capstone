import { Activity, Check, CheckCircle2, Pause, Play, Send, ShieldCheck } from 'lucide-react';
import { RunSchema, ApprovalSchema, ReleaseSchema } from '../contracts/exercise.js';
import type { ExerciseWorkspaceModel } from './use-exercise-workspace.js';
import { date, labels } from './exercise-format.js';
import { Step0Form } from './step0-form.js';

export function FacilitatorExercise({ vm }: { vm: ExerciseWorkspaceModel }) {
  const {
    review: current,
    isSkeleton,
    disabled,
    acknowledged,
    setAcknowledged,
    editing,
    submit,
    inject,
    recipients,
    setRecipients,
    approvalMatches,
    events,
  } = vm;
  if (!current) return null;
  const review = current;
  return (
    <>
      {' '}
      <div className="section-heading run-heading">
        <h2>{review.package.title}</h2>
        <span className={`badge ${review.run.state === 'active' ? 'confirmed' : 'pending'}`}>
          {isSkeleton ? 'Development / Not playable' : review.run.state}
        </span>
      </div>
      <p className="muted run-meta">
        Track: {review.run.track === 'technical' ? 'Technical' : 'Operational'}
        <span className="separator">/</span>
        {review.package.revisionId}
        <span className="separator">/</span>Run revision {review.run.revision}
        <span className="separator">/</span>
        {isSkeleton ? 'Development skeleton' : 'Engineering fixture'}
      </p>
      <div className="run-columns">
        <div>
          <section className="run-section" aria-label="Starting arrangements">
            <h2>
              {review.run.track === 'technical'
                ? 'Step 0: Starting arrangements'
                : 'Starting arrangements'}
            </h2>
            <Step0Form vm={vm} />
            <p>{review.package.briefing.common}</p>
            <ul className="run-references">
              {review.package.briefing.references.map((reference) => (
                <li key={reference}>{reference}</li>
              ))}
            </ul>
            <h3>Assigned roles</h3>
            <table className="run-members">
              <thead>
                <tr>
                  <th scope="col">Person</th>
                  <th scope="col">Exercise responsibility</th>
                </tr>
              </thead>
              <tbody>
                {review.members.map((member) => (
                  <tr key={member.actorId}>
                    <td>{member.displayName}</td>
                    <td>
                      {member.kind === 'facilitator'
                        ? 'Facilitator'
                        : review.package.roles.find((role) => role.id === member.roleId)?.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3>Preparation gaps</h3>
            {review.package.briefing.gaps.map((gap) => (
              <div className="run-gap" key={gap.id}>
                <strong>{gap.disposition.replaceAll('-', ' ')}</strong>
                <p>{gap.description}</p>
                <p className="muted">{gap.rationale}</p>
              </div>
            ))}
            {!isSkeleton && !review.preparation && (
              <>
                {!review.profileConfirmed && (
                  <p className="run-notice">Bound profile revision awaiting confirmation.</p>
                )}
                <label className="acknowledgement">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    disabled={disabled}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                  />
                  <span>
                    I have briefed the assigned roles, reviewed the gap dispositions and confirmed
                    that all actions are simulated.
                  </span>
                </label>
                <button
                  className="primary"
                  disabled={
                    disabled ||
                    editing.current ||
                    !acknowledged ||
                    !review.profileConfirmed ||
                    !review.step0Ready ||
                    review.run.state !== 'draft'
                  }
                  onClick={() =>
                    submit(RunSchema, 'start', {
                      packageHash: review.packageHash,
                      assignmentHash: review.assignmentHash,
                      acknowledgeBriefing: true,
                      acknowledgeGaps: true,
                      acknowledgeSimulation: true,
                    })
                  }
                >
                  <Play size={17} />
                  Confirm briefing and start
                </button>
              </>
            )}
            {review.preparation && (
              <p className="run-notice" role="status">
                <CheckCircle2 size={17} />
                Briefing recorded: {date(review.preparation.confirmedAt)}
              </p>
            )}
          </section>
          {!isSkeleton && (
            <section className="run-section" aria-label="Inject review">
              <div className="section-heading">
                <h2>Inject review</h2>
                <span className="muted">
                  {review.releases.length} / {review.package.injects.length} released
                </span>
              </div>
              {inject ? (
                <>
                  <h3>{inject.title}</h3>
                  <p className="inject-body">{inject.body}</p>
                  <details className="facilitator-note">
                    <summary>Facilitator notes</summary>
                    <p>{inject.facilitatorNotes}</p>
                  </details>
                  <fieldset className="recipient-list" disabled={disabled}>
                    <legend>Recipients</legend>
                    {review.members
                      .filter(
                        (member) =>
                          member.kind === 'participant' &&
                          member.roleId &&
                          inject.recipientRoleIds.includes(member.roleId),
                      )
                      .map((member) => (
                        <label key={member.actorId}>
                          <input
                            type="checkbox"
                            checked={recipients.includes(member.actorId)}
                            onChange={(event) =>
                              setRecipients(
                                event.target.checked
                                  ? [...recipients, member.actorId]
                                  : recipients.filter((id) => id !== member.actorId),
                              )
                            }
                          />
                          {member.displayName}
                        </label>
                      ))}
                  </fieldset>
                  <div className="run-actions">
                    <button
                      className="secondary"
                      disabled={
                        disabled ||
                        editing.current ||
                        !review.profileConfirmed ||
                        !review.step0Ready ||
                        !recipients.length ||
                        review.run.state !== 'active' ||
                        approvalMatches
                      }
                      onClick={() =>
                        submit(ApprovalSchema, 'approvals', {
                          packageHash: review.packageHash,
                          injectId: inject.id,
                          injectRevisionId: inject.revisionId,
                          contentHash: review.nextInject!.contentHash,
                          recipientIds: recipients,
                        })
                      }
                    >
                      <ShieldCheck size={17} />
                      Approve inject
                    </button>
                    <button
                      className="primary"
                      disabled={
                        disabled ||
                        editing.current ||
                        !review.profileConfirmed ||
                        !review.step0Ready ||
                        !approvalMatches ||
                        review.run.state !== 'active'
                      }
                      onClick={() =>
                        submit(ReleaseSchema, 'releases', { approvalId: review.approval!.id })
                      }
                    >
                      <Send size={17} />
                      Release to inbox
                    </button>
                  </div>
                  {approvalMatches && (
                    <p className="run-notice" role="status">
                      <Check size={17} />
                      Exact revision and recipients approved.
                    </p>
                  )}
                </>
              ) : (
                <p className="run-notice" role="status">
                  {review.releases.length === review.package.injects.length
                    ? 'Prepared release sequence exhausted.'
                    : 'Close the released position before the next inject.'}
                </p>
              )}
            </section>
          )}
          {review.releases.length > 0 && (
            <section className="run-section">
              <h2>Released injects</h2>
              {review.releases.map((release) => (
                <div className="release-row" key={release.id}>
                  <strong>{release.title}</strong>
                  <span>Available to {release.recipientIds.length} recipient(s)</span>
                  <time dateTime={release.releasedAt}>{date(release.releasedAt)}</time>
                </div>
              ))}
            </section>
          )}
        </div>
        <aside className="run-audit" aria-label="Exercise control and activity">
          {!isSkeleton && (
            <div className="run-actions">
              {review.run.state === 'active' && (
                <button
                  className="secondary"
                  disabled={disabled}
                  onClick={() => submit(RunSchema, 'pause')}
                >
                  <Pause size={17} />
                  Pause run
                </button>
              )}
              {review.run.state === 'paused' && (
                <button
                  className="secondary"
                  disabled={disabled || editing.current || !review.step0Ready}
                  onClick={() => submit(RunSchema, 'resume')}
                >
                  <Play size={17} />
                  Resume run
                </button>
              )}
            </div>
          )}
          <h2>Exercise activity</h2>
          {events.length === 0 ? (
            <p className="muted">No exercise activity recorded.</p>
          ) : (
            <ol className="run-events">
              {events.map((event) => (
                <li key={event.sequence}>
                  <Activity size={16} />
                  <div>
                    <strong>{labels[event.kind]}</strong>
                    <time dateTime={event.occurredAt}>{date(event.occurredAt)}</time>
                    <span className="muted">
                      #{event.sequence} / run revision {event.runRevision}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </>
  );
}
