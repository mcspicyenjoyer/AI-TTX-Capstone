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

const root = resolve('.'),
  temporary = mkdtempSync(join(tmpdir(), 'ttx-aar-mutations-'));
function cleanTemporaryCopy() {
  if (!temporary.startsWith(join(resolve(tmpdir()), 'ttx-aar-mutations-')))
    throw new Error('Unexpected cleanup path.');
  rmSync(temporary, { recursive: true, force: true });
}
function removeRule(message: string) {
  return (source: string) => {
    const tree = ts.createSourceFile('mutation.ts', source, ts.ScriptTarget.Latest, true),
      matches: ts.IfStatement[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isIfStatement(node) && node.thenStatement.getText(tree).includes(message))
        matches.push(node);
      ts.forEachChild(node, visit);
    };
    visit(tree);
    // Select the innermost guard, not enclosing mode/loop blocks.
    matches.sort((a, b) => a.end - a.pos - (b.end - b.pos));
    const node = matches[0];
    if (!node) throw new Error('Mutation guard absent: ' + message);
    return source.slice(0, node.getStart(tree)) + '{}' + source.slice(node.end);
  };
}
function replaceOnce(before: string, after: string) {
  return (source: string) => {
    if (source.split(before).length !== 2) throw new Error('Mutation target not unique.');
    return source.replace(before, after);
  };
}
const content = 'src/server/aar-content.ts',
  service = 'src/server/aar-service.ts',
  clarification = 'src/server/clarification-service.ts',
  debrief = 'src/server/debrief-service.ts';
const debriefTests = 'tests/debrief.test.ts';
const mutations: {
  rule: string;
  file: string;
  test: string;
  tests?: string;
  edit: (source: string) => string;
}[] = [
  {
    rule: 'exact snapshot hash',
    file: service,
    test: 'AAR rejects another hash',
    edit: removeRule('selected snapshot hash'),
  },
  {
    rule: 'record field and quotation resolution',
    file: content,
    test: 'AAR rejects another hash',
    edit: removeRule('Unresolvable AAR citation'),
  },
  {
    rule: 'objective position',
    file: content,
    test: 'AAR rejects another hash',
    edit: removeRule('another objective position'),
  },
  {
    rule: 'record attribution',
    file: content,
    test: 'AAR rejects false attribution',
    edit: removeRule('attribution does not match'),
  },
  {
    rule: 'explicit gap origin',
    file: content,
    test: 'AAR distinguishes supported profile gaps',
    edit: removeRule('Gap origin is not established'),
  },
  {
    rule: 'improvement finding links',
    file: content,
    test: 'AAR rejects false attribution',
    edit: removeRule('Improvement proposal has an unresolved'),
  },
  {
    rule: 'no execution fields',
    file: content,
    test: 'AAR rejects false attribution',
    edit: replaceOnce('readStored(AarOutputSchema, value)', 'value as AarOutput'),
  },
  {
    rule: 'blank improvement owners',
    file: 'src/contracts/aar.ts',
    test: 'AAR rejects false attribution',
    edit: replaceOnce("owner: Type.Literal('')", 'owner: Type.String()'),
  },
  {
    rule: 'reviewed owner is a confirmed person with a real due date',
    file: content,
    test: 'only a facilitator review assigns owners',
    edit: removeRule('An assigned owner must be a confirmed person'),
  },
  {
    rule: 'owners limited to people in the confirmed profile',
    file: service,
    test: 'only a facilitator review assigns owners',
    edit: replaceOnce(".filter((entity) => entity.kind === 'role')", ''),
  },
  {
    rule: 'three attempt request cap',
    file: service,
    test: 'AAR three-attempt budget',
    edit: removeRule('three-call AAR budget is exhausted. Continue manually'),
  },
  {
    rule: 'no completed-run clarification backfill',
    file: clarification,
    test: 'future clarification logging requires',
    edit: removeRule('No completed-run backfill'),
  },
  {
    rule: 'confirmed clarification claim existence',
    file: clarification,
    test: 'future clarification logging requires',
    edit: removeRule('cited claim is absent'),
  },
  {
    rule: 'debrief only after completion',
    file: debrief,
    test: 'debrief is facilitator-only',
    tests: debriefTests,
    edit: removeRule('Record the debrief after the run is completed'),
  },
  {
    rule: 'debrief respondents are run participants',
    file: debrief,
    test: 'debrief is facilitator-only',
    tests: debriefTests,
    edit: removeRule('Respondents must be participants'),
  },
  {
    rule: 'summarised feedback names its participants',
    file: debrief,
    test: 'debrief is facilitator-only',
    tests: debriefTests,
    edit: removeRule('Name the participants whose feedback'),
  },
  {
    rule: 'debrief exercise-gap origin only from design notes',
    file: content,
    test: 'debrief entries reach new snapshots',
    tests: debriefTests,
    edit: replaceOnce("evidence.field === 'exerciseDesignNotes'", 'true'),
  },
];
const results: { rule: string; test: string; detected: boolean }[] = [];
try {
  for (const entry of ['src', 'tests', 'package.json', 'tsconfig.json'])
    cpSync(join(root, entry), join(temporary, entry), { recursive: true });
  symlinkSync(join(root, 'node_modules'), join(temporary, 'node_modules'), 'junction');
  const baseline = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--test', 'tests/aar.test.ts', debriefTests],
    {
      cwd: temporary,
      encoding: 'utf8',
      timeout: 90000,
    },
  );
  if (baseline.status !== 0)
    throw new Error('Baseline failed: ' + baseline.stdout + baseline.stderr);
  for (const mutation of mutations) {
    const path = join(temporary, mutation.file),
      original = readFileSync(path, 'utf8');
    try {
      writeFileSync(path, mutation.edit(original));
      const run = spawnSync(
        process.execPath,
        [
          '--import',
          'tsx',
          '--test',
          '--test-reporter=tap',
          '--test-name-pattern=' + mutation.test,
          mutation.tests ?? 'tests/aar.test.ts',
        ],
        { cwd: temporary, encoding: 'utf8', timeout: 30000 },
      );
      const output = run.stdout + run.stderr;
      const detected =
        run.status === 1 &&
        output.includes('ERR_ASSERTION') &&
        output.includes('not ok') &&
        !output.includes('SyntaxError');
      results.push({ rule: mutation.rule, test: mutation.test, detected });
      console.log((detected ? 'DETECTED: ' : 'NOT DETECTED: ') + mutation.rule);
      if (!detected) console.log(output);
    } finally {
      writeFileSync(path, original);
    }
  }
  if (process.argv[2]) {
    const path = resolve(process.argv[2]);
    if (!relative(root, path).startsWith('..'))
      throw new Error('Save execution evidence outside the repository.');
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(
      path,
      JSON.stringify({ at: new Date().toISOString(), baseline: 'passed', results }, null, 2),
    );
  }
  if (results.some((r) => !r.detected)) process.exitCode = 1;
} finally {
  cleanTemporaryCopy();
}
