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

## Later evaluation
For the two-person checkpoints, validate frontend mock examples against the shared contracts and verify each completed screen against the real backend. Include a non-recipient participant fixture. Restart tests must retrieve records submitted during the test; seed data is insufficient evidence of durability. Seed routines must preserve existing demonstration data.

For the proposed Codex experiment, verify isolation against shell/tool execution and access to application storage before accepting participant text. Test failed, interrupted, malformed and late provider results, account/usage-limit failures, duplicate requests and process restart. Only final validated output can become a draft; no provider event can approve or release it. Keep provider credentials, raw event streams and facilitator context out of participant responses. A valid JSON object alone does not establish content quality or safe agent isolation.

Before intake, use known-answer fixtures for missing/conflicting facts, bounds and source locators. Before AI, establish a human-reviewed representative and ambiguous/adversarial evaluation set, acceptable alternatives, abstention criteria and thresholds. Separate held-out cases from prompt tuning.

Record prompt version, provider/model identity, settings, input/reference versions, human labels and errors. Test unknown assets, unsupported claims, off-scenario branches and ambiguous responses. Deterministic fake providers test timeout, malformed output and manual continuation. Live evaluations are explicitly enabled only with an approved endpoint, data permission and usage limits.

Before reporting, verify observed-action claims against activity evidence and reject unsupported findings. Before deployment, verify backup/restore, access boundaries and uncertain delivery recovery. Do not describe hypothetical or failed provider results as successful.

## Evidence
WORK records task/requirement IDs, exact executed commands, date, environment, results and limitations. Later sanitised evaluation artefacts identify their test-set version. Keep sensitive runtime data out of the repository. Distinguish candidate design decisions, AI-assisted work and reviewer corrections in capstone evidence.
