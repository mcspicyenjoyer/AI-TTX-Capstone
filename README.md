# AI-assisted TTX Platform

A capstone tabletop exercise platform for SMEs, with separate technical and operational exercise tracks. The technical workstream is intended to turn an SME's network and continuity information into a validated profile and an organisation-specific cyber exercise. Facilitators approve the generated package and each release; AI interprets participant decisions to recommend approved follow-ups, and recorded evidence supports the draft after-action review and improvement actions.

## Current state
The Docker-first application supports native source intake, optional ChatGPT-subscription extraction, typed reconciliation and immutable confirmation. It generates a bounded five-inject package from the pinned confirmed profile, with private facilitator review/edit/reject/freeze and three-role delivery through the existing Step 0, approval/release, response, disposition, closure and completion engine. Quote-backed response interpretation has separate facilitator accept/edit/reject/override controls; it cannot progress the run. A deterministic app-record report captures completed runs and reviewed interpretations; bounded AI AAR drafting selects cited findings and proposes improvements from that fixed snapshot. The original one-position fixture remains available. Branching remains unimplemented. See [WORK](docs/WORK.md#current-verification) for verification and limitations.

The user owns both frontend and backend for the technical exercise; the other worker owns the operational exercise. TTX Platform remains the shared, track-neutral product name. A separate operational account now opens a server-backed development fixture through the same track-aware application. It has no technical-review access and no playable operational scenario. Use the [operational handoff](docs/operational-handoff.md) to develop independently without duplicating the engine.

Delivery priority, 4 October 2026 (ADR-021): Form B is authoritative. Start with a five-inject playable baseline, then expand to ten within Form B's 10-15 range. Complete its ingestion/reconciliation, controlled threat/pathway mapping, package generation, approved-branch recommendation, facilitator controls, reporting and evaluation/handover before extra features. Two-attempt coaching and the expanded readiness engine are deferred. The five-inject interim milestone does not replace final acceptance. Timeline dates are audit tracking, not scope or sequencing authority. See the [source mapping](docs/PROJECT.md#form-b-traceability) and [next milestones](docs/WORK.md#next-milestones).

Current: Teralqen `package-15` is frozen and its three-agent trial is complete. The five user-approved interpretation reviews and fixed report are captured. After an authorised CLI re-audit/pin update, one valid AAR draft is saved for human review (2/3 calls used); its improvements remain proposals with owners blank. [AAR results](docs/evaluation/aar-results.md) record the rejected first output, usage and limitations. Interpretation and AAR under [ADR-034](docs/DECISIONS.md#adr-034---bounded-interpretation-and-record-only-aar-at-five) do not change exercise outcomes. The [follow-up design](docs/architecture.md#proposed-reviewed-follow-ups) is proposed, not built; final ten-inject acceptance remains. Extra intake and infrastructure expansion wait. See [delivery discipline](docs/WORK.md#delivery-discipline-after-the-26-october-review).

Reuse the [synthetic organisation package](docs/organisation/example-sme-01/README.md) for baseline reference inputs once the incident family/objectives are selected. It is authored context, not a complete reference pack, approved exercise or imported application profile. Its [research note](docs/research/technical-ttx-inputs-and-synthetic-pack.md) is advisory. Further company-detail expansion is deferred unless needed for Form B.

Historical design references: the [five-inject workflow](docs/diagrams/ttx-five-inject-workflow.svg), [editable scene](docs/diagrams/ttx-five-inject-workflow.excalidraw) and [PNG](docs/diagrams/ttx-five-inject-workflow.png) include deferred coaching/readiness features. The [nine-screen storyboard](docs/diagrams/ttx-screen-concepts.svg), [editable scene](docs/diagrams/ttx-screen-concepts.excalidraw) and [PNG](docs/diagrams/ttx-screen-concepts.png) also predate current scope. They are layout/design references, not baseline acceptance or implemented behaviour; use PROJECT and WORK for current direction.

An [editable Figma copy](https://www.figma.com/design/4oCPzxBPHnEpsp4qRz2YV3?node-id=1-2) is available in the existing design workspace. It is an imported storyboard with text/vector layers, not an interactive prototype or an automatically synchronised copy of the repository.

The Figma copy and HTML component illustration retain the older design. Follow PROJECT for baseline scope; neither is automatically updated when repository plans change.

## Start here
| Document | Authoritative purpose |
| --- | --- |
| [Project](docs/PROJECT.md) | Form B scope mapping, authorised staging, terminology and constraints |
| [Architecture](docs/architecture.md) | Component responsibilities, data flow and planned runtime rules |
| [Decisions](docs/DECISIONS.md) | Accepted directions and unresolved choices |
| [Work](docs/WORK.md) | Current state, verification evidence and next bounded task |
| [Quality](docs/QUALITY.md) | Acceptance cases, software tests and AI evaluation |
| [Form B matrix](docs/form-b-alignment.md) | All twelve objectives and fourteen deliverables, linked to requirements and current gaps |
| [Threat-pathway template](THREAT_PATHWAY_TEMPLATE.md) | Authoring aid for grounded scenario preparation, not an approved scenario or generator |
| [Operational handoff](docs/operational-handoff.md) | Runnable entry, shared API, contribution boundaries and local workflow |
| [Agent instructions](AGENTS.md) | Repository working rules |

Keep the existing lowercase `docs/architecture.md`; do not create a competing case-only filename.

## Setup
This is currently a local facilitator-operated prototype, not a self-service installation for SME participants. The operator manages the environment below; participants use separate browser sessions. The optional subscription path adds host-side requirements. Hosted/MSSP deployment and multi-device LAN access are not established by this setup.

Install Git and Docker Desktop with its Linux engine on each laptop (Docker Engine plus Compose on Linux). Clone this repository and run from its root:

```sh
docker compose up --build -d --wait
```

Open [the local application](http://localhost:3000). No host Node/npm install is required. The first build downloads the base image and locked npm packages; subsequent builds reuse Docker's cache. Ordinary builds run formatting, lint, type, deterministic test and build checks before creating the runtime image.

Retrieve the generated demo access codes locally, without putting them in Git or server logs:

```sh
docker compose exec app node dist/server/show-access.js
```

Sign in as `facilitator` to review the synthetic profile, expand its source evidence, acknowledge uncertainties and confirm the exact revision. Open **Exercises**, ask the responding team whom they would contact first, how they would find/use the route and their fallback. Record the oral answers and a reasoned Ready / Clarification required / Hold decision; references may be consulted, and corrections preserve history. After Ready, review the explicit simulation arrangements and confirm the briefing, approve the inject's exact revision/recipients, then release it. Approval and release are separate actions. Pause/resume invalidates an unused approval; review and approve again after resuming.

For new preparation, open **Source intake** and create a synthetic draft. Import uncompressed editable draw.io XML (or its editable SVG export), with optional text-bearing DOCX/PDF or UTF-8 `.md`/`.txt` evidence. Choose source passages, classify entities, review/add/correct/reject claims, and save a rationale before confirming the snapshot. Proposed RTO/RPO is not proven recovery capability. Original files are not archived; keep them for comparison. File/source limits and exclusions are in [architecture](docs/architecture.md#bounded-source-intake). AI is disabled by default; the optional worker below enables explicit extraction requests. Confirmed profiles export as JSON but do not replace the existing exercise fixture; later changes currently need a new draft.

Include respondents representing every technical package participant role in Step 0, not just inject 1's recipient. Use `participant` in an isolated browser profile for briefing, inbox and the team response form. `observer` is also an assigned participant: it receives no inject body in this fixture but can see/revise the team's latest agreed response. This is shared team discussion, not permission to read another role's evidence. `operational` opens only the development workspace, with no inherited technical call-tree check. None of those three accounts may review the technical profile or private facilitator evidence.

Submit agreed actions, rationale and optional information requests. The facilitator sees all revisions, records a disposition and explicitly closes the position before completing the run. A missing answer needs an explicit unanswered finding; closure and completion do not claim successful recovery. Pausing keeps unsent drafts in browser memory but freezes new outcome writes until resume. Use separate browser profiles for a one-laptop pilot; multiple tabs or incognito windows may share a login. The generated package supplies three local player accounts after target configuration. LAN/TLS access remains unimplemented and unapproved.

Codes are generated locally in `demo-access.json` and `demo-track-access.json` in the private data volume, not production authentication. Do not share facilitator codes with participants. Sessions end after eight hours or a server restart; saved evidence remains. Exercise-session expiry returns to sign-in; re-login does not retry commands. Visible exercise reads refresh every five seconds, respecting unsaved Step 0 or uncertain-command locks. Unsaved edits are not durable across reload/logout; saved intake revisions are. The app asks before a tab change, exercise switch or sign-out would discard unsaved input, and the browser warns before unload. Interrupted active runs recover paused and require explicit resume. Updating earlier databases adds schema v11 without replacing earlier records or codes. v10 adds AAR revisions and future clarification records alongside the immutable v9 report snapshots and v8 interpretations; v11 adds post-completion debrief entries. Back up the volume before upgrading a preview that holds real trial evidence. Technical runs without a current all-role Ready check need new recorded evidence before resume; migration does not invent answers or upgrade partial respondent coverage.

If port 3000 is occupied, set `TTX_PORT=3002` in an ignored `.env` using `.env.example` as the reference, then use localhost:3002. Host publication remains restricted to `127.0.0.1`.

```sh
docker compose stop
docker compose up -d --wait
docker compose logs --tail=30 app
```

`docker compose down` removes the container, not its named data volume. Do not use `docker compose down -v` or volume pruning unless intentionally deleting all saved exercise data and access codes.

### ChatGPT subscription extraction

Optional Windows-only local prototype. Requires Node 24.19, Docker Desktop, the pinned Codex CLI `0.165.0-alpha.1.2`, and your own managed ChatGPT login. An updated/different binary fails closed; review and rerun the isolation audit before changing its pin. No credential file is copied or mounted into Docker, and no API key is used. Do not use this path for real organisational documents or a hosted multi-user service.

In PowerShell from the repository, with a free loopback port (the current preview uses 3011):

```powershell
npm ci
codex login status
$env:TTX_PORT = '3011'
$env:TTX_AI_ENABLED = 'codex-subscription'
docker compose -p ai-ttx-intake-preview up --build -d --wait
$codex = (Get-Command codex).Source
$root = Join-Path $env:LOCALAPPDATA 'AI-TTX\subscription-worker'
node --import tsx scripts/check-codex-isolation.ts $codex "$root\audit"
node --import tsx src/server/subscription-worker.ts $codex "$root\runtime" ai-ttx-intake-preview-app-1
```

Leave the worker running. In **Source intake**, import only synthetic evidence and select **Extract candidates**; the confirmation names the source count and subscription usage. Refresh/polling shows durable progress. Returned candidates remain pending alongside the unchanged native candidates. Review duplicates, source support, knowledge status and missing service dependencies before accepting anything. You can continue manually during an outage; editing a draft invalidates an old in-flight result.

Stop the worker with Ctrl+C. Restart it after recreating/restarting the app container. Unfinished jobs become interrupted, never automatically resubmitted; inspect the current draft before explicitly requesting another extraction. To disable, set `TTX_AI_ENABLED=false` and recreate the app without deleting its volume. See architecture for request/deadline/output limits. Worker attempt reports remain outside the repository in the runtime directory; do not publish account data or synthetic role-private evidence to participants.

### Five-inject generation

The local preview at `http://127.0.0.1:3011/` has the exact confirmed Teralqen target configured. Sign in as the facilitator and open **Package generation**. Inspect the profile ID, immutable revision ID and SHA-256. The original reviewed content was intake revision 8; accepting its review states and confirming advanced intake counters to 10, without changing those facts. This is not a second profile correction.

The generator selects confirmed evidence and supported event/action fields. It does not author unrestricted organisational prose. Review the scenario, functional role assignments, evidence distribution, timing, expected actions and criteria. Save any inject edit, inspect its rendered messages, then accept or reject it. All five must be accepted before **Approve and freeze package** creates a draft run. **Exercises** then uses the existing Step 0, per-position approval/release, team response, facilitator review, closure and explicit completion. Interpretation and AAR review are separate from progression; branches are not implemented yet.

Run the existing worker in package mode with the same pinned CLI and ChatGPT login:

```powershell
$codex = (Get-Command codex).Source
$root = Join-Path $env:LOCALAPPDATA 'AI-TTX\package-worker'
node --import tsx src/server/subscription-worker.ts $codex $root ai-ttx-intake-preview-app-1 packages
```

Append `once` to process one explicitly queued request and exit. Do not run extraction and package workers against the same worker directory. Generation is an explicit subscription-consuming action, not an ordinary test. A failed draft remains failed; another request is deliberate, not automatic. Raw source documents are not passed to this generator.

For a fresh local installation, place the operator-approved `package-target.json` in its external data directory before starting the app. Its app-owned contract is `PackageTargetSchema`: exact `profileId`, `profileRevisionId`, `profileHash`, `reviewRevision: 8` and original `reviewHash`. Do not substitute the example fixture or copy a target without its matching confirmed database. The three generated-demo player usernames are `player-business`, `player-engineering`, `player-it`; the explicit `show-access` operator command reads their codes locally. Never paste codes into Git or shared reports.

**Why AppData?** The repository contains source, tests and progress documentation. The live database/access codes remain in the Docker named volume; host review reports, target metadata, model attempts and screenshots are under `%LOCALAPPDATA%\AI-TTX`. Keeping these outside the synchronised Git checkout prevents accidentally publishing uploads, private role evidence and credentials. AppData is a local runtime/evidence location, not a replacement for version-controlled project progress. Selected synthetic mini-fixtures and test summaries are committed.

### Response interpretation

For a frozen generated package, open its run in **Exercises** as facilitator. Each position with a recorded response has an interpretation panel. Request AI interpretation or start a manual assessment. Compare action labels and quoted evidence, then explicitly accept, edit, reject or override with a reason. The saved AI proposal and review remain distinct. A changed response makes the old interpretation stale; review the new revision instead. Completed runs can be analysed without reopening or altering their recorded outcomes.

```powershell
$codex = (Get-Command codex).Source
$root = Join-Path $env:LOCALAPPDATA 'AI-TTX\interpretation-worker'
node --import tsx src/server/subscription-worker.ts $codex $root ai-ttx-intake-preview-app-1 interpretations
```

Use a different worker directory from extraction/generation; run only the needed mode. Requests are explicit, not automatic. The milestone has a persistent thirty-started-attempt cap, including failures. Failure, timeout or unavailable usage is recorded; no paid fallback or automatic retry exists. Manual interpretation and the ordinary disposition/closure controls remain available with AI disabled or unavailable. A quote proves what the team wrote, not that approval, isolation or recovery occurred. Comparison normalises curly/straight quotes and whitespace only; original wording is retained. Participants cannot read the interpretation API or private review.

The bounded evaluation runner is `scripts/evaluate-interpretation.ts` (development, freeze, holdout, trial and report modes). It checks the unchanged corpus hashes, exact completed `package-15` binding and original run-record hash. Freeze the prompt/schema/validation recipe after development, before the single held-out pass. Do not rerun cases or change the labels to improve a score. Raw attempt evidence stays outside Git; the reviewed aggregate report belongs with project evaluation documentation. On this Codex installation, Windows redirects host evidence to the app cache; use WORK's verified on-disk path, and exclude all player `access.json` files and credential-bearing databases from report bundles.

### App-record report (no AI)

Review the five trial interpretations in **Exercises > Run** first. Then open the completed exercise's **Record report** tab and choose **Capture record snapshot**. **By objective** and **Timeline** show the same immutable record with clickable IDs. Only current facilitator-reviewed interpretations are included and marked reviewed; rejected assessments are omitted but their review notes remain. Unreviewed and stale assessments are excluded. The report states that this trial's clarification answers are outside the app record; no private rehearsal files are imported.

After the run is completed, use **Debrief** at the top of the tab to record a summary of participant feedback (naming the participants), your observations and exercise-design limitations. Entries are append-only and appear only in snapshots captured afterwards. Capture again after further review or a debrief to create a new snapshot; select an earlier snapshot to inspect its unchanged content/hash. A network-uncertain capture exposes an explicit retry for that same snapshot, not a new AI request. The report is facilitator-only and does not reopen the completed run. It contains recorded text and attributed reviews, not AI-drafted strengths, areas for improvement or improvement actions. Those are drafted separately from the selected snapshot within the three-call limit below.

New captures show a **Fictional exercise clock** next to each release, response, disposition and closure, with release citations. Related records use their release position's elapsed minutes/time, not an asserted time when an action happened. **Recorded** identifies the separate app timestamp. Reviewed interpretations appear as **Post-exercise analysis**, not exercise events. Missing or conflicting clock evidence stays unavailable; old snapshots are not rewritten.

### Snapshot-bound AAR

In **Exercises > Record report**, select the verified snapshot, then choose **Draft AAR**. The AI request is bound to that exact ID/hash; later interpretation reviews or captures cannot alter it. The same subscription worker supports an AAR-only mode:

```powershell
$codex = (Get-Command codex).Source
$root = Join-Path $env:LOCALAPPDATA 'AI-TTX\aar-worker'
node --import tsx src/server/subscription-worker.ts $codex $root ai-ttx-intake-preview-app-1 aars once
```

Run only the needed worker mode, with its own external directory. Resolve `$codex` to the verified executable, not an automatically updated shim: a version/hash mismatch stops before a model call and needs the existing isolation audit before any approved pin update. The milestone cap is three started AAR attempts, including failures, invalid output and timeouts. Unknown usage is shown as unknown, not zero. No paid fallback or automatic retry. **New manual AAR** remains available without a provider. Every finding quotes a captured record field with clickable IDs; the application rejects unresolvable citations, invented excerpts, invalid attribution and unsupported gap origins. AI drafts leave improvement owners blank. When you edit the draft you may assign an owner from the run's confirmed people and set a due date; assignment is not completion. AAR text is escaped, not executed as HTML. Quote validity does not prove a correct interpretation or capability: inspect evidence and explicitly accept, edit, reject or save a manual override with a review rationale.

During a future active generated run, **Facilitator Clarifications** records the participant question and its answer against the current open release, with confirmed claim IDs. Unknown answers remain `not known at this time`. Logging does not send an answer to participants. Completed runs cannot be backfilled; this trial's private clarification answers remain outside its record and AAR evidence.

### Verification commands

```sh
docker build --target verify -t ai-ttx-verify:local .
docker build --target browser-tests -t ai-ttx-browser-tests:local .
docker run --rm --network none ai-ttx-browser-tests:local
```

The optional browser-test image downloads Chromium and OS dependencies. Profile, exercise and real-server-restart tests use separate temporary databases and loopback servers, not demonstration volumes. Tests require no live AI or external delivery. The runtime image contains neither those browsers nor the test suite. For source changes, rebuild with `docker compose up --build -d --wait`; no source mount or host credential directory is required.

### Moving laptops

Git carries the Dockerfile, Compose configuration, source and npm lockfile. On another laptop, clone and run the same startup command. The app creates a fresh synthetic dataset and new access codes there. Existing saved progress does **not** travel with Git: the `ai-ttx-capstone_exercise-data` volume is local to each Docker engine. Keep that volume if progress matters; transferring it requires a separate protected backup/restore. Backup/restore automation is not implemented. Docker engine permissions and organisational approval still apply on the destination laptop.

## Source material and data
The authoritative product brief is the local `references/GPT_ICT4011_Form_B_AI_Assisted_TTX.docx`, supplied in the primary checkout and reviewed on 4 October 2026. PROJECT records its source identity and requirement mapping. It remains ignored and is not copied into this worktree. Its presence, and that of other reference material, is not approval to redistribute, commit or transmit it to a provider.

The planning publication includes the architecture illustration and repository planning/configuration files. Original briefs, supervisor slides, PDFs and research/reference packs remain local; links to those materials require a local copy and will not resolve in a plans-only checkout. The user-supplied `references/` folder is ignored by Git and remains available for local review.

Use synthetic organisational context and exercise content throughout the prototype, including demonstrations and evaluations. Keep credentials, uploads, session databases and sensitive exports outside Git and synchronised source directories. Ignore rules are not access controls.

Public-hosting suitability needs the owner's school/hosting-organisation review. Git metadata, historical documentation and linked design services can identify contributors even when exercise fixtures are synthetic. This checkpoint does not assert a whole-history secrets audit, change repository visibility or rewrite identities/history.
