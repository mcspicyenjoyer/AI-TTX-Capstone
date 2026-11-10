import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  documentTypeLabel,
  exerciseText,
  optionLabel,
  parseExerciseText,
  sourceTitle,
  type ExerciseBlock,
} from '../src/ui/exercise-format.js';
import { artefactKinds } from '../src/contracts/generation.js';
import { artefactText } from '../src/server/generation-content.js';

test('document types share display labels while preserving stored kind values', () => {
  const kinds = ['network', 'bcp', 'bia', 'drp', 'setup'] as const;
  const original = JSON.stringify(kinds);
  assert.deepEqual(kinds.map(documentTypeLabel), [
    'Network diagram',
    'BCP',
    'BIA',
    'DRP',
    'Guided context',
  ]);
  assert.equal(JSON.stringify(kinds), original);
});

test('source-title aliases remove only the four fixture labels without changing source identity', () => {
  const sources = [
    { id: 'setup-v1', title: 'Synthetic organisation brief' },
    { id: 'network-v1', title: 'Synthetic network inventory' },
    { id: 'bcp-v1', title: 'Synthetic continuity notes' },
    { id: 'drp-v1', title: 'Synthetic recovery notes' },
  ];
  const original = JSON.stringify(sources);
  assert.deepEqual(
    sources.map((source) => sourceTitle(source.title)),
    ['Organisation brief', 'Network inventory', 'Continuity notes', 'Recovery notes'],
  );
  assert.equal(JSON.stringify(sources), original);
  for (const title of [
    'Synthetic biology network',
    'Synthetic draft BCP',
    'Teralqen draft BCP',
    'constructor',
    '',
  ]) {
    assert.equal(sourceTitle(title), title);
  }
});

test('controlled option labels use sentence case and preserve domain acronyms and values', () => {
  const values = [
    'obtain-isolation-authority',
    'ransom-note',
    'powershell-transcript',
    'clarification-required',
    'mfa',
    'rto-hours',
    'rpo-hours',
    'internal-it',
    'msp-and-mssp',
    'bcp-drp-bia-soc',
    'JSON status',
    '',
  ];
  const original = JSON.stringify(values);
  assert.deepEqual(values.map(optionLabel), [
    'Obtain isolation authority',
    'Ransom note',
    'PowerShell transcript',
    'Clarification required',
    'MFA',
    'RTO hours',
    'RPO hours',
    'Internal IT',
    'MSP and MSSP',
    'BCP DRP BIA SOC',
    'JSON status',
    '',
  ]);
  assert.equal(JSON.stringify(values), original);
});

test('exercise presentation removes known stock labels without changing the source record or clock', () => {
  const record = {
    body: 'SIMULATION / +45 elapsed minutes\nA simulated user report says shared files cannot be opened. Ransomware is suspected, not established.\nFACT / Company-wide fictional reference time: Monday 28 September 2026, 09:00 Singapore time (2026-09-28T09:00:00+08:00). All calls, payments, filings and external contacts are simulated.\nUNKNOWN / restore-tested: no value recorded',
  };
  const original = JSON.stringify(record);
  const display = exerciseText(record.body);
  assert(display.startsWith('+45 elapsed minutes\nA user report says'));
  assert(!/SIMULATION|fictional|simulated/.test(display));
  assert(display.includes('2026-09-28T09:00:00+08:00'));
  assert(display.includes('Ransomware is suspected, not established.'));
  assert(display.includes('UNKNOWN / restore-tested: no value recorded'));
  assert.equal(JSON.stringify(record), original);
  assert.equal(exerciseText('SIMULATED SCENARIO: Files unavailable.'), 'Files unavailable.');
  assert.equal(exerciseText('SIMULATED SCENARIO: suspected ransomware.'), 'Suspected ransomware.');
  assert.equal(exerciseText('lowercase original quotation.'), 'lowercase original quotation.');
});

test('presentation is not a general word scrubber and leaves arbitrary story and source wording intact', () => {
  const message =
    'The synthetic workload failed during a simulation. This is a fictional example in the supplied source.\r\nPayment and recovery remain unverified.';
  assert.equal(exerciseText(message), message);
  assert.equal(exerciseText('FACT / Backup tested: unknown'), 'FACT / Backup tested: unknown');
});

