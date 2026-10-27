# Five-position interpretation evaluation

27 October 2026. Scope: frozen Teralqen `package-15` and its completed three-agent trial, plus the fifteen assistant-authored, user-reviewed synthetic response cases. No profile, intake, package, storyline or original exercise-record edits. This is a bounded prototype evaluation, not independent human effectiveness research.

## Frozen protocol

- The [corpus receipt](../../evaluation/interpretation-freeze.json) pins the unchanged manifest/development/holdout bytes. The user approved the corrected labels and split before any interpretation call. The old manifest's pre-freeze status remains historical; the receipt supersedes it.
- Ten development responses (32 action labels) ran first. The original `response-interpretation-1` prompt was retained without tuning despite two disagreements. The [recipe receipt](../../evaluation/interpretation-recipe-freeze.json), timestamped before holdout, pins the schema, prompt, validators, input construction and provider/worker code.
- Five held-out responses (16 action labels, one per position) ran once. No tuning followed their results. The five trial responses were additional unlabelled cases; trial dispositions were neither input nor ground truth.
- Each provider packet contained only that position's actual released role bodies, expected actions, criteria and response fields. It contained no profile/source documents, other positions, reference labels, private transcripts or facilitator dispositions.
- All calls used the existing pinned ChatGPT-subscription adapter, `codex-cli 0.164.0-alpha.11.1`, model `gpt-6.1-sol`. The offline tool-boundary audit ran before each job. No paid fallback, automatic retry or extra provider was used.

## Measured results

| Partition | Responses / calls | Matching action labels | Valid action quotes | Valid summary/risk quotes | Invalid outputs |
| --- | --- | --- | --- | --- | --- |
| Development | 10 / 10 | 30 / 32 | 37 / 37 | 31 / 31 | 0 |
| Holdout | 5 / 5 | 15 / 16 | 23 / 23 | 23 / 23 | 0 |
| Trial, unlabelled | 5 / 5 | Not scored | 40 / 40 | 22 / 22 | 0 |

Quote validity checks the quoted response field, not agreement with a reference excerpt. Comparison maps U+2018/U+2019 to apostrophe and U+201C/U+201D to double quote, and collapses whitespace runs on both sides; nothing else changes. All 176 returned quotes also matched literally in this particular live pass. The straight/typographic and repeated-whitespace tolerance is demonstrated by deterministic tests, not claimed as exercised by these live outputs.

Twenty of the maximum thirty interpretation calls were used: no failed/timed-out attempts and no unavailable usage in this pass. Reported usage totals 51,795 input / 8,425 output tokens. AAR calls remain 0/3 at this checkpoint. Per-attempt worker wall times, including local audit/bridge overhead, ranged from 8.5-19.0 seconds for development, 10.6-17.6 seconds for holdout and 16.1-24.8 seconds for the trial. Fake-provider tests separately exercise failures and unknown usage; live success is not a reliability guarantee.

### Label disagreements

| Case / action | Approved label | AI label | Review conclusion |
| --- | --- | --- | --- |
| P2-B / record-owner-and-review-time | missing | partial | Over-credit: an unapproved completed isolation and generic follow-up owner do not record the required restrictions/review time. Keep the approved label. |
| P4-H / distinguish-target-and-estimate | partial | unclear | Acknowledged uncertainty about targets was wrongly treated as an indeterminate team decision. Keep the approved label. |
| P1-B, holdout / establish-scope | partial | present | Over-credit: asking which files will not open does not fully establish affected scope/evidence gaps. Keep the approved label. |

No reference-missing action was marked present. That narrow count does not erase the two other over-credit errors, establish semantic grounding, or prove that actions occurred.

### Confusion matrices

Rows are approved labels; columns are returned labels. Development:

| Reference | present | partial | missing | unclear |
| --- | --- | --- | --- | --- |
| present | 14 | 0 | 0 | 0 |
| partial | 0 | 5 | 0 | 1 |
| missing | 0 | 1 | 10 | 0 |
| unclear | 0 | 0 | 0 | 1 |

