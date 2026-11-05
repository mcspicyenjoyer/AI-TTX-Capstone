import type { RunActivity } from '../contracts/exercise.js';

const sourceTitles: Record<string, string> = {
  'Synthetic organisation brief': 'Organisation brief',
  'Synthetic network inventory': 'Network inventory',
  'Synthetic continuity notes': 'Continuity notes',
  'Synthetic recovery notes': 'Recovery notes',
};

// Display aliases only; source identity, titles in exports and quoted evidence stay exact.
export function sourceTitle(value: string): string {
  return Object.hasOwn(sourceTitles, value) ? sourceTitles[value]! : value;
}

export function optionLabel(value: string): string {
  const label = value
    .replaceAll('-', ' ')
    .replace(/\b(mfa|rto|rpo|bcp|drp|bia|it|msp|mssp|soc)\b/g, (acronym) => acronym.toUpperCase());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const stockCopy: [string, string][] = [
  ['A simulated user report says ', 'A user report says '],
  ['A simulated planning request asks ', 'A planning request asks '],
  ['A simulated request asks ', 'A request asks '],
  ['Company-wide fictional reference time:', 'Exercise reference time:'],
  ['fictional exercise clock', 'exercise clock'],
  ['fictional reference', 'reference'],
  ['All calls, payments, filings and external contacts are simulated.', ''],
  ['All messages and actions are simulated; no real contacts, isolation or restoration.', ''],
  ['All actions are simulated; do not contact real people or change systems.', ''],
  [
    'All calls, notifications and system actions are simulated; no real contact details or systems are used.',
    '',
  ],
  [
    'MSP and SOC contacts are simulated through the facilitator; no real calls or system changes.',
    'MSP and SOC contacts are represented by the facilitator.',
  ],
  [
    'You may consult the synthetic reference material supplied by the facilitator;',
    'You may consult the reference material supplied by the facilitator;',
  ],
  ['Synthetic delivery-control check. ', ''],
  ['Synthetic operational development context.', 'Operational development context.'],
  ['You represent internal IT for this synthetic delivery check.', 'You represent internal IT.'],
  [
    'Escalate through the controller to the incident lead and simulated suppliers.',
    'Escalate through the controller to the incident lead and suppliers.',
  ],
  [
    'same controller as the simulated alternative channel',
    'same controller as the alternative channel',
  ],
];

// Display stock exercise copy without repeated labels. Never use this for source quotes,
// stored records, hashes, prompts or report evidence; those retain their exact wording.
export function exerciseText(value: string): string {
  let display = value.replace(/^SIMULATED SCENARIO: /, '').replace(/^SIMULATION(?:\. | \/ )/, '');
  if (value.startsWith('SIMULATED SCENARIO: '))
    display = display.charAt(0).toUpperCase() + display.slice(1);
  for (const [before, after] of stockCopy) display = display.replaceAll(before, after);
  return display;
}

export const date = (value: string) =>
  new Date(value).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' });
export const labels: Record<RunActivity[number]['kind'], string> = {
  'step0-recorded': 'Team contact-route check recorded',
  'briefing-confirmed': 'Briefing confirmed and run started',
  'inject-approved': 'Inject approved',
  'inject-released': 'Inject available in recipient inbox',
  'run-paused': 'Run paused',
  'run-resumed': 'Run resumed',
  'run-recovered': 'Restart detected; run paused',
  'response-recorded': 'Team response recorded',
  'disposition-recorded': 'Facilitator disposition recorded',
  'position-closed': 'Position closed',
  'run-completed': 'Run completed',
};
