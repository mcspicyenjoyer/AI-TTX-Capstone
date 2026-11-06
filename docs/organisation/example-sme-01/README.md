# Teralqen Engineering: organisation package

**Author/reviewer index. Do not distribute this index as a player handout.**

Source-folder update, 6 November 2026: the existing network diagram and continuity documents are now collected here alongside the company brief, register and role cards. This is the authored foundation for the synthetic reference pack under [TASK-006](../../WORK.md#task-006---document-intake-and-profile-reconciliation), not a claim of independent reference-pack acceptance. Selected sources have already been used for intake and the [five-position rehearsal](../../evaluation/full-demo-rehearsal-2026-11-05.md). Current implementation and remaining Form B work belong in [WORK](../../WORK.md); the original authoring notes below are not current runtime status.

## Find the files

All paths below are relative to this folder, `docs/organisation/example-sme-01`.

| File | Purpose | Intake source type |
| --- | --- | --- |
| [Network diagram](network-diagram.drawio.svg) | Viewable SVG with its editable draw.io model retained; formerly `Untitled Diagram.drawio.svg` on the Desktop | Network diagram |
| [Business continuity plan](business-continuity-plan.md) | Draft BCP, including the four-service BIA/target table, practical fallbacks and recovery checklist; not separate BIA/DRP manuals | BCP |
| [Company brief](organisation-brief.md) | Shared organisation background | Guided context, uploaded as a text file |
| [Imran's IT reference](role-cards/imran.md) | Technical configuration, authority and recovery context | Guided context, uploaded as a text file |

These are the four source inputs used for the rehearsal, not instructions to upload the whole folder. The [continuity review](continuity-review.md), master register and author notes are reviewer material; keep expected extraction answers out of evaluation inputs. See the [user guide](../../user-guide.md) for intake and review.

## Keeping and retrieving the pack

This folder is the repository home for these selected synthetic reference documents. Keep the folder together so its relative links and `role-cards` references continue to work. Open this index from the top-level README; Git history retains committed editions even after later edits. For an older edition, use `git log -- docs/organisation/example-sme-01` and inspect the relevant commit without resetting the current worktree. Access from another machine requires an authorised push or a separate backup; a local commit alone is not an off-device backup.

On 6 November the diagram was copied from the Desktop and the BCP/review from planning worktree `2777`; all three copies match the original bytes, and the originals were left untouched. Only these selected synthetic reference files were brought in, not runtime uploads, databases, credentials or the worktree's other edits. The BCP remains `bcp-draft-0.1`. The preserved 8 October review refers to that planning worktree's `org-draft-0.4`; this folder's baseline register, brief and cards remain their existing editions, not a newly reconciled revision. Read its remaining-work statements as historical authoring notes, not current software status.

## Source editions

| Item | Value |
| --- | --- |
| Package | `ORG-EXAMPLE-SME-01`; stable ID/path retained from Example SME 01 |
| Revision | Baseline register/brief/cards: `org-draft-0.3`, 28 September 2026; separate continuity draft: `bcp-draft-0.1`, 8 October 2026 |
| Company | Teralqen Engineering Pte. Ltd.; 42-person Singapore civil/structural consultancy |
| Fictional calendar | 28 September 2026 at 09:00 SGT; project commitments 31 and 56 hours away |
| Review | Shared-context and role-knowledge revision following the user's second realism review |
| Naming | Teralqen and ten supplier/customer labels have user-reported BizFile no-match results; no independent clearance |
| Runtime | Selected source intake and generated play are recorded in the [rehearsal report](../../evaluation/full-demo-rehearsal-2026-11-05.md); this folder is not a live profile or run export |

## Reading and distribution

The short summary is the read-first, one-page-length text; Markdown print pagination depends on the renderer. The longer profile is a shared reference, not a catalogue of every company weakness.

| Material | Intended audience | Content |
| --- | --- | --- |
| [Read-first brief](participant-summary.md) | All players | Company, people, deadlines, normal work |
| [Company reference](organisation-brief.md) | All players | Shared everyday company context |
| [Network diagram](network-diagram.drawio.svg) | Planner/reviewer; role-appropriate excerpts for play | Editable network and dependency source |
| [Business continuity plan](business-continuity-plan.md) | Restricted planning reference; reviewed role excerpts for play | Proposed service targets, fallbacks, authority and recovery checks |
| [Continuity basis and review](continuity-review.md) | Authors/reviewers only | Historical plan rationale, source references and draft extraction expectations |
| [Ethan](role-cards/ethan.md) | MD role holder | Business authority and company arrangements |
| [Clara](role-cards/clara.md) | Technical Director role holder | Engineering work, deputy authority and competing responsibilities |
| [Nadia](role-cards/nadia.md) | Project Manager role holder | Project issues, guests and customer commitments |
| [Daphne](role-cards/daphne.md) | Finance/Admin and DPO role holder | Payment/payroll, privacy, contracts and insurance |
| [Imran](role-cards/imran.md) | Internal IT role holder | Configuration, exceptions, recovery records and internal cover |
| [Joel](role-cards/joel.md) | MSP role holder or designated facilitator representative | Maintenance, backup scope and supplier access |
| [Anika](role-cards/anika.md) | SOC role holder or designated facilitator representative | Telemetry, authority and current escalation record |
| [Master register](master-register.md) | Authors/reviewers only | Canonical IDs, facts, gaps and provenance |
| [Author notes](author-notes.md) | Authors/reviewers only | Knowledge allocation, source checks and design rationale |
| [Name screening](name-screening.md) | Authors/reviewers only | Adopted mixed-style replacements and limited screening evidence |

Cards are starting knowledge, not instructions to conceal information from colleagues. Do not hand every player all seven cards. Seven characters do not mandate seven participants: role combination and facilitator representation need explicit assignment after objective selection. The [allocation map](author-notes.md#knowledge-allocation) keeps relevant facts available through ordinary discussion rather than exact-question traps.

This is file organisation, not implemented access control. Actual delivery still requires approved content, recipient mapping and server-side participant projections. Author material and unassigned cards must not be bundled into a common download.

## Revision focus

The shared profile no longer gives all players the VPN/EDR/patching/backup weakness list, finance controls or statutory notice clocks. Specialists have the knowledge their jobs would supply. Role cards contain no selected attack, future inject, marking guide or model answer.

Written decision authority remains, but practice has friction: a November 2024 duty card with an obsolete MSP number, an agreed crisis chat group never created, an unrehearsed offline log template and Clara's unused bank token. Imran has no named internal deputy, and Clara's combined responsibilities are deliberate. These facts do not script anyone's absence or a token failure.

Server backups and cloud/SaaS retention are now explicitly different. No independent recovery job covers Exchange, ProjectHub, OneDrive, Finance Books or PayrollVault; provider-native recoverability is unvalidated rather than declared absent. Original fixture uncertainties remain historical evidence, not overwritten runtime facts.

## CSA adaptation

CSA's [IT-team toolkit](https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-resources-for-organisations/toolkits-for-it-teams/) and [March 2022 appendix](https://isomer-user-content.by.gov.sg/36/744568da-0801-4cb5-a2b2-f54615ceed10/Cybersecurity-Toolkit-for-IT-Team-Appendices.pdf) provide structural inspiration for inventories and later BIA/planning. Company content is original fiction, not a reproduced CSA organisation or certification claim. Current Singapore reporting/submission references are in author notes, not inferred from historical template language.

The [research note](../../research/technical-ttx-inputs-and-synthetic-pack.md) records other public resources and their limits. No real organisation records, contacts, identifiers or credentials are included.

## Next decision and maintenance

The baseline's OPEN-11 notes predate the reviewed five-position package. Follow [WORK](../../WORK.md#next-milestones) for current sequencing and [PROJECT](../../PROJECT.md) for approved scope. Collecting the sources does not approve new continuity targets, release the complete folder to players, or complete independent evaluation, branching or the final ten-position workflow.

The naming revision uses the user's reported batch no-match result for all ten replacements. Individual query details were not supplied; this is not independent registry verification, registration or guaranteed uniqueness. The screening record preserves the previous labels.

Change the master register first, reconcile every affected shared/role document, and update the revision/date. Keep the frozen calendar unless project dates are deliberately changed. Do not silently repair deliberate gaps or change the [software fixture](../../../src/server/fixture.ts). See [PROJECT](../../PROJECT.md#organisation-foundation) for scope and [WORK](../../WORK.md#task-004---synthetic-organisation-foundation) for execution evidence.

## Change record

| Revision | Change | State |
| --- | --- | --- |
| `org-draft-0.1` / 27 September 2026 | Initial brief/register with stable IDs and provenance | Structure accepted; realism gaps identified |
| `org-draft-0.2` / 28 September 2026 | Named company; expanded operational context and player/author separation | Second review identified over-disclosure and over-preparedness |
| `org-draft-0.3` / 28 September 2026 | Read-first/shared/role-specific knowledge; deliberate friction and SaaS recovery gap; mixed-style names; circular recheck | Content draft; OPEN-11 pending; no runtime release |
| Source consolidation / 6 November 2026 | Added byte-identical diagram, BCP and continuity-review copies; indexed inputs and retrieval | File organisation only; source editions, proposals and live records unchanged |
