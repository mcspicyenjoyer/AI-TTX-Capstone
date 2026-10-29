import type { DatabaseSync } from 'node:sqlite';
import { DebriefSchema, type Debrief } from '../contracts/debrief.js';
import { contentHash } from './integrity.js';
import { readStored } from './validation.js';

// Additive v11 table: append-only debrief entries for completed runs.
export function migrateDebriefs(db: DatabaseSync): void {
  db.exec(`CREATE TABLE run_debriefs (
    id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES exercise_runs(id),
    payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL
  ) STRICT;
  PRAGMA user_version = 11;`);
}
export class DebriefStore {
  constructor(private readonly db: DatabaseSync) {}
  list(runId: string): Debrief[] {
    return this.db
      .prepare('SELECT * FROM run_debriefs WHERE run_id=? ORDER BY rowid')
      .all(runId)
      .map((row) => {
        if (contentHash(String(row.payload)) !== row.content_hash)
          throw new Error('Debrief integrity failure.');
        const record = readStored(DebriefSchema, JSON.parse(String(row.payload)));
        if (record.id !== row.id || record.runId !== row.run_id)
          throw new Error('Debrief identity mismatch.');
        return record;
      });
  }
  save(record: Debrief) {
    readStored(DebriefSchema, record);
    const payload = JSON.stringify(record);
    this.db
      .prepare('INSERT INTO run_debriefs VALUES (?,?,?,?)')
      .run(record.id, record.runId, payload, contentHash(payload));
  }
}
