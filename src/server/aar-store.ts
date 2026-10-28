import type { DatabaseSync } from 'node:sqlite';
import { AarRecordSchema, type AarRecord, type AarView } from '../contracts/aar.js';
import { contentHash } from './integrity.js';
import { readStored } from './validation.js';

export function migrateAar(db: DatabaseSync): void {
  db.exec(`CREATE TABLE aar_revisions (
    id TEXT NOT NULL, revision INTEGER NOT NULL,
    run_id TEXT NOT NULL REFERENCES exercise_runs(id), owner_id TEXT NOT NULL REFERENCES actors(id),
    snapshot_id TEXT NOT NULL REFERENCES record_reports(id),
    payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL,
    PRIMARY KEY(id,revision)
  ) STRICT;
  CREATE TABLE clarification_records (
    id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES exercise_runs(id),
    payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL
  ) STRICT;
  PRAGMA user_version = 10;`);
}
export class AarStore {
  constructor(private readonly db: DatabaseSync) {}
  get(id: string): AarView | null {
    const row = this.db
      .prepare('SELECT * FROM aar_revisions WHERE id=? ORDER BY revision DESC LIMIT 1')
      .get(id);
    if (!row) return null;
    if (contentHash(String(row.payload)) !== row.content_hash)
      throw new Error('AAR integrity failure.');
    const record = readStored(AarRecordSchema, JSON.parse(String(row.payload)));
    if (
      record.id !== row.id ||
      record.revision !== row.revision ||
      record.runId !== row.run_id ||
      record.ownerId !== row.owner_id ||
      record.snapshotId !== row.snapshot_id
    )
      throw new Error('AAR identity mismatch.');
    return { record, hash: String(row.content_hash) };
  }
  list(): AarRecord[] {
    return this.db
      .prepare('SELECT id FROM aar_revisions GROUP BY id ORDER BY MIN(rowid)')
      .all()
      .map((row) => this.get(String(row.id))!.record);
  }
  save(record: AarRecord): void {
    readStored(AarRecordSchema, record);
    const payload = JSON.stringify(record);
    this.db
      .prepare('INSERT INTO aar_revisions VALUES (?,?,?,?,?,?,?)')
      .run(
        record.id,
        record.revision,
        record.runId,
        record.ownerId,
        record.snapshotId,
        payload,
        contentHash(payload),
      );
  }
  fail(record: AarRecord, error: string): void {
    const at = new Date().toISOString();
    this.save({
      ...record,
      revision: record.revision + 1,
      status: 'failed',
      error,
      updatedAt: at,
      finishedAt: at,
    });
  }
  recover(): void {
    for (const record of this.list().filter((r) => r.status === 'running'))
      this.fail(
        record,
        'AAR attempt interrupted. Usage may be unknown. Continue manually; no automatic retry.',
      );
  }
}