test('every story kind preserves literal stock phrases, blank lines and CRLF after wrapper cleanup', () => {
  for (const kind of artefactKinds) {
    for (const newline of ['\n', '\r\n']) {
      const story = artefactText({
        kind,
        sender: 'Internal IT',
        headline: 'fictional reference',
        body: [
          "PS C:\\> Write-Output 'fictional reference'",
          'fictional reference',
          '',
          'All actions are simulated; do not contact real people or change systems.',
          'PowerShell transcript from quoted text: not a boundary to rewrite',
          'A simulated user report says files are unavailable.',
        ].join('\n'),
        recipientRoleIds: ['internal-it'],
      }).replaceAll('\n', newline);
      const suffix = `${story}${newline}${newline}FACT / Company-wide fictional reference time: quoted source text`;
      const prefix = `SIMULATION / +0 elapsed minutes${newline}A simulated user report says files are unavailable.${newline}${newline}`;
      const original = prefix + suffix;
      assert.equal(
        exerciseText(original),
        `+0 elapsed minutes${newline}A user report says files are unavailable.${newline}${newline}${suffix}`,
        `${kind} with ${JSON.stringify(newline)}`,
      );
      assert.equal(exerciseText(story), story);
    }
  }
  assert.equal(
    exerciseText('A PowerShell transcript from another source mentions fictional reference'),
    'A PowerShell transcript from another source mentions reference',
    'Only an anchored application story heading stops wrapper cleanup.',
  );
});

// Joined display text of every block, used to prove that no source line is dropped.
function shown(blocks: ExerciseBlock[]): string {
  return blocks
    .map((block) =>
      block.kind === 'text'
        ? block.text
        : block.kind === 'fact'
          ? `${block.status.toUpperCase()} / ${block.subject} / ${block.field}: ${block.text}`
          : `${block.title}:\n${block.items.join('\n')}`,
    )
    .join('\n');
}

function keepsEveryLine(source: string) {
  const { blocks } = parseExerciseText(source);
  const display = shown(blocks);
  for (const line of source.replace(/\r\n?/g, '\n').split('\n').slice(1)) {
    const content = line
      .trim()
      .replace(/^- /, '')
      .replace(/^EXERCISE ASSUMPTION: ?/, '');
    if (content) assert(display.includes(content), `Dropped: ${content}`);
  }
}

const releasedBody = [
  'SIMULATION / +30 elapsed minutes',
  'A simulated user report says shared working files on TE-FS01 cannot be opened. Ransomware is suspected, not established.',
  '',
  'Helpdesk ticket from Nadia Rahman: TE-FS01 working files unavailable',
  'The CAD working files on TE-FS01 are unavailable. Imran, please coordinate the response.',
  '',
  'Ransom note from Vellum Jackal: Your next drawing issue depends on us',
  'Teralqen Engineering Pte. Ltd.: we have locked your working files.',
  '',
  'FACT / Endpoint Guard EDR / description: Covers all 42 laptops; TE-FS01 excluded. Explicit server exception.',
  '',
  'PROPOSAL / Design and statutory-submission delivery / depends-on: TE-FS01 Draft recording procedure.',
  '',
  'Discussion:',
  'What evidence should be preserved before disruptive action?',
  'Which contact route will you use, and what is the fallback?',
].join('\n');

test('story-bearing text never promotes quoted headings into facts or discussion sections', () => {
  const source = [
    '+30 elapsed minutes',
    'Files are unavailable.',
    '',
    'PowerShell transcript from Operator: Output',
    '  PS> Write-Output test  ',
    '',
    'FACT / Backup / description: quoted output, not confirmed recovery',
    '',
    'Discussion:',
    '- a quoted instruction, not an exercise question',
    '',
    'Email from Quoted sender: Quoted headline',
    '  still inside the transcript  ',
    '',
    'UNKNOWN / Recovery / description: restore not verified',
    '',
    'Discussion:',
    'What would you verify?',
    '',
  ].join('\n');
  const original = source;
  const parsed = parseExerciseText(source);
  assert.equal(parsed.elapsedMinutes, 30);
  assert.deepEqual(parsed.blocks, [{ kind: 'text', text: source.slice(source.indexOf('\n') + 1) }]);
  assert.equal(source, original);
});

test('released generated story text stays literal while the clock and source record are preserved', () => {
  const record = { body: releasedBody };
  const original = JSON.stringify(record);
  const { elapsedMinutes, blocks } = parseExerciseText(exerciseText(record.body));
  assert.equal(elapsedMinutes, 30);
  assert.deepEqual(blocks, [
    { kind: 'text', text: exerciseText(record.body).slice('+30 elapsed minutes\n'.length) },
  ]);
  keepsEveryLine(exerciseText(record.body));
  assert.equal(JSON.stringify(record), original);
});

