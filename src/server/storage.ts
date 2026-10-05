import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import type { Actor, Activity, Confirmation, Profile, ProfileList } from '../contracts/profile.js';
import { AppError } from './errors.js';
import { readProfile } from './validation.js';
import { contentHash } from './integrity.js';
import { ExerciseStore, migrateExercises, migrateStep0 } from './exercise-store.js';
export { contentHash } from './integrity.js';

export class Store {
  private readonly db: DatabaseSync;
  readonly exercises: ExerciseStore;

  constructor(path: string) {
    this.db = new DatabaseSync(path, { timeout: 5000 });
    this.db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
    const version = this.db.prepare('PRAGMA user_version').get()?.user_version;
    if (version !== 0 && version !== 1 && version !== 2 && version !== 3) {
      this.db.close();
      throw new Error('Unsupported database version. No migration was performed.');
    }
    if (version === 0)
      this.transaction(() => {
        this.db.exec(`
        CREATE TABLE actors (id TEXT PRIMARY KEY, display_name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('facilitator','participant')), username TEXT NOT NULL UNIQUE, code_hash TEXT NOT NULL) STRICT;
        CREATE TABLE profile_revisions (profile_id TEXT NOT NULL, revision_id TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL, PRIMARY KEY(profile_id, revision_id)) STRICT;
        CREATE TABLE profiles (id TEXT PRIMARY KEY, current_revision TEXT NOT NULL, FOREIGN KEY(id, current_revision) REFERENCES profile_revisions(profile_id, revision_id)) STRICT;
        CREATE TABLE reviewers (actor_id TEXT NOT NULL REFERENCES actors(id), profile_id TEXT NOT NULL REFERENCES profiles(id), PRIMARY KEY(actor_id, profile_id)) STRICT;
        CREATE TABLE confirmations (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, revision_id TEXT NOT NULL, content_hash TEXT NOT NULL, actor_id TEXT NOT NULL REFERENCES actors(id), confirmed_at TEXT NOT NULL, UNIQUE(profile_id, revision_id), FOREIGN KEY(profile_id, revision_id) REFERENCES profile_revisions(profile_id, revision_id)) STRICT;
        CREATE TABLE activity (sequence INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, profile_id TEXT NOT NULL, revision_id TEXT NOT NULL, actor_id TEXT NOT NULL REFERENCES actors(id), occurred_at TEXT NOT NULL) STRICT;
        PRAGMA user_version = 1;
      `);
      });
    if (version < 2) this.transaction(() => migrateExercises(this.db));
    if (version < 3) this.transaction(() => migrateStep0(this.db));
    this.exercises = new ExerciseStore(this.db);
  }

