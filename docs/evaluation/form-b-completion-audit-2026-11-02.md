# Form B completion audit

Audit date: 2 November 2026, Singapore time. Source baseline: `975c499e1c4828f5995adc31f174614fb59db19f` on `main`.

## Conclusion

The project is a working, substantially tested local prototype with a bounded five-position technical exercise workflow. It is no longer just an architecture, an intake tool or a one-inject demonstration. It has source intake, profile reconciliation, constrained profile-grounded generation, three-role facilitated play, AI response interpretation, immutable exercise reporting and an evidence-linked AAR draft/review workflow.

It is **not complete against Form B**. The decisive gaps are approved response-dependent branches and branch recommendation; a generated and reviewed ten-position package with adequate technical evidence; verification of that expanded workflow through reporting; independent human quality/usefulness evaluation; and the complete reference, demonstration and handover package. The existing live AAR is last recorded as awaiting human acceptance.

The most accurate stage description is **five-position prototype implemented, adaptive final workflow and assessment evidence unfinished**. A completion percentage would hide the fact that some small-looking missing functions are central assessed outcomes. Test count, code volume, SQLite version and number of commits are not a denominator for completion.

This is an audit, not approval to implement branches, expand a live exercise, change a confirmed profile, start a worker, spend a model allowance, rebuild the preview or publish anything. Requirements remain in [PROJECT](../PROJECT.md); design in [architecture](../architecture.md); decisions in [DECISIONS](../DECISIONS.md); execution status in [WORK](../WORK.md).

## Authority and evidence

The local `references/GPT_ICT4011_Form_B_AI_Assisted_TTX.docx` was read directly, including the overview, twelve objectives, scope, fourteen deliverables and review/training expectations. Its SHA-256 was recomputed:

`df83c3f0d4f5daeca5b3eb72e778f75627a94aecbee839be92b1972416a462ea`

It matches PROJECT and the [existing Form B mapping](../form-b-alignment.md). No tracked insertions/deletions were found in the document body. The brief remains local and ignored; personal and administrative details are not reproduced here.

Form B's completion target is one representative SME and one selected technical scenario, 10-15 MSEL entries, 3-4 functional roles, three key decision points, reviewed branches, facilitated adaptive play and evidence-linked review. The user's authorised sequence is five first, then ten. The operational development skeleton is a separate authorised parallel-work exception. Neither exception removes final assessed outcomes.

Evidence labels used below:

- **Verified now:** checked against this checkout or freshly executed during this audit.
- **Recorded trial:** supported by committed dated progress/evaluation records, not re-executed or independently re-read from the private live database during this audit.
- **Implemented bounded:** code and relevant tests exist, but the label applies only to the stated prototype boundary, not final assessor acceptance.
- **Partial:** a required part exists, but an explicit assessed component or acceptance evidence is missing.
- **Not implemented:** design or a reserved field exists without the required runtime behaviour.

All 193 tracked files at the source baseline are assigned to a responsibility and Form B coverage in the inventory below. This is an inventory-complete workflow audit, not a claim of an exhaustive security or line-by-line correctness review. The core contracts, services, validators, composition, test coverage and project records were inspected. Historical drawings were classified from their provenance and current documentation, not re-certified as current UI designs. Ignored dependencies/build output are not deliverables; private runtime data was not opened or bundled.

## Repository and runtime state

| Item | State at audit |
| --- | --- |
| Primary checkout | Clean at entry; `main` at `975c499`, latest source commit dated 29 October 2026. |
| Remote | A fresh read-only `git ls-remote --heads origin main` returned the same full hash. This establishes equality before the audit documentation checkpoint, not permission to push it. |
| Files | 193 tracked: 12 contracts, 61 server files, 24 UI files, 17 top-level test/fixture files, 12 browser test/fixture files, 6 scripts, 5 evaluation data files, 35 files under `docs`, and 21 root files. |
| Application | React/TypeScript browser UI; Fastify API; TypeBox/Ajv contracts; one SQLite store with additive migrations through v11; Docker/Compose local packaging. |
| Preview | `ai-ttx-intake-preview-app-1` is stopped, exit code 255. Its image is `27a33e63...`, matching the image recorded for the `5a568c2` rebuild. The exit code alone does not establish an application defect or its cause. |
| Preview freshness | WORK records that the last preview rebuild predates `f090c07` and `975c499`. It therefore must not be presented as a running demonstration of the latest source. No restart, rebuild or migration was performed in this audit. |
| Live exercise state | Last committed record: frozen `package-15`, completed five-position AI-player rehearsal, five reviewed interpretations, one fixed report, valid but unaccepted AAR, interpretation usage 20/30 and AAR usage 2/3. These are recorded trial facts, not a fresh live-database inspection. |
| Other worktrees | `10f9` is clean at old `62cd37f`; `2777` is detached at that same old commit with nine modified tracked documents and two untracked continuity documents. They were not merged or edited. |
| External data | The real diagram, target binding, database, source/review artifacts and model attempt records are not all in Git. The untracked continuity plan in `2777` is a material reproducibility dependency, not a published deliverable. |

### Fresh checks

- `npm run check`: **passed**, including formatting, ESLint, TypeScript, **204/204 deterministic tests**, server compilation and Vite production build. No skipped, cancelled or TODO tests were reported by the deterministic runner.
- `npm run test:browser`: **35/35 passed in 3.4 minutes**, using one worker and disposable test servers/databases. Coverage includes desktop/mobile workflows, recipient isolation, exact retries, unsaved edits, manual fallback and actual test-server restart. Generation screenshots at 1440/390 pixels, an AAR mobile view and a desktop record view were also inspected; no incoherent overlap was observed in those samples.
- Form B hash: matched. Git source/remote equality: matched before documentation changes.
- Ordinary checks used isolated synthetic test data and fake providers. No live AI request, external exercise delivery or live profile/package/run mutation was made.

The 29 October WORK record additionally reports Linux Docker verification, 35 browser cases, 49/49 generation guard removals and 17/17 AAR/debrief guard removals detected. Docker verification and those mutation suites were **not rerun in this audit**. They remain historical, targeted evidence, not exhaustive security or semantic coverage. No new dependency-advisory audit or whole-history secrets audit was performed.

The audit changes only this report and a pointer/status note in WORK. Runtime code, approved content, evaluation labels and historical source records are unchanged. The local checkpoint records the audit; publication is not part of this request.

## Twelve objective assessment

The required outcomes are defined by Form B's numbered Project Objectives, not by the number of repository tasks marked complete. The table summarises coverage without creating new scope.

