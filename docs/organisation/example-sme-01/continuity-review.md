# Continuity plan basis and review

**Author/reviewer only.** Supports [business continuity plan](business-continuity-plan.md) `bcp-draft-0.1`, authored 8 October 2026, within `org-draft-0.4`. The fictional clock remains 28 September at 09:00 SGT. This is provenance and a draft extraction reference, not participant grading or independent supervisor approval.

## Scope and sources

The user requested a realistic plan based on the full SME pack, then explicitly preferred the minimum workable SME version. One plan with an embedded BIA and recovery checklist was chosen instead of separate enterprise BCP, DRP and crisis-policy manuals. It supplies incident-neutral continuity input; it neither chooses ransomware nor completes diagram ingestion or generation.

All 13 pre-existing organisation files were reviewed. Company facts come from the [master register](master-register.md), shared documents and role cards, not from the external templates. New numeric targets, minimum-service definitions, fallback procedures and review cadence are original **Proposed** fiction under `SRC-CONT`. They are not extracted from revision 0.3, prescribed by CSA or evidence of supplier performance.

Primary references checked 8 October 2026:

| Source and locator | Limited use in this plan |
| --- | --- |
| [CSA IT-team toolkit page](https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-resources-for-organisations/toolkits-for-it-teams/), updated 20 January 2025; linked [appendix](https://isomer-user-content.by.gov.sg/36/744568da-0801-4cb5-a2b2-f54615ceed10/Cybersecurity-Toolkit-for-IT-Team-Appendices.pdf), updated 29 March 2022, appendices 23-25, PDF pages 43-48 | Adapt the BIA, activation/responsibilities, communications, recovery, review and testing structure. Do not copy its illustrative impact-score arithmetic or use BIA scoring as participant grading. |
| [CSA main toolkit](https://isomer-user-content.by.gov.sg/36/91d33a31-d51d-419b-8458-25f901183f19/CSA_Cybersecurity-Toolkit-IT-Team.pdf), printed pages 32-33 and 37-38 | Business-driven backup needs and recovery checking. Recommendations to improve backups do not establish existing Teralqen capability. |
| [NIST SP 800-34 Rev. 1](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final), updated 11 November 2010, section 3.2, printed pages 15-19 | Distinguish business impacts, recovery targets, recovery-data point, resource dependencies and reprocessing time. Useful planning reference, not a Singapore legal requirement. |
| [NIST SP 800-184](https://csrc.nist.gov/pubs/sp/800/184/final), December 2016, sections 2.2-2.4 and 3.1 | Recovery dependencies, integrity/functional validation, decision authority and testing evidence. No federal staffing, reporting or infrastructure requirement is imported. |

The plan preserves fictional customer/insurer terms. It does not introduce new statutory timings or update the separately dated [legal reference](author-notes.md#legal-and-regulatory-reference); refresh that reference before legal assessment content is released.

## Target rationale

These are reviewable business choices, not calculations from turnover or project deadlines. One RTO describes minimum service, not full-system restoration. No maximum tolerable downtime or formal BIA sign-off has been established.

| Record | Proposed RTO / RPO | Rationale and feasibility limit |
| --- | --- | --- |
| REC-01 / SVC-01 | 4h / 4h | Retain the existing file-service urgency and propose controlled priority-project work within that window, limiting lost design work to part of a working day. Extending the target to a defined business outcome and adding RPO are new proposals. The MSP's 8h budget and nightly-only backups leave both feasibility and data protection unresolved. |
| REC-02 / SVC-02 | 2h / 4h | A small team can aim to re-establish verified coordination before normal systems return. Losing recent design instructions creates rework/integrity risk. Phone/log fallback does not by itself recover missing correspondence; obtain confirmations and measure both outcomes separately. |
| REC-03 / SVC-03 | 8h / 24h | Prioritise genuinely due obligations within an elapsed working-day-sized window while routine ledger work queues. Preserve executed-transaction reconciliation and maker-checker control. Provider recovery, actual due dates and alternate-token usability are not established. |
| REC-04 / SVC-04 | 24h / 24h | A day-sized readiness target for payroll/HR working records, with earlier escalation for a confirmed cutoff. No payday, employee-pay delay allowance or native SaaS recovery guarantee is inferred. |

The plan deliberately retains the four/eight-hour discrepancy. Original `profile-r1` calls both figures targets; later cards describe the MSP figure as a budget. A reviewer must determine whether it is a conflicting requirement or a recovery estimate. Neither wording proves measured recovery. Do not alter the historical fixture to conceal the difference.

## Draft extraction reference

Review these expectations before using them as evaluation labels; this agent-authored table is not an independently validated answer key. Keep it outside generation inputs when measuring extraction from the plan. Organisation facts and fictional policy approval are distinct from profile approval in the application.

| Input locator | Expected candidate information | Must not infer |
| --- | --- | --- |
| Plan section 2, four service rows | SVC-01: RTO 4h, RPO 4h; SVC-02: 2h, 4h; SVC-03: 8h, 24h; SVC-04: 24h, 24h. All Proposed; elapsed-hour units, named dataset scopes and minimum outcomes retained. | Approved company targets, a target for every asset, successful restores or unconditional full capacity. |
| Plan section 2, priority rule | Coordination alongside containment; engineering focus justified by work/dependencies; finance/payroll may rise with confirmed urgency. | A permanent total ranking or serial restore order; a supplied payroll cutoff. |
| Plan sections 2 and 7 | Target clock is disruption, not declaration; 4h continuity versus 8h MSP statement remains unresolved. | Automatic 8h RTO, averaged 6h target or a reset clock. |
| Plan sections 3 and 7 | Conditional copies/access/workarounds; server protection scope is three named servers; SaaS independent backup absent, native recovery unvalidated. | All cloud data is lost, sync is backup, a nightly schedule proves RPO, or a clean recovery environment already exists. |
| Plan sections 4-5 | Existing containment/restoration authority; explicit engineering clearance; no assumed internal deputy. | MSP/SOC may approve service-wide shutdown or restoration, or discussion proves execution. |
| Plan section 6 | Separate customer triggers, insurer coordination and DPO statutory authority. | All clocks start at plan activation or MD commercial approval can delay required notification. |

## Review and distribution

Human review still needs to accept or revise the four target pairs and minimum outcomes, interpret the MSP budget, confirm possible sources/cutoffs/resources and decide which deliberate gaps are in scope. No target should become a participant pass/fail threshold merely because it appears here. A tabletop can assess decisions about targets; it cannot demonstrate actual restoration within them.

The existing brief and seven cards remain edition `org-draft-0.3`; revision 0.4 adds this proposed planning layer rather than silently claiming staff already adopted it. Before an exercise uses new targets, supply reviewed excerpts: service priorities to Ethan; project/coordination sections to Clara and Nadia; finance/payroll sections to Daphne; relevant dependencies/targets/recovery checks to Imran and the represented MSP. SOC retains its defined monitoring/authority role. Do not distribute this review, the master register or the complete restricted plan to every participant. Record actual excerpt recipients during package preparation; no file link implements access control.

Remaining reference-pack work: agreed logical diagram and format, independently reviewed expected facts, supported text-format preparation/parser, and a reviewed generated scenario/package. This plan is a text source draft, not evidence that those features work.
