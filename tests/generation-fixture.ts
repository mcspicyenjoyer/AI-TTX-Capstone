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
    ],
    claims: [
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
export function generationPlan(): GeneratedPlan {
  const claimIds = ['leadership', 'engineering', 'it'];
  return {
    profileId: generationTarget.profileId,
    profileRevisionId: generationTarget.profileRevisionId,
    profileHash: generationTarget.profileHash,
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
      expectedActions: ['record-owner-and-review-time'],
      evaluationCriteria: ['record-owner-and-review-time'],
      facilitatorNotes: [
        'simulation-only',
        'no-agent-alert',
        'restore-evidence-unknown',
        'suppliers-by-facilitator',
      ],
    })),
  };
}
