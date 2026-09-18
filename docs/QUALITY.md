# Quality and verification

Status: acceptance plan, not test results. No application tests or AI evaluations exist yet.

## Definition of done
The bounded behaviour meets acceptance criteria, relevant failures are tested, required checks pass, the diff is reviewed and affected documents reflect reality. Outstanding required failures mean incomplete work. A successful build does not replace a browser workflow check.

## Scaffold checks
The scaffold must establish one executable entry point, provisionally `npm run check`, covering formatting verification, linting, types, deterministic tests and build with failure propagation. Record the chosen runtime, package manifest and lockfile together. Verify a locked clean installation in an isolated copy before documenting it as working. Add CI using the same command when runner/package access are established.

## First-slice test cases
| Case | Requirements | Evidence |
| --- | --- | --- |
| Confirm profile and bind definition | REQ-001/002 | Unknowns remain unknown; immutable revisions link profile, definition and run. |
| Reject unapproved/stale releases | REQ-003 | Missing approval, edited content, changed recipients and stale run state fail at the API/application boundary. |
| Enforce visibility/authority | REQ-005 | Participant cannot approve; direct API and event payloads exclude rubrics, future injects and other roles' private data. |
| Release consistently | REQ-003/004/006 | Retried key returns one release; changed-content key reuse and stale concurrent commands fail; inbox and audit commit consistently. |
| Capture agreed response | REQ-004/005 | Persist author/team, revision and accessible released-inject reference; reject unreleased or inaccessible references. |
| Pause/restart | REQ-006 | Paused/completed runs reject release; restart preserves activity and requires facilitator resume; no overdue automatic sends. |
| Browser workflow | REQ-001–006 | Confirm → approve/release → participant views/responds → retrieve record; inspect loading, empty, validation and error states. |
| Data configuration | REQ-011 | Invalid data directory fails clearly; no secrets in browser/logs; synthetic fixtures only. |

Use unit tests for rules, integration tests for transactions and authorisation, and browser verification for the user path. Ordinary tests are independent of AI/network services. Do not write tests that merely reproduce implementation details.

## Coached first-draft cases

Acceptance plan for [TASK-003](WORK.md#task-003---five-inject-coached-first-draft), not executed tests. These supplement, rather than replace, the first-slice authority, durability and visibility checks. Fix expected outcomes with the reviewed rubric before evaluation; normal software checks use deterministic provider fixtures.

| Case | Requirements | Evidence |
| --- | --- | --- |
| Upfront SOC/MSSP mapping | REQ-013 | Setup distinguishes internal/outsourced functions and named responding users/teams. Missing mappings block role-specific preparation; an unrelated participant cannot answer for the assigned role. |
| Five-inject single-track package | REQ-009/015 | Exactly five prepared injects in the selected track; no technical/operational mixture or decision-dependent scenario branching in the first draft. |
| First answer sufficient | REQ-014 | Resolve after one answer; do not demand or permit another answer to the closed inject. Record unaided success. |
| First insufficient, second sufficient | REQ-010/014 | Deliver targeted feedback once, retain both answers and the guidance, and record coached rather than unaided success. |
| Second answer insufficient | REQ-010/014/015 | Record an unresolved finding, reject a third submission and permit the next prepared inject only through normal approval/release checks. |
| Retries, failure and restart | REQ-004/006/014 | Duplicate submission retries do not consume another answer; provider reassessment does not create an answer. A failed evaluation preserves the submitted answer as pending, not failed. Restart retains the attempt count and cannot reopen the budget. |
| Ambiguous or disputed grading | REQ-007/014 | Human review uses the recorded answer and rubric, logs the decision and cannot grant a third answer or silently mark an insufficient answer sufficient. |
| Completion with gaps | REQ-015 | All five injects have final outcomes; unresolved findings are allowed, unanswered injects are not silently treated as complete. |
| Evidence-linked AAR | REQ-010/014 | The reviewed template preserves initial/retry answers, feedback, rubric version and outcomes; reports unaided/coached successes and unresolved findings without inventing performed actions or successful recovery. |
| Synthetic-only content | REQ-011 | Development, demonstration and evaluation packs use synthetic organisation/exercise content; source references and fixture provenance are recorded. |

## Later evaluation
For the [technical-exercise checkpoints](WORK.md#technical-exercise-checkpoints), the user owns frontend, backend and integration verification. Validate frontend mock examples against the shared contracts and verify each completed screen against the real backend. Include a non-recipient participant fixture. Restart tests must retrieve records submitted during the test; seed data is insufficient evidence of durability. Seed routines must preserve existing demonstration data. These checks establish technical-workstream evidence only, not completion or validation of the other worker's operational exercise.

For the proposed Codex experiment, verify isolation against shell/tool execution and access to application storage before accepting participant text. Test failed, interrupted, malformed and late provider results, account/usage-limit failures, duplicate requests and process restart. Only final validated output can become a draft; no provider event can approve or release it. Keep provider credentials, raw event streams and facilitator context out of participant responses. A valid JSON object alone does not establish content quality or safe agent isolation.

Before intake, use known-answer fixtures for missing/conflicting facts, bounds and source locators. Before AI, establish a human-reviewed representative and ambiguous/adversarial evaluation set, acceptable alternatives, abstention criteria and thresholds. Separate held-out cases from prompt tuning.

Record prompt version, provider/model identity, settings, input/reference versions, human labels and errors. Test unknown assets, unsupported claims, off-scenario branches and ambiguous responses. Deterministic fake providers test timeout, malformed output and manual continuation. Live evaluations are explicitly enabled only with an approved endpoint, data permission and usage limits.

Before reporting, verify observed-action claims against activity evidence and reject unsupported findings. Before deployment, verify backup/restore, access boundaries and uncertain delivery recovery. Do not describe hypothetical or failed provider results as successful.

## Evidence
WORK records task/requirement IDs, exact executed commands, date, environment, results and limitations. Later sanitised evaluation artefacts identify their test-set version. Keep sensitive runtime data out of the repository. Distinguish candidate design decisions, AI-assisted work and reviewer corrections in capstone evidence.