  transaction<T>(operation: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = operation();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  hasActors(): boolean {
    return Number(this.db.prepare('SELECT COUNT(*) AS count FROM actors').get()?.count) > 0;
  }

  addActor(actor: Actor, username: string, codeHash: string): void {
    this.db
      .prepare('INSERT OR IGNORE INTO actors VALUES (?, ?, ?, ?, ?)')
      .run(actor.id, actor.displayName, actor.role, username, codeHash);
  }

  seed(profile: Profile, accounts: { actor: Actor; username: string; codeHash: string }[]): void {
    readProfile(profile);
    this.transaction(() => {
      for (const account of accounts) {
        this.db
          .prepare('INSERT OR IGNORE INTO actors VALUES (?, ?, ?, ?, ?)')
          .run(
            account.actor.id,
            account.actor.displayName,
            account.actor.role,
            account.username,
            account.codeHash,
          );
      }
      // Existing demonstration records are never replaced by fixture changes.
      if (this.db.prepare('SELECT id FROM profiles WHERE id = ?').get(profile.profileId)) return;
      const payload = JSON.stringify(profile);
      this.db
        .prepare('INSERT INTO profile_revisions VALUES (?, ?, ?, ?)')
        .run(profile.profileId, profile.revisionId, payload, contentHash(payload));
      this.db
        .prepare('INSERT INTO profiles VALUES (?, ?)')
        .run(profile.profileId, profile.revisionId);
      for (const account of accounts.filter((account) => account.actor.role === 'facilitator')) {
        this.db
          .prepare('INSERT INTO reviewers VALUES (?, ?)')
          .run(account.actor.id, profile.profileId);
      }
    });
  }

  loginIdentity(username: string): { actor: Actor; codeHash: string } | null {
    const row = this.db.prepare('SELECT * FROM actors WHERE username = ?').get(username);
    return row
      ? {
          actor: {
            id: String(row.id),
            displayName: String(row.display_name),
            role: row.role as Actor['role'],
          },
          codeHash: String(row.code_hash),
        }
      : null;
  }

  mayReview(actorId: string, profileId: string): boolean {
    return !!this.db
      .prepare('SELECT 1 FROM reviewers WHERE actor_id = ? AND profile_id = ?')
      .get(actorId, profileId);
  }

  listProfiles(actorId: string): ProfileList {
    const rows = this.db
      .prepare(
        'SELECT r.payload FROM profiles p JOIN reviewers m ON m.profile_id = p.id JOIN profile_revisions r ON r.profile_id = p.id AND r.revision_id = p.current_revision WHERE m.actor_id = ? ORDER BY p.id LIMIT 100',
      )
      .all(actorId);
    return rows.map((row) => {
      const profile = readProfile(JSON.parse(String(row.payload)));
      return {
        profileId: profile.profileId,
        revisionId: profile.revisionId,
        organisationName: profile.organisationName,
      };
    });
  }

  profile(profileId: string, revisionId: string): { profile: Profile; contentHash: string } | null {
    const row = this.db
      .prepare(
        'SELECT payload, content_hash FROM profile_revisions WHERE profile_id = ? AND revision_id = ?',
      )
      .get(profileId, revisionId);
    if (!row) return null;
    if (contentHash(String(row.payload)) !== row.content_hash)
      throw new Error('Stored profile integrity check failed.');
    return {
      profile: readProfile(JSON.parse(String(row.payload))),
      contentHash: String(row.content_hash),
    };
  }

  isCurrent(profileId: string, revisionId: string): boolean {
    return !!this.db
      .prepare('SELECT 1 FROM profiles WHERE id = ? AND current_revision = ?')
      .get(profileId, revisionId);
  }

  confirmation(profileId: string, revisionId: string): Confirmation | null {
    const row = this.db
      .prepare(
        'SELECT c.*, a.display_name, a.role FROM confirmations c JOIN actors a ON a.id = c.actor_id WHERE profile_id = ? AND revision_id = ?',
      )
      .get(profileId, revisionId);
    return row
      ? {
          id: String(row.id),
          profileId,
          revisionId,
          contentHash: String(row.content_hash),
          confirmedBy: {
            id: String(row.actor_id),
            displayName: String(row.display_name),
            role: row.role as Actor['role'],
          },
          confirmedAt: String(row.confirmed_at),
          acknowledgedUncertainties: true,
        }
      : null;
  }

  saveConfirmation(
    profileId: string,
    revisionId: string,
    hash: string,
    actor: Actor,
  ): Confirmation {
    const id = `confirmation-${randomUUID()}`;
    const at = new Date().toISOString();
    this.db
      .prepare('INSERT INTO confirmations VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, profileId, revisionId, hash, actor.id, at);
    this.db
      .prepare(
        'INSERT INTO activity (kind, profile_id, revision_id, actor_id, occurred_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run('profile-confirmed', profileId, revisionId, actor.id, at);
    const result = this.confirmation(profileId, revisionId);
    if (!result) throw new AppError(500, 'STORAGE_ERROR', 'The confirmation could not be saved.');
    return result;
  }

  activity(profileId: string): Activity {
    return this.db
      .prepare(
        'SELECT e.*, a.display_name FROM activity e JOIN actors a ON a.id = e.actor_id WHERE profile_id = ? ORDER BY sequence DESC LIMIT 100',
      )
      .all(profileId)
      .map((row) => ({
        sequence: Number(row.sequence),
        kind: 'profile-confirmed',
        profileId: String(row.profile_id),
        revisionId: String(row.revision_id),
        actorName: String(row.display_name),
        occurredAt: String(row.occurred_at),
      }));
  }

  close(): void {
    this.db.close();
  }
}
