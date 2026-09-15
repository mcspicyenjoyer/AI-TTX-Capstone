# Project baseline

Status: working implementation-planning scope, 15 September 2026. Based on the supplied Form B and existing architecture. The user authorised this architectural setup; formal supervisor approval and organisation technology permissions are not inferred.

## Problem and users
Resource-constrained SMEs need help converting systems and continuity context into a bounded technical tabletop exercise. The product assists preparation, facilitated play and review. Users are a planner/profile reviewer, facilitator, participant teams and an exercise reviewer. A person may hold multiple functions, but participant access remains distinct from facilitator authority.

## Target MVP and first slice
Target: one representative SME and incident scenario, a validated organisation profile, 10–15 MSEL entries, 3–4 functional roles and three bounded decision points with approved follow-ups. Inputs eventually include one agreed diagram format, optional text-based continuity documents and guided answers. Outputs include a human-reviewed draft after-action report and improvement actions.

First slice: manually prepared synthetic profile → confirm revision → review one prepared inject → approve and release → participant views and responds → retrieve durable activity after restart. This requires no AI, document parsing or external delivery. Finishing it does not complete the target MVP.

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
| REQ-010 | Findings distinguish observation from interpretation and cite activity evidence; actions require review. | Review output |
| REQ-011 | Use permitted data, server-held credentials and approved external processing. | All stages |
| REQ-012 | Maintain reproducible verification, controlled evaluation and school-safe handover evidence. | All stages |

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
| Intake | One diagram format and optional text-bearing continuity inputs. | draw.io XML and PDF/DOCX are proposals; confirm subset, bounds and parsers. |
| Content/evaluation | One representative synthetic SME and bounded scenario. | Reviewed fixture/rubric, acceptance thresholds and counting of alternative payloads. |

Open questions block their dependent stages, not baseline documentation.

## Terminology and source precedence
MSEL means Master Scenario Events List. An inject is versioned information for defined recipients. Package approval accepts a definition and its branches; release approval permits specific content and recipients in a run state. A release means committed inbox availability; viewing is a separate event. AAR means after-action report. RTO/RPO are supplied discussion targets, not measured recovery results.

This file is the working scope authority; DECISIONS records acceptance and WORK records implementation status. Form B is the supplied product brief. The existing architecture, illustration and research include proposals and historical claims. Resolve discrepancies explicitly. Verify source versions before implementing standards-derived exercise rules; this baseline does not assert compliance.
