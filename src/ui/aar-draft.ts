import type { AarFinding } from '../contracts/aar.js';
import type { RecordReport } from '../contracts/record-report.js';

// A new finding starts from the team's own response. An objective whose positions were
// closed unanswered starts from the facilitator's record instead, never from an invented
// response. The reviewer still chooses the exact record, field and excerpt.
const sources = [
  { kind: 'response', field: 'actions', category: 'team-decision' },
  { kind: 'disposition', field: 'observations', category: 'facilitator-observation' },
  { kind: 'closure', field: 'rationale', category: 'facilitator-observation' },
] as const;

export function findingDefault(
  report: RecordReport,
  objectiveIndex: number,
): Omit<AarFinding, 'id'> | null {
  const positions = report.objectives[objectiveIndex]?.positions ?? [];
  for (const source of sources) {
    const record = report.records.find(
      (r) =>
        r.kind === source.kind &&
        r.position !== null &&
        positions.includes(r.position) &&
        r.fields.some((f) => f.label === source.field),
    );
    if (record)
      return {
        category: source.category,
        evidence: [{ recordId: record.id, field: source.field, quote: '' }],
      };
  }
  return null;
}
