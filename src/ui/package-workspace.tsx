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
  type ReviewPreparation,
} from '../contracts/generation.js';
import { ApiError, request } from './api.js';
import { FamilyAssessmentView, ThreatPathwayView } from './threat-pathway.js';

const label = (value: string) => value.replaceAll('-', ' ');
type Pending = { url: string; body: object };
type PreparationEdit = Pick<ReviewPreparation, 'preparation' | 'roles'>;
function preparationEdit(view: PackageDraftView): PreparationEdit {
  return {
    preparation: structuredClone(
      view.draft.preparation ?? { sharedEvidence: [], exercisedPlanSourceId: '' },
    ),
    roles: view.draft.plan!.roles.map(({ roleId, personIds, briefingEvidence }) => ({
      roleId,
      personIds: [...personIds],
      briefingEvidence: structuredClone(briefingEvidence),
    })),
  };
}

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
  const [preparation, setPreparation] = useState<PreparationEdit | null>(null);
  const [preparationDirty, setPreparationDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState('');
  const current = useRef({ dirty, busy, pending, selected });
  current.current = { dirty: dirty || preparationDirty, busy, pending, selected };
  function failure(error: unknown) {
    if (error instanceof ApiError && error.status === 401) onSessionExpired();
    else setError(error instanceof Error ? error.message : 'The package operation failed.');
  }
  function adopt(value: PackageDraftView) {
    setSelected(value.draft.id);
    setView(value);
    setEdit(value.draft.plan ? structuredClone(value.draft.plan.positions[positionIndex]!) : null);
    setDirty(false);
    setPreparation(value.draft.plan ? preparationEdit(value) : null);
    setPreparationDirty(false);
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
    onGuardChange(pending ? 'pending' : dirty || preparationDirty ? 'dirty' : null);
  }, [pending, dirty, preparationDirty, onGuardChange]);
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
  const unsaved = dirty || preparationDirty;
  const editable = view?.draft.status === 'review';
  const inject = view?.preview?.injects[positionIndex];
  const claims = context?.profile?.environment?.claims ?? [];
  const entities = context?.profile?.environment?.entities ?? [];
  const people = entities.filter((entity) => entity.kind === 'role');
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
          <p className="muted">
            {context?.profile?.organisationName ?? 'Confirmed profile'} / Five positions / Three
            player roles
          </p>
        </div>
        <button
          className="icon-button"
          aria-label="Refresh packages"
          title="Refresh packages"
          disabled={disabled || unsaved}
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
            {context.families.map((family) => (
              <FamilyAssessmentView key={family.familyId} family={family} />
            ))}
          </>
        ) : (
          <p className="muted">{context?.reason ?? 'Loading confirmed profile...'}</p>
        )}
        <button
          className="primary"
          disabled={
            !context?.ready ||
            !context.families.some((family) => family.applicable) ||
            disabled ||
            unsaved ||
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
            disabled={disabled || unsaved}
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
          {view.pathway && <ThreatPathwayView pathway={view.pathway} />}
          {preparation && (
            <section className="run-section package-preparation">
              <h2>Preparation</h2>
              <fieldset disabled={!editable || disabled || dirty}>
                <legend>Baseline references and role knowledge</legend>
                <label>
                  Plan being exercised
                  <select
                    aria-label="Plan being exercised"
                    value={preparation.preparation.exercisedPlanSourceId}
                    onChange={(event) => {
                      setPreparation({
                        ...preparation,
                        preparation: {
                          ...preparation.preparation,
                          exercisedPlanSourceId: event.target.value,
                        },
                      });
                      setPreparationDirty(true);
                    }}
                  >
                    <option value="">Select a confirmed source</option>
                    {context?.profile?.sources
                      .filter((source) => ['bcp', 'drp'].includes(source.kind))
                      .map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.title} / {source.version}
                        </option>
                      ))}
                  </select>
                </label>
                {preparation.roles.map((role) => {
                  const name = `${view.preview!.roles.find((item) => item.id === role.roleId)!.name} people`;
                  return (
                    <label key={'people-' + role.roleId}>
                      {name}
                      <select
                        multiple
                        className="people-select"
                        size={Math.min(5, Math.max(2, people.length))}
                        aria-label={name}
                        value={role.personIds}
                        onChange={(event) => {
                          const personIds = Array.from(
                            event.target.selectedOptions,
                            (option) => option.value,
                          );
                          setPreparation({
                            ...preparation,
                            roles: preparation.roles.map((item) =>
                              item.roleId === role.roleId ? { ...item, personIds } : item,
                            ),
                          });
                          setPreparationDirty(true);
                        }}
                      >
                        {people.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
                {[
                  {
                    id: 'shared',
                    name: 'Shared Step 0 references',
                    evidence: preparation.preparation.sharedEvidence,
                  },
                  ...preparation.roles.map((role) => ({
                    id: role.roleId,
                    name: `${view.preview!.roles.find((item) => item.id === role.roleId)!.name} briefing`,
                    evidence: role.briefingEvidence,
                  })),
                ].map((selection) => (
                  <label key={selection.id}>
                    {selection.name}
                    <select
                      multiple
                      size={5}
                      aria-label={selection.name}
                      value={selection.evidence.map((item) => item.claimId)}
                      onChange={(event) => {
                        const evidence = Array.from(event.target.selectedOptions, (option) => ({
                          claimId: option.value,
                          status: claims.find((claim) => claim.id === option.value)!.status,
                        }));
                        setPreparation(
                          selection.id === 'shared'
                            ? {
                                ...preparation,
                                preparation: {
                                  ...preparation.preparation,
                                  sharedEvidence: evidence,
                                },
                              }
                            : {
                                ...preparation,
                                roles: preparation.roles.map((role) =>
                                  role.roleId === selection.id
                                    ? { ...role, briefingEvidence: evidence }
                                    : role,
                                ),
                              },
                        );
                        setPreparationDirty(true);
                      }}
                    >
                      {claims.map((claim) => (
                        <option key={claim.id} value={claim.id}>
                          {claimLabel(claim.id)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </fieldset>
              {editable && (
                <div className="package-review-actions">
                  <button
                    className="secondary"
                    disabled={
                      disabled ||
                      dirty ||
                      !preparationDirty ||
                      !preparation.preparation.exercisedPlanSourceId ||
                      preparation.roles.some((role) => !role.personIds.length)
                    }
                    onClick={() =>
                      void send({
                        url: `/api/packages/${view.draft.id}/preparation`,
                        body: {
                          commandId: crypto.randomUUID(),
                          expectedRevision: view.draft.revision,
                          expectedHash: view.hash,
                          ...preparation,
                        },
                      })
                    }
                  >
                    <Save size={17} />
                    Save preparation
                  </button>
                  {preparationDirty && (
                    <button
                      className="icon-button"
                      title="Discard preparation edits"
                      aria-label="Discard preparation edits"
                      disabled={disabled}
                      onClick={() => {
                        setPreparation(preparationEdit(view));
                        setPreparationDirty(false);
                      }}
                    >
                      <RotateCcw size={17} />
                    </button>
                  )}
                </div>
              )}
              <h3>Saved shared references</h3>
              <ul>
                {view.preview.briefing.references.map((reference) => (
                  <li key={reference}>{reference}</li>
                ))}
              </ul>
              <h3>Preparation gaps</h3>
              <ul>
                {view.preview.briefing.gaps.map((gap) => (
                  <li key={gap.id}>
                    {gap.disposition}: {gap.description}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="package-position-tabs" role="tablist" aria-label="Inject positions">
            {view.preview.injects.map((item, index) => (
              <button
                role="tab"
                aria-selected={index === positionIndex}
                key={item.id}
                disabled={disabled || unsaved}
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
                <fieldset disabled={!editable || disabled || preparationDirty}>
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
                    disabled={disabled || preparationDirty || !dirty}
                    onClick={() => review('pending')}
                  >
                    <Save size={17} />
                    Save edit
                  </button>
                  <button
                    className="primary"
                    disabled={disabled || unsaved}
                    onClick={() => review('accepted')}
                  >
                    <Check size={17} />
                    Accept inject
                  </button>
                  <button
                    className="secondary"
                    disabled={disabled || preparationDirty}
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
              <>
                {view.coverage.length > 0 && (
                  <div className="run-notice" role="status" aria-label="Objective coverage">
                    <strong>Objective coverage must be resolved before freezing</strong>
                    <ul>
                      {view.coverage.map((problem) => (
                        <li key={problem}>{problem}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  className="primary"
                  disabled={
                    disabled ||
                    unsaved ||
                    view.coverage.length > 0 ||
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
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}
