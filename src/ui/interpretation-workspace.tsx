import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, Plus, RefreshCw, Save, Sparkles, Trash2, X } from 'lucide-react';
import type { Static } from '@sinclair/typebox';
import {
  InterpretationListSchema,
  InterpretationViewSchema,
  type InterpretationView,
  type InterpretationOutput,
  type ActionAssessment,
} from '../contracts/interpretation.js';
import { ApiError, request } from './api.js';
import { date } from './exercise-format.js';
import { useUnsavedGuard } from './unsaved-guard.js';

type Pending = { path: string; body: Record<string, unknown> };
export function useInterpretations(enabled: boolean, root: string, onSessionExpired: () => void) {
  const [view, setView] = useState<Static<typeof InterpretationListSchema> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const generation = useRef(0),
    polling = useRef(false),
    refresh = useRef(() => {});
  async function reload() {
    if (!enabled) return;
    const current = ++generation.current;
    polling.current = true;
    try {
      const next = await request(InterpretationListSchema, root + '/interpretations');
      if (current !== generation.current) return;
      setView(next);
      setError('');
    } catch (cause) {
      if (current !== generation.current) return;
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) setView(null);
      setError(cause instanceof Error ? cause.message : 'Interpretations unavailable.');
    } finally {
      polling.current = false;
    }
  }
  async function perform(command: Pending) {
    const current = ++generation.current;
    setBusy(true);
    setPending(command);
    setError('');
    try {
      await request(InterpretationViewSchema, command.path, command.body);
      if (current !== generation.current) return;
      setPending(null);
      await reload();
    } catch (cause) {
      if (current !== generation.current) return;
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      if (cause instanceof ApiError && cause.status < 500) setPending(null);
      setError(cause instanceof Error ? cause.message : 'Request outcome unconfirmed.');
    } finally {
      setBusy(false);
    }
  }
  function submit(suffix: string, body: Record<string, unknown>) {
    if (busy || pending) return;
    void perform({
      path: root + '/interpretations' + suffix,
      body: { ...body, commandId: crypto.randomUUID() },
    });
  }
  refresh.current = () => {
    if (!busy && !pending && !polling.current && !document.hidden) void reload();
  };
  useEffect(() => {
    if (!enabled) return;
    void reload();
    const timer = window.setInterval(() => refresh.current(), 5000);
    return () => {
      generation.current++;
      window.clearInterval(timer);
    };
  }, []);
  return { view, error, busy, pending, submit, reload, perform };
}
type Model = ReturnType<typeof useInterpretations>;
type Evidence = ActionAssessment['evidence'];

