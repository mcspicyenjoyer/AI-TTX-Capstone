# Quality and verification

Status: acceptance plan aligned to Form B under ADR-021 on 29 September 2026, retaining the user's five-MSEL-inject first-delivery exception. WORK records executed results. Deterministic contract/API/persistence tests and Playwright profile checks cover TASK-001A/B only. No extraction, generation, exercise-play or AI evaluations exist yet.

## Definition of done
The bounded behaviour meets acceptance criteria, relevant failures are tested, required checks pass, the diff is reviewed and affected documents reflect reality. Outstanding required failures mean incomplete work. A successful build does not replace a browser workflow check.

## Scaffold checks
The scaffold must establish one executable entry point, provisionally `npm run check`, covering formatting verification, linting, types, deterministic tests and build with failure propagation. Record the chosen runtime, package manifest and lockfile together. Verify a locked clean installation in an isolated copy before documenting it as working. Add CI using the same command when runner/package access are established.

Branding checks under ADR-015 verify "TTX Platform" in the browser title and shared header for sign-in, facilitator and participant views. Sign-in remains track-neutral; the current facilitator profile labels its context "Track: Technical". Naming does not claim that operational screens or track selection are implemented. Check desktop and mobile layout after label changes.

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

## Form B workflow acceptance

Required for [TASK-005-008](WORK.md#task-005---document-intake-and-profile-reconciliation) and the integrated five-inject delivery. These are planned cases, not implemented tests. [Form B alignment](form-b-alignment.md) maps the twelve objectives and outputs. Review input limits, human reference labels and quality thresholds before evaluation; normal software checks use deterministic provider fixtures.

| Area / requirements | Required evidence and failure cases |
| --- | --- |
| Input specification and schema / REQ-008/019 | One agreed diagram format and supported text-based continuity formats have explicit bounds. Typed systems, connections, services, dependencies, roles, third parties, RTO/RPO and priorities preserve source links and uncertainty. Reject unsupported/malformed inputs; never execute supplied content. |
| Extraction and provenance / REQ-008/012 | Known-answer synthetic diagram and BCP/BIA/DRP cases measure entity/relationship accuracy and locator correctness. Test omissions, conflicting names/values, incomplete sources and instruction-like text. A pre-seeded profile is not extraction evidence. |
| Reconciliation and confirmation / REQ-001/002/020 | Reviewer can confirm, correct, reject and add information with provenance; conflicts and assumptions remain visible. No generation from an unconfirmed or stale revision. Changing inputs/profile invalidates affected drafts; missing upload is not confirmed absence of a capability. |
| Optional documents and guided completion / REQ-008/016/017 | Diagram-only, partial/conflicting-continuity and complete-input cases retain defined, attributed completion routes. A run may omit continuity uploads, but ingestion capability must be tested. Guided-only/manual routes do not satisfy diagram-ingestion acceptance. |
| Threat pathway / REQ-021 | A reviewed controlled pattern links plausible entry points and affected systems/dependencies to named services, impact and recovery choices. Distinguish connectivity from exploitable reachability; unsupported edges/claims require rejection or labelled, reviewed exercise assumptions. |
| Grounded package generation / REQ-002/009/022 | Generate from confirmed inputs, not a fixed public/hand-authored package. Verify system/service references, recovery targets/priorities, source support, artefact chronology and scenario coherence. Controlled changes to a relevant input must be reflected consistently in affected generated content; mere company-name substitution fails the tailoring review. |
| Package structure and branches / REQ-009/015/018 | First delivery has five participant-facing MSEL positions, 3-4 functional roles and three key decision points. Release one variant per position; count neither unused variants nor supporting artefacts as extra positions. Every allowed complete path preserves agreed objectives/consequences and reaches closure. Record the original 10-15 count as the user-authorised deviation. |
| Human review and facilitator controls / REQ-003-007 | Package review precedes play. Exercise approve/edit/reject/override/pause/manual continuation; every release rechecks exact revision, recipients and run conditions. Edits invalidate approval. Direct API and participant projections cannot bypass authority or disclose hidden content. |
| Response interpretation and branch recommendation / REQ-007/012/018 | Compare against independent human labels for present/missing/unclear actions, rationale and acceptable alternatives. Test ambiguous/incomplete responses, invalid branch IDs, ineligible/stale choices, unsupported claims and abstention. A missing mention is not proof of a failed real action. |
| Core play without coaching / REQ-004/010/015/018 | The agreed decision can be interpreted, reviewed and used for approved progression without a coached retry or a forced pass. Preserve unresolved findings. Supplementary feedback must not be required to complete this core route. |
| Durable record and AAR / REQ-004/006/010 | AAR findings refer to recorded injects, decisions, observations, branch changes and debrief evidence from a fixed snapshot. Test outage/restart, missing evidence and disputed interpretations; do not invent delivery, execution, recovery or action closure. Human review assigns improvement ownership. |
| Usefulness and complete handover / REQ-012/023 | Record reviewer usefulness, preparation/review effort and correction burden against a documented manual baseline. Report errors and limitations. Supply all mapped technical outputs, test results, guide and school-safe input-to-review demonstration; no unmeasured saving or operational-workstream completion claim. |

The required synthetic reference pack needs the agreed diagram, selected continuity input, guided answers and independently reviewed expected facts. The existing company register/cards provide authoring truth but are not parsed input evidence or a generated exercise. Use changed-input cases within the one representative SME/incident scope, not unbounded new scenarios. Keep human-reviewed quality evaluation distinct from deterministic schema/control tests; neither replaces the other.

## Coached first-draft cases

Supplementary coaching acceptance for [TASK-003](WORK.md#task-003---five-inject-coached-first-draft), not a Form B requirement or executed tests. Apply when coached mode is selected; it cannot replace the required workflow above. Fix expected outcomes with the reviewed rubric before evaluation; normal software checks use deterministic provider fixtures.

| Case | Requirements | Evidence |
| --- | --- | --- |
| Upfront SOC/MSSP mapping | REQ-013 | Setup distinguishes internal/outsourced functions and named responding users/teams. Missing mappings block role-specific preparation; an unrelated participant cannot answer for the assigned role. |
| Five-inject single-track package | REQ-009/015/018 | Five participant-facing positions, 3-4 functional roles and three key decision points, with one reviewed variant per position. Alternatives do not increase the run count; no technical/operational mixture. |
| First answer sufficient | REQ-014 | Resolve after one answer; do not demand or permit another answer to the closed inject. Record first-attempt success on that inject, without implying no influence from earlier coaching. |
| First insufficient, second sufficient | REQ-010/014 | Deliver targeted feedback once, retain both answers and the guidance, and record coached success separately from a sufficient first attempt. |
| Second answer insufficient | REQ-010/014/015 | Record an unresolved finding, reject a third submission and permit the next prepared inject only through normal approval/release checks. |
| Retries, failure and restart | REQ-004/006/014 | Duplicate submission retries do not consume another answer; provider reassessment does not create an answer. A failed evaluation preserves the submitted answer as pending, not failed. Restart retains the attempt count and cannot reopen the budget. |
| Ambiguous or disputed grading | REQ-007/014 | Human review uses the recorded answer and rubric, logs the decision and cannot grant a third answer or silently mark an insufficient answer sufficient. |
| Completion with gaps | REQ-015 | All five injects have final outcomes; unresolved findings are allowed, unanswered injects are not silently treated as complete. |
| Evidence-linked AAR | REQ-010/014 | The reviewed template preserves initial/retry answers, feedback, rubric version and outcomes; reports first-attempt/coached successes and unresolved findings without inventing performed actions or successful recovery. Debrief observations remain attributed; action completion requires evidence. |
| Synthetic-only content | REQ-011 | Development, demonstration and evaluation packs use synthetic organisation/exercise content; source references and fixture provenance are recorded. |

## Bounded adaptation cases

Acceptance plan under ADR-017/021 and REQ-018; not executed runtime tests. Use reviewed synthetic branch fixtures and deterministic AI recommendations/abstentions after the three decision points' rules/content are agreed. Apply coaching budgets only in the supplementary coached mode.

| Case | Expected evidence |
| --- | --- |
| Objective coverage and bounds | Every permitted complete path offers the agreed learning objectives within five positions and the three reviewed decision points. Reject cycles, extra positions, dead ends without an explicit pause and variants outside approved scope/context. |
| Response-dependent progression | Contrasting reviewed responses select the expected eligible alternatives. Preserve response evidence and rationale; do not infer performed actions from a score or rewrite initial answers after coaching. |
| Continuity at reconvergence | Paths return to common stages while retaining their recorded consequences. Unresolved containment cannot silently become successful recovery to make paths converge. |
| Human authority and revision checks | An AI suggestion cannot release content. Reject non-member/ineligible variants and stale approval; changes require the applicable renewed review. |
| Ambiguity, unexpected answers and outage | Preserve uncertainty and existing responses; human selection is limited to eligible reviewed alternatives. If none fits, pause instead of inventing a path, adding an answer or forcing success. |
| Retries and restart | Retain chosen variants, evidence, remaining positions and answer budgets. Repeated/concurrent requests cannot select or release two variants for one position. |
| Visibility and AAR | Hide unreleased alternatives and criteria server-side. Report the actual path and attributed consequences; retain unresolved findings and distinguish coaching and hypothetical actions from observed execution. |

## ENISA-adapted flow verification plan

Structural acceptance under ADR-016 and REQ-016/017; not an implemented checklist or the user's pending readiness specification. Define exact expected readiness outcomes only after that specification is reviewed.

- Exercise purpose, track and initial scope are recorded before detailed targeted questions; changing objectives triggers review of affected readiness and package decisions.
- Documents and guided answers retain source attribution. Diagram-only, partial/conflicting-document and complete-document synthetic cases have defined routes. A supplementary no-document/manual route does not replace the assessed ingestion capability; absent uploads do not become fabricated facts or proof of absent plans.
- Profile confirmation cannot substitute for context, package or run readiness. Decisions refer to the reviewed profile, exercise plan and applicable criteria versions; stale decisions cannot silently unlock downstream stages.
- The unresolved-gap route stops or revises the plan explicitly. Exhausted questioning never causes an automatic ready result.
- Business impact and reviewer confirmation support critical-asset selection; inventory presence alone does not establish crown jewels.
- Package review verifies confirmed-profile/pathway grounding, objective-to-inject-to-criterion-to-evidence links, 3-4 functional roles and coherent five-position paths through three reviewed decision points. Participant briefing gives the necessary context without disclosing private criteria or future injects.
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
