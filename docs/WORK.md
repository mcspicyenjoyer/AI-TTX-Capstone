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

### Two-person checkpoints

Ownership and the proposed API handoff are in [architecture](architecture.md#two-person-implementation-boundary--15-september-2026). The user leads backend; the teammate leads frontend. All implementation checkpoints below are not started.

| Checkpoint | Backend / user | Frontend / teammate | Exit evidence |
| --- | --- | --- | --- |
| TASK-001A: scaffold and shared contracts | Resolve ADR-006/007 and storage path; implement server entry, test DB integration, shared profile contracts and synthetic fixtures | Minimal UI entry and API client; review shared contract and mock examples | Clean install, real checks, frontend reaches backend; initial schemas and errors agreed |
| TASK-001B: profile confirmation | Known facilitator identity, profile read/confirm operations, revision validation and persistence | Profile review/confirm screen with loading, saved and error states | Browser confirmation survives reload and process restart; participant confirmation rejected |
| TASK-001C: approval and release | Reviewed definition/run binding, revision-specific approval, transactional release and recipient filtering | Facilitator review/release screen and participant inbox | Unapproved/stale/unauthorised requests rejected; recipient and non-recipient fixtures tested; retry creates one release |
| TASK-001D: response and activity | Authorised response storage and facilitator activity query | Agreed response form and activity display | Newly submitted response persists with author/team and accessible release reference |
| TASK-001E: lifecycle and recovery | Pause/resume/completion rules and interrupted-run recovery | State indicators and permitted actions | Restart retains test-entered response; no duplicate releases; interrupted active run requires resume |

Next coding scope: TASK-001A/B. Each checkpoint includes relevant failure tests; the full TASK-001 milestone remains incomplete until all original acceptance criteria pass. Before TASK-001E, settle whether pause also blocks participant submissions; release blocking is already required. Startup seeding must never overwrite demonstration records. Test databases are separate from demonstration data.

## TASK-002 — One-inject AI feasibility

Status: Proposed; follows the first working deterministic exercise loop. Full document parsing is not a prerequisite. Requirements: REQ-007/011/012; this does not complete package generation.

Use ADR-011 and the [adapter experiment design](architecture.md#proposed-codex-adapter-experiment). Backend owns the provider lifecycle, job API, schema/reference validation and failure handling. Frontend owns the generating/error/review experience and initially uses deterministic job fixtures. Both review the synthetic objective and generated content.

Acceptance: establish the installed protocol/model/authentication and enforceable isolation; generate one bounded synthetic inject; record latency, validity, unsupported content and reviewer corrections; display the result as a draft; exercise timeout, invalid output, usage limit, process exit and manual continuation. Normal tests use a fake provider. Live evaluation requires an explicitly bounded synthetic case and usage limit. Do not silently switch to paid API calls or widen execution permissions when integration fails.

Next AI checkpoint, if feasible: one participant response produces a suggested interpretation or eligible prepared follow-up, followed by facilitator decision. Keep the full intake, package and reporting scope in PROJECT.

## Planning handover — 15 September 2026

Documented the requested backend/frontend split, proposed browser API handoff and subscription-backed local experiment. Updated PROJECT, DECISIONS, architecture, QUALITY and this file. No application code, dependency installation, account operation, model call, Git commit or teammate message was performed. Implementation choices remain proposed where indicated.

Verification on 15 September 2026: PowerShell strict UTF-8 decoding, final-newline, trailing-whitespace and paired-code-fence checks passed for the five changed documents; both new WORK handover targets were checked against the architecture headings. `git diff --check` passed for tracked changes (Git warned about README line-ending conversion); untracked documentation was checked directly. Reviewed the scoped patch and confirmed all runtime behaviour remains labelled as planned. No application exists, so runtime tests are not applicable to this change.

## Git publication handover — 15 September 2026

User authorised publishing current plans to the existing GitHub remote. Scope: README, AGENTS, the five documents, editor/ignore/environment templates and the existing HTML architecture illustration. Original briefs, slides, PDFs and reference packs remain local. Both `github_token.txt` and `github_tokens.txt` are ignored; the credential file stays outside the repository and is used only for transient authentication.

Authenticated fetch confirmed local `main` and `origin/main` were identical before publication. The explicit 11-file staged allowlist, exact-token exclusion, common credential-pattern scan, ignore checks for both token filenames and `git diff --cached --check` passed. The final task response records the resulting commit and remote verification. No application behaviour has been implemented or tested by this publication task.

## Later sequence
1. Proposed TASK-002: small AI feasibility experiment using a confirmed synthetic profile, then one bounded follow-up experiment. This refines the historical architecture sequence; deterministic play still comes first.
2. Intake, provenance and profile reconciliation using agreed formats.
3. Broader constrained package generation and human review.
4. Bounded interpretation and approved follow-ups, including outage evaluation.
5. Evidence-grounded AAR, action register, backup/restore and school-safe handover.

Known limitations: no executable contracts, application, identity system, persistence or evaluations. Historical architecture research was not independently revalidated in this baseline task. Existing reference documents remain untracked and are not automatically included in a future commit.
