# AI-assisted TTX Platform Architecture

## Baseline integration — 15 September 2026

This remains the canonical architecture document. TASK-001A/B now implement the bounded Docker-first scaffold and synthetic profile confirmation. Verification results belong in WORK; the remaining exercise, AI, parsing and reporting components are planned.

Use [PROJECT](PROJECT.md) for working requirements and environment constraints, [DECISIONS](DECISIONS.md) for accepted versus proposed choices, [QUALITY](QUALITY.md) for verification criteria and [WORK](WORK.md) for actual state. Historical research and technology recommendations below do not establish current approval or installation.

### Form B workflow - 29 September 2026

[ADR-021](DECISIONS.md#adr-021---form-b-authority-and-five-inject-first-delivery) restores Form B's required input-to-exercise workflow, with the user's explicit five-MSEL-inject first-delivery exception. Three key decision points and 3-4 functional roles remain. [Form B alignment](form-b-alignment.md) maps objectives and deliverables to requirements and work. Coaching is supplementary; operational discussion exercises remain in overall platform scope under the other worker's ownership.

The planned preparation chain is: agreed synthetic diagram and optional text-based continuity documents -> source-linked candidate entities/relationships and guided answers -> reconciliation and confirmed profile -> controlled threat pathway linked to business impact/recovery -> generated five-position exercise and reviewed branches -> facilitated web play -> evidence-linked draft AAR and improvement actions. The source/profile/design/review responsibilities described in sections 4 and 6 support this chain. Prepared injects remain deterministic fixtures or comparison/fallback material, not a substitute for the generator.

Generation must use the confirmed organisation revision, not merely change the company name on a public pack. Review links from affected systems and dependencies to named services, recovery priorities and supplied RTO/RPO, with unsupported details left unknown or labelled as exercise assumptions. AI proposes content during preparation; package review freezes the allowed exercise and branches before play. The existing release-transaction design applies to every later delivery.

The current implementation only displays/confirms manually seeded source-linked statements and records that confirmation. It has no diagram/document parser, typed environment/pathway model, reconciliation editor, generator, exercise engine, AI interpretation or AAR output. Extend the existing contracts/services only at the corresponding work checkpoint; this design update creates none of those modules.

The first slice uses a synthetic profile and prepared inject. Build only the profile/definition, approval/release, participant projection, response and durable activity boundaries it needs. Intake workers, AI coordination, retrieval and reporting come later; no speculative module directories are needed now.

The separate [organisation package](organisation/example-sme-01/README.md), authorised under ADR-019/020, is authored context documentation. Its master register supplies a common brief/reference and role-specific baseline cards; author-only provenance, name checks, legal analysis and knowledge allocation remain separate. Role cards are not a common bundle or approved exercise RACI. This file separation does not implement participant projection or release approval; future delivery must enforce recipient-specific selection server-side. The register is not an application schema, imported profile or replacement for `src/server/fixture.ts`; company authority is not TTX access authority. Scope is in [PROJECT](PROJECT.md#organisation-foundation), and verification/status remain in WORK.

### Shared contract and release design

The initial scaffold uses application-owned TypeBox JSON Schemas with inferred TypeScript types, strict AJV validation on the server, interpreted TypeBox validation in the browser (without weakening CSP) and explicitly projected API responses. Only profile read/confirmation, identity and profile activity are implemented in TASK-001A/B; release/run contracts remain later work.

During scaffolding, define executable schemas once in an application-owned contracts module. UI, API, persistence mapping and future AI parsing consume or derive from that source. Section 6 is a conceptual inventory, not an executable schema.

Specify stable IDs and immutable profile/definition/inject revisions; run and membership references; allowlisted participant payloads; approval actor, content hash/revision, recipients and expected run revision; release idempotency keys; response author/team and released-inject reference; ordered event IDs and timestamps. Validate references as well as fields, and represent unknown values explicitly.

Release checks authority, run state, definition membership, eligibility, content revision and recipients in the authoritative transaction. Approval, release, inbox and activity changes commit consistently. A repeated successful idempotency key returns its existing result; reuse with different content fails. Concurrent requests check expected run revision. Participant projections exclude private material server-side. Restarted interrupted runs remain paused until explicitly resumed.

### Exercise-based implementation ownership

Updated under ADR-012, ADR-014 and ADR-015. [PROJECT](PROJECT.md#ownership-and-exercise-scope) owns the assignment: the user implements the technical exercise end to end; the other worker handles the operational exercise. Both are workstreams of the TTX Platform, whose title, sign-in and shared interface branding are track-neutral. The current single-application scaffold supports the technical workstream; an explicit "Track: Technical" context label is not the product name. Operational implementation and shared integration contracts still need agreement; do not add a nonfunctional track selector or claim operational support. ADR-006/007 cover the local Docker scaffold; WORK records installed and tested behaviour.

| Technical area / owner | Responsibilities | Suggested locations once needed |
| --- | --- | --- |
| Backend / user | HTTP API, identity and membership checks, application rules, SQLite persistence, activity, AI jobs and provider adapter, integration tests | `src/server/`, `src/server/adapters/`, `tests/server/` |
| Frontend / user | Profile review, facilitator and participant views, API client, loading/error states, accessible interactions and UI checks | `src/ui/`, `tests/ui/` |
| Contracts and integration / user | Executable request/response schemas, generated types/API description where practical, synthetic response examples, error codes, contract changes and end-to-end checks | `src/contracts/`, `tests/fixtures/` |

These paths are a proposed minimal layout, not directories to create in advance. Frontend and backend remain separate application boundaries despite having one owner. Backend-only profile evidence and facilitator records must not be bundled into participant-facing types or payloads. Share contracts between layers, not server implementation or secrets.

The user coordinates technical root package configuration, lockfile and contract changes. Integrate one behaviour at a time. Frontend mocks use the same reviewed synthetic examples and schemas as backend checks; mocks are not evidence that permissions or persistence work. Run a real browser-to-server check at every checkpoint. If cross-workstream collaboration is agreed later, define the exact shared artefacts and interface ownership first, use separate Git checkouts/branches and local test data, and do not edit the same synchronised working directory from two machines.

### Screen storyboard - 20 September 2026

Historical screen concepts: ADR-016 supersedes this storyboard's intake-before-track preparation order. ADR-021 restores ingestion and grounded generation and makes coaching supplementary. The [24 September workflow](diagrams/ttx-five-inject-workflow.svg) retains useful five-position and approval concepts but does not fully specify the reconciled Form B workflow above. The nine screens and Figma copy remain layout references, not current navigation specifications. Their redesign will use the pending readiness specification; no Figma update is implied by local requirements changes.

The [editable Excalidraw storyboard](diagrams/ttx-screen-concepts.excalidraw), [SVG](diagrams/ttx-screen-concepts.svg) and [PNG preview](diagrams/ttx-screen-concepts.png) show nine desktop screen concepts for the TTX Platform. An [editable Figma copy](https://www.figma.com/design/4oCPzxBPHnEpsp4qRz2YV3?node-id=1-2) in 2301777's team preserves the imported text/vector layers; changes there do not automatically update the local scene or exports. These are design artefacts, not screenshots, implemented navigation or approval of new requirements. The proposed shared sidebar is not present in the current application. WORK records verification, earlier integration failures and the successful upload.

| Screen | Design status |
| --- | --- |
| 01 Workspace sign-in | Existing capability, simplified layout concept |
| 02 Organisation intake | Planned synthetic network/BCP/DRP input and upfront SOC/MSSP context |
| 03 Profile review | Existing evidence/confirmation capability, simplified layout concept |
| 04 Exercise setup | Planned separate-track selection and reference/membership readiness |
| 05 Package review | Planned five-slot review layout; no inject content generated |
| 06 Facilitator control | Planned paused/recovered-run example with release unavailable |
| 07 Participant response | Planned released-content-only view and initial agreed answer |
| 08 Coached retry | Planned criterion-linked feedback and second/final answer |
| 09 After-action review | Planned evidence-linked report layout, subject to the supplied template |

The technical track is an example context within neutral product branding. Detailed operational screens and cross-workstream contracts remain unagreed. Pending RACI mappings, rubric thresholds and AAR sections are not invented. Captions distinguish illustrative state from observed activity; preparation, release and report-sharing controls are design proposals, not evidence of runtime enforcement. Mobile layouts, interactive prototypes and the full set of error/loading states remain subsequent design work.

`node docs/diagrams/generate-screen-concepts.cjs` regenerates the editable scene and its screen index using only Node built-ins. SVG/PNG are separate Excalidraw exports and must be refreshed after scene changes. The generator is a documentation utility, not an application dependency or part of the container runtime. Editable native vectors keep the storyboard portable without a Figma plan upgrade; maintaining matching exports is its small additional cost.

### Scaffold dependencies and runtime

Exact direct versions live in package.json; package-lock.json freezes transitive resolution. Node 24.19.0 in the Debian slim image is the container baseline. Do not update the image/packages silently; rebuild and rerun verification when updating them.

| Choice | Purpose and alternative | Maintenance cost |
| --- | --- | --- |
| React / React DOM, Vite and React plugin | Profile review UI and static build; a plain HTML UI would reduce dependencies but diverge from the planned React workflow. | Browser/build compatibility and dependency/security updates; no separate production frontend server. |
| Fastify, static and cookie plugins | One HTTP boundary, static assets and cookie parsing; native HTTP would require more routing/validation plumbing. | Keep plugins compatible with Fastify; explicitly reject extra input fields rather than silently stripping them. |
| TypeBox, AJV and ajv-formats | JSON Schema plus inferred types, strict boundary/stored-fixture validation; manually duplicated interfaces or a second schema library were rejected. | Pin the schema dialect and format behaviour; compile only application-owned schemas, never supplied schema/code. |
| Node built-in SQLite | Short local transactions without native npm compilation; better-sqlite3 is the alternative if the runtime API proves unsuitable. | The SQLite API is coupled to the selected Node runtime; isolate it behind the store and test on the pinned image. Synchronous writes are appropriate only for this small single-host demonstration. |
| Lucide React | Familiar interface icons rather than custom icon drawing. | Small UI dependency; import only used icons. |
| TypeScript, tsx and type packages | Type checking, backend build and test execution. | TypeScript 6.0.3 is selected within typescript-eslint's supported range, rather than unsupported TypeScript 7. |
| ESLint / typescript-eslint and Prettier | Actual lint and formatting checks. | Keep parser/compiler versions aligned; existing historical docs are not bulk reformatted. |
| Node test runner and Playwright | Deterministic contract/API/persistence tests and real browser verification. | Browser downloads exist only in the optional browser-test image, not the runtime image. No ordinary check depends on live AI. |

Docker Compose uses a named volume outside the source tree and publishes only a loopback port. No Git credentials, Docker socket or host home directory are mounted into the app. Initial generated access codes are stored with restrictive file permissions in that volume and are displayed only by an explicit local operator command, not server logs. Sessions expire and are invalidated on restart; durable profile confirmations remain. Host/container administrators still control this local prototype.

Profile revisions are immutable snapshots with a content hash; confirmation names the exact revision/hash, records the server-derived actor and commits an activity event atomically. Assumptions, unknowns and conflicts remain labelled after confirmation; confirmation accepts the bounded snapshot, not the truth of missing data. Duplicate confirmation returns the existing record; stale revisions and unauthorised identities fail. No profile evidence is returned to participants.

Documentation basis: [Docker Compose](https://docs.docker.com/compose/gettingstarted/), [Docker volumes](https://docs.docker.com/engine/storage/volumes/), [Fastify schemas](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/) and [Node SQLite](https://nodejs.org/api/sqlite.html). Runtime behaviour must still be checked on the pinned Node 24 image.

### Browser API contract

The [shared schemas](../src/contracts/profile.ts) now define the TASK-001A/B identity and profile boundary. This is the internal frontend/backend boundary, not an API handoff to the operational worker. Identity and profile routes below are implemented; release, run inbox/responses/activity and AI routes remain sketches for later checkpoints. The frontend talks only to the TTX API. The server derives the actor from its session; request bodies cannot select authority.

| Checkpoint | Route sketch | Contract purpose |
| --- | --- | --- |
| Identity | `POST /api/session`, `DELETE /api/session` | Validate generated access code or revoke the current session |
| Profile | `GET /api/me` | Current demonstration identity; no exercise memberships are implemented yet |
| Profile | `GET /api/profiles` | Profiles the authenticated facilitator may review |
| Profile | `GET /api/profiles/:profileId/activity` | Authorised profile confirmation activity |
| Profile | `GET /api/profiles/:profileId/revisions/:revisionId` | Authorised profile review projection with explicit unknowns |
| Profile | `POST /api/profile-confirmations` | Confirm an exact profile revision; return durable confirmation |
| Release | `POST /api/runs/:runId/approvals` | Approve exact reviewed inject revision and recipients against expected run revision |
| Release | `POST /api/runs/:runId/releases` | Release with approval reference, expected run revision and idempotency key |
| Participant | `GET /api/runs/:runId/inbox` | Only releases accessible to the authenticated participant |
| Participant | `POST /api/runs/:runId/responses` | Record agreed response referencing an accessible release |
| Activity | `GET /api/runs/:runId/activity` | Facilitator activity projection with ordered event IDs and pagination |
| Proposed bounded AI experiment under ADR-021 | `POST /api/ai/inject-proposals` | Grounded draft feasibility sketch, not a complete package-generator contract |
| Proposed AI job boundary | `GET /api/ai/jobs/:jobId` | Version-bound draft/interpretation job status; precise output contract remains to be reviewed |

Use a consistent safe error envelope with a stable code, user-facing message and optional field errors. Specify unauthenticated, forbidden, validation and stale-revision conflicts in contracts. Duplicate release retries with the same payload return the original result; key reuse for different content is a conflict. List/read routes for reviewing definitions and approvals, and lifecycle commands, must be specified in their checkpoint before their screens depend on them. This is not the complete MVP API.

### Proposed Codex adapter experiment

Requirements clarification, 29 September 2026 (ADR-021): organisation-grounded generation and response interpretation are required capabilities. TASK-002 uses bounded synthetic cases to evaluate the adapter and output controls before full ingestion/generation integration. A manually prepared profile can support that feasibility test, but does not establish Form B extraction or package-generation acceptance. API sketches remain provisional; provider details below are dated research and require fresh verification before implementation.

Intended adapter boundary: facilitator UI -> TTX API -> bounded AI job -> backend adapter -> validated proposal -> facilitator review. The existing approval/release transaction remains the only path to participant inbox availability. A Codex tool approval is never a TTX release approval.

Official protocol basis, checked 15 September 2026: `codex app-server` supports stdio. Complete `initialize` / `initialized`, inspect `account/read`, and use managed `account/login/start` with `type: chatgpt` when needed. Start a thread and `turn/start` with an application-owned `outputSchema`. Collect final output and check the terminal `turn/completed` status; it can indicate failure or interruption. Pin the CLI and generate matching protocol types. The documentation labels app-server experimental and unsupported for production workloads. [Official app-server documentation](https://learn.chatgpt.com/docs/app-server)

Subscription sign-in and API-key billing are separate access modes; an unavailable subscription must not silently fall back to paid API usage. [Official authentication documentation](https://learn.chatgpt.com/docs/auth)

Application design to prove in the experiment:

- Backend supervises one local process through private pipes, with bounded message sizes, correlated request IDs, timeouts, cancellation and exit handling. Windows executable resolution and process cleanup require testing.
- Operator signs in locally through the managed flow. Keep credentials and provider history outside source control/OneDrive. Frontend development and ordinary tests use a fake adapter; this plan does not grant the operational worker access to the user's account. Do not copy account tokens or expose Codex's general protocol to the browser.
- Use an isolated runtime configuration and working directory, not the development repository or live database directory. Audit inherited instructions, plugins, hooks and MCP configuration. Enforce no model access to shell execution, application storage, credentials or delivery tools. A prompt saying "do not use tools", a read-only filesystem setting, or declining approval requests alone does not prove this boundary. Verify supported restrictions on the selected Windows build before connecting participant-supplied text; fail the experiment if the required isolation cannot be enforced.
- Supply only the selected synthetic profile snapshot, objective and allowed roles/assets. Start fresh context per independent generation job. Store request/profile/contract/prompt/model versions and the resulting draft provenance without logging secrets.
- Treat model output as untrusted data. Validate schema, references, bounds and profile revision; preserve unknowns; reject unsupported references. Human review still assesses plausibility and factual support.
- Persist an application job before requesting generation. Return `202` with a job ID; frontend polls initially. Proposed statuses: queued, running, succeeded, failed, cancelled. Success means a validated draft was stored, never approved or released. Show safe failure codes for rate limits, sign-in required, invalid output and provider unavailability.
- Bound concurrency to one generation for the initial experiment. Prevent accidental duplicate jobs, discard late results after cancellation and mark interrupted jobs explicitly on restart. Do not automatically replay uncertain provider requests. Manual play continues in every failure case.

### Five-inject coached workflow - 18 September 2026

Status: planned, not implemented. ADR-021 restores input-driven generation, retains five MSEL injects first and treats coaching as supplementary. [PROJECT](PROJECT.md#first-exercise-draft) owns the current rules; Form B's original 10-15 count is deferred. TASK-001's one-inject engineering slice and exact-revision release approval remain distinct from this integrated delivery.

[Editable Excalidraw diagram](diagrams/ttx-five-inject-workflow.excalidraw), [SVG](diagrams/ttx-five-inject-workflow.svg) and [PNG preview](diagrams/ttx-five-inject-workflow.png).

The diagram shows five injects in one selected track, not five technical plus five operational in one run. The user retains technical frontend/backend ownership; the other worker retains operational ownership. Track selection/integration is not implemented. Content still needs reviewed roles, criteria, threat references and AAR details. All inputs are synthetic. The dated diagram has not been redrawn for ADR-021: follow the text below for required ingestion, controlled pathway mapping, generation, three decision points and optional coaching.

Planned flow:
1. An authorised planner establishes purpose, one track, intended audience and initial scope. Both technical and operational product tracks remain discussion-based TTXs. Detailed operational requirements and integration still need agreement.
2. Ingest the agreed synthetic network-diagram format and supported text-based BCP/BIA/DRP when supplied. Preserve object/text locators and source revisions. Guided answers complete missing context; reviewed profiles may be reused. A guided-only/manual route does not replace the required ingestion demonstration. Participants need not have upload or profile-confirmation authority.
3. AI proposes source-linked information and targeted questions against the selected objectives. A human reviews facts, assumptions, conflicts and unknowns. Include relevant business services, assets/data, dependencies, impact and the SOC/MSSP operating model. Reuse shared facts; keep exercise assumptions separate. Asset criticality requires reviewer confirmation.
4. Refine objectives and scope from the available context. Confirm the exact profile revision and exercise plan separately, including role-to-user/team mapping, relevant references and evaluation approach. Context readiness is an application-owned check with recorded human decisions, not an inference from profile confirmation. Its detailed criteria and question/stopping rules await the user's specification. Unresolved essentials lead to more available evidence, revised scope, reviewed exercise assumptions/fictional context where appropriate, or a saved draft awaiting information.
5. Select a reviewed threat pattern and map its plausible entry/affected systems through confirmed dependencies to business impact and recovery decisions. Generate the five-position package from that profile/pathway with 3-4 functional roles, three key decision points, technical artefacts, expected actions and evaluation criteria. Review grounding and every permitted branch for objective coverage, eligibility and consistent consequences, then freeze the package. Each run presents one reviewed variant per position. Package readiness remains distinct from context readiness.
6. Brief participants with the approved context, roles and ground rules. Check run readiness, including assigned participants and the applicable package. A facilitator then approves each exact inject and its recipients. The application rechecks authority and run state at release, independently of AI assessment.
7. Route each task using the confirmed SOC/MSSP mapping and approved RACI. Bind responsible roles to actual responding users/teams; accountable/consulted/informed roles retain their distinct functions. RACI accountability does not automatically confer facilitator privileges. Capture the agreed response and distinguish information requests from assessed answer submissions according to the later reviewed interaction contract.
8. AI interprets the submitted decision/rationale, identifies present, missing or unclear expected actions and recommends an eligible reviewed follow-up with response evidence. The facilitator reviews the interpretation and branch selection; ambiguity cannot create an automatic pass or release. If supplementary coaching is selected, one insufficient initial answer may receive targeted guidance and one final answer; retain both attempts and unresolved findings. Select the next reviewed variant under the normal approval/release checks. A failed or unobserved action cannot silently become successful through progression.
9. Resolve all five slots, then gather attributed debrief feedback from participants and the facilitator. Draft the AAR from the activity/debrief record and approved template. A human verifies findings and improvement actions before sharing the appropriate participant report. Assign action owners and due dates; record later closure evidence rather than declaring proposed improvements complete. Early termination can yield a clearly labelled partial report; unresolved gaps must not be reported as passes.

Design boundaries: a risk matrix prioritises scenario risks; reviewed evaluation criteria support response interpretation. Neither is an executable user-supplied schema. Assess substantive decisions and justified alternatives, not answer length. Bounded scenario alternatives are required; adaptive coaching is supplementary. Freeze the criteria during a run and keep hidden criteria, future injects and facilitator evidence out of participant payloads.

For the supplementary coached mode, the backend counts accepted answer submissions, not HTTP retries or model calls. Persist the answer/attempt before evaluation; a provider failure leaves evaluation pending and does not consume another answer. Human review reassesses the same evidence without resetting the two-answer limit. Record sufficient initial/coached answers and unresolved findings separately; earlier coaching can influence later attempts. Core uncoached play records agreed decisions and reviewed outcomes without requiring a retry or forced pass. All five positions need recorded outcomes for normal completion; the AAR retains the actual evidence and training conditions.

For AI-assisted stages, treat subscription-backed Codex as an adapter feasibility path, not an unlimited or already-working runtime. Managed ChatGPT authentication is documented separately from API-key usage; limits and data-handling arrangements still apply. Local file access depends on the host's tools and permissions, and file parsing remains a separate capability to validate. See [authentication](https://learn.chatgpt.com/docs/auth), [usage limits](https://learn.chatgpt.com/docs/pricing) and [app-server](https://learn.chatgpt.com/docs/app-server).

Recommended continuity design: the backend owns versioned profiles/reference packs, run state, all attempts/hints, assessments and human decisions. Build a bounded context packet for every AI request from those records. An optional per-run `memory.md` is only a derived summary with record/version references, rebuilt or checked against authoritative data before use. Do not rely on an agent remembering to update it, global cross-chat memories or context compaction for transactional correctness. This creates no competing repository MEMORY document; live exercise data remains outside the synchronised source tree. Give the runtime selected read-only material, not unrestricted folder, credential or database access. [OpenAI's memory guidance](https://learn.chatgpt.com/docs/customization/memories) likewise distinguishes recall from required guidance.

Positioning: support exercise practice and review evidence relevant to Cyber Trust, not automatic certification or proof of real recovery. The [current CSA certification page](https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-certification-for-organisations/cyber-trust/certification-for-the-cyber-trust-mark/) points to Cyber Trust (2025); the 2022 version ceased use in February 2026. Map the selected objectives to the [2025 clauses](https://isomer-user-content.by.gov.sg/36/2cff8d23-0f79-4477-9629-377d3bccbcaf/cyber-trust-v202504.pdf), and do not treat a five-inject result as Advocate-tier attainment.

---

### Bounded adaptation design - 24 September 2026

Planning under ADR-017/021 and [REQ-018](PROJECT.md#bounded-adaptive-injects); no branch engine or contracts are implemented. Preserve the five-position first delivery, three key decision points and approved learning objectives across every permitted path. Adapt scenario consequences and later information, not the objectives or standards to make an answer pass.

1. During preparation, generate and review bounded variants at the three key decision points. Each records its intended objective, eligible preceding state/response conditions, consequences and route to later positions. Check every complete path for the agreed learning opportunities and closure without cycles, extra positions or unrelated events. The decision-point count is fixed; their locations, alternative limits and content still need review.
2. Use the team's recorded agreed response and the package's progression conditions to select the next variant. Build AI context from the immutable profile/package, released variants, response evidence and scenario consequences. When coaching is enabled, apply its final-outcome/two-answer rule and preserve both responses. A grading label alone cannot establish an action; tabletop decisions and simulated consequences are distinct from observed execution on real systems.
3. The application determines eligible alternatives. AI recommends a candidate with response evidence and rationale, or abstains; the facilitator confirms the choice. Persist the selection, conditions/evidence used, human decision and revisions. Exact-content, recipient and run-state checks still apply at release. A retry or restart must not select or release a second variant for the same position.
4. Reconnect branches at common exercise stages using state-consistent variants. Retain impacts and unresolved issues in later injects and the AAR. If no reviewed variant fits an unexpected response, pause for review; do not invent a new live branch, force a correct answer or silently reset the incident. Material content/scope changes require revised package review and fresh release approval.
5. On AI failure or uncertainty, the facilitator can select an eligible reviewed alternative with a recorded reason, or pause. Evaluation uncertainty remains visible and does not become an automatic failure, recovery or progression. Participant views expose only released material, never the alternative graph or private grading evidence.

The AAR records the actual path and its rationale alongside first-attempt/coached outcomes and unresolved findings. Compare criterion-level evidence with the path's learning opportunities; different consequences do not justify unqualified aggregate comparisons. See [QUALITY](QUALITY.md#bounded-adaptation-cases) for planned checks.

### ENISA adaptation and implementation boundaries - 22 September 2026

Planning decision: ADR-016. Requirements: [PROJECT](PROJECT.md#exercise-preparation-and-review-flow). The user's detailed readiness specification remains pending. This section records structure and responsibility, not checklist criteria or an AI grading rubric.

Reference: ENISA, *The ENISA Cybersecurity Exercise Methodology*, version 1.0, February 2026 ([official publication](https://www.enisa.europa.eu/publications/the-enisa-cybersecurity-exercise-methodology)). The supplied local copy is in the ignored references folder. Page numbers below are printed pages, one less than the PDF page index counted from one. This adaptation uses the lifecycle and objective/evidence relationships; it does not import EU duties, national-exercise staffing or planning-duration estimates as SME prerequisites.

| ENISA basis | Platform adaptation |
| --- | --- |
| Initiation, sections 1.1-1.5, pp. 9-18 | Purpose, exercise focus, context and feasibility before detailed preparation |
| Design, sections 2.1-2.3, pp. 20-23 | Objectives, scope, dependencies, audience and roles refined from available context |
| Preparation, sections 3.1-3.3, pp. 27-35; Figure 8, p. 31 | One scenario and ordered injects with recipients, expected decisions, evaluation criteria, evidence and a player briefing |
| Execution, sections 4.1-4.3, pp. 39-43 | Readiness checks, controlled release, recorded responses/interventions and debrief feedback |
| Evaluation, section 5.2, pp. 48-49 | Human-reviewed, evidence-linked AAR with limitations |
| Moving forward, section 6.2, pp. 53-55 | Prioritised actions with owners, due dates, status and later verification |

ENISA distinguishes discussion-based and operation-based formats (section 1.2). Our technical and operational tracks both use the discussion format. The supplementary two-attempt coaching model is a declared learning adaptation: keep initial and coached outcomes separate, account for prior hints, and do not equate discussion with executed actions. Core Form B assessment must also work without coaching; neutral observation is a reason to disclose training conditions.

Maintain three distinct kinds of records when their implementation is authorised:

- Organisation profile: versioned, reusable source-linked information, including uncertainty, selected services/assets, dependencies, ownership and impact. Sources are evidence, not executable instructions. Guided answers are attributed sources; absent files do not prove absent plans.
- Exercise plan: purpose, selected track, objectives, scope, participants/role mapping, reference versions, evaluation approach and exercise-only assumptions. Revising a plan does not overwrite the organisation profile.
- Readiness decisions: context, package and run decisions tied to their applicable profile/plan/package and checklist revisions, reasons, unresolved items and reviewer. Changing dependent revisions requires re-evaluation. Confirmation alone does not unlock drafting or play.

The backend owns authoritative state and application checks. AI proposes extracted information, targeted questions, drafts and evidence-linked assessments. It cannot invent missing facts, approve its own readiness result or change review rules. A persistent reviewed profile supplies task-specific AI context; conversational recall is not the authoritative organisation memory. An uncertainty may intentionally be exercised only when the approved objective and evaluation criteria support that choice.

Implementation map (all additions below remain planned):

| Existing area | Later change |
| --- | --- |
| `src/contracts/profile.ts` | Extend the statement scaffold with typed systems, zones/connections, services, dependencies, roles, third parties, RTO/RPO and recovery priorities. Specify diagram/BCP/BIA/DRP source contracts and candidate reconciliation; preserve provenance and synthetic-only constraints. `setup` supports attributed answers conceptually, not an implemented questionnaire. |
| `src/server/profile-service.ts` | Keep revision-specific confirmation. Add separate objective-dependent readiness operations only after reviewing the user's specification. |
| `src/server/storage.ts` | Persist exercise plans and readiness decisions as version-bound records; preserve confirmations and existing demonstration data through deliberate migrations. |
| `src/ui/main.tsx` | Add exercise intention ahead of detailed intake and separate confirmation/readiness displays in future checkpoints. Operational availability depends on agreed cross-workstream integration; do not add a working-looking unsupported route. |
| Planned pathway/package/run/review features | Bind confirmed profile/pathway, objectives, injects, criteria and evidence; preserve package and release approvals, debrief attribution and action ownership. Retain attempt/coaching history when that supplementary mode is used. |

The first next engineering checkpoint remains TASK-001C with a manually reviewed deterministic fixture. Full AI profiling, document ingestion and the readiness engine are separate dependent work. No broad schema expansion or runtime behaviour is implemented by this planning update.

Diagram maintenance: `node docs/diagrams/generate-five-inject-workflow.cjs` regenerates the dated 24 September scene/SVG; its PNG is a rendered preview. It does not yet encode the complete ADR-021 reconciliation. Follow PROJECT and this document for current requirements/design. The screen storyboard/Figma copy and HTML illustration are also historical views; regenerating an old layout does not bring it into alignment automatically.

---

Status: historical proposed design for review, 9 September 2026. At that date no platform implementation had started; current implementation status is recorded above and in WORK.

The historical sections below retain useful design detail for the Form B workflow restored by ADR-021. Their original 10-15 count is superseded for the first delivery by the user's five-inject exception; three key decision points remain required. Current PROJECT and the workflow above take precedence over older stack, hosting and sequencing recommendations.

Recommendation: a web-first, single-organisation prototype with a Node.js/TypeScript modular backend. AI assists preparation and interpretation. Application rules and recorded human approvals control what becomes an organisational fact, an exercise definition, a delivered inject, or a final finding.

## 1. Architecture diagram

```mermaid
flowchart TB
    UI["Web workspaces<br/>Planner / facilitator / participants"]

    subgraph APP["Approved application host - Node.js / TypeScript"]
        API["Authenticated API<br/>Exercise membership and role checks"]
        PREP["Preparation<br/>Safe intake, extraction and profile review"]
        DESIGN["Exercise design<br/>Threat and impact mapping, scenario and MSEL"]
        PACKAGE["Package approval<br/>Freeze reviewed content and branches"]
        RUN["Exercise engine<br/>State, branch eligibility and release approval"]
        REPORT["After-action review<br/>Observed evidence, findings and actions"]
        AI["AI coordinator<br/>Scoped context, structured output and validation"]
        STORE[("SQLite<br/>Versioned records, jobs, inboxes and audit events")]
        FILES["Protected file store<br/>Sources, synthetic artefacts and exports"]
        LIBRARY["Curated reference library<br/>Guidance, incident patterns and templates"]

        API --> PREP
        PREP -->|"User-approved profile"| DESIGN
        DESIGN --> PACKAGE
        PACKAGE -->|"Approved definition"| RUN
        RUN --> REPORT
        API <--> RUN
        API <--> REPORT
        API <--> STORE
        API <--> FILES
        LIBRARY --> DESIGN
        LIBRARY --> AI
        PREP -.-> AI
        DESIGN -.-> AI
        RUN -.-> AI
        REPORT -.-> AI
    end

    UI <-->|"REST commands and role-filtered event stream"| API
    AI <-->|"Permitted context only"| MODEL["Approved AI service<br/>Internal endpoint, or explicitly approved provider"]
```

The preparation chain shows the lifecycle. API-to-storage edges summarise persistence through the application modules, not browser access to the database. Dashed edges represent bounded AI calls and their validated results, not permission to advance an exercise. The browser receives only its authorised view of records.

The model has no delivery credentials, database access, shell, production-system connection or approval authority. AI unavailability must not prevent manual execution of an already approved package.

## 2. Requirements baseline

The supplied Form B is the primary working baseline, supported by the SME-focused slide content and research guide. This design does not establish that the proposal or technology choices have received formal supervisor approval.

| Project requirement | Architectural response |
| --- | --- |
| One representative SME and one technical scenario | One organisation per deployment and one active run for the MVP |
| One agreed diagram format, optional text-based BCP/BIA/DRP and guided questions | Format-specific parsers feeding a common source and candidate-fact model |
| Assets, connections, services, roles, suppliers, RTO/RPO and exclusions | Versioned organisation profile with typed relationships and source references |
| Missing information, conflicts, assumptions and user confirmation | Reconciliation workspace and explicit profile approval |
| 10-15 MSEL entries, 3-4 functional roles, three decision points | Bounded scenario definition with approved alternatives and a shared main storyline |
| Web delivery and agreed participant decisions | Role-specific inboxes plus actions, rationale and information-request submissions |
| Approve, edit, reject, override, pause and manual continuation | Server-enforced state transitions and approval records independent of the model |
| Draft AAR and improvement actions | Report generation from a fixed exercise-record snapshot with evidence references |
| Controlled evaluation and school-safe demonstration | Synthetic reference pack, independent human labels, control tests and sanitised exports |

Sources: [Form B](../references/GPT_ICT4011_Form_B_AI_Assisted_TTX.docx), [supervisor slides](../supervisor_AI%20TTX%20Idea.pptx), [research guide](../capstone_ttx_reference/AI_TTX_Research_Guide.md). The latter two are historical local references and may be absent from a plans-only checkout. ADR-021 and the [alignment matrix](form-b-alignment.md) record the current source review and count exception.

Scope exclusions remain intact: no cyber range, exploit execution, malware deployment, production-system changes, autonomous attack activity, certification, proof of real recovery performance, production multi-tenancy, high availability or enterprise SSO. A scenario pathway is a reviewed hypothetical incident narrative, not a verified route into a real network.

### Source inconsistencies

- Some slide notes retain older CIIO/CCoP framing. Use the SME/Cyber Trust framing in Form B and the slide bodies. Do not import CII obligations or assume a Cyber Trust tier.
- Slide 6 mentions Slack discussion, while Form B and slide 7 specify a web interface. The MVP records agreed decisions in the web application. Slack/Discord integration and a participant chatbot are deferred.
- The research guide describes the local ENISA PDF as a 56-page extract. The actual file inspected has 72 PDF pages. Treat the guide's inventory as historical rather than authoritative file metadata.
- Existing AI assistance and adaptive delivery are prior art. The comparison below refines earlier platform claims without editing the supplied reference materials.

## 3. Comparison and reuse decision

T3SF was downloaded for read-only source inspection. The reviewed `main` snapshot is commit `182ddc9b7bf804e93bbfe9d3f2112d8c20f7fec6`, dated 30 October 2023. Inspection covered the README, changelog, core orchestration, GUI handlers and example MSEL. It was not installed or executed. INJECT was reviewed through official documentation on 9 September 2026, without deployment testing.

| Dimension | T3SF evidence | INJECT evidence | Capstone proposal |
| --- | --- | --- | --- |
| Delivery | JSON MSEL, timed orchestration, Slack/Discord adapters and polls | Web views and conditional milestone progression | Native web inboxes and one authoritative exercise state |
| Authoring | MSEL editing and example event/scenario content | Definitions with roles, objectives, inject alternatives and questionnaires | Draft an exercise from an approved SME profile, then review it |
| AI | Changelog documents a database of AI-generated events | Definitions describe email/free-form LLM assessment; the LLM page focuses on sandbox hints | Grounded drafting and interpretation with approved follow-ups |
| Control | Pause/resume/stop controls | Instructor interaction and conditional progression | Package approval plus separate approval for every release |
| Technology | Python orchestration and Flask GUI in inspected source | Go backend, React/TypeScript frontend, GraphQL and REST; Linux/Docker Compose installation | Node.js/TypeScript backend, React frontend and local persistence |
| Reuse | Repository identifies GPL-3.0 | Official license page identifies MIT | Review actual component and content licenses before copying |

Evidence: [T3SF README](https://github.com/Base4Security/T3SF/tree/182ddc9b7bf804e93bbfe9d3f2112d8c20f7fec6), [changelog](https://github.com/Base4Security/T3SF/blob/182ddc9b7bf804e93bbfe9d3f2112d8c20f7fec6/CHANGELOG.md), [INJECT architecture](https://docs.inject.muni.cz/tech/architecture/overview/), [installation](https://docs.inject.muni.cz/tech/installation/overview/), [definitions](https://docs.inject.muni.cz/tech/architecture/definitions/), [milestone logic](https://docs.inject.muni.cz/INJECT_process/specify/milestone_logic/), [LLM integration](https://docs.inject.muni.cz/tech/llm-integration/), [license](https://docs.inject.muni.cz/license/).

Do not describe T3SF as having no AI, or infer project-wide abandonment solely from the reviewed commit date. INJECT documents assessment-related definition fields and corresponding [evaluation log records](https://docs.inject.muni.cz/tech/log-format/), but their behaviour in a specific release was not verified. The hints page is not evidence that assessment is absent elsewhere.

### Recommended reuse boundary

A small independent core is a scope and environment recommendation, not a claim that rebuilding everything is better. Form B names Node.js and approved internal services. The MVP does not require a larger platform's sandbox, communications or multi-exercise feature set.

Adopt T3SF's separation between an exercise definition and its delivery channel. Adopt INJECT's separation between definitions and running exercises, explicit conditions, role-aware content and exercise records. Keep three bounded decision points that reconnect to a main storyline rather than multiplying complete scenarios. These are design inferences, not compatibility claims.

An INJECT extension remains a credible alternative if the organisation already supports its deployment. It would retain our profile preparation and evidence model, then require a versioned definition exporter and proof that its integration enforces the required release approvals. A T3SF adapter is more relevant if Slack/Discord becomes mandatory. Neither should become a second simultaneous implementation track.

The contribution to evaluate is the complete, traceable SME document-to-exercise-to-improvement workflow, including human approval enforcement and bounded interpretation. Do not claim to invent adaptive TTXs or AI assessment.

## 4. End-to-end workflow

### Prepare the organisation profile

The planner defines scope and uploads the agreed diagram format and any supported continuity documents. Intake checks type, size and structure before parsing. Original files remain versioned. Extracted passages and diagram objects retain page, paragraph or cell locators.

Parsers recover structure; AI may propose semantic interpretations. A diagram connection is not automatically a business dependency, a trust relationship or an exploitable path. Store those relationship types separately. Missing details remain unknown rather than being inferred as organisational facts.

The review workspace shows candidate facts beside evidence, missing fields, conflicts and explicit assumptions. Guided answers become new source records. User approval freezes a profile revision. Corrections create another revision and invalidate affected drafts rather than silently changing an approved exercise.

### Design and approve the exercise

The designer matches the approved environment to a small curated incident-pattern library. Patterns contain applicability conditions, required assumptions, plausible disruption, decision objectives and synthetic evidence templates. They contain no executable attacks or production integrations.

AI drafts the scenario, objectives, MSEL and expected-action explanations within that context. Application checks cover IDs, roles, asset references, source references, chronology, artefact consistency, branch reachability and scope limits. A valid citation ID does not prove that a passage supports a claim; semantic review remains necessary.

The facilitator reviews the package, rubric, reasonable alternatives and three decision points. Approval freezes the definition and records the reviewer. Each run permanently references that definition version.

Proposed counting convention: 10-15 MSEL timeline entries, with alternative payloads attached to existing decision-point entries instead of separate complete storylines. Confirm how alternatives count toward the assessed inject total before content freeze.

### Conduct the exercise

Participants see only released evidence for their assigned role or shared team channel. Their group submits agreed actions, rationale and information requests. A designated submitter can record the collective decision; informal discussion is not automatically treated as the team's final answer.

The engine determines eligible branches from the approved definition and current state. AI interprets the submitted response against the rubric and those candidates. It returns evidence-linked observations and a suggested branch, or abstains. An unmentioned action is not observed, not automatically incorrect.

The facilitator can accept, select another eligible approved branch, reject, request clarification, or continue manually. A timing trigger makes an inject ready for review; it does not release it. Manual override bypasses the AI recommendation, not authorisation, definition membership or state validation.

### Review and improve

The evaluator reviews observations and participant feedback. AAR generation uses a fixed snapshot of the recorded exercise, not an AI reconstruction. Findings link to objectives, actual responses/observations, injects and relevant plan sections where available.

The reviewer confirms or corrects the report and action list. Actions record an owner, target date, status and eventual closure evidence. Recommendations do not overwrite plans or mark remediation complete. Keep this an action register, not a separate project-management product.

The platform can support discussion of selected Cyber Trust B.21.4/B.21.5 requirements and relevant continuity context. It cannot certify the organisation, prove restoration within an RTO/RPO, or represent a simulated supplier as an actual participating third party. Define evaluation before play, consistent with the local ENISA methodology sections 3.2 and 5.2.

## 5. Runtime approval sequence

```mermaid
sequenceDiagram
    actor P as Participant team
    participant API as Application API
    participant E as Exercise engine
    participant AI as AI coordinator and approved model
    actor F as Facilitator
    participant DB as State and audit store

    P->>API: Submit agreed actions, rationale and requests
    API->>DB: Store authorised, versioned response
    API->>E: Interpret response for current run revision
    E->>AI: Approved rubric, response and eligible branches
    alt Valid suggestion
        AI-->>E: Structured interpretation and candidate branch
        E->>DB: Store suggestion, evidence and model metadata
        E-->>F: Present suggestion for human review
    else Unclear response or unavailable AI
        E-->>F: Present manual choices or clarification
    end
    F->>API: Approve exact content and recipients, or choose manually
    API->>E: Authenticated release command and expected revision
    E->>DB: Recheck running state, eligibility and approval; commit atomically
    DB-->>API: Stable release ID and committed inbox entries
    API-->>P: Publish role-filtered event notification
    P->>API: Fetch authorised inbox; optionally acknowledge viewing
```

The database commit is authoritative. Persist approval, exact payload revision, recipients, state change, release record and audit event in one transaction. The event stream notifies browsers about committed inbox data. Viewing an inject is a separate fact from the server releasing it.

Use a release idempotency key and expected run revision. Repeated clicks cannot create duplicate releases. Approval becomes stale when its content, recipients, triggering response or required state changes; recheck at commit, not just when the review screen opens.

Paused and completed runs reject releases. Restarted interrupted runs enter recovery-paused state until the facilitator resumes; overdue injects are not automatically sent. Keep UTC timestamps, elapsed exercise time and fictional scenario time separate.

Editing approved content creates a new reviewed revision. Structural changes to branches, prerequisites or objectives require a pause, validation and renewed package approval. Never silently rewrite already released content or historical records.

## 6. Data and evidence model

| Record | Essential content |
| --- | --- |
| SourceDocument / SourceSegment | Hash, revision, classification, parser version, extracted text and page/paragraph/diagram-cell locator |
| CandidateFact / ProfileVersion | Entities, typed relationships, values and units, evidence, conflicts, unknowns, assumptions and human confirmation |
| ReferenceItem / IncidentPattern | Publication/version/locator, permitted use, prerequisites, synthetic templates and reviewer |
| ExerciseDefinitionVersion | Profile version, scenario assumptions, objectives, roles, MSEL, artefacts, rubrics and branch graph |
| ExerciseRun / Membership | Definition version, role assignments, state revision, exercise clock and status |
| ParticipantResponse / Observation | Author/team, agreed response revision, released inject, rationale, requests and evaluator notes |
| AISuggestion / AIJob | Input versions, task/prompt/model version, retrieved source IDs, validated result, failures, latency and reviewer disposition |
| Approval / Release / AuditEvent | Actor, action, content hash, recipients, state preconditions, stable release ID and ordered event sequence |
| AARVersion / Finding / Action | Evidence snapshot, objective/response/source links, review, owner/date/status and closure evidence |

Separate published guidance, organisation-supplied facts and approved synthetic exercise content. Retrieval filters by collection, organisation, exercise, revision and access permissions. Publisher examples cannot become SME facts. Future injects and answer keys cannot enter participant-visible retrieval.

Start with source IDs, metadata filters and ordinary full-text search. Add embeddings only if held-out retrieval tests justify them. A separate vector or graph database is unnecessary for the initial scope; typed entities and edges can be stored relationally.

Preserve the research guide's distinct evidence dimensions: source availability, document support, exercise coverage, operational verification and human review. Do not collapse them into a compliance score.

## 7. Technology and deployment proposal

These are recommendations, not installed dependencies or final procurement decisions.

| Layer | Proposed choice | Reason and boundary |
| --- | --- | --- |
| Browser | React, TypeScript and Vite | Separate role-specific views within one application |
| API | Node.js, TypeScript and Fastify | Fits the documented environment; one modular backend, not microservices |
| Contracts | Application-owned JSON Schema and a proven validator | Validate requests, model results and exercise definitions; never compile uploaded schemas as code |
| Runtime logic | Explicit state machine and typed branch predicates | Deterministic transitions; no generated code or general-purpose expression evaluation |
| Persistence | SQLite, migrations and short transactions | One host and low write concurrency |
| Background work | One bounded worker with durable job records | Extraction/generation off interactive request paths; no Redis required initially |
| Parsing | Vetted format-specific parsers in a restricted process | Assigned files only, bounded resources, no macros or remote resource retrieval |
| AI | Adapter for the approved endpoint | Internal permissions determine data handling and model choice |
| Updates | Server-sent events, REST writes and polling fallback | Reconnectable notifications; database inboxes remain authoritative |
| Exports | Reviewed AAR, CSV/JSON records and printable package | Preserve evidence and manual exercise materials |

[Fastify documents schema-based validation](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/) and warns that schemas are trusted application code. [SQLite documents application-local deployment](https://www.sqlite.org/whentouse.html) and its single-writer trade-off. These support, rather than prove, the proposed choices.

The API owns authoritative writes. Workers receive bounded inputs and return draft results through an internal interface; they cannot release injects. Parser processes receive only assigned files, no model credentials, database access or network access. AI requests and parsing have separate privileges. Crash recovery reclaims abandoned jobs without repeating an authoritative state change.

```mermaid
flowchart LR
    B["Participant and facilitator browsers"]
    subgraph H["One approved laptop or internal host"]
        ENTRY["Application origin<br/>TLS for non-loopback access"]
        APP["Node.js application<br/>UI, API and event stream"]
        WORKER["Bounded background work<br/>Restricted parser subprocess"]
        DB[("SQLite on local disk")]
        FS["Protected local files"]
        ENTRY --> APP
        APP <--> WORKER
        APP <--> DB
        APP <--> FS
    end
    B <-->|"Approved network route"| ENTRY
    APP <-->|"Allowed AI requests only"| LLM["Approved model endpoint"]
```

A local-only demonstration can use loopback. Separate devices require an approved LAN/internal route, authentication and TLS. Docker is optional packaging, not an MVP prerequisite. Multi-host scale would require revisiting persistence and deployment.

The current source repository is in OneDrive. Keep live databases, uploads, credentials and exercise records in an approved non-synchronised data directory outside Git. Do not use the synced source tree as the runtime data store. Back up the database and corresponding versioned files consistently and test restoration; copying a live database file is not the backup strategy.

## 8. Security and failure controls

- Enforce authorisation on commands, source lookups, file downloads, reports and event subscriptions. Hidden panels are not access control. Client-selected role names cannot grant facilitator privileges.
- Treat files and participant text as untrusted. Use format allowlists, size/decompression limits, safe XML settings, resource limits and sanitised rendering. Do not follow uploaded links or execute content.
- Source passages provide evidence, not application instructions. Context separation and schema validation do not guarantee semantic correctness; human review remains necessary.
- Only the approved AI endpoint receives permitted, minimised context. Keep secrets on the server. Ordinary logs must not contain credentials or restricted content. Raw prompt/output retention requires a separate data-handling decision.
- Protect future injects, rubrics and sources server-side. Defer the participant chatbot rather than introducing another disclosure route into the MVP.
- AI timeout, malformed output, unsupported references or ambiguous interpretation leads to a visible failure/manual-review state. Bounded retries never silently choose a branch.
- Maintain an append-only audit trail through application operations, with corrections as new records. Do not claim it is tamper-proof against the host administrator.
- Use synthetic organisation/exercise inputs throughout development, demonstration and evaluation. Review school-safe exports separately, including their attachments and metadata.

## 9. Validation plan

Agree reference labels and acceptance thresholds before prompt tuning. Keep held-out examples separate from development data. Human reviewers identify acceptable alternatives and ambiguity; the evaluated model cannot be its own sole ground truth.

| Test area | Evidence required |
| --- | --- |
| Extraction | Field/relationship precision and recall, source-locator correctness, conflict handling and reviewer corrections |
| Grounding and scenario quality | Supported claims, valid profile references, plausible impacts, artefact consistency and reviewer usefulness ratings |
| Definition structure | Scope counts, roles, reachable branches, correct preconditions and bounded storyline complexity |
| Interpretation | Agreement with human labels, per-category errors, justified alternatives and appropriate abstention |
| Approval | Every release has a valid exact-revision approval; reject unauthorised, stale, duplicate, paused and completed-state commands |
| Information isolation | No unauthorised access to other roles' artefacts, future injects, rubrics, source documents or facilitator reports |
| Recovery | Manual play with AI offline, parser failure, recovery-paused restart, reconnect without duplicate release and backup restoration |
| AAR fidelity | Findings trace to actual evidence; no invented actions, measured-recovery claims or automatic remediation closure |
| Practical value | Preparation time, review effort, correction burden and feedback for the single SME scenario |

Deterministic controls are pass/fail requirements for the agreed test suite. AI-quality thresholds remain to be agreed with the reviewer. Report denominators, errors and limitations rather than a readiness percentage. One SME trial cannot establish population-wide effectiveness.

This supports Circular F2 D1.5, D3.1-D3.4 and D7.4 through evaluation, critique, justified decisions and traceable sources. No validation results are claimed at this stage.

## 10. Decisions before building

| Decision | Recommended starting point | What needs confirmation |
| --- | --- | --- |
| Diagram format | Uncompressed draw.io XML with stable page/cell IDs and a supported subset | Availability of representative diagrams and required visual semantics |
| Continuity formats | Text-bearing PDF and DOCX with manual completion | Parser/dependency approval and input size limits; OCR stays out of scope |
| AI service | Approved internal endpoint | Model/version, modalities, structured output, limits and data-handling permission |
| Hosting | One approved local/internal host | Local storage, allowed dependencies, TLS and participant network access |
| Scenario and rubric | Synthetic reference SME and one selected incident pattern | Reviewer approval of three decisions and acceptable alternatives |
| Inject counting | 10-15 timeline entries with bounded variants | Whether alternative payloads count separately for assessment |
| Reuse approach | Small independent core inspired by comparators | Revisit if supported INJECT deployment or mandatory Slack changes constraints |

draw.io documents an [uncompressed XML export option](https://www.drawio.com/docs/manual/export/export-to-xml/). This is a proposed input contract, not a claim that arbitrary diagrams contain reliable business semantics.

## 11. Order after design approval

1. Confirm input limits, data handling and acceptance criteria. Freeze a human-reviewed synthetic SME pack and small manually authored exercise baseline.
2. Build deterministic web play first: definitions, roles, inboxes, responses, approval transactions, pause/resume, audit and manual export. Complete a run without AI.
3. Add source ingestion, provenance, reconciliation and profile approval. Evaluate against known source facts before generation depends on it.
4. Add constrained package generation and facilitator review. Compare preparation effort and corrections against the manual baseline.
5. Add bounded response interpretation and branch suggestions. Demonstrate ambiguity, stale approval and AI outage without losing human control.
6. Add evidence-grounded AAR drafting, held-out evaluation, restore/export checks, documentation and handover.

This is a dependency order, not a replacement for the academic schedule. No implementation starts merely because this document exists.

## 12. Review record

| Material | Review and limits |
| --- | --- |
| Form B DOCX | Extracted requirements, scope, deliverables and environment constraints; no edits |
| Supervisor PPTX | Extracted all seven slide bodies and notes; not a visual-layout review |
| Research guide and bibliography | Reviewed workflow, evidence model, comparator references and unresolved internal approvals; not every listed source independently reviewed |
| Cyber Trust B.21/B.22 extract | Read all six PDF pages, printed pages 106-111; not a full scheme or certification review |
| ENISA methodology | Confirmed 72 PDF pages; read relevant preparation, MSEL, evaluation and reporting material including PDF pages 14, 28, 31, 32, 46 and 49 |
| Circular F2 | Read all four pages for evaluation, research, formulation and reporting requirements |
| T3SF | Downloaded and inspected pinned source; no execution or dependency installation |
| INJECT | Official documentation accessed 9 September 2026; no release source snapshot or runtime verification |

The exercise-pack ZIPs, reference spreadsheets and remaining PDFs were not exhaustively inspected. They are potential later content sources, not evidence for additional claims in this architecture.
