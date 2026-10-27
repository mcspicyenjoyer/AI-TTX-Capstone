import { readFileSync, writeFileSync, existsSync, mkdirSync, realpathSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { prepareDataDirectory } from '../src/server/config.js';
import {
  InterpretationViewSchema,
  type InterpretationResponse,
  type ActionAssessment,
} from '../src/contracts/interpretation.js';
import { readStored } from '../src/server/validation.js';
import { normaliseResponseQuote } from '../src/server/interpretation-validation.js';

const [mode, directoryArg, executable, container] = process.argv.slice(2);
if (
  !mode ||
  !['development', 'freeze', 'holdout', 'trial', 'report'].includes(mode) ||
  !directoryArg ||
  !executable ||
  !container ||
  !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,100}$/.test(container)
)
  throw new Error('Usage: evaluate-interpretation MODE EXTERNAL_DIRECTORY CODEX_EXE CONTAINER');
const directory = prepareDataDirectory(directoryArg),
  runtime = join(directory, 'worker');
mkdirSync(runtime, { recursive: true });
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const freeze = read('evaluation/interpretation-freeze.json') as {
  status: string;
  files: Record<string, string>;
};
if (freeze.status !== 'frozen') throw new Error('Corpus is not frozen.');
for (const [name, expected] of Object.entries(freeze.files))
  if (hash(join('evaluation', name)) !== expected) throw new Error('Frozen corpus drift: ' + name);
