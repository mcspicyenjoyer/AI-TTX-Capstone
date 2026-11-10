import type { RunActivity } from '../contracts/exercise.js';
import type { ProfileView } from '../contracts/profile.js';

type DocumentType = ProfileView['profile']['sources'][number]['kind'];
const documentTypeLabels: Record<DocumentType, string> = {
  network: 'Network diagram',
  bcp: 'BCP',
  bia: 'BIA',
  drp: 'DRP',
  setup: 'Guided context',
};

export function documentTypeLabel(value: DocumentType): string {
  return documentTypeLabels[value];
}

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

// Display alias only: objective-coverage messages retain their server-owned wording.
export function coverageText(problem: string): string {
  return problem
    .replace(/^Position (\d+)(?= (?:\([a-z-]+ decision\) )?must evaluate )/, 'Inject $1')
    .replace(/^Positions (\d+-\d+)(?= must evaluate )/, 'Injects $1')
    .replace(/^No position evaluates /, 'No inject evaluates ');
}

export function optionLabel(value: string): string {
  const label = value
    .replaceAll('-', ' ')
    .replace(/\bpowershell\b/g, 'PowerShell')
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

// Labels the generator writes before each story message ("Ransom note from ...: headline").
export const storyLabels = [
  'Email',
  'Chat message',
  'Phone call',
  'Voicemail',
  'Helpdesk ticket',
  'Ransom note',
  'Leak-site post',
  'News item',
  'PowerShell transcript',
] as const;
const storyPrefix = new RegExp(`^(?:${storyLabels.join('|')}) from `, 'm');

// Display stock exercise copy without repeated labels. Never use this for source quotes,
// stored records, hashes, prompts or report evidence; those retain their exact wording.
export function exerciseText(value: string): string {
  // Flat released bodies have no separate story metadata. Preserve everything from the first
  // rendered story heading, including its quoted evidence, rather than guess where prose ends.
  const storyStart = value.search(storyPrefix);
  const wrapper = storyStart === -1 ? value : value.slice(0, storyStart);
  let display = wrapper.replace(/^SIMULATED SCENARIO: /, '').replace(/^SIMULATION(?:\. | \/ )/, '');
  if (value.startsWith('SIMULATED SCENARIO: '))
    display = display.charAt(0).toUpperCase() + display.slice(1);
  for (const [before, after] of stockCopy) display = display.replaceAll(before, after);
  return display + (storyStart === -1 ? '' : value.slice(storyStart));
}

export type FactStatus = 'fact' | 'proposal' | 'assumption' | 'unknown' | 'conflict';
export type ExerciseBlock =
  | { kind: 'text'; text: string }
  | { kind: 'fact'; status: FactStatus; subject: string; field: string; text: string }
  | { kind: 'list'; title: string; items: string[] };

const factLine =
  /^(FACT|PROPOSAL|ASSUMPTION|UNKNOWN|CONFLICT) \/ (.+?) \/ ([a-z][a-z0-9-]*): ?(.*)$/;
const assumptionLine = /^EXERCISE ASSUMPTION: ?(.*)$/;
const listHeading = /^(Background|Discussion):$/;

// Flattened stories and application sections have identical separators. Keep any story-bearing
// body literal rather than infer attribution; only line endings and the leading clock are handled.
// Non-story briefing/profile text retains its existing tagged-fact and list presentation.
export function parseExerciseText(value: string): {
  elapsedMinutes: number | null;
  blocks: ExerciseBlock[];
} {
  const lines = value.replace(/\r\n?/g, '\n').split('\n');
  const clock = /^\+(\d+) elapsed minutes$/.exec(lines[0] ?? '');
  if (clock) lines.shift();
  const elapsedMinutes = clock ? Number(clock[1]) : null;
  const body = lines.join('\n');
  if (storyPrefix.test(body)) return { elapsedMinutes, blocks: [{ kind: 'text', text: body }] };
  const blocks: ExerciseBlock[] = [];
  let current: ExerciseBlock | null = null;
  let blank = true;
  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      if (current?.kind !== 'fact') flush();
      blank = true;
      continue;
    }
    const fact = factLine.exec(line);
    const assumption = assumptionLine.exec(line);
    const heading = listHeading.exec(line);
    if (fact) {
      flush();
      current = {
        kind: 'fact',
        status: fact[1]!.toLowerCase() as FactStatus,
        subject: fact[2]!,
        field: fact[3]!,
        text: fact[4]!,
      };
    } else if (assumption) {
      flush();
      current = {
        kind: 'fact',
        status: 'assumption',
        subject: '',
        field: '',
        text: assumption[1]!,
      };
    } else if (heading) {
      flush();
      current = { kind: 'list', title: heading[1]!, items: [] };
    } else if (current?.kind === 'list') {
      current.items.push(line.replace(/^- /, ''));
    } else if (current?.kind === 'fact' && !blank) {
      current.text += '\n' + line;
    } else if (current?.kind === 'text') {
      current.text += '\n' + line;
    } else {
      flush();
      current = { kind: 'text', text: line };
    }
    blank = false;
  }
  flush();
  return { elapsedMinutes, blocks };
}

export const date = (value: string) =>
  new Date(value).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' });
export const labels: Record<RunActivity[number]['kind'], string> = {
  'step0-recorded': 'Team contact-route check recorded',
  'briefing-confirmed': 'Briefing confirmed and exercise started',
  'inject-approved': 'Inject approved',
  'inject-released': 'Inject available in recipient inbox',
  'run-paused': 'Exercise paused',
  'run-resumed': 'Exercise resumed',
  'run-recovered': 'Restart detected; exercise paused',
  'response-recorded': 'Team response recorded',
  'disposition-recorded': 'Facilitator disposition recorded',
  'position-closed': 'Inject closed',
  'run-completed': 'Exercise completed',
};
