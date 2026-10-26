import type { DatabaseSync } from 'node:sqlite';
import type { ExtractionJob } from '../contracts/extraction.js';
import type { IntakeCommand } from '../contracts/intake.js';

export function migrateExtractions(db: DatabaseSync): void {
  db.exec(`CREATE TABLE extraction_jobs (
    id TEXT PRIMARY KEY, actor_id TEXT NOT NULL REFERENCES actors(id), intake_id TEXT NOT NULL REFERENCES intakes(id),
    command_id TEXT NOT NULL, request_hash TEXT NOT NULL, input_hash TEXT NOT NULL, revision INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('queued','running','succeeded','failed','interrupted')),
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL, message TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
    result TEXT, UNIQUE(actor_id, command_id),
    FOREIGN KEY(intake_id, revision) REFERENCES intake_revisions(intake_id, revision)
  ) STRICT;
  CREATE TABLE extraction_worker (id INTEGER PRIMARY KEY CHECK(id=1), seen_at TEXT NOT NULL) STRICT;
  PRAGMA user_version = 6;`);
}
export class ExtractionStore {
  constructor(private readonly db: DatabaseSync) {}
  get(id: string) {
    const row = this.db.prepare('SELECT * FROM extraction_jobs WHERE id=?').get(id);
    if (!row) return null;
    const job: ExtractionJob = {
      id: String(row.id),
      status: row.status as ExtractionJob['status'],
      requestedRevision: Number(row.revision),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      message: String(row.message),
      inputTokens: Number(row.input_tokens) < 0 ? null : Number(row.input_tokens),
      outputTokens: Number(row.output_tokens) < 0 ? null : Number(row.output_tokens),
    };
    return {
      job,
      actorId: String(row.actor_id),
      intakeId: String(row.intake_id),
      requestHash: String(row.request_hash),
      command: {
        commandId: String(row.command_id),
        expectedRevision: Number(row.revision),
        expectedHash: String(row.input_hash),
      },
    };
  }
  latest(intakeId: string): ExtractionJob | null {
    const row = this.db
      .prepare('SELECT id FROM extraction_jobs WHERE intake_id=? ORDER BY rowid DESC LIMIT 1')
      .get(intakeId);
    return row ? this.get(String(row.id))!.job : null;
  }
  receipt(actorId: string, commandId: string) {
    const row = this.db
      .prepare('SELECT id FROM extraction_jobs WHERE actor_id=? AND command_id=?')
      .get(actorId, commandId);
    return row ? this.get(String(row.id)) : null;
  }
  active() {
    return this.db
      .prepare("SELECT id FROM extraction_jobs WHERE status IN ('queued','running') LIMIT 1")
      .get();
  }
  queued() {
    return this.db
      .prepare("SELECT id FROM extraction_jobs WHERE status='queued' ORDER BY rowid LIMIT 1")
      .get();
  }
  count(id: string) {
    return Number(
      this.db.prepare('SELECT COUNT(*) AS n FROM extraction_jobs WHERE intake_id=?').get(id)?.n,
    );
  }
  create(
    id: string,
    actorId: string,
    intakeId: string,
    command: IntakeCommand,
    requestHash: string,
  ) {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO extraction_jobs
      (id,actor_id,intake_id,command_id,request_hash,input_hash,revision,status,created_at,updated_at,message)
      VALUES (?,?,?,?,?,?,?,'queued',?,?,'Waiting for the local ChatGPT subscription worker.')`,
      )
      .run(
        id,
        actorId,
        intakeId,
        command.commandId,
        requestHash,
        command.expectedHash,
        command.expectedRevision,
        now,
        now,
      );
  }
  update(
    id: string,
    status: ExtractionJob['status'],
    message: string,
    usage = { inputTokens: 0, outputTokens: 0 },
    result?: unknown,
  ) {
    this.db
      .prepare(
        'UPDATE extraction_jobs SET status=?,updated_at=?,message=?,input_tokens=?,output_tokens=?,result=? WHERE id=?',
      )
      .run(
        status,
        new Date().toISOString(),
        message,
        usage.inputTokens,
        usage.outputTokens,
        result === undefined ? null : JSON.stringify(result),
        id,
      );
  }
  heartbeat() {
    this.db
      .prepare('INSERT OR REPLACE INTO extraction_worker VALUES (1,?)')
      .run(new Date().toISOString());
  }
  available() {
    const row = this.db.prepare('SELECT seen_at FROM extraction_worker WHERE id=1').get();
    return !!row && Date.now() - Date.parse(String(row.seen_at)) < 15_000;
  }
  recover() {
    this.db
      .prepare(
        "UPDATE extraction_jobs SET input_tokens=CASE WHEN status='running' THEN -1 ELSE input_tokens END,output_tokens=CASE WHEN status='running' THEN -1 ELSE output_tokens END,status='interrupted',updated_at=?,message='Application restarted. No automatic AI retry; review and request again.' WHERE status IN ('queued','running')",
      )
      .run(new Date().toISOString());
    this.db.exec('DELETE FROM extraction_worker');
  }
  expire() {
    this.db
      .prepare(
        "UPDATE extraction_jobs SET input_tokens=CASE WHEN status='running' THEN -1 ELSE input_tokens END,output_tokens=CASE WHEN status='running' THEN -1 ELSE output_tokens END,status='interrupted',updated_at=?,message='Worker deadline expired. No automatic AI retry; manual review remains available.' WHERE status IN ('queued','running') AND updated_at < ?",
      )
      .run(new Date().toISOString(), new Date(Date.now() - 300_000).toISOString());
  }
}
