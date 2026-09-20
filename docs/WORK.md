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
Status: TASK-001A/B complete for the bounded local profile checkpoint on 18 September 2026. Docker-first setup resolves the initial runtime, identity and data-location decisions under ADR-006/007/014. The full one-inject workflow remains incomplete.
Requirements: REQ-001–006, REQ-011/012.

### Outcome
Confirm a synthetic profile, review one prepared inject, approve/release it to a participant, record an agreed response and retrieve durable activity after restart.

### Initial prerequisites
- Resolved for the local Docker scaffold: pinned runtime/packages (ADR-006/014), private data volume and generated demo identities (ADR-005/007/014).
- Hand-authored synthetic profile and executable shared profile contracts are implemented. The prepared-inject contracts and fixture remain TASK-001C work.
- These local choices do not grant organisation hosting, provider access or real-data permission.

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

Verification: see the current implementation handover below. Do not mark the whole workflow complete after profile confirmation alone; approval/release, responses and lifecycle remain unimplemented.

### Technical-exercise checkpoints

Ownership follows [PROJECT](PROJECT.md#ownership-and-exercise-scope) and ADR-012; the internal UI/API boundary is in [architecture](architecture.md#exercise-based-implementation-ownership). The user owns both backend and frontend for every checkpoint below. The other worker owns the operational exercise, not these frontend tasks. TASK-001A/B are complete for the local profile scope; C/D/E are not started.

| Checkpoint | Backend / user | Frontend / user | Exit evidence |
| --- | --- | --- | --- |
| TASK-001A: scaffold and shared contracts | Resolve ADR-006/007 and storage path; implement server entry, test DB integration, shared profile contracts and synthetic fixtures | Minimal UI entry and API client; review shared contract and mock examples | Clean install, real checks, frontend reaches backend; initial schemas and errors agreed |
| TASK-001B: profile confirmation | Known facilitator identity, profile read/confirm operations, revision validation and persistence | Profile review/confirm screen with loading, saved and error states | Browser confirmation survives reload and process restart; participant confirmation rejected |
| TASK-001C: approval and release | Reviewed definition/run binding, revision-specific approval, transactional release and recipient filtering | Facilitator review/release screen and participant inbox | Unapproved/stale/unauthorised requests rejected; recipient and non-recipient fixtures tested; retry creates one release |
| TASK-001D: response and activity | Authorised response storage and facilitator activity query | Agreed response form and activity display | Newly submitted response persists with author/team and accessible release reference |
| TASK-001E: lifecycle and recovery | Pause/resume/completion rules and interrupted-run recovery | State indicators and permitted actions | Restart retains test-entered response; no duplicate releases; interrupted active run requires resume |

Next coding scope: TASK-001C, reviewed definition/approval/release contracts and one deterministic prepared-inject fixture, not a generated technical exercise package. Each checkpoint includes relevant failure tests; the full TASK-001 milestone remains incomplete until all original acceptance criteria pass. Before TASK-001E, settle whether pause also blocks participant submissions; release blocking is already required. Startup seeding must never overwrite demonstration records. Test databases are separate from demonstration data.

## TASK-002 — One-inject AI feasibility

Status: Proposed; follows the first working deterministic exercise loop. Full document parsing is not a prerequisite. Requirements: REQ-007/011/012; this does not complete package generation.

Use ADR-011 and the [adapter experiment design](architecture.md#proposed-codex-adapter-experiment). The user owns the backend provider lifecycle, job API, schema/reference validation and failure handling, plus the frontend generating/error/review experience, initially using deterministic job fixtures. The synthetic objective and generated content still require human review; implementation ownership does not replace exercise approval.

Acceptance: establish the installed protocol/model/authentication and enforceable isolation; generate one bounded synthetic inject; record latency, validity, unsupported content and reviewer corrections; display the result as a draft; exercise timeout, invalid output, usage limit, process exit and manual continuation. Normal tests use a fake provider. Live evaluation requires an explicitly bounded synthetic case and usage limit. Do not silently switch to paid API calls or widen execution permissions when integration fails.

Next AI checkpoint, if feasible: one participant response produces a criterion-linked assessment and targeted feedback, subject to human oversight. This tests coaching, not decision-dependent scenario branching. Keep the full intake, package and reporting scope in PROJECT.

## TASK-003 - Five-inject coached first draft

Status: Planned, not started. Requirements: REQ-010/011/013-015 plus the inherited approval, visibility and durability requirements. The user owns the technical frontend, backend and integration; operational implementation remains the other worker's workstream.

Depends on the deterministic TASK-001 workflow, a viable reviewed TASK-002 integration, an agreed synthetic intake subset and the user-supplied technical RACI, assessment rubric/thresholds, risk/threat references and detailed AAR template. Do not generate the technical package before reviewing those content dependencies.

Outcome and acceptance follow [PROJECT's first exercise draft](PROJECT.md#first-exercise-draft) and [QUALITY's coached cases](QUALITY.md#coached-first-draft-cases): five prepared technical injects, upfront SOC/MSSP role mapping, at most two answers per inject, evidence-linked coaching and final outcomes, including unresolved findings, followed by a reviewed AAR. Persist attempts and guidance across failure/restart; AI assessment does not grant release authority. Ordinary tests use deterministic provider fixtures.

Not included: mixed technical/operational runs, decision-dependent scenario branching, real organisation uploads or the longer-term 10-15-entry package. Verification: not run for TASK-003; profile scaffolding is not a five-inject exercise. This milestone does not replace or mark TASK-001/002 complete.

## Planning handover — 15 September 2026

Historical record: the personnel split below was superseded by ADR-012 and the 16 September ownership update. The API design remains an internal technical-application boundary.

Documented the requested backend/frontend split, proposed browser API handoff and subscription-backed local experiment. Updated PROJECT, DECISIONS, architecture, QUALITY and this file. No application code, dependency installation, account operation, model call, Git commit or teammate message was performed. Implementation choices remain proposed where indicated.

Verification on 15 September 2026: PowerShell strict UTF-8 decoding, final-newline, trailing-whitespace and paired-code-fence checks passed for the five changed documents; both new WORK handover targets were checked against the architecture headings. `git diff --check` passed for tracked changes (Git warned about README line-ending conversion); untracked documentation was checked directly. Reviewed the scoped patch and confirmed all runtime behaviour remains labelled as planned. No application exists, so runtime tests are not applicable to this change.

## Git publication handover — 15 September 2026

User authorised publishing current plans to the existing GitHub remote. Scope: README, AGENTS, the five documents, editor/ignore/environment templates and the existing HTML architecture illustration. Original briefs, slides, PDFs and reference packs remain local. Both `github_token.txt` and `github_tokens.txt` are ignored; the credential file stays outside the repository and is used only for transient authentication.

Authenticated fetch confirmed local `main` and `origin/main` were identical before publication. The explicit 11-file staged allowlist, exact-token exclusion, common credential-pattern scan, ignore checks for both token filenames and `git diff --cached --check` passed. The final task response records the resulting commit and remote verification. No application behaviour has been implemented or tested by this publication task.

## Ownership update - 16 September 2026

Historical record: ADR-015 and the 19 September naming update clarify the overarching product as the TTX Platform. The exercise-based ownership below remains current; the earlier combined-platform caveat is not the current product framing.

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

Known limitations: TASK-001C/D/E, AI integration, parsing, five-inject assessment and AAR output remain unimplemented. Historical architecture research was not independently revalidated in the baseline task. Existing reference documents remain untracked and are not automatically included in a future commit.

## Docker scaffold implementation - 18 September 2026

Scope: TASK-001A/B only, following the user's request to begin work and use Docker to avoid per-laptop runtime setup. Added a pinned multi-stage build, localhost-only Compose service, private named data volume, strict shared profile schemas, a hand-authored synthetic fixture, server-validated demo sessions, revision/hash-specific profile confirmation and activity, and a responsive review UI. No RACI content, inject package, provider integration or scoring template was invented. The fixture's SOC/MSSP description is context, not an approved RACI mapping.

The source build context is an allowlist excluding credentials and user source material. The runtime is non-root and read-only except its data volume. Access codes are generated in that volume and not logged; a local operator can explicitly retrieve them. Session restart requires sign-in again, while saved profile records are retained. Git migration does not transfer Docker volumes; backup/restore automation remains out of scope.

Verification on 18 September 2026:
- Local tools: Node 24.19.0 / npm 11.4.2; Docker client/server 29.7.2 and Compose 5.4.0. The initially stopped Docker Desktop Linux engine was started with `docker desktop start --timeout 120`. The pinned Linux image uses Node 24.19.0 / npm 11.17.0; its manifest digest is in Dockerfile. A host Node installation is not required by the documented Docker startup.
- `npm.cmd install --package-lock-only --ignore-scripts --no-audit --no-fund` generated the lockfile without a host dependency install. Clean container `npm ci --no-audit --no-fund` succeeded; ordinary builds use that lock. npm warned about the unapproved esbuild postinstall script; build/test execution still succeeded using the packaged binary, without globally permitting scripts.
- `docker compose config --quiet` passed. `docker compose up --build -d --wait` passed the complete `npm run check`: Prettier, ESLint, TypeScript, 17 deterministic tests, server compilation and Vite UI build. The service is healthy and available at localhost:3000. Initial formatting/type errors were corrected and the checks rerun; no checks were disabled.
- `docker build --target browser-tests -t ai-ttx-browser-tests:local .` and the resulting test container passed all three Playwright tests. They covered source evidence, filtering, exact-revision confirmation, reload/activity, participant API restrictions, logout and invalid sign-in. Desktop (1440x1080) and mobile (390x844) screenshots passed overflow/row-overlap checks and visual review. Screenshots remain in ignored test-results; temporary browser data/container were removed after inspection.
- Browser responses use interpreted TypeBox validation with the existing date-time format validator; this avoids AJV runtime compilation in the browser without adding unsafe-eval to CSP. Strict format/extra-field rejection is covered by a deterministic test. The server still uses AJV with coercion/defaulting/field stripping disabled.
- A separately labelled test container/volume submitted a real HTTP confirmation, was restarted with `docker restart`, then retrieved the identical saved confirmation and exactly one activity entry. The prior session was rejected and unresolved facts retained. Only that temporary test container and volume were removed; the user demonstration volume was not reset.
- Runtime inspection confirmed user=node, read-only root, all capabilities dropped, no-new-privileges, one /data named-volume mount and 127.0.0.1:3000 publication. The generated access file has mode 0600. The runtime excludes token.txt, .git, reference docs, test files, TypeScript and Playwright. `npm audit --omit=dev --audit-level=high` reported zero known vulnerabilities in production dependencies at this check; this is not a full security audit.
- Final source/doc review: `git diff --check` passed (line-ending warnings only). PowerShell verified UTF-8, final newlines and trailing whitespace for all 39 changed/new text files, paired Markdown fences and 38 local links/anchors. The three pre-existing unavailable source links and unchanged historical HTML without a final newline were left untouched. Repository-wide common credential-pattern checks passed; token.txt and test-results remain ignored. Sharp pixel-variance checks confirmed both inspected screenshots are nonblank.

Handover: use README's Docker startup and explicit local access-code command. The demonstration profile is still awaiting the user's review; automated confirmations were confined to test data. No commit, push, remote deployment or paid AI operation was performed. Remaining limitations: no upload/edit workflow, production identity/TLS, backup/restore automation, inject release, responses, run lifecycle, AI or AAR output. Container checks were performed on this Windows Docker Desktop Linux/amd64 engine, not on a second laptop or ARM host. The three existing unavailable local source-material links remain outside this implementation's scope.

## Product naming and screen-design request - 19 September 2026

Applied the user's correction under ADR-015: the overarching product is the AI-assisted TTX Platform, with separate technical and operational exercise workstreams. Updated the application header, sign-in, browser title, server startup message, README, repository instructions and HTML architecture illustration. PROJECT and architecture now distinguish product identity from the current technical implementation scope. Retained technical-specific ownership, content and RACI references; the profile context explicitly says "Track: Technical". No track selector, operational implementation, schema migration or new exercise functionality was added. The existing Excalidraw workflow already uses track-neutral product naming and required no change.

Verification: Docker was initially stopped; the first browser-image build could not reach its engine. Started Docker Desktop with `docker desktop start --timeout 120`, then `docker build --target browser-tests -t ai-ttx-browser-tests:local .` passed formatting, lint, type checks, all 17 deterministic tests and both builds. The isolated browser-test container passed all three Playwright tests, including new assertions for neutral sign-in/header/title branding and the explicit technical-track label. Desktop and mobile screenshots passed existing overflow/overlap checks and visual review. Removed only the labelled, stopped test container; retained the demonstration data volume. `docker compose up --build -d --wait` rebuilt the app successfully; `docker compose ps` confirms healthy loopback-only service on localhost:3000. `git diff --check` passed with line-ending warnings only.

Figma: the user installed the requested integration and authenticated access was verified. The account has two available teams; asked which should own the screen mockups before creating a file. No Figma file or mockup has been created at this checkpoint. Proposed mockups should clearly distinguish current screens from planned workflows and must not invent the pending RACI, rubric, AAR template or operational requirements. No commit or GitHub push was performed for this naming change; the earlier uncommitted Docker implementation is preserved.

## Screen storyboard handover - 20 September 2026

The user accepted the available AI TTX Project Figma team. Created [TTX Platform - Screen Concepts](https://www.figma.com/design/TD0sGwdV3tSR2FsnJveDNW) there. The integration reached its Starter-plan tool-call limit before any screen nodes could be placed; the file has no screen mockups. No plan upgrade, account workaround or paid operation was performed.

Created a local [editable nine-screen storyboard](diagrams/ttx-screen-concepts.excalidraw) with matching SVG/PNG previews, a reproducible Node scene generator and a screen index. See [architecture's design notes](architecture.md#screen-storyboard---20-september-2026) for the screen inventory and design limits. Existing sign-in/profile capabilities are separated from planned intake, setup, package review, run control, participant response/retry and AAR screens. All context is synthetic; no RACI, rubric, inject content or AAR template was invented. The neutral product name and existing workstream ownership remain unchanged.

Verification: the task-local Node/Playwright renderer used installed Chrome and Excalidraw 0.18.0 to restore/export all 365 editable elements, validate IDs/bindings and measure all 253 text elements; zero text-width overflow and nonblank PNG checks passed. A separate nine-panel export checked measured text bounds for overlap and PNG pixel variance; all nine passed and were visually inspected. Generator syntax, strict UTF-8/newlines/trailing whitespace, scoped local links, SVG XML and `git diff --check` were checked. The storyboard is static desktop design work, not a tested interactive or mobile implementation; application runtime tests were not rerun because no application files or dependencies changed in this turn.

No commit, push, application-state change or deployment was performed. The earlier uncommitted Docker implementation and naming changes are preserved. The Figma file remains a creation checkpoint only; the usable deliverable is the local Excalidraw storyboard and its previews.

## Figma upload handover - 20 September 2026

At the user's request, retried using 2301777's Student-plan team after the user reconnected the integration. Account inspection confirmed the intended account and team-admin role. Created [TTX Platform - Screen Storyboard](https://www.figma.com/design/4oCPzxBPHnEpsp4qRz2YV3?node-id=1-2) in that team's drafts and uploaded the existing synthetic storyboard SVG. This is a new, populated file, not the earlier blank Starter-team file. No paid upgrade, permission change or deletion was performed.

The first multipart upload was rejected because PowerShell sent application/octet-stream. A fresh single-use upload URL with an explicit image/svg+xml request succeeded and reported placement at node 1:2. Subsequent Figma metadata confirmed all nine screen headings, 264 text layers and 138 vector layers. The 3400x2914 Figma screenshot was visually inspected and preserves the complete layout. The SVG import is editable text/vector artwork, not a reusable component system, interactive prototype or implemented application behaviour.

Added the working Figma link to README and architecture. Checked scoped Markdown UTF-8, final newlines and trailing whitespace, and ran git diff --check. Application code, dependencies and runtime data are unchanged, so application tests were not rerun. Existing uncommitted work is preserved; no Git commit or GitHub push was performed. Figma and the local scene/exports require deliberate reconciliation after edits; no automatic synchronisation is configured.

## Git publication handover - 21 September 2026

The user authorised committing and pushing the accumulated project changes before further implementation. Publication scope: the Docker-first TASK-001A/B application, shared contracts and synthetic fixture, deterministic/browser tests, safe configuration, neutral product naming, updated planning/handover documents and the nine-screen storyboard with its Figma link. The explicit scope contains 46 files. Credentials, runtime databases, browser captures and original local reference material remain excluded; token.txt is ignored and untracked.

Normal Git authentication fetched origin successfully without reading token.txt. Before the new commit, HEAD and origin/main matched (left/right count 0 0). Reviewed the source, tests and scoped changes. Publication checks passed: Docker Compose configuration, diagram-generator syntax, SVG XML and 365-element scene structure, strict UTF-8/newline/whitespace checks for 45 text files, common credential-pattern scan and git diff --check. The lockfile resolves its packages only from registry.npmjs.org.

Runtime re-verification limitation: Docker Desktop's Linux engine was unavailable. The desktop start/status commands remained unresponsive and were interrupted; a subsequent engine check still failed. No runtime test pass is claimed for 21 September. The last recorded application verification remains 19 September: formatting, lint, types, 17 deterministic tests, both builds and three browser tests passed. No application behaviour changed during this publication task, and no demonstration volume was reset or migrated.

The commit/push result and remote equality check are recorded in the task response. Next implementation remains TASK-001C (one prepared inject's approval, release and recipient-filtered inbox), followed by response/activity and lifecycle/recovery. Subscription-backed Codex authentication and AI adapter feasibility belong to TASK-002 after that deterministic loop; participant sign-in remains separate. This handover does not start the next implementation checkpoint.
