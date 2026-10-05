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
  Step0CheckSchema,
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
  'step0-recorded': 'Team contact-route check recorded',
  'briefing-confirmed': 'Briefing confirmed and run started',
  'inject-approved': 'Inject approved',
  'inject-released': 'Inject available in recipient inbox',
  'run-paused': 'Run paused',
  'run-resumed': 'Run resumed',
  'run-recovered': 'Restart detected; run paused',
};

export function ExerciseWorkspace({
  actor,
  onSessionExpired,
}: {
  actor: Actor;
  onSessionExpired: () => void;
}) {
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
  const [refreshError, setRefreshError] = useState('');
  const [step0, setStep0] = useState({
    firstContact: '',
    contactRoute: '',
    fallback: '',
    rationale: '',
    decision: 'clarification-required',
  });
  const [respondents, setRespondents] = useState<string[]>([]);
  const generation = useRef(0);
  const binding = useRef('');
  const polling = useRef(false);
  const editing = useRef(false);
  const refresh = useRef<() => void>(() => {});

  async function reload(choice = selected, background = false) {
    const current = ++generation.current;
    if (background) polling.current = true;
    else {
      setLoading(true);
      setError('');
      setRefreshError('');
      setReview(null);
      setBriefing(null);
      setInbox([]);
      setEvents([]);
      setAcknowledged(false);
    }
    try {
      const lists = await Promise.all(
        ['technical', 'operational'].map((track) =>
          request(RunListSchema, `/api/tracks/${track}/runs`),
        ),
      );
      const all = lists.flat();
      if (current !== generation.current || (background && editing.current)) return;
      setRuns(all);
      const run = all.find((item) => `${item.track}/${item.id}` === choice) ?? all[0];
      const next = run ? `${run.track}/${run.id}` : '';
      setSelected(next);
      if (!run) {
        setReview(null);
        setBriefing(null);
        setInbox([]);
        setEvents([]);
        return;
      }
      const root = `/api/tracks/${run.track}/runs/${run.id}`;
      if (actor.role === 'facilitator') {
        const [detail, activity] = await Promise.all([
          request(ReviewSchema, `${root}/review`),
          request(RunActivitySchema, `${root}/activity`),
        ]);
        if (current !== generation.current || (background && editing.current)) return;
        setReview(detail);
        setEvents(activity);
        const inject = detail.package.injects.find((item) => item.id === detail.nextInject?.id);
        const nextBinding = `${run.id}/${detail.packageHash}/${detail.assignmentHash}/${inject?.id ?? ''}`;
        if (!background || binding.current !== nextBinding) {
          setAcknowledged(false);
          binding.current = nextBinding;
          setRespondents(
            detail.members
              .filter(
                (member) =>
                  member.kind === 'participant' &&
                  member.roleId &&
                  detail.package.injects[0]?.recipientRoleIds.includes(member.roleId),
              )
              .map((member) => member.actorId),
          );
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
        }
      } else {
        const [context, items] = await Promise.all([
          request(BriefingViewSchema, `${root}/briefing`),
          request(InboxSchema, `${root}/inbox`),
        ]);
        if (current !== generation.current) return;
        setBriefing(context);
        setInbox(items);
      }
      setRefreshError('');
    } catch (error) {
      if (current === generation.current) {
        if (error instanceof ApiError && error.status === 401) {
          generation.current++;
          onSessionExpired();
        } else {
          if (error instanceof ApiError && [403, 404].includes(error.status)) {
            setReview(null);
            setBriefing(null);
            setInbox([]);
            setEvents([]);
          }
          (background ? setRefreshError : setError)(
            error instanceof Error ? error.message : 'The exercise could not be loaded.',
          );
        }
      }
    } finally {
      if (background) polling.current = false;
      else if (current === generation.current) setLoading(false);
    }
  }

  refresh.current = () => {
    if (!busy && !loading && !pending && !polling.current && !editing.current && !document.hidden)
      void reload(selected, true);
  };

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => refresh.current(), 5000);
    const visible = () => refresh.current();
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    return () => {
      generation.current++;
      window.clearInterval(timer);
      window.removeEventListener('focus', visible);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);

  async function perform(command: Pending) {
    generation.current++;
    setBusy(true);
    setError('');
    try {
      await request(command.schema, command.path, command.body);
      setPending(null);
      if (command.path.endsWith('/step0')) {
        editing.current = false;
        setStep0({
          firstContact: '',
          contactRoute: '',
          fallback: '',
          rationale: '',
          decision: 'clarification-required',
        });
      }
      await reload();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
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

  function editStep0(field: keyof typeof step0, value: string) {
    editing.current = true;
    setStep0((previous) => ({ ...previous, [field]: value }));
  }

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
          disabled={busy || loading || editing.current}
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
      {refreshError && (
        <div className="error" role="alert">
          <TriangleAlert size={18} />
          <span>{refreshError}</span>
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
            onChange={(event) => {
              editing.current = false;
              setStep0({
                firstContact: '',
                contactRoute: '',
                fallback: '',
                rationale: '',
                decision: 'clarification-required',
              });
              void reload(event.target.value);
            }}
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
                {!isSkeleton && (
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
                                      review.members.find((member) => member.actorId === id)
                                        ?.displayName ?? id,
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
                    {['draft', 'paused'].includes(review.run.state) && (
                      <fieldset className="step0-form" disabled={disabled}>
                        <legend>Record the team's oral answers</legend>
                        <div className="recipient-list">
                          {review.members
                            .filter((member) => member.kind === 'participant')
                            .map((member) => (
                              <label key={member.actorId}>
                                <input
                                  type="checkbox"
                                  checked={respondents.includes(member.actorId)}
                                  onChange={(event) => {
                                    editing.current = true;
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
                              !review.profileConfirmed ||
                              !respondents.length ||
                              [
                                step0.firstContact,
                                step0.contactRoute,
                                step0.fallback,
                                step0.rationale,
                              ].some((value) => !value.trim())
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
                          {editing.current && (
                            <button
                              className="secondary"
                              disabled={disabled}
                              onClick={() => {
                                editing.current = false;
                                setStep0({
                                  firstContact: '',
                                  contactRoute: '',
                                  fallback: '',
                                  rationale: '',
                                  decision: 'clarification-required',
                                });
                                void reload();
                              }}
                            >
                              Discard unsaved check
                            </button>
                          )}
                        </div>
                      </fieldset>
                    )}
                    <h3>Prepared briefing</h3>
                  </>
                )}
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
                      disabled={disabled || !review.step0Ready}
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
              <span className={`badge ${briefing.state === 'active' ? 'confirmed' : 'pending'}`}>
                {briefing.state}
              </span>
            </div>
            {briefing.step0Status !== 'ready' && (
              <p className="run-notice">Step 0: {briefing.step0Status.replaceAll('-', ' ')}</p>
            )}
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
