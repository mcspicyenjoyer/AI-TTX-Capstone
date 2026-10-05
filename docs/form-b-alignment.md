# Form B alignment

Reconciled on 5 October 2026 with the laptop's 29 September source review and the implementation branch. Dates/timeline are audit metadata, not delivery authority. Form B is the assessment authority at the user's explicit direction. [PROJECT](PROJECT.md) owns the requirements, [architecture](architecture.md) the design, [DECISIONS](DECISIONS.md#adr-021---form-b-first-with-a-parallel-operational-skeleton) the reconciliation, [QUALITY](QUALITY.md) the acceptance evidence and [WORK](WORK.md) execution status. This matrix records coverage; it is not evidence that the planned capabilities exist.

## Source and authorised interpretation

- Source: `references/GPT_ICT4011_Form_B_AI_Assisted_TTX.docx` in the primary checkout, supplied locally in the ignored references folder. Source title: *AI-Assisted Technical TTX-in-a-Box*. The neutral product name remains TTX Platform.
- SHA-256 of the reviewed source: `df83c3f0d4f5daeca5b3eb72e778f75627a94aecbee839be92b1972416a462ea`.
- Reviewed the complete ordered body/table text, including Project Overview, all twelve Project Objectives, Industry Relevancy, Project Scope, all deliverables and training/review expectations. No tracked changes were present. The source was not edited; personal/contact details and administrative comments are not reproduced here.
- The user explicitly requests five injects as an intermediate checkpoint, then ten for final acceptance within Form B's 10-15 range. Three key decision points, 3-4 functional roles and all other workflow objectives remain. This is a delivery sequence, not assessor approval to reduce final scope. A deterministic engineering run does not complete the generated five-inject milestone.
- The platform includes both technical and operational discussion exercises. The user owns the technical contribution; the other worker owns operational exercises. Form B's exclusion of operation-based testing does not exclude that operational workstream.
- The prototype continues to use synthetic inputs. This is within Form B's synthetic-or-redacted testing scope and does not authorise live organisation uploads or external processing.

## Objective coverage

Requirement IDs refer to [PROJECT's requirements](PROJECT.md#requirements); work IDs refer to [WORK](WORK.md). All statuses below describe the repository at this review, not expected future success.

| Form B objective | Repository requirement | Delivery and current evidence |
| --- | --- | --- |
| 1. Use case, roles, functional/non-functional requirements, constraints and acceptance | REQ-001-007/011/013/016/017/025 | Planning baseline exists; detailed input formats and content criteria remain open; the extra readiness engine is deferred. TASK-000/009; no claim of full acceptance. |
| 2. Translate CTM, ENISA and NIST guidance into exercise/system requirements | REQ-009/010/012/016/017 | Architecture/research mapping exists. TASK-009 must preserve source/version rationale and limits in the report; this is not certification. |
| 3. Input specification and structured organisation/source schema | REQ-001/008/021 | Current contracts cover source-linked statements and confirmation, not the full typed systems/dependencies/recovery model. TASK-006 required. |
| 4. Agreed diagram format and text-based continuity ingestion, with guided questions | REQ-008/021 | No parser/upload/questionnaire implementation. TASK-006 required; a manually seeded profile does not meet this objective. |
| 5. Reconciliation and user validation before generation | REQ-001/002/022 | Evidence display, uncertainty labels and exact-revision confirmation exist. Candidate correction/rejection/addition and extraction reconciliation do not. TASK-006 required. |
| 6. Controlled threat selection and pathway mapping to impact/recovery | REQ-023 | Not implemented. TASK-007 must connect the selected threat to the confirmed environment, not merely rename a generic scenario. |
| 7. Generated reviewed package, roles, decision points, injects, artefacts and criteria | REQ-002/003/009/015/024 | Not implemented. TASK-007/003 use five initial positions, then ten for final acceptance; 3-4 roles and three decision points remain. |
| 8. Web play, response capture and facilitator controls | REQ-003-007 | Profile confirmation, one-inject release, evidence-backed Step 0, pause/resume/recovery and participant filtering exist. TASK-001D/E and TASK-003 must implement approve/edit/reject/override/pause/manual continuation and role-appropriate delivery. |
| 9. AI response interpretation and approved follow-up recommendation | REQ-007/018 | Not implemented. TASK-002/008/003 must preserve human authority and ambiguous-response fallback. Coaching is an additional feature, not this objective's substitute. |
| 10. Timeline, responses, decisions, observations, draft AAR and improvement actions | REQ-004/010 | Profile confirmation and exercise preparation/release/lifecycle activity exist; responses and observations do not. TASK-001D/E and TASK-003 supply exercise evidence; TASK-008 supplies reviewed AAR/improvement outputs. |
| 11. Controlled evaluation of extraction, grounding, consistency, interpretation, branches, controls, fallback and usefulness | REQ-012 | Profile and release/Step 0/access/recovery control tests exist. TASK-006-009 must supply known-answer inputs, independent human review, adverse cases and results for the full workflow. |
| 12. Prototype, source, documentation, guide, tests, handover, demonstration, report and presentation | REQ-025 | Partial source/planning documentation and synthetic company content exist. TASK-009 owns complete handover evidence; neither planning nor a five-inject fixture completes it. |

## Deliverable coverage

The source's Project Outputs and Deliverables table defines the following outputs. This table assigns them to work items without treating a document describing a feature as its implementation.

| Form B deliverable | Work and remaining evidence |
| --- | --- |
| Requirements, Scope, and Data-Handling Specification | TASK-000/006/009; current PROJECT/QUALITY/architecture plus reviewed format limits, data/provider decisions and acceptance criteria. |
| Synthetic SME Reference Pack | TASK-004/006; existing company context must be extended with the agreed network diagram, selected continuity input, guided answers and expected extracted facts. |
| Organisation Profile Schema and Source Model | TASK-006; full typed entities/relationships and source model beyond current statement fixtures. |
| Input Ingestion and Extraction Module | TASK-006; implemented agreed-format parsing and known-answer accuracy/source checks. |
| Reconciliation and User-Validation Workflow | TASK-006; working review/correction flow, not just confirmation of a seeded profile. |
| Threat Library and Pathway Mapping Module | TASK-007; reviewed pattern provenance and links from technical events to service/recovery consequences. |
| TTX Package Generator | TASK-007; grounded package generated from confirmed inputs, at five positions first, then ten for final acceptance. |
| Role-Specific Inject and Artefact Set | TASK-007/003; reviewed synthetic evidence mapped to scenario, recipients, expected actions and evaluation criteria. |
| Web-Based Exercise and Facilitator Interface | TASK-001C/D/E/003; working authority, editing, release, response and lifecycle controls. |
| AI Response Interpretation and Branch Recommendation Module | TASK-002/008; grounded interpretation, approved choices, abstention and recorded human decisions. |
| Exercise Record, AAR, and Improvement-Action Output | TASK-008; generated draft from recorded activity, with human review and no invented actions. |
| Validation and Testing Report | TASK-009; methods, known answers, human comparisons, failures, corrections and limitations across the required workflow. |
| User Guide and Handover Package | TASK-009; source/configuration, schemas, prompt/instruction versions, samples, operation and troubleshooting. |
| Final Demonstration, Capstone Report, and Presentation | TASK-009; synthetic input-to-exercise-to-review demonstration, contribution and evidence, with five-inject progress distinguished from ten-entry final acceptance. |

## Reconciled differences

1. ADR-018's prepared-package approach displaced objectives 3-7. Prepared fixtures remain for deterministic tests, manual comparison and fallback; they cannot replace the input-driven generator.
2. Five injects are the intermediate checkpoint, followed by ten. A deterministic five-inject run proves controls only; intake, pathway mapping, generation, three decision points and 3-4 roles remain required before claiming the integrated Form B workflow.
3. Targeted coaching, coached retries and the additional readiness engine are deferred until Form B is implemented and verified. Core interpretation and reviewed branches remain required, without forced passes.
4. Optional continuity upload means a particular exercise may omit a BCP/BIA/DRP, using guided questions to fill gaps. It does not remove the required supported text-document ingestion capability. A guided-only route cannot stand in for the assessed diagram-ingestion demonstration.
5. Operational exercises remain in platform scope under separate ownership. The bounded operational development skeleton is implemented under TASK-005 and ADR-023 as the explicit parallel-work exception. It is an isolated read/validation path, not a complete operational exercise or mixed-track run.

The contribution to demonstrate is organisation-specific preparation grounded in validated inputs, followed by bounded adaptive play and evidence-linked improvement. Naming AI, adding branches to an unchanged public pack, or producing a generic report does not establish that contribution. [QUALITY](QUALITY.md#form-b-workflow-acceptance) defines the planned checks.
