# Project baseline

Status: assessment baseline realigned to Form B on 29 September 2026 under ADR-021. The user explicitly identifies Form B as the assessment authority, with one requested delivery exception: five MSEL injects first instead of Form B's 10-15 entries. Document ingestion, reconciliation, controlled threat-pathway mapping and generation of an organisation-specific exercise are required outcomes for that first delivery. ADR-018's predefined-package substitution is superseded. Coaching is supplementary to Form B. Only the profile scaffold is implemented; [WORK](WORK.md) records actual results.

## Assessment authority

The supplied [Form B](../references/GPT_ICT4011_Form_B_AI_Assisted_TTX.docx), especially Project Objectives 1-12, Project Scope and Project Outputs and Deliverables, governs the assessed technical contribution. This document translates that brief into repository requirements; it cannot silently reduce them. [Form B alignment](form-b-alignment.md) records source identity, objective/deliverable coverage and remaining work. Original reference material stays local and ignored by Git.

The user explicitly retains five MSEL injects for the first delivery. Treat this as a recorded exception to the source's 10-15-entry count, not permission to bypass ingestion, generation or the other objectives. Three key decision points and 3-4 functional roles remain. Expansion to the original count is deferred and is not an acceptance gate for this first delivery; this repository records the user's instruction, not an independently verified amendment by the assessors.

Apply the user's explicit ownership clarification alongside Form B: operational exercises are in scope for the overall platform and are owned by the other worker. The user's assessed contribution is the technical workstream, including its frontend, backend and verification. Form B's exclusion of operation-based exercises concerns live execution/testing, not the platform's discussion-based operational track. No particular exercise package, organisation technology permission or completed runtime capability is inferred from this reconciliation.

## Problem and users
Resource-constrained SMEs may have technical and continuity documents but lack the specialist time and expertise to turn them into meaningful cyber exercises and review findings. The technical workstream must convert an SME's network and continuity information into a source-linked, human-confirmed profile and an organisation-specific exercise. It supports selected Cyber Trust Mark exercise and improvement requirements, particularly B.21.4/B.21.5; it does not certify compliance. The AI-assisted TTX Platform encompasses separate technical and operational exercise tracks and assists preparation, facilitated play and review. Use "TTX Platform" for the product; "technical" identifies an exercise track, not the whole platform. Users are a planner/profile reviewer, facilitator, participant teams and an exercise reviewer. A person may hold multiple functions, but participant access remains distinct from facilitator authority.

## Ownership and exercise scope

The work is divided by exercise type, not by frontend versus backend (ADR-012, with product framing clarified by ADR-015 in [DECISIONS](DECISIONS.md)):

| Owner | Assigned scope |
| --- | --- |
| User | Technical exercise, including both frontend and backend, their integration and verification. |
| Other worker | Operational exercise; no longer assigned the technical application's frontend. |

This repository's current implementation requirements and acceptance criteria cover the technical workstream within that platform. This track remains a discussion-based tabletop exercise about systems, dependencies and technical response/recovery decisions, not a cyber range or live execution environment. The product naming correction does not remove the continuity context, functional roles or human approval controls already in scope.

