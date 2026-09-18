# Work and handover

## TASK-000 — Architectural baseline
Status: Complete for the documentation/configuration baseline. Date: 15 September 2026.

Outcome: a fresh coding session can locate scope, design, decisions, quality criteria and next work without reconstructing chats.

Added README content, repository instructions, PROJECT, DECISIONS, QUALITY, this handover, editor settings, ignore rules and a safe environment template. Integrated the existing architecture through a labelled baseline section; its original body and reference materials are preserved. No application, package installation, live service or custom skill was added.

Verification on 15 September 2026:
- `node --version` returned 24.20.0; `npm --version` returned 11.19.0.
- `git diff --check` passed for tracked changes. The original README was UTF-16 and was converted to UTF-8; Git consequently displays its current change as binary against that original revision.
- A PowerShell validation pass read all ten baseline files with strict UTF-8 decoding, checked final newlines and resolved every local Markdown link; passed.
- `git check-ignore` confirmed `.env`, `.env.local`, runtime SQLite, uploads and node_modules examples are ignored; `.env.example` remains eligible for tracking.
- Configuration inspection confirmed AI is disabled and credentials and data path are unset.
- Reviewed generated documents and scoped patch. Application tests/build/browser checks were not run because no application exists.

No commit created; review/stage intended files explicitly because user reference material is already untracked. README, AGENTS, the five documentation files and three configuration files form the intended baseline; existing research/reference material is outside this change.

## TASK-001 — Minimal scaffold and synthetic workflow
Status: Not started; environment decisions required before dependent implementation.
Requirements: REQ-001–006, REQ-011/012.

### Outcome
Confirm a synthetic profile, review one prepared inject, approve/release it to a participant, record an agreed response and retrieve durable activity after restart.

### Resolve before implementation
- Approved build runtime/package access and exact dependencies (ADR-006).
- Non-synchronised data directory and local identity/access approach (ADR-005/007).
- Minimal synthetic fixture and shared executable contracts.

### Scope and acceptance
One application and package manager with committed lockfile; only the UI, rules, contracts and storage needed for this path. Establish real checks at the beginning.
- Profile, definition and run refer to immutable reviewed revisions.
- Facilitator approval identifies exact inject revision and recipients.
- Unauthorised, unapproved, stale, paused and completed-state release commands fail.
- Participant responses contain only permitted released information.
- Release/inbox/activity persist consistently; retries cannot duplicate delivery.
- Participant decisions persist with author/team and released-inject references.
- Restart preserves records and pauses interrupted runs until manual resume.
- Clean setup, checks and build execute; the actual browser workflow and QUALITY cases have recorded results.

Not included: AI, parsing, polished dashboard, full MSEL package, external delivery, production deployment or AAR generation.

Verification: not run; there is no scaffold. If necessary split scaffold from the workflow, but do not mark the workflow complete after scaffolding alone.

### Technical-exercise checkpoints