| Form B | Current assessment | Concrete repository evidence | What prevents final closure |
| --- | --- | --- | --- |
| FB-01 use case and requirements | Substantial specification baseline | PROJECT defines users, technical/operational ownership, requirements, exclusions and constraints; QUALITY defines acceptance. | Reconcile stale status passages and finish the final acceptance evidence. Documentation existence is not supervisor or assessor sign-off. |
| FB-02 guidance translated into design | Substantial documented mapping | Architecture's Step 0 and ENISA sections; research note; decisions explaining discussion-only limits and human control. | Consolidate exact source/version-to-requirement-to-test links in the final report and retain subject-matter review. This audit did not revalidate external standards or certify compliance. |
| FB-03 input specification and profile/source model | Implemented bounded | `profile.ts`, `intake.ts`, `organisation-validation.ts`: typed systems, zones, services, data, people/roles, suppliers, relations, RTO/RPO/priorities, evidence and independent knowledge/review states. | Complete the reviewed reference pack and demonstrate semantic adequacy for the selected case. Generic claims are not evidence that every relevant business fact has been captured. |
| FB-04 ingestion, extraction and guided questions | Implemented bounded; evaluation partial | Editable draw.io XML/SVG, text DOCX/PDF/UTF-8, bounded parsers, source locators, deterministic missing-context questions, optional subscription extraction; intake/extraction API and browser tests. | Independently score extraction omissions, taxonomy, relationships and sources; measure correction effort. Guided input is generic evidence, not a complete objective/scope-planning wizard. No universal SVG, scanned PDF or OCR claim. |
| FB-05 reconciliation and confirmation | Implemented bounded | Add/correct/accept/reject, owner isolation, exact source quotes, explicit conflicts, pending-candidate gate, immutable confirmed snapshot, stale-write/retry/rollback tests. | Independent semantic review remains. The trial profile was confirmed under explicit user authority; that is different from a blind independent evaluation of every extracted claim. |
| FB-06 controlled threat selection and pathways | Bounded mechanism implemented; validation partial | `threat-library.ts` and pathway UI use structural confirmed links, applicability rules, named affected services, recovery/authority/supplier evidence and labelled entry hypotheses; second-profile deterministic test. | Review the selected pathway's realism, limits and source provenance, and evaluate changed-input behaviour semantically. One family is not automatically a failure for Form B's one-scenario scope; a second family is not a stated minimum. |
| FB-07 reviewed generated package | Partial, major final-scope gap | Five-position constrained composition, three fixed functional roles, three ordered decisions, per-role text, expected actions/criteria, preparation editing, per-inject acceptance and immutable freeze. | Ten generated positions, approved alternative paths and sufficient reviewed technical artefacts/decision evidence. Current templates and schemas deliberately reject branches and fix the generated count at five. |
| FB-08 facilitated web play | Implemented for flat workflow; adaptive portion incomplete | Step 0, role briefing/inbox, exact approvals/releases, response revisions, private disposition, pause/resume, explicit closure/completion, durable receipts and restart tests. | Branch selection/override and associated release/record behaviour are absent. Full independent human evaluation of the final workflow remains. Existing package/interpretation editing must not be mistaken for branch override. |
| FB-09 interpretation and branch recommendation | Partial | Quote-backed present/partial/missing/unclear interpretation, extracted summaries/risks, explicit facilitator accept/edit/reject/override, stale-response rejection and manual continuation. | `recommendedFollowUpId` is required to be `null`. No approved-branch catalogue, eligibility/recommendation mechanism or human branch-agreement evaluation exists. |
| FB-10 records, AAR and improvement actions | Implemented at five; final evidence partial | Immutable cited snapshots, timeline/objective views, reviewed interpretation inclusion, exact-quote AAR, manual review, owner/due-date assignment, future clarification logging and post-completion debrief. | Human acceptance of the recorded AAR, semantic completeness/usefulness evaluation, branch records and ten-position reports. The old trial's private clarification transcripts are intentionally not AAR evidence. |
| FB-11 controlled evaluation | Partial, substantial software evidence | 204 deterministic tests; browser suite; frozen interpretation corpus/recipe; dated extraction, generation and AAR feasibility reports; targeted guard-removal scripts. | Independent extraction/scenario/artefact quality, branch recommendation agreement, final ten-position workflow, human usefulness and correction burden; consolidated test report. Passing schemas/quotes does not establish semantic accuracy. |
| FB-12 final prototype and handover | Partial | Source, configuration, schemas/prompts, README operating instructions, technical documentation, synthetic miniature fixtures and operational skeleton handoff. | Complete reproducible reference/demo pack, final user guide and handover verification, consolidated evaluation, school-safe end-to-end adaptive demonstration, capstone report and presentation. No completed final report/presentation was found among the tracked files. |

### The implemented workflow

1. A facilitator imports supported synthetic source material into a private draft. Drawing cells/connectors and document passages are evidence, not automatically confirmed semantics.
2. Optional AI extraction proposes additional entities/claims. Human review keeps acceptance separate from fact/proposal/assumption/unknown/conflict status. A profile is confirmed only after the required review and source checks.
3. An operator pins one exact confirmed profile in external target configuration. Generation is not a self-service profile selector. The controlled family checks applicability; AI selects supported evidence/event/action fields and the application renders the text.
4. A facilitator edits preparation and five injects, accepts exact revisions, then freezes the package into a run. Preparation changes reset acceptance; frozen content cannot be silently rewritten.
5. Step 0 and briefing precede play. Each position needs separate exact approval/release, a participant response or explicit unanswered finding, facilitator disposition and explicit closure. The next position waits for closure; completion is explicit.
6. Interpretation analyses a recorded response without changing progression. Reports capture a completed five-position run and current reviewed interpretations; AAR drafting/review uses that immutable snapshot.

The current path is **linear facilitated play with separate AI analysis**, not the assessed adaptive branch loop. A labelled AI-player rehearsal demonstrates workflow execution; it does not establish human usefulness, learning or real recovery.

## Fourteen deliverable assessment

| Form B deliverable | State | Remaining acceptance evidence |
| --- | --- | --- |
| Requirements, Scope, and Data-Handling Specification | Substantially present | Reconcile current status, complete final traceability and document applicable environment/data approvals without assuming personal subscription authority equals organisational permission. |
| Synthetic SME Reference Pack | Partial and split across locations | Company brief, register and seven cards exist. Package the agreed diagram, optional continuity text, guided answers and independently reviewed expected facts into an intentionally reviewed, reproducible set. Do not copy runtime secrets or the full author/private-role archive into participant material. |
| Organisation Profile Schema and Source Model | Implemented bounded | Demonstrate every required category on the reference case and preserve current schema/sample documentation. |
| Input Ingestion and Extraction Module | Implemented bounded | Controlled semantic/source scoring and correction burden, not just successful parsing and valid JSON. |
| Reconciliation and User-Validation Workflow | Implemented bounded | Human task evaluation and evidence of handling representative missing/conflicting information. |
| Threat Library and Pathway Mapping Module | Bounded implementation | Reviewed pattern provenance and plausible technical-to-business/recovery reasoning for the chosen scenario. Do not add an arbitrary library-size requirement. |
| TTX Package Generator | Partial | Ten coherent entries and reviewed alternatives, preserving exact profile grounding and freeze controls. |
| Role-Specific Inject and Artefact Set | Partial | Role-specific text/evidence exists. Review a sufficient set of inert simulated alerts/logs/tickets/supplier/recovery evidence for the decisions and alternatives; the current script mostly asks for missing evidence. A separate file-download system is not inherently required. |
| Web-Based Exercise and Facilitator Interface | Flat workflow implemented | Approved adaptive choice/override and final-path verification, not a new delivery platform. |
| AI Response Interpretation and Branch Recommendation Module | Interpretation implemented; recommendation absent | Add bounded eligible approved-ID recommendation/abstention, human choice and evaluation without autonomous release. |
| Exercise Record, AAR, and Improvement-Action Output | Five-position output implemented | Accept/revise the current draft; record and report actual branch choices; support ten; verify completeness and useful actions. Assignment is not remediation completion. |
| Validation and Testing Report | Distributed partial evidence | Consolidate methods, denominators, exact versions, disagreements, failed attempts, human review and final workflow results. |
| User Guide and Handover Package | Partial | README is useful operator documentation but needs clean-install replay, reference inputs, current contributor boundaries and a complete supported-workflow guide. |
| Final Demonstration, Capstone Report, and Presentation | Not evidenced as complete | Produce and review the school-safe final adaptive input-to-AAR demonstration and final academic artifacts. Historical diagrams and progress commits are not substitutes. |

