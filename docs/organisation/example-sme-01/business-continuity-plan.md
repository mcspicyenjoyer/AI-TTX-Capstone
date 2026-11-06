# Teralqen Engineering business continuity plan

**Restricted planning reference. Synthetic review draft `bcp-draft-0.1`, authored 8 October 2026.** Operating context remains Monday 28 September 2026, 09:00 SGT. All exercise calls, payments, filings and system changes are simulated. New targets and procedures are proposals, not an approved or tested company capability. This plan does not select an incident or contain participant marking criteria.

## 1. Purpose and activation

Keep essential project delivery, customer coordination, payments and payroll working during loss of trusted systems, records, office access or key staff. People must be safe before work resumes; this is not an evacuation or emergency-services plan.

Ethan owns the plan and activates continuity arrangements when an interruption threatens the minimum services below, a committed deadline, or the integrity of work being issued. Clara acts when Ethan is unavailable. Do not wait for an RTO to expire or for the cause to be confirmed. Imran coordinates technical assessment with Goh & Mercer and Beacon Nine; continuity and security response run together.

At activation, record the affected services, earliest known disruption time, uncertain facts, available staff, next external deadlines and next review time. Nadia checks project work remaining; Daphne establishes actual payment and payroll cutoffs. There is no supplied payday or bank cutoff to assume.

## 2. Minimum services and recovery targets

These are **proposed business requirements**, not promises from suppliers. RTO is elapsed time from material service disruption to the stated minimum outcome, including necessary business checks. Record uncertainty about the start time; declaring the incident later does not restart the clock. Full normal capacity and backlog clearance require separate estimates.

RPO is the maximum tolerated gap between disruption and the recoverable data point for the named working records. It is not backup frequency, retention length or time allowed to rebuild records. A missing or older recovery point must be reported, not silently accepted as meeting the target.

| Service and owner | Minimum outcome and business reason | RTO | RPO and data scope |
| --- | --- | --- | --- |
| SVC-01 Design and statutory-submission delivery; Clara, coordinated by Nadia | The selected priority project can resume controlled design/checking using a verified working set, suitable CAD tools and authorised staff. Missing the working window leaves less time for engineering review before delivery; merely opening an old PDF is not recovery of this service. | 4 elapsed hours | 4 hours for active CAD files and calculations, DATA-01 |
| SVC-02 Client and subcontractor coordination; Nadia | A verified contact route and controlled instruction/decision record are usable for the priority projects. Unrecorded changes risk wrong issues and missed commitments; full email history need not be restored first. | 2 elapsed hours | 4 hours for current project instructions and working correspondence, relevant DATA-01/02 |
| SVC-03 Accounts and supplier payments; Daphne | Genuinely due payments can be checked, independently approved and processed through trusted banking access, with their status recorded. Routine ledger work may queue; an unknown or disputed payment cannot be treated as completed. | 8 elapsed hours | 24 hours for ledger and supplier working records, DATA-03 |
| SVC-04 Personnel and payroll; Daphne | The current payroll obligation can be established and a checked payroll prepared from verified records, with a usable approval/payment route. Unverified employee amounts or bank details do not meet this outcome. | 24 elapsed hours | 24 hours for payroll and HR working records, DATA-06 |

The RPOs do not permit silently losing drawing approvals, issued revisions or executed payments. Reconcile those against available authoritative issue/receipt/transaction records before reissue or replay. If reconciliation is impossible, hold the affected release or payment and escalate; do not claim zero-loss recovery.

**Priority rule:** establish coordination alongside containment, then focus scarce technical and engineering effort on the next justified project requirement. Eastline is due 29 September at 16:00 and TradeHub 30 September at 17:00, respectively 31 and 56 hours from the reference time. Nadia and Clara consider work remaining and dependencies, not just which date is earlier. Ethan can elevate finance/payroll when a verified cutoff or consequence demands it. These are not a fixed server-restoration sequence or permission to miss a shorter deadline. Review priorities whenever the impact, available people or recovery estimate changes.

