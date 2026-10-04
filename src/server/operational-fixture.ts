import type { ExercisePackage } from '../contracts/exercise.js';
import { syntheticProfile } from './fixture.js';
import { contentHash } from './integrity.js';

// Owned operational content can replace this integration fixture in a new revision.
export const operationalPackage: ExercisePackage = {
  id: 'operational-development',
  revisionId: 'package-r1',
  track: 'operational',
  kind: 'development-skeleton',
  title: 'Operational development workspace',
  synthetic: true,
  profileId: syntheticProfile.profileId,
  profileRevisionId: syntheticProfile.revisionId,
  profileHash: contentHash(JSON.stringify(syntheticProfile)),
  briefing: {
    revisionId: 'briefing-r1',
    common:
      'Synthetic operational development context. No incident scenario or participant exercise has been approved.',
    references: ['Operational content owner: the operational workstream.'],
    gaps: [
      {
        id: 'content-pending',
        description: 'Operational scenario and role assignments are pending.',
        disposition: 'hold',
        rationale:
          'This fixture validates integration only; exercise start and release remain unavailable.',
      },
    ],
  },
  roles: [
    {
      id: 'development-role',
      name: 'Development role',
      briefing:
        'No participant assignment or incident responsibility is defined by this development fixture.',
    },
  ],
  injects: [],
};
