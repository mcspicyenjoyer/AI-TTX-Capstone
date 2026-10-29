import {
  mkdtempSync,
  cpSync,
  symlinkSync,
  readFileSync,
  writeFileSync,
  rmSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

// Deliberate guard removal in disposable source copies, never the working checkout.
const root = resolve('.');
const temporary = mkdtempSync(join(tmpdir(), 'ttx-generation-mutations-'));
function cleanTemporaryCopy(): void {
  if (!temporary.startsWith(join(tmpdir(), 'ttx-generation-mutations-')))
    throw new Error('Unexpected cleanup path.');
  rmSync(temporary, { recursive: true, force: true });
}
type Mutation = { name: string; file: string; test: string; edit: (source: string) => string };
function removeRule(message: string) {
  return (source: string) => {
    const tree = ts.createSourceFile('mutation.ts', source, ts.ScriptTarget.Latest, true);
    const matches: ts.IfStatement[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isIfStatement(node) && node.thenStatement.getText(tree).includes(message))
        matches.push(node);
      ts.forEachChild(node, visit);
    };
    visit(tree);
    if (matches.length !== 1)
      throw new Error(`Expected one rule for ${message}; found ${matches.length}`);
    const node = matches[0]!;
    return source.slice(0, node.getStart(tree)) + '{}' + source.slice(node.end);
  };
}
function replaceOnce(before: string, after: string) {
  return (source: string) => {
    if (source.split(before).length !== 2) throw new Error(`Mutation target not unique: ${before}`);
    return source.replace(before, after);
  };
}
const service = 'src/server/generation-service.ts',
  content = 'src/server/generation-content.ts',
  engine = 'src/server/exercise-service.ts';