function EvidenceEditor({
  label,
  value,
  onChange,
  maximum = 3,
  length = 3000,
}: {
  label: string;
  value: Evidence;
  onChange: (value: Evidence) => void;
  maximum?: number;
  length?: number;
}) {
  const quotes = value === 'no supporting text' ? [] : value;
  return (
    <div className="interpretation-evidence">
      <span className="field-label">{label}</span>
      {!quotes.length && <p className="muted">No supporting text</p>}
      {quotes.map((quote, index) => (
        <div className="interpretation-quote" key={index}>
          <select
            aria-label={label + ' field ' + (index + 1)}
            value={quote.field}
            onChange={(event) =>
              onChange(
                quotes.map((item, i) =>
                  i === index ? { ...item, field: event.target.value as typeof quote.field } : item,
                ),
              )
            }
          >
            <option value="actions">Actions</option>
            <option value="rationale">Rationale</option>
            <option value="informationRequests">Information requests</option>
          </select>
          <textarea
            aria-label={label + ' quote ' + (index + 1)}
            maxLength={length}
            rows={2}
            value={quote.quote}
            onChange={(event) =>
              onChange(
                quotes.map((item, i) =>
                  i === index ? { ...item, quote: event.target.value } : item,
                ),
              )
            }
          />
          <button
            type="button"
            className="icon-button"
            title="Remove quote"
            aria-label={label + ' remove quote ' + (index + 1)}
            onClick={() => {
              const next = quotes.filter((_, i) => i !== index);
              onChange(next.length ? next : 'no supporting text');
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="icon-button"
        title="Add quote"
        aria-label={label + ' add quote'}
        disabled={quotes.length >= maximum}
        onClick={() => onChange([...quotes, { field: 'actions', quote: '' }])}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function AssessmentReview({
  view,
  disabled,
  submit,
}: {
  view: InterpretationView;
  disabled: boolean;
  submit: Model['submit'];
}) {
  const record = view.record;
  const initial: InterpretationOutput = record.review?.output ??
    record.proposal ?? {
      actions: record.input.expectedActions.map((action) => ({
        actionKey: action.key,
        label: 'missing',
        evidence: 'no supporting text',
      })),
      summary: { decision: 'no supporting text', rationale: 'no supporting text' },
      risks: [],
      recommendedFollowUpId: null,
    };
  const [output, setOutput] = useState<InterpretationOutput>(structuredClone(initial));
  const [notes, setNotes] = useState('');
  const changed = JSON.stringify(output) !== JSON.stringify(initial);
  useUnsavedGuard(changed || !!notes.trim());
  const matchesProposal = JSON.stringify(output) === JSON.stringify(record.proposal);
  const finish = (decision: 'accept' | 'edit' | 'reject' | 'override') =>
    submit('/' + record.id + '/review', {
      expectedRevision: record.revision,
      expectedHash: view.hash,
      decision,
      notes,
      output: ['edit', 'override'].includes(decision) ? output : null,
    });
  return (
    <fieldset className="interpretation-editor" disabled={disabled || view.stale}>
      <legend>Facilitator assessment</legend>
      {output.actions.map((action, index) => (
        <div className="interpretation-action" key={action.actionKey}>
          <label>
            {record.input.expectedActions.find((item) => item.key === action.actionKey)?.text}
            <select
              aria-label={action.actionKey + ' coverage'}
              value={action.label}
              onChange={(event) =>
                setOutput({
                  ...output,
                  actions: output.actions.map((item, i) =>
                    i === index
                      ? { ...item, label: event.target.value as typeof action.label }
                      : item,
                  ),
                })
              }
            >
              {['present', 'partial', 'missing', 'unclear'].map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <EvidenceEditor
            label={action.actionKey}
            value={action.evidence}
            onChange={(evidence) =>
              setOutput({
                ...output,
                actions: output.actions.map((item, i) =>
                  i === index ? { ...item, evidence } : item,
                ),
              })
            }
          />
        </div>
      ))}
      <details>
        <summary>Team statements and flagged claims</summary>
        <p className="muted">Attributed team statements / execution not verified</p>
        <EvidenceEditor
          label="Decision statement"
          value={output.summary.decision}
          maximum={2}
          length={500}
          onChange={(decision) =>
            setOutput({ ...output, summary: { ...output.summary, decision } })
          }
        />
        <EvidenceEditor
          label="Rationale statement"
          value={output.summary.rationale}
          maximum={2}
          length={500}
          onChange={(rationale) =>
            setOutput({ ...output, summary: { ...output.summary, rationale } })
          }
        />
        {output.risks.map((risk, index) => (
          <div className="interpretation-action" key={index}>
            <label>
              Flag {index + 1}
              <select
                value={risk.kind}
                onChange={(event) =>
                  setOutput({
                    ...output,
                    risks: output.risks.map((item, i) =>
                      i === index
                        ? { ...item, kind: event.target.value as typeof risk.kind }
                        : item,
                    ),
                  })
                }
              >
                <option value="unverified-team-claim">Unverified team claim</option>
                <option value="unresolved-disagreement">Unresolved disagreement</option>
                <option value="ai-directed-instruction">AI-directed instruction</option>
              </select>
            </label>
            <EvidenceEditor
              label={'Flag ' + (index + 1)}
              value={risk.evidence}
              onChange={(evidence) =>
                setOutput({
                  ...output,
                  risks: output.risks.map((item, i) =>
                    i === index
                      ? { ...item, evidence: evidence === 'no supporting text' ? [] : evidence }
                      : item,
                  ),
                })
              }
            />
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setOutput({ ...output, risks: output.risks.filter((_, i) => i !== index) })
              }
            >
              <Trash2 size={16} />
              Remove flag
            </button>
          </div>
        ))}
        <button
          type="button"
          className="secondary"
          disabled={output.risks.length >= 6}
          onClick={() =>
            setOutput({
              ...output,
              risks: [
                ...output.risks,
                { kind: 'unverified-team-claim', evidence: [{ field: 'actions', quote: '' }] },
              ],
            })
          }
        >
          <Plus size={16} />
          Add flag
        </button>
      </details>
      <label>
        Review rationale
        <textarea
          aria-label="Interpretation review rationale"
          value={notes}
          maxLength={1500}
          rows={2}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <div className="run-actions">
        <button
          className="primary"
          disabled={!notes.trim() || !record.proposal || !matchesProposal}
          onClick={() => finish('accept')}
        >
          <Check size={16} />
          Accept interpretation
        </button>
        <button
          className="secondary"
          disabled={!notes.trim() || !record.proposal || !changed}
          onClick={() => finish('edit')}
        >
          <Save size={16} />
          Save edited assessment
        </button>
        <button className="secondary" disabled={!notes.trim()} onClick={() => finish('reject')}>
          <X size={16} />
          Reject interpretation
        </button>
        <button className="secondary" disabled={!notes.trim()} onClick={() => finish('override')}>
          <Pencil size={16} />
          Record manual override
        </button>
      </div>
    </fieldset>
  );
}

export function InterpretationStatus({ model }: { model: Model }) {
  if (!model.view?.supported && !model.error) return null;
  return (
    <div className="interpretation-status">
      <button
        className="icon-button"
        title="Refresh interpretations"
        aria-label="Refresh interpretations"
        disabled={model.busy || !!model.pending}
        onClick={() => void model.reload()}
      >
        <RefreshCw size={16} />
      </button>
      {model.view?.supported && (
        <span className="muted">Interpretation calls remaining: {model.view.remainingCalls}</span>
      )}
      {model.error && (
        <p className="error" role="alert">
          {model.error}
        </p>
      )}
      {model.pending && !model.busy && (
        <button className="secondary" onClick={() => void model.perform(model.pending!)}>
          <RefreshCw size={16} />
          Retry interpretation request
        </button>
      )}
    </div>
  );
}
export function InterpretationPanel({
  model,
  releaseId,
  responseId,
  blocked,
}: {
  model: Model;
  releaseId: string;
  responseId: string;
  blocked: boolean;
}) {
  if (!model.view?.supported) return null;
  const records = model.view.records.filter((item) => item.record.releaseId === releaseId);
  const current = records.at(-1);
  const waiting = records.some((item) => ['queued', 'running'].includes(item.record.status));
  const disabled = blocked || model.busy || !!model.pending;
  return (
    <section className="interpretation-panel" aria-label="Response interpretation">
      <div className="section-heading">
        <h3>Response interpretation</h3>
        {current && (
          <span className="badge">
            {current.stale || current.record.responseId !== responseId
              ? 'Stale'
              : (current.record.review?.decision ?? current.record.status)}
          </span>
        )}
      </div>
      <div className="run-actions">
        <button
          className="secondary"
          disabled={disabled || !model.view.enabled || !model.view.remainingCalls || waiting}
          onClick={() => model.submit('', { releaseId, responseId, mode: 'ai' })}
        >
          <Sparkles size={16} />
          Interpret response
        </button>
        <button
          className="secondary"
          disabled={disabled}
          onClick={() => model.submit('', { releaseId, responseId, mode: 'manual' })}
        >
          <Pencil size={16} />
          New manual assessment
        </button>
      </div>
      {current && (
        <>
          <p className="muted">
            Response {current.record.responseId} / {date(current.record.updatedAt)}
          </p>
          {current.record.error && <p className="error">{current.record.error}</p>}
          {current.record.review && (
            <p className="run-notice">
              {current.record.review.decision} / {current.record.review.actorId}:{' '}
              {current.record.review.notes}
            </p>
          )}
          {['queued', 'running'].includes(current.record.status) ? (
            <p role="status">
              {current.record.status === 'queued'
                ? 'Queued for the local interpretation worker.'
                : 'Interpretation in progress.'}
            </p>
          ) : (
            <AssessmentReview
              key={current.record.id + '/' + current.record.revision}
              view={current}
              disabled={disabled || current.record.responseId !== responseId}
              submit={model.submit}
            />
          )}
          <details>
            <summary>Interpretation history ({records.length})</summary>
            {records.map((item) => (
              <p key={item.record.id}>
                {item.record.status} / {item.record.review?.decision ?? 'unreviewed'} /{' '}
                {item.stale ? 'stale' : 'current response'} / {date(item.record.createdAt)}
              </p>
            ))}
          </details>
        </>
      )}
    </section>
  );
}
