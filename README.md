# AI-assisted TTX Platform

A capstone tabletop exercise platform for SMEs, with separate technical and operational exercise tracks. Organisation information is reviewed before use, facilitators approve content and release, and participant decisions provide evidence for the after-action review.

## Current state
The Docker-first local application now supports synthetic profile review/confirmation, a Step 0 briefing, exact-revision inject approval, transactional release, recipient-only inboxes and durable exercise activity (TASK-001A/B/C). Pause/resume and restart recovery protect releases. The technical entry is a one-inject engineering fixture, not an approved incident scenario or the five-inject baseline. Participant answers, completion, AI, document ingestion and AAR generation remain unimplemented. See [WORK](docs/WORK.md#release-and-operational-handoff---4-october-2026) for verification and limitations.

The user owns both frontend and backend for the technical exercise; the other worker owns the operational exercise. TTX Platform remains the shared, track-neutral product name. A separate operational account now opens a server-backed development fixture through the same track-aware application. It has no technical-review access and no playable operational scenario. Use the [operational handoff](docs/operational-handoff.md) to develop independently without duplicating the engine.

Delivery priority, 4 October 2026 (ADR-021): Form B is authoritative. Start with a five-inject playable baseline, then expand to ten within Form B's 10-15 range. Complete its ingestion/reconciliation, controlled threat/pathway mapping, package generation, approved-branch recommendation, facilitator controls, reporting and evaluation/handover before extra features. Two-attempt coaching and the expanded readiness engine are deferred. The five-inject interim milestone does not replace final acceptance. See the [source mapping](docs/PROJECT.md#form-b-traceability) and [next milestones](docs/WORK.md#next-milestones).

Next engineering step: TASK-001D's agreed response capture, then the remaining TASK-001E completion/recovery rules. Settle pause behaviour for submissions and select the reviewed incident/objectives before the five-inject package. The shared release sequence is tested at five and ten entries, but those contract tests are not a completed exercise. Prepared fixtures do not substitute for Form B's required generator; ADR-021 supersedes ADR-018's predefined-only delivery direction.

Reuse the [synthetic organisation package](docs/organisation/example-sme-01/README.md) for baseline reference inputs once the incident family/objectives are selected. It is authored context, not a complete reference pack, approved exercise or imported application profile. Its [research note](docs/research/technical-ttx-inputs-and-synthetic-pack.md) is advisory. Further company-detail expansion is deferred unless needed for Form B.

Historical design references: the [five-inject workflow](docs/diagrams/ttx-five-inject-workflow.svg), [editable scene](docs/diagrams/ttx-five-inject-workflow.excalidraw) and [PNG](docs/diagrams/ttx-five-inject-workflow.png) include deferred coaching/readiness features. The [nine-screen storyboard](docs/diagrams/ttx-screen-concepts.svg), [editable scene](docs/diagrams/ttx-screen-concepts.excalidraw) and [PNG](docs/diagrams/ttx-screen-concepts.png) also predate current scope. They are layout/design references, not baseline acceptance or implemented behaviour; use PROJECT and WORK for current direction.

An [editable Figma copy](https://www.figma.com/design/4oCPzxBPHnEpsp4qRz2YV3?node-id=1-2) is available in 2301777's team. It is an imported storyboard with text/vector layers, not an interactive prototype or an automatically synchronised copy of the repository.

The Figma copy and HTML component illustration retain the older design. Follow PROJECT for baseline scope; neither is automatically updated when repository plans change.

## Start here
| Document | Authoritative purpose |
| --- | --- |
| [Project](docs/PROJECT.md) | Form B scope mapping, authorised staging, terminology and constraints |
| [Architecture](docs/architecture.md) | Component responsibilities, data flow and planned runtime rules |
| [Decisions](docs/DECISIONS.md) | Accepted directions and unresolved choices |
| [Work](docs/WORK.md) | Current state, verification evidence and next bounded task |
| [Quality](docs/QUALITY.md) | Acceptance cases, software tests and AI evaluation |
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

Sign in as `facilitator` to review the synthetic profile, expand its source evidence, acknowledge uncertainties and confirm the exact revision. Open **Exercises**, review Step 0 and its explicit simulated arrangements, confirm the briefing, approve the inject's exact revision/recipients, then release it. Approval and release are separate actions. Pause/resume invalidates an unused approval; review and approve again after resuming.

Use `participant` in a separate browser session for its briefing and released inbox. `observer` is an assigned but unaddressed participant and receives no inject in this fixture. `operational` opens only the operational development workspace. None of those three accounts may review the technical profile or its private exercise material. There is no response form or completion action yet; exhausting the release sequence is not exercise completion.

Codes are generated locally in `demo-access.json` and `demo-track-access.json` in the private data volume, not production authentication. Do not share facilitator codes with participants. Sessions end after eight hours or a server restart; saved confirmations, approvals, releases and activity remain. Interrupted active runs recover paused and require explicit resume. Updating a v1 profile database adds the exercise tables without replacing the saved profile, confirmation or original codes.

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

The optional browser-test image downloads Chromium and OS dependencies. Profile and exercise projects use separate temporary databases and loopback servers, not demonstration volumes. Tests require no live AI or external delivery. The runtime image contains neither those browsers nor the test suite. For source changes, rebuild with `docker compose up --build -d --wait`; no source mount or host credential directory is required.

### Moving laptops

Git carries the Dockerfile, Compose configuration, source and npm lockfile. On another laptop, clone and run the same startup command. The app creates a fresh synthetic dataset and new access codes there. Existing saved progress does **not** travel with Git: the `ai-ttx-capstone_exercise-data` volume is local to each Docker engine. Keep that volume if progress matters; transferring it requires a separate protected backup/restore. Backup/restore automation is not implemented. Docker engine permissions and organisational approval still apply on the destination laptop.

## Source material and data
The authoritative product brief is the local `references/GPT_ICT4011_Form_B_AI_Assisted_TTX.docx`, supplied in the primary checkout and reviewed on 4 October 2026. PROJECT records its source identity and requirement mapping. It remains ignored and is not copied into this worktree. Its presence, and that of other reference material, is not approval to redistribute, commit or transmit it to a provider.

The planning publication includes the architecture illustration and repository planning/configuration files. Original briefs, supervisor slides, PDFs and research/reference packs remain local; links to those materials require a local copy and will not resolve in a plans-only checkout. The user-supplied `references/` folder is ignored by Git and remains available for local review.

Use synthetic organisational context and exercise content throughout the prototype, including demonstrations and evaluations. Keep credentials, uploads, session databases and sensitive exports outside Git and this OneDrive-synchronised source directory. Ignore rules are not access controls.
