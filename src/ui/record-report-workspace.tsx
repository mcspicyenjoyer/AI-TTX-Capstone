import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronsDownUp,
  ChevronsUpDown,
  ClipboardCheck,
  Clock3,
  List,
  MessageSquareText,
  RefreshCw,
  ScrollText,
} from 'lucide-react';
import type { Static } from '@sinclair/typebox';
import {
  RecordReportListSchema,
  RecordReportViewSchema,
  type RecordReportView,
  type ReportRecord,
} from '../contracts/record-report.js';
import { ApiError, request } from './api.js';
import { date } from './exercise-format.js';
import { AarWorkspace } from './aar-workspace.js';
import { DebriefWorkspace } from './debrief-workspace.js';
import { GuardProvider, useGuardRegistry, useUnsavedGuard } from './unsaved-guard.js';
import { Citation, RevealRecord } from './record-citation.js';

const titles: Record<ReportRecord['kind'], string> = {
  boundary: 'Snapshot boundaries',
  run: 'Exercise',
  package: 'Frozen package',
  step0: 'Step 0',
  release: 'Release',
  response: 'Team response',
  disposition: 'Facilitator disposition',
  closure: 'Inject closure',
  completion: 'Completion',
  activity: 'Activity',
  interpretation: 'Reviewed interpretation',
  clarification: 'Facilitator clarification',
  debrief: 'Debrief',
};

function fieldLabel(label: string) {
  const words = label.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[.-]/g, ' ');
  return words[0]!.toUpperCase() + words.slice(1);
}

type Field = ReportRecord['fields'][number];
const annotations = ['fictionalExerciseClock', 'analysisPhase'];
// Record plumbing (IDs, hashes, revision counters) sits behind an Identifiers toggle.
const identifier = /(Ids?|Hash|[rR]evision|sequence)$/;
const previewFields = [
  'title',
  'question',
  'actions',
  'decision',
  'kind',
  'state',
  'participantFeedback',
  'facilitatorObservations',
  'exerciseDesignNotes',
  'rationale',
];