Ownership follows [PROJECT](PROJECT.md#ownership-and-exercise-scope) and ADR-012; the internal UI/API boundary is in [architecture](architecture.md#exercise-based-implementation-ownership). The user owns both backend and frontend for every checkpoint below. The other worker owns the operational exercise, not these frontend tasks. All implementation checkpoints below are not started.

| Checkpoint | Backend / user | Frontend / user | Exit evidence |
| --- | --- | --- | --- |
| TASK-001A: scaffold and shared contracts | Resolve ADR-006/007 and storage path; implement server entry, test DB integration, shared profile contracts and synthetic fixtures | Minimal UI entry and API client; review shared contract and mock examples | Clean install, real checks, frontend reaches backend; initial schemas and errors agreed |
| TASK-001B: profile confirmation | Known facilitator identity, profile read/confirm operations, revision validation and persistence | Profile review/confirm screen with loading, saved and error states | Browser confirmation survives reload and process restart; participant confirmation rejected |
| TASK-001C: approval and release | Reviewed definition/run binding, revision-specific approval, transactional release and recipient filtering | Facilitator review/release screen and participant inbox | Unapproved/stale/unauthorised requests rejected; recipient and non-recipient fixtures tested; retry creates one release |
| TASK-001D: response and activity | Authorised response storage and facilitator activity query | Agreed response form and activity display | Newly submitted response persists with author/team and accessible release reference |
| TASK-001E: lifecycle and recovery | Pause/resume/completion rules and interrupted-run recovery | State indicators and permitted actions | Restart retains test-entered response; no duplicate releases; interrupted active run requires resume |

Next coding scope: TASK-001A/B. Each checkpoint includes relevant failure tests; the full TASK-001 milestone remains incomplete until all original acceptance criteria pass. Before TASK-001E, settle whether pause also blocks participant submissions; release blocking is already required. Startup seeding must never overwrite demonstration records. Test databases are separate from demonstration data.

## TASK-002 — One-inject AI feasibility

Status: Proposed; follows the first working deterministic exercise loop. Full document parsing is not a prerequisite. Requirements: REQ-007/011/012; this does not complete package generation.

Use ADR-011 and the [adapter experiment design](architecture.md#proposed-codex-adapter-experiment). The user owns the backend provider lifecycle, job API, schema/reference validation and failure handling, plus the frontend generating/error/review experience, initially using deterministic job fixtures. The synthetic objective and generated content still require human review; implementation ownership does not replace exercise approval.

Acceptance: establish the installed protocol/model/authentication and enforceable isolation; generate one bounded synthetic inject; record latency, validity, unsupported content and reviewer corrections; display the result as a draft; exercise timeout, invalid output, usage limit, process exit and manual continuation. Normal tests use a fake provider. Live evaluation requires an explicitly bounded synthetic case and usage limit. Do not silently switch to paid API calls or widen execution permissions when integration fails.

Next AI checkpoint, if feasible: one participant response produces a criterion-linked assessment and targeted feedback, subject to human oversight. This tests coaching, not decision-dependent scenario branching. Keep the full intake, package and reporting scope in PROJECT.

## TASK-003 - Five-inject coached first draft

Status: Planned, not started. Requirements: REQ-010/011/013-015 plus the inherited approval, visibility and durability requirements. The user owns the technical frontend, backend and integration; operational implementation remains the other worker's workstream.

Depends on the deterministic TASK-001 workflow, a viable reviewed TASK-002 integration, an agreed synthetic intake subset and the user-supplied technical RACI, assessment rubric/thresholds, risk/threat references and detailed AAR template. Do not generate the technical package before reviewing those content dependencies.

Outcome and acceptance follow [PROJECT's first exercise draft](PROJECT.md#first-exercise-draft) and [QUALITY's coached cases](QUALITY.md#coached-first-draft-cases): five prepared technical injects, upfront SOC/MSSP role mapping, at most two answers per inject, evidence-linked coaching and final outcomes, including unresolved findings, followed by a reviewed AAR. Persist attempts and guidance across failure/restart; AI assessment does not grant release authority. Ordinary tests use deterministic provider fixtures.

Not included: mixed technical/operational runs, decision-dependent scenario branching, real organisation uploads or the longer-term 10-15-entry package. Verification: not run; no application exists. This milestone does not replace or mark TASK-001/002 complete.

## Planning handover — 15 September 2026

Historical record: the personnel split below was superseded by ADR-012 and the 16 September ownership update. The API design remains an internal technical-application boundary.

Documented the requested backend/frontend split, proposed browser API handoff and subscription-backed local experiment. Updated PROJECT, DECISIONS, architecture, QUALITY and this file. No application code, dependency installation, account operation, model call, Git commit or teammate message was performed. Implementation choices remain proposed where indicated.

Verification on 15 September 2026: PowerShell strict UTF-8 decoding, final-newline, trailing-whitespace and paired-code-fence checks passed for the five changed documents; both new WORK handover targets were checked against the architecture headings. `git diff --check` passed for tracked changes (Git warned about README line-ending conversion); untracked documentation was checked directly. Reviewed the scoped patch and confirmed all runtime behaviour remains labelled as planned. No application exists, so runtime tests are not applicable to this change.

## Git publication handover — 15 September 2026

User authorised publishing current plans to the existing GitHub remote. Scope: README, AGENTS, the five documents, editor/ignore/environment templates and the existing HTML architecture illustration. Original briefs, slides, PDFs and reference packs remain local. Both `github_token.txt` and `github_tokens.txt` are ignored; the credential file stays outside the repository and is used only for transient authentication.

Authenticated fetch confirmed local `main` and `origin/main` were identical before publication. The explicit 11-file staged allowlist, exact-token exclusion, common credential-pattern scan, ignore checks for both token filenames and `git diff --cached --check` passed. The final task response records the resulting commit and remote verification. No application behaviour has been implemented or tested by this publication task.

## Ownership update - 16 September 2026

Applied the user's revised assignment: technical exercise frontend and backend belong to the user; operational exercise belongs to the other worker. Updated README, PROJECT, architecture, DECISIONS, QUALITY and the active checkpoints above. ADR-012 explicitly supersedes ADR-010; the earlier planning handover remains labelled as history.

The technical MVP, requirements, safety boundaries and task acceptance criteria are unchanged. Operational requirements and any cross-workstream sharing/integration remain to be agreed; no operational implementation tasks or combined platform were added. TASK-001 and TASK-002 have not started. No application code, dependencies, account operation, external message, commit or publication was performed.

Verification on 16 September 2026: inline PowerShell checks passed for strict UTF-8, final newlines, trailing whitespace and paired code fences across all six changed documents; 23 local links/heading targets resolved and REQ-001-012 matched the previous revision unchanged. Three pre-existing links to local source material (Form B, supervisor slides and research guide) remain unavailable in this checkout; no new broken links were introduced. `git diff --check` passed with LF-to-CRLF warnings only. Reviewed `git diff` and searched ownership references with `rg`; the old allocation remains only in explicitly historical records. Runtime tests are not applicable because this remains a documentation-only repository.

## Git publication update - 16 September 2026

The user authorised publishing the ownership update to the existing GitHub remote using local `token.txt`, and requested its exclusion from Git. Added `token.txt` to `.gitignore`; `git check-ignore -v -- token.txt` confirms the rule, and `git log --all --format=%h -- token.txt` found no recorded history for that path. The credential file remains local and is not part of the publication scope.

Publication scope is the six ownership-update documents plus `.gitignore`. The seven-file staged allowlist, untracked-token check, common credential-pattern scan, strict UTF-8/newline/whitespace checks and `git diff --cached --check` passed. The authenticated fetch command was blocked by the execution policy before execution; no successful fetch, push or current remote verification is claimed. Do not bypass that restriction. The final task response records the local commit; GitHub publication remains pending. No runtime tests apply to this documentation/configuration change.

## Workflow exploration - 18 September 2026

Historical exploration, now refined by ADR-013 and the clarification handover below. Reviewed the user's five-inject, single-track, coached-retry idea and subscription/context questions. Added an initial [design proposal, now clarified](architecture.md#five-inject-coached-workflow---18-september-2026) plus an editable Excalidraw diagram and matching SVG/PNG exports. At that stage PROJECT, accepted decisions and task acceptance criteria were unchanged, pending reconciliation of the first draft with the fuller target and coaching/release authority. Technical RACI, assessment rubric and AAR template remain pending; no injects were generated.

Checked current official OpenAI authentication, app-server, usage and memory documentation and CSA's Cyber Trust (2025) publication. Recommendations preserve per-release human approval, source-linked profile confirmation, application-owned state, recorded first/coached attempts and manual continuation. The user reports completing the earlier Git push; local `git status --short --branch` showed `main...origin/main` with no changes at the start of this task. No network Git verification or new publication was performed.

Initial diagram verification: the task-local Node/Playwright renderer imported all 80 editable elements through Excalidraw 0.18.0's `restore` and `exportToSvg`; all 36 text elements fit their declared widths, element IDs/bindings were checked, and PNG pixel variance confirmed a nonblank render. Two overflowing labels and one connector-label overlap were corrected; final PNG visual review passed. The bundled Playwright browser was unavailable, so verification used installed Chrome without installing an application dependency. `git diff --check` passed with line-ending warnings only. PowerShell checked strict UTF-8, final newlines, trailing whitespace, local Markdown links/heading targets and SVG XML; the three pre-existing missing source-material links remain unchanged. Reviewed the scoped diff. No application runtime tests exist yet.

## Clarification and publication handover - 18 September 2026

At the user's request, aligned PROJECT, architecture, DECISIONS (ADR-013), QUALITY, README, repository data instructions and the editable diagram with the confirmed first-draft rules. Added TASK-003 without changing the one-inject engineering slice or claiming the fuller target is implemented. The two-answer limit ends in a recorded finding when unmet; progression still requires normal approval. Upfront SOC/MSSP mapping and synthetic-only prototype content are explicit. The AAR preserves unaided, coached and unresolved outcomes. Scenario branching remains later work; content templates remain pending.

The user authorised committing and pushing these planning changes to `origin`. Normal `git -c credential.interactive=never fetch origin` succeeded using existing Git authentication, without reading `token.txt`, running a token wrapper or bypassing execution policy. Earlier failed-publication notes above are historical. No application code, dependencies, live AI calls or deployment were added. Publication verification is recorded in the final task response.

Verification on 18 September 2026: the task-local `ttx-diagram-qa.cjs` Node/Playwright renderer used installed Chrome and Excalidraw 0.18.0 to import/export all 78 editable elements, validate IDs/bindings and check all 35 text widths; zero overflow and nonblank PNG pixel checks passed. Regenerated SVG/PNG exports and visually reviewed the final diagram. Inline PowerShell checks passed for strict UTF-8, final newlines, trailing whitespace and paired code fences across seven Markdown files; 37 local links/anchors resolved, SVG XML parsed, and the three pre-existing missing source-material links were unchanged. `git diff --check`, `git diff --cached --check`, the exact ten-file staged allowlist and token-path ignore/untracked checks passed. An initial broad credential pattern falsely matched the `task-003` heading links; the boundary-aware common credential scan passed. Reviewed the documentation diff and diagram text; `git rev-list --left-right --count HEAD...origin/main` returned `0 0` before the new commit. No application runtime tests exist yet.

## Later sequence
1. Complete TASK-001's deterministic one-inject workflow after resolving its environment decisions.
2. Proposed TASK-002: bounded AI drafting and assessment/feedback feasibility using a confirmed synthetic profile.
3. TASK-003: agreed synthetic intake and SOC/MSSP mapping, reviewed five-inject package, two-answer coaching and evidence-grounded AAR; apply QUALITY's failure and recovery cases.
4. Later fuller target: broader intake and 10-15-entry packages, bounded decision branches and approved follow-ups, only after agreeing their details.
5. Backup/restore, evaluation evidence and school-safe handover for the implemented scope.

Known limitations: no executable contracts, application, identity system, persistence or evaluations. Historical architecture research was not independently revalidated in this baseline task. Existing reference documents remain untracked and are not automatically included in a future commit.
