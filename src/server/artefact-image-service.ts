import { randomUUID } from 'node:crypto';
import type { Actor } from '../contracts/profile.js';
import {
  imagePromptVersion,
  ImageResultSchema,
  type GenerateImage,
  type AttachImage,
  type ImageRequest,
} from '../contracts/artefact-images.js';
import type { PackageDraftView } from '../contracts/generation.js';
import { GenerationService } from './generation-service.js';
import { ExerciseService } from './exercise-service.js';
import { Store } from './storage.js';
import { AppError } from './errors.js';
import { fingerprint } from './integrity.js';
import { artefactImagePrompt, checkedPng, imageSourceHash } from './artefact-image-content.js';
import { readStored } from './validation.js';

function conflict(message: string): never {
  throw new AppError(409, 'IMAGE_CONFLICT', message);
}
export class ArtefactImageService {
  constructor(
    private readonly store: Store,
    private readonly generation: GenerationService,
    private readonly enabled = false,
  ) {}
  private editable(actor: Actor, id: string, input: GenerateImage): PackageDraftView {
    const view = this.generation.get(actor, id);
    if (
      view.draft.status !== 'review' ||
      view.draft.revision !== input.expectedRevision ||
      view.hash !== input.expectedHash
    )
      conflict('The package changed or is frozen. Review its current revision first.');
    if (!view.draft.plan?.positions[input.position - 1]?.artefacts?.[input.artefactIndex])
      conflict('Select a saved story message first.');
    return view;
  }
  private replay(actor: Actor, id: string, input: GenerateImage, hash: string) {
    this.generation.get(actor, id);
    const receipt = this.store.generation.receipt(actor.id, input.commandId);
    if (!receipt) return null;
    if (receipt.hash !== hash || receipt.id !== id)
      conflict('This command key was already used for different content.');
    return this.generation.get(actor, id);
  }
  generate(actor: Actor, id: string, input: GenerateImage): PackageDraftView {
    return this.store.transaction(() => {
      const hash = fingerprint({ action: 'generate-image', id, input });
      const replay = this.replay(actor, id, input, hash);
      if (replay) return replay;
      const { draft } = this.editable(actor, id, input);
      if (!this.enabled) conflict('Subscription image generation is disabled.');
      this.store.artefactImages.expire();
      if (
        this.store.artefactImages.list().some((job) => ['queued', 'running'].includes(job.status))
      )
        conflict('An image request is already pending.');
      if (this.store.artefactImages.list(id).length >= 10)
        conflict('The ten-image-request limit for this package has been reached.');
      const position = draft.plan!.positions[input.position - 1]!;
      const at = new Date().toISOString();
      this.store.artefactImages.save({
        id: `image-${randomUUID()}`,
        ownerId: actor.id,
        packageId: id,
        revision: 1,
        expectedRevision: draft.revision,
        expectedHash: input.expectedHash,
        position: input.position,
        artefactIndex: input.artefactIndex,
        sourceHash: imageSourceHash(position, input.artefactIndex),
        promptVersion: imagePromptVersion,
        prompt: artefactImagePrompt(position, input.artefactIndex),
        status: 'queued',
        createdAt: at,
        updatedAt: at,
        error: null,
        image: null,
        inputTokens: null,
        outputTokens: null,
      });
      this.store.generation.record(actor.id, input.commandId, hash, id);
      return this.generation.get(actor, id);
    });
  }
  private current(job: ImageRequest) {
    return this.editable(this.store.actor(job.ownerId)!, job.packageId, {
      ...job,
      commandId: job.id,
    });
  }
  private fail(job: ImageRequest, error: string) {
    this.store.artefactImages.save({
      ...job,
      status: 'failed',
      revision: job.revision + 1,
      updatedAt: new Date().toISOString(),
      error,
    });
  }
  claim() {
    if (!this.enabled) return null;
    return this.store.transaction(() => {
      this.store.artefactImages.expire();
      if (this.store.artefactImages.list().some((job) => job.status === 'running')) return null;
      const job = this.store.artefactImages.list().find((job) => job.status === 'queued');
      if (!job) return null;
      try {
        this.current(job);
      } catch {
        this.fail(job, 'The package changed before image generation. No automatic retry.');
        return null;
      }
      this.store.artefactImages.save({
        ...job,
        revision: job.revision + 1,
        status: 'running',
        updatedAt: new Date().toISOString(),
      });
      return { id: job.id, prompt: job.prompt, promptVersion: job.promptVersion };
    });
  }
  complete(value: unknown): { saved: boolean } {
    const input = readStored(ImageResultSchema, value);
    return this.store.transaction(() => {
      this.store.artefactImages.expire();
      const job = this.store.artefactImages.get(input.id);
      if (!job || job.status !== 'running') return { saved: false };
      const usage = {
        inputTokens: input.inputTokens < 0 ? null : input.inputTokens,
        outputTokens: input.outputTokens < 0 ? null : input.outputTokens,
      };
      try {
        this.current(job);
        if (input.failed || !input.pngBase64) throw new Error('Provider failure');
        const raw = Buffer.from(input.pngBase64, 'base64');
        if (raw.toString('base64') !== input.pngBase64) throw new Error('Invalid image encoding');
        const image = checkedPng(raw);
        this.store.artefactImages.save(
          {
            ...job,
            revision: job.revision + 1,
            status: 'ready',
            updatedAt: new Date().toISOString(),
            image: {
              id: job.id,
              mimeType: 'image/png',
              sha256: image.sha256,
              width: image.width,
              height: image.height,
              byteLength: image.png.length,
            },
            ...usage,
          },
          image.png,
        );
        return { saved: true };
      } catch {
        this.fail(
          { ...job, ...usage },
          'Image generation failed, returned an invalid image, or the package changed. Text remains available; no automatic retry.',
        );
        return { saved: false };
      }
    });
  }
  attach(actor: Actor, id: string, input: AttachImage): PackageDraftView {
    return this.store.transaction(() => {
      const hash = fingerprint({ action: 'attach-image', id, input });
      const replay = this.replay(actor, id, input, hash);
      if (replay) return replay;
      const { draft } = this.editable(actor, id, input);
      const next = structuredClone(draft);
      next.images = (next.images ?? []).filter(
        (image) => image.position !== input.position || image.artefactIndex !== input.artefactIndex,
      );
      if (input.imageId) {
        const job = this.store.artefactImages.get(input.imageId);
        const sourceHash = imageSourceHash(
          draft.plan!.positions[input.position - 1]!,
          input.artefactIndex,
        );
        if (
          !job?.image ||
          job.status !== 'ready' ||
          job.ownerId !== actor.id ||
          job.packageId !== id ||
          job.position !== input.position ||
          job.artefactIndex !== input.artefactIndex ||
          job.sourceHash !== sourceHash
        )
          conflict('This image does not match the current saved story message.');
        this.store.artefactImages.bytes(job.id);
        next.images.push({
          position: input.position,
          artefactIndex: input.artefactIndex,
          sourceHash,
          image: job.image,
        });
      }
      next.reviews[input.position - 1] = 'pending';
      next.revision++;
      next.updatedAt = new Date().toISOString();
      this.store.generation.save(
        next,
        input.imageId ? 'image-reviewed-and-attached' : 'image-removed',
      );
      this.store.generation.record(actor.id, input.commandId, hash, id);
      return this.generation.get(actor, id);
    });
  }
  read(actor: Actor, id: string): Buffer {
    const job = this.store.artefactImages.get(id);
    if (!job?.image || job.status !== 'ready')
      throw new AppError(403, 'FORBIDDEN', 'Image unavailable to this account.');
    let permitted = actor.role === 'facilitator' && job.ownerId === actor.id;
    if (permitted) this.generation.get(actor, job.packageId);
    if (!permitted && actor.role === 'participant') {
      const draft = this.store.generation.get(job.packageId)?.draft;
      if (draft?.status === 'frozen' && draft.runId) {
        const inbox = new ExerciseService(this.store).inbox(actor, 'technical', draft.runId);
        permitted = inbox.some((release) =>
          release.images?.some((image) => image.id === id && image.sha256 === job.image!.sha256),
        );
      }
    }
    if (!permitted) throw new AppError(403, 'FORBIDDEN', 'Image unavailable to this account.');
    return this.store.artefactImages.bytes(id);
  }
}
