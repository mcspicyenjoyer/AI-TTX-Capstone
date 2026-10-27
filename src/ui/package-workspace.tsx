import { useEffect, useRef, useState } from 'react';
import { Check, LockKeyhole, RefreshCw, Save, Sparkles, X, RotateCcw } from 'lucide-react';
import {
  GenerationContextSchema,
  PackageDraftViewSchema,
  actionKinds,
  eventKinds,
  decisions,
  noteKinds,
  type GenerationContext,
  type PackageDraftView,
  type GeneratedPosition,
} from '../contracts/generation.js';
import { ApiError, request } from './api.js';

const label = (value: string) => value.replaceAll('-', ' ');
type Pending = { url: string; body: object };

export function PackageWorkspace({
  onSessionExpired,
  onGuardChange,
}: {
  onSessionExpired: () => void;
  onGuardChange: (guard: 'dirty' | 'pending' | null) => void;
}) {
  const [context, setContext] = useState<GenerationContext | null>(null);
  const [selected, setSelected] = useState('');
  const [view, setView] = useState<PackageDraftView | null>(null);
  const [positionIndex, setPositionIndex] = useState(0);
  const [edit, setEdit] = useState<GeneratedPosition | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState('');
  const current = useRef({ dirty, busy, pending, selected });
  current.current = { dirty, busy, pending, selected };
  function failure(error: unknown) {
    if (error instanceof ApiError && error.status === 401) onSessionExpired();
    else setError(error instanceof Error ? error.message : 'The package operation failed.');
  }
  function adopt(value: PackageDraftView) {
    setSelected(value.draft.id);
    setView(value);
    setEdit(value.draft.plan ? structuredClone(value.draft.plan.positions[positionIndex]!) : null);
    setDirty(false);
  }
  async function refresh() {
    try {
      const value = await request(GenerationContextSchema, '/api/packages');
      setContext(value);
      const chosen =
        value.drafts.find((item) => item.draft.id === current.current.selected) ??
        value.drafts.at(-1);
      if (chosen && !current.current.dirty && !current.current.pending) adopt(chosen);
    } catch (error) {
      failure(error);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    onGuardChange(pending ? 'pending' : dirty ? 'dirty' : null);
  }, [pending, dirty, onGuardChange]);
  useEffect(() => {
    if (!view || !['queued', 'running'].includes(view.draft.status)) return;
    const timer = window.setInterval(() => {
      if (
        !current.current.busy &&
        !current.current.dirty &&
        !current.current.pending &&
        document.visibilityState === 'visible'
      )
        void refresh();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [view?.draft.status]);
  useEffect(() => {
    setEdit(view?.draft.plan ? structuredClone(view.draft.plan.positions[positionIndex]!) : null);
  }, [positionIndex]);

  async function send(command: Pending) {
    setBusy(true);
    setError('');
    setPending(command);
    try {
      const result = await request(PackageDraftViewSchema, command.url, command.body);
      setPending(null);
      adopt(result);
      setContext((old) =>
        old
          ? {
              ...old,
              drafts: [...old.drafts.filter((item) => item.draft.id !== result.draft.id), result],
            }
          : old,
      );
    } catch (error) {
      // A transport failure may have committed. Keep the exact command for retry.
      if (error instanceof ApiError && error.status < 500) setPending(null);
      failure(error);
    } finally {
      setBusy(false);
    }
  }
  function review(decision: 'pending' | 'accepted' | 'rejected') {
    if (!view || !edit) return;
    void send({
      url: `/api/packages/${view.draft.id}/review`,
      body: {
        commandId: crypto.randomUUID(),
        expectedRevision: view.draft.revision,
        expectedHash: view.hash,
        position: edit,
        decision,
      },
    });
  }
  function change(patch: Partial<GeneratedPosition>) {
    if (edit) {
      setEdit({ ...edit, ...patch });
      setDirty(true);
    }
  }
  const disabled = busy || !!pending;
  const editable = view?.draft.status === 'review';
  const inject = view?.preview?.injects[positionIndex];
  const claims = context?.profile?.environment?.claims ?? [];
  const entities = context?.profile?.environment?.entities ?? [];
  const claimLabel = (id: string) => {
    const claim = claims.find((item) => item.id === id);
    return claim
      ? `${claim.status} / ${entities.find((item) => item.id === claim.subjectId)?.name} / ${claim.predicate} / ${claim.value ?? claim.explanation}`
      : id;
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Generated package</h1>
          <p className="muted">Teralqen / Five positions / Three player roles</p>
        </div>
        <button
          className="icon-button"
          aria-label="Refresh packages"
          title="Refresh packages"
          disabled={disabled || dirty}
          onClick={() => void refresh()}
        >
          <RefreshCw size={18} />
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {pending && (
        <div className="run-notice" role="status">
          <span>Save outcome not yet resolved.</span>
          <button className="secondary" disabled={busy} onClick={() => void send(pending)}>
            <RotateCcw size={16} />
            Retry exact request
          </button>
        </div>
      )}
      <section className="run-section package-binding">
        <h2>Confirmed profile binding</h2>
        {context?.target && !context.ready && <p className="muted">{context.reason}</p>}
        {context?.target ? (
          <>
            <p>
              {context.profile?.organisationName} / Reviewed content revision{' '}
              {context.target.reviewRevision}
            </p>
            <dl>
              <dt>Profile</dt>
              <dd>
                <code>{context.target.profileId}</code>
              </dd>
              <dt>Immutable revision</dt>
              <dd>
                <code>{context.target.profileRevisionId}</code>
              </dd>
              <dt>SHA-256</dt>
              <dd>
                <code>{context.target.profileHash}</code>
              </dd>
            </dl>
          </>
        ) : (
          <p className="muted">{context?.reason ?? 'Loading confirmed profile...'}</p>
        )}
        <button
          className="primary"
          disabled={
            !context?.ready ||
            disabled ||
            dirty ||
            (!!view && ['queued', 'running'].includes(view.draft.status))
          }
          onClick={() => {
            if (
              !context?.target ||
              !window.confirm(
                'Generate one synthetic package using the pinned confirmed profile and your local ChatGPT subscription? No full source documents will be sent.',
              )
            )
              return;
            const { profileId, profileRevisionId, profileHash } = context.target;
            void send({
              url: '/api/packages',
              body: { commandId: crypto.randomUUID(), profileId, profileRevisionId, profileHash },
            });
          }}
        >
          <Sparkles size={17} />
          Generate draft
        </button>
      </section>
      {!!context?.drafts.length && (
        <label className="package-picker">
          Package draft
          <select
            aria-label="Package draft"
            value={selected}
            disabled={disabled || dirty}
            onChange={(event) => {
              setPositionIndex(0);
              adopt(context.drafts.find((item) => item.draft.id === event.target.value)!);
            }}
          >
            {context.drafts.map((item) => (
              <option key={item.draft.id} value={item.draft.id}>
                {item.draft.createdAt} / {item.draft.status} / revision {item.draft.revision}
              </option>
            ))}
          </select>
        </label>
      )}
      {view && (
        <p className="run-notice" role="status">
          {view.draft.status === 'queued'
            ? 'Queued for the local package worker.'
            : view.draft.status === 'running'
              ? 'Generating a proposal. No participant delivery.'
              : view.draft.status === 'failed'
                ? view.draft.error
                : `${view.draft.status === 'frozen' ? 'Approved and frozen' : 'Facilitator review'} / ${view.draft.reviews.filter((item) => item === 'accepted').length} of 5 injects accepted`}
        </p>
      )}
      {view?.preview && (
        <>
          <section className="run-section">
            <h2>Scenario and objectives</h2>
            <p>{view.preview.scenario}</p>
            <ol>
              {view.preview.objectives!.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ol>
            <h3>Player roles</h3>
            {view.preview.roles.map((role) => (
              <details key={role.id}>
                <summary>{role.name}</summary>
                <p className="preserve-lines">{role.briefing}</p>
              </details>
            ))}
            <p>
              Facilitator:{' '}
              {view.preview
                .facilitatorSupplierIds!.map(
                  (id) => entities.find((entity) => entity.id === id)?.name,
                )
                .join('; ')}
            </p>
          </section>
          <div className="package-position-tabs" role="tablist" aria-label="Inject positions">
            {view.preview.injects.map((item, index) => (
              <button
                role="tab"
                aria-selected={index === positionIndex}
                key={item.id}
                disabled={disabled || dirty}
                onClick={() => setPositionIndex(index)}
              >
                {index + 1}. {item.title}
                <span>{view.draft.reviews[index]}</span>
              </button>
            ))}
          </div>
          {edit && inject && (
            <section className="run-section">
              <h2>{inject.title}</h2>
              <div className="package-editor-grid">
                <fieldset disabled={!editable || disabled}>
                  <legend>Inject specification</legend>
                  <label>
                    Elapsed minutes
                    <input
                      aria-label="Elapsed minutes"
                      type="number"
                      min="0"
                      max="240"
                      value={edit.elapsedMinutes}
                      onChange={(event) => change({ elapsedMinutes: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    Scenario event
                    <select
                      aria-label="Scenario event"
                      value={edit.event}
                      onChange={(event) =>
                        change({ event: event.target.value as GeneratedPosition['event'] })
                      }
                    >
                      {eventKinds.map((key) => (
                        <option key={key} value={key}>
                          {label(key)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Decision point
                    <select
                      aria-label="Decision point"
                      value={edit.decision ?? ''}
                      onChange={(event) =>
                        change({
                          decision: event.target.value
                            ? (event.target.value as NonNullable<GeneratedPosition['decision']>)
                            : null,
                        })
                      }
                    >
                      <option value="">Information update</option>
                      {decisions.map((key) => (
                        <option key={key} value={key}>
                          {label(key)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {edit.messages.map((message, index) => (
                    <div className="package-role-edit" key={message.roleId}>
                      <h3>
                        {view.preview!.roles.find((role) => role.id === message.roleId)!.name}
                      </h3>
                      <label>
                        Profile evidence
                        <select
                          multiple
                          size={5}
                          aria-label={`${message.roleId} evidence`}
                          value={message.evidence.map((item) => item.claimId)}
                          onChange={(event) => {
                            const ids = Array.from(
                              event.target.selectedOptions,
                              (option) => option.value,
                            );
                            change({
                              messages: edit.messages.map((m, i) =>
                                i !== index
                                  ? m
                                  : {
                                      ...m,
                                      evidence: ids.map((claimId) => ({
                                        claimId,
                                        status: claims.find((claim) => claim.id === claimId)!
                                          .status,
                                      })),
                                    },
                              ),
                            });
                          }}
                        >
                          {claims.map((claim) => (
                            <option key={claim.id} value={claim.id}>
                              {claimLabel(claim.id)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Questions
                        <select
                          multiple
                          size={4}
                          aria-label={`${message.roleId} questions`}
                          value={message.questions}
                          onChange={(event) =>
                            change({
                              messages: edit.messages.map((m, i) =>
                                i !== index
                                  ? m
                                  : {
                                      ...m,
                                      questions: Array.from(
                                        event.target.selectedOptions,
                                        (option) =>
                                          option.value as (typeof message.questions)[number],
                                      ),
                                    },
                              ),
                            })
                          }
                        >
                          {actionKinds.map((key) => (
                            <option key={key} value={key}>
                              {label(key)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                  {(['expectedActions', 'evaluationCriteria', 'facilitatorNotes'] as const).map(
                    (field) => (
                      <label key={field}>
                        {field === 'expectedActions'
                          ? 'Expected actions'
                          : field === 'evaluationCriteria'
                            ? 'Evaluation criteria'
                            : 'Facilitator notes'}
                        <select
                          multiple
                          size={5}
                          aria-label={field}
                          value={edit[field]}
                          onChange={(event) =>
                            change({
                              [field]: Array.from(
                                event.target.selectedOptions,
                                (option) => option.value,
                              ),
                            })
                          }
                        >
                          {(field === 'facilitatorNotes' ? noteKinds : actionKinds).map((key) => (
                            <option key={key} value={key}>
                              {label(key)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ),
                  )}
                </fieldset>
                <div>
                  <h3>Saved role-specific messages</h3>
                  {inject.roleBodies!.map((message) => (
                    <details key={message.roleId} open>
                      <summary>
                        {view.preview!.roles.find((role) => role.id === message.roleId)!.name}
                      </summary>
                      <p className="preserve-lines">{message.body}</p>
                    </details>
                  ))}
                  <h3>Expected actions</h3>
                  <ul>
                    {inject.expectedActions!.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <h3>Evaluation criteria</h3>
                  <ul>
                    {inject.evaluationCriteria!.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <h3>Facilitator notes</h3>
                  <p className="preserve-lines">{inject.facilitatorNotes}</p>
                </div>
              </div>
              {editable && (
                <div className="package-review-actions">
                  <button
                    className="secondary"
                    disabled={disabled || !dirty}
                    onClick={() => review('pending')}
                  >
                    <Save size={17} />
                    Save edit
                  </button>
                  <button
                    className="primary"
                    disabled={disabled || dirty}
                    onClick={() => review('accepted')}
                  >
                    <Check size={17} />
                    Accept inject
                  </button>
                  <button
                    className="secondary"
                    disabled={disabled}
                    onClick={() => review('rejected')}
                  >
                    <X size={17} />
                    Reject inject
                  </button>
                  {dirty && (
                    <button
                      className="icon-button"
                      aria-label="Discard inject edits"
                      title="Discard inject edits"
                      disabled={disabled}
                      onClick={() => {
                        setEdit(structuredClone(view.draft.plan!.positions[positionIndex]!));
                        setDirty(false);
                      }}
                    >
                      <RotateCcw size={17} />
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
          <section className="run-section">
            <h2>Package approval</h2>
            {view.draft.status === 'frozen' ? (
              <p>
                Frozen run: <code>{view.draft.runId}</code>. Awaiting Step 0 and release in
                Exercises.
              </p>
            ) : (
              <button
                className="primary"
                disabled={
                  disabled ||
                  dirty ||
                  view.draft.reviews.some((decision) => decision !== 'accepted')
                }
                onClick={() => {
                  if (
                    window.confirm(
                      'Approve and freeze this exact package? Further edits will not be permitted. Participants still require Step 0 and explicit per-position release.',
                    )
                  )
                    void send({
                      url: `/api/packages/${view.draft.id}/freeze`,
                      body: {
                        commandId: crypto.randomUUID(),
                        expectedRevision: view.draft.revision,
                        expectedHash: view.hash,
                      },
                    });
                }}
              >
                <LockKeyhole size={17} />
                Approve and freeze package
              </button>
            )}
          </section>
        </>
      )}
    </>
  );
}
