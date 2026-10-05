import { useState } from 'react';
import { CheckCircle2, RefreshCw, TriangleAlert } from 'lucide-react';
import type { Actor } from '../contracts/profile.js';
import { CompletionSchema, type ResponseView } from '../contracts/outcomes.js';
import { useOutcomes } from './use-outcomes.js';
import { ResponseForm, OutcomeText } from './response-form.js';
import { DispositionForm } from './disposition-form.js';
import { date } from './exercise-format.js';

function SavedResponse({ response }: { response: ResponseView }) {
  return (
    <div className="saved-response">
      <p className="muted">
        Revision {response.revision} / {response.actorId} / {date(response.recordedAt)}
      </p>
      <h3>Agreed actions</h3>
      <p className="inject-body">{response.actions}</p>
      <h3>Team rationale</h3>
      <p className="inject-body">{response.rationale}</p>
      {response.informationRequests && (
        <>
          <h3>Information requests</h3>
          <p className="inject-body">{response.informationRequests}</p>
        </>
      )}
    </div>
  );
}

export function OutcomeWorkspace({
  actor,
  selected,
  blocked,
  onChanged,
  onSessionExpired,
}: {
  actor: Actor;
  selected: string;
  blocked: boolean;
  onChanged: () => void;
  onSessionExpired: () => void;
}) {
  const [track, runId] = selected.split('/');
  const model = useOutcomes(
    actor,
    `/api/tracks/${track}/runs/${runId}`,
    onChanged,
    onSessionExpired,
  );
  const { view, error, pending, busy, saved, submit } = model;
  const [rationale, setRationale] = useState('');
  const disabled = blocked || busy || !!pending || !!error;
  return (
    <section className="run-section outcomes" aria-label="Responses and outcomes">
      <div className="section-heading">
        <h2>Responses and outcomes</h2>
        <button
          className="icon-button"
          title="Refresh outcomes"
          aria-label="Refresh outcomes"
          disabled={busy || !!pending}
          onClick={() => void model.reload()}
        >
          <RefreshCw size={18} />
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          <TriangleAlert size={18} />
          {error}
        </p>
      )}
      {pending && !busy && (
        <button className="secondary" onClick={() => void model.perform(pending)}>
          <RefreshCw size={16} />
          Retry outcome request
        </button>
      )}
      {!view && !error && <p role="status">Loading outcomes...</p>}
      {view && (
        <>
          {view.run.state === 'paused' && (
            <p className="run-notice" role="status">
              Paused. Submissions, review and closure are frozen; local drafts are retained.
            </p>
          )}
          {!view.positions.length && <p className="muted">No released positions.</p>}
          {view.positions.map((position) => (
            <section
              key={position.releaseId}
              className="run-section"
              aria-label={`Position ${position.position}`}
            >
              <div className="section-heading">
                <h3>Position {position.position}</h3>
                <span className={`badge ${position.closed ? 'confirmed' : 'pending'}`}>
                  {position.closed ? 'Closed' : 'Open'}
                </span>
              </div>
              {position.response ? (
                <SavedResponse response={position.response} />
              ) : (
                <p className="muted">No team response recorded.</p>
              )}
              {'responses' in position && (
                <>
                  {position.responses.length > 1 && (
                    <details>
                      <summary>Response revision history ({position.responses.length})</summary>
                      {position.responses.map((response) => (
                        <SavedResponse key={response.id} response={response} />
                      ))}
                    </details>
                  )}
                  {position.dispositions.map((disposition) => (
                    <div className="run-gap" key={disposition.id}>
                      <strong>
                        {disposition.decision.replaceAll('-', ' ')} / {date(disposition.recordedAt)}
                      </strong>
                      <p className="inject-body">{disposition.observations}</p>
                      <p className="inject-body">{disposition.unresolvedGaps}</p>
                    </div>
                  ))}
                  {position.closure && (
                    <p className="run-notice">Closure: {position.closure.rationale}</p>
                  )}
                  {!position.closed && view.run.state !== 'completed' && (
                    <DispositionForm
                      key={`${position.releaseId}/${saved}`}
                      position={position}
                      run={view.run}
                      disabled={disabled}
                      submit={submit}
                    />
                  )}
                </>
              )}
              {actor.role === 'participant' &&
                !position.closed &&
                view.run.state !== 'completed' && (
                  <ResponseForm
                    key={`${position.releaseId}/${saved}`}
                    position={position}
                    run={view.run}
                    disabled={disabled}
                    submit={submit}
                  />
                )}
            </section>
          ))}
          {'completion' in view && view.completion && (
            <p className="run-notice" role="status">
              Run completed: {date(view.completion.recordedAt)}. {view.completion.rationale}
            </p>
          )}
          {'canComplete' in view && view.canComplete && (
            <fieldset className="step0-form" disabled={disabled}>
              <legend>Complete run</legend>
              <OutcomeText label="Completion rationale" value={rationale} onChange={setRationale} />
              <button
                className="primary"
                disabled={!rationale.trim()}
                onClick={() =>
                  submit(CompletionSchema, 'complete', {
                    expectedRunRevision: view.run.revision,
                    rationale,
                  })
                }
              >
                <CheckCircle2 size={16} />
                Complete run
              </button>
            </fieldset>
          )}
        </>
      )}
    </section>
  );
}
