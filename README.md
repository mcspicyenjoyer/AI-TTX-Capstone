# AI-assisted TTX Platform

A capstone tabletop exercise platform for SMEs, with separate technical and operational exercise tracks. The technical workstream is intended to turn an SME's network and continuity information into a validated profile and an organisation-specific cyber exercise. Facilitators approve the generated package and each release; AI interprets participant decisions to recommend approved follow-ups, and recorded evidence supports the draft after-action review and improvement actions.

## Current state
The Docker-first application supports synthetic profile confirmation, technical Step 0/briefing, exact approval/release, recipient-only inboxes, team response revisions, facilitator review, position closure and explicit run completion (TASK-001A-E). Pause freezes new releases and outcome writes; restart preserves evidence and pauses interrupted runs. The technical entry is a one-position engineering fixture, not an approved incident scenario or the five-inject baseline. Branching, AI, ingestion and AAR remain unimplemented. See [WORK](docs/WORK.md#current-verification) for verification and limitations.

The user owns both frontend and backend for the technical exercise; the other worker owns the operational exercise. TTX Platform remains the shared, track-neutral product name. A separate operational account now opens a server-backed development fixture through the same track-aware application. It has no technical-review access and no playable operational scenario. Use the [operational handoff](docs/operational-handoff.md) to develop independently without duplicating the engine.

Delivery priority, 4 October 2026 (ADR-021): Form B is authoritative. Start with a five-inject playable baseline, then expand to ten within Form B's 10-15 range. Complete its ingestion/reconciliation, controlled threat/pathway mapping, package generation, approved-branch recommendation, facilitator controls, reporting and evaluation/handover before extra features. Two-attempt coaching and the expanded readiness engine are deferred. The five-inject interim milestone does not replace final acceptance. Timeline dates are audit tracking, not scope or sequencing authority. See the [source mapping](docs/PROJECT.md#form-b-traceability) and [next milestones](docs/WORK.md#next-milestones).

Next: agree the shared position/variant/per-role evidence contract with the operational worker and select incident/objectives before authoring the five positions or reference inputs. Advance typed organisation/source and known-answer input work alongside that pilot. The engine is tested at five/ten flat entries with responses or explicit unanswered findings and closure, not reviewed scenario branches. Prepared fixtures do not substitute for Form B's required generator. [ADR-025](docs/DECISIONS.md#adr-025---bounded-technical-response-loop-and-current-handoff) records the bounded team/pause defaults selected under the user's delegation.

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

Include respondents representing every technical package participant role in Step 0, not just inject 1's recipient. Use `participant` in an isolated browser profile for briefing, inbox and the team response form. `observer` is also an assigned participant: it receives no inject body in this fixture but can see/revise the team's latest agreed response. This is shared team discussion, not permission to read another role's evidence. `operational` opens only the development workspace, with no inherited technical call-tree check. None of those three accounts may review the technical profile or private facilitator evidence.

Submit agreed actions, rationale and optional information requests. The facilitator sees all revisions, records a disposition and explicitly closes the position before completing the run. A missing answer needs an explicit unanswered finding; closure and completion do not claim successful recovery. Pausing keeps unsent drafts in browser memory but freezes new outcome writes until resume. Use separate browser profiles for a one-laptop pilot; multiple tabs or incognito windows may share a login. LAN/TLS access and the reviewed 3-4-role pilot setup are not implemented or approved by this workflow.

Codes are generated locally in `demo-access.json` and `demo-track-access.json` in the private data volume, not production authentication. Do not share facilitator codes with participants. Sessions end after eight hours or a server restart; saved exercise evidence and outcomes remain. Exercise-session expiry returns to sign-in; re-login does not retry commands. Visible reads refresh every five seconds, respecting unsaved Step 0 or uncertain-command locks. Drafts are not durable across reload/logout. Interrupted active runs recover paused and require explicit resume. Updating v1/v2/v3 databases adds schema v4 without replacing earlier records or codes. Technical runs without a current all-role Ready check need new recorded evidence before resume; migration does not invent answers or upgrade partial respondent coverage.

If port 3000 is occupied, set `TTX_PORT=3002` in an ignored `.env` using `.env.example` as the reference, then use localhost:3002. Host publication remains restricted to `127.0.0.1`.

```sh
docker compose stop
docker compose up -d --wait
docker compose logs --tail=30 app
```

`docker compose down` removes the container, not its named data volume. Do not use `docker compose down -v` or volume pruning unless intentionally deleting all saved exercise data and access codes.

### Verification

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
