import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import {
  ClarificationListSchema,
  ClarificationSchema,
  type Clarification,
  type ClarificationInput,
} from '../contracts/clarification.js';
import type { Review } from '../contracts/exercise.js';
import { ApiError, request } from './api.js';
import { date } from './exercise-format.js';
import { useUnsavedGuard } from './unsaved-guard.js';

export function ClarificationWorkspace({
  review,
  onSessionExpired,
}: {
  review: Review;
  onSessionExpired: () => void;
}) {
  const root = '/api/tracks/technical/runs/' + review.run.id + '/clarifications';
  const [records, setRecords] = useState<Clarification[]>([]),
    [question, setQuestion] = useState(''),
    [text, setText] = useState(''),
    [claims, setClaims] = useState('');
  const [unknown, setUnknown] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ClarificationInput | null>(null);
  useUnsavedGuard(!!pending || !!question.trim() || !!text.trim() || !!claims.trim());
  const release = review.releases.at(-1);
  const editable = review.run.state === 'active' && !!release;
  function failure(cause: unknown) {
    if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
    setError(cause instanceof Error ? cause.message : 'Clarification unavailable.');
  }
  async function reload() {
    try {
      setRecords(await request(ClarificationListSchema, root));
    } catch (cause) {
      failure(cause);
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  async function save(input: ClarificationInput) {
    setPending(input);
    setBusy(true);
    setError('');
    try {
      await request(ClarificationSchema, root, input);
      setPending(null);
      setQuestion('');
      setText('');
      setClaims('');
      setUnknown(false);
      await reload();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status < 500) setPending(null);
      failure(cause);
    } finally {
      setBusy(false);
    }
  }
  if (!editable && !records.length && !error) return null;
  return (
    <section className="aar-workspace" aria-label="Facilitator clarification log">
      <h3>Facilitator Clarifications</h3>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {records.map((r) => (
        <div key={r.id} className="report-record">
          <p>
            Inject {r.position} / {date(r.recordedAt)} / {r.actorId}
          </p>
          <p>
            <strong>Question:</strong>{' '}
            {r.question ?? 'Not recorded (logged before questions were stored)'}
          </p>
          <p>
            <strong>Answer:</strong> {r.text}
          </p>
          <p>
            {r.unknown ? 'Information request' : r.claimIds.join(', ')} / {r.id}
          </p>
        </div>
      ))}
      {editable && (
        <fieldset className="clarification-form" disabled={busy || !!pending}>
          <legend>Current position answer</legend>
          <label>
            Participant question
            <textarea
              rows={2}
              maxLength={2000}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </label>
          <label className="clarification-unknown">
            <input
              type="checkbox"
              checked={unknown}
              onChange={(e) => setUnknown(e.target.checked)}
            />
            Not known at this time
          </label>
          {!unknown && (
            <>
              <label>
                Clarification answer
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
              <label>
                Confirmed claim IDs
                <input value={claims} onChange={(e) => setClaims(e.target.value)} />
              </label>
            </>
          )}
          <button
            disabled={!question.trim() || (!unknown && (!text.trim() || !claims.trim()))}
            onClick={() =>
              void save({
                commandId: crypto.randomUUID(),
                releaseId: release!.id,
                question,
                text: unknown ? 'not known at this time' : text,
                unknown,
                claimIds: unknown ? [] : claims.split(/[\s,]+/).filter(Boolean),
              })
            }
          >
            <Save size={17} />
            Record clarification
          </button>
        </fieldset>
      )}
      {pending && (
        <button disabled={busy} onClick={() => void save(pending)}>
          <RefreshCw size={17} />
          Retry clarification record
        </button>
      )}
    </section>
  );
}
