# AI-assisted Technical TTX-in-a-Box

A capstone prototype for preparing and facilitating a technical tabletop exercise for one representative SME. Organisation information is reviewed before use, facilitators approve content and release, and participant decisions provide evidence for the after-action review.

## Current state
Architectural documentation baseline established on 15 September 2026. No application, executable schemas, package manifest, database or AI integration exists yet. The existing HTML architecture illustration is a design artefact.

Task ownership updated on 16 September 2026: the user owns both frontend and backend for the technical exercise; the other worker owns the operational exercise. This replaces the earlier frontend/backend split between people. See [project ownership and scope](docs/PROJECT.md#ownership-and-exercise-scope) and [current checkpoints](docs/WORK.md#technical-exercise-checkpoints).

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
No installation is needed for this documentation baseline. Open this repository in your editor. Use `git status --short` and `git diff` to inspect tracked changes; new untracked files need separate review.

Observed on this machine: Windows, PowerShell 7.6, Node.js 24.20.0 and npm 11.19.0. These are observations, not approved deployment versions.

There is no start, build, test or `npm run check` command yet. The scaffold task must establish and execute those commands before documenting them as working. Nothing currently reads `.env.example`.

## Source material and data
The working product brief is the local `GPT_ICT4011_Form_B_AI_Assisted_TTX.docx`. Existing research documents and the architecture illustration remain in place. Their presence is not approval to redistribute, commit or transmit them to a provider.

The planning publication includes the architecture illustration and repository planning/configuration files. Original briefs, supervisor slides, PDFs and research/reference packs remain local; links to those materials require a local copy and will not resolve in a plans-only checkout.

Use synthetic fixtures initially. Keep credentials, uploads, session databases and sensitive exports outside Git and this OneDrive-synchronised source directory. Ignore rules are not access controls.
