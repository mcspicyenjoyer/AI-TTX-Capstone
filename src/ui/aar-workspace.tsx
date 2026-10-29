import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, Plus, RefreshCw, Save, Sparkles, Trash2, X } from 'lucide-react';
import type { Static } from '@sinclair/typebox';
import {
  AarListSchema,
  AarViewSchema,
  findingCategories,
  type AarFinding,
  type AarView,
  type ImprovementAction,
  type ReviewedAarOutput,
} from '../contracts/aar.js';
import type { RecordReportView } from '../contracts/record-report.js';
import { findingDefault } from './aar-draft.js';
import { ApiError, request } from './api.js';
import { date } from './exercise-format.js';
import { useCanLeave, useUnsavedGuard } from './unsaved-guard.js';

const categoryLabels: Record<AarFinding['category'], string> = {
  'team-decision': 'Team decisions',
  'facilitator-observation': 'Facilitator observations',
  'reviewed-analysis': 'Reviewed post-exercise analysis',
  'profile-gap': 'Pre-existing profile gaps',
  'exercise-gap': 'Exercise-surfaced evidence gaps',
  'origin-not-established': 'Gap origin not established',
};
function Finding({
  value,
  snapshot,
  editing,
  onChange,
  remove,
}: {
  value: AarFinding;
  snapshot: RecordReportView;
  editing: boolean;
  onChange: (value: AarFinding) => void;
  remove: () => void;
}) {
  return (
    <div className="aar-finding" data-finding-id={value.id}>
      {editing ? (
        <div className="run-actions">
          <select
            aria-label="Finding category"
            value={value.category}
            onChange={(e) =>
              onChange({ ...value, category: e.target.value as AarFinding['category'] })
            }
          >
            {findingCategories.map((key) => (
              <option key={key} value={key}>
                {categoryLabels[key]}
              </option>
            ))}
          </select>
          <button type="button" className="icon-button" title="Remove finding" onClick={remove}>
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <h5>{categoryLabels[value.category]}</h5>
      )}
      {value.evidence.map((evidence, index) => {
        const record = snapshot.report.records.find((r) => r.id === evidence.recordId);
        return (
          <div key={index} className="aar-evidence">
            {editing ? (
              <>
                <label>
                  Record
                  <select
                    value={evidence.recordId}
                    onChange={(e) => {
                      const source = snapshot.report.records.find((r) => r.id === e.target.value)!;
                      onChange({
                        ...value,
                        evidence: value.evidence.map((item, i) =>
                          i === index
                            ? { recordId: source.id, field: source.fields[0]!.label, quote: '' }
                            : item,
                        ),
                      });
                    }}
                  >
                    {snapshot.report.records.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.position ? `Inject ${r.position} / ` : ''}
                        {r.kind} / {r.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Field
                  <select
                    value={evidence.field}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        evidence: value.evidence.map((item, i) =>
                          i === index ? { ...item, field: e.target.value, quote: '' } : item,
                        ),
                      })
                    }
                  >
                    {record?.fields.map((f) => (
                      <option key={f.label} value={f.label}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
                <details>
                  <summary>Captured field</summary>
                  <p className="aar-quote">
                    {record?.fields.find((f) => f.label === evidence.field)?.value}
                  </p>
                </details>
                <label>
                  Exact excerpt
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={evidence.quote}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        evidence: value.evidence.map((item, i) =>
                          i === index ? { ...item, quote: e.target.value } : item,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="icon-button"
                  title="Remove excerpt"
                  disabled={value.evidence.length === 1}
                  onClick={() =>
                    onChange({ ...value, evidence: value.evidence.filter((_, i) => i !== index) })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              <>
                <blockquote className="aar-quote">{evidence.quote}</blockquote>
                <p className="muted">
                  {evidence.field}{' '}
                  <a className="record-citation" href={'#record-' + evidence.recordId}>
                    [{evidence.recordId}]
                  </a>
                </p>
              </>
            )}
          </div>
        );
      })}
      {editing && (
        <button
          type="button"
          className="icon-button"
          title="Add excerpt"
          disabled={value.evidence.length >= 4}
          onClick={() =>
            onChange({
              ...value,
              evidence: [...value.evidence, { ...value.evidence[0]!, quote: '' }],
            })
          }
        >
          <Plus size={16} />
        </button>
      )}
    </div>
  );
}
type Person = { id: string; name: string };
// Assigning an owner needs a due date; clearing the owner returns the action to a proposal.
function withOwner(action: ImprovementAction, owner: string, dueDate: string): ImprovementAction {
  const { id, findingIds, proposal } = action;
  return owner
    ? { id, findingIds, proposal, status: 'assigned', owner, dueDate }
    : { id, findingIds, proposal, status: 'proposed', owner: '' };
}
function AarReview({
  view,
  snapshot,
  people,
  disabled,
  submit,
}: {
  view: AarView;
  snapshot: RecordReportView;
  people: Person[];
  disabled: boolean;
  submit: (suffix: string, body: Record<string, unknown>) => void;
}) {
  const record = view.record;
  const initial: ReviewedAarOutput = record.review?.output ??
    record.proposal ?? {
      scope: 'discussion-only',
      objectives: snapshot.report.objectives.map((o) => ({
        objectiveId: o.id,
        strengths: [],
        areasForImprovement: [],
      })),
      improvementActions: [],
    };
  const [output, setOutput] = useState(structuredClone(initial)),
    [editing, setEditing] = useState(!record.proposal),
    [notes, setNotes] = useState('');
  const changed = JSON.stringify(initial) !== JSON.stringify(output);
  useUnsavedGuard(changed || !!notes.trim());
  const matchesProposal = JSON.stringify(output) === JSON.stringify(record.proposal);
  const findings = output.objectives.flatMap((o) => o.areasForImprovement);
  const missingDueDate = output.improvementActions.some(
    (action) => action.status === 'assigned' && !/^\d{4}-\d{2}-\d{2}$/.test(action.dueDate),
  );
  const setAction = (index: number, action: ImprovementAction) =>
    setOutput({
      ...output,
      improvementActions: output.improvementActions.map((a, i) => (i === index ? action : a)),
    });
  function review(decision: 'accept' | 'edit' | 'reject' | 'override') {
    submit('/' + record.id + '/review', {
      expectedRevision: record.revision,
      expectedHash: view.hash,
      decision,
      notes,
      output: ['edit', 'override'].includes(decision) ? output : null,
    });
  }
  return (
    <article className="aar-review" aria-label="After-action review draft">
      <h3>After-Action Review</h3>
      <p>
        <strong>
          {record.review ? 'Facilitator-reviewed: ' + record.review.decision : 'Unreviewed draft'}
        </strong>{' '}
        / Discussion only
      </p>
      <p className="muted">
        {record.id} / {date(record.updatedAt)}
      </p>
      <p>
        {
          snapshot.report.records
            .find((r) => r.kind === 'boundary')
            ?.fields.find((f) => f.label === 'clarificationLimit')?.value
        }{' '}
        <a className="record-citation" href={'#record-' + snapshot.report.id}>
          [{snapshot.report.id}]
        </a>
      </p>
      {record.review && <p>Review note: {record.review.notes}</p>}
      <p>
        Quoted team statements, facilitator observations and reviewed analysis are not evidence of
        executed actions or successful recovery.{' '}
        <a href={'#record-' + snapshot.report.id}>[{snapshot.report.id}]</a>
      </p>
      <fieldset className="aar-editor" disabled={disabled}>
        <legend>Objective review</legend>
        <div className="run-actions">
          <button type="button" onClick={() => setEditing(!editing)}>
            <Pencil size={16} />
            {editing ? 'Preview draft' : 'Edit draft'}
          </button>
        </div>
        {output.objectives.map((objective, oi) => (
          <section key={objective.objectiveId} aria-label={'AAR ' + objective.objectiveId}>
            <h3>
              {snapshot.report.objectives[oi]!.text}{' '}
              <a className="record-citation" href={'#record-' + snapshot.report.packageId}>
                [{snapshot.report.packageId}]
              </a>
            </h3>
            {(['strengths', 'areasForImprovement'] as const).map((section) => (
              <section
                key={section}
                aria-label={section === 'strengths' ? 'Strengths' : 'Areas for improvement'}
              >
                <h4>{section === 'strengths' ? 'Strengths' : 'Areas for improvement'}</h4>
                {!objective[section].length && <p className="muted">No finding selected.</p>}
                {objective[section].map((finding, fi) => (
                  <Finding
                    key={finding.id}
                    value={finding}
                    snapshot={snapshot}
                    editing={editing}
                    onChange={(value) =>
                      setOutput({
                        ...output,
                        objectives: output.objectives.map((o, i) =>
                          i === oi
                            ? { ...o, [section]: o[section].map((f, j) => (j === fi ? value : f)) }
                            : o,
                        ),
                      })
                    }
                    remove={() =>
                      setOutput({
                        ...output,
                        objectives: output.objectives.map((o, i) =>
                          i === oi
                            ? { ...o, [section]: o[section].filter((f) => f.id !== finding.id) }
                            : o,
                        ),
                      })
                    }
                  />
                ))}
                {editing && (
                  <button
                    type="button"
                    className="icon-button"
                    title={'Add ' + (section === 'strengths' ? 'strength' : 'improvement finding')}
                    disabled={
                      objective[section].length >= 4 || !findingDefault(snapshot.report, oi)
                    }
                    onClick={() => {
                      const source = findingDefault(snapshot.report, oi);
                      if (!source) return;
                      setOutput({
                        ...output,
                        objectives: output.objectives.map((o, i) =>
                          i === oi
                            ? {
                                ...o,
                                [section]: [
                                  ...o[section],
                                  { id: 'finding-' + crypto.randomUUID(), ...source },
                                ],
                              }
                            : o,
                        ),
                      });
                    }}
                  >
                    <Plus size={16} />
                  </button>
                )}
              </section>
            ))}
          </section>
        ))}
        <section aria-label="Proposed improvement actions">
          <h3>Proposed Improvement Actions</h3>
          <div className="aar-table-wrap">
            <table className="aar-table">
              <thead>
                <tr>
                  <th>Proposal</th>
                  <th>Evidence</th>
                  <th>Owner</th>
                  <th>Due</th>
                  <th>Status</th>
                  {editing && <th>Remove</th>}
                </tr>
              </thead>
              <tbody>
                {output.improvementActions.map((action, index) => (
                  <tr key={action.id}>
                    <td>
                      {editing ? (
                        <textarea
                          aria-label={'Improvement proposal ' + (index + 1)}
                          rows={3}
                          maxLength={800}
                          value={action.proposal}
                          onChange={(e) =>
                            setOutput({
                              ...output,
                              improvementActions: output.improvementActions.map((a, i) =>
                                i === index ? { ...a, proposal: e.target.value } : a,
                              ),
                            })
                          }
                        />
                      ) : (
                        action.proposal
                      )}
                    </td>
                    <td>
                      {editing
                        ? findings.map((f) => (
                            <label key={f.id}>
                              <input
                                type="checkbox"
                                checked={action.findingIds.includes(f.id)}
                                onChange={(e) =>
                                  setOutput({
                                    ...output,
                                    improvementActions: output.improvementActions.map((a, i) =>
                                      i === index
                                        ? {
                                            ...a,
                                            findingIds: e.target.checked
                                              ? [...a.findingIds, f.id]
                                              : a.findingIds.filter((id) => id !== f.id),
                                          }
                                        : a,
                                    ),
                                  })
                                }
                              />
                              {f.id}
                            </label>
                          ))
                        : [
                            ...new Set(
                              action.findingIds.flatMap(
                                (id) =>
                                  findings
                                    .find((f) => f.id === id)
                                    ?.evidence.map((e) => e.recordId) ?? [],
                              ),
                            ),
                          ].map((id) => (
                            <a key={id} className="record-citation" href={'#record-' + id}>
                              [{id}]
                            </a>
                          ))}
                    </td>
                    {editing ? (
                      <>
                        <td>
                          <select
                            aria-label={'Improvement owner ' + (index + 1)}
                            value={action.owner}
                            onChange={(e) =>
                              setAction(
                                index,
                                withOwner(
                                  action,
                                  e.target.value,
                                  action.status === 'assigned' ? action.dueDate : '',
                                ),
                              )
                            }
                          >
                            <option value="">Unassigned</option>
                            {people.map((person) => (
                              <option key={person.id} value={person.id}>
                                {person.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="date"
                            aria-label={'Improvement due date ' + (index + 1)}
                            disabled={action.status !== 'assigned'}
                            value={action.status === 'assigned' ? action.dueDate : ''}
                            onChange={(e) =>
                              setAction(index, withOwner(action, action.owner, e.target.value))
                            }
                          />
                        </td>
                      </>
                    ) : action.status === 'assigned' ? (
                      <>
                        <td>
                          {people.find((person) => person.id === action.owner)?.name ??
                            action.owner}
                        </td>
                        <td>{action.dueDate}</td>
                      </>
                    ) : (
                      <>
                        <td aria-label="Unassigned owner"></td>
                        <td></td>
                      </>
                    )}
                    <td>{action.status === 'assigned' ? 'Assigned' : 'Proposed'}</td>
                    {editing && (
                      <td>
                        <button
                          type="button"
                          className="icon-button"
                          title="Remove proposal"
                          onClick={() =>
                            setOutput({
                              ...output,
                              improvementActions: output.improvementActions.filter(
                                (a) => a.id !== action.id,
                              ),
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!output.improvementActions.length && (
            <p className="muted">No improvement proposal selected.</p>
          )}
          {editing && (
            <button
              type="button"
              className="icon-button"
              title="Add improvement proposal"
              disabled={output.improvementActions.length >= 12 || !findings.length}
              onClick={() =>
                setOutput({
                  ...output,
                  improvementActions: [
                    ...output.improvementActions,
                    {
                      id: 'action-' + crypto.randomUUID(),
                      findingIds: [findings[0]!.id],
                      proposal: '',
                      owner: '',
                      status: 'proposed',
                    },
                  ],
                })
              }
            >
              <Plus size={16} />
            </button>
          )}
        </section>
        <label>
          Review rationale
          <textarea
            aria-label="AAR review rationale"
            rows={2}
            maxLength={1500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <div className="run-actions">
          <button
            className="primary"
            disabled={!notes.trim() || !matchesProposal}
            onClick={() => review('accept')}
          >
            <Check size={16} />
            Accept AAR
          </button>
          <button
            disabled={!notes.trim() || missingDueDate || (!changed && !!record.proposal)}
            onClick={() => review(record.proposal ? 'edit' : 'override')}
          >
            <Save size={16} />
            {record.proposal ? 'Save AAR edits' : 'Save manual AAR'}
          </button>
          <button disabled={!notes.trim()} onClick={() => review('reject')}>
            <X size={16} />
            Reject AAR
          </button>
        </div>
      </fieldset>
    </article>
  );
}

export function AarWorkspace({
  snapshot,
  disabled = false,
  onSessionExpired,
}: {
  snapshot: RecordReportView;
  disabled?: boolean;
  onSessionExpired: () => void;
}) {
  const root = '/api/tracks/technical/runs/' + snapshot.report.runId + '/aars';
  const [list, setList] = useState<Static<typeof AarListSchema> | null>(null),
    [selected, setSelected] = useState('');
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ path: string; body: Record<string, unknown> } | null>(
    null,
  );
  const generation = useRef(0);
  const canLeave = useCanLeave();
  const locked = disabled || busy || !!pending;
  useUnsavedGuard(false, busy || !!pending);
  async function reload() {
    const current = ++generation.current;
    try {
      const next = await request(AarListSchema, root);
      if (current === generation.current) {
        setList(next);
        setError('');
      }
    } catch (cause) {
      if (current !== generation.current) return;
      if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) {
        setList(null);
        if (cause.status === 401) onSessionExpired();
      }
      setError(cause instanceof Error ? cause.message : 'AAR unavailable.');
    }
  }
  async function perform(command: NonNullable<typeof pending>) {
    setPending(command);
    setBusy(true);
    setError('');
    try {
      const view = await request(AarViewSchema, command.path, command.body);
      setPending(null);
      setSelected(view.record.id);
      await reload();
    } catch (cause) {
      if (cause instanceof ApiError) {
        if (cause.status === 401) onSessionExpired();
        if (cause.status < 500) setPending(null);
      }
      setError(cause instanceof Error ? cause.message : 'Request outcome unconfirmed.');
    } finally {
      setBusy(false);
    }
  }
  function submit(suffix: string, body: Record<string, unknown>) {
    if (locked || (suffix === '' && !canLeave())) return;
    void perform({ path: root + suffix, body: { ...body, commandId: crypto.randomUUID() } });
  }
  useEffect(() => {
    void reload();
    return () => {
      generation.current++;
    };
  }, []);
  const waiting = list?.records.some((v) => ['queued', 'running'].includes(v.record.status));
  useEffect(() => {
    if (!waiting || locked) return;
    const timer = window.setInterval(() => void reload(), 4000);
    return () => window.clearInterval(timer);
  }, [waiting, locked]);
  const records = list?.records.filter((v) => v.record.snapshotId === snapshot.report.id) ?? [];
  const view = records.find((v) => v.record.id === selected) ?? records.at(-1);
  return (
    <section className="aar-workspace" aria-label="AAR workspace">
      <h2>After-Action Review</h2>
      <p className="report-hash">
        Snapshot {snapshot.report.id} / SHA-256 {snapshot.hash}
      </p>
      <p>
        {list?.remainingCalls ?? 'Unknown'} of 3 AI attempts remaining. AI drafts leave owners
        blank; assign owners and due dates when you review.
      </p>
      <div className="run-actions">
        <button
          className="primary"
          disabled={!list?.enabled || !list.remainingCalls || !!waiting || locked}
          onClick={() =>
            submit('', { snapshotId: snapshot.report.id, snapshotHash: snapshot.hash, mode: 'ai' })
          }
        >
          <Sparkles size={17} />
          Draft AAR
        </button>
        <button
          disabled={locked}
          onClick={() =>
            submit('', {
              snapshotId: snapshot.report.id,
              snapshotHash: snapshot.hash,
              mode: 'manual',
            })
          }
        >
          <Plus size={17} />
          New manual AAR
        </button>
        <button
          className="icon-button"
          title="Refresh AAR"
          disabled={locked}
          onClick={() => {
            if (canLeave()) void reload();
          }}
        >
          <RefreshCw size={17} />
        </button>
        {pending && (
          <button disabled={disabled || busy} onClick={() => void perform(pending)}>
            <RefreshCw size={17} />
            Retry same AAR request
          </button>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!!records.length && (
        <label>
          AAR draft
          <select
            aria-label="AAR draft"
            value={view?.record.id ?? ''}
            disabled={locked}
            onChange={(e) => {
              if (e.target.value !== view?.record.id && canLeave()) setSelected(e.target.value);
            }}
          >
            {records.map((v, i) => (
              <option key={v.record.id} value={v.record.id}>
                {i + 1}. {v.record.status} / {date(v.record.createdAt)}
              </option>
            ))}
          </select>
        </label>
      )}
      {view && (
        <>
          <p>
            Status: {view.record.status} / Input tokens: {view.record.inputTokens ?? 'unknown'} /
            Output tokens: {view.record.outputTokens ?? 'unknown'}
          </p>
          {view.record.error && <p role="status">{view.record.error}</p>}
          {!['queued', 'running'].includes(view.record.status) && (
            <AarReview
              key={view.record.id + ':' + view.record.revision}
              view={view}
              snapshot={snapshot}
              people={list?.people ?? []}
              disabled={locked}
              submit={submit}
            />
          )}
        </>
      )}
    </section>
  );
}