test('all story kinds keep quoted headings and whitespace with multiline senders and headlines', () => {
  for (const kind of artefactKinds) {
    for (const newline of ['\n', '\r\n']) {
      for (const sender of ['Internal IT', 'Duty operator: night shift', 'Operator\nsecond line']) {
        const story = artefactText({
          kind,
          sender,
          headline: 'TE-FS01 status\nFACT / quoted headline / description: not a fact',
          body: [
            '',
            '  First line with spaces  ',
            '\tConsole output\t',
            '',
            'FACT / quoted / description: inside the story',
            '',
            'EXERCISE ASSUMPTION: still quoted',
            '',
            'Discussion:',
            '- still quoted',
            '',
            'Email from Quoted sender: Not another message',
            '',
            'Background:',
            '- another quoted heading',
            '',
            'All actions are simulated; do not contact real people or change systems.',
            '  Trailing spaces stay  ',
            '',
          ].join('\n'),
          recipientRoleIds: ['internal-it'],
        });
        const content = '\n  Leading whitespace  \n' + story + '\n\n';
        const source = content.replaceAll('\n', newline);
        const original = source;
        assert.equal(exerciseText(source), source);
        assert.deepEqual(parseExerciseText(source), {
          elapsedMinutes: null,
          blocks: [{ kind: 'text', text: content }],
        });
        assert.equal(source, original);
      }
    }
  }
});

test('generated text without stories retains tagged facts and discussion questions', () => {
  const body = [
    '+30 elapsed minutes',
    'Files are unavailable.',
    '',
    'FACT / Endpoint Guard EDR / description: Covers laptops; server excluded.',
    '',
    'PROPOSAL / Engineering service / depends-on: TE-FS01 Draft procedure.',
    '',
    'Discussion:',
    'What evidence should be preserved?',
  ].join('\n');
  assert.deepEqual(parseExerciseText(body), {
    elapsedMinutes: 30,
    blocks: [
      { kind: 'text', text: 'Files are unavailable.' },
      {
        kind: 'fact',
        status: 'fact',
        subject: 'Endpoint Guard EDR',
        field: 'description',
        text: 'Covers laptops; server excluded.',
      },
      {
        kind: 'fact',
        status: 'proposal',
        subject: 'Engineering service',
        field: 'depends-on',
        text: 'TE-FS01 Draft procedure.',
      },
      { kind: 'list', title: 'Discussion', items: ['What evidence should be preserved?'] },
    ],
  });
});

test('briefing text keeps role lines, background bullets, assumptions and continued facts', () => {
  const common = exerciseText(
    'Suspected ransomware makes shared files unavailable.\n\nBackground:\n- Eastline asked for early notice.\n- A trade-news story raised file outages.',
  );
  assert.deepEqual(parseExerciseText(common).blocks, [
    { kind: 'text', text: 'Suspected ransomware makes shared files unavailable.' },
    {
      kind: 'list',
      title: 'Background',
      items: ['Eastline asked for early notice.', 'A trade-news story raised file outages.'],
    },
  ]);
  const role =
    'Represent: Imran Salleh — IT Executive.\nFACT / Imran Salleh — IT Executive / description: Sole internal IT Executive.\nNo appointed deputy.\n\nCONFLICT / Beacon Nine Security / contact-route: Two routes disagree.';
  const parsed = parseExerciseText(role).blocks;
  assert.deepEqual(
    parsed.map((block) => block.kind),
    ['text', 'fact', 'fact'],
  );
  assert.equal(
    (parsed[1] as { text: string }).text,
    'Sole internal IT Executive.\nNo appointed deputy.',
  );
  assert.equal((parsed[2] as { status: string }).status, 'conflict');
  keepsEveryLine('\n' + role);
  assert.deepEqual(parseExerciseText('EXERCISE ASSUMPTION: The draft BCP is the plan.').blocks, [
    {
      kind: 'fact',
      status: 'assumption',
      subject: '',
      field: '',
      text: 'The draft BCP is the plan.',
    },
  ]);
});

test('text in any other layout stays plain and complete', () => {
  for (const source of [
    'File access report\nThe engineering share is unavailable.\n\nDiscuss scope before proposing a change.',
    'FACT / Backup tested: unknown',
    'Email from the controller without a headline',
    '',
  ]) {
    const { elapsedMinutes, blocks } = parseExerciseText(source);
    assert.equal(elapsedMinutes, null);
    assert(blocks.every((block) => block.kind === 'text'));
    keepsEveryLine('\n' + source);
  }
});
