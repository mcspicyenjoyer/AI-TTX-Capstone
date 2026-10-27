import { actionKinds } from '../contracts/generation.js';
import {
  ActionAssessmentsSchema,
  InterpretationResponseSchema,
  type ActionAssessment,
  type InterpretationResponse,
} from '../contracts/interpretation.js';
import { readStored } from './validation.js';

export function normaliseResponseQuote(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ');
}

function hasNonDirectiveOccurrence(text: string, quote: string): boolean {
  // An explicit AI addressee marks the rest of that line as a directive,
  // not a team action. This bounded check is not general injection detection.
  return text
    .split(/\bAI\s+(?:REVIEWER|EVALUATOR|ASSISTANT)\s*:[^\r\n]*/gi)
    .some((part) => normaliseResponseQuote(part).includes(normaliseResponseQuote(quote)));
}

// Validate proposal evidence without gold labels or any exercise-state writes.
export function readActionAssessments(
  value: unknown,
  expectedActionKeys: readonly ActionAssessment['actionKey'][],
  responseValue: InterpretationResponse,
): ActionAssessment[] {
  const response = readStored(InterpretationResponseSchema, responseValue);
  const assessments = readStored(ActionAssessmentsSchema, value);
  const expected = new Set(expectedActionKeys);
  if (
    expected.size !== expectedActionKeys.length ||
    expectedActionKeys.some((key) => !actionKinds.includes(key)) ||
    assessments.length !== expected.size ||
    new Set(assessments.map((item) => item.actionKey)).size !== expected.size ||
    assessments.some((item) => !expected.has(item.actionKey))
  )
    throw new Error('Interpretation must cover each expected action exactly once.');

  for (const item of assessments) {
    if (item.evidence === 'no supporting text') {
      if (item.label !== 'missing')
        throw new Error('An interpretation label other than missing needs response evidence.');
      continue;
    }
    for (const evidence of item.evidence) {
      const text = response[evidence.field];
      if (!normaliseResponseQuote(text).includes(normaliseResponseQuote(evidence.quote)))
        throw new Error('Interpretation quote is not an exact response substring.');
      if (!hasNonDirectiveOccurrence(text, evidence.quote))
        throw new Error('AI-directed instructions are not supporting action evidence.');
    }
  }
  return structuredClone(assessments);
}
