# Form B alignment

Reviewed 29 September 2026. Form B is the assessment authority at the user's explicit direction. [PROJECT](PROJECT.md) owns the requirements, [architecture](architecture.md) the design, [DECISIONS](DECISIONS.md#adr-021---form-b-authority-and-five-inject-first-delivery) the reconciliation, [QUALITY](QUALITY.md) the acceptance evidence and [WORK](WORK.md) execution status. This matrix records coverage; it is not evidence that the planned capabilities exist.

## Source and authorised interpretation

- Source: [GPT_ICT4011_Form_B_AI_Assisted_TTX.docx](../references/GPT_ICT4011_Form_B_AI_Assisted_TTX.docx), supplied locally in the ignored references folder. Source title: *AI-Assisted Technical TTX-in-a-Box*. The neutral product name remains TTX Platform.
- SHA-256 of the reviewed source: `df83c3f0d4f5daeca5b3eb72e778f75627a94aecbee839be92b1972416a462ea`.
- Reviewed the complete ordered body/table text, including Project Overview, all twelve Project Objectives, Industry Relevancy, Project Scope, all deliverables and training/review expectations. No tracked changes were present. The source was not edited; personal/contact details and administrative comments are not reproduced here.
- The user explicitly requests five MSEL injects first, replacing the source's 10-15 count for this delivery only. Three key decision points, 3-4 functional roles and all other workflow objectives remain. Record this as a user-authorised deviation, not independently verified assessor approval; expansion to the original count is deferred.
- The platform includes both technical and operational discussion exercises. The user owns the technical contribution; the other worker owns operational exercises. Form B's exclusion of operation-based testing does not exclude that operational workstream.
- The prototype continues to use synthetic inputs. This is within Form B's synthetic-or-redacted testing scope and does not authorise live organisation uploads or external processing.

## Objective coverage