## 3. Practical fallback arrangements

- **Projects:** Clara and Nadia identify the needed working files, latest authorised issue and remaining checks. Available ProjectHub or portal copies may support reference/review only after version and integrity checks; they are not automatically the current CAD working set. Use existing managed laptops and authorised applications only if assessed usable. New checkouts of the legacy module require TE-LIC01 and office/VPN connectivity, with 18 concurrent licences. If these conditions cannot be met, stop affected design work, redirect staff to unaffected tasks and replan delivery with the customer. Do not issue unchecked drawings to meet a date.
- **Coordination:** use verified phone calls and a restricted temporary instruction/action log when normal collaboration is unavailable or untrusted. Confirm consequential instructions with the known customer contact and record who confirmed what. Existing remote cloud access may continue only if identities, devices and the service remain trusted. An office fibre outage does not automatically remove every remote cloud session. Reconcile temporary records into the normal project record once safe access returns.
- **Payments:** Daphne lists genuinely due obligations and checks available invoices, supplier records and bank status. Keep trusted-contact callbacks and separate preparation/approval. If banking is unavailable, request instructions through an independently verified bank contact; no alternative payment facility is assumed. If records, authority or execution status cannot be verified, hold the payment and escalate rather than guessing, changing payee details or resubmitting a batch blindly.
- **Payroll:** confirm the actual cutoff and check any available PayrollVault records or restricted payroll export for date, completeness and authorised changes. A banking export is not a complete HR backup. Limit handling to authorised staff on trusted devices; no personal email or WhatsApp transfer of payroll data. Use the existing bank approval process. Escalate early if the cutoff cannot be met; no emergency payroll provider or competent alternate-token user is assumed.

Home working is conditional on safe devices, connectivity, confidentiality and access to the required applications. It does not replace the office servers or create a second office circuit. No spare server, recovery site, clean replacement laptop or guaranteed provider capacity is declared. Obtain and record a feasible option before depending on one.

## 4. People and contact routes

| Lead | Responsibility and limit |
| --- | --- |
| Ethan; Clara when he is unavailable | Business interruption, priority changes and service restoration. Clara also retains engineering-integrity sign-off; her deputy and submission duties compete for time. |
| Imran | Coordinates IT/suppliers and keeps the decision record. No internal deputy is named. If unavailable, Ethan must explicitly allocate coordination and logging before relying on cover; the MSP is not an automatic internal replacement. |
| Joel / Goh & Mercer on-call | Assess infrastructure and recovery options. Weekday support 08:30-18:00; outside-hours critical acknowledgement target one hour, not restoration within one hour. |
| Anika / Beacon Nine duty SOC | Continuous monitoring and security escalation within contracted authority; Anika is not personally on duty continuously. |
| Nadia | Project priorities, record reconciliation and agreed customer updates. |
| Daphne | Payment/payroll checks, privacy assessment with counsel, and legal/insurer coordination. |

Use Beacon Nine's current case escalation record: Imran first; after ten unanswered minutes, Goh & Mercer on-call and Ethan; then Clara. Do not rely on the November 2024 company card's obsolete MSP number. Callback through a separately verified route when identity is uncertain. The phone conference is the agreed primary crisis channel; the proposed restricted WhatsApp group has not been created. Do not put credentials, confidential drawings or payroll in routine chat groups.

Existing authority is unchanged: Imran or Goh & Mercer's on-call engineer may isolate an individual suspected compromised employee laptop or restrict an individual ordinary user account, logging the reason and escalation. Beacon Nine may isolate an enrolled employee laptop for high-confidence active compromise and must immediately notify Imran. Server isolation, network-wide restrictions and privileged/service/emergency-account changes require Ethan, or Clara when he is unavailable. If neither authoriser can be reached, escalate and record the limit; the plan grants no automatic wider powers.

