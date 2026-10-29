import type { Claim, Entity, Profile } from '../contracts/profile.js';
import type { GeneratedPlan } from '../contracts/generation.js';
import type { FamilyAssessment, PathwayClaim, ThreatPathway } from '../contracts/threat.js';

// Controlled threat library (ADR-037). Rules use claim predicates and knowledge states, never
// organisation names, so any confirmed profile with the same structure can be mapped.
export const threatLibraryVersion = 'threat-library-1' as const;

export const ransomwareFamily = {
  id: 'suspected-ransomware-file-unavailability',
  title: 'Suspected ransomware: shared files unavailable',
  summary:
    'Files on a system that a business service depends on become unavailable. Ransomware is suspected, not established; the entry point and extent stay unknown. Players decide containment, minimum continuity and authorised restoration under uncertainty.',
  references: [
    'MITRE ATT&CK T1486, Data Encrypted for Impact (technique name only; no procedures).',
    'ENISA Threat Landscape: ransomware as a prime threat (narrative context, not a likelihood).',
    'NIST CSF 2.0 Respond (RS.MA) and Recover (RC.RP) outcomes, adapted for discussion.',
  ],
  rules: [
    'A business service depends on the target system through a confirmed fact.',
    'A confirmed reference-time claim contains an ISO-8601 time with a UTC offset.',
    'Each of the two facilitator-played third parties has a confirmed support, monitoring or access link to the mapped pathway.',
    'Three different people are available for the three player functions.',
    'The no-endpoint-alert note is used only when the target has no confirmed monitoring.',
    'Entry points stay unknown to players; confirmed access links are facilitator-only hypotheses.',
  ],
} as const;

const isoTime = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})/;
const supplierPredicates: readonly Claim['predicate'][] = ['supported-by', 'monitored-by'];
const accessPredicates: readonly Claim['predicate'][] = ['access-to', 'connects-to'];

function facts(profile: Profile): Claim[] {
  return (profile.environment?.claims ?? []).filter((claim) => claim.status === 'fact');
}
function entities(profile: Profile): Map<string, Entity> {
  return new Map(profile.environment?.entities.map((entity) => [entity.id, entity]));
}

export function dependsOnFact(profile: Profile, serviceId: string, systemId: string): boolean {
  return facts(profile).some(
    (claim) =>
      claim.predicate === 'depends-on' &&
      claim.subjectId === serviceId &&
      claim.objectId === systemId,
  );
}

export function isReferenceTime(claim: Claim | undefined): boolean {
  if (claim?.status !== 'fact' || typeof claim.value !== 'string') return false;
  const match = isoTime.exec(claim.value);
  return !!match && !Number.isNaN(Date.parse(match[0]));
}

// Systems and services on the mapped pathway: the target, the selected service, what either
// depends on, and systems with a confirmed access or connection to the target.
export function pathwayNodes(profile: Profile, systemId: string, serviceId: string): Set<string> {
  const known = entities(profile);
  const nodes = new Set([systemId, serviceId]);
  for (const claim of facts(profile)) {
    if (
      claim.predicate === 'depends-on' &&
      (claim.subjectId === systemId || claim.subjectId === serviceId) &&
      claim.objectId
    )
      nodes.add(claim.objectId);
    if (
      accessPredicates.includes(claim.predicate) &&
      claim.objectId === systemId &&
      known.get(claim.subjectId)?.kind === 'system'
    )
      nodes.add(claim.subjectId);
  }
  return nodes;
}

export function supplierLinks(profile: Profile, supplierId: string, nodes: Set<string>): Claim[] {
  return facts(profile).filter(
    (claim) =>
      (supplierPredicates.includes(claim.predicate) &&
        claim.objectId === supplierId &&
        nodes.has(claim.subjectId)) ||
      (claim.predicate === 'access-to' &&
        claim.subjectId === supplierId &&
        claim.objectId !== null &&
        nodes.has(claim.objectId)),
  );
}

export function monitoringFacts(profile: Profile, systemId: string): Claim[] {
  return facts(profile).filter(
    (claim) => claim.predicate === 'monitored-by' && claim.subjectId === systemId,
  );
}

export function assessFamily(profile: Profile): FamilyAssessment {
  const known = entities(profile);
  const kind = (id: string | null, expected: Entity['kind']) =>
    !!id && known.get(id)?.kind === expected;
  const suppliers = [...known.values()].filter((entity) => entity.kind === 'third-party');
  const targets = facts(profile)
    .filter(
      (claim) =>
        claim.predicate === 'depends-on' &&
        kind(claim.subjectId, 'service') &&
        kind(claim.objectId, 'system'),
    )
    .map((claim) => {
      const systemId = claim.objectId!;
      const nodes = pathwayNodes(profile, systemId, claim.subjectId);
      return {
        systemId,
        serviceId: claim.subjectId,
        name: `${known.get(systemId)!.name} -> ${known.get(claim.subjectId)!.name}`,
        supplierIds: suppliers
          .filter((supplier) => supplierLinks(profile, supplier.id, nodes).length)
          .map((supplier) => supplier.id)
          .slice(0, 10),
      };
    })
    .slice(0, 30);
  const referenceClaimIds = (profile.environment?.claims ?? [])
    .filter(isReferenceTime)
    .map((claim) => claim.id)
    .slice(0, 20);
  const people = [...known.values()].filter((entity) => entity.kind === 'role').length;
  const unmet: string[] = [];
  if (!targets.length)
    unmet.push('No business service depends on a system through a confirmed fact.');
  else if (!targets.some((target) => target.supplierIds.length >= 2))
    unmet.push(
      'No service-to-system pathway has two third parties with confirmed support, monitoring or access links.',
    );
  if (!referenceClaimIds.length)
    unmet.push('No confirmed reference-time claim contains an ISO-8601 time with a UTC offset.');
  if (people < 3)
    unmet.push('Fewer than three people are recorded for the three player functions.');
  return {
    libraryVersion: threatLibraryVersion,
    familyId: ransomwareFamily.id,
    title: ransomwareFamily.title,
    summary: ransomwareFamily.summary,
    references: [...ransomwareFamily.references],
    rules: [...ransomwareFamily.rules],
    applicable: !unmet.length,
    unmet,
    targets,
    referenceClaimIds,
  };
}

