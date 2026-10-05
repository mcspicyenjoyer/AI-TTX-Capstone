import { useState } from 'react';
import { Check, CheckCircle2, RefreshCw } from 'lucide-react';
import type { Run } from '../contracts/exercise.js';
import {
  DispositionSchema,
  ClosureSchema,
  type Disposition,
  type OutcomeReview,
} from '../contracts/outcomes.js';
import type { OutcomeModel } from './use-outcomes.js';
import { OutcomeText } from './response-form.js';

export function DispositionForm({
  position,
  run,
  disabled,
  submit,
}: {
  position: OutcomeReview['positions'][number];
  run: Run;
  disabled: boolean;
  submit: OutcomeModel['submit'];
}) {
  const [draft, setDraft] = useState({
    observations: '',
    unresolvedGaps: '',
    decision: 'reviewed' as Disposition['decision'],
    expectedRunRevision: run.revision,
    responseId: position.response?.id ?? null,
  });
  const [rationale, setRationale] = useState('');
  const stale =
    draft.expectedRunRevision !== run.revision ||
    draft.responseId !== (position.response?.id ?? null);
  const latest = position.dispositions.at(-1);
  const dirty = !!draft.observations || !!draft.unresolvedGaps || draft.decision !== 'reviewed';
  return (
    <fieldset className="step0-form" disabled={disabled}>
      <legend>Facilitator review</legend>
      <p className="muted">
        {position.response
          ? `Response revision ${position.response.revision}`
          : 'No team response recorded.'}
      </p>
      <label>
        Disposition
        <select
          aria-label="Disposition"
          value={draft.decision}
          onChange={(event) =>
            setDraft({ ...draft, decision: event.target.value as Disposition['decision'] })
          }
        >
          <option value="reviewed">Reviewed</option>
          <option value="clarification-required">Clarification required</option>
          <option value="hold">Hold</option>
        </select>
      </label>
      <OutcomeText
        label="Facilitator observations"
        value={draft.observations}
        onChange={(observations) => setDraft({ ...draft, observations })}
      />
      <OutcomeText
        label="Unresolved gaps"
        value={draft.unresolvedGaps}
        onChange={(unresolvedGaps) => setDraft({ ...draft, unresolvedGaps })}
      />
      {stale && (
        <p className="run-notice" role="status">
          The run or response changed. Review the latest state before recording.
        </p>
      )}
      <div className="run-actions">
        {stale && (
          <button
            className="secondary"
            onClick={() =>
              setDraft({
                ...draft,
                expectedRunRevision: run.revision,
                responseId: position.response?.id ?? null,
              })
            }
          >
            <RefreshCw size={16} />
            Review latest state
          </button>
        )}
        <button
          className="secondary"
          disabled={
            stale ||
            run.state !== 'active' ||
            !draft.observations.trim() ||
            (!position.response && !draft.unresolvedGaps.trim())
          }
          onClick={() =>
            submit(DispositionSchema, 'dispositions', { ...draft, releaseId: position.releaseId })
          }
        >
          <Check size={16} />
          Record disposition
        </button>
      </div>
      {latest && (
        <>
          <OutcomeText label="Closure rationale" value={rationale} onChange={setRationale} />
          <button
            className="primary"
            disabled={
              dirty ||
              stale ||
              run.state !== 'active' ||
              !rationale.trim() ||
              latest.decision !== 'reviewed' ||
              latest.responseId !== (position.response?.id ?? null)
            }
            onClick={() =>
              submit(ClosureSchema, 'closures', {
                expectedRunRevision: run.revision,
                releaseId: position.releaseId,
                dispositionId: latest.id,
                rationale,
              })
            }
          >
            <CheckCircle2 size={16} />
            Close position
          </button>
        </>
      )}
    </fieldset>
  );
}