function FieldList({ record, fields }: { record: ReportRecord; fields: Field[] }) {
  return (
    <dl>
      {fields.map((field, index) => (
        <div key={index}>
          <dt>
            {fieldLabel(field.label)} <Citation id={record.id} self />
          </dt>
          <dd>
            {field.value.split(/\r?\n/).map((line, i) => (
              <p key={i}>
                {line || '[empty]'}{' '}
                {field.citations.map((id) => (
                  <Citation key={id} id={id} self={id === record.id} />
                ))}
              </p>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// One line per record until opened (ADR-045). Every field stays in the page with its
// citations; nothing from the snapshot is dropped or reworded.
function RecordDetail({ record }: { record: ReportRecord }) {
  const clock = record.fields.find((field) => field.label === 'fictionalExerciseClock');
  const fields = record.fields.filter((field) => !annotations.includes(field.label));
  const content = fields.filter((field) => !identifier.test(field.label));
  const identifiers = fields.filter((field) => identifier.test(field.label));
  const lead =
    previewFields.map((label) => content.find((field) => field.label === label)).find(Boolean) ??
    content[0];
  return (
    <details
      className="report-record"
      id={'record-' + record.id}
      data-record-id={record.id}
      open={record.kind === 'boundary'}
    >
      <summary>
        <h4>
          {titles[record.kind]} <Citation id={record.id} self />
        </h4>
        <span className="record-preview">{lead?.value.split(/\r?\n/)[0]}</span>
        {record.recordedAt && <span className="record-when">{date(record.recordedAt)}</span>}
      </summary>
      {clock && (
        <p className="report-clock">
          <strong>Exercise clock:</strong> {clock.value}{' '}
          {clock.citations.map((id) => (
            <Citation key={id} id={id} self={id === record.id} />
          ))}
        </p>
      )}
      {record.kind === 'interpretation' && (
        <p className="report-analysis">
          <strong>Post-exercise analysis</strong> / Not an exercise event.{' '}
          <Citation id={record.id} self />
        </p>
      )}
      {(record.recordedAt || record.actorId || record.revision) && (
        <p className="muted">
          {record.recordedAt && 'Recorded ' + date(record.recordedAt)}
          {record.actorId && ' / ' + record.actorId}
          {record.revision && ' / revision ' + record.revision} <Citation id={record.id} self />
        </p>
      )}
      <FieldList record={record} fields={content} />
      {identifiers.length > 0 && (
        <details className="record-identifiers">
          <summary>Identifiers ({identifiers.length})</summary>
          <FieldList record={record} fields={identifiers} />
        </details>
      )}
    </details>
  );
}

// Debriefs follow completion; they are post-exercise records, not exercise events.
function DebriefRecords({ report }: { report: RecordReportView['report'] }) {
  const records = report.records.filter((r) => r.kind === 'debrief');
  if (!records.length) return null;
  return (
    <section aria-label="Post-exercise debrief">
      <h3>
        Post-exercise debrief <Citation id={report.id} self />
      </h3>
      {records.map((r) => (
        <RecordDetail key={r.id} record={r} />
      ))}
    </section>
  );
}

function Report({ view }: { view: RecordReportView }) {
  const { report } = view;
  const [tab, setTab] = useState<'objectives' | 'timeline'>('objectives');
  const byId = new Map(report.records.map((record) => [record.id, record]));
  const article = useRef<HTMLElement>(null);
  const setAll = (open: boolean) =>
    article.current
      ?.querySelectorAll<HTMLDetailsElement>('details.report-record')
      .forEach((item) => (item.open = open));
  return (
    <article className="record-report" aria-label="Exercise record" ref={article}>
      <h2>
        Exercise record <Citation id={report.id} self />
      </h2>
      <p>
        Captured {date(report.createdAt)} <Citation id={report.id} self />
      </p>
      <p className="report-hash">
        SHA-256: {view.hash} <Citation id={report.id} self />
      </p>
      {report.records
        .filter((r) => ['boundary', 'run', 'package'].includes(r.kind))
        .map((r) => (
          <RecordDetail key={r.id} record={r} />
        ))}
      <div className="workspace-tabs" role="tablist" aria-label="Report views">
        <button
          role="tab"
          aria-selected={tab === 'objectives'}
          onClick={() => setTab('objectives')}
        >
          <List size={17} />
          By objective
        </button>
        <button role="tab" aria-selected={tab === 'timeline'} onClick={() => setTab('timeline')}>
          <Clock3 size={17} />
          Timeline
        </button>
      </div>
      <div className="report-expand">
        <button className="secondary" onClick={() => setAll(true)}>
          <ChevronsUpDown size={16} />
          Expand all
        </button>
        <button className="secondary" onClick={() => setAll(false)}>
          <ChevronsDownUp size={16} />
          Collapse all
        </button>
      </div>
      {tab === 'timeline' ? (
        <section aria-label="Record timeline">
          <h3>
            Timeline <Citation id={report.id} self />
          </h3>
          <section aria-label="Exercise event records">
            {report.timeline
              .filter((id) => !['interpretation', 'debrief'].includes(byId.get(id)!.kind))
              .map((id) => (
                <RecordDetail key={id} record={byId.get(id)!} />
              ))}
          </section>
          {report.timeline.some((id) => byId.get(id)!.kind === 'interpretation') && (
            <section aria-label="Post-exercise analysis">
              <h3>
                Post-exercise analysis <Citation id={report.id} self />
              </h3>
              {report.timeline
                .filter((id) => byId.get(id)!.kind === 'interpretation')
                .map((id) => (
                  <RecordDetail key={id} record={byId.get(id)!} />
                ))}
            </section>
          )}
          <DebriefRecords report={report} />
        </section>
      ) : (
        <>
          <section aria-label="Step 0 record">
            <h3>
              Step 0 <Citation id={report.id} self />
            </h3>
            {report.records
              .filter((r) => r.kind === 'step0')
              .map((r) => (
                <RecordDetail key={r.id} record={r} />
              ))}
          </section>
          {report.objectives.map((objective) => (
            <section key={objective.id} aria-label={objective.id}>
              <h3>
                {objective.text} <Citation id={report.packageId} />
              </h3>
              {objective.positions.map((position) => {
                const records = report.records.filter((r) => r.position === position);
                return (
                  <section key={position} aria-label={'Inject ' + position}>
                    <h3>
                      Inject {position}:{' '}
                      {
                        records
                          .find((r) => r.kind === 'release')
                          ?.fields.find((f) => f.label === 'title')?.value
                      }{' '}
                      <Citation id={records.find((r) => r.kind === 'release')!.id} />
                    </h3>
                    {records.map((r) => (
                      <RecordDetail key={r.id} record={r} />
                    ))}
                  </section>
                );
              })}
            </section>
          ))}
          <section aria-label="Completion and activity">
            <h3>
              Completion and activity <Citation id={report.id} self />
            </h3>
            {report.records
              .filter((r) => ['completion', 'activity'].includes(r.kind))
              .map((r) => (
                <RecordDetail key={r.id} record={r} />
              ))}
          </section>
          <DebriefRecords report={report} />
        </>
      )}
    </article>
  );
}

type Section = 'debrief' | 'records' | 'aar';
// In working order: debrief first, capture, read the records, then review the AAR.
const sections = [
  ['debrief', 'Debrief', MessageSquareText],
  ['records', 'Records', ScrollText],
  ['aar', 'After-action review', ClipboardCheck],
] as const;

export function RecordReportWorkspace({
  runId,
  participants,
  onSessionExpired,
}: {
  runId: string;
  participants: { actorId: string; displayName: string }[];
  onSessionExpired: () => void;
}) {
  const root = '/api/tracks/technical/runs/' + runId + '/record-reports';
  const [list, setList] = useState<Static<typeof RecordReportListSchema>>([]);
  const [view, setView] = useState<RecordReportView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const generation = useRef(0);
  const first = useRef(true);
  const [section, setSection] = useState<Section>('aar');
  // A citation opens its record in the Records section, wherever it was clicked.
  const reveal = useCallback((id: string) => {
    setSection('records');
    requestAnimationFrame(() => {
      const target = document.getElementById('record-' + id);
      if (!target) return;
      if (target instanceof HTMLDetailsElement) target.open = true;
      target.scrollIntoView({ block: 'start' });
    });
  }, []);
  const aarGuard = useGuardRegistry(setError);
  // Only a capture request whose outcome is unresolved blocks leaving. This view stays mounted
  // while hidden, so treating an ordinary snapshot read as pending blocked unrelated navigation.
  useUnsavedGuard(false, !!pending);

  async function load(id?: string, commandId?: string) {
    const current = ++generation.current;
    setBusy(true);
    setError('');
    if (commandId) setPending(commandId);
    try {
      let next: RecordReportView | null = null;
      if (commandId) {
        next = await request(RecordReportViewSchema, root, { commandId });
        if (current !== generation.current) return;
        setPending(null);
        setView(next);
      }
      const snapshots = await request(RecordReportListSchema, root);
      if (current !== generation.current) return;
      setList(snapshots);
      // With nothing captured yet the debrief comes first; otherwise open on the review.
      if (first.current && !snapshots.length) setSection('debrief');
      first.current = false;
      const selected = id ?? next?.report.id ?? snapshots.at(-1)?.id;
      next ??= selected ? await request(RecordReportViewSchema, root + '/' + selected) : null;
      if (current === generation.current) setView(next);
    } catch (cause) {
      if (current !== generation.current) return;
      if (cause instanceof ApiError) {
        if (cause.status === 401) onSessionExpired();
        if ([401, 403, 404].includes(cause.status)) {
          setView(null);
          setList([]);
        }
        if (cause.status < 500) setPending(null);
      }
      setError(cause instanceof Error ? cause.message : 'Snapshot outcome unconfirmed.');
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, []);

  return (
    <section className="record-report-workspace" aria-label="Exercise record workspace">
      <div className="run-actions">
        <button
          className="primary"
          disabled={busy || !!pending}
          onClick={() => {
            if (aarGuard.canLeave()) void load(undefined, crypto.randomUUID());
          }}
        >
          <Camera size={18} />
          Capture record snapshot
        </button>
        <button
          className="icon-button"
          title="Refresh snapshots"
          aria-label="Refresh snapshots"
          disabled={busy || !!pending}
          onClick={() => void load(view?.report.id)}
        >
          <RefreshCw size={18} />
        </button>
        {pending && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void load(undefined, pending)}
          >
            <RefreshCw size={18} />
            Retry snapshot request
          </button>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {busy && <p role="status">Loading snapshot...</p>}
      {!busy && !list.length && !error && <p className="muted">No record snapshot captured.</p>}
      {!!list.length && (
        <label className="exercise-picker">
          Snapshot
          <select
            aria-label="Snapshot"
            value={view?.report.id ?? ''}
            disabled={busy || !!pending}
            onChange={(event) => {
              if (event.target.value !== view?.report.id && aarGuard.canLeave())
                void load(event.target.value);
            }}
          >
            {!view && <option value="">Select snapshot</option>}
            {list.map((item, i) => (
              <option key={item.id} value={item.id}>
                {i + 1}. {date(item.createdAt)}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="workspace-tabs report-sections" role="tablist" aria-label="Report sections">
        {sections.map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            id={'report-tab-' + id}
            aria-selected={section === id}
            aria-controls={'report-panel-' + id}
            onClick={() => setSection(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      {/* All three stay mounted so unsaved debrief and AAR edits survive switching. */}
      <RevealRecord.Provider value={reveal}>
        <div
          role="tabpanel"
          id="report-panel-debrief"
          aria-labelledby="report-tab-debrief"
          hidden={section !== 'debrief'}
        >
          <DebriefWorkspace
            runId={runId}
            participants={participants}
            onSessionExpired={onSessionExpired}
          />
        </div>
        <div
          role="tabpanel"
          id="report-panel-records"
          aria-labelledby="report-tab-records"
          hidden={section !== 'records'}
        >
          {view ? (
            <Report key={view.report.id} view={view} />
          ) : (
            <p className="muted">Capture a record snapshot to list the exercise records here.</p>
          )}
        </div>
        <div
          role="tabpanel"
          id="report-panel-aar"
          aria-labelledby="report-tab-aar"
          hidden={section !== 'aar'}
        >
          {view ? (
            <GuardProvider registry={aarGuard}>
              <AarWorkspace
                key={'aar-' + view.report.id}
                snapshot={view}
                disabled={busy || !!pending}
                onSessionExpired={onSessionExpired}
              />
            </GuardProvider>
          ) : (
            <p className="muted">
              The after-action review is drafted from a captured record snapshot.
            </p>
          )}
        </div>
      </RevealRecord.Provider>
    </section>
  );
}