// Deterministic facilitator view of the pathway behind a plan. It describes rather than
// validates, so an older frozen plan is still mapped; validation is validateGeneratedPlan's job.
export function mapPathway(profile: Profile, plan: GeneratedPlan): ThreatPathway {
  const known = entities(profile);
  const claims = profile.environment?.claims ?? [];
  const name = (id: string) => known.get(id)?.name ?? id;
  const line = (claim: Claim): PathwayClaim => {
    const value = claim.objectId
      ? name(claim.objectId)
      : claim.value === null
        ? 'no value recorded'
        : String(claim.value);
    return {
      claimId: claim.id,
      status: claim.status,
      text: `${name(claim.subjectId)} / ${claim.predicate}: ${value}`.slice(0, 400),
    };
  };
  const about = (subjectId: string, predicates: readonly Claim['predicate'][]) =>
    claims.filter((claim) => claim.subjectId === subjectId && predicates.includes(claim.predicate));
  const node = (entityId: string, list: Claim[]) => ({
    entityId,
    name: name(entityId),
    claims: list.slice(0, 20).map(line),
  });
  const { systemId, serviceId } = plan.scenario;
  const nodes = pathwayNodes(profile, systemId, serviceId);

  const entryHypotheses = facts(profile)
    .filter((claim) => accessPredicates.includes(claim.predicate) && claim.objectId === systemId)
    .slice(0, 20)
    .map((link) =>
      node(link.subjectId, [
        link,
        ...about(link.subjectId, ['mfa', 'monitored-by', 'supported-by']),
        ...claims.filter(
          (claim) => claim.predicate === 'access-to' && claim.objectId === link.subjectId,
        ),
      ]),
    );
  const target = node(
    systemId,
    about(systemId, [
      'uses-data',
      'depends-on',
      'backup-to',
      'monitored-by',
      'supported-by',
      'mfa',
    ]),
  );
  const services = claims
    .filter(
      (claim) =>
        claim.predicate === 'depends-on' &&
        claim.objectId === systemId &&
        known.get(claim.subjectId)?.kind === 'service',
    )
    .slice(0, 20)
    .map((link) => ({
      ...node(link.subjectId, [
        link,
        ...about(link.subjectId, ['rto-hours', 'rpo-hours', 'recovery-priority', 'owned-by']),
      ]),
      selected: link.subjectId === serviceId,
    }));
  const backupTargets = about(systemId, ['backup-to']).flatMap((claim) =>
    claim.objectId ? [claim.objectId] : [],
  );
  const recovery = [systemId, ...backupTargets]
    .flatMap((id) =>
      about(id, [
        'backup-to',
        'backup-isolation',
        'restore-tested',
        'backup-frequency',
        'backup-retention-days',
      ]),
    )
    .slice(0, 30)
    .map(line);
  const people = [...plan.roles.flatMap((role) => role.personIds), ...plan.facilitatorSupplierIds];
  const authority = people
    .flatMap((id) => about(id, ['authority']))
    .slice(0, 20)
    .map(line);
  const suppliers = plan.facilitatorSupplierIds.slice(0, 10).map((supplierId) =>
    node(
      supplierId,
      claims.filter(
        (claim) =>
          (supplierPredicates.includes(claim.predicate) &&
            claim.objectId === supplierId &&
            nodes.has(claim.subjectId)) ||
          (claim.predicate === 'access-to' &&
            claim.subjectId === supplierId &&
            claim.objectId !== null &&
            nodes.has(claim.objectId)),
      ),
    ),
  );
  const seen = new Set<string>();
  const gaps = [
    ...entryHypotheses.flatMap((item) => item.claims),
    ...target.claims,
    ...services.flatMap((item) => item.claims),
    ...recovery,
    ...authority,
    ...suppliers.flatMap((item) => item.claims),
  ]
    .filter((item) => item.status !== 'fact' && !seen.has(item.claimId) && seen.add(item.claimId))
    .slice(0, 60);
  return {
    libraryVersion: threatLibraryVersion,
    familyId: plan.scenario.family,
    title: ransomwareFamily.title,
    entryStatement:
      'Entry point not established. Hypotheses come from confirmed access links; they are facilitator planning aids, not rendered into the package or shown to players.',
    entryHypotheses,
    target,
    services,
    recovery,
    authority,
    suppliers,
    gaps,
  };
}
