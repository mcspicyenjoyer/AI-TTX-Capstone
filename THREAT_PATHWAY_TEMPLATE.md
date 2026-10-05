# <Organisation> Threat Pathway

Copy this file to `docs/organisation/<org-id>/threat-pathway.md`, one file per scenario. Keep it near one page while the scenario is being designed. Link to the master register, plans and package instead of restating them.

Ground rules:

- Synthetic data only. Describe attacker behaviour at narrative level (technique names, not commands, exploit code or real CVE detail).
- A diagram connection is not a business dependency, a trust relationship or a reachable path.
- Tag every claim the pathway relies on: **C** confirmed (cite profile ID or source locator), **A** exercise assumption (labelled; reviewer approves), **U** unknown. A pathway hop cannot rest on **U**: confirm it, approve it as **A**, or drop it. An unknown control can still be a deliberate discussion gap.

## Status

- Organisation and confirmed profile revision:
- Source inputs and revisions (network diagram, BCP/BIA/DRP, guided answers):
- Profile gaps that block mapping:
- Track, format and functional roles:
- Exercise objectives and CTM clauses supported:
- Threat library pattern and version:
- Current decision: selecting | mapping | grounding review | inject handoff | approved | parked

## Threat actor and premise

- Threat actor, motive and starting access:
- What the actor plausibly controls after entry (accounts, hosts, data):
- What the actor does not reach in this scenario:
- Pre-existing conditions the pathway relies on (ENISA's "state of the world"), each tagged C/A:
- Pattern applicability conditions and whether this profile meets them:
- Explicitly out of scope (other incident families, side tracks such as data theft):

## Crown jewels: services and impact

- Business service(s) at stake, owner and recovery priority:
- Principal assets and data they depend on:
- Why disruption matters (deadline, contract, integrity, privacy, revenue) and supplied RTO/RPO, with source:
- Control or plan boundary that should contain the incident:
- Who has authority to act at that boundary (containment, recovery, disclosure):

## Entry points and dependencies

List the realistic entry points first. Do not map every route at once.

| Entry point | Threat action (narrative) | Control crossed | Affected system -> service | Reachable or only connected? (C/A/U) |
|---|---|---|---|---|
|  |  |  |  |  |

SME prompts:

- Remote access and identity: VPN, remote desktop, MSP maintenance paths, emergency or service accounts, MFA exceptions, directory sync, cloud admin.
- Email and collaboration: phishing, business email compromise, guest sharing, sync clients.
- Endpoints and servers: EDR coverage gaps, legacy or unpatched servers, shared infrastructure (file, licence, print).
- Backup and recovery: scope, isolation, retention, last proven restore, SaaS recovery.
- Third parties: MSP/MSSP authority and hours, SaaS providers, suppliers with access.
- Business processes: payments and bank-detail changes, payroll, issue or submission workflows.

## Decision-pressure points

Where the scenario forces a hard call. These are candidates for the three key decision points.

- Detection and escalation (alert routing, after-hours cover, SOC/MSP hand-off):
- Containment versus business disruption (what gets isolated, who approves):
- Evidence preservation versus speed of recovery:
- Recovery (backup trust, restore order, conflicting targets, integrity checks before reuse):
- Notification and communication (customers, regulator, insurer, contractual clocks):

## Expectations under test

What should hold according to the organisation's controls, plans or authority. The pathway stresses each one; its first observable signal becomes inject material.

1. Expectation:
   - Source (control, plan section, authority record or CTM clause):
   - How the pathway stresses or bypasses it:
   - First observable signal (alert, log line, call, ticket, customer complaint):
   - Expected response and responsible role:

2. Expectation:
   - Source (control, plan section, authority record or CTM clause):
   - How the pathway stresses or bypasses it:
   - First observable signal (alert, log line, call, ticket, customer complaint):
   - Expected response and responsible role:

3. Expectation:
   - Source (control, plan section, authority record or CTM clause):
   - How the pathway stresses or bypasses it:
   - First observable signal (alert, log line, call, ticket, customer complaint):
   - Expected response and responsible role:

## Candidate pathways

1. Pathway:
   - Threat actor and entry point:
   - Entry-to-impact trace (each hop with profile ID and C/A tag):
   - Controls met on the way and whether they hold:
   - Business impact and the recovery decision it creates:
   - Expectation under test:
   - Grounding check and negative control (which input change should break this path):

2. Pathway:
   - Threat actor and entry point:
   - Entry-to-impact trace (each hop with profile ID and C/A tag):
   - Controls met on the way and whether they hold:
   - Business impact and the recovery decision it creates:
   - Expectation under test:
   - Grounding check and negative control (which input change should break this path):

## Inject handoff

Map the selected pathway onto the MSEL: five positions for the first delivery, three of them key decision points.

| Pos. | Pathway stage | What participants see (artefact) | Intended recipient function(s) | Expected actions | Decision point | Objective |
|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |

Every fact an expected action depends on must reach participants through an inject, a role card or an ordinary information request.

Keep action responsibility and approval authority in the expectations/role mapping, separate from evidence recipients. Receiving an artefact does not make that function RACI Responsible.

## Library source and variants

- Threat library pattern and its seed sources (advisory, ATT&CK technique, public incident report):
- Alternative entry points considered and why not selected:
- Partial controls (control exists but has a gap, such as a coverage exception or unproven restore):
- Branch variants at each decision point and their consequences:
- Pathways ruled out and why (unsupported by the profile):
- Variants promoted to package branches:

## Review plan

- Source check: every hop, system, service and recovery target cites a profile ID or source locator:
- Application checks: IDs resolve, roles exist, chronology holds, recovery targets agree, every branch reaches closure:
- Changed-input test: alter one relevant profile fact and confirm the pathway and injects change, or the path is rejected:
- Facilitator review of plausibility and fairness:
- Recheck against the exact confirmed profile revision before package freeze:

## Tailoring gate

- Named-system test: each inject uses the organisation's own systems, services, dependencies and recovery targets:
- Relevant-input sensitivity: change a pathway prerequisite, dependency or recovery constraint; identify which evidence, consequence or decision must change, or why the path becomes invalid. A reusable threat pattern may remain valid for similar SMEs:
- Profile-change test result:
- Labelled exercise assumptions, and any that should become confirmed facts:
- Classification: grounded | grounded with labelled assumptions | partly generic (revise) | renamed generic scenario (reject)
- Reviewer and date:

Using the organisation's system names is not by itself evidence of tailoring.

## Decision log

- Date:
- Profile revision:
- Observation:
- Decision:
- Next action:
