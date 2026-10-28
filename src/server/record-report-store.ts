import type { DatabaseSync } from 'node:sqlite';
import {
  RecordReportSchema,
  checkReportReferences,
  type RecordReport,
  type RecordReportView,
} from '../contracts/record-report.js';
import { contentHash } from './integrity.js';
import { readStored } from './validation.js';

export function migrateRecordReports(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE record_reports (
      id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES exercise_runs(id),
      owner_id TEXT NOT NULL REFERENCES actors(id), command_id TEXT NOT NULL,
      created_at TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL,
      UNIQUE(run_id, command_id)
    ) STRICT;
    PRAGMA user_version = 9;
  `);
}

export class RecordReportStore {
  constructor(private readonly db: DatabaseSync) {}
  get(id: string): RecordReportView | null {
    const row = this.db.prepare('SELECT * FROM record_reports WHERE id=?').get(id);
    if (!row) return null;
    if (contentHash(String(row.payload)) !== row.content_hash)
      throw new Error('Record report integrity failure.');
    const report = readStored(RecordReportSchema, JSON.parse(String(row.payload)));
    if (
      report.id !== row.id ||
      report.runId !== row.run_id ||
      report.ownerId !== row.owner_id ||
      report.createdAt !== row.created_at
    )
      throw new Error('Record report identity mismatch.');
    checkReportReferences(report);
    return { report, hash: String(row.content_hash) };
  }
  list(runId: string, ownerId: string) {
    return this.db
      .prepare('SELECT id FROM record_reports WHERE run_id=? AND owner_id=? ORDER BY rowid')
      .all(runId, ownerId)
      .map((row) => {
        const view = this.get(String(row.id))!;
        return { id: view.report.id, createdAt: view.report.createdAt, hash: view.hash };
      });
  }
  receipt(runId: string, commandId: string): string | null {
    const row = this.db
      .prepare('SELECT id FROM record_reports WHERE run_id=? AND command_id=?')
      .get(runId, commandId);
    return row ? String(row.id) : null;
  }
  save(report: RecordReport, commandId: string): void {
    readStored(RecordReportSchema, report);
    checkReportReferences(report);
    const payload = JSON.stringify(report);
    if (Buffer.byteLength(payload) > 8_000_000)
      throw new Error('Record report exceeds the bounded snapshot size.');
    this.db
      .prepare('INSERT INTO record_reports VALUES (?,?,?,?,?,?,?)')
      .run(
        report.id,
        report.runId,
        report.ownerId,
        commandId,
        report.createdAt,
        payload,
        contentHash(payload),
      );
  }
}
