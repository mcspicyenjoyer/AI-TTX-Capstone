# Project baseline

Status: working implementation-planning scope, updated 18 September 2026 for the confirmed five-inject first draft and two-attempt coaching rules. Based on the supplied Form B and existing architecture, with the user's task allocation and clarifications below. Formal supervisor approval and organisation technology permissions are not inferred.

## Problem and users
Resource-constrained SMEs need help converting systems and continuity context into a bounded technical tabletop exercise. The product assists preparation, facilitated play and review. Users are a planner/profile reviewer, facilitator, participant teams and an exercise reviewer. A person may hold multiple functions, but participant access remains distinct from facilitator authority.

## Ownership and exercise scope

The work is divided by exercise type, not by frontend versus backend (ADR-012 in [DECISIONS](DECISIONS.md)):

| Owner | Assigned scope |
| --- | --- |
| User | Technical exercise, including both frontend and backend, their integration and verification. |
| Other worker | Operational exercise; no longer assigned the technical application's frontend. |

This repository's requirements and acceptance criteria cover the technical exercise. It remains a discussion-based tabletop exercise about systems, dependencies and technical response/recovery decisions, not a cyber range or live execution environment. The ownership change does not remove the continuity context, functional roles or human approval controls already in scope.

Operational-exercise requirements, deliverables and implementation arrangements are not defined here. A shared scenario, codebase, data model or integration between the two workstreams must be agreed explicitly before dependent work; this change does not commit either workstream to a combined platform. See [architecture](architecture.md#exercise-based-implementation-ownership) for the technical application's internal boundaries and [WORK](WORK.md#technical-exercise-checkpoints) for execution status.

## Target MVP and first slice
Longer-term target: one representative SME and incident scenario, a validated organisation profile, 10–15 MSEL entries, 3–4 functional roles and three bounded decision points with approved follow-ups. Inputs eventually include one agreed diagram format, optional text-based continuity documents and guided answers. Outputs include a human-reviewed draft after-action report and improvement actions. This fuller target is retained, not a requirement to generate 10-15 entries for the first exercise draft.

First slice: manually prepared synthetic profile → confirm revision → review one prepared inject → approve and release → participant views and responds → retrieve durable activity after restart. This requires no AI, document parsing or external delivery. Finishing it does not complete the target MVP.

### First exercise draft

Confirmed under ADR-013 in [DECISIONS](DECISIONS.md): after the engineering first slice, prepare exactly five injects for one bounded exercise. Technical and operational tracks remain separate; this repository implements the technical track. Adaptive feedback and guidance are in this first draft; decision-dependent scenario branching is deferred to later work.

- Use synthetic organisational context and exercise content throughout development, demonstration and evaluation, not just initially. Published reference guidance can inform the exercise; real organisation uploads are outside this prototype's scope.
- Establish the synthetic SOC/MSSP operating model at the start, including which functions are internal or outsourced, and bind RACI responsibilities to the responding users/teams before preparing role-specific injects.
- Allow at most two agreed answer submissions per inject: an initial answer and one coached retry. A sufficient first answer resolves the inject without requiring a second. An insufficient second answer is recorded as an unresolved gap/finding, with no third answer or forced pass.
- Completion means all five injects have a recorded final outcome, which may include unresolved findings. Such findings do not prevent proceeding through the remaining prepared injects under the existing facilitator approval controls; unanswered injects are not automatically complete.
- Preserve both answers, guidance, criterion-level assessments and final outcomes for the reviewed AAR. Distinguish unaided success, coached success and unresolved gaps, using the detailed AAR template when supplied.

The technical RACI, assessment rubric/thresholds and detailed AAR template remain pending user inputs. Do not invent their contents or generate the technical exercise package before they are reviewed. These content dependencies do not replace the scaffold's environment decisions or the synthetic deterministic first slice. See [WORK](WORK.md#task-003---five-inject-coached-first-draft) for the later draft milestone.

## Requirements
| ID | Outcome | Stage |
| --- | --- | --- |
| REQ-001 | Confirm a versioned organisation profile; preserve facts, assumptions, conflicts and unknowns distinctly. | Synthetic first slice; extraction later |
| REQ-002 | Bind content and run to confirmed profile and reviewed definition revisions. | First slice |
| REQ-003 | Require facilitator approval for exact content, recipients and current run preconditions; edits invalidate approval. | First slice |
| REQ-004 | Persist releases, agreed responses and facilitator actions in an ordered activity record. | First slice |
| REQ-005 | Expose only authorised released content to participants; exclude rubrics, future branches and private role data. | First slice |
| REQ-006 | Reject releases while paused/completed; prevent retry duplicates; recover durably with explicit resume. | First slice |
| REQ-007 | AI proposes within approved scope, can abstain/fail and never bypasses human control; manual play remains possible. | AI integration |
| REQ-008 | Supported intake preserves source locators and surfaces missing/conflicting information for review. | Intake |
| REQ-009 | Validate package counts, roles, bounded decisions, artefact consistency and approved alternatives. | Package generation |
| REQ-010 | Findings distinguish observation from interpretation, cite activity evidence and separate unaided, coached and unresolved outcomes; use the reviewed AAR template and review actions. | Review output |
| REQ-011 | Use synthetic exercise data throughout the prototype, server-held credentials and approved external processing. | All stages |
| REQ-012 | Maintain reproducible verification, controlled evaluation and school-safe handover evidence. | All stages |
| REQ-013 | Confirm the SOC/MSSP operating model and bind RACI task responsibilities to responding users/teams before preparing role-specific injects. | First exercise draft |
| REQ-014 | Limit each inject to two answer submissions; provide one coached retry after an insufficient first answer, then record an unresolved finding if the second remains insufficient. | First exercise draft |
| REQ-015 | Deliver five prepared injects in one track with adaptive coaching; complete with a recorded outcome for each, including unresolved findings, without requiring scenario branching. | First exercise draft |

QUALITY owns verification criteria; WORK owns task acceptance and actual results. Executable contracts, once implemented, own field-level schemas.

## Exclusions
No cyber range, exploit/malware execution, production-system changes, autonomous delivery, certification/audit judgement or proof of real recovery against RTO/RPO. No production multi-tenancy, high availability, enterprise SSO, universal input support, unrestricted scenarios or reliable OCR in the MVP. Web entry captures agreed participant decisions; Slack/Discord and participant chatbots are deferred. Do not import CII-specific duties from the separate RACI spreadsheet into this SME product.

## Environment and open questions
| Area | Confirmed | Open before dependent work |
| --- | --- | --- |
| Repository | Existing Git repository in OneDrive; initially only README tracked. | Review untracked user/reference material before staging. |
| Current machine | Windows; PowerShell 7.6 supplied by session; Node 24.20.0 and npm 11.19.0 executed on 15 September. | Approved work-machine runtime and package policy. Availability is not permission. |
| Stack | Form B names Node.js; existing proposal recommends TypeScript, React, Fastify, JSON Schema and SQLite. | Exact packages, versions and environment compatibility; nothing installed. |
| Delivery | Browser workflow; synthetic local demonstration first. | Participant identity/access model; approved LAN/TLS route if multiple devices are used. |
| Storage | Approvals, releases, responses and activity survive restart. Source is synchronised. | Approved non-synchronised data directory outside Git; backup/restore method. |
| AI | User intends to use their existing OpenAI subscription; planning a local synthetic Codex integration experiment. The supplied brief prefers approved internal services. | Verify subscription-backed integration, available model, limits and isolation. Personal subscription use does not establish organisation data or deployment permission. No live integration exists; first slice remains independent of AI. |
| Intake | Synthetic network/context and optional text-bearing continuity inputs throughout the prototype; SOC/MSSP setup precedes role-specific drafting. | draw.io XML and PDF/DOCX are proposals; confirm subset, bounds and parsers. |
| Content/evaluation | Five injects for the first draft; two answers per inject; adaptive coaching; unresolved findings are valid final outcomes. The fuller target remains separate. | User-supplied technical RACI, reviewed rubric/thresholds, risk/threat references and detailed AAR template. Alternative-payload counting applies only to later branching work. |

Open questions block their dependent stages, not baseline documentation.

## Terminology and source precedence
MSEL means Master Scenario Events List. An inject is versioned information for defined recipients. Package approval accepts a definition and its branches; release approval permits specific content and recipients in a run state. A release means committed inbox availability; viewing is a separate event. AAR means after-action report. RTO/RPO are supplied discussion targets, not measured recovery results.

This file is the working scope authority; DECISIONS records acceptance and WORK records implementation status. Form B is the supplied product brief. The existing architecture, illustration and research include proposals and historical claims. Resolve discrepancies explicitly. Verify source versions before implementing standards-derived exercise rules; this baseline does not assert compliance.