const authority = 'generation authority requires';
const composition = 'generation enforces TE-FS01';
const privateReview = 'generation proposals stay private';
const mutations: Mutation[] = [
  {
    name: 'preparation plan source exists and is a plan',
    file: content,
    test: 'preparation rejects invalid',
    edit: removeRule('Preparation requires an existing continuity plan source'),
  },
  {
    name: 'preparation shared knowledge states',
    file: content,
    test: 'preparation rejects invalid',
    edit: removeRule('Preparation shared evidence must retain'),
  },
  {
    name: 'preparation covers all roles',
    file: service,
    test: 'preparation rejects invalid',
    edit: removeRule('Preparation must cover each player role'),
  },
  {
    name: 'preparation invalidates all inject acceptances',
    file: service,
    test: 'preparation review invalidates',
    edit: replaceOnce(
      "next.reviews = next.reviews.map(() => 'pending');",
      'next.reviews = next.reviews;',
    ),
  },
  {
    name: 'Step 0 references exclude specialist role material',
    file: engine,
    test: 'preparation shared Step 0',
    edit: replaceOnce(
      '? definition.briefing.references',
      '? [...definition.briefing.references, ...definition.roles.map((item) => item.briefing)]',
    ),
  },
  {
    name: 'generated engine fields required',
    file: 'src/server/exercise-validation.ts',
    test: 'generation engine contract rejects',
    edit: removeRule('Generated package content is incomplete'),
  },
  {
    name: 'role bodies match recipient roles',
    file: 'src/server/exercise-validation.ts',
    test: 'generation engine contract rejects',
    edit: removeRule('Role-specific bodies must match'),
  },
  {
    name: 'frozen package exact content hash',
    file: 'src/server/generation-store.ts',
    test: 'generation frozen content hash',
    edit: replaceOnce(
      "draft?.status === 'frozen' && draft.frozenPackageHash === packageHash",
      "draft?.status === 'frozen'",
    ),
  },
  {
    name: 'request exact profile binding',
    file: service,
    test: 'generation binding rejects',
    edit: removeRule('Only the pinned confirmed'),
  },
  {
    name: 'current confirmed profile',
    file: service,
    test: 'generation requires the exact',
    edit: removeRule('The exact pinned profile must be current'),
  },
  {
    name: 'provider exact profile binding',
    file: content,
    test: 'generation provider binding',
    edit: removeRule('Generated profile binding'),
  },
  {
    name: 'facilitator authority',
    file: service,
    test: authority,
    edit: removeRule('Package drafts are facilitator-only'),
  },
  {
    name: 'profile membership',
    file: service,
    test: authority,
    edit: removeRule('cannot use that confirmed profile'),
  },
  {
    name: 'draft ownership',
    file: service,
    test: authority,
    edit: removeRule('cannot read that package draft'),
  },
  {
    name: 'named entity existence and type',
    file: content,
    test: 'generation rejects invented',
    edit: removeRule('Unknown or incorrectly typed organisation reference'),
  },
  {
    name: 'claim lookup and knowledge-state validation',
    file: content,
    test: 'generation rejects unknown claims',
    edit: (source) =>
      removeRule('A profile knowledge state')(removeRule('Unknown profile claim.')(source)),
  },
  {
    name: 'unknown conflict proposal status preservation',
    file: content,
    test: 'generation rejects unknown claims',
    edit: removeRule('A profile knowledge state'),
  },
  {
    name: 'bounded events prose and no branches',
    file: content,
    test: 'generation bounded schema',
    edit: replaceOnce(
      'const plan = readStored(GeneratedPlanSchema, value);',
      'const plan = value as GeneratedPlan;',
    ),
  },
  {
    name: 'confirmed TE-FS01 dependency',
    file: content,
    test: composition,
    edit: removeRule('requires the sourced TE-FS01'),
  },
  {
    name: 'fictional reference time',
    file: content,
    test: composition,
    edit: removeRule('Use the confirmed fictional reference time'),
  },
  {
    name: 'three player functions',
    file: content,
    test: composition,
    edit: removeRule('Exactly the three reviewed player functions'),
  },
  {
    name: 'nonduplicated person assignments',
    file: content,
    test: composition,
    edit: removeRule('A named person cannot silently'),
  },
  {
    name: 'MSP and SOC facilitator supplier assignment',
    file: content,
    test: composition,
    edit: removeRule('The facilitator represents the confirmed MSP'),
  },
  {
    name: 'three ordered decision points',
    file: content,
    test: composition,
    edit: removeRule('Require the three decision points'),
  },
  {
    name: 'five ordered positions and scenario clock',
    file: content,
    test: composition,
    edit: removeRule('Five ordered positions'),
  },
  {
    name: 'per-position role coverage',
    file: content,
    test: composition,
    edit: removeRule('Every position requires'),
  },
  {
    name: 'criteria linked to expected actions',
    file: content,
    test: composition,
    edit: removeRule('Criteria must evaluate'),
  },
  {
    name: 'all five accepted before freeze',
    file: service,
    test: privateReview,
    edit: removeRule('Review and accept all five'),
  },
  {
    name: 'frozen packages immutable',
    file: service,
    test: privateReview,
    edit: removeRule('Only a generated draft under review'),
  },
  {
    name: 'stale approval after edit',
    file: service,
    test: 'generation edit invalidates',
    edit: removeRule('The package changed. Review'),
  },
  {
    name: 'subscription disabled generation',
    file: service,
    test: 'generation disabled queue',
    edit: removeRule('Subscription generation is disabled.'),
  },
  {
    name: 'unpublished engine package blocked',
    file: engine,
    test: 'generation engine refuses',
    edit: removeRule('The generated package has not been approved'),
  },
  {
    name: 'recipient-specific inbox projection',
    file: engine,
    test: 'generation five positions deliver',
    edit: replaceOnce(
      'release.deliveries.find((delivery) => delivery.actorId === actor.id)?.body',
      'release.deliveries[0]?.body',
    ),
  },
  {
    name: 'borrowed approval aligned revisions',
    file: engine,
    test: 'borrowed approval is rejected even',
    edit: replaceOnce('approval.runId !== runId ||', ''),
  },
  {
    name: 'prior position closure gate',
    file: engine,
    test: 'next inject cannot be approved or released while',
    edit: removeRule('Close the released position before approving'),
  },
  {
    name: 'objective decision action at each decision position',
    file: content,
    test: 'generation objective coverage',
    edit: removeRule('decision) must evaluate'),
  },
  {
    name: 'objective supporting action within its positions',
    file: content,
    test: 'generation objective coverage',
    edit: removeRule('must evaluate ${rule.supporting'),
  },
  {
    name: 'every supporting action evaluated somewhere',
    file: content,
    test: 'generation objective coverage',
    edit: removeRule('No position evaluates'),
  },
  {
    name: 'objective coverage freeze gate',
    file: service,
    test: 'generation objective coverage',
    edit: removeRule('Resolve objective coverage before freezing'),
  },
];
const results: { rule: string; test: string; detected: boolean }[] = [];
try {
  for (const entry of ['src', 'tests', 'package.json', 'tsconfig.json'])
    cpSync(join(root, entry), join(temporary, entry), { recursive: true });
  symlinkSync(join(root, 'node_modules'), join(temporary, 'node_modules'), 'junction');
  const baseline = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--test', 'tests/generation.test.ts', 'tests/exercise.test.ts'],
    { cwd: temporary, encoding: 'utf8', timeout: 90_000 },
  );
  if (baseline.status !== 0)
    throw new Error(
      `Baseline failed; mutation results would be meaningless.\n${baseline.stdout}\n${baseline.stderr}`,
    );
  for (const mutation of mutations) {
    const path = join(temporary, mutation.file),
      original = readFileSync(path, 'utf8');
    try {
      writeFileSync(path, mutation.edit(original));
      const file = /^(generation|preparation)/.test(mutation.test)
        ? 'tests/generation.test.ts'
        : 'tests/exercise.test.ts';
      const run = spawnSync(
        process.execPath,
        [
          '--import',
          'tsx',
          '--test',
          '--test-reporter=tap',
          `--test-name-pattern=${mutation.test}`,
          file,
        ],
        { cwd: temporary, encoding: 'utf8', timeout: 30_000 },
      );
      const output = run.stdout + run.stderr;
      const detected =
        run.status === 1 &&
        output.includes('not ok') &&
        output.includes('ERR_ASSERTION') &&
        !output.includes('SyntaxError');
      results.push({ rule: mutation.name, test: mutation.test, detected });
      console.log(`${detected ? 'DETECTED' : 'NOT DETECTED'}: ${mutation.name}`);
      if (!detected) console.log(output);
    } finally {
      writeFileSync(path, original);
    }
  }
  const output = process.argv[2];
  if (output) {
    const path = resolve(output);
    if (!relative(root, path).startsWith('..'))
      throw new Error('Save mutation execution evidence outside the repository.');
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(
      path,
      JSON.stringify({ at: new Date().toISOString(), baseline: 'passed', results }, null, 2),
    );
  }
  if (results.some((result) => !result.detected)) process.exitCode = 1;
} finally {
  cleanTemporaryCopy();
}
