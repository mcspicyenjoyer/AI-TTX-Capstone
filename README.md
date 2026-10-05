# AI-assisted TTX Platform

A capstone tabletop exercise platform for SMEs, with separate technical and operational exercise tracks. The technical workstream is intended to turn an SME's network and continuity information into a validated profile and an organisation-specific cyber exercise. Facilitators approve the generated package and each release; AI interprets participant decisions to recommend approved follow-ups, and recorded evidence supports the draft after-action review and improvement actions.

## Current state
The first implementation checkpoint is a Docker-first local application for synthetic organisation profile review and durable confirmation (TASK-001A/B). It includes separate server-validated facilitator/participant access, source evidence, labelled uncertainties and activity records. See WORK for verification results. Inject release, participant answers, AI, document ingestion and AAR generation are not implemented yet. The existing HTML architecture illustration is a design artefact.

Product framing clarified on 19 September 2026: TTX Platform is the shared product name, not Technical TTX. The user owns both frontend and backend for the technical exercise; the other worker owns the operational exercise. The current repository implementation and checkpoints cover the technical workstream, not a completed operational track or track-selection feature. See [project ownership and scope](docs/PROJECT.md#ownership-and-exercise-scope) and [current checkpoints](docs/WORK.md#technical-exercise-checkpoints).

On 29 September, the user made Form B the assessment authority, with one delivery exception: retain five MSEL injects first instead of the source's 10-15 entries. The [first delivery](docs/PROJECT.md#first-exercise-draft) still requires document ingestion, reconciliation, controlled threat-pathway mapping and generation of an organisation-specific package, with 3-4 functional roles and three key decision points. The [Form B alignment matrix](docs/form-b-alignment.md) maps every objective and deliverable to requirements, remaining tasks and actual evidence. These are planned capabilities, not current runtime behaviour.

[ADR-021](docs/DECISIONS.md#adr-021---form-b-authority-and-five-inject-first-delivery) supersedes ADR-018's replacement of generation with predefined packages. Prepared fixtures remain useful for control tests and manual comparison/fallback. Targeted coaching and one coached retry are retained supplementary features; core response interpretation, approved branching and reporting must work without them. No AI recommendation grants release authority or forces a successful outcome. RACI, readiness/evaluation details, branch content and the AAR template still need review.

The [synthetic organisation package](docs/organisation/example-sme-01/README.md), refined on 28 September under ADR-020, separates Teralqen Engineering's shared brief/reference, baseline role cards and author register/source notes. It supplies a foundation for the required input/known-answer pack; it is not a parsed profile, generated exercise or replacement for the application fixture. Incident-family/objective selection and the bounded input specification are next content decisions. The [technical TTX research note](docs/research/technical-ttx-inputs-and-synthetic-pack.md) is historical advice; its predefined-package recommendation is superseded.

The [workflow SVG](docs/diagrams/ttx-five-inject-workflow.svg), [editable diagram](docs/diagrams/ttx-five-inject-workflow.excalidraw) and [PNG](docs/diagrams/ttx-five-inject-workflow.png) retain the 24 September design. They are historical references and do not fully encode ADR-021's required generation workflow or supplementary coaching status. Follow [current architecture](docs/architecture.md#form-b-workflow---29-september-2026), [bounded adaptation](docs/architecture.md#bounded-adaptation-design---24-september-2026) and [PROJECT](docs/PROJECT.md) for the current design and scope.

The [nine-screen storyboard](docs/diagrams/ttx-screen-concepts.svg) illustrates sign-in through after-action review, with existing capabilities and planned screens labelled separately. Its 20 September intake-before-track ordering is superseded by the current workflow; retain it for layout reference pending the readiness specification. It is not implemented navigation or a working exercise. See the [editable Excalidraw file](docs/diagrams/ttx-screen-concepts.excalidraw), [PNG preview](docs/diagrams/ttx-screen-concepts.png) and [design notes](docs/architecture.md#screen-storyboard---20-september-2026).

An [editable Figma copy](https://www.figma.com/design/4oCPzxBPHnEpsp4qRz2YV3?node-id=1-2) is available in 2301777's team. It is an imported storyboard with text/vector layers, not an interactive prototype or an automatically synchronised copy of the repository.

The Figma copy and HTML component illustration retain the older design. Follow PROJECT and the current architecture text for preparation order and first-delivery scope. Figma is not automatically updated when repository plans are published.

## Start here
| Document | Authoritative purpose |
| --- | --- |
| [Project](docs/PROJECT.md) | Scope, requirements, terminology and constraints |
| [Form B alignment](docs/form-b-alignment.md) | Assessment-source identity, objective/deliverable coverage and the five-inject exception |
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
The assessment brief is the local [Form B](references/GPT_ICT4011_Form_B_AI_Assisted_TTX.docx), with the user's explicit first-delivery count exception and operational-workstream ownership clarification recorded in PROJECT. Existing research documents and illustrations remain in place. Their presence is not approval to redistribute, commit or transmit them to a provider.

The planning publication includes the architecture illustration and repository planning/configuration files. Original briefs, supervisor slides, PDFs and research/reference packs remain local; links to those materials require a local copy and will not resolve in a plans-only checkout. The user-supplied `references/` folder is ignored by Git and remains available for local review.

Use synthetic organisational context and exercise content throughout the prototype, including demonstrations and evaluations. Keep credentials, uploads, session databases and sensitive exports outside Git and this OneDrive-synchronised source directory. Ignore rules are not access controls.