## 5. Recovery and return to work

1. **Choose a safe route.** Imran and the MSP establish which access, systems and copies can be trusted, with SOC findings where relevant. Preserve available incident evidence before destructive recovery work. If compromise is suspected, agree containment and a suitably isolated recovery destination before restoring; its availability must be checked, not assumed.
2. **Select the recovery point.** Record the source, timestamp, scope, integrity checks and missing work. Compare the recoverable point with the applicable RPO. Ask the provider about native recovery for affected SaaS; do not treat ordinary sync as a backup. If no trustworthy source exists, report that condition and continue only the feasible fallback.
3. **Check dependencies and estimates.** Recover the trusted access, directory/DNS, network, application/licence and data dependencies actually needed for the chosen service. A server list is not an instruction to rebuild everything. Local, VPN and cloud identities are distinct. Record people, equipment, supplier availability and an estimate including validation/rework; escalate a threatened RTO without quietly lengthening it.
4. **Validate with the business owner.** Check usable records and access, relevant application/licence function, changes since the recovery point and temporary-record reconciliation. Clara clears engineering integrity before drawings are reissued. Daphne checks payroll/payment records and existing execution status; independent approval remains required.
5. **Authorise and monitor.** Ethan, or Clara acting as deputy, authorises the specific service's restoration after Imran/MSP checks and business-owner validation. Record remaining restrictions and the next check. Ethan, or Clara acting as deputy, stands down continuity arrangements only when the selected services are stable, outstanding work has owners and temporary records are accounted for. A recovered server, a submitted drawing or the end of a discussion exercise does not prove every service recovered.

## 6. Communications and records

Nadia sends agreed factual customer updates: affected work, what remains uncertain, the current delivery position and next update time. Do not promise a restore time without supporting checks. Arcade Quay's fictional clause is 24 hours from awareness of an incident affecting its confidential information or project service; Eastline's is 12 hours from reasonable suspicion of unauthorised access to project files. Their triggers differ; neither clock starts merely because this plan is activated.

Daphne coordinates counsel and insurer notice without delay under the fictional policy. External incident-response engagement/costs require insurer consent; urgent containment need not wait, and reimbursement is not guaranteed. Daphne retains standing authority for required statutory notifications, separate from commercial approval; assess applicable requirements with counsel rather than treating customer clauses as legal deadlines. Ethan, or deputy Clara, handles media.

Keep one restricted decision record: time and service; facts/unknowns; decision and authoriser; action owner; recovery source/point; estimate versus target; communications and next check. Distinguish proposed, authorised and completed actions. No real contact details or completed action entries are supplied in this synthetic plan.

## 7. Known limits and upkeep

The old continuity note calls for four-hour file recovery; the MSP worksheet budgets eight hours. The meaning and feasibility remain unreconciled. This draft does not select eight hours as the accepted RTO or present four hours as achieved. Nightly server backups cover TE-FS01, TE-DC01 and TE-LIC01 only, with off-site copying and 30-day retention. They do not establish the proposed four-hour data RPO. Isolation, immutability and a current successful end-to-end restore remain unverified.

Exchange, ProjectHub, OneDrive, Finance Books and PayrollVault have no independent backup/recovery-export job. Provider-native recovery remains unvalidated, not proven absent. The stale card, missing crisis group, Imran's lack of cover and Clara's unused bank token remain unresolved. This plan adds no technical capability or completed rehearsal.

Before adoption, Ethan and the service owners review the targets, current cutoffs, contact routes and feasible recovery options with Imran/MSP. Keep a controlled offline copy with the relevant contacts once reviewed; that copy is a required preparation action, not an existing verified arrangement. Review the plan annually, after an incident/exercise and after material system, staffing, supplier or deadline changes. Plan a short contact/fallback walkthrough and a safely scoped restore check; retain the date, scope, results and follow-up owner. No successful exercise or restore is recorded here.
