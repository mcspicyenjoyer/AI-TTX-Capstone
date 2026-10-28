import type { DatabaseSync } from 'node:sqlite';
import { ClarificationSchema, type Clarification } from '../contracts/clarification.js';
import { contentHash } from './integrity.js';
import { readStored } from './validation.js';
export class ClarificationStore {
  constructor(private readonly db: DatabaseSync) {}
  list(runId: string): Clarification[] {
    return this.db
      .prepare('SELECT * FROM clarification_records WHERE run_id=? ORDER BY rowid')
      .all(runId)
      .map((row) => {
        if (contentHash(String(row.payload)) !== row.content_hash)
          throw new Error('Clarification integrity failure.');
        const record = readStored(ClarificationSchema, JSON.parse(String(row.payload)));
        if (record.id !== row.id || record.runId !== row.run_id)
          throw new Error('Clarification identity mismatch.');
        return record;
      });
  }
  save(record: Clarification) {
    readStored(ClarificationSchema, record);
    const payload = JSON.stringify(record);
    this.db
      .prepare('INSERT INTO clarification_records VALUES (?,?,?,?)')
      .run(record.id, record.runId, payload, contentHash(payload));
  }
}