## Requirements and task crosswalk

This crosswalk uses existing repository IDs. It does not convert deferred additions into assessed requirements.

| Repository requirements | Form B relationship | Current boundary |
| --- | --- | --- |
| REQ-001, REQ-002, REQ-021, REQ-022 | FB-03/05/07 | Implemented typed profile, review, immutable confirmation and downstream exact binding; semantic evaluation remains. |
| REQ-003, REQ-005 | FB-07/08/09 | Exact approval and server-side disclosure controls implemented for flat packages; preserve them for branches. |
| REQ-004, REQ-006 | FB-08/10 | Responses, dispositions, closures, completion, receipts and recovery implemented; branch evidence absent. |
| REQ-007 | FB-08/09 | Untrusted proposals, review and manual continuation implemented; no runtime follow-up recommendation. |
| REQ-008 | FB-04 | Bounded intake/extraction implemented; no more formats needed merely for completion. |
| REQ-009, REQ-015, REQ-019, REQ-024 | FB-06/07 | Five-position generation and review exist; final ten/artefacts/approved alternatives remain. |
| REQ-010 | FB-10 | Snapshot-bound draft and review controls exist; final accepted content and expanded reporting remain. |
| REQ-011 | Cross-cutting safeguards | Synthetic-only contracts, external runtime data and restricted provider path; not production or organisation-data approval. |
| REQ-012 | FB-11 | Strong control tests and bounded feasibility evidence; incomplete independent semantic/usefulness evaluation. |
| REQ-013 | FB-01/07 role responsibility portion | Three player functions and facilitator suppliers are mapped for this trial. Extra generic RACI setup is not a completion prerequisite. |
| REQ-014 | Deferred addition | Two-attempt coaching is not implemented and is not a Form B blocker. |
| REQ-016, REQ-017 | FB-03/05/07 preparation and approval portion | Bounded questions, profile/package/run gates exist. Extra intake routes and a generic readiness engine remain deferred. |
| REQ-018 | FB-07/09 | Response-dependent approved alternatives remain unimplemented; this is a real baseline gap, unlike coaching. |
| REQ-020 | User-authorised baseline preparation supporting FB-01/02/07/08 | Technical all-role Step 0 is implemented. It is neither an extra inject nor certification evidence. |
| REQ-023 | FB-06 | Controlled structural family/pathway mapping exists; semantic validation and reviewed final pathway remain. |
| REQ-025 | FB-12 and deliverables | Source/docs exist; complete reference, evaluation and final handover outputs remain. |

| Work item | Audit interpretation |
| --- | --- |
| TASK-000 | Architectural baseline complete as a planning task, not entire FB-01/02/12 acceptance. |
| TASK-001A-E | Bounded engineering and response lifecycle complete; controls are reused by generated play. |
| TASK-002 | Interpretation feasibility/integration progressed beyond one inject; branch part remains open. |
| TASK-003 | Flat generated five-position stage implemented and recorded AI-player trial completed; historical coached title is not current scope. |
| TASK-004 | Authored SME foundation exists; complete assessed reference pack is not yet assembled. |
| TASK-005 | Bounded operational development skeleton complete; the other worker's actual exercise is not complete in this checkout. |
| TASK-006 | Intake/reconciliation and generation binding implemented; independent semantic/correction-effort evaluation remains. |
| TASK-007 | Controlled one-family mapping and five-position composition implemented; final content, branches and ten remain. |
| TASK-008 | Interpretation and five-position record/AAR controls implemented; human AAR acceptance and branch recommendation remain. |
| TASK-009 | Not complete as a full-workflow evaluation/handover milestone, despite substantial constituent test evidence. |

## Material completion gaps

### Approved branching is absent

