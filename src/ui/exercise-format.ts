import type { RunActivity } from '../contracts/exercise.js';
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
