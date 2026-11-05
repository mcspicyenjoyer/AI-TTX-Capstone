import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { ImageRequestSchema, type ImageRequest } from '../contracts/artefact-images.js';
import { contentHash } from './integrity.js';
import { readStored } from './validation.js';

export function migrateArtefactImages(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE artefact_images (
      id TEXT PRIMARY KEY, package_id TEXT NOT NULL REFERENCES package_drafts(id),
      payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL, png BLOB
    ) STRICT;
    CREATE TABLE artefact_image_history (
      image_id TEXT NOT NULL REFERENCES artefact_images(id), revision INTEGER NOT NULL,
      payload TEXT NOT NULL CHECK(json_valid(payload)), content_hash TEXT NOT NULL,
      PRIMARY KEY(image_id, revision)
    ) STRICT;
    PRAGMA user_version = 12;
  `);
}
export class ArtefactImageStore {
  constructor(private readonly db: DatabaseSync) {}
  get(id: string): ImageRequest | null {
    const row = this.db
      .prepare('SELECT id,package_id,payload,content_hash FROM artefact_images WHERE id=?')
      .get(id);
    if (!row) return null;
    if (contentHash(String(row.payload)) !== row.content_hash)
      throw new Error('Image request integrity failure.');
    const job = readStored(ImageRequestSchema, JSON.parse(String(row.payload)));
    if (job.id !== row.id || job.packageId !== row.package_id)
      throw new Error('Image request identity mismatch.');
    return job;
  }
  list(packageId?: string): ImageRequest[] {
    const rows =
      packageId === undefined
        ? this.db.prepare('SELECT id FROM artefact_images ORDER BY rowid').all()
        : this.db
            .prepare('SELECT id FROM artefact_images WHERE package_id=? ORDER BY rowid')
            .all(packageId);
    return rows.map((row) => this.get(String(row.id))!);
  }
  save(job: ImageRequest, png?: Buffer): void {
    readStored(ImageRequestSchema, job);
    const previous = this.get(job.id);
    if (previous && ['ready', 'failed'].includes(previous.status))
      throw new Error('Final image requests are immutable.');
    if (
      png &&
      (previous?.status !== 'running' ||
        job.status !== 'ready' ||
        !job.image ||
        createHash('sha256').update(png).digest('hex') !== job.image.sha256)
    )
      throw new Error('Image bytes do not match the result.');
    const payload = JSON.stringify(job),
      hash = contentHash(payload);
    this.db
      .prepare(
        'INSERT INTO artefact_images VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,content_hash=excluded.content_hash,png=excluded.png',
      )
      .run(job.id, job.packageId, payload, hash, png ?? null);
    this.db
      .prepare('INSERT INTO artefact_image_history VALUES (?,?,?,?)')
      .run(job.id, job.revision, payload, hash);
  }
  bytes(id: string): Buffer {
    const job = this.get(id);
    const row = this.db.prepare('SELECT png FROM artefact_images WHERE id=?').get(id);
    if (!job?.image || job.status !== 'ready' || !(row?.png instanceof Uint8Array))
      throw new Error('Image unavailable.');
    const bytes = Buffer.from(row.png);
    if (
      bytes.length !== job.image.byteLength ||
      createHash('sha256').update(bytes).digest('hex') !== job.image.sha256
    )
      throw new Error('Image integrity failure.');
    return bytes;
  }
  expire(restart = false): void {
    for (const job of this.list().filter(
      (job) =>
        job.status === 'running' && (restart || Date.now() - Date.parse(job.updatedAt) > 300_000),
    )) {
      this.save({
        ...job,
        revision: job.revision + 1,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        error:
          'Image generation interrupted or timed out. No automatic retry; the text remains available.',
      });
    }
  }
}
