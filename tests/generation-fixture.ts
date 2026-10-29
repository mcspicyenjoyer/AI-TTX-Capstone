import type { Profile, Claim, Entity } from '../src/contracts/profile.js';
import {
  playerRoles,
  type GeneratedPlan,
  type PackageTarget,
} from '../src/contracts/generation.js';
import { contentHash } from '../src/server/integrity.js';

// Hand-authored miniature test context, not a copy of the live organisation profile.
const evidence = [
  {
    sourceId: 'test-source',
    locator: 'Synthetic test paragraph',
    excerpt: 'Deliberately small test evidence.',
  },
];
const entity = (id: string, kind: Entity['kind'], name: string): Entity => ({
  id,
  kind,
  name,
  evidence,
});
const claim = (
  id: string,
  subjectId: string,
  status: Claim['status'],
  value: Claim['value'],
  predicate: Claim['predicate'] = 'description',
  objectId: string | null = null,
): Claim => ({
  id,
  subjectId,
  predicate,
  objectId,
  value,
  status,
  explanation: `Test evidence ${id}.`,
  evidence: status === 'unknown' ? [] : evidence,
});
export const generationProfile: Profile = {
  profileId: 'test-teralqen-review8',
  revisionId: 'confirmed-test-r8',
  revisionNumber: 8,
  organisationName: 'Teralqen test context',
  synthetic: true,
  createdAt: '2026-10-27T01:00:00Z',
  sources: [
    {
      id: 'test-source',
      title: 'Synthetic generation test',
      version: '1',
      kind: 'setup',
      synthetic: true,
    },
    {
      id: 'test-plan',
      title: 'Synthetic draft BCP',
      version: 'draft-1',
      kind: 'bcp',
      synthetic: true,
    },
  ],
  statements: [
    {
      id: 'test-statement',
      category: 'organisation',
      label: 'Test purpose',
      status: 'fact',
      value: 'Synthetic test only.',
      explanation: 'No real source documents.',
      evidence,
    },
  ],
  environment: {
    entities: [
      entity('fs', 'system', 'TE-FS01'),
      entity('service', 'service', 'Engineering service'),
      entity('ethan', 'role', 'Ethan'),
      entity('nadia', 'role', 'Nadia'),
      entity('imran', 'role', 'Imran'),
      entity('msp', 'third-party', 'Goh & Mercer Technology'),
      entity('soc', 'third-party', 'Beacon Nine Security'),
      entity('vpn', 'system', 'TE-VPN01'),
    ],
    claims: [
      // Pathway links in the same shape as the confirmed profile: the MSP supports the server,
      // the SOC monitors a VPN with access to it, and the server itself has no monitoring.
      claim('fs-support', 'fs', 'fact', null, 'supported-by', 'msp'),
      claim('vpn-access', 'vpn', 'fact', null, 'access-to', 'fs'),
      claim('vpn-monitor', 'vpn', 'fact', null, 'monitored-by', 'soc'),
      claim('vpn-mfa', 'vpn', 'unknown', null, 'mfa'),
      claim(
        'shared-route',
        'soc',
        'fact',
        'SHARED_ROUTE: use the facilitator for simulated supplier contact.',
      ),
      claim('dependency', 'service', 'fact', null, 'depends-on', 'fs'),
      claim('reference', 'service', 'fact', '2026-09-28T09:00:00+08:00'),
      claim(
        'leadership',
        'ethan',
        'fact',
        'LEADERSHIP_ONLY: approve server isolation and restoration.',
        'authority',
      ),
      claim('engineering', 'nadia', 'fact', 'ENGINEERING_ONLY: validate the working set.'),
      claim('it', 'imran', 'fact', 'IT_ONLY: no current TE-FS01 agent; laptop isolation only.'),
      claim('restore', 'fs', 'unknown', null, 'restore-tested'),
      claim('target', 'service', 'proposal', 4, 'rto-hours'),
      claim('comparison', 'service', 'conflict', null, 'rto-hours'),
    ],
  },
};
export const generationTarget: PackageTarget = {
  profileId: generationProfile.profileId,
  profileRevisionId: generationProfile.revisionId,
  profileHash: contentHash(JSON.stringify(generationProfile)),
  reviewRevision: 8,
  reviewHash: '8'.repeat(64),
};
// Each position keeps 'record-owner-and-review-time' first and adds the actions that cover its
// objective: decisions at positions 1 (containment), 3 (continuity) and 5 (restoration).
const coveredActions: GeneratedPlan['positions'][number]['expectedActions'][] = [
  [
    'record-owner-and-review-time',
    'establish-scope',
    'preserve-evidence',
    'obtain-isolation-authority',
  ],
  ['record-owner-and-review-time', 'check-dependencies'],
  ['record-owner-and-review-time', 'select-minimum-working-set', 'distinguish-target-and-estimate'],
  ['record-owner-and-review-time', 'verify-recovery-source'],
  [
    'record-owner-and-review-time',
    'validate-engineering-integrity',
    'obtain-restoration-authority',
  ],
];
export function generationPlan(target: PackageTarget = generationTarget): GeneratedPlan {
  const claimIds = ['leadership', 'engineering', 'it'];
  return {
    profileId: target.profileId,
    profileRevisionId: target.profileRevisionId,
    profileHash: target.profileHash,
    objectives: ['containment', 'minimum-continuity', 'authorised-restoration'],
    scenario: {
      family: 'suspected-ransomware-file-unavailability',
      systemId: 'fs',
      serviceId: 'service',
      referenceClaimId: 'reference',
      entryPoint: 'unknown',
      disruptionAtReference: true,
    },
    roles: playerRoles.map((roleId, index) => ({
      roleId,
      personIds: [['ethan'], ['nadia'], ['imran']][index]!,
      briefingEvidence: [{ claimId: claimIds[index]!, status: 'fact' }],
    })),
    facilitatorSupplierIds: ['msp', 'soc'],
    positions: Array.from({ length: 5 }, (_, index) => ({
      position: index + 1,
      elapsedMinutes: index * 30,
      event: (
        [
          'files-unavailable',
          'scope-request',
          'continuity-request',
          'recovery-evidence-request',
          'restoration-decision-request',
        ] as const
      )[index]!,
      decision: (
        ['containment', null, 'minimum-continuity', null, 'authorised-restoration'] as const
      )[index]!,
      messages: playerRoles.map((roleId, roleIndex) => ({
        roleId,
        evidence: [{ claimId: claimIds[roleIndex]!, status: 'fact' }],
        questions: ['record-owner-and-review-time'],
      })),
      expectedActions: [...coveredActions[index]!],
      evaluationCriteria: [...coveredActions[index]!],
      facilitatorNotes: [
        'simulation-only',
        'no-agent-alert',
        'restore-evidence-unknown',
        'suppliers-by-facilitator',
      ],
    })),
  };
}

