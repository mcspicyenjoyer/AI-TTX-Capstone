import { useEffect, useRef, useState } from 'react';
import { Camera, Clock3, List, RefreshCw } from 'lucide-react';
import type { Static } from '@sinclair/typebox';
import {
  RecordReportListSchema,
  RecordReportViewSchema,
  type RecordReportView,
  type ReportRecord,
} from '../contracts/record-report.js';
import { ApiError, request } from './api.js';
import { date } from './exercise-format.js';

const titles: Record<ReportRecord['kind'], string> = {
  boundary: 'Snapshot boundaries',
  run: 'Run',
  package: 'Frozen package',
  step0: 'Step 0',
  release: 'Release',
  response: 'Team response',
  disposition: 'Facilitator disposition',
  closure: 'Position closure',
  completion: 'Completion',
  activity: 'Activity',
  interpretation: 'Reviewed interpretation',
};

function Citation({ id }: { id: string }) {
  return (
    <a className="record-citation" href={'#record-' + id}>
      [{id}]
    </a>
  );
}

function fieldLabel(label: string) {
  const words = label.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[.-]/g, ' ');
  return words[0]!.toUpperCase() + words.slice(1);
}

function RecordDetail({ record }: { record: ReportRecord }) {
  return (
    <section className="report-record" id={'record-' + record.id} data-record-id={record.id}>
      <h4>
        {titles[record.kind]} <Citation id={record.id} />
      </h4>
      {(record.recordedAt || record.actorId || record.revision) && (
        <p className="muted">
          {record.recordedAt && date(record.recordedAt)}
          {record.actorId && ' / ' + record.actorId}
          {record.revision && ' / revision ' + record.revision} <Citation id={record.id} />
        </p>
      )}
      <dl>
        {record.fields.map((field, index) => (
          <div key={index}>
            <dt>
              {fieldLabel(field.label)} <Citation id={record.id} />
            </dt>
            <dd>
              {field.value.split(/\r?\n/).map((line, i) => (
                <p key={i}>
                  {line || '[empty]'}{' '}
                  {field.citations.map((id) => (
                    <Citation key={id} id={id} />
                  ))}
                </p>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Report({ view }: { view: RecordReportView }) {
  const { report } = view;
  const [tab, setTab] = useState<'objectives' | 'timeline'>('objectives');
  const byId = new Map(report.records.map((record) => [record.id, record]));
  return (
    <article className="record-report" aria-label="Fixed app-record report">
      <h2>
        App-record report <Citation id={report.id} />
      </h2>
      <p>
        Captured {date(report.createdAt)} <Citation id={report.id} />
      </p>
      <p className="report-hash">
        SHA-256: {view.hash} <Citation id={report.id} />
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
      {tab === 'timeline' ? (
        <section aria-label="Record timeline">
          <h3>
            Timeline <Citation id={report.id} />
          </h3>
          {report.timeline.map((id) => (
            <RecordDetail key={id} record={byId.get(id)!} />
          ))}
        </section>
      ) : (
        <>
          <section aria-label="Preparation record">
            <h3>
              Step 0 <Citation id={report.id} />
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
              Completion and activity <Citation id={report.id} />
            </h3>
            {report.records
              .filter((r) => ['completion', 'activity'].includes(r.kind))
              .map((r) => (
                <RecordDetail key={r.id} record={r} />
              ))}
          </section>
        </>
      )}
    </article>
  );
}

export function RecordReportWorkspace({
  runId,
  onSessionExpired,
}: {
  runId: string;
  onSessionExpired: () => void;
}) {
  const root = '/api/tracks/technical/runs/' + runId + '/record-reports';
  const [list, setList] = useState<Static<typeof RecordReportListSchema>>([]);
  const [view, setView] = useState<RecordReportView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const generation = useRef(0);

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
    <section className="record-report-workspace" aria-label="Record report workspace">
      <div className="run-actions">
        <button
          className="primary"
          disabled={busy || !!pending}
          onClick={() => void load(undefined, crypto.randomUUID())}
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
      {!busy && !list.length && !error && <p className="muted">No captured report.</p>}
      {!!list.length && (
        <label className="exercise-picker">
          Snapshot
          <select
            aria-label="Snapshot"
            value={view?.report.id ?? ''}
            disabled={busy || !!pending}
            onChange={(event) => void load(event.target.value)}
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
      {view && <Report key={view.report.id} view={view} />}
    </section>
  );
}
