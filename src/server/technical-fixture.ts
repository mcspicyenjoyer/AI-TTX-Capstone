import type { ExercisePackage } from '../contracts/exercise.js';
import { syntheticProfile } from './fixture.js';
import { contentHash } from './integrity.js';

// A delivery-control test, not the yet-to-be-reviewed five-inject incident scenario.
export const technicalPackage: ExercisePackage = {
  id: 'technical-delivery-check',
  revisionId: 'package-r1',
  track: 'technical',
  kind: 'engineering-fixture',
  title: 'Technical delivery check',
  synthetic: true,
  profileId: syntheticProfile.profileId,
  profileRevisionId: syntheticProfile.revisionId,
  profileHash: contentHash(JSON.stringify(syntheticProfile)),
  briefing: {
    revisionId: 'briefing-r1',
    common:
      'Synthetic delivery-control check. The IT coordinator reports to the exercise incident lead, represented by the facilitator. A controller represents the MSP and MSSP. All calls, notifications and system actions are simulated; no real contact details or systems are used.',
    references: [
      'Engineering fixture briefing r1: contact the incident lead through the exercise controller; use the same controller as the simulated alternative channel.',
      'The participant may discuss proposed actions only. The incident lead represents decisions requiring business authority; no real isolation or recovery is authorised.',
    ],
    gaps: [
      {
        id: 'simulated-cover',
        description: 'No real contactability or deputy coverage has been verified.',
        disposition: 'exercise-assumption',
        rationale:
          'For this delivery check only, the controller represents the incident lead, cover and suppliers. This is not evidence of organisational preparedness.',
      },
      {
        id: 'profile-uncertainties',
        description:
          'The profile retains unknown MSSP containment authority and restore-test evidence, assumed backup isolation and conflicting recovery targets.',
        disposition: 'retained-gap',
        rationale:
          'The delivery check does not test containment or restoration and does not resolve or grade these facts.',
      },
    ],
  },
  roles: [
    {
      id: 'it-coordinator',
      name: 'IT coordinator',
      briefing:
        'You represent internal IT for this synthetic delivery check. Escalate through the controller to the incident lead and simulated suppliers. No real actions are permitted.',
    },
    {
      id: 'observer',
      name: 'Unaddressed participant',
      briefing:
        'You are assigned to this check but not to its prepared inject. You have no authority to approve or release content.',
    },
  ],
  injects: [
    {
      id: 'delivery-check-01',
      revisionId: 'inject-r1',
      title: 'File access report',
      body: 'SIMULATION. A colleague reports that a project file cannot be opened. The cause and scope are not known. Identify the next information you would request and whom you would notify. Do not contact real people or change any systems.',
      recipientRoleIds: ['it-coordinator'],
      facilitatorNotes:
        'PRIVATE CONTROL NOTE: this engineering fixture proves reviewed release and recipient isolation only. It has no approved incident storyline, grading rubric or branches. Do not infer ransomware, successful contact or performed recovery.',
    },
  ],
};