const manifest = read('evaluation/interpretation-manifest.json') as {
  runId: string;
  packageId: string;
  packageRevisionId: string;
  packageHash: string;
};
const recipeFiles = [
  'src/contracts/interpretation.ts',
  'src/server/interpretation-content.ts',
  'src/server/interpretation-validation.ts',
  'src/server/interpretation-service.ts',
  'src/server/subscription-worker.ts',
  'src/server/codex-extraction.ts',
];
const recipe = () => Object.fromEntries(recipeFiles.map((path) => [path, hash(path)]));
const recipePath = join(directory, 'recipe-freeze.json');
const ledgerPath = join(directory, 'attempts.json');
type Attempt = {
  id: string;
  phase: string;
  caseId: string;
  position: number;
  requestedAt: string;
  inputHash: string;
  recipe: Record<string, string>;
  status: string;
  started: boolean;
  inputTokens: number | null;
  outputTokens: number | null;
  elapsedMs: number | null;
};
const ledger: Attempt[] = existsSync(ledgerPath) ? read(ledgerPath) : [];
const saveLedger = () =>
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), { mode: 0o600 });
function rpc<T>(request: unknown): T {
  const raw = execFileSync(
    'docker',
    ['exec', '-i', container!, 'node', 'dist/server/interpretation-bridge.js'],
    {
      input: JSON.stringify(request) + '\n',
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30_000,
      maxBuffer: 1_000_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );
  const response = JSON.parse(raw);
  if (response.error) throw new Error('Local interpretation bridge rejected the request.');
  return response.result as T;
}
type Context = {
  runId: string;
  packageId: string;
  packageRevisionId: string;
  packageHash: string;
  state: string;
  recordHash: string;
  attempts: number;
  positions: { position: number; releaseId: string; responseId: string | null }[];
};
function context(): Context {
  const value = rpc<Context>({ method: 'context', value: { runId: manifest.runId } });
  if (
    value.packageId !== manifest.packageId ||
    value.packageRevisionId !== manifest.packageRevisionId ||
    value.packageHash !== manifest.packageHash ||
    value.state !== 'completed' ||
    value.positions.length !== 5
  )
    throw new Error('Evaluation must use the exact completed package-15 trial.');
  const baselinePath = join(directory, 'fixed-run.json');
  if (existsSync(baselinePath)) {
    if (read(baselinePath).recordHash !== value.recordHash)
      throw new Error('The original run record changed.');
  } else writeFileSync(baselinePath, JSON.stringify(value, null, 2), { mode: 0o600 });
  return value;
}
function requireRecipeFreeze() {
  if (!existsSync(recipePath))
    throw new Error('Freeze prompt/schema/validators before holdout or trial.');
  if (JSON.stringify(read(recipePath).files) !== JSON.stringify(recipe()))
    throw new Error('Frozen interpretation recipe drift.');
}
type Case = {
  id: string;
  position: number;
  response: InterpretationResponse;
  labels: { actionKey: string; label: ActionAssessment['label'] }[];
};

if (mode === 'freeze') {
  if (ledger.filter((item) => item.phase === 'development').length < 10)
    throw new Error('Complete the development pass first.');
  if (ledger.some((item) => ['holdout', 'trial'].includes(item.phase)))
    throw new Error('Cannot replace recipe freeze after held-out/trial results.');
  if (existsSync(recipePath))
    throw new Error('A recipe freeze already exists; do not overwrite it.');
  writeFileSync(
    recipePath,
    JSON.stringify(
      {
        frozenAt: new Date().toISOString(),
        corpus: freeze.files,
        files: recipe(),
        developmentAttempts: ledger.length,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log('Prompt, schema, validators and input construction frozen before holdout.');
} else if (mode === 'report') {
  requireRecipeFreeze();
  context();
  const labels = ['present', 'partial', 'missing', 'unclear'] as const;
  const report: Record<string, unknown> = {
    corpus: freeze.files,
    recipe: read(recipePath),
    liveInterpretationAttempts: context().attempts,
    evidenceDirectory: realpathSync.native(directory),
    aarAttempts: 0,
    limits: [
      'Assistant-authored, user-reviewed synthetic reference set; not an independent benchmark.',
      'Unclear has too few cases (one development, one holdout) to measure.',
      'Trial dispositions are not input or ground truth. Trial responses are unlabelled additional cases.',
      'Quotations are attributed statements, never evidence of execution or recovery.',
    ],
  };
  for (const phase of ['development', 'holdout'] as const) {
    const cases = read('evaluation/interpretation-' + phase + '.json') as Case[];
    const matrix = Object.fromEntries(
      labels.map((label) => [label, Object.fromEntries(labels.map((other) => [other, 0]))]),
    );
    let matched = 0,
      scored = 0,
      invalidOutputs = 0,
      quotes = 0,
      actionQuotes = 0,
      validQuotes = 0,
      promotedMissing = 0;
    const disagreements: { caseId: string; action: string; expected: string; actual: string }[] =
      [];
    for (const entry of cases) {
      const attempt = ledger
        .filter((item) => item.phase === phase && item.caseId === entry.id)
        .at(-1);
      if (!attempt) throw new Error('Missing evaluation case: ' + entry.id);
      const view = readStored(InterpretationViewSchema, rpc({ method: 'get', id: attempt.id }));
      const rawPath = join(runtime, attempt.id + '.json');
      const rawOutput = existsSync(rawPath) ? read(rawPath).output : null;
      const actionEvidence = (Array.isArray(rawOutput?.actions) ? rawOutput.actions : []).flatMap(
        (action: ActionAssessment) => (Array.isArray(action.evidence) ? action.evidence : []),
      );
      actionQuotes += actionEvidence.length;
      const otherEvidence = [
        ...Object.values(rawOutput?.summary ?? {}).flatMap((value) =>
          Array.isArray(value) ? value : [],
        ),
        ...(Array.isArray(rawOutput?.risks) ? rawOutput.risks : []).flatMap(
          (risk: { evidence: unknown[] }) => (Array.isArray(risk.evidence) ? risk.evidence : []),
        ),
      ];
      for (const evidence of [...actionEvidence, ...otherEvidence]) {
        quotes++;
        if (
          ['actions', 'rationale', 'informationRequests'].includes(evidence.field) &&
          typeof evidence.quote === 'string' &&
          evidence.quote.trim() &&
          normaliseResponseQuote(
            entry.response[evidence.field as keyof InterpretationResponse],
          ).includes(normaliseResponseQuote(evidence.quote))
        )
          validQuotes++;
      }
      if (!view.record.proposal) {
        invalidOutputs++;
        continue;
      }
      for (const expected of entry.labels) {
        const actual = view.record.proposal.actions.find(
          (action) => action.actionKey === expected.actionKey,
        )!.label;
        matrix[expected.label]![actual]!++;
        scored++;
        if (actual === expected.label) matched++;
        else
          disagreements.push({
            caseId: entry.id,
            action: expected.actionKey,
            expected: expected.label,
            actual,
          });
        if (expected.label === 'missing' && actual === 'present') promotedMissing++;
      }
    }
    report[phase] = {
      cases: cases.length,
      expectedActionCount: cases.flatMap((entry) => entry.labels).length,
      attempts: ledger.filter((item) => item.phase === phase).length,
      matched,
      scored,
      invalidOutputs,
      quotes,
      actionQuotes,
      summaryAndRiskQuotes: quotes - actionQuotes,
      validQuotes,
      promotedMissing,
      confusion: matrix,
      disagreements,
    };
  }
  report.trial = ledger
    .filter((item) => item.phase === 'trial')
    .map((attempt) => {
      const view = readStored(InterpretationViewSchema, rpc({ method: 'get', id: attempt.id }));
      const output = view.record.proposal;
      const quotes = output
        ? [
            ...output.actions.flatMap((action) =>
              Array.isArray(action.evidence) ? action.evidence : [],
            ),
            ...Object.values(output.summary).flatMap((value) =>
              Array.isArray(value) ? value : [],
            ),
            ...output.risks.flatMap((risk) => risk.evidence),
          ]
        : [];
      return {
        position: attempt.position,
        id: attempt.id,
        status: view.record.status,
        stale: view.stale,
        labels: view.record.proposal?.actions.map(({ actionKey, label }) => ({ actionKey, label })),
        riskKinds: view.record.proposal?.risks.map((risk) => risk.kind),
        reviewed: view.record.review !== null,
        quoteCount: quotes.length,
        validQuoteCount: quotes.filter((quote) =>
          normaliseResponseQuote(view.record.input.response[quote.field]).includes(
            normaliseResponseQuote(quote.quote),
          ),
        ).length,
      };
    });
  report.usage = {
    reportedInputTokens: ledger.reduce((sum, item) => sum + (item.inputTokens ?? 0), 0),
    reportedOutputTokens: ledger.reduce((sum, item) => sum + (item.outputTokens ?? 0), 0),
    attemptsWithUnknownUsage: ledger.filter(
      (item) => item.inputTokens === null || item.outputTokens === null,
    ).length,
    failures: ledger.filter((item) => item.status !== 'ready').length,
  };
  writeFileSync(join(directory, 'report.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
} else {
  if (mode !== 'development') requireRecipeFreeze();
  if (mode === 'development' && existsSync(recipePath))
    throw new Error('Development is closed after recipe freeze.');
  const baseline = context();
  const cases: (Case | { id: string; position: number })[] =
    mode === 'trial'
      ? baseline.positions.map((position) => ({
          id: 'trial-' + position.position,
          position: position.position,
        }))
      : read('evaluation/interpretation-' + mode + '.json');
  for (const entry of cases) {
    if (ledger.some((item) => item.phase === mode && item.caseId === entry.id))
      throw new Error('No automatic repeat of an existing case: ' + entry.id);
    if (mode !== 'development') requireRecipeFreeze();
    const current = context();
    if (current.attempts >= 30) throw new Error('Interpretation call budget exhausted.');
    const position = current.positions.find((item) => item.position === entry.position);
    if (!position?.responseId) throw new Error('Missing recorded position response.');
    const value = { runId: manifest.runId, releaseId: position.releaseId, commandId: randomUUID() };
    const view = readStored(
      InterpretationViewSchema,
      rpc(
        mode === 'trial'
          ? { method: 'request', value }
          : {
              method: 'evaluate',
              value: {
                ...value,
                purpose: mode,
                caseId: entry.id,
                response: (entry as Case).response,
              },
            },
      ),
    );
    if (
      'labels' in entry &&
      JSON.stringify(view.record.input.expectedActions.map((item) => item.key)) !==
        JSON.stringify(entry.labels.map((item) => item.actionKey))
    )
      throw new Error('Frozen expected action mismatch.');
    const attempt: Attempt = {
      id: view.record.id,
      phase: mode,
      caseId: entry.id,
      position: entry.position,
      requestedAt: new Date().toISOString(),
      inputHash: view.record.inputHash,
      recipe: recipe(),
      status: 'requested',
      started: false,
      inputTokens: null,
      outputTokens: null,
      elapsedMs: null,
    };
    ledger.push(attempt);
    saveLedger();
    const started = Date.now();
    let workerFailed = false;
    try {
      execFileSync(
        process.execPath,
        [
          '--import',
          'tsx',
          'src/server/subscription-worker.ts',
          resolve(executable),
          runtime,
          container,
          'interpretations',
          'once',
        ],
        {
          windowsHide: true,
          timeout: 420_000,
          maxBuffer: 100_000,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
    } catch {
      workerFailed = true;
    }
    const after = readStored(InterpretationViewSchema, rpc({ method: 'get', id: view.record.id }));
    Object.assign(attempt, {
      status: after.record.status,
      started: after.record.startedAt !== null,
      inputTokens: after.record.inputTokens,
      outputTokens: after.record.outputTokens,
      elapsedMs: Date.now() - started,
    });
    saveLedger();
    context();
    console.log(
      JSON.stringify({
        caseId: entry.id,
        status: attempt.status,
        started: attempt.started,
        inputTokens: attempt.inputTokens,
        outputTokens: attempt.outputTokens,
        elapsedMs: attempt.elapsedMs,
      }),
    );
    if (workerFailed && ['queued', 'running'].includes(after.record.status))
      throw new Error('Worker did not settle the queued attempt; stop rather than silently retry.');
  }
  console.log('Completed ' + mode + ' pass. Original exercise record unchanged.');
}
