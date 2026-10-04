import { useEffect, useRef, useState } from 'react';
import type { TSchema } from '@sinclair/typebox';
import {
  Activity,
  Check,
  CheckCircle2,
  Inbox,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import type { Actor } from '../contracts/profile.js';
import {
  RunListSchema,
  ReviewSchema,
  BriefingViewSchema,
  InboxSchema,
  RunActivitySchema,
  ApprovalSchema,
  ReleaseSchema,
  RunSchema,
  type BriefingView,
  type Inbox as InboxItems,
  type Review,
  type RunActivity,
  type RunList,
} from '../contracts/exercise.js';
import { ApiError, request } from './api.js';

type Pending = { schema: TSchema; path: string; body: Record<string, unknown> };
const date = (value: string) =>
  new Date(value).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' });
const labels: Record<RunActivity[number]['kind'], string> = {
  'briefing-confirmed': 'Briefing confirmed and run started',
  'inject-approved': 'Inject approved',
  'inject-released': 'Inject available in recipient inbox',
  'run-paused': 'Run paused',
  'run-resumed': 'Run resumed',
  'run-recovered': 'Restart detected; run paused',
};

export function ExerciseWorkspace({ actor }: { actor: Actor }) {
  const [runs, setRuns] = useState<RunList>([]);
  const [selected, setSelected] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [briefing, setBriefing] = useState<BriefingView | null>(null);
  const [inbox, setInbox] = useState<InboxItems>([]);
  const [events, setEvents] = useState<RunActivity>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const generation = useRef(0);

  async function reload(choice = selected) {
    const current = ++generation.current;
    setLoading(true);
    setError('');
    setReview(null);
    setBriefing(null);
    setInbox([]);
    setEvents([]);
    setAcknowledged(false);
    try {
      const lists = await Promise.all(
        ['technical', 'operational'].map((track) =>
          request(RunListSchema, `/api/tracks/${track}/runs`),
        ),
      );
      const all = lists.flat();
      if (current !== generation.current) return;
      setRuns(all);
      const run = all.find((item) => `${item.track}/${item.id}` === choice) ?? all[0];
      const next = run ? `${run.track}/${run.id}` : '';
      setSelected(next);
      if (!run) return;
      const root = `/api/tracks/${run.track}/runs/${run.id}`;
      if (actor.role === 'facilitator') {
        const [detail, activity] = await Promise.all([
          request(ReviewSchema, `${root}/review`),
          request(RunActivitySchema, `${root}/activity`),
        ]);
        if (current !== generation.current) return;
        setReview(detail);
        setEvents(activity);
        const inject = detail.package.injects.find((item) => item.id === detail.nextInject?.id);
        setRecipients(
          detail.approval?.recipientIds ??
            detail.members
              .filter(
                (member) =>
                  member.kind === 'participant' &&
                  member.roleId &&
                  inject?.recipientRoleIds.includes(member.roleId),
              )
              .map((member) => member.actorId),
        );
      } else {
        const [context, items] = await Promise.all([
          request(BriefingViewSchema, `${root}/briefing`),
          request(InboxSchema, `${root}/inbox`),
        ]);
        if (current !== generation.current) return;
        setBriefing(context);
        setInbox(items);
      }
    } catch (error) {
      if (current === generation.current)
        setError(error instanceof Error ? error.message : 'The exercise could not be loaded.');
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    return () => {
      generation.current++;
    };
  }, []);

  async function perform(command: Pending) {
    setBusy(true);
    setError('');
    try {
      await request(command.schema, command.path, command.body);
      setPending(null);
      await reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The result could not be confirmed.');
      if (error instanceof ApiError && error.status < 500) setPending(null);
    } finally {
      setBusy(false);
    }
  }

  function submit(schema: TSchema, action: string, body: Record<string, unknown> = {}) {
    if (!review || busy || pending) return;
    const command = {
      schema,
      path: `/api/tracks/${review.run.track}/runs/${review.run.id}/${action}`,
      body: {
        ...body,
        expectedRunRevision: review.run.revision,
        idempotencyKey: crypto.randomUUID(),
      },
    };
    setPending(command);
    void perform(command);
  }

  const disabled = busy || loading || !!pending;
  const inject = review?.package.injects.find((item) => item.id === review.nextInject?.id);
  const approvalMatches =
    !!review?.approval &&
    [...recipients].sort().join(',') === [...review.approval.recipientIds].sort().join(',');
  const isSkeleton = review?.package.kind === 'development-skeleton';

  return (
    <section className="exercise-workspace">
      <div className="page-heading">
        <div>
          <h1>{actor.role === 'participant' ? 'Participant workspace' : 'Exercises'}</h1>
          <p className="muted">Synthetic / Local workspace</p>
        </div>
        <button
          className="icon-button"
          title="Refresh exercises"
          aria-label="Refresh exercises"
          disabled={busy || loading}
          onClick={() => void reload()}
        >
          <RefreshCw size={19} />
        </button>
      </div>
      {error && (
        <div className="error" role="alert">
          <TriangleAlert size={18} />
          <span>{error}</span>
        </div>
      )}
      {pending && !busy && (
        <button className="secondary" onClick={() => void perform(pending)}>
          <RefreshCw size={16} />
          Retry last request
        </button>
      )}
      {runs.length > 0 && (
        <label className="exercise-picker">
          Exercise
          <select
            aria-label="Exercise"
            value={selected}
            disabled={disabled}
            onChange={(event) => void reload(event.target.value)}
          >
            {runs.map((run) => (
              <option key={run.id} value={`${run.track}/${run.id}`}>
                {run.track === 'technical' ? 'Technical' : 'Operational'}: {run.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {loading ? (
        <div className="empty-inline" role="status">
          <LoaderCircle className="spinner" size={24} />
          Loading exercise...
        </div>
      ) : runs.length === 0 && !error ? (
        <div className="empty-inline">
          <Inbox size={26} />
          <p>No exercises assigned.</p>
        </div>
      ) : null}
      {!loading && review && (
        <>
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
                <h2>Step 0: Starting arrangements</h2>
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
                        I have briefed the assigned roles, reviewed the gap dispositions and
                        confirmed that all actions are simulated.
                      </span>
                    </label>
                    <button
                      className="primary"
                      disabled={
                        disabled ||
                        !acknowledged ||
                        !review.profileConfirmed ||
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
                          disabled={disabled || !approvalMatches || review.run.state !== 'active'}
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
                      Prepared release sequence exhausted.
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
                      disabled={disabled}
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
      )}
      {!loading && briefing && (
        <>
          <section className="run-section">
            <div className="section-heading">
              <h2>Starting arrangements</h2>
              <span className="badge pending">{briefing.state}</span>
            </div>
            <p>{briefing.common}</p>
            <h3>{briefing.role.name}</h3>
            <p>{briefing.role.briefing}</p>
            <ul className="run-references">
              {briefing.references.map((reference) => (
                <li key={reference}>{reference}</li>
              ))}
            </ul>
          </section>
          <section className="run-section" aria-label="Released inbox">
            <h2>Released inbox</h2>
            {inbox.length === 0 ? (
              <div className="empty-inline">
                <Inbox size={26} />
                <p>No injects released to you.</p>
              </div>
            ) : (
              inbox.map((item) => (
                <article className="inbox-item" key={item.id}>
                  <h3>{item.title}</h3>
                  <time dateTime={item.releasedAt}>{date(item.releasedAt)}</time>
                  <p className="inject-body">{item.body}</p>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </section>
  );
}
