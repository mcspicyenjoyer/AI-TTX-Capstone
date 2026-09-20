# AI-assisted TTX Platform

A capstone tabletop exercise platform for SMEs, with separate technical and operational exercise tracks. Organisation information is reviewed before use, facilitators approve content and release, and participant decisions provide evidence for the after-action review.

## Current state
The first implementation checkpoint is a Docker-first local application for synthetic organisation profile review and durable confirmation (TASK-001A/B). It includes separate server-validated facilitator/participant access, source evidence, labelled uncertainties and activity records. See WORK for verification results. Inject release, participant answers, AI, document ingestion and AAR generation are not implemented yet. The existing HTML architecture illustration is a design artefact.

Product framing clarified on 19 September 2026: TTX Platform is the shared product name, not Technical TTX. The user owns both frontend and backend for the technical exercise; the other worker owns the operational exercise. The current repository implementation and checkpoints cover the technical workstream, not a completed operational track or track-selection feature. See [project ownership and scope](docs/PROJECT.md#ownership-and-exercise-scope) and [current checkpoints](docs/WORK.md#technical-exercise-checkpoints).

The [first exercise draft](docs/PROJECT.md#first-exercise-draft), clarified on 18 September, uses five injects, two answers per inject and adaptive coaching. An insufficient second answer becomes an unresolved finding. SOC/MSSP responsibilities are established during setup; the RACI, rubric and detailed AAR template are pending. This follows the one-inject engineering slice and is distinct from the longer-term 10-15-entry target. See the [editable workflow diagram](docs/diagrams/ttx-five-inject-workflow.excalidraw) or [PNG preview](docs/diagrams/ttx-five-inject-workflow.png).

The [nine-screen storyboard](docs/diagrams/ttx-screen-concepts.svg) illustrates sign-in through after-action review, with existing capabilities and planned screens labelled separately. It is a design concept, not implemented navigation or a working exercise. See the [editable Excalidraw file](docs/diagrams/ttx-screen-concepts.excalidraw), [PNG preview](docs/diagrams/ttx-screen-concepts.png) and [design notes](docs/architecture.md#screen-storyboard---20-september-2026).

An [editable Figma copy](https://www.figma.com/design/4oCPzxBPHnEpsp4qRz2YV3?node-id=1-2) is available in 2301777's team. It is an imported storyboard with text/vector layers, not an interactive prototype or an automatically synchronised copy of the repository.

## Start here
| Document | Authoritative purpose |
| --- | --- |
| [Project](docs/PROJECT.md) | Scope, requirements, terminology and constraints |
| [Architecture](docs/architecture.md) | Component responsibilities, data flow and planned runtime rules |
| [Decisions](docs/DECISIONS.md) | Accepted directions and unresolved choices |
| [Work](docs/WORK.md) | Current state, verification evidence and next bounded task |
| [Quality](docs/QUALITY.md) | Acceptance cases, software tests and AI evaluation |
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

Sign in as `facilitator` to review the synthetic profile, expand its source evidence, acknowledge uncertainties and confirm the exact revision. `participant` is a separate restricted account and cannot read or confirm facilitator profiles. These generated codes are local demonstration credentials, not production authentication. Do not share the facilitator code with participants. Sessions end after eight hours or a server restart; saved confirmations remain.

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
docker run --rm ai-ttx-browser-tests:local
```

The optional browser-test image downloads Chromium and OS dependencies. It uses an isolated temporary database, not the demonstration volume. The runtime image contains neither those browsers nor the test suite. For source changes, rebuild with `docker compose up --build -d --wait`; no source mount or host credential directory is required.

### Moving laptops

Git carries the Dockerfile, Compose configuration, source and npm lockfile. On another laptop, clone and run the same startup command. The app creates a fresh synthetic dataset and new access codes there. Existing saved progress does **not** travel with Git: the `ai-ttx-capstone_exercise-data` volume is local to each Docker engine. Keep that volume if progress matters; transferring it requires a separate protected backup/restore. Backup/restore automation is not part of this first profile checkpoint. Docker engine permissions and organisational approval still apply on the destination laptop.

## Source material and data
The working product brief is the local `GPT_ICT4011_Form_B_AI_Assisted_TTX.docx`. Existing research documents and the architecture illustration remain in place. Their presence is not approval to redistribute, commit or transmit them to a provider.

The planning publication includes the architecture illustration and repository planning/configuration files. Original briefs, supervisor slides, PDFs and research/reference packs remain local; links to those materials require a local copy and will not resolve in a plans-only checkout.

Use synthetic organisational context and exercise content throughout the prototype, including demonstrations and evaluations. Keep credentials, uploads, session databases and sensitive exports outside Git and this OneDrive-synchronised source directory. Ignore rules are not access controls.
