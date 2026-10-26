import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Check,
  CheckCircle2,
  Download,
  FileSearch,
  FileUp,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  ClaimSchema,
  ProfileViewSchema,
  type Evidence,
  type ProfileView,
} from '../contracts/profile.js';
import {
  ConfirmIntakeResultSchema,
  IntakeListSchema,
  IntakeViewSchema,
  type Intake,
  type IntakeView,
  type UploadSource,
} from '../contracts/intake.js';
import { ApiError, request } from './api.js';

type Guard = 'dirty' | 'pending' | null;
type Command = { path: string; body: unknown; confirmation?: boolean };
const labels = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' };
const entityKinds = [
  'unclassified',
  'system',
  'service',
  'role',
  'third-party',
  'zone',
  'data',
] as const;
const statuses = ['fact', 'proposal', 'assumption', 'unknown', 'conflict'] as const;
const relations = new Set([
  'diagram-link',
  'connects-to',
  'depends-on',
  'owned-by',
  'supported-by',
  'backup-to',
  'identity-sync-to',
  'access-to',
  'monitored-by',
  'uses-data',
]);
const numeric = new Set([
  'quantity',
  'rto-hours',
  'rpo-hours',
  'recovery-priority',
  'backup-retention-days',
]);
const booleans = new Set(['mfa', 'backup-isolation', 'restore-tested']);
const predicates = ClaimSchema.properties.predicate.anyOf.map((item) => item.const);

