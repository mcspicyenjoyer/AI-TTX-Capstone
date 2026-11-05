import { useEffect, useRef, useState } from 'react';
import { Check, LockKeyhole, RefreshCw, Save, Sparkles, X, RotateCcw } from 'lucide-react';
import {
  GenerationContextSchema,
  PackageDraftViewSchema,
  actionKinds,
  artefactKinds,
  eventKinds,
  decisions,
  noteKinds,
  playerRoles,
  type GenerationContext,
  type PackageDraftView,
  type GeneratedPosition,
  type ReviewPreparation,
  type Storyline,
  type StorylineArtefact,
} from '../contracts/generation.js';
import { ApiError, request } from './api.js';
import { FamilyAssessmentView, ThreatPathwayView } from './threat-pathway.js';
import { ArtefactImageEditor, EvidenceImages } from './artefact-images.js';
import { exerciseText, optionLabel as label, sourceTitle } from './exercise-format.js';

type Pending = { url: string; body: object };
type PreparationEdit = Pick<ReviewPreparation, 'preparation' | 'roles' | 'storyline'>;
function preparationEdit(view: PackageDraftView): PreparationEdit {
  const { storyline } = view.draft.plan!;
  return {
    preparation: structuredClone(
      view.draft.preparation ?? { sharedEvidence: [], exercisedPlanSourceId: '' },
    ),
    roles: view.draft.plan!.roles.map(({ roleId, personIds, briefingEvidence }) => ({
      roleId,
      personIds: [...personIds],
      briefingEvidence: structuredClone(briefingEvidence),
    })),
    ...(storyline ? { storyline: structuredClone(storyline) } : {}),
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
  const imagePending = view?.imageRequests?.some((job) =>
    ['queued', 'running'].includes(job.status),
  );
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
    if (!view || (!['queued', 'running'].includes(view.draft.status) && !imagePending)) return;
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
  }, [view?.draft.status, imagePending]);
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
  function changeArtefact(index: number, patch: Partial<StorylineArtefact> | null) {
    if (!edit?.artefacts) return;
    change({
      artefacts:
        patch === null
          ? edit.artefacts.filter((_, i) => i !== index)
          : edit.artefacts.map((artefact, i) =>
              i === index ? { ...artefact, ...patch } : artefact,
            ),
    });
  }
  function changeStoryline(patch: Partial<Storyline>) {
    if (preparation?.storyline) {
      setPreparation({ ...preparation, storyline: { ...preparation.storyline, ...patch } });
      setPreparationDirty(true);
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
      ? `${label(claim.status)} / ${entities.find((item) => item.id === claim.subjectId)?.name} / ${label(claim.predicate)} / ${claim.value ?? claim.explanation}`
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
                'Generate one package using the pinned confirmed profile and your local ChatGPT subscription? No full source documents will be sent.',
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
                {item.draft.createdAt} / {label(item.draft.status)} / Revision {item.draft.revision}
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
            <p className="preserve-lines">{exerciseText(view.preview.scenario!)}</p>
            <ol>
              {view.preview.objectives!.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ol>
            {view.draft.plan?.storyline && (
              <>
                <h3>Background shared with players</h3>
                <ul>
                  {view.draft.plan.storyline.background.map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ul>
              </>
            )}
            <h3>Player roles</h3>
            {view.preview.roles.map((role) => (
              <details key={role.id}>
                <summary>
                  <strong>{role.name}</strong>
                </summary>
                <p className="preserve-lines">{exerciseText(role.briefing)}</p>
              </details>
            ))}
            <p>
              <strong>Facilitator:</strong>{' '}
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
                          {sourceTitle(source.title)} / {source.version}
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
                {preparation.storyline && (
                  <>
                    <label>
                      Threat actor
                      <input
                        aria-label="Threat actor"
                        maxLength={80}
                        value={preparation.storyline.threatActor.name}
                        onChange={(event) =>
                          changeStoryline({
                            threatActor: {
                              ...preparation.storyline!.threatActor,
                              name: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                    <label>
                      Threat actor profile (facilitator only)
                      <textarea
                        aria-label="Threat actor profile"
                        rows={3}
                        maxLength={500}
                        value={preparation.storyline.threatActor.profile}
                        onChange={(event) =>
                          changeStoryline({
                            threatActor: {
                              ...preparation.storyline!.threatActor,
                              profile: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                    {preparation.storyline.background.map((item, index) => (
                      <label key={'background-' + index}>
                        Background {index + 1} (shared with players)
                        <textarea
                          aria-label={`Background ${index + 1}`}
                          rows={2}
                          maxLength={400}
                          value={item}
                          onChange={(event) =>
                            changeStoryline({
                              background: preparation.storyline!.background.map((value, i) =>
                                i === index ? event.target.value : value,
                              ),
                            })
                          }
                        />
                      </label>
                    ))}
                  </>
                )}
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
                  <li key={reference}>{exerciseText(reference)}</li>
                ))}
              </ul>
              <h3>Preparation gaps</h3>
              <ul>
                {view.preview.briefing.gaps.map((gap) => (
                  <li key={gap.id}>
                    <strong>{label(gap.disposition)}:</strong> {gap.description}
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
                <span>{label(view.draft.reviews[index] ?? '')}</span>
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
                  {edit.artefacts?.map((artefact, index) => (
                    <div className="package-artefact-edit" key={'artefact-' + index}>
                      <h3>Story message {index + 1}</h3>
                      {editable && (
                        <ArtefactImageEditor
                          view={view}
                          position={positionIndex + 1}
                          index={index}
                          disabled={disabled || unsaved}
                          enabled={!!context?.ready}
                          send={send}
                        />
                      )}
                      <label>
                        Kind
                        <select
                          aria-label={`Story message ${index + 1} kind`}
                          value={artefact.kind}
                          onChange={(event) =>
                            changeArtefact(index, {
                              kind: event.target.value as StorylineArtefact['kind'],
                            })
                          }
                        >
                          {artefactKinds.map((key) => (
                            <option key={key} value={key}>
                              {label(key)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        From
                        <input
                          aria-label={`Story message ${index + 1} sender`}
                          maxLength={120}
                          value={artefact.sender}
                          onChange={(event) =>
                            changeArtefact(index, { sender: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Headline
                        <input
                          aria-label={`Story message ${index + 1} headline`}
                          maxLength={160}
                          value={artefact.headline}
                          onChange={(event) =>
                            changeArtefact(index, { headline: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Message
                        <textarea
                          aria-label={`Story message ${index + 1} text`}
                          rows={5}
                          maxLength={900}
                          value={artefact.body}
                          onChange={(event) => changeArtefact(index, { body: event.target.value })}
                        />
                      </label>
                      <label>
                        Received by
                        <select
                          multiple
                          size={3}
                          aria-label={`Story message ${index + 1} recipients`}
                          value={artefact.recipientRoleIds}
                          onChange={(event) =>
                            changeArtefact(index, {
                              recipientRoleIds: Array.from(
                                event.target.selectedOptions,
                                (option) => option.value as (typeof playerRoles)[number],
                              ),
                            })
                          }
                        >
                          {playerRoles.map((roleId) => (
                            <option key={roleId} value={roleId}>
                              {view.preview!.roles.find((role) => role.id === roleId)!.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => changeArtefact(index, null)}
                      >
                        <X size={16} />
                        Remove story message
                      </button>
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
                              {key === 'simulation-only' ? 'Exercise boundaries' : label(key)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ),
                  )}
                </fieldset>
                <div>
                  <h3>Saved role-specific messages</h3>
                  <EvidenceImages images={inject.images} />
                  {inject.roleBodies!.map((message) => (
                    <details key={message.roleId} open>
                      <summary>
                        <strong>
                          {view.preview!.roles.find((role) => role.id === message.roleId)!.name}
                        </strong>
                      </summary>
                      <p className="preserve-lines">{exerciseText(message.body)}</p>
                    </details>
                  ))}
                  <h3>Expected actions</h3>
                  <ul>
                    {inject.expectedActions!.map((item) => (
                      <li key={item}>{exerciseText(item)}</li>
                    ))}
                  </ul>
                  <h3>Evaluation criteria</h3>
                  <ul>
                    {inject.evaluationCriteria!.map((item) => (
                      <li key={item}>{exerciseText(item)}</li>
                    ))}
                  </ul>
                  <h3>Facilitator notes</h3>
                  <p className="preserve-lines">{exerciseText(inject.facilitatorNotes)}</p>
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
