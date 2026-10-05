import { useState } from 'react';
import { Check, Pencil, RefreshCw } from 'lucide-react';
import type { Run } from '../contracts/exercise.js';
import { ResponseViewSchema, type TeamOutcomes } from '../contracts/outcomes.js';
import type { OutcomeModel } from './use-outcomes.js';

export function OutcomeText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <textarea
        aria-label={label}
        value={value}
        maxLength={3000}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function ResponseForm({
  position,
  run,
  disabled,
  submit,
}: {
  position: TeamOutcomes['positions'][number];
  run: Run;
  disabled: boolean;
  submit: OutcomeModel['submit'];
}) {
  const [draft, setDraft] = useState({
    actions: '',
    rationale: '',
    informationRequests: '',
    expectedRunRevision: run.revision,
    previousResponseId: position.response?.id ?? null,
  });
  const stale =
    draft.expectedRunRevision !== run.revision ||
    draft.previousResponseId !== (position.response?.id ?? null);
  function reviewLatest() {
    setDraft((value) => ({
      ...value,
      expectedRunRevision: run.revision,
      previousResponseId: position.response?.id ?? null,
    }));
  }
  return (
    <fieldset className="step0-form" disabled={disabled}>
      <legend>Agreed team response</legend>
      {position.response && (
        <button
          className="secondary"
          onClick={() => {
            const response = position.response!;
            setDraft({
              actions: response.actions,
              rationale: response.rationale,
              informationRequests: response.informationRequests,
              expectedRunRevision: run.revision,
              previousResponseId: response.id,
            });
          }}
        >
          <Pencil size={16} />
          Revise team response
        </button>
      )}
      <OutcomeText
        label="Agreed actions"
        value={draft.actions}
        onChange={(actions) => setDraft({ ...draft, actions })}
      />
      <OutcomeText
        label="Team rationale"
        value={draft.rationale}
        onChange={(rationale) => setDraft({ ...draft, rationale })}
      />
      <OutcomeText
        label="Information requests"
        value={draft.informationRequests}
        onChange={(informationRequests) => setDraft({ ...draft, informationRequests })}
      />
      {stale && (
        <p className="run-notice" role="status">
          The run or team response changed. Your local draft is retained.
        </p>
      )}
      <div className="run-actions">
        {stale && (
          <button className="secondary" onClick={reviewLatest}>
            <RefreshCw size={16} />
            Review latest state
          </button>
        )}
        <button
          className="primary"
          disabled={
            stale || run.state !== 'active' || !draft.actions.trim() || !draft.rationale.trim()
          }
          onClick={() =>
            submit(ResponseViewSchema, 'team-responses', {
              ...draft,
              releaseId: position.releaseId,
            })
          }
        >
          <Check size={16} />
          Submit team response
        </button>
      </div>
    </fieldset>
  );
}
