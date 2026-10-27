import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { actionKinds } from '../src/contracts/generation.js';

type Field = 'actions' | 'rationale' | 'informationRequests';
type Label = 'present' | 'partial' | 'missing' | 'unclear';
type Case = {
  id: string;
  position: number;
  purpose: string;
  response: Record<Field, string>;
  labels: {
    actionKey: string;
    label: Label;
    field: Field | null;
    quote: string | null;
    reason: string;
  }[];
  riskChecks: { kind: string; field: Field; quote: string }[];
};
const read = (name: string) =>
  JSON.parse(readFileSync(new URL(`../evaluation/${name}`, import.meta.url), 'utf8'));
const manifest = read('interpretation-manifest.json') as {
  approval: string;
  frozen: boolean;
  developmentCaseIds: string[];
  holdoutCaseIds: string[];
  labels: Record<Label, string>;
  limitations: string[];
  quotePolicy: { minimumQuotes: number; maximumQuotes: number; validation: string };
  packageRevisionId: string;
  packageHash: string;
  positions: { position: number; actionKeys: string[] }[];
  liveBudget: {
    interpretationMaximum: number;
    aarMaximum: number;
    developmentAttemptMaximum: number;
    reservedHoldoutCases: number;
    reservedTrialCases: number;
    failuresConsumeAttempt: boolean;
    unreportedUsage: string;
    paidFallback: boolean;
  };
};
const development = read('interpretation-development.json') as Case[];
const holdout = read('interpretation-holdout.json') as Case[];
const all = [...development, ...holdout];

// These checks validate authored data, not the semantic correctness of its proposed labels.
test('interpretation corpus has ten development and five distinct held-out cases', () => {
  assert.equal(development.length, 10);
  assert.equal(holdout.length, 5);
  assert.equal(new Set(all.map((entry) => entry.id)).size, 15);
  assert.equal(new Set(all.map((entry) => JSON.stringify(entry.response))).size, 15);
  assert.equal(manifest.packageRevisionId, 'package-15');
  assert.equal(
    manifest.packageHash,
    'cc10e600b562fae583c827bc8a18471ab61710a5eeb6db1ff502638db3183eb8',
  );
  assert(
    ['pending-user-review', 'user-approved', 'user-approved-with-corrections'].includes(
      manifest.approval,
    ),
  );
  assert.equal(typeof manifest.frozen, 'boolean');
  assert.deepEqual(
    development.map((entry) => entry.id),
    manifest.developmentCaseIds,
  );
  assert.deepEqual(
    holdout.map((entry) => entry.id),
    manifest.holdoutCaseIds,
  );
  assert.deepEqual(manifest.holdoutCaseIds, ['P1-B', 'P2-H', 'P3-H', 'P4-B', 'P5-H']);
  for (const position of manifest.positions) {
    assert.equal(development.filter((entry) => entry.position === position.position).length, 2);
    assert.equal(holdout.filter((entry) => entry.position === position.position).length, 1);
  }
  for (const entry of all) {
    assert(entry.purpose.trim());
    assert.deepEqual(Object.keys(entry.response).sort(), [
      'actions',
      'informationRequests',
      'rationale',
    ]);
    assert(entry.response.actions.trim());
    assert(entry.response.rationale.trim());
    assert(Object.values(entry.response).every((text) => text.length <= 3000));
    assert(Object.values(entry.response).join(' ').split(/\s+/).length <= 150, entry.id);
  }
});

test('interpretation corpus covers exact action keys and quotes actual response substrings', () => {
  const labels = new Set<Label>(['present', 'partial', 'missing', 'unclear']);
  for (const entry of all) {
    const position = manifest.positions.find((candidate) => candidate.position === entry.position);
    assert(position, entry.id);
    assert.deepEqual(
      entry.labels.map((row) => row.actionKey),
      position.actionKeys,
      entry.id,
    );
    assert.equal(new Set(position.actionKeys).size, position.actionKeys.length);
    for (const row of entry.labels) {
      assert(
        actionKinds.some((key) => key === row.actionKey),
        `${entry.id}: ${row.actionKey}`,
      );
      assert(labels.has(row.label));
      assert(row.reason.trim());
      if (row.field === null || row.quote === null) {
        assert.equal(row.field, null);
        assert.equal(row.quote, null);
        assert.equal(row.label, 'missing');
      } else {
        assert(row.quote.trim());
        assert(entry.response[row.field].includes(row.quote), `${entry.id}: ${row.actionKey}`);
      }
    }
    for (const risk of entry.riskChecks) {
      assert(risk.quote.trim());
      assert(entry.response[risk.field].includes(risk.quote), `${entry.id}: ${risk.kind}`);
    }
  }
  assert.deepEqual(
    new Set(development.flatMap((entry) => entry.labels.map((row) => row.label))),
    labels,
  );
});

test('interpretation evaluation reserves holdout and trial calls within the authorised budget', () => {
  const budget = manifest.liveBudget;
  assert.equal(budget.interpretationMaximum, 30);
  assert.equal(budget.aarMaximum, 3);
  assert.equal(
    budget.developmentAttemptMaximum + budget.reservedHoldoutCases + budget.reservedTrialCases,
    30,
  );
  assert.equal(budget.reservedHoldoutCases, holdout.length);
  assert.equal(budget.reservedTrialCases, 5);
  assert.equal(budget.failuresConsumeAttempt, true);
  assert.equal(budget.unreportedUsage, 'unknown');
  assert.equal(budget.paidFallback, false);
  const risks = new Set(all.flatMap((entry) => entry.riskChecks.map((risk) => risk.kind)));
  for (const required of [
    'near-empty',
    'off-topic',
    'ai-directed-instruction',
    'contradicts-authority',
    'unverified-approval-claim',
    'unverified-recovery-claim',
  ])
    assert(risks.has(required), required);
});

test('interpretation protocol distinguishes uncertainty from unclear decisions and limits measurement', () => {
  for (const partition of [development, holdout])
    assert.equal(
      partition.flatMap((entry) => entry.labels).filter((row) => row.label === 'unclear').length,
      1,
    );
  assert(
    manifest.labels.unclear.includes(
      'A team that clearly states a fact is unknown and acts on that has given a clear answer',
    ),
  );
  assert(
    manifest.limitations.some(
      (limit) => limit.includes('one development, one holdout') && limit.includes('too few cases'),
    ),
  );
  assert.equal(manifest.quotePolicy.minimumQuotes, 1);
  assert.equal(manifest.quotePolicy.maximumQuotes, 3);
  assert(manifest.quotePolicy.validation.includes('Score validity, not equality'));
  const review = readFileSync(
    new URL('../docs/evaluation/interpretation-label-review.md', import.meta.url),
    'utf8',
  );
  assert(review.includes(manifest.labels.unclear));
  assert(review.includes(manifest.limitations[0]!));
});
