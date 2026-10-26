import type { Claim, Entity, Evidence } from '../contracts/profile.js';
import type { IntakeSource, Proposal } from '../contracts/intake.js';

export const relationPredicates = new Set([
  'diagram-link',
  'connects-to',
  'depends-on',
  'owned-by',
  'supported-by',
  'backup-to',
  'identity-sync-to',
  'access-to',
  'monitored-by',
  'uses-data',
]);
const numeric = new Set([
  'quantity',
  'rto-hours',
  'rpo-hours',
  'recovery-priority',
  'backup-retention-days',
]);
const boolean = new Set(['mfa', 'backup-isolation', 'restore-tested']);
const normalise = (value: string) => value.replace(/\s+/g, ' ').trim();

export function validateEnvironment(entities: Entity[], claims: Claim[]): void {
  const ids = new Set(entities.map((entity) => entity.id));
  if (
    ids.size !== entities.length ||
    new Set(claims.map((claim) => claim.id)).size !== claims.length
  )
    throw new Error('Entity and claim identifiers must be unique.');
  for (const claim of claims) {
    if (!ids.has(claim.subjectId) || (claim.objectId !== null && !ids.has(claim.objectId)))
      throw new Error('A claim refers to an unavailable entity.');
    if (claim.status === 'unknown' || claim.status === 'conflict') {
      if (claim.value !== null || claim.objectId !== null)
        throw new Error('Unknown or conflicting claims cannot select a value or target.');
    } else if (relationPredicates.has(claim.predicate)) {
      if (claim.objectId === null || claim.value !== null)
        throw new Error('A relationship needs an entity target, not a scalar value.');
    } else {
      if (claim.objectId !== null || claim.value === null)
        throw new Error('An attribute needs a scalar value, not an entity target.');
      const expected = numeric.has(claim.predicate)
        ? 'number'
        : boolean.has(claim.predicate)
          ? 'boolean'
          : 'string';
      if (typeof claim.value !== expected)
        throw new Error(`Invalid value type for ${claim.predicate}.`);
      if (
        ['quantity', 'recovery-priority', 'backup-retention-days'].includes(claim.predicate) &&
        !Number.isInteger(claim.value)
      )
        throw new Error('Counts, priorities and retention days must be whole numbers.');
    }
    if (['fact', 'proposal', 'conflict'].includes(claim.status) && claim.evidence.length === 0)
      throw new Error('Sourced claims and conflicts need evidence.');
    if (
      ['rto-hours', 'rpo-hours', 'recovery-priority'].includes(claim.predicate) &&
      entities.find((entity) => entity.id === claim.subjectId)?.kind !== 'service'
    )
      throw new Error('Recovery requirements must identify a business service.');
  }
}

export function validateEvidence(evidence: Evidence[], sources: IntakeSource[]): void {
  for (const reference of evidence) {
    const source = sources.find((item) => item.id === reference.sourceId);
    const unit = source?.units.find((item) => item.locator === reference.locator);
    if (!unit || !normalise(unit.text).includes(normalise(reference.excerpt)))
      throw new Error('Evidence must quote a stored source at its exact locator.');
  }
}

export function validateProposal(proposal: Proposal, sources: IntakeSource[]): void {
  validateEnvironment(proposal.entities, proposal.claims);
  for (const item of [...proposal.entities, ...proposal.claims])
    validateEvidence(item.evidence, sources);
  const acceptedIds = new Set(
    proposal.entities.filter((entity) => entity.review === 'accepted').map((entity) => entity.id),
  );
  if (
    proposal.entities.some(
      (entity) => entity.review === 'accepted' && entity.kind === 'unclassified',
    )
  )
    throw new Error('Classify an entity before accepting it.');
  for (const claim of proposal.claims.filter((item) => item.review === 'accepted')) {
    if (
      !acceptedIds.has(claim.subjectId) ||
      (claim.objectId !== null && !acceptedIds.has(claim.objectId))
    )
      throw new Error('Accept the referenced entities before accepting their claims.');
  }
}
