import type { Profile } from '../contracts/profile.js';

// Hand-authored software fixture, not an uploaded organisation or an exercise package.
export const syntheticProfile: Profile = {
  profileId: 'example-sme-01',
  revisionId: 'profile-r1',
  revisionNumber: 1,
  organisationName: 'Example SME 01',
  synthetic: true,
  createdAt: '2026-09-18T00:00:00Z',
  sources: [
    {
      id: 'setup-v1',
      title: 'Synthetic organisation brief',
      version: '1',
      kind: 'setup',
      synthetic: true,
    },
    {
      id: 'network-v1',
      title: 'Synthetic network inventory',
      version: '1',
      kind: 'network',
      synthetic: true,
    },
    {
      id: 'bcp-v1',
      title: 'Synthetic continuity notes',
      version: '1',
      kind: 'bcp',
      synthetic: true,
    },
    { id: 'drp-v1', title: 'Synthetic recovery notes', version: '1', kind: 'drp', synthetic: true },
  ],
  statements: [
    {
      id: 'sector',
      category: 'organisation',
      label: 'Business activity',
      status: 'fact',
      value: 'Engineering services',
      explanation: 'Declared in the synthetic brief.',
      evidence: [
        {
          sourceId: 'setup-v1',
          locator: 'Organisation / activity',
          excerpt: 'Example SME 01 provides engineering services.',
        },
      ],
    },
    {
      id: 'staff',
      category: 'organisation',
      label: 'Staff and location',
      status: 'fact',
      value: '42 staff; one office',
      explanation: 'Exercise fixture only.',
      evidence: [
        {
          sourceId: 'setup-v1',
          locator: 'Organisation / size',
          excerpt: 'The synthetic organisation has 42 staff working from one office.',
        },
      ],
    },
    {
      id: 'services',
      category: 'network',
      label: 'Business services',
      status: 'fact',
      value: 'Cloud email, identity service and on-site file server',
      explanation: 'A limited inventory, not a verified topology.',
      evidence: [
        {
          sourceId: 'network-v1',
          locator: 'Inventory / services',
          excerpt: 'Services in scope: cloud email, identity service, on-site file server.',
        },
      ],
    },
    {
      id: 'backup',
      category: 'network',
      label: 'Backup isolation',
      status: 'assumption',
      value: 'Backup access is separate from everyday user accounts',
      explanation:
        'Working assumption; the inventory does not establish administrative separation.',
      evidence: [
        {
          sourceId: 'network-v1',
          locator: 'Inventory / backup',
          excerpt: 'A backup repository is listed; account and isolation details are absent.',
        },
      ],
    },
    {
      id: 'soc',
      category: 'responsibilities',
      label: 'SOC operating model',
      status: 'fact',
      value: 'MSSP monitoring; internal IT coordinates response',
      explanation: 'This describes functions, not an approved RACI task assignment.',
      evidence: [
        {
          sourceId: 'setup-v1',
          locator: 'Operations / monitoring',
          excerpt: 'An MSSP monitors security alerts. Internal IT coordinates response decisions.',
        },
      ],
    },
    {
      id: 'mssp-authority',
      category: 'responsibilities',
      label: 'MSSP containment authority',
      status: 'unknown',
      value: null,
      explanation: 'Who may authorise endpoint isolation has not been supplied.',
      evidence: [
        {
          sourceId: 'setup-v1',
          locator: 'Operations / authority',
          excerpt: 'The synthetic brief does not define containment approval authority.',
        },
      ],
    },
    {
      id: 'rto',
      category: 'continuity',
      label: 'File service recovery target',
      status: 'conflict',
      value: null,
      explanation: 'Continuity and recovery notes disagree; no target is selected automatically.',
      evidence: [
        {
          sourceId: 'bcp-v1',
          locator: 'Section 2 / file service',
          excerpt: 'The target restoration time for the file service is four hours.',
        },
        {
          sourceId: 'drp-v1',
          locator: 'Section 3 / file service',
          excerpt: 'The target restoration time for the file service is eight hours.',
        },
      ],
    },
    {
      id: 'restore-test',
      category: 'continuity',
      label: 'Last successful restore test',
      status: 'unknown',
      value: null,
      explanation:
        'No observed restore-test result is available; recovery success cannot be inferred.',
      evidence: [
        {
          sourceId: 'drp-v1',
          locator: 'Section 4 / test evidence',
          excerpt: 'No restore-test record is included in this synthetic fixture.',
        },
      ],
    },
  ],
};
