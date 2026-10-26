import type { DatabaseSync } from 'node:sqlite';
import { IntakeSchema, type Intake, type IntakeView } from '../contracts/intake.js';
import type { Actor } from '../contracts/profile.js';
import { contentHash } from './integrity.js';
import { readStored } from './validation.js';

export function migrateIntakes(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE intakes (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES actors(id), current_revision INTEGER NOT NULL) STRICT;
    CREATE TABLE intake_revisions (
      intake_id TEXT NOT NULL REFERENCES intakes(id), revision INTEGER NOT NULL,
      payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL,
      action TEXT NOT NULL, actor_id TEXT NOT NULL REFERENCES actors(id), occurred_at TEXT NOT NULL, rationale TEXT NOT NULL,
      PRIMARY KEY(intake_id, revision)
    ) STRICT;
    CREATE TABLE intake_receipts (
      actor_id TEXT NOT NULL REFERENCES actors(id), command_id TEXT NOT NULL,
      request_hash TEXT NOT NULL, intake_id TEXT NOT NULL, revision INTEGER NOT NULL,
      PRIMARY KEY(actor_id, command_id),
      FOREIGN KEY(intake_id, revision) REFERENCES intake_revisions(intake_id, revision)
    ) STRICT;
    PRAGMA user_version = 5;
  `);
}

export class IntakeStore {
  constructor(private readonly db: DatabaseSync) {}
  owner(id: string): string | null {
    const row = this.db.prepare('SELECT owner_id FROM intakes WHERE id = ?').get(id);
    return row ? String(row.owner_id) : null;
  }
  list(actorId: string) {
    return this.db
      .prepare(
        'SELECT i.id, i.current_revision, r.payload, r.content_hash FROM intakes i JOIN intake_revisions r ON r.intake_id=i.id AND r.revision=i.current_revision WHERE i.owner_id=? ORDER BY r.occurred_at DESC LIMIT 20',
      )
      .all(actorId)
      .map((row) => {
        if (contentHash(String(row.payload)) !== row.content_hash)
          throw new Error('Intake integrity check failed.');
        const draft = readStored(IntakeSchema, JSON.parse(String(row.payload)));
        return {
          id: draft.id,
          revision: draft.revision,
          organisationName: draft.organisationName,
          confirmed: draft.confirmedProfile !== null,
        };
      });
  }
  get(id: string, revision?: number): { draft: Intake; contentHash: string } | null {
    const row =
      revision === undefined
        ? this.db
            .prepare(
              'SELECT r.* FROM intake_revisions r JOIN intakes i ON i.id=r.intake_id AND i.current_revision=r.revision WHERE i.id=?',
            )
            .get(id)
        : this.db
            .prepare('SELECT * FROM intake_revisions WHERE intake_id=? AND revision=?')
            .get(id, revision);
    if (!row) return null;
    if (contentHash(String(row.payload)) !== row.content_hash)
      throw new Error('Intake integrity check failed.');
    return {
      draft: readStored(IntakeSchema, JSON.parse(String(row.payload))),
      contentHash: String(row.content_hash),
    };
  }
  save(draft: Intake, actor: Actor, action: string, rationale: string): void {
    readStored(IntakeSchema, draft);
    if (draft.revision === 1)
      this.db.prepare('INSERT INTO intakes VALUES (?, ?, ?)').run(draft.id, actor.id, 1);
    const payload = JSON.stringify(draft);
    this.db
      .prepare('INSERT INTO intake_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        draft.id,
        draft.revision,
        payload,
        contentHash(payload),
        action,
        actor.id,
        draft.updatedAt,
        rationale,
      );
    this.db
      .prepare('UPDATE intakes SET current_revision=? WHERE id=?')
      .run(draft.revision, draft.id);
  }
  events(id: string): IntakeView['events'] {
    return this.db
      .prepare(
        'SELECT r.*, a.display_name FROM intake_revisions r JOIN actors a ON a.id=r.actor_id WHERE intake_id=? ORDER BY revision',
      )
      .all(id)
      .map((row) => ({
        revision: Number(row.revision),
        action: String(row.action),
        actorName: String(row.display_name),
        at: String(row.occurred_at),
        rationale: String(row.rationale),
      }));
  }
  receipt(actorId: string, commandId: string) {
    const row = this.db
      .prepare('SELECT * FROM intake_receipts WHERE actor_id=? AND command_id=?')
      .get(actorId, commandId);
    return row
      ? {
          requestHash: String(row.request_hash),
          id: String(row.intake_id),
          revision: Number(row.revision),
        }
      : null;
  }
  saveReceipt(actorId: string, commandId: string, requestHash: string, draft: Intake): void {
    this.db
      .prepare('INSERT INTO intake_receipts VALUES (?, ?, ?, ?, ?)')
      .run(actorId, commandId, requestHash, draft.id, draft.revision);
  }
}
