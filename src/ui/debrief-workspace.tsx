import { useEffect, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import {
  DebriefListSchema,
  DebriefSchema,
  type Debrief,
  type DebriefInput,
} from '../contracts/debrief.js';
import { ApiError, request } from './api.js';
import { date } from './exercise-format.js';
import { useUnsavedGuard } from './unsaved-guard.js';

const notes = [
  ['participantFeedback', 'Participant feedback (your summary)'],
  ['facilitatorObservations', 'Facilitator observations'],
  ['exerciseDesignNotes', 'Exercise design limitations'],
] as const;
type Notes = Record<(typeof notes)[number][0], string>;
const empty: Notes = {
  participantFeedback: '',
  facilitatorObservations: '',
  exerciseDesignNotes: '',
};

export function DebriefWorkspace({
  runId,
  participants,
  onSessionExpired,
}: {
  runId: string;
  participants: { actorId: string; displayName: string }[];
  onSessionExpired: () => void;
}) {
  const root = '/api/tracks/technical/runs/' + runId + '/debriefs';
  const [records, setRecords] = useState<Debrief[]>([]),
    [draft, setDraft] = useState<Notes>(empty),
    [respondents, setRespondents] = useState<string[]>([]);
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<DebriefInput | null>(null);
  useUnsavedGuard(
    !!pending || respondents.length > 0 || Object.values(draft).some((value) => value.trim()),
  );
  function failure(cause: unknown) {
    if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
    setError(cause instanceof Error ? cause.message : 'Debrief unavailable.');
  }
  async function reload() {
    try {
      setRecords(await request(DebriefListSchema, root));
    } catch (cause) {
      failure(cause);
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  async function save(input: DebriefInput) {
    setPending(input);
    setBusy(true);
    setError('');
    try {
      await request(DebriefSchema, root, input);
      setPending(null);
      setDraft(empty);
      setRespondents([]);
      await reload();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status < 500) setPending(null);
      failure(cause);
    } finally {
      setBusy(false);
    }
  }
  const name = (id: string) =>
    participants.find((participant) => participant.actorId === id)?.displayName ?? id;
  const hasNote = Object.values(draft).some((value) => value.trim());
  return (
    <section className="aar-workspace" aria-label="Debrief">
      <h2>Debrief</h2>
      <p className="muted">
        Record after the run ends and before capturing a snapshot. Entries are append-only: record a
        correction as a new entry, and capture a new snapshot to include it.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {records.map((record) => (
        <div key={record.id} className="report-record">
          <p>
            {date(record.recordedAt)} / {record.actorId} / {record.id}
          </p>
          {notes.map(
            ([key, label]) =>
              record[key].trim() && (
                <p key={key}>
                  <strong>{label}:</strong> {record[key]}
                </p>
              ),
          )}
          {!!record.respondentIds.length && (
            <p>Participants: {record.respondentIds.map(name).join(', ')}</p>
          )}
        </div>
      ))}
      <fieldset className="clarification-form" disabled={busy || !!pending}>
        <legend>New debrief entry</legend>
        {notes.map(([key, label]) => (
          <label key={key}>
            {label}
            <textarea
              rows={3}
              maxLength={4000}
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            />
          </label>
        ))}
        <fieldset>
          <legend>Participants whose feedback is summarised</legend>
          {participants.map((participant) => (
            <label key={participant.actorId} className="clarification-unknown">
              <input
                type="checkbox"
                checked={respondents.includes(participant.actorId)}
                onChange={(e) =>
                  setRespondents(
                    e.target.checked
                      ? [...respondents, participant.actorId]
                      : respondents.filter((id) => id !== participant.actorId),
                  )
                }
              />
              {participant.displayName}
            </label>
          ))}
        </fieldset>
        <button
          disabled={!hasNote || (!!draft.participantFeedback.trim() && !respondents.length)}
          onClick={() =>
            void save({ commandId: crypto.randomUUID(), ...draft, respondentIds: respondents })
          }
        >
          <Save size={17} />
          Record debrief
        </button>
      </fieldset>
      {pending && (
        <button disabled={busy} onClick={() => void save(pending)}>
          <RefreshCw size={17} />
          Retry debrief record
        </button>
      )}
    </section>
  );
}