Both workstreams are in scope for the overarching TTX Platform. Detailed operational-exercise requirements and acceptance evidence belong to the other worker's workstream; shared scenarios, code, data models and integration contracts still need agreement before dependent work. They must not be reassigned to the user or marked complete by this repository's technical tests. Neutral branding does not imply that the operational track, track selection or cross-track integration is implemented, nor does it permit mixed-track runs in the first draft. See [architecture](architecture.md#exercise-based-implementation-ownership) for implementation boundaries and [WORK](WORK.md#technical-exercise-checkpoints) for execution status.

## Target MVP and first slice
Required assessed proof of concept: one representative SME and one technical incident scenario, developed from one agreed network-diagram input format, optional text-based BCP/BIA/DRP inputs and guided questions. Implement candidate extraction, reconciliation and user confirmation before mapping a controlled threat pattern through the validated environment. The profile must cover systems, zones/connections, services, dependencies, roles, third parties, RTOs/RPOs, recovery priorities, exclusions and source references, with uncertainty kept explicit.

Generate a facilitator-reviewed package containing objectives, scope, scenario, five MSEL inject positions for the first delivery, 3-4 functional roles, three key decision points, role-specific injects, technical artefacts, expected actions, approved alternative branches, evaluation criteria and facilitator notes. During web-based play, interpret agreed actions, rationale and information requests; identify present/missing expected actions and recommend only approved follow-ups. Record facilitator decisions and exercise activity, then generate a draft AAR and improvement actions for human review. These capabilities are required deliverables, not an optional later expansion.

Form B's overview describes 10-15 injects and objective 7 specifies 10-15 MSEL entries; that source count remains recorded for later expansion. For the authorised first delivery, use five participant-facing MSEL positions with one released variant per position. Role-specific artefacts and unused alternatives do not increase that count. Known-answer synthetic inputs, controlled evaluation, source code, technical documentation, user guide, test report, handover, school-safe demonstration, capstone report and presentation remain part of completion.

First slice: manually prepared synthetic profile → confirm revision → review one prepared inject → approve and release → participant views and responds → retrieve durable activity after restart. This requires no AI, document parsing or external delivery. Finishing it does not complete the target MVP.

### First exercise draft

Retained under ADR-013/017 and the user's explicit count exception in ADR-021 in [DECISIONS](DECISIONS.md): the first delivery has five participant-facing MSEL inject positions. It must demonstrate the required input-to-exercise workflow; a manually authored five-inject package alone is insufficient. Coaching is a supplementary learning feature, not a Form B requirement or a prerequisite for completing the core workflow. Technical and operational tracks remain separate.

Prepared fixtures and curated incident templates remain useful for control tests, human comparison and manual fallback. The assessed package must be generated from the confirmed organisation profile and a reviewed threat pathway, with named systems, business services, dependencies and recovery context. Generation occurs during preparation; the resulting package and bounded branches are reviewed before play. This restores Form B objectives 3-7 without permitting unrestricted live generation. The [technical TTX research note](research/technical-ttx-inputs-and-synthetic-pack.md) retains useful input research; its predefined-package recommendation is superseded.

The five-position bound applies to the first delivery. The two-attempt coaching rules below apply when the retained supplementary coached mode is selected; Form B itself does not require that mode:

- Use synthetic organisational context and exercise content throughout development, demonstration and evaluation, including synthetic network and continuity documents representing the SME's own records. Form B permits synthetic or redacted inputs; the existing synthetic-only prototype restriction remains. Restoring ingestion does not authorise real organisation uploads.
- Establish the synthetic SOC/MSSP operating model at the start, including which functions are internal or outsourced, and bind RACI responsibilities to the responding users/teams before preparing role-specific injects.
- Allow at most two agreed answer submissions per inject: an initial answer and one coached retry. A sufficient first answer resolves the inject without requiring a second. An insufficient second answer is recorded as an unresolved gap/finding, with no third answer or forced pass.
- Completion means all five injects have a recorded final outcome, which may include unresolved findings. Such findings do not prevent proceeding through the remaining prepared injects under the existing facilitator approval controls; unanswered injects are not automatically complete.
- Preserve both answers, guidance, criterion-level assessments and final outcomes for the reviewed AAR. Distinguish first-attempt success on each inject, coached success and unresolved gaps, using the detailed AAR template when supplied. Earlier coaching may influence later first attempts; these results do not establish wholly unaided organisational readiness.

The technical RACI, evaluation criteria, coaching thresholds if used, and detailed AAR template remain pending review. Select the incident family, objectives and the three required decision points; review branch limits, eligibility rules and consequence/reconvergence content before package freeze. Do not invent approval of those inputs. Content dependencies do not remove the required ingestion/generation deliverables or block independent deterministic control work. See [WORK](WORK.md#task-003---five-inject-coached-first-draft) for the integrated first delivery and its separately scoped coaching feature.

### Bounded adaptive injects

Accepted for planning under ADR-017/021; not implemented. Participant decisions can change later scenario information and consequences while reviewed objectives, organisation context and package bounds remain fixed. The first delivery retains three key decision points within five MSEL inject positions. Form B's original 10-15-entry count is deferred under the user's explicit exception.

- Every permitted path must provide an opportunity to address the agreed objectives and reach exercise closure. The end goal is objective coverage and useful findings, not a predetermined successful containment or recovery.
- Review a small set of alternatives, their response conditions and objective mappings with the package. Branches return to planned exercise stages through variants consistent with the recorded history; reconvergence must not erase consequences or silently turn an unresolved action into a success.
- AI may propose an eligible next variant with evidence from the recorded participant response. The application validates package membership and run eligibility; the facilitator confirms the selection and approves the exact next inject before release. No new assets, objectives, branches or unreviewed payloads are introduced during play.
- Adaptive progression uses the team's recorded decision and the reviewed package conditions. AI summarises the decision and identifies expected actions present, missing or unclear; a score alone is not evidence of an action. Preserve any coaching separately when enabled. Ambiguous responses or unavailable AI require human review/manual selection of an eligible reviewed alternative, or a pause.
- Persist the selected path, rationale, supporting response references and relevant revisions for restart and the AAR. Completion and comparison follow the approved package and account for different paths and any coaching. Branching cannot silently add injects, exceed a configured retry budget or force a successful outcome.

### Exercise preparation and review flow

Accepted for planning under ADR-016 and aligned to Form B under ADR-021; not implemented. Adapt ENISA's initiation, design, preparation, execution, evaluation and moving-forward structure to the bounded synthetic TTX. Both product tracks are discussion-based; ENISA's operation-based exercise category does not define this platform's operational track.

1. Establish exercise purpose, one track, intended audience and initial scope before detailed exercise-specific intake. Refine objectives after reviewing the available context.
2. Ingest the agreed synthetic network-diagram format and any supplied supported text-based BCP/BIA/DRP. Extract candidate facts and relationships with source locators; use guided questions to complete missing context. Reuse reviewed profiles where appropriate, while retaining a demonstrable ingestion route for assessment. A track change must not overwrite organisation facts.
3. Review source-linked candidate information and targeted questions. Missing uploads do not by themselves mean that a plan or capability is absent. Preserve not supplied, unknown and confirmed absent as distinct meanings.
4. Confirm the profile revision and the exercise plan separately. Application-owned, versioned checks and recorded human decisions determine readiness for the selected objectives; profile confirmation and AI confidence alone do not establish readiness.
5. Map a controlled threat pattern through the validated systems/dependencies to business impact and recovery decisions, labelling assumptions. Generate the required package from that profile and pathway; check source grounding, artefact consistency and every permitted branch. Obtain facilitator package approval, brief participants and check run readiness before the first release.
6. Conduct the reviewed exercise through the web interface. Capture agreed actions, rationale and requests; AI interprets responses and recommends eligible approved follow-ups. The facilitator can approve, edit, reject, override, pause and continue manually; changed content requires renewed approval before release. Record outcomes and gather debrief feedback. Apply coaching/retry rules only when that supplementary mode is selected.
7. Draft the AAR from the recorded evidence, review it with a human, and assign improvement actions with owners, due dates and later closure evidence. Separate response/plan/capability findings from exercise-design limitations.

Guided-answer-only preparation may remain a supplementary/manual route; it does not satisfy the required network-diagram ingestion demonstration. Continuity-document upload is optional for an individual run, but the agreed text-based BCP/BIA/DRP ingestion capability must be implemented and evaluated. Unresolved essentials lead to an explicit choice: revise scope/objectives, approve labelled exercise assumptions where appropriate, or save and stop. Questioning needs a stopping rule; a question limit cannot automatically establish readiness. Exact context, package and run readiness criteria still await review.

Profile planning includes selected business services, assets/data, zones, connections, dependencies, ownership, third parties, business impact, RTO/RPO and recovery priorities. AI may propose critical-asset candidates; the reviewer confirms criticality. A complete enterprise inventory is not required, but the bounded network-diagram format and typed profile contract are required deliverables. Detailed fields and format limits remain to be specified.

### Organisation foundation

Authorised on 27 September 2026 under ADR-019 and expanded by the user's realism feedback on 28 September under ADR-020: use a CSA-structured, originally authored synthetic engineering-services company. Keep the named master register as authoring truth and provide a separate in-universe participant profile without repeated governance caveats. Include named people/vendors/customers/projects, hybrid work, engineering dependencies, finance/payroll/personal-data context, security posture and fictional company decision/communication authority. Keep real institutions and legal requirements accurately sourced, with name-check evidence and limitations in author notes. See the [draft package](organisation/example-sme-01/README.md). Individual authored details remain reviewable; authoring permission is not profile confirmation or exercise readiness.

The second realism review further separates a short common brief/reference from baseline role cards: specialist weaknesses, finance/privacy procedures and reporting clocks are not common player knowledge. Keep essential facts available through assigned roles and ordinary discussion; cards are not answer scripts or role-specific injects. Deliberately stale arrangements, concentrated responsibilities and the distinction between server backups and unvalidated native SaaS recovery belong in the canonical context. More varied replacement names require recorded registry screening; general-web results are not clearance.

This reusable context can be drafted before the detailed exercise inputs are settled. Fictional business authority and baseline role knowledge are not a completed exercise RACI or TTX approval/access permissions. The rubric, branch-content and AAR dependencies above remain. Next select the incident family and learning objectives (OPEN-11); that choice determines the necessary role detail, logical diagram and plan extracts, rather than completing every plan first. Preserve historical fixture uncertainties separately from current-fiction answers. Application/runtime state and contracts remain unchanged. [WORK](WORK.md#task-004---synthetic-organisation-foundation) owns completion and verification status.

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
| REQ-008 | Implement validated ingestion/extraction for one agreed network-diagram format and supported text-based BCP/BIA/DRP; preserve source locators and use guided questions for missing context. | Required assessed intake |
| REQ-009 | Validate the generated first-delivery package's five MSEL inject positions, 3-4 functional roles, three key decision points, role-specific injects/artefacts, expected actions, criteria and approved alternatives. Form B's 10-15-entry count is deferred by explicit user instruction. | Required first-delivery package |
| REQ-010 | Generate a draft AAR and improvement actions from recorded exercise/debrief evidence for human review. Distinguish observation, interpretation and unresolved gaps; retain coaching/attempt history when used and assign improvement ownership. | Required assessed review output |
| REQ-011 | Use synthetic exercise data throughout the prototype, server-held credentials and approved external processing. | All stages |
| REQ-012 | Evaluate extraction, grounding, consistency, interpretation, branch selection, controls, fallback and usefulness with known-answer/human-reviewed cases; report methods, errors and limitations. | Required assessed evaluation |
| REQ-013 | Confirm the SOC/MSSP operating model and bind RACI task responsibilities to responding users/teams before preparing role-specific injects. | First exercise draft |
| REQ-014 | When the supplementary coached mode is selected, permit an initial answer and one coached retry; an insufficient second answer remains an unresolved finding. | Supplementary coaching |
| REQ-015 | Deliver five MSEL inject positions in one track, one reviewed variant and a recorded outcome per position, including unresolved findings. Retain three key decision points; variants do not add positions. | First delivery count exception |
| REQ-016 | Establish purpose, track and initial scope before detailed exercise-specific intake; support source-linked documents, guided answers and reused profile revisions. | Intake/design |
| REQ-017 | Separate profile confirmation from objective-dependent context, package and run readiness; record the applicable revisions and human decisions. Detailed rules await the user's readiness specification. | Intake/package/run preparation |
| REQ-018 | Interpret agreed participant decisions, identify present/missing/unclear expected actions and recommend eligible approved branches at the package's decision points. Preserve objective coverage, bounds and continuity; require facilitator approval and retain response evidence. | Required assessed play |
| REQ-019 | Define the bounded input specification and typed source-linked profile for systems, zones/connections, services, dependencies, roles, third parties, RTO/RPO, recovery priorities and constraints. | Required assessed intake |
| REQ-020 | Implement reconciliation with confirm/correct/reject/add actions for candidate facts, missing fields, conflicts and assumptions before generation; revisions invalidate affected drafts. | Required assessed preparation |
| REQ-021 | Use a controlled threat library to map plausible entry points and affected systems to named business services, dependencies, impact and recovery decisions, with source support and labelled assumptions. | Required assessed design |
| REQ-022 | Generate the organisation-specific TTX package from the confirmed profile, reviewed threat pathway and exercise objectives. Keep provenance, constrain unsupported content, and require package approval before play. | Required assessed generation |
| REQ-023 | Deliver prototype/source, synthetic input reference pack, specifications, technical documentation, user guide, test results, handover, school-safe demonstration, capstone report and presentation. | Required assessed handover |

QUALITY owns verification criteria; WORK owns task acceptance and actual results. Executable contracts, once implemented, own field-level schemas. The [Form B matrix](form-b-alignment.md) maps all twelve objectives and deliverables to these requirements and work items. REQ-014 is supplementary; REQ-015 records the user's count exception. Neither removes the other Form B outcomes.

## Exclusions
No cyber range, exploit/malware execution, production-system changes, autonomous delivery, certification/audit judgement or proof of real recovery against RTO/RPO. No production multi-tenancy, high availability, enterprise SSO, universal input support, unrestricted scenarios or reliable OCR in the MVP. Web entry captures agreed participant decisions; Slack/Discord and participant chatbots are deferred. Do not import CII-specific duties from the separate RACI spreadsheet into this SME product.

## Environment and open questions
| Area | Confirmed | Open before dependent work |
| --- | --- | --- |
| Repository | Existing Git repository; current checkout is under the Windows Desktop. Source may be synchronised and must never hold live data. | Review untracked user/reference material before staging. |
| Current machine | Windows; PowerShell 7.6; Docker Desktop Linux engine. User requested Docker portability rather than per-laptop Node setup. | Git and a permitted Docker/Compose installation on each destination laptop; availability is not organisation permission. |
| Stack | Local scaffold: Node/TypeScript, npm, React, Fastify, JSON Schema and SQLite in one Docker application (ADR-006/014). | Later parsers/provider choices are still unapproved. Exact current package/image versions are recorded with the implementation. |
| Delivery | Localhost-only Docker publication and distinct server-validated demo identities (ADR-007/014). | Approved LAN/TLS route and stronger identity before multi-device or production use. |
| Storage | Durable profile confirmation starts the persistence work; run/release/response persistence is still required later. Docker named volume at /data resolves the local data location (ADR-014). | Separate protected backup/restore for moving saved progress between laptops; Git does not transfer volumes. |
| AI | User intends to use their existing OpenAI subscription; planning a local synthetic Codex integration experiment. The supplied brief prefers approved internal services. | Verify subscription-backed integration, available model, limits and isolation. Personal subscription use does not establish organisation data or deployment permission. No live integration exists; first slice remains independent of AI. |
| Intake | One agreed network-diagram format, optional text-based continuity inputs and guided questions are required capabilities. Purpose/track precede detailed intake; SOC/MSSP setup precedes role-specific drafting. | Readiness specification; typed profile/input contracts; format subset, bounds and parsers. draw.io XML and PDF/DOCX remain proposals, not selected formats. |
| Content/evaluation | Five MSEL inject positions first, with 3-4 functional roles and three key decision points. Form B's 10-15 count is deferred; coaching is supplementary and unresolved findings remain valid. | Incident family/objectives (OPEN-11), technical RACI, evaluation criteria, controlled threat sources, detailed AAR template and branch eligibility/consequences. Coaching thresholds are separate. |

Open questions block their dependent stages, not baseline documentation.

## Terminology and source precedence
MSEL means Master Scenario Events List. An inject is versioned information for defined recipients. Package approval accepts a definition and its branches; release approval permits specific content and recipients in a run state. A release means committed inbox availability; viewing is a separate event. AAR means after-action report. RTO/RPO are supplied discussion targets, not measured recovery results.

Form B is the assessment authority, with the user's explicit platform/ownership clarification. This file is its working requirements translation; DECISIONS records reconciliations and WORK records implementation status. ADR-021 supersedes contradictory earlier planning, including ADR-018. Historical diagrams, research and prior chats cannot remove assessed deliverables. Verify source versions before implementing standards-derived rules; this baseline does not assert compliance.
