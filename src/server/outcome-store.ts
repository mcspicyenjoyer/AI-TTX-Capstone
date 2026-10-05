import type { DatabaseSync } from 'node:sqlite';
import {
  TeamResponseSchema,
  DispositionSchema,
  ClosureSchema,
  CompletionSchema,
  type TeamResponse,
  type Disposition,
  type Closure,
  type Completion,
} from '../contracts/outcomes.js';
import { readStored } from './validation.js';

export function migrateOutcomes(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE team_responses (
      sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
      release_id TEXT NOT NULL REFERENCES inject_releases(id),
      actor_id TEXT NOT NULL REFERENCES actors(id), revision INTEGER NOT NULL,
      payload TEXT NOT NULL CHECK(json_valid(payload)), UNIQUE(release_id, revision)
    ) STRICT;
    CREATE TABLE response_dispositions (
      sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
      release_id TEXT NOT NULL REFERENCES inject_releases(id),
      response_id TEXT REFERENCES team_responses(id),
      payload TEXT NOT NULL CHECK(json_valid(payload))
    ) STRICT;
    CREATE TABLE position_closures (
      id TEXT PRIMARY KEY, release_id TEXT NOT NULL UNIQUE REFERENCES inject_releases(id),
      disposition_id TEXT NOT NULL UNIQUE REFERENCES response_dispositions(id),
      payload TEXT NOT NULL CHECK(json_valid(payload))
    ) STRICT;
    CREATE TABLE run_completions (
      id TEXT PRIMARY KEY, run_id TEXT NOT NULL UNIQUE REFERENCES exercise_runs(id),
      payload TEXT NOT NULL CHECK(json_valid(payload))
    ) STRICT;
    CREATE INDEX response_release_lookup ON team_responses(release_id, sequence);
    CREATE INDEX disposition_release_lookup ON response_dispositions(release_id, sequence);
    PRAGMA user_version = 4;
  `);
}

export class OutcomeStore {
  constructor(private readonly db: DatabaseSync) {}

  responses(releaseId: string): TeamResponse[] {
    return this.db
      .prepare('SELECT * FROM team_responses WHERE release_id = ? ORDER BY sequence')
      .all(releaseId)
      .map((row) => {
        const value = readStored(TeamResponseSchema, JSON.parse(String(row.payload)));
        if (
          value.id !== row.id ||
          value.releaseId !== row.release_id ||
          value.actorId !== row.actor_id ||
          value.revision !== row.revision
        )
          throw new Error('Response identity mismatch.');
        return value;
      });
  }

  saveResponse(value: TeamResponse): void {
    this.db
      .prepare(
        'INSERT INTO team_responses (id, release_id, actor_id, revision, payload) VALUES (?, ?, ?, ?, ?)',
      )
      .run(value.id, value.releaseId, value.actorId, value.revision, JSON.stringify(value));
  }

  dispositions(releaseId: string): Disposition[] {
    return this.db
      .prepare('SELECT * FROM response_dispositions WHERE release_id = ? ORDER BY sequence')
      .all(releaseId)
      .map((row) => {
        const value = readStored(DispositionSchema, JSON.parse(String(row.payload)));
        if (
          value.id !== row.id ||
          value.releaseId !== row.release_id ||
          value.responseId !== row.response_id
        )
          throw new Error('Disposition identity mismatch.');
        return value;
      });
  }

  saveDisposition(value: Disposition): void {
    this.db
      .prepare(
        'INSERT INTO response_dispositions (id, release_id, response_id, payload) VALUES (?, ?, ?, ?)',
      )
      .run(value.id, value.releaseId, value.responseId, JSON.stringify(value));
  }

  closure(releaseId: string): Closure | null {
    const row = this.db
      .prepare('SELECT * FROM position_closures WHERE release_id = ?')
      .get(releaseId);
    if (!row) return null;
    const value = readStored(ClosureSchema, JSON.parse(String(row.payload)));
    if (
      value.id !== row.id ||
      value.releaseId !== row.release_id ||
      value.dispositionId !== row.disposition_id
    )
      throw new Error('Closure identity mismatch.');
    return value;
  }

  saveClosure(value: Closure): void {
    this.db
      .prepare('INSERT INTO position_closures VALUES (?, ?, ?, ?)')
      .run(value.id, value.releaseId, value.dispositionId, JSON.stringify(value));
  }

  completion(runId: string): Completion | null {
    const row = this.db.prepare('SELECT * FROM run_completions WHERE run_id = ?').get(runId);
    if (!row) return null;
    const value = readStored(CompletionSchema, JSON.parse(String(row.payload)));
    if (value.id !== row.id || value.runId !== row.run_id)
      throw new Error('Completion identity mismatch.');
    return value;
  }

  saveCompletion(value: Completion): void {
    this.db
      .prepare('INSERT INTO run_completions VALUES (?, ?, ?)')
      .run(value.id, value.runId, JSON.stringify(value));
  }
}
