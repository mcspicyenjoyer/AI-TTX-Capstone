import type { Actor, ConfirmRequest, Confirmation, ProfileView } from '../contracts/profile.js';
import { AppError } from './errors.js';
import { Store } from './storage.js';

export class ProfileService {
  constructor(private readonly store: Store) {}

  requireReviewer(actor: Actor, profileId: string): void {
    if (actor.role !== 'facilitator' || !this.store.mayReview(actor.id, profileId)) {
      throw new AppError(403, 'FORBIDDEN', 'This account cannot review that organisation profile.');
    }
  }

  get(actor: Actor, profileId: string, revisionId: string): ProfileView {
    this.requireReviewer(actor, profileId);
    const snapshot = this.store.profile(profileId, revisionId);
    if (!snapshot) throw new AppError(404, 'NOT_FOUND', 'That profile revision is unavailable.');
    return { ...snapshot, confirmation: this.store.confirmation(profileId, revisionId) };
  }

  confirm(actor: Actor, input: ConfirmRequest): Confirmation {
    return this.store.transaction(() => {
      this.requireReviewer(actor, input.profileId);
      const snapshot = this.store.profile(input.profileId, input.revisionId);
      if (
        !snapshot ||
        !this.store.isCurrent(input.profileId, input.revisionId) ||
        snapshot.contentHash !== input.contentHash
      ) {
        throw new AppError(
          409,
          'STALE_REVISION',
          'The profile revision has changed. Reload and review it again.',
        );
      }
      if (!input.acknowledgeUncertainties) {
        throw new AppError(
          400,
          'ACKNOWLEDGEMENT_REQUIRED',
          'Acknowledge the remaining assumptions and gaps.',
        );
      }
      return (
        this.store.confirmation(input.profileId, input.revisionId) ??
        this.store.saveConfirmation(input.profileId, input.revisionId, input.contentHash, actor)
      );
    });
  }
}
