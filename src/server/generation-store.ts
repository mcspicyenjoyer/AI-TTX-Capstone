import type { DatabaseSync } from 'node:sqlite';
import { PackageDraftSchema, type PackageDraft } from '../contracts/generation.js';
import { contentHash } from './integrity.js';
import { readStored } from './validation.js';

export function migrateGeneration(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE package_drafts (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES actors(id),
      payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL
    ) STRICT;
    CREATE TABLE package_draft_history (
      draft_id TEXT NOT NULL REFERENCES package_drafts(id), revision INTEGER NOT NULL,
      action TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL,
      PRIMARY KEY(draft_id, revision)
    ) STRICT;
    CREATE TABLE package_draft_commands (
      actor_id TEXT NOT NULL REFERENCES actors(id), command_id TEXT NOT NULL,
      request_hash TEXT NOT NULL, draft_id TEXT NOT NULL REFERENCES package_drafts(id),
      PRIMARY KEY(actor_id, command_id)
    ) STRICT;
    PRAGMA user_version = 7;
  `);
}

export class GenerationStore {
  constructor(private readonly db: DatabaseSync) {}

  get(id: string): { draft: PackageDraft; hash: string } | null {
    const row = this.db.prepare('SELECT * FROM package_drafts WHERE id=?').get(id);
    if (!row) return null;
    if (contentHash(String(row.payload)) !== row.content_hash)
      throw new Error('Package draft integrity failure.');
    const draft = readStored(PackageDraftSchema, JSON.parse(String(row.payload)));
    if (draft.id !== row.id || draft.ownerId !== row.owner_id)
      throw new Error('Package draft identity mismatch.');
    return { draft, hash: String(row.content_hash) };
  }

  list(ownerId?: string): PackageDraft[] {
    const rows =
      ownerId === undefined
        ? this.db.prepare('SELECT id FROM package_drafts ORDER BY rowid').all()
        : this.db
            .prepare('SELECT id FROM package_drafts WHERE owner_id=? ORDER BY rowid')
            .all(ownerId);
    return rows.map((row) => this.get(String(row.id))!.draft);
  }

  save(draft: PackageDraft, action: string): void {
    readStored(PackageDraftSchema, draft);
    const payload = JSON.stringify(draft),
      hash = contentHash(payload);
    this.db
      .prepare(
        'INSERT INTO package_drafts VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,content_hash=excluded.content_hash',
      )
      .run(draft.id, draft.ownerId, payload, hash);
    this.db
      .prepare('INSERT INTO package_draft_history VALUES (?,?,?,?,?)')
      .run(draft.id, draft.revision, action, payload, hash);
  }

  receipt(actorId: string, commandId: string): { hash: string; id: string } | null {
    const row = this.db
      .prepare(
        'SELECT request_hash,draft_id FROM package_draft_commands WHERE actor_id=? AND command_id=?',
      )
      .get(actorId, commandId);
    return row ? { hash: String(row.request_hash), id: String(row.draft_id) } : null;
  }

  record(actorId: string, commandId: string, hash: string, id: string): void {
    this.db
      .prepare('INSERT INTO package_draft_commands VALUES (?,?,?,?)')
      .run(actorId, commandId, hash, id);
  }

  isFrozen(id: string, packageHash: string): boolean {
    const draft = this.get(id)?.draft;
    return draft?.status === 'frozen' && draft.frozenPackageHash === packageHash;
  }

  recover(): void {
    for (const draft of this.list().filter((item) => item.status === 'running')) {
      this.save(
        {
          ...draft,
          revision: draft.revision + 1,
          status: 'failed',
          error: 'Generation interrupted. No automatic retry; request a new draft explicitly.',
          updatedAt: new Date().toISOString(),
        },
        'interrupted',
      );
    }
  }
}
