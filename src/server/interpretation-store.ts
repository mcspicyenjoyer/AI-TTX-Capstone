import type { DatabaseSync } from 'node:sqlite';
import {
  InterpretationRecordSchema,
  type InterpretationRecord,
} from '../contracts/interpretation.js';
import { contentHash, fingerprint } from './integrity.js';
import { readStored } from './validation.js';

export function migrateInterpretations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE interpretation_revisions (
      id TEXT NOT NULL, revision INTEGER NOT NULL,
      run_id TEXT NOT NULL REFERENCES exercise_runs(id), owner_id TEXT NOT NULL REFERENCES actors(id),
      payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL,
      PRIMARY KEY(id, revision)
    ) STRICT;
    PRAGMA user_version = 8;
  `);
}

export class InterpretationStore {
  constructor(private readonly db: DatabaseSync) {}
  get(id: string): { record: InterpretationRecord; hash: string } | null {
    const row = this.db
      .prepare('SELECT * FROM interpretation_revisions WHERE id=? ORDER BY revision DESC LIMIT 1')
      .get(id);
    if (!row) return null;
    if (contentHash(String(row.payload)) !== row.content_hash)
      throw new Error('Interpretation integrity failure.');
    const record = readStored(InterpretationRecordSchema, JSON.parse(String(row.payload)));
    if (
      record.id !== row.id ||
      record.revision !== row.revision ||
      record.runId !== row.run_id ||
      record.ownerId !== row.owner_id ||
      fingerprint(record.input) !== record.inputHash
    )
      throw new Error('Interpretation identity or input mismatch.');
    return { record, hash: String(row.content_hash) };
  }
  list(runId?: string): InterpretationRecord[] {
    const rows =
      runId === undefined
        ? this.db
            .prepare('SELECT id FROM interpretation_revisions GROUP BY id ORDER BY MIN(rowid)')
            .all()
        : this.db
            .prepare(
              'SELECT id FROM interpretation_revisions WHERE run_id=? GROUP BY id ORDER BY MIN(rowid)',
            )
            .all(runId);
    return rows.map((row) => this.get(String(row.id))!.record);
  }
  save(record: InterpretationRecord): void {
    readStored(InterpretationRecordSchema, record);
    const payload = JSON.stringify(record);
    this.db
      .prepare('INSERT INTO interpretation_revisions VALUES (?,?,?,?,?,?)')
      .run(record.id, record.revision, record.runId, record.ownerId, payload, contentHash(payload));
  }
  recover(): void {
    for (const record of this.list().filter((item) => item.status === 'running')) {
      this.save({
        ...record,
        revision: record.revision + 1,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        error: 'Interpretation interrupted. Continue manually or request another explicitly.',
      });
    }
  }
}
