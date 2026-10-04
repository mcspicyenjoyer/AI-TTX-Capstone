# Quality and verification

Status: acceptance plan; WORK records executed results. Deterministic contract/API/persistence tests and Playwright profile/exercise checks accompany TASK-001A/B/C and the operational skeleton. Response, completed-exercise and AI evaluation evidence remain outstanding.

## Form B acceptance sequence

ADR-021 makes [Form B's mapped outcomes](PROJECT.md#form-b-traceability) authoritative. Five injects are the user-authorised first playable baseline; expand to ten for the final 10-15-entry requirement. Counts alone do not establish completion: final evidence must cover every FB-01-12 outcome. The operational development skeleton is a parallel, separately verified handoff, not a completed operational exercise. Deferred coaching/readiness cases below do not block baseline acceptance.

| Stage / case | Required evidence |
| --- | --- |
| Step 0 preparation | Before inject 1, confirm assigned functions, incident leadership/escalation, reference/contact routes, decision authority and simulation limits against reviewed context. Missing/stale/conflicting information remains explicit; essential gaps have a reviewed disposition. No automatic CTM pass/fail, real notifications, hidden-criteria disclosure or extra inject. Preparation evidence binds the applicable revisions; a profile confirmation alone cannot substitute. The engineering fixture has bounded contract/browser coverage; reviewed five-inject context is still required. |
| First playable five | Complete the deterministic one-inject checks, then exercise five reviewed inject positions through the same real browser/API/storage path. Approval, recipient filtering, responses, ordered activity, manual progression and restart recovery hold throughout; no mandatory coached retry. |
| Bounded intake and reconciliation | Known-answer fixtures cover the agreed diagram format, continuity text present/absent, guided answers, missing/conflicting information and source locators. Users can correct/reject/add facts before approval; generated content binds the confirmed revision. Unsupported input fails clearly. |
| Controlled threats and generation | Reviewed tests trace pathway candidates and generated package content to the confirmed profile and controlled library. Check five for the intermediate package and ten for final acceptance; reject unsupported assets, inconsistent artefacts, unreviewed branches and scope drift. Final package has 3-4 functional roles and three key decision points. |
| Interpretation and facilitator control | Human-reviewed known-answer/ambiguous responses cover present/missing expected actions and approved-branch recommendations. Approve/edit/reject/override/pause/manual continuation work; revisions invalidate stale approvals and recommendations never release themselves. |
| Record and report | Timeline, agreed actions/rationale/information requests, facilitator decisions, observations and branch changes persist with evidence. Draft AAR/improvement outputs are human-reviewable and cannot invent performed actions or recovery. An action-closure tracker is not required. |
| Expansion to ten | Run ten through the same engine without global five-slot limits, content/recipient leaks, duplicate release or skipped required records. Check coherent branches, restart and manual fallback at the expanded count. Five-stage evidence alone is not final baseline evidence. |
| Evaluation and handover | Controlled extraction/grounding/consistency/interpretation/branch-agreement/control/fallback/usefulness results are recorded with limitations. Verify the synthetic reference pack, source/configuration/schema/prompt/test notes, user guide, school-safe demo, capstone report and presentation against FB-12. |

Ordinary checks use fake providers. Any live AI evaluation requires the established explicit data/provider/usage authority; a valid schema, source review or design diagram is not evidence of a successful AI integration. Review applicable guidance versions for FB-02 before claiming a standards mapping; no certification judgement is part of acceptance.

## Operational skeleton checks

Acceptance checks for [TASK-005](WORK.md#task-005---operational-development-skeleton); its dated WORK entry records executed results. Verify clean Docker startup and a real operational-entry browser/API path using its synthetic development fixture. Contracts reject unknown tracks and mismatched package/run bindings; direct requests cannot gain authority from a track label, see another run's restricted records or receive facilitator-only material. Add checks for each shared execution operation when introduced.

Keep existing technical-profile/confirmation tests passing. Check operational loading/empty/error states, desktop/mobile layout and honest unavailability of unimplemented actions. The handoff identifies executable schemas, examples, ownership, extension/test locations, separate local data and current limitations. Empty directories or a UI-only selector do not satisfy this milestone. No operational exercise acceptance is inferred from a passing fixture.

## Definition of done
The bounded behaviour meets acceptance criteria, relevant failures are tested, required checks pass, the diff is reviewed and affected documents reflect reality. Outstanding required failures mean incomplete work. A successful build does not replace a browser workflow check.

## Scaffold checks
The scaffold must establish one executable entry point, provisionally `npm run check`, covering formatting verification, linting, types, deterministic tests and build with failure propagation. Record the chosen runtime, package manifest and lockfile together. Verify a locked clean installation in an isolated copy before documenting it as working. Add CI using the same command when runner/package access are established.

Git text checkouts use LF through `.gitattributes`, matching `.editorconfig` and Prettier, so a Windows checkout does not fail the Linux Docker formatting gate solely because of CRLF conversion. Keep the formatting check strict; verify there are no semantic source changes when normalising existing build inputs.

Branding checks under ADR-015 verify "TTX Platform" in the browser title and shared header for sign-in, facilitator and participant views. Sign-in remains track-neutral; profiles and exercises label their track. The assigned-exercise selector must use the server-filtered list, never grant access merely by switching a label. Check desktop and mobile layout after label changes.

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

Current regression entry points: [profile tests](../tests/profile.test.ts), [exercise tests](../tests/exercise.test.ts) and [browser tests](../tests/browser/exercise.spec.ts). Exercise tests include binding/recipient rejection, required Step 0/profile confirmation, current and superseded approvals, changed package/membership, same-key retries, competing requests, forced transactional failure, process-restart recovery and additive migration. Browser coverage includes a committed release whose HTTP response is lost, followed by an exact-key retry, participant/non-recipient separation and operational read-error recovery. Profile and exercise browser projects use separate temporary databases; workers inherit the same data-directory identity as their server. Contract sequences of five and ten entries prove count independence only, not reviewed scenario, response, branch or final Form B acceptance.

## Coached first-draft cases

Deferred extension cases from the former TASK-003 scope, not executed tests or requirements of the newly authorised five-inject baseline. Under ADR-021, coaching waits until Form B completion. Retain these for later consideration; shared authority/durability/visibility checks and baseline expected-action evaluation remain required independently. Fix extension outcomes with a reviewed rubric before any later coaching implementation.

| Case | Requirements | Evidence |
| --- | --- | --- |
| Upfront SOC/MSSP mapping | REQ-013 | Setup distinguishes internal/outsourced functions and named responding users/teams. Missing mappings block role-specific preparation; an unrelated participant cannot answer for the assigned role. |
| Five-inject single-track package | REQ-009/015/018 | Five participant-facing positions in the selected track, with one reviewed variant per position. Authored alternatives do not increase the five-inject run count; no technical/operational mixture. |
| First answer sufficient | REQ-014 | Resolve after one answer; do not demand or permit another answer to the closed inject. Record first-attempt success on that inject, without implying no influence from earlier coaching. |
| First insufficient, second sufficient | REQ-010/014 | Deliver targeted feedback once, retain both answers and the guidance, and record coached success separately from a sufficient first attempt. |
| Second answer insufficient | REQ-010/014/015 | Record an unresolved finding, reject a third submission and permit the next prepared inject only through normal approval/release checks. |
| Retries, failure and restart | REQ-004/006/014 | Duplicate submission retries do not consume another answer; provider reassessment does not create an answer. A failed evaluation preserves the submitted answer as pending, not failed. Restart retains the attempt count and cannot reopen the budget. |
| Ambiguous or disputed grading | REQ-007/014 | Human review uses the recorded answer and rubric, logs the decision and cannot grant a third answer or silently mark an insufficient answer sufficient. |
| Completion with gaps | REQ-015 | All five injects have final outcomes; unresolved findings are allowed, unanswered injects are not silently treated as complete. |
| Evidence-linked AAR | REQ-010/014 | The reviewed template preserves initial/retry answers, feedback, rubric version and outcomes; reports first-attempt/coached successes and unresolved findings without inventing performed actions or successful recovery. Debrief observations remain attributed; action completion requires evidence. |
| Synthetic-only content | REQ-011 | Development, demonstration and evaluation packs use synthetic organisation/exercise content; source references and fixture provenance are recorded. |

## Bounded adaptation cases

Baseline acceptance plan under ADR-017/021 and REQ-018; not executed runtime tests. Form B requires approved branches and AI-assisted recommendation, not the deferred coaching loop. Use reviewed synthetic branch fixtures and deterministic AI recommendations/abstentions after branch rules/content are agreed.

| Case | Expected evidence |
| --- | --- |
| Objective coverage and bounds | Every permitted complete path offers the agreed learning opportunities within the reviewed count: five initially, ten at final baseline acceptance with three key decision points. Reject cycles, extra positions, dead ends without an explicit pause and variants outside approved scope/context. |
| Response-dependent progression | Contrasting reviewed responses select the expected eligible alternatives. Preserve response evidence and rationale; do not infer performed actions from a score or rewrite recorded answers. |
| Continuity at reconvergence | Paths return to common stages while retaining their recorded consequences. Unresolved containment cannot silently become successful recovery to make paths converge. |
| Human authority and revision checks | An AI suggestion cannot release content. Reject non-member/ineligible variants and stale approval; changes require the applicable renewed review. |
| Ambiguity, unexpected answers and outage | Preserve uncertainty and existing responses; human selection is limited to eligible reviewed alternatives. If none fits, pause instead of inventing a path, fabricating a response or forcing success. |
| Retries and restart | Retain chosen variants, evidence, responses and remaining positions. Repeated/concurrent requests cannot select or release two variants for one position or duplicate an agreed response. No coaching answer budget is implied. |
| Visibility and AAR | Hide unreleased alternatives and criteria server-side. Report the actual path and attributed consequences; retain unresolved findings and distinguish hypothetical decisions from observed execution. |

## ENISA-adapted flow verification plan

Historical expanded acceptance under ADR-016 and REQ-016/017; not an implemented checklist. ADR-021 defers extra readiness machinery and its detailed specification. Use only the Form B-mapped portions for baseline acceptance; ordinary source review, scope, approval, package consistency and report evidence remain required without this engine.

- Exercise purpose, track and initial scope are recorded before detailed targeted questions; changing objectives triggers review of affected readiness and package decisions.
- Documents and guided answers retain source attribution. No-document, partial/conflicting-document and complete-document synthetic cases all have a defined route; absent uploads do not become fabricated facts or proof of absent plans.
- Profile confirmation cannot substitute for context, package or run readiness. Decisions refer to the reviewed profile, exercise plan and applicable criteria versions; stale decisions cannot silently unlock downstream stages.
- The unresolved-gap route stops or revises the plan explicitly. Exhausted questioning never causes an automatic ready result.
- Business impact and reviewer confirmation support critical-asset selection; inventory presence alone does not establish crown jewels.
- Package review verifies objective-to-inject-to-criterion-to-evidence links, recipient/responder assignments and coherent five-position paths through the reviewed alternatives. Participant briefing gives the necessary context without disclosing private grading material or future injects.
- Debrief feedback and exercise-design limitations are distinguished from participant-response findings. AAR actions identify an owner, due date and status; proposed actions are not reported as completed.

These cases guide future work; they do not replace the deterministic first-slice tests or permit invented rubric thresholds.

## Organisation content review

For ADR-019/020's authored package, check stable IDs and unique definitions, valid service/asset/data/person references, staff totals excluding external suppliers, and agreement between the author register and player profile. Preserve legacy fixture evidence separately from newly authored fictional answers. A fictional near miss or policy is not observed runtime evidence.

Shared material must use natural names rather than record IDs and omit authoring gates, provenance, future branches, evaluator criteria, specialist weakness catalogues and lesson-teaching conclusions. Put appropriate specialist baseline knowledge in individual role cards, not an all-player bundle. Retain fiction/simulation cover lines. Check the author allocation map against actual card content; facts essential to an objective must be available through an assigned role or ordinary request, not an exact-question trigger or absent participant. Role combination/supplier representation remains explicit future exercise preparation. Separating Markdown files is not proof of server-side visibility enforcement or release approval.

Verify time-sensitive legal/regulatory claims from primary sources, keep fictional contract clocks separate, and record name-check method, source and limits. Distinguish user-reported registry results from independently observed searches. Check fictional reference dates/deadlines, control exceptions, data locations/permissions and company authority across both layers. These are documentation checks, not certification, legal advice or proof of technical capability.

Distinguish current authority from stale contact records, intended channels from channels actually created, and designated personnel from tested cover. Preserve deliberate gaps without scripting absence or failure. Server backup jobs must not imply cloud/SaaS protection; unvalidated provider-native recovery is unknown, not confirmed absent. Check summary/card length and shared-profile leak exclusions; do not claim a Markdown text budget proves print pagination.

## Later evaluation
For the [technical-exercise checkpoints](WORK.md#technical-exercise-checkpoints), the user owns frontend, backend and integration verification. Validate frontend mock examples against the shared contracts and verify each completed screen against the real backend. Include a non-recipient participant fixture. Restart tests must retrieve records submitted during the test; seed data is insufficient evidence of durability. Seed routines must preserve existing demonstration data. These checks establish technical-workstream evidence only, not completion or validation of the other worker's operational exercise.

For the proposed Codex experiment, verify isolation against shell/tool execution and access to application storage before accepting participant text. Test failed, interrupted, malformed and late provider results, account/usage-limit failures, duplicate requests and process restart. Only final validated output can become a draft; no provider event can approve or release it. Keep provider credentials, raw event streams and facilitator context out of participant responses. A valid JSON object alone does not establish content quality or safe agent isolation.

Before intake, use known-answer fixtures for missing/conflicting facts, bounds and source locators. Before AI, establish a human-reviewed representative and ambiguous/adversarial evaluation set, acceptable alternatives, abstention criteria and thresholds. Separate held-out cases from prompt tuning.

Record prompt version, provider/model identity, settings, input/reference versions, human labels and errors. Test unknown assets, unsupported claims, off-scenario branches and ambiguous responses. Deterministic fake providers test timeout, malformed output and manual continuation. Live evaluations are explicitly enabled only with an approved endpoint, data permission and usage limits.

Before reporting, verify observed-action claims against activity evidence and reject unsupported findings. Before deployment, verify backup/restore, access boundaries and uncertain delivery recovery. Do not describe hypothetical or failed provider results as successful.

## Evidence
WORK records task/requirement IDs, exact executed commands, date, environment, results and limitations. Later sanitised evaluation artefacts identify their test-set version. Keep sensitive runtime data out of the repository. Distinguish candidate design decisions, AI-assisted work and reviewer corrections in capstone evidence.
