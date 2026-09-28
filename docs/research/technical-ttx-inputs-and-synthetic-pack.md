# Technical TTX inputs and synthetic SME package

Research date: 27 September 2026. Advisory research, not an approved readiness checklist, exercise package, rubric or implementation. [PROJECT](../PROJECT.md) owns scope; [ADR-018](../DECISIONS.md#adr-018---predefined-package-as-the-current-drafting-model) records the user's predefined-package direction. No real organisation records are needed or authorised for this prototype.

## Findings

Use one predefined, human-reviewed scenario and a bounded set of response-dependent variants. This changes where AI adds value: assessment, coaching, eligible-variant recommendations and evidence-linked AAR drafting, rather than generating the initial scenario package from SME environment inputs. Unrestricted live rewriting was already excluded under ADR-017. These remain planned capabilities, not implemented features.

BCP, IRP, network diagrams and threat modelling are useful inputs, but their titles alone do not establish sufficient information. The right question is whether participants have enough context to make and justify the decisions being exercised. A concise, internally consistent fictional pack can be sufficient for a bounded discussion exercise; a complete enterprise document library is not the target.

ENISA's February 2026 methodology organises preparation around purpose, objectives, scope, scenario, injects and evaluation. It supports responsive facilitation but does not prescribe this application's branching algorithm. Reviewed branching is our design choice, not an ENISA compliance requirement. [ENISA methodology and support toolkit](https://www.enisa.europa.eu/publications/the-enisa-cybersecurity-exercise-methodology)

NIST SP 800-84 distinguishes tabletop discussion from functional exercises and system tests. It includes facilitator/participant material, preplanned evaluation and after-action review. Technical personnel can discuss detailed procedures without executing them on live infrastructure. This is older exercise guidance (2006), not a current threat catalogue. [NIST SP 800-84](https://csrc.nist.gov/pubs/sp/800/84/final)

## Objective-dependent information

The following is a proposed planning aid. It does not replace the user's forthcoming readiness specification or set compulsory document formats, quantities or pass thresholds.

| Area | Useful information for the selected exercise | Why the four named documents may not cover it |
| --- | --- | --- |
| Exercise plan | Intended decisions, learning objectives, audience, duration, scope and exclusions | Organisation documents do not define what this exercise is evaluating. |
| Business impact | Critical services, service owners, important data, dependencies and impact of disruption | A network diagram alone does not explain which outage matters most. |
| Technical environment | Selected assets, identity/admin boundaries, network zones, cloud/on-premises connections and normal flows | Connectivity is not the same as trust, privilege or containment capability. |
| People and authority | Internal IT versus MSSP duties, escalation route, coverage, containment/recovery approval | An IRP may omit actual outsourced authority or availability. |
| Detection and evidence | Available alert/log sources, coverage gaps, retention and plausible synthetic excerpts | A plan may assume evidence or tools that the scenario never provides. |
| Response | Relevant IRP/playbook extracts, incident classification, evidence handling and containment choices | Generic plans may not resolve the selected technical decision. |
| Recovery and continuity | BIA/BCP priorities, DR sequence, dependencies, backup scope/isolation, restore constraints and supplied RTO/RPO | A backup schedule is not a recovery procedure or proof of a clean restore. |
| Threat rationale | Credible entry route, affected asset/data, relevant weakness and expected consequences | An exhaustive formal threat model is unnecessary unless the objective needs it; a short rationale may suffice. |

The inventory, dependencies, authority, logging and recovery categories are grounded in current incident-response guidance, particularly GV.OC/GV.RR, ID.AM, PR.DS/PR.PS and RC.RP. That guidance is not a universal TTX intake checklist. [NIST SP 800-61r3, April 2025](https://csrc.nist.gov/pubs/sp/800/61/r3/final)

For example, a proposed containment discussion needs to establish which service would be interrupted, who can authorise the action, what evidence supports it and how effectiveness would be checked. It need not include every firewall rule or full packet capture. A recovery objective needs richer backup/dependency context than an alert-escalation objective. These are design examples, not approved injects or scoring criteria.

Do not penalise participants for failing to discover information the exercise never made available. Distinguish not supplied, unknown and confirmed absent. A deliberately incomplete fictional plan can support gap identification, but the controller must know whether the gap is intentional and whether the exercise provides a fair opportunity to identify it.

## Public sources and their limits

### Best starting points

| Resource | Verified contents and practical use | Limit |
| --- | --- | --- |
| [CSA Singapore IT-team toolkit](https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-resources-for-organisations/toolkits-for-it-teams/) | Its public appendix supplies 26 templates. Relevant categories include risk assessment, hardware/software/data/account inventories, backups, IRP, SLA, BIA, BCP and DRP. Useful structure for original fictional records. | Blank/sample templates, not a populated SME. The appendix is dated March 2022; do not treat historical certification references as current compliance evidence. |
| [NCSC Exercise in a Box: ransomware](https://www.ncsc.gov.uk/section/exercise-in-a-box/ransomware-attack) | Public 60-90 minute exercise. ZIP inspection found exercise content, facilitator prompts, participant briefing and scribe sheet PDFs. The current download did not require registration. | An exercise kit, not a complete fictional company's architecture, plans and inventories. Its timing and roles are examples, not requirements for our five-position design. |
| [CISA cybersecurity scenarios](https://www.cisa.gov/resources-tools/resources/cybersecurity-scenarios) and [CTEP documents](https://www.cisa.gov/resources-tools/resources/ctep-package-documents) | Official listings provide cyber scenarios plus planner/facilitator and evaluation materials. Useful references for scenario and exercise-administration structure. | Not a verified complete SME corpus. Direct page access was restricted during this research; official indexed listings were available, but every download was not inspected. |
| [CSA/SingCERT incident-response playbooks](https://www.csa.gov.sg/resources/singcert/incident-response-playbooks/) | Malware, ransomware, business email compromise, DDoS and cloud-response resources for reviewing the technical plausibility of discussion content. | Response guidance, not organisation facts or a finished scenario. |

The [CSA template appendix](https://isomer-user-content.by.gov.sg/36/744568da-0801-4cb5-a2b2-f54615ceed10/Cybersecurity-Toolkit-for-IT-Team-Appendices.pdf) is particularly relevant: backups are appendix 17, IRP 18, SLA 21, BIA 23, BCP 24 and DRP 25. We can populate a selected subset consistently rather than write unrelated documents from scratch.

### Published fictional organisations

- [NIST Great Seneca Accounting, SP 1800-22 supplement](https://www.nccoe.nist.gov/publication/1800-22/supplement/index.html): an explicitly fictional small-to-mid-size accounting firm with business context, BYOD architecture and security/privacy risk examples. Useful as a model of consistent fictional context, but BYOD-specific, not a complete TTX or BCP/IRP pack. Published September 2023; it uses CSF 1.1.
- [NIST SP 1353 initial public draft](https://csrc.nist.gov/pubs/sp/1353/ipd): published 19 August 2026, with a simulated Halverston Community Bank corpus. The organisational ZIP contains a policy handbook, core-banking security requirements, assessment interview notes, risk register and CSF profile template. NIST labels the AI-generated records illustrative and not templates for actual use. No standalone topology, BCP, IRP or inject/branch-package file was present. This is a reference corpus, not a vetted Singapore SME foundation.
- [NIST IR 8183A Volume 3](https://csrc.nist.gov/pubs/ir/8183/a/v3/final): older manufacturing examples include incident-response and system-recovery plans and an SLA. Useful for document examples, but its 2019 CSF 1.1 manufacturing/OT context adds complexity beyond the present SME IT exercise.

Public synthetic context therefore exists. In the sources reviewed, no single verified download provides the exact coherent SME context plus five-position coached branching package required here. That is a bounded search finding, not a claim that no such package exists anywhere. Public availability also does not establish unrestricted redistribution rights: retain citations, review applicable terms before copying assets, and prefer original synthetic content over republishing reference packs. No reference archive was added to this repository.

## Recommended original package

Yes, crafting one complete synthetic SME package is feasible and is the recommended capstone route. Here, complete means sufficient and consistent for the approved exercise objectives, not a simulation of every enterprise function. The following is a proposed deliverable structure, not newly approved requirements.

| Layer | Proposed contents | Audience |
| --- | --- | --- |
| Organisation context | Fictional business brief; scoped service/asset/data register; logical network and identity/dependency view; operating model; tailored IRP, BIA/BCP and recovery extracts; risk rationale; assumption/provenance register | Reviewed context, with only appropriate extracts supplied to players |
| Exercise material | Purpose and objectives; participant briefing; five inject positions and reviewed variants; synthetic alerts, tickets or status reports consistent with the context | Players receive background and released material only |
| Controller/evaluation material | MSEL; private scenario facts; branch conditions and consequences; objective mapping; reviewed assessment/coaching guidance; facilitator prompts; debrief, AAR and improvement-action structure | Facilitator/evaluator only |

The existing [software fixture](../../src/server/fixture.ts) already sketches a 42-person engineering-services SME with cloud email, an identity service, an on-site file service and MSSP monitoring. The fixture does not establish identity hosting. Reusing that setting was recommended by this research and subsequently selected for the [draft organisation foundation](../organisation/example-sme-01/README.md) under ADR-019. It is not a complete pack: the fixture intentionally contains unknown containment authority, conflicting recovery targets and no observed restore result. Do not silently overwrite those states or change test fixtures to make a future pack look complete; create reviewed revisions when content decisions are made.

Suggested full-package authoring sequence below. ADR-019 separately authorises a reusable organisation brief/register foundation before scenario-specific inputs are settled; the foundation does not supply or approve the missing exercise inputs.

1. Agree the SME setting, incident family and specific technical decisions to exercise. Review the pending RACI, assessment approach, AAR template and branch limits first.
2. Establish one master set of fictional facts with stable asset, service and role identifiers. Derive the documents and diagrams from it; reconcile backup timings, trust boundaries and recovery dependencies.
3. Author participant material and separate private controller notes. Use original synthetic alerts/log excerpts rather than collecting production telemetry or building a cyber range.
4. Map each variant to its objective, prerequisites, response evidence and continuing consequences. Dry-run every permitted path, including ambiguous answers, unresolved outcomes and unavailable AI.
5. Obtain human technical/content review, freeze a version, and pilot it. Report pilot limitations and keep evaluation cases separate from examples used to tune AI prompts.

These are advisory steps; they do not supply the missing RACI, thresholds or branch logic. A proposed document count, page budget or particular threat technique should not become an implementation gate without review.

## Branching and evaluation cautions

Keep assessment and scenario state separate. An answer can identify a reasonable action without establishing that it succeeded. A low score is not proof that an incident worsened, and a high score is not proof of containment. Branches need reviewed conditions tied to the recorded decision and explicitly simulated consequences, with retained history at reconvergence.

For this repository, ADR-017 already requires one released variant at each of five positions, objective coverage on every permitted path, selection after the current inject's final outcome and facilitator approval. The initial and coached responses both remain evidence. Coaching must not retroactively erase an earlier consequence; the package needs to specify how decision timing is represented. Ambiguous or unsupported responses require human review or pause, not invented live branches.

A technical tabletop can assess reasoning, coordination, proposed procedures and identified gaps. It cannot establish that malware was removed, backups actually restored or real recovery met RTO/RPO. Those claims require separate practical tests. The coached format also limits claims of unaided readiness, and different branch paths limit simplistic total-score comparisons.

The immediate engineering task remains TASK-001C, not a parser, scenario generator or complete branch engine. This research authorises no deployment, live AI evaluation or changes to participant access/release controls.