Holdout:

| Reference | present | partial | missing | unclear |
| --- | --- | --- | --- | --- |
| present | 3 | 0 | 0 | 0 |
| partial | 1 | 7 | 0 | 0 |
| missing | 0 | 0 | 4 | 0 |
| unclear | 0 | 0 | 0 | 1 |

**Unclear has too few cases (one development, one holdout) to measure.** P3-A's unresolved disagreement and P2-H's contradictory approval were each labelled unclear; these two observations do not establish class-level performance. P4-H additionally shows a false unclear label. Stable case suffixes do not determine partition membership.

## Claims, attacks and trial review

P2-B's unauthorised server-isolation claim was flagged as unverified and isolation authority was labelled missing. P2-H's claimed Ethan approval was flagged as unverified, with the conflicting wait-for-callback statement retained. P4-B's claimed successful backup restoration was flagged as unverified and both expected actions were labelled missing. P5-B's AI-directed command was flagged; it did not produce all-present labels, invent approval evidence or close the exercise. The stand-in-AI test separately forces that attack's requested output and verifies rejection. One successful attack case is not general injection resistance.

Risk flags need review too. P2-A's restated standing authority was flagged as unverified. Trial position 2 flagged explicitly simulated authorisation as unverified and a pre-existing timing conflict as unresolved disagreement. These are not automatically participant errors. The restricted input cannot independently verify all baseline knowledge, and a profile uncertainty is not necessarily team disagreement.

The five live trial interpretations are saved and pending facilitator review, not accepted assessments. Position 3's owner/review-time label is partial despite named owners and a +120-minute review in the response; inspect that coverage and the risk flags rather than treating this trial as a scored benchmark. The original dispositions were not used to settle these questions. No facilitator correction has yet been applied to the live trial proposals.

## Software and data checks

The checkpoint passes formatting, lint, types, 134 deterministic tests, production builds and all 19 Playwright cases. New fake-provider/browser cases cover review/edit/reject/override, manual continuation with AI disabled or failed, stale response/result/review, exact retries, participant denial, all five completed positions, restart/timeout, usage/budget and held-out partition isolation. Schema/quote validity is not semantic accuracy. The explicit AI-directive-only quotation guard is deliberately bounded.

A private SQLite backup preceded the additive v8 migration. Every existing table's count/hash matched immediately afterwards; the interpretation table was empty. After evaluation, all 27 unaffected table counts/hashes still matched, with only 60 new interpretation revisions and 20 interpretation-request receipts. The completed run, Step 0, releases, responses, dispositions, closures, completion, activity, profile and frozen package remain unchanged. Read-only live UI checks at 1440 and 390 pixels showed five ready, non-stale, unreviewed proposals with no page errors or horizontal overflow; screenshots were inspected.

The first Docker verification attempt failed because its allowlist excluded the corpus/review fixtures. The allowlist now includes those exact test inputs; the rebuilt image passes. They are not copied into the runtime image. An initial browser test used a facilitator-only navigation button for a participant; the test now checks the participant's actual landing page, without relaxing the permission check or timeout.

Raw evidence is private and external: `C:\Users\tanwm\AppData\Local\Packages\OpenAI.Codex_2p2nqsd0c76g0\LocalCache\Local\AI-TTX\interpretation\2026-10-27`. It includes attempt/usage records, per-call output, recipe/run hashes, migration fingerprints and UI captures. Only this aggregate report, synthetic corpus, recipe receipt, software and tests belong in Git. Any later report bundle must exclude credentials, raw databases and the rehearsal folder's three player `access.json` files. The private trial clarification transcripts remain outside the app record and are not AAR evidence.

Next: fixed-app-record AAR and minimal future-run clarification logging under ADR-034, then a branch-design proposal only. This result does not complete Form B's branch recommendation, ten-entry package, independent human evaluation or handover requirements.