Requirement IDs refer to [PROJECT's requirements](PROJECT.md#requirements); work IDs refer to [WORK](WORK.md). All statuses below describe the repository at this review, not expected future success.

| Form B objective | Repository requirement | Delivery and current evidence |
| --- | --- | --- |
| 1. Use case, roles, functional/non-functional requirements, constraints and acceptance | REQ-001-007/011/013/016/017/023 | Planning baseline exists; detailed formats/readiness and content criteria remain open. TASK-000/008; no claim of full acceptance. |
| 2. Translate CTM, ENISA and NIST guidance into exercise/system requirements | REQ-009/010/012/016/017 | Architecture/research mapping exists. TASK-008 must preserve source/version rationale and limits in the report; this is not certification. |
| 3. Input specification and structured organisation/source schema | REQ-001/008/019 | Current contracts cover source-linked statements and confirmation, not the full typed systems/dependencies/recovery model. TASK-005 required. |
| 4. Agreed diagram format and text-based continuity ingestion, with guided questions | REQ-008/019 | No parser/upload/questionnaire implementation. TASK-005 required; a manually seeded profile does not meet this objective. |
| 5. Reconciliation and user validation before generation | REQ-001/002/020 | Evidence display, uncertainty labels and exact-revision confirmation exist. Candidate correction/rejection/addition and extraction reconciliation do not. TASK-005 required. |
| 6. Controlled threat selection and pathway mapping to impact/recovery | REQ-021 | Not implemented. TASK-006 must connect the selected threat to the confirmed environment, not merely rename a generic scenario. |
| 7. Generated reviewed package, roles, decision points, injects, artefacts and criteria | REQ-002/003/009/015/022 | Not implemented. TASK-006/003 use five MSEL positions under the explicit count exception; 3-4 roles and three decision points remain. |
| 8. Web play, response capture and facilitator controls | REQ-003-007 | Profile UI/access only. TASK-001C/D/E and TASK-003 must implement approve/edit/reject/override/pause/manual continuation and role-appropriate delivery. |
| 9. AI response interpretation and approved follow-up recommendation | REQ-007/018 | Not implemented. TASK-002/007/003 must preserve human authority and ambiguous-response fallback. Coaching is an additional feature, not this objective's substitute. |
| 10. Timeline, responses, decisions, observations, draft AAR and improvement actions | REQ-004/010 | Only profile-confirmation activity exists. TASK-001D/007/003 required for exercise evidence and reviewed outputs. |
| 11. Controlled evaluation of extraction, grounding, consistency, interpretation, branches, controls, fallback and usefulness | REQ-012 | Profile control tests exist. TASK-005-008 must supply known-answer inputs, independent human review, adverse cases and results for the full workflow. |
| 12. Prototype, source, documentation, guide, tests, handover, demonstration, report and presentation | REQ-023 | Partial source/planning documentation and synthetic company content exist. TASK-008 owns complete handover evidence; neither planning nor a five-inject fixture completes it. |

## Deliverable coverage

The source's Project Outputs and Deliverables table defines the following outputs. This table assigns them to work items without treating a document describing a feature as its implementation.

| Form B deliverable | Work and remaining evidence |
| --- | --- |
| Requirements, Scope, and Data-Handling Specification | TASK-000/005/008; current PROJECT/QUALITY/architecture plus reviewed format limits, data/provider decisions and acceptance criteria. |
| Synthetic SME Reference Pack | TASK-004/005; existing company context must be extended with the agreed network diagram, selected continuity input, guided answers and expected extracted facts. |
| Organisation Profile Schema and Source Model | TASK-005; full typed entities/relationships and source model beyond current statement fixtures. |
| Input Ingestion and Extraction Module | TASK-005; implemented agreed-format parsing and known-answer accuracy/source checks. |
| Reconciliation and User-Validation Workflow | TASK-005; working review/correction flow, not just confirmation of a seeded profile. |
| Threat Library and Pathway Mapping Module | TASK-006; reviewed pattern provenance and links from technical events to service/recovery consequences. |
| TTX Package Generator | TASK-006; grounded package generated from confirmed inputs, with the five-position exception recorded. |
| Role-Specific Inject and Artefact Set | TASK-006/003; reviewed synthetic evidence mapped to scenario, recipients, expected actions and evaluation criteria. |
| Web-Based Exercise and Facilitator Interface | TASK-001C/D/E/003; working authority, editing, release, response and lifecycle controls. |
| AI Response Interpretation and Branch Recommendation Module | TASK-002/007; grounded interpretation, approved choices, abstention and recorded human decisions. |
| Exercise Record, AAR, and Improvement-Action Output | TASK-007; generated draft from recorded activity, with human review and no invented actions. |
| Validation and Testing Report | TASK-008; methods, known answers, human comparisons, failures, corrections and limitations across the required workflow. |
| User Guide and Handover Package | TASK-008; source/configuration, schemas, prompt/instruction versions, samples, operation and troubleshooting. |
| Final Demonstration, Capstone Report, and Presentation | TASK-008; synthetic input-to-exercise-to-review demonstration, contribution and evidence, with the count deviation disclosed. |

## Reconciled differences

1. ADR-018's prepared-package approach displaced objectives 3-7. Prepared fixtures remain for deterministic tests, manual comparison and fallback; they cannot replace the input-driven generator.
2. The first delivery remains five injects at the user's explicit request. It still includes ingestion, pathway mapping, generation, three decision points and 3-4 functional roles. The source's 10-15 count is a recorded deferred expansion, not a hidden current acceptance gate.
3. Targeted coaching and a coached retry are retained supplementary scope. The core must interpret responses and identify missing expected actions without requiring the team to be coached into a pass. Report coaching separately when used.
4. Optional continuity upload means a particular exercise may omit a BCP/BIA/DRP, using guided questions to fill gaps. It does not remove the required supported text-document ingestion capability. A guided-only route cannot stand in for the assessed diagram-ingestion demonstration.
5. Operational exercises remain in platform scope under separate ownership. Detailed cross-track integration is pending agreement; no operational feature is claimed implemented here.

The contribution to demonstrate is organisation-specific preparation grounded in validated inputs, followed by bounded adaptive play and evidence-linked improvement. Naming AI, adding branches to an unchanged public pack, or producing a generic report does not establish that contribution. [QUALITY](QUALITY.md#form-b-workflow-acceptance) defines the planned checks.
