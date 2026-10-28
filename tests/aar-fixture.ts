import type { AarOutput } from '../src/contracts/aar.js';
import type { RecordReportView } from '../src/contracts/record-report.js';

export function fakeAar(snapshot: RecordReportView): AarOutput {
  return {
    scope: 'discussion-only',
    objectives: snapshot.report.objectives.map((objective, index) => {
      const response = snapshot.report.records.find(
        (r) => r.kind === 'response' && objective.positions.includes(r.position!),
      )!;
      const disposition = snapshot.report.records.find(
        (r) => r.kind === 'disposition' && objective.positions.includes(r.position!),
      )!;
      return {
        objectiveId: objective.id,
        strengths: [
          {
            id: 'strength-' + index,
            category: 'team-decision',
            evidence: [
              {
                recordId: response.id,
                field: 'actions',
                quote: response.fields.find((f) => f.label === 'actions')!.value,
              },
            ],
          },
        ],
        areasForImprovement: [
          {
            id: 'gap-' + index,
            category: 'origin-not-established',
            evidence: [
              {
                recordId: disposition.id,
                field: 'unresolvedGaps',
                quote: disposition.fields.find((f) => f.label === 'unresolvedGaps')!.value,
              },
            ],
          },
        ],
      };
    }),
    improvementActions: [
      {
        id: 'proposal-1',
        findingIds: ['gap-0'],
        proposal: 'Define the evidence needed for a future decision.',
        owner: '',
        status: 'proposed',
      },
    ],
  };
}