// A second hand-authored context (ADR-037): different names, supplier layout, authority policy
// and reference wording. The SOC monitors the target directly and the MSP has its own access
// to it; IT holds standing authority to isolate servers, and leadership approves restoration.
// The reference has no seconds, a Z offset and no Teralqen phrasing.
const secondNames: Record<string, string> = {
  fs: 'QF-NAS2',
  service: 'Client design delivery',
  ethan: 'Mara',
  nadia: 'Theo',
  imran: 'Ines',
  msp: 'Northgate IT Partners',
  soc: 'Lumen Watch',
};
export const secondProfile: Profile = (() => {
  const profile = structuredClone(generationProfile);
  profile.profileId = 'test-quillfern-r3';
  profile.revisionId = 'confirmed-test-r3';
  profile.revisionNumber = 3;
  profile.organisationName = 'Quillfern Studio test context';
  const environment = profile.environment!;
  environment.entities = environment.entities
    .filter((item) => item.id !== 'vpn')
    .map((item) => ({ ...item, name: secondNames[item.id]! }));
  environment.claims = [
    ...environment.claims.filter((item) => item.subjectId !== 'vpn'),
    claim('fs-monitor', 'fs', 'fact', null, 'monitored-by', 'soc'),
    claim('msp-access', 'msp', 'fact', null, 'access-to', 'fs'),
  ];
  environment.claims.find((item) => item.id === 'reference')!.value =
    'Studio exercise start, 2 November 2026 08:30 GMT (2026-11-02T08:30Z)';
  environment.claims.find((item) => item.id === 'leadership')!.value =
    'LEADERSHIP_ONLY: approve restoration; server isolation is delegated to IT.';
  Object.assign(
    environment.claims.find((item) => item.id === 'it')!,
    {
      predicate: 'authority',
      value: 'IT_ONLY: Ines may isolate any affected server or laptop under standing authority.',
    },
  );
  return profile;
})();
export const secondTarget: PackageTarget = {
  profileId: secondProfile.profileId,
  profileRevisionId: secondProfile.revisionId,
  profileHash: contentHash(JSON.stringify(secondProfile)),
  reviewRevision: 3,
  reviewHash: '3'.repeat(64),
};
// The second target is monitored, so its plan cannot use the no-agent-alert note. Business
// leadership receives the reference claim at position 1, so the report can derive its clock.
export function secondPlan(): GeneratedPlan {
  const plan = generationPlan(secondTarget);
  for (const position of plan.positions)
    position.facilitatorNotes = position.facilitatorNotes.filter((key) => key !== 'no-agent-alert');
  plan.positions[0]!.messages[0]!.evidence.push({ claimId: 'reference', status: 'fact' });
  return plan;
}