This is directly observable in code, not inferred from a missing UI label. [InterpretationOutputSchema](../../src/contracts/interpretation.ts) requires `recommendedFollowUpId: Type.Null()` at line 74. [GeneratedPlanSchema](../../src/contracts/generation.ts) has flat positions and no approved variant/transition set. [The generation prompt](../../src/server/generation-content.ts) explicitly forbids branches. The [follow-up design](../architecture.md#proposed-reviewed-follow-ups) is explicitly a proposal.

Completion requires reviewed follow-up identities/content/recipients/eligibility and transitions, valid-ID recommendation or abstention, facilitator selection/override, exact release approval, and durable selected-path evidence. The AAR must be able to cite the actual choice and delivered evidence. Do not count the existing three decision labels as three implemented branch points.

### Ten requires coordinated changes

The shared exercise engine has passing five/ten-entry fixture tests and a general 15-inject array bound. That is useful groundwork, not a generated ten-entry demonstration.

| Five-specific boundary | Evidence in current source |
| --- | --- |
| Generator position/count/reviews | `src/contracts/generation.ts:74`, `:140` and `:153`; generated positions are 1-5, exactly five, with five review slots. |
| Generated package validation | `src/server/exercise-validation.ts:32`; `generated-five-inject` must have five injects and three roles. |
| Freeze gate and review UI | `src/server/generation-service.ts:338` and `src/ui/package-workspace.tsx:277`; all-five acceptance and five-specific presentation. |
| Interpreter supported package kind | `src/server/interpretation-service.ts:41`; support is bound to `generated-five-inject`. |
| Report capture and completeness | `src/server/record-report-service.ts:43`; five injects, releases and closures required. |
| Report schema/reference validation | `src/contracts/record-report.ts:34`, `:64`, `:101`; positions capped at five and coverage must equal `[1,2,3,4,5]`. |

The generator, validator, freeze/UI, interpretation support, report model/capture, AAR integration and regression fixtures therefore need a consistent reviewed extension. Preserve the already-frozen five-position records and their interpretation/report identities. Merely raising an array maximum would not satisfy Form B.

### Technical evidence must support the decisions

The generated role bodies include a simulated incident/update request, source-linked profile excerpts and discussion questions. This is genuine recipient-specific evidence, not an empty scaffold. However, no dedicated approved technical-artefact/alternative mechanism is present, and the recorded trial reached an authorised restoration hold because decision-enabling supplier/recovery evidence was not supplied.

A hold can be a valid exercise outcome. It must not be labelled a failed real restore, corrupt backup or demonstrated organisational deficiency. The final package needs reviewed evidence sufficient to exercise its chosen decisions and alternatives without silently turning source unknowns into confirmed capability. Text-form simulated evidence can meet this need; attachments, email integration and a generic artifact platform are not automatically necessary.

### Evaluation remains narrower than implementation

| Evidence area | Recorded result | Interpretation and remaining gap |
| --- | --- | --- |
| Semantic extraction | Two integrated source cases succeeded after a separate failed notice attempt; selected 18 known-answer and four changed-input checks; taxonomy/dependency omissions documented. | Assistant-reviewed selected checks, not independent all-claim precision/recall or correction-effort evaluation. The current `sme-extraction-2` prompt differs from the live version-1 trial. |
| Generation | One valid live five-position proposal after a failed transport-schema attempt; later manually reviewed/frozen. A second synthetic profile now passes deterministic generation/play/report tests. | Live bounded feasibility plus software generalisation evidence, not a generation-quality rate or independent scenario-quality comparison. Current `five-position-4` was not live-evaluated by this audit. |
| Exercise play | Recorded 5 releases, 15 role deliveries, 10 specialist contributions before 5 leadership responses, 5 dispositions/closures and explicit completion. | Labelled three-agent API rehearsal, not independent human participant evaluation or proof that real incident actions occurred. |
| Interpretation | Development 30/32 matching action labels; holdout 15/16; five unlabelled trial responses; 176/176 quotes valid in that pass. | Small assistant-authored, user-reviewed set. Two over-credit errors and one false-unclear label documented. One unclear case per partition is insufficient for class performance claims. No branch evaluation. |
| AAR | First output rejected for attribution despite valid quotes; second draft valid, with 12 findings, 21 quotations and 3 proposed improvements. | Structural validity is not semantic completeness/usefulness. Draft is last recorded unaccepted; source limitations and omitted topics require review. Current `record-only-aar-3` includes later debrief policy not measured by that earlier live pass. |
| Controls | Fresh deterministic checks plus browser coverage; earlier targeted guard-removal results. | Good evidence for tested application rules, not general model accuracy, security certification, recovery capability or user benefit. |

Sources: [interpretation results](interpretation-results.md), [AAR results](aar-results.md), [WORK dated checkpoints](../WORK.md#current-verification), and [QUALITY's evaluation gate](../QUALITY.md#interpretation-and-aar-evaluation-gate).

The brief requires controlled human-reviewed evaluation and usefulness, not a large research study. Use a bounded, predeclared protocol for the chosen case. A measured manual/ordinary-tools baseline is necessary before claiming preparation-time or cost savings; no such comparative result is established here. Do not turn that into an unbounded product comparison project.

### Handover is not yet reproducible from Git alone

Git contains a runnable engineering fixture and synthetic miniature tests, but not a complete versioned copy of the reviewed end-to-end demonstration inputs and generated trial data. Live data staying outside Git is correct. The missing piece is a deliberately selected school-safe reference/demo package and an operating recipe, not publication of a raw Docker volume.

The diagram and selected continuity source need explicit version/hash and distribution treatment; the continuity plan currently exists as an untracked file in the old planning worktree. Expected facts, guided answers, scenario/artefact review, prompt/configuration versions and evaluated outputs need a coherent handover index. A new operator should be able to reproduce the supported demonstration without access to this chat, private credentials or undocumented AppData contents.

## Documentation discrepancies

These affect confidence in status reporting. They are not all application defects, and historical dated entries should not be rewritten as if later work already existed.

| Location at audited source | Discrepancy | Correct reading or follow-up |
| --- | --- | --- |
| `docs/WORK.md:99` | Still says downstream generator binding and functional-role mapping remain. | Binding and three-role mapping are implemented and recorded later in the same file. Keep semantic evaluation open, not these already-completed bounded parts. |
| `docs/WORK.md:22` | A delivery-discipline bullet describes pathways/generation/interpretation/AAR as not implemented. | It describes the 26 October imbalance; its wording should be explicitly historical rather than read as today's summary. |
| `docs/WORK.md:16` | Calls a second threat family the next library step. | That may be optional future development, but Form B specifies one scenario and no minimum family count. It should not displace branching, ten and evaluation on the completion path without an explicit scope decision. |
| `docs/operational-handoff.md:36` | Lists only engineering-fixture and development-skeleton package kinds. | The shared contract now also has generated-five-inject. Operational play remains unavailable. |
| `docs/operational-handoff.md:85` | Says package editing, ingestion, AI and AAR are unimplemented without limiting the statement to the operational track. | These exist in the technical track. Refresh the shared-versus-operational boundary before relying on this as a current contributor guide. |
| PROJECT environment/open-question table | Some incident/role/AAR/provider wording predates ADR-032 through ADR-037. | Distinguish already-approved trial scope from the genuinely outstanding branch/ten/content evaluation decisions. Later ADRs document bounded generation/interpretation/AAR authority; intake-only wording is not the whole current implementation history. |
| Historical organisation index, architecture sections and diagrams | Retain OPEN-11 pending language, one-position assumptions or coached/readiness plans. | Useful authoring/history, not current approved scope or executed state. Label or link, rather than silently promote historical proposals. |
| Runtime statements in README/WORK | Describe a healthy preview at the time of earlier checkpoints. | The preview is stopped now and built from older code. Date operational claims and separate source verification from deployed state. |

The objective/deliverable matrices are useful but cannot be used mechanically as a checklist of completed features. Several rows mix implementation, dated trial evidence and future evaluation. The evidence labels in this audit make those distinctions explicit.

## Shortest Form B completion path

The following is a dependency-based recommendation, not new implementation authority. Preserve the existing user-review stop before branch implementation.

1. **Close the current five-position review.** Review the AAR against its fixed evidence, distinguish exercise-material gaps from organisational capability claims, assign owners where appropriate, and capture any new debrief in a new snapshot rather than rewriting the old trial. No new model call is inherently required.
2. **Approve the bounded branch and evidence design.** Reuse the selected incident and three decisions. Review the limited alternative outcomes, inert supplier/technical evidence, eligibility, recipient distribution and rejoin/termination rules. Do not start a second scenario merely to make the library larger.
3. **Implement and verify the adaptive loop.** Extend the existing contracts/engine, not a second framework. Test eligible approved-ID recommendation/abstention, manual choice/override, exact approvals, wrong/stale IDs, private unreleased alternatives, restart/outage and durable branch records/AAR references.
4. **Expand the same workflow to ten.** Remove five-specific assumptions coherently across composition, review, interpretation and reporting; preserve historical records. Review the ten-position MSEL, three roles/decisions, evidence timing and objective coverage along every allowed path. Count neither unused alternatives nor role deliveries as extra MSEL positions.
5. **Complete controlled human evaluation.** Freeze a bounded reference set/protocol before final scoring; assess extraction/source grounding, scenario and artefact consistency, interpretation and branch agreement, approval/fallback controls, correction effort and usefulness. Report disagreements and failed attempts with denominators.
6. **Assemble and replay the handover.** Provide reviewed synthetic inputs/expected facts, schemas/prompts/configuration, current operating guide, test report, limitations, school-safe demonstration, capstone report and presentation. Verify setup on a fresh isolated data directory/volume without copying private trial credentials.

Final completion is the conjunction of these outcomes, not any single demonstration or test suite. Human review can conclude that an existing bounded design is adequate; it does not require unlimited generalisation.

### Do not add these as completion blockers

Multiple threat families, additional SME sectors, a fourth role, 15 rather than 10 entries, image-only OCR, more diagram formats, participant chatbots, Gmail/Slack delivery, a generic readiness engine, two-attempt coaching, an action-closure tracker, a new AI provider, multi-tenant hosting, SSO, LAN/TLS deployment and production backup automation are not all required by this brief. Some are explicitly excluded or deferred. A different deployment need would require its own decision.

The bounded operational skeleton is delivered under the user's exception. Completing the other worker's operational scenario is not this technical workstream's unfulfilled Form B deliverable. Conversely, shared application branding must not imply that an operational exercise is already playable.

## Complete tracked file inventory

The following maps every tracked file at `975c499` exactly once. IDs point to the twelve objective summaries above. Cross-cutting infrastructure supports the mapped workflow but is not independently an assessed product feature. Test/support entries mean software evidence, not live AI or human-evaluation acceptance. The audit document itself is a later documentation addition and is not counted among the 193 inputs.

| File | Responsibility | Form B mapping | Evidence boundary |
| --- | --- | --- | --- |
| [.dockerignore](../../.dockerignore) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [.editorconfig](../../.editorconfig) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [.env.example](../../.env.example) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [.gitattributes](../../.gitattributes) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [.gitignore](../../.gitignore) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [.prettierignore](../../.prettierignore) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [.prettierrc.json](../../.prettierrc.json) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [AGENTS.md](../../AGENTS.md) | Scope and project records | FB-01-12 | Scope, traceability, choices or dated execution; not itself runtime evidence. |
| [AI_TTX_Architecture.html](../../AI_TTX_Architecture.html) | Historical design or checkpoint | FB-01/12 | Predates current scope; not current-feature acceptance. |
| [Dockerfile](../../Dockerfile) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [README.md](../../README.md) | Operator documentation | FB-12 | Startup/workflow guidance; full final handover remains incomplete. |
| [THREAT_PATHWAY_TEMPLATE.md](../../THREAT_PATHWAY_TEMPLATE.md) | Exercise research and authoring | FB-02/06/07 | Source rationale or template, not approved exercise content. |
| [compose.yaml](../../compose.yaml) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [docs/DECISIONS.md](../../docs/DECISIONS.md) | Scope and project records | FB-01-12 | Scope, traceability, choices or dated execution; not itself runtime evidence. |
| [docs/PROJECT.md](../../docs/PROJECT.md) | Scope and project records | FB-01-12 | Scope, traceability, choices or dated execution; not itself runtime evidence. |
| [docs/QUALITY.md](../../docs/QUALITY.md) | Scope and project records | FB-01-12 | Scope, traceability, choices or dated execution; not itself runtime evidence. |
| [docs/WORK.md](../../docs/WORK.md) | Scope and project records | FB-01-12 | Scope, traceability, choices or dated execution; not itself runtime evidence. |
| [docs/architecture.md](../../docs/architecture.md) | Scope and project records | FB-01-12 | Scope, traceability, choices or dated execution; not itself runtime evidence. |
| [docs/diagrams/generate-five-inject-workflow.cjs](../../docs/diagrams/generate-five-inject-workflow.cjs) | Historical design or checkpoint | FB-01/12 | Predates current scope; not current-feature acceptance. |
| [docs/diagrams/generate-screen-concepts.cjs](../../docs/diagrams/generate-screen-concepts.cjs) | Historical design or checkpoint | FB-01/12 | Predates current scope; not current-feature acceptance. |
| [docs/diagrams/ttx-five-inject-workflow.excalidraw](../../docs/diagrams/ttx-five-inject-workflow.excalidraw) | Historical design or checkpoint | FB-01/12 | Predates current scope; not current-feature acceptance. |
| [docs/diagrams/ttx-five-inject-workflow.png](../../docs/diagrams/ttx-five-inject-workflow.png) | Historical design or checkpoint | FB-01/12 | Predates current scope; not current-feature acceptance. |
| [docs/diagrams/ttx-five-inject-workflow.svg](../../docs/diagrams/ttx-five-inject-workflow.svg) | Historical design or checkpoint | FB-01/12 | Predates current scope; not current-feature acceptance. |
| [docs/diagrams/ttx-screen-concepts-index.json](../../docs/diagrams/ttx-screen-concepts-index.json) | Historical design or checkpoint | FB-01/12 | Predates current scope; not current-feature acceptance. |
| [docs/diagrams/ttx-screen-concepts.excalidraw](../../docs/diagrams/ttx-screen-concepts.excalidraw) | Historical design or checkpoint | FB-01/12 | Predates current scope; not current-feature acceptance. |
| [docs/diagrams/ttx-screen-concepts.png](../../docs/diagrams/ttx-screen-concepts.png) | Historical design or checkpoint | FB-01/12 | Predates current scope; not current-feature acceptance. |
| [docs/diagrams/ttx-screen-concepts.svg](../../docs/diagrams/ttx-screen-concepts.svg) | Historical design or checkpoint | FB-01/12 | Predates current scope; not current-feature acceptance. |
| [docs/evaluation/aar-results.md](../../docs/evaluation/aar-results.md) | AAR evaluation | FB-10/11 | Dated bounded live trial result; not new live verification. |
| [docs/evaluation/interpretation-label-changes.md](../../docs/evaluation/interpretation-label-changes.md) | Interpretation evaluation | FB-09/11 | Synthetic reference/aggregate/freeze evidence; not independent human efficacy. |
| [docs/evaluation/interpretation-label-review.md](../../docs/evaluation/interpretation-label-review.md) | Interpretation evaluation | FB-09/11 | Synthetic reference/aggregate/freeze evidence; not independent human efficacy. |
| [docs/evaluation/interpretation-results.md](../../docs/evaluation/interpretation-results.md) | Interpretation evaluation | FB-09/11 | Synthetic reference/aggregate/freeze evidence; not independent human efficacy. |
| [docs/form-b-alignment.md](../../docs/form-b-alignment.md) | Scope and project records | FB-01-12 | Scope, traceability, choices or dated execution; not itself runtime evidence. |
| [docs/history/WORK-2026-10-05.md](../../docs/history/WORK-2026-10-05.md) | Historical design or checkpoint | FB-01/12 | Predates current scope; not current-feature acceptance. |
| [docs/operational-handoff.md](../../docs/operational-handoff.md) | Operational skeleton | Exception; FB-12 support | Isolated non-playable entry/handoff, not a complete operational exercise. |
| [docs/organisation/example-sme-01/README.md](../../docs/organisation/example-sme-01/README.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/author-notes.md](../../docs/organisation/example-sme-01/author-notes.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/master-register.md](../../docs/organisation/example-sme-01/master-register.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/name-screening.md](../../docs/organisation/example-sme-01/name-screening.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/organisation-brief.md](../../docs/organisation/example-sme-01/organisation-brief.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/participant-summary.md](../../docs/organisation/example-sme-01/participant-summary.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/role-cards/anika.md](../../docs/organisation/example-sme-01/role-cards/anika.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/role-cards/clara.md](../../docs/organisation/example-sme-01/role-cards/clara.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/role-cards/daphne.md](../../docs/organisation/example-sme-01/role-cards/daphne.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/role-cards/ethan.md](../../docs/organisation/example-sme-01/role-cards/ethan.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/role-cards/imran.md](../../docs/organisation/example-sme-01/role-cards/imran.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/role-cards/joel.md](../../docs/organisation/example-sme-01/role-cards/joel.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/organisation/example-sme-01/role-cards/nadia.md](../../docs/organisation/example-sme-01/role-cards/nadia.md) | Synthetic SME foundation | FB-03/07/11/12 | Authored shared, role or author material; incomplete assessed reference pack. |
| [docs/research/technical-ttx-inputs-and-synthetic-pack.md](../../docs/research/technical-ttx-inputs-and-synthetic-pack.md) | Exercise research and authoring | FB-02/06/07 | Source rationale or template, not approved exercise content. |
| [eslint.config.mjs](../../eslint.config.mjs) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [evaluation/interpretation-development.json](../../evaluation/interpretation-development.json) | Interpretation evaluation | FB-09/11 | Synthetic reference/aggregate/freeze evidence; not independent human efficacy. |
| [evaluation/interpretation-freeze.json](../../evaluation/interpretation-freeze.json) | Interpretation evaluation | FB-09/11 | Synthetic reference/aggregate/freeze evidence; not independent human efficacy. |
| [evaluation/interpretation-holdout.json](../../evaluation/interpretation-holdout.json) | Interpretation evaluation | FB-09/11 | Synthetic reference/aggregate/freeze evidence; not independent human efficacy. |
| [evaluation/interpretation-manifest.json](../../evaluation/interpretation-manifest.json) | Interpretation evaluation | FB-09/11 | Synthetic reference/aggregate/freeze evidence; not independent human efficacy. |
| [evaluation/interpretation-recipe-freeze.json](../../evaluation/interpretation-recipe-freeze.json) | Interpretation evaluation | FB-09/11 | Synthetic reference/aggregate/freeze evidence; not independent human efficacy. |
| [index.html](../../index.html) | Shared browser infrastructure | FB-05/08/10/12 | Navigation, API validation, styling or unsaved-editor protection. |
| [package-lock.json](../../package-lock.json) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [package.json](../../package.json) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [playwright.config.ts](../../playwright.config.ts) | Browser test infrastructure | FB-08/11 | Disposable local test server/configuration; not saved-preview data. |
| [scripts/browser-server.ts](../../scripts/browser-server.ts) | Browser test infrastructure | FB-08/11 | Disposable local test server/configuration; not saved-preview data. |
| [scripts/check-aar-mutations.ts](../../scripts/check-aar-mutations.ts) | Targeted guard-removal checks | FB-07/08/10/11 | Runs focused tests on temporary copies; not exhaustive mutation coverage. |
| [scripts/check-codex-isolation.ts](../../scripts/check-codex-isolation.ts) | Optional AI adapter | FB-04/07/09/10/11 | Pinned local worker/tool audit; not OS isolation or current live verification. |
| [scripts/check-generation-mutations.ts](../../scripts/check-generation-mutations.ts) | Targeted guard-removal checks | FB-07/08/10/11 | Runs focused tests on temporary copies; not exhaustive mutation coverage. |
| [scripts/evaluate-interpretation.ts](../../scripts/evaluate-interpretation.ts) | Interpretation evaluation | FB-09/11 | Synthetic reference/aggregate/freeze evidence; not independent human efficacy. |
| [scripts/test-subscription-intake.ts](../../scripts/test-subscription-intake.ts) | Intake and extraction | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/contracts/aar.ts](../../src/contracts/aar.ts) | Records and AAR contracts | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/contracts/clarification.ts](../../src/contracts/clarification.ts) | Records and AAR contracts | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/contracts/debrief.ts](../../src/contracts/debrief.ts) | Records and AAR contracts | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/contracts/exercise.ts](../../src/contracts/exercise.ts) | Facilitated play contracts | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/contracts/extraction.ts](../../src/contracts/extraction.ts) | Intake and extraction contracts | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/contracts/generation.ts](../../src/contracts/generation.ts) | Pathway and package contracts | FB-06/07 | One-family, five-position composition/review; branches and ten absent. |
| [src/contracts/intake.ts](../../src/contracts/intake.ts) | Intake and extraction contracts | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/contracts/interpretation.ts](../../src/contracts/interpretation.ts) | Response interpretation contracts | FB-09/11 | Quote-backed analysis; recommended follow-up remains null. |
| [src/contracts/outcomes.ts](../../src/contracts/outcomes.ts) | Responses and outcomes contracts | FB-08/10 | Agreed response revisions, review, closure and explicit completion. |
| [src/contracts/profile.ts](../../src/contracts/profile.ts) | Profile and provenance contracts | FB-03/05 | Source-linked facts and uncertainty, validation or synthetic fixtures. |
| [src/contracts/record-report.ts](../../src/contracts/record-report.ts) | Records and AAR contracts | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/contracts/threat.ts](../../src/contracts/threat.ts) | Pathway and package contracts | FB-06/07 | One-family, five-position composition/review; branches and ten absent. |
| [src/server/aar-bridge.ts](../../src/server/aar-bridge.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/aar-content.ts](../../src/server/aar-content.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/aar-routes.ts](../../src/server/aar-routes.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/aar-service.ts](../../src/server/aar-service.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/aar-store.ts](../../src/server/aar-store.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/access.ts](../../src/server/access.ts) | Local identity server | FB-08/12 | Generated local demo codes and sessions; not production authentication. |
| [src/server/app.ts](../../src/server/app.ts) | Application infrastructure server | FB-03-10/12 | Composition, configuration, strict validation, integrity or persistence. |
| [src/server/clarification-service.ts](../../src/server/clarification-service.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/clarification-store.ts](../../src/server/clarification-store.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/codex-extraction.ts](../../src/server/codex-extraction.ts) | Optional AI adapter server | FB-04/07/09/10/11 | Pinned local worker/tool audit; not OS isolation or current live verification. |
| [src/server/codex-isolation.ts](../../src/server/codex-isolation.ts) | Optional AI adapter server | FB-04/07/09/10/11 | Pinned local worker/tool audit; not OS isolation or current live verification. |
| [src/server/config.ts](../../src/server/config.ts) | Application infrastructure server | FB-03-10/12 | Composition, configuration, strict validation, integrity or persistence. |
| [src/server/debrief-service.ts](../../src/server/debrief-service.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/debrief-store.ts](../../src/server/debrief-store.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/errors.ts](../../src/server/errors.ts) | Application infrastructure server | FB-03-10/12 | Composition, configuration, strict validation, integrity or persistence. |
| [src/server/exercise-demo.ts](../../src/server/exercise-demo.ts) | Facilitated play server | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/server/exercise-routes.ts](../../src/server/exercise-routes.ts) | Facilitated play server | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/server/exercise-service.ts](../../src/server/exercise-service.ts) | Facilitated play server | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/server/exercise-store.ts](../../src/server/exercise-store.ts) | Facilitated play server | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/server/exercise-validation.ts](../../src/server/exercise-validation.ts) | Facilitated play server | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/server/extraction-bridge.ts](../../src/server/extraction-bridge.ts) | Intake and extraction server | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/server/extraction-jobs.ts](../../src/server/extraction-jobs.ts) | Intake and extraction server | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/server/extraction-prompt.ts](../../src/server/extraction-prompt.ts) | Intake and extraction server | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/server/extraction-store.ts](../../src/server/extraction-store.ts) | Intake and extraction server | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/server/fixture.ts](../../src/server/fixture.ts) | Profile and provenance server | FB-03/05 | Source-linked facts and uncertainty, validation or synthetic fixtures. |
| [src/server/generation-bridge.ts](../../src/server/generation-bridge.ts) | Pathway and package server | FB-06/07 | One-family, five-position composition/review; branches and ten absent. |
| [src/server/generation-content.ts](../../src/server/generation-content.ts) | Pathway and package server | FB-06/07 | One-family, five-position composition/review; branches and ten absent. |
| [src/server/generation-routes.ts](../../src/server/generation-routes.ts) | Pathway and package server | FB-06/07 | One-family, five-position composition/review; branches and ten absent. |
| [src/server/generation-service.ts](../../src/server/generation-service.ts) | Pathway and package server | FB-06/07 | One-family, five-position composition/review; branches and ten absent. |
| [src/server/generation-setup.ts](../../src/server/generation-setup.ts) | Pathway and package server | FB-06/07 | One-family, five-position composition/review; branches and ten absent. |
| [src/server/generation-store.ts](../../src/server/generation-store.ts) | Pathway and package server | FB-06/07 | One-family, five-position composition/review; branches and ten absent. |
| [src/server/intake-parser-worker.ts](../../src/server/intake-parser-worker.ts) | Intake and extraction server | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/server/intake-parser.ts](../../src/server/intake-parser.ts) | Intake and extraction server | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/server/intake-parsers.ts](../../src/server/intake-parsers.ts) | Intake and extraction server | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/server/intake-routes.ts](../../src/server/intake-routes.ts) | Intake and extraction server | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/server/intake-service.ts](../../src/server/intake-service.ts) | Intake and extraction server | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/server/intake-store.ts](../../src/server/intake-store.ts) | Intake and extraction server | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/server/integrity.ts](../../src/server/integrity.ts) | Application infrastructure server | FB-03-10/12 | Composition, configuration, strict validation, integrity or persistence. |
| [src/server/interpretation-bridge.ts](../../src/server/interpretation-bridge.ts) | Response interpretation server | FB-09/11 | Quote-backed analysis; recommended follow-up remains null. |
| [src/server/interpretation-content.ts](../../src/server/interpretation-content.ts) | Response interpretation server | FB-09/11 | Quote-backed analysis; recommended follow-up remains null. |
| [src/server/interpretation-routes.ts](../../src/server/interpretation-routes.ts) | Response interpretation server | FB-09/11 | Quote-backed analysis; recommended follow-up remains null. |
| [src/server/interpretation-service.ts](../../src/server/interpretation-service.ts) | Response interpretation server | FB-09/11 | Quote-backed analysis; recommended follow-up remains null. |
| [src/server/interpretation-store.ts](../../src/server/interpretation-store.ts) | Response interpretation server | FB-09/11 | Quote-backed analysis; recommended follow-up remains null. |
| [src/server/interpretation-validation.ts](../../src/server/interpretation-validation.ts) | Response interpretation server | FB-09/11 | Quote-backed analysis; recommended follow-up remains null. |
| [src/server/main.ts](../../src/server/main.ts) | Application infrastructure server | FB-03-10/12 | Composition, configuration, strict validation, integrity or persistence. |
| [src/server/operational-fixture.ts](../../src/server/operational-fixture.ts) | Operational skeleton server | Exception; FB-12 support | Isolated non-playable entry/handoff, not a complete operational exercise. |
| [src/server/organisation-validation.ts](../../src/server/organisation-validation.ts) | Profile and provenance server | FB-03/05 | Source-linked facts and uncertainty, validation or synthetic fixtures. |
| [src/server/outcome-routes.ts](../../src/server/outcome-routes.ts) | Responses and outcomes server | FB-08/10 | Agreed response revisions, review, closure and explicit completion. |
| [src/server/outcome-service.ts](../../src/server/outcome-service.ts) | Responses and outcomes server | FB-08/10 | Agreed response revisions, review, closure and explicit completion. |
| [src/server/outcome-store.ts](../../src/server/outcome-store.ts) | Responses and outcomes server | FB-08/10 | Agreed response revisions, review, closure and explicit completion. |
| [src/server/profile-service.ts](../../src/server/profile-service.ts) | Profile and provenance server | FB-03/05 | Source-linked facts and uncertainty, validation or synthetic fixtures. |
| [src/server/record-report-clock.ts](../../src/server/record-report-clock.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/record-report-routes.ts](../../src/server/record-report-routes.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/record-report-service.ts](../../src/server/record-report-service.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/record-report-store.ts](../../src/server/record-report-store.ts) | Records and AAR server | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/server/show-access.ts](../../src/server/show-access.ts) | Local identity server | FB-08/12 | Generated local demo codes and sessions; not production authentication. |
| [src/server/storage.ts](../../src/server/storage.ts) | Application infrastructure server | FB-03-10/12 | Composition, configuration, strict validation, integrity or persistence. |
| [src/server/subscription-worker.ts](../../src/server/subscription-worker.ts) | Optional AI adapter server | FB-04/07/09/10/11 | Pinned local worker/tool audit; not OS isolation or current live verification. |
| [src/server/technical-fixture.ts](../../src/server/technical-fixture.ts) | Facilitated play server | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/server/threat-library.ts](../../src/server/threat-library.ts) | Pathway and package server | FB-06/07 | One-family, five-position composition/review; branches and ten absent. |
| [src/server/validation.ts](../../src/server/validation.ts) | Application infrastructure server | FB-03-10/12 | Composition, configuration, strict validation, integrity or persistence. |
| [src/ui/aar-draft.ts](../../src/ui/aar-draft.ts) | Records and AAR UI | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/ui/aar-workspace.tsx](../../src/ui/aar-workspace.tsx) | Records and AAR UI | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/ui/api.ts](../../src/ui/api.ts) | Shared browser infrastructure UI | FB-05/08/10/12 | Navigation, API validation, styling or unsaved-editor protection. |
| [src/ui/clarification-workspace.tsx](../../src/ui/clarification-workspace.tsx) | Records and AAR UI | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/ui/debrief-workspace.tsx](../../src/ui/debrief-workspace.tsx) | Records and AAR UI | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/ui/disposition-form.tsx](../../src/ui/disposition-form.tsx) | Responses and outcomes UI | FB-08/10 | Agreed response revisions, review, closure and explicit completion. |
| [src/ui/exercise-format.ts](../../src/ui/exercise-format.ts) | Facilitated play UI | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/ui/exercise-workspace.tsx](../../src/ui/exercise-workspace.tsx) | Facilitated play UI | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/ui/facilitator-exercise.tsx](../../src/ui/facilitator-exercise.tsx) | Facilitated play UI | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/ui/intake-workspace.tsx](../../src/ui/intake-workspace.tsx) | Intake and extraction UI | FB-03/04/05 | Bounded source preparation and proposals; semantic evaluation remains. |
| [src/ui/interpretation-workspace.tsx](../../src/ui/interpretation-workspace.tsx) | Response interpretation UI | FB-09/11 | Quote-backed analysis; recommended follow-up remains null. |
| [src/ui/main.tsx](../../src/ui/main.tsx) | Shared browser infrastructure UI | FB-05/08/10/12 | Navigation, API validation, styling or unsaved-editor protection. |
| [src/ui/outcome-workspace.tsx](../../src/ui/outcome-workspace.tsx) | Responses and outcomes UI | FB-08/10 | Agreed response revisions, review, closure and explicit completion. |
| [src/ui/package-workspace.tsx](../../src/ui/package-workspace.tsx) | Pathway and package UI | FB-06/07 | One-family, five-position composition/review; branches and ten absent. |
| [src/ui/participant-exercise.tsx](../../src/ui/participant-exercise.tsx) | Facilitated play UI | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/ui/record-report-workspace.tsx](../../src/ui/record-report-workspace.tsx) | Records and AAR UI | FB-10/11 | Five-position snapshot/review, clarification or debrief support. |
| [src/ui/response-form.tsx](../../src/ui/response-form.tsx) | Responses and outcomes UI | FB-08/10 | Agreed response revisions, review, closure and explicit completion. |
| [src/ui/step0-form.tsx](../../src/ui/step0-form.tsx) | Facilitated play UI | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/ui/style.css](../../src/ui/style.css) | Shared browser infrastructure UI | FB-05/08/10/12 | Navigation, API validation, styling or unsaved-editor protection. |
| [src/ui/threat-pathway.tsx](../../src/ui/threat-pathway.tsx) | Pathway and package UI | FB-06/07 | One-family, five-position composition/review; branches and ten absent. |
| [src/ui/unsaved-guard.tsx](../../src/ui/unsaved-guard.tsx) | Shared browser infrastructure UI | FB-05/08/10/12 | Navigation, API validation, styling or unsaved-editor protection. |
| [src/ui/use-exercise-workspace.ts](../../src/ui/use-exercise-workspace.ts) | Facilitated play UI | FB-07/08/10 | Flat release, access and preparation; not adaptive branching. |
| [src/ui/use-outcomes.ts](../../src/ui/use-outcomes.ts) | Responses and outcomes UI | FB-08/10 | Agreed response revisions, review, closure and explicit completion. |
| [src/ui/vite-env.d.ts](../../src/ui/vite-env.d.ts) | Shared browser infrastructure UI | FB-05/08/10/12 | Navigation, API validation, styling or unsaved-editor protection. |
| [tests/aar-fixture.ts](../../tests/aar-fixture.ts) | Records and AAR tests | FB-10/11 | Synthetic fixture for deterministic/browser verification. |
| [tests/aar.test.ts](../../tests/aar.test.ts) | Records and AAR tests | FB-10/11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/browser/aar.spec.ts](../../tests/browser/aar.spec.ts) | Records and AAR tests | FB-10/11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/browser/exercise-fixture.ts](../../tests/browser/exercise-fixture.ts) | Facilitated play tests | FB-07/08/10; FB-11 | Synthetic fixture for deterministic/browser verification. |
| [tests/browser/exercise.spec.ts](../../tests/browser/exercise.spec.ts) | Facilitated play tests | FB-07/08/10; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/browser/extraction.spec.ts](../../tests/browser/extraction.spec.ts) | Intake and extraction tests | FB-03/04/05; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/browser/generation.spec.ts](../../tests/browser/generation.spec.ts) | Pathway and package tests | FB-06/07; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/browser/intake.spec.ts](../../tests/browser/intake.spec.ts) | Intake and extraction tests | FB-03/04/05; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/browser/interpretation.spec.ts](../../tests/browser/interpretation.spec.ts) | Response interpretation tests | FB-09/11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/browser/outcomes.spec.ts](../../tests/browser/outcomes.spec.ts) | Responses and outcomes tests | FB-08/10; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/browser/profile.spec.ts](../../tests/browser/profile.spec.ts) | Profile and provenance tests | FB-03/05; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/browser/record-report.spec.ts](../../tests/browser/record-report.spec.ts) | Records and AAR tests | FB-10/11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/browser/recovery.spec.ts](../../tests/browser/recovery.spec.ts) | Facilitated play tests | FB-07/08/10; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/browser/step0.spec.ts](../../tests/browser/step0.spec.ts) | Facilitated play tests | FB-07/08/10; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/debrief.test.ts](../../tests/debrief.test.ts) | Records and AAR tests | FB-10/11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/exercise.test.ts](../../tests/exercise.test.ts) | Facilitated play tests | FB-07/08/10; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/extraction.test.ts](../../tests/extraction.test.ts) | Intake and extraction tests | FB-03/04/05; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/generation-fixture.ts](../../tests/generation-fixture.ts) | Pathway and package tests | FB-06/07; FB-11 | Synthetic fixture for deterministic/browser verification. |
| [tests/generation.test.ts](../../tests/generation.test.ts) | Pathway and package tests | FB-06/07; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/intake-fixtures.ts](../../tests/intake-fixtures.ts) | Intake and extraction tests | FB-03/04/05; FB-11 | Synthetic fixture for deterministic/browser verification. |
| [tests/intake.test.ts](../../tests/intake.test.ts) | Intake and extraction tests | FB-03/04/05; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/interpretation-corpus.test.ts](../../tests/interpretation-corpus.test.ts) | Response interpretation tests | FB-09/11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/interpretation-fixture.ts](../../tests/interpretation-fixture.ts) | Response interpretation tests | FB-09/11 | Synthetic fixture for deterministic/browser verification. |
| [tests/interpretation-validation.test.ts](../../tests/interpretation-validation.test.ts) | Response interpretation tests | FB-09/11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/interpretation.test.ts](../../tests/interpretation.test.ts) | Response interpretation tests | FB-09/11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/outcomes.test.ts](../../tests/outcomes.test.ts) | Responses and outcomes tests | FB-08/10; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/profile.test.ts](../../tests/profile.test.ts) | Profile and provenance tests | FB-03/05; FB-11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/record-report-clock.test.ts](../../tests/record-report-clock.test.ts) | Records and AAR tests | FB-10/11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tests/record-report.test.ts](../../tests/record-report.test.ts) | Records and AAR tests | FB-10/11 | Executable bounded software checks; not live-model or human-usefulness evaluation. |
| [tsconfig.json](../../tsconfig.json) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [tsconfig.server.json](../../tsconfig.server.json) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
| [vite.config.ts](../../vite.config.ts) | Build and source configuration | FB-11/12 | Local packaging, locked tools, formatting or type-check configuration. |
