import { useState } from 'react';
import { FileText, Inbox, List, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react';
import type { Actor } from '../contracts/profile.js';
import { useExerciseWorkspace } from './use-exercise-workspace.js';
import { FacilitatorExercise } from './facilitator-exercise.js';
import { ParticipantExercise } from './participant-exercise.js';
import { OutcomeWorkspace } from './outcome-workspace.js';
import { RecordReportWorkspace } from './record-report-workspace.js';
import { ClarificationWorkspace } from './clarification-workspace.js';

export function ExerciseWorkspace({
  actor,
  onSessionExpired,
}: {
  actor: Actor;
  onSessionExpired: () => void;
}) {
  const vm = useExerciseWorkspace(actor, onSessionExpired);
  const [tab, setTab] = useState<'run' | 'report'>('run');
  const {
    disabled,
    editing,
    reload,
    error,
    refreshError,
    pending,
    busy,
    perform,
    setDraftContext,
    selected,
    clearStep0,
    runs,
    loading,
    review,
    briefing,
  } = vm;
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
          disabled={disabled || editing.current}
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
      {editing.current && (
        <div className="run-actions">
          <button
            className="secondary"
            disabled={disabled}
            onClick={() => {
              setDraftContext('stale');
              void reload(selected, false, true);
            }}
          >
            <RefreshCw size={17} />
            Refresh context and keep draft
          </button>
          <button
            className="secondary"
            disabled={disabled}
            onClick={() => {
              clearStep0();
              void reload();
            }}
          >
            Discard unsaved check
          </button>
        </div>
      )}
      {runs.length > 0 && (
        <label className="exercise-picker">
          Exercise
          <select
            aria-label="Exercise"
            value={selected}
            disabled={disabled || editing.current}
            onChange={(event) => {
              setTab('run');
              clearStep0();
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
      {!loading &&
        review?.run.state === 'completed' &&
        review.package.kind === 'generated-five-inject' && (
          <div className="workspace-tabs" role="tablist" aria-label="Exercise views">
            <button
              role="tab"
              aria-selected={tab === 'run'}
              disabled={disabled || editing.current}
              onClick={() => setTab('run')}
            >
              <List size={17} />
              Run
            </button>
            <button
              role="tab"
              aria-selected={tab === 'report'}
              disabled={disabled || editing.current}
              onClick={() => setTab('report')}
            >
              <FileText size={17} />
              Record report
            </button>
          </div>
        )}
      <div hidden={tab !== 'run'}>
        {!loading && review && <FacilitatorExercise vm={vm} />}
        {!loading && review?.package.kind === 'generated-five-inject' && (
          <ClarificationWorkspace
            key={'clarifications-' + selected}
            review={review}
            onSessionExpired={onSessionExpired}
          />
        )}
        {!loading && briefing && <ParticipantExercise vm={vm} />}
        {selected.startsWith('technical/') && (
          <OutcomeWorkspace
            key={selected}
            actor={actor}
            selected={selected}
            blocked={disabled || editing.current}
            onChanged={() => void reload()}
            onSessionExpired={onSessionExpired}
          />
        )}
      </div>
      <div hidden={tab !== 'report'}>
        {!loading &&
          review?.run.state === 'completed' &&
          review.package.kind === 'generated-five-inject' && (
            <RecordReportWorkspace
              key={selected}
              runId={review.run.id}
              onSessionExpired={onSessionExpired}
            />
          )}
      </div>
    </section>
  );
}