export function IntakeWorkspace({
  onSessionExpired,
  onGuardChange,
}: {
  onSessionExpired: () => void;
  onGuardChange: (guard: Guard) => void;
}) {
  const [list, setList] = useState<
    { id: string; organisationName: string; revision: number; confirmed: boolean }[]
  >([]);
  const [view, setView] = useState<IntakeView | null>(null);
  const [edit, setEdit] = useState<Intake | null>(null);
  const [tab, setTab] = useState<'sources' | 'entities' | 'claims' | 'review'>('sources');
  const [sourceId, setSourceId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<Command | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rationale, setRationale] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [mode, setMode] = useState<'file' | 'guided'>('file');
  const [sourceKind, setSourceKind] = useState<UploadSource['kind']>('network');
  const [published, setPublished] = useState<ProfileView | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    void request(IntakeListSchema, '/api/intakes')
      .then((value) => {
        if (alive.current) setList(value);
      })
      .catch(fail);
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    onGuardChange(pending || reading ? 'pending' : dirty ? 'dirty' : null);
  }, [dirty, pending, reading, onGuardChange]);
  useEffect(() => {
    if (!view || dirty || pending || busy || reading) return;
    let current = true;
    const timer = window.setInterval(() => {
      void request(IntakeViewSchema, `/api/intakes/${view.draft.id}`)
        .then((next) => {
          if (current && alive.current) {
            if (next.draft.revision !== view.draft.revision) accept(next);
            else setView(next);
            setError('');
          }
        })
        .catch((cause) => {
          if (current) fail(cause);
        });
    }, 3000);
    return () => {
      current = false;
      window.clearInterval(timer);
    };
  }, [view?.draft.id, view?.draft.revision, dirty, pending, busy, reading]);
  useEffect(() => {
    const before = (event: BeforeUnloadEvent) => {
      if (dirty || pending || reading) event.preventDefault();
    };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [dirty, pending, reading]);
  function fail(cause: unknown) {
    if (!alive.current) return;
    if (cause instanceof ApiError && cause.status === 401) {
      onSessionExpired();
      return;
    }
    setError(cause instanceof Error ? cause.message : 'The operation failed.');
  }
  function accept(next: IntakeView) {
    setView(next);
    setEdit(structuredClone(next.draft));
    setDirty(false);
    setStale(false);
    setRationale('');
    setAcknowledged(false);
    setList((items) => [
      {
        id: next.draft.id,
        organisationName: next.draft.organisationName,
        revision: next.draft.revision,
        confirmed: next.draft.confirmedProfile !== null,
      },
      ...items.filter((item) => item.id !== next.draft.id),
    ]);
    if (!next.draft.sources.some((source) => source.id === sourceId)) {
      setSourceId(next.draft.sources[0]?.id ?? '');
      setUnitId(next.draft.sources[0]?.units[0]?.id ?? '');
    }
  }
  async function load(id: string) {
    if (pending || busy || reading) return;
    if (dirty && !window.confirm('Discard unsaved preparation changes?')) return;
    setBusy(true);
    setError('');
    setPublished(null);
    try {
      const next = await request(IntakeViewSchema, `/api/intakes/${id}`);
      if (alive.current) accept(next);
    } catch (cause) {
      fail(cause);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function send(command: Command) {
    if (busy) return;
    setPending(command);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (command.confirmation) {
        const result = await request(ConfirmIntakeResultSchema, command.path, command.body);
        if (!alive.current) return;
        accept(result.intake);
        setPublished(result.profile);
        setNotice('Profile snapshot confirmed.');
      } else {
        const result = await request(IntakeViewSchema, command.path, command.body);
        if (!alive.current) return;
        accept(result);
        setNotice(
          result.extractionJob?.status === 'queued'
            ? 'Extraction queued. Nothing is accepted automatically.'
            : 'Preparation saved.',
        );
      }
      setPending(null);
    } catch (cause) {
      if (!alive.current) return;
      if (
        cause instanceof ApiError &&
        [400, 401, 403, 404, 409, 413, 429, 502, 503].includes(cause.status)
      ) {
        setPending(null);
        if (cause.status === 409) setStale(true);
        if (cause.status === 403 || cause.status === 404) {
          setView(null);
          setEdit(null);
          setDirty(false);
          setSourceId('');
          setUnitId('');
        }
      }
      fail(cause);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  function command(action: string, extra: Record<string, unknown> = {}): Command {
    return {
      path: `/api/intakes/${view!.draft.id}/${action}`,
      body: {
        commandId: crypto.randomUUID(),
        expectedRevision: view!.draft.revision,
        expectedHash: view!.contentHash,
        ...extra,
      },
      confirmation: action === 'confirm',
    };
  }
  function update(change: (draft: Intake) => void) {
    if (!edit || pending || busy || reading || stale || edit.confirmedProfile) return;
    const next = structuredClone(edit);
    change(next);
    setEdit(next);
    setDirty(true);
    setAcknowledged(false);
    setNotice('');
  }
  const source = edit?.sources.find((item) => item.id === sourceId);
  const unit = source?.units.find((item) => item.id === unitId);
  const selectedEvidence = (): Evidence[] =>
    source && unit
      ? [{ sourceId: source.id, locator: unit.locator, excerpt: unit.text.slice(0, 1000) }]
      : [];
  const locked = busy || reading || !!pending || stale || !!edit?.confirmedProfile;
  const focusEvidence = (references: Evidence[]) => {
    const reference = references[0];
    if (!reference || !edit) return;
    const target = edit.sources.find((item) => item.id === reference.sourceId);
    setSourceId(reference.sourceId);
    setUnitId(target?.units.find((item) => item.locator === reference.locator)?.id ?? '');
  };
  function addEvidence(previous: Evidence[]): Evidence[] {
    const selected = selectedEvidence()[0];
    if (!selected) {
      setError('No source passage is selected.');
      return previous;
    }
    return previous.some(
      (item) => item.sourceId === selected.sourceId && item.locator === selected.locator,
    )
      ? previous
      : [...previous, selected];
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked || dirty) return;
    const form = new FormData(event.currentTarget);
    let format: UploadSource['format'] = 'guided';
    let content = String(form.get('guided') ?? '');
    const nextCommand = command('sources');
    if (mode === 'file') {
      const file = form.get('file');
      if (!(file instanceof File) || !file.size || file.size > 4 * 1024 * 1024) {
        setError('Choose a supported file no larger than 4 MiB.');
        return;
      }
      const name = file.name.toLowerCase();
      format = name.endsWith('.svg')
        ? 'drawio-svg'
        : name.endsWith('.md') || name.endsWith('.txt')
          ? 'text'
          : name.endsWith('.docx')
            ? 'docx'
            : name.endsWith('.pdf')
              ? 'pdf'
              : 'drawio';
      setReading(true);
      try {
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1]!);
          reader.onerror = () => reject(new Error('The source file could not be read.'));
          reader.readAsDataURL(file);
        });
      } catch (cause) {
        fail(cause);
        return;
      } finally {
        if (alive.current) setReading(false);
      }
      if (!alive.current) return;
    }
    nextCommand.body = {
      ...(nextCommand.body as Record<string, unknown>),
      title: String(form.get('title')),
      version: String(form.get('version')),
      kind: String(form.get('kind')),
      format,
      content,
      synthetic: true,
    };
    void send(nextCommand);
  }
  function evidenceButtons(references: Evidence[]) {
    return (
      <button
        type="button"
        className="icon-button"
        title="View source evidence"
        aria-label="View source evidence"
        onClick={() => focusEvidence(references)}
        disabled={!references.length}
      >
        <FileSearch size={17} />
      </button>
    );
  }
  async function download() {
    if (!edit?.confirmedProfile) return;
    try {
      const ref = edit.confirmedProfile;
      const snapshot =
        published ??
        (await request(
          ProfileViewSchema,
          `/api/profiles/${ref.profileId}/revisions/${ref.revisionId}`,
        ));
      if (!alive.current) return;
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }),
      );
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${ref.profileId}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      fail(cause);
    }
  }
  return (
    <section className="intake-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PREPARATION</p>
          <h1>Source intake</h1>
        </div>
        <span className="badge synthetic">Synthetic</span>
      </div>
      {error && (
        <div className="error" role="alert">
          <TriangleAlert size={18} />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <p className="run-notice" role="status">
          <CheckCircle2 size={17} />
          {notice}
        </p>
      )}
      {pending && !busy && (
        <div className="run-actions">
          <span>Request outcome not confirmed.</span>
          <button className="secondary" onClick={() => void send(pending)}>
            <RefreshCw size={16} />
            Retry same request
          </button>
        </div>
      )}
      <div className="intake-picker">
        <label>
          Preparation draft
          <select
            aria-label="Preparation draft"
            value={view?.draft.id ?? ''}
            disabled={busy || !!pending}
            onChange={(event) => void load(event.target.value)}
          >
            <option value="" disabled>
              Choose a draft
            </option>
            {list.map((item) => (
              <option value={item.id} key={item.id}>
                {item.organisationName} / revision {item.revision}
                {item.confirmed ? ' / confirmed' : ''}
              </option>
            ))}
          </select>
        </label>
        <button
          className="icon-button"
          title="Reload preparation"
          aria-label="Reload preparation"
          disabled={!view || busy || !!pending}
          onClick={() => void load(view!.draft.id)}
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <details className="intake-create" open={!view}>
        <summary>New preparation</summary>
        <form
          className="intake-create-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (dirty || pending || reading) return;
            const form = new FormData(event.currentTarget);
            void send({
              path: '/api/intakes',
              body: {
                commandId: crypto.randomUUID(),
                organisationName: String(form.get('name')),
                synthetic: true,
              },
            });
          }}
        >
          <label>
            Organisation name
            <input name="name" required maxLength={120} />
          </label>
          <label className="acknowledgement">
            <input type="checkbox" required />
            Synthetic organisation only
          </label>
          <button className="secondary" disabled={busy || reading || dirty || !!pending}>
            <Plus size={16} />
            Create draft
          </button>
        </form>
      </details>
      {view && edit && (
        <>
          <div className="intake-heading">
            <h2>{edit.organisationName}</h2>
            <span className={`badge ${edit.confirmedProfile ? 'confirmed' : 'pending'}`}>
              {edit.confirmedProfile ? 'Confirmed snapshot' : `Revision ${view.draft.revision}`}
            </span>
            {dirty && <span className="badge pending">Unsaved review</span>}
          </div>
          <div className="page-tabs" role="tablist" aria-label="Intake views">
            {(['sources', 'entities', 'claims', 'review'] as const).map((name) => (
              <button
                key={name}
                role="tab"
                aria-selected={tab === name}
                className={tab === name ? 'active' : ''}
                onClick={() => setTab(name)}
              >
                {name === 'sources'
                  ? `Sources (${edit.sources.length})`
                  : name === 'entities'
                    ? `Entities (${edit.entities.length})`
                    : name === 'claims'
                      ? `Claims (${edit.claims.length})`
                      : 'Review'}
              </button>
            ))}
          </div>
          <div className="intake-columns">
            <div className="intake-content">
              {tab === 'sources' && (
                <>
                  <form className="intake-form" onSubmit={(event) => void upload(event)}>
                    <fieldset disabled={locked || dirty}>
                      <legend>Add source</legend>
                      <div className="page-tabs" role="tablist" aria-label="Source mode">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={mode === 'file'}
                          className={mode === 'file' ? 'active' : ''}
                          onClick={() => {
                            setMode('file');
                            setSourceKind('network');
                          }}
                        >
                          Document
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={mode === 'guided'}
                          className={mode === 'guided' ? 'active' : ''}
                          onClick={() => {
                            setMode('guided');
                            setSourceKind('setup');
                          }}
                        >
                          Guided evidence
                        </button>
                      </div>
                      <label>
                        Source title
                        <input name="title" required maxLength={120} />
                      </label>
                      <div className="intake-pair">
                        <label>
                          Version
                          <input name="version" required maxLength={30} defaultValue="draft-1" />
                        </label>
                        <label>
                          Source type
                          <select
                            name="kind"
                            aria-label="Source type"
                            value={sourceKind}
                            onChange={(event) =>
                              setSourceKind(event.target.value as UploadSource['kind'])
                            }
                          >
                            <option value="network">Network diagram</option>
                            <option value="bcp">BCP</option>
                            <option value="bia">BIA</option>
                            <option value="drp">DRP</option>
                            <option value="setup">Guided context</option>
                          </select>
                        </label>
                      </div>
                      {mode === 'file' ? (
                        <label>
                          Source file
                          <input
                            name="file"
                            type="file"
                            required
                            accept=".drawio,.xml,.svg,.docx,.pdf,.md,.txt"
                          />
                        </label>
                      ) : (
                        <label>
                          Attributed source statement
                          <textarea name="guided" required maxLength={20000} rows={6} />
                        </label>
                      )}
                      <label className="acknowledgement">
                        <input type="checkbox" required />
                        This source contains synthetic information only.
                      </label>
                      <button className="primary" type="submit">
                        {busy ? (
                          <LoaderCircle className="spinner" size={17} />
                        ) : (
                          <FileUp size={17} />
                        )}
                        Import source
                      </button>
                    </fieldset>
                  </form>
                  {edit.sources.map((item) => (
                    <div className="intake-source-row" key={item.id}>
                      <strong>{item.title}</strong>
                      <span>
                        {item.version} / {item.format} / {item.units.length} passages
                      </span>
                      <code title={item.contentHash}>{item.contentHash.slice(0, 16)}</code>
                    </div>
                  ))}
                  <div className="run-actions">
                    <button
                      className="secondary"
                      disabled={
                        locked ||
                        dirty ||
                        !view.extractionAvailable ||
                        !edit.sources.length ||
                        ['queued', 'running'].includes(view.extractionJob?.status ?? '')
                      }
                      title={
                        view.extractionAvailable
                          ? 'Request candidate extraction'
                          : 'No live extraction provider connected'
                      }
                      onClick={() => {
                        if (
                          window.confirm(
                            `Send all ${edit.sources.length} synthetic sources to Codex using your ChatGPT subscription allowance? AI candidates require human review.`,
                          )
                        )
                          void send(command('extract'));
                      }}
                    >
                      <Sparkles size={16} />
                      Extract candidates
                    </button>
                    <span className="muted">
                      {view.extractionAvailable
                        ? 'ChatGPT subscription worker connected'
                        : 'AI unavailable / manual review active'}
                    </span>
                  </div>
                  {view.extractionJob && (
                    <div role="status" className="intake-source-row">
                      <strong>
                        {['queued', 'running'].includes(view.extractionJob.status) && (
                          <LoaderCircle size={16} />
                        )}{' '}
                        Extraction {view.extractionJob.status}
                      </strong>
                      <span>{view.extractionJob.message}</span>
                      <span className="muted">
                        Source revision {view.extractionJob.requestedRevision} /{' '}
                        {view.extractionJob.inputTokens ?? 'unavailable'} input tokens /{' '}
                        {view.extractionJob.outputTokens ?? 'unavailable'} output tokens
                      </span>
                    </div>
                  )}
                </>
              )}
              {tab === 'entities' && (
                <>
                  <div className="run-actions">
                    <button
                      className="secondary"
                      disabled={locked || !unit}
                      onClick={() =>
                        update((draft) => {
                          draft.entities.push({
                            id: `entity-${crypto.randomUUID()}`,
                            kind: 'unclassified',
                            name: unit!.text.split('\n')[0]!.slice(0, 160),
                            evidence: selectedEvidence(),
                            review: 'pending',
                          });
                        })
                      }
                    >
                      <Plus size={16} />
                      Add entity
                    </button>
                  </div>
                  {edit.entities.map((entity, index) => (
                    <div className="intake-entity" key={entity.id}>
                      <label>
                        Entity name
                        <input
                          aria-label={`Entity name ${index + 1}`}
                          maxLength={160}
                          value={entity.name}
                          disabled={locked}
                          onChange={(event) =>
                            update((draft) => {
                              draft.entities[index]!.name = event.target.value;
                            })
                          }
                        />
                      </label>
                      <label>
                        Kind
                        <select
                          aria-label={`Entity kind ${index + 1}`}
                          value={entity.kind}
                          disabled={locked}
                          onChange={(event) =>
                            update((draft) => {
                              draft.entities[index]!.kind = event.target
                                .value as typeof entity.kind;
                            })
                          }
                        >
                          {entityKinds.map((kind) => (
                            <option key={kind} value={kind}>
                              {kind}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Decision
                        <select
                          aria-label={`Entity decision ${index + 1}`}
                          value={entity.review}
                          disabled={locked}
                          onChange={(event) =>
                            update((draft) => {
                              draft.entities[index]!.review = event.target
                                .value as typeof entity.review;
                            })
                          }
                        >
                          {Object.entries(labels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {evidenceButtons(entity.evidence)}
                      <button
                        className="icon-button"
                        title="Add selected evidence"
                        aria-label={`Add evidence to entity ${index + 1}`}
                        disabled={locked || !unit || entity.evidence.length >= 10}
                        onClick={() =>
                          update((draft) => {
                            draft.entities[index]!.evidence = addEvidence(entity.evidence);
                          })
                        }
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </>
              )}
              {tab === 'claims' && (
                <>
                  <div className="run-actions">
                    <button
                      className="secondary"
                      disabled={locked || !edit.entities.length}
                      onClick={() =>
                        update((draft) => {
                          draft.claims.push({
                            id: `claim-${crypto.randomUUID()}`,
                            subjectId: draft.entities[0]!.id,
                            predicate: 'description',
                            objectId: null,
                            value: null,
                            status: 'unknown',
                            explanation: 'Not established by the supplied evidence.',
                            evidence: selectedEvidence(),
                            review: 'pending',
                          });
                        })
                      }
                    >
                      <Plus size={16} />
                      Add claim
                    </button>
                  </div>
                  {edit.claims.map((claim, index) => (
                    <details className="intake-claim" key={claim.id}>
                      <summary>
                        {edit.entities.find((item) => item.id === claim.subjectId)?.name} /{' '}
                        {claim.predicate}
                        <span className="badge pending">{labels[claim.review]}</span>
                      </summary>
                      <fieldset className="intake-form" disabled={locked}>
                        <label>
                          Subject
                          <select
                            aria-label={`Claim subject ${index + 1}`}
                            value={claim.subjectId}
                            onChange={(event) =>
                              update((draft) => {
                                draft.claims[index]!.subjectId = event.target.value;
                              })
                            }
                          >
                            {edit.entities.map((entity) => (
                              <option value={entity.id} key={entity.id}>
                                {entity.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Property
                          <select
                            aria-label={`Claim property ${index + 1}`}
                            value={claim.predicate}
                            onChange={(event) =>
                              update((draft) => {
                                const c = draft.claims[index]!;
                                c.predicate = event.target.value as typeof c.predicate;
                                c.status = 'unknown';
                                c.value = null;
                                c.objectId = null;
                              })
                            }
                          >
                            {predicates.map((predicate) => (
                              <option key={predicate} value={predicate}>
                                {predicate}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Knowledge status
                          <select
                            aria-label={`Claim status ${index + 1}`}
                            value={claim.status}
                            onChange={(event) =>
                              update((draft) => {
                                const c = draft.claims[index]!;
                                c.status = event.target.value as typeof c.status;
                                c.objectId = null;
                                c.value =
                                  ['unknown', 'conflict'].includes(c.status) ||
                                  relations.has(c.predicate)
                                    ? null
                                    : numeric.has(c.predicate)
                                      ? 0
                                      : booleans.has(c.predicate)
                                        ? false
                                        : '';
                              })
                            }
                          >
                            {statuses.map((status) => (
                              <option key={status} value={status}>
                                {status === 'fact' ? 'Sourced claim' : status}
                              </option>
                            ))}
                          </select>
                        </label>
                        {!['unknown', 'conflict'].includes(claim.status) &&
                          (relations.has(claim.predicate) ? (
                            <label>
                              Related entity
                              <select
                                aria-label={`Claim target ${index + 1}`}
                                value={claim.objectId ?? ''}
                                onChange={(event) =>
                                  update((draft) => {
                                    draft.claims[index]!.objectId = event.target.value || null;
                                  })
                                }
                              >
                                <option value="">Choose entity</option>
                                {edit.entities.map((entity) => (
                                  <option key={entity.id} value={entity.id}>
                                    {entity.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : booleans.has(claim.predicate) ? (
                            <label className="acknowledgement">
                              <input
                                type="checkbox"
                                aria-label={`Claim value ${index + 1}`}
                                checked={claim.value === true}
                                onChange={(event) =>
                                  update((draft) => {
                                    draft.claims[index]!.value = event.target.checked;
                                  })
                                }
                              />
                              Established in source
                            </label>
                          ) : (
                            <label>
                              Value
                              <input
                                aria-label={`Claim value ${index + 1}`}
                                type={numeric.has(claim.predicate) ? 'number' : 'text'}
                                min={0}
                                max={1000000}
                                step="any"
                                maxLength={1000}
                                value={String(claim.value ?? '')}
                                onChange={(event) =>
                                  update((draft) => {
                                    draft.claims[index]!.value = numeric.has(claim.predicate)
                                      ? event.target.value === ''
                                        ? null
                                        : Number(event.target.value)
                                      : event.target.value;
                                  })
                                }
                              />
                            </label>
                          ))}
                        <label>
                          Explanation
                          <textarea
                            aria-label={`Claim explanation ${index + 1}`}
                            maxLength={1000}
                            value={claim.explanation}
                            onChange={(event) =>
                              update((draft) => {
                                draft.claims[index]!.explanation = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label>
                          Decision
                          <select
                            aria-label={`Claim decision ${index + 1}`}
                            value={claim.review}
                            onChange={(event) =>
                              update((draft) => {
                                draft.claims[index]!.review = event.target
                                  .value as typeof claim.review;
                              })
                            }
                          >
                            {Object.entries(labels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          className="secondary"
                          disabled={!unit || claim.evidence.length >= 10}
                          onClick={() =>
                            update((draft) => {
                              draft.claims[index]!.evidence = addEvidence(claim.evidence);
                            })
                          }
                        >
                          <Plus size={16} />
                          Add selected evidence
                        </button>
                      </fieldset>
                      <ul className="intake-evidence">
                        {claim.evidence.map((reference, n) => (
                          <li key={`${reference.sourceId}-${n}`}>
                            <blockquote>{reference.excerpt}</blockquote>
                            <span>{reference.locator}</span>
                            {evidenceButtons([reference])}
                            <button
                              className="icon-button"
                              title="Remove evidence reference"
                              aria-label={`Remove evidence ${n + 1} from claim ${index + 1}`}
                              disabled={locked}
                              onClick={() =>
                                update((draft) => {
                                  draft.claims[index]!.evidence.splice(n, 1);
                                })
                              }
                            >
                              <X size={15} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </>
              )}
              {tab === 'review' && (
                <>
                  <h3>Outstanding context</h3>
                  <label>
                    Organisation name
                    <input
                      value={edit.organisationName}
                      maxLength={120}
                      disabled={locked}
                      onChange={(event) =>
                        update((draft) => {
                          draft.organisationName = event.target.value;
                        })
                      }
                    />
                  </label>
                  <ul className="run-references">
                    {view.questions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                  <p>
                    {edit.entities.filter((item) => item.review === 'accepted').length} accepted
                    entities / {edit.claims.filter((item) => item.review === 'accepted').length}{' '}
                    accepted claims /{' '}
                    {
                      [...edit.entities, ...edit.claims].filter((item) => item.review === 'pending')
                        .length
                    }{' '}
                    pending decisions
                  </p>
                  {!edit.confirmedProfile ? (
                    <>
                      <label className="acknowledgement">
                        <input
                          type="checkbox"
                          checked={acknowledged}
                          disabled={locked || dirty}
                          onChange={(event) => setAcknowledged(event.target.checked)}
                        />
                        I reviewed the source evidence, proposals, assumptions and remaining gaps.
                      </label>
                      <div className="run-actions">
                        <button
                          className="primary"
                          disabled={
                            locked ||
                            dirty ||
                            !acknowledged ||
                            [...edit.entities, ...edit.claims].some(
                              (item) => item.review === 'pending',
                            )
                          }
                          onClick={() =>
                            void send(command('confirm', { acknowledgeUncertainties: true }))
                          }
                        >
                          <Check size={16} />
                          Confirm profile snapshot
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="run-actions">
                      <button className="secondary" onClick={() => void download()}>
                        <Download size={16} />
                        Export confirmed profile
                      </button>
                    </div>
                  )}
                  <h3>Preparation history</h3>
                  <ol className="intake-history">
                    {view.events.map((event) => (
                      <li key={event.revision}>
                        <strong>
                          Revision {event.revision} / {event.action}
                        </strong>
                        <span>
                          {event.actorName} / {new Date(event.at).toLocaleString('en-SG')}
                        </span>
                        <p>{event.rationale}</p>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {dirty && (
                <form
                  className="intake-save intake-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void send(
                      command('review', {
                        organisationName: edit.organisationName,
                        entities: edit.entities,
                        claims: edit.claims,
                        rationale,
                      }),
                    );
                  }}
                >
                  <label>
                    Review rationale
                    <textarea
                      required
                      maxLength={1000}
                      value={rationale}
                      disabled={locked}
                      onChange={(event) => setRationale(event.target.value)}
                    />
                  </label>
                  <button className="primary" disabled={locked || !rationale.trim()}>
                    <Save size={16} />
                    Save review
                  </button>
                </form>
              )}
            </div>
            <aside className="intake-source-pane" aria-label="Source evidence">
              <h3>Source evidence</h3>
              <label>
                Evidence source
                <select
                  aria-label="Evidence source"
                  value={sourceId}
                  onChange={(event) => {
                    const next = edit.sources.find((item) => item.id === event.target.value);
                    setSourceId(event.target.value);
                    setUnitId(next?.units[0]?.id ?? '');
                  }}
                >
                  <option value="">Choose source</option>
                  {edit.sources.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Passage
                <select
                  aria-label="Evidence passage"
                  value={unitId}
                  onChange={(event) => setUnitId(event.target.value)}
                >
                  <option value="">Choose passage</option>
                  {source?.units.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.locator}
                    </option>
                  ))}
                </select>
              </label>
              {unit && (
                <>
                  <p className="muted">{unit.locator}</p>
                  <pre>{unit.text}</pre>
                </>
              )}
              {source?.warnings.map((warning) => (
                <p className="intake-warning" key={warning}>
                  {warning}
                </p>
              ))}
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
