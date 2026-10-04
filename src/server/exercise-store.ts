import type { DatabaseSync } from 'node:sqlite';
import {
  ApprovalSchema,
  PreparationSchema,
  ReleaseSchema,
  RunSchema,
  MemberSchema,
  RunActivitySchema,
  type Approval,
  type ExercisePackage,
  type Member,
  type Preparation,
  type Release,
  type Run,
  type RunActivity,
  type Track,
} from '../contracts/exercise.js';
import { contentHash } from './integrity.js';
import { readStored } from './validation.js';
import { checkRunBinding, readPackage } from './exercise-validation.js';

export function migrateExercises(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE exercise_packages (
      id TEXT NOT NULL, revision_id TEXT NOT NULL, track TEXT NOT NULL CHECK(track IN ('technical','operational')),
      payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL,
      PRIMARY KEY(id, revision_id), UNIQUE(id, revision_id, track)
    ) STRICT;
    CREATE TABLE exercise_runs (
      id TEXT PRIMARY KEY, track TEXT NOT NULL, package_id TEXT NOT NULL, package_revision TEXT NOT NULL,
      revision INTEGER NOT NULL CHECK(revision >= 1), state TEXT NOT NULL CHECK(state IN ('draft','active','paused','completed')),
      FOREIGN KEY(package_id, package_revision, track) REFERENCES exercise_packages(id, revision_id, track)
    ) STRICT;
    CREATE TABLE run_members (
      run_id TEXT NOT NULL REFERENCES exercise_runs(id), actor_id TEXT NOT NULL REFERENCES actors(id),
      kind TEXT NOT NULL CHECK(kind IN ('facilitator','participant')), role_id TEXT,
      CHECK((kind = 'facilitator' AND role_id IS NULL) OR (kind = 'participant' AND role_id IS NOT NULL)),
      PRIMARY KEY(run_id, actor_id)
    ) STRICT;
    CREATE TABLE run_preparations (run_id TEXT PRIMARY KEY REFERENCES exercise_runs(id), payload TEXT NOT NULL CHECK(json_valid(payload))) STRICT;
    CREATE TABLE inject_approvals (id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES exercise_runs(id), payload TEXT NOT NULL CHECK(json_valid(payload))) STRICT;
    CREATE TABLE inject_releases (
      id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES exercise_runs(id), inject_id TEXT NOT NULL,
      approval_id TEXT NOT NULL UNIQUE REFERENCES inject_approvals(id), payload TEXT NOT NULL CHECK(json_valid(payload)),
      UNIQUE(run_id, inject_id)
    ) STRICT;
    CREATE TABLE release_recipients (
      release_id TEXT NOT NULL REFERENCES inject_releases(id), actor_id TEXT NOT NULL REFERENCES actors(id),
      PRIMARY KEY(release_id, actor_id)
    ) STRICT;
    CREATE TABLE run_commands (
      run_id TEXT NOT NULL REFERENCES exercise_runs(id), key TEXT NOT NULL, request_hash TEXT NOT NULL,
      result TEXT NOT NULL CHECK(json_valid(result)), PRIMARY KEY(run_id, key)
    ) STRICT;
    CREATE TABLE run_activity (
      sequence INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL REFERENCES exercise_runs(id),
      kind TEXT NOT NULL, actor_id TEXT REFERENCES actors(id), occurred_at TEXT NOT NULL,
      reference_id TEXT, run_revision INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX run_activity_lookup ON run_activity(run_id, sequence);
    CREATE INDEX release_recipient_lookup ON release_recipients(actor_id, release_id);
    PRAGMA user_version = 2;
  `);
}

export class ExerciseStore {
  constructor(private readonly db: DatabaseSync) {}

  seedPackage(value: ExercisePackage): void {
    const definition = readPackage(value);
    const payload = JSON.stringify(definition);
    this.db
      .prepare('INSERT OR IGNORE INTO exercise_packages VALUES (?, ?, ?, ?, ?)')
      .run(definition.id, definition.revisionId, definition.track, payload, contentHash(payload));
  }

  seedRun(id: string, definition: ExercisePackage, members: Member[]): void {
    if (this.run(id)) return;
    const stored = this.package(definition.id, definition.revisionId);
    const run: Run = {
      id,
      track: definition.track,
      packageId: definition.id,
      packageRevisionId: definition.revisionId,
      revision: 1,
      state: 'draft',
    };
    checkRunBinding(run, stored.definition, members);
    this.db
      .prepare('INSERT INTO exercise_runs VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, run.track, run.packageId, run.packageRevisionId, run.revision, run.state);
    for (const member of members)
      this.db
        .prepare('INSERT INTO run_members VALUES (?, ?, ?, ?)')
        .run(id, member.actorId, member.kind, member.roleId);
  }

  package(id: string, revisionId: string): { definition: ExercisePackage; hash: string } {
    const row = this.db
      .prepare('SELECT * FROM exercise_packages WHERE id = ? AND revision_id = ?')
      .get(id, revisionId);
    if (!row || contentHash(String(row.payload)) !== row.content_hash)
      throw new Error('Stored package integrity check failed.');
    const definition = readPackage(JSON.parse(String(row.payload)));
    if (
      definition.id !== row.id ||
      definition.revisionId !== row.revision_id ||
      definition.track !== row.track
    )
      throw new Error('Stored package identity mismatch.');
    return { definition, hash: String(row.content_hash) };
  }

  run(id: string): Run | null {
    const row = this.db.prepare('SELECT * FROM exercise_runs WHERE id = ?').get(id);
    return row
      ? readStored(RunSchema, {
          id: row.id,
          track: row.track,
          packageId: row.package_id,
          packageRevisionId: row.package_revision,
          revision: row.revision,
          state: row.state,
        })
      : null;
  }

  member(runId: string, actorId: string): Member | null {
    return this.members(runId).find((member) => member.actorId === actorId) ?? null;
  }

  members(runId: string): Member[] {
    return this.db
      .prepare(
        'SELECT m.*, a.display_name FROM run_members m JOIN actors a ON a.id = m.actor_id WHERE run_id = ? ORDER BY actor_id',
      )
      .all(runId)
      .map((row) =>
        readStored(MemberSchema, {
          actorId: row.actor_id,
          displayName: row.display_name,
          kind: row.kind,
          roleId: row.role_id,
        }),
      );
  }

  listRunIds(actorId: string, track: Track): string[] {
    return this.db
      .prepare(
        'SELECT r.id FROM exercise_runs r JOIN run_members m ON m.run_id = r.id WHERE m.actor_id = ? AND r.track = ? ORDER BY r.id LIMIT 100',
      )
      .all(actorId, track)
      .map((row) => String(row.id));
  }

  updateRun(run: Run, state: Run['state'] = run.state): Run {
    const result = this.db
      .prepare(
        'UPDATE exercise_runs SET revision = revision + 1, state = ? WHERE id = ? AND revision = ?',
      )
      .run(state, run.id, run.revision);
    if (result.changes !== 1) throw new Error('Concurrent run change.');
    return { ...run, state, revision: run.revision + 1 };
  }

  preparation(runId: string): Preparation | null {
    const row = this.db.prepare('SELECT payload FROM run_preparations WHERE run_id = ?').get(runId);
    return row ? readStored(PreparationSchema, JSON.parse(String(row.payload))) : null;
  }

  savePreparation(runId: string, value: Preparation): void {
    this.db
      .prepare(
        'INSERT INTO run_preparations VALUES (?, ?) ON CONFLICT(run_id) DO UPDATE SET payload = excluded.payload',
      )
      .run(runId, JSON.stringify(value));
  }

  approval(id: string): Approval | null {
    const row = this.db.prepare('SELECT * FROM inject_approvals WHERE id = ?').get(id);
    if (!row) return null;
    const value = readStored(ApprovalSchema, JSON.parse(String(row.payload)));
    if (value.id !== row.id || value.runId !== row.run_id)
      throw new Error('Approval identity mismatch.');
    return value;
  }

  latestApproval(runId: string): Approval | null {
    const row = this.db
      .prepare('SELECT id FROM inject_approvals WHERE run_id = ? ORDER BY rowid DESC LIMIT 1')
      .get(runId);
    return row ? this.approval(String(row.id)) : null;
  }

  saveApproval(value: Approval): void {
    this.db
      .prepare('INSERT INTO inject_approvals VALUES (?, ?, ?)')
      .run(value.id, value.runId, JSON.stringify(value));
  }

  releases(runId: string, actorId?: string): Release[] {
    const rows =
      actorId === undefined
        ? this.db
            .prepare('SELECT payload FROM inject_releases WHERE run_id = ? ORDER BY rowid LIMIT 15')
            .all(runId)
        : this.db
            .prepare(
              'SELECT r.payload FROM inject_releases r JOIN release_recipients m ON m.release_id = r.id WHERE r.run_id = ? AND m.actor_id = ? ORDER BY r.rowid LIMIT 15',
            )
            .all(runId, actorId);
    return rows.map((row) => readStored(ReleaseSchema, JSON.parse(String(row.payload))));
  }

  saveRelease(value: Release): void {
    this.db
      .prepare('INSERT INTO inject_releases VALUES (?, ?, ?, ?, ?)')
      .run(value.id, value.runId, value.injectId, value.approvalId, JSON.stringify(value));
    for (const recipient of value.recipientIds)
      this.db.prepare('INSERT INTO release_recipients VALUES (?, ?)').run(value.id, recipient);
  }

  command(runId: string, key: string): { hash: string; result: unknown } | null {
    const row = this.db
      .prepare('SELECT request_hash, result FROM run_commands WHERE run_id = ? AND key = ?')
      .get(runId, key);
    return row ? { hash: String(row.request_hash), result: JSON.parse(String(row.result)) } : null;
  }

  saveCommand(runId: string, key: string, hash: string, result: unknown): void {
    this.db
      .prepare('INSERT INTO run_commands VALUES (?, ?, ?, ?)')
      .run(runId, key, hash, JSON.stringify(result));
  }

  event(
    run: Run,
    kind: RunActivity[number]['kind'],
    actorId: string | null,
    referenceId: string | null = null,
  ): void {
    this.db
      .prepare(
        'INSERT INTO run_activity (run_id, kind, actor_id, occurred_at, reference_id, run_revision) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(run.id, kind, actorId, new Date().toISOString(), referenceId, run.revision);
  }

  activity(runId: string): RunActivity {
    const events = this.db
      .prepare('SELECT * FROM run_activity WHERE run_id = ? ORDER BY sequence DESC LIMIT 100')
      .all(runId)
      .reverse()
      .map((row) => ({
        sequence: row.sequence,
        runId: row.run_id,
        kind: row.kind,
        actorId: row.actor_id,
        occurredAt: row.occurred_at,
        referenceId: row.reference_id,
        runRevision: row.run_revision,
      }));
    return readStored(RunActivitySchema, events);
  }

  recoverActiveRuns(): void {
    for (const row of this.db
      .prepare("SELECT id FROM exercise_runs WHERE state = 'active'")
      .all()) {
      const run = this.run(String(row.id))!;
      this.event(this.updateRun(run, 'paused'), 'run-recovered', null);
    }
  }
}
