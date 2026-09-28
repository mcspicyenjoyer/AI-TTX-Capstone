# Joel Teo Wen Kai

*For Joel's player only. Fictional role card; all calls, payments, filings and external contacts are simulated. Edition org-draft-0.3; Monday 28 September 2026, 09:00 SGT.*

## Your service

You are Goh & Mercer Technology's Service Lead for Teralqen. Your team maintains its network, servers, endpoint deployment and backup jobs. Imran is the internal coordinator. You are not Teralqen staff or Imran's internal deputy; company business coordination and its decision log remain internal responsibilities without a named alternate.

Normal support runs weekdays 08:30-18:00. Critical incidents have an after-hours on-call service with a one-hour acknowledgement target. The engineer answering may be someone other than you.

## Maintenance record

TE-FS01 was installed in 2017. Its legacy metadata plug-in has delayed replacement and is incompatible with the current Endpoint Guard agent. Endpoint Guard is installed on the 42 employee laptops, TE-DC01 and TE-LIC01. September maintenance on TE-VPN01 was deferred for project delivery.

Staff VPN access uses directory-backed identities with MFA. The separately managed MSP emergency VPN identity `vendor-emergency` remains password-only, with a vaulted credential. Supplier maintenance endpoints are separate from the 42 employee laptops. Cloud staff/admin access requires MFA; cloud-only admin identities are separate from the synchronised staff directory.

TE-DC01 supplies local directory/DNS and staff-identity synchronisation. TE-LIC01 serves 18 floating licences for the legacy engineering module. Its new checkouts require office-network or VPN connectivity.

## Backup scope

Your nightly TE-BK01 jobs cover TE-FS01, TE-DC01 and TE-LIC01 only. The arrangement includes an off-site copy job, a separate backup login and 30-day retention. The records do not establish immutability, independent isolation or a current end-to-end restore result.

Your recovery worksheet budgets eight hours for the file service. Teralqen's continuity note says four; the discrepancy remains open.

Exchange, ProjectHub, OneDrive, Finance Books and PayrollVault have no independent backup or scheduled recovery-export job. The company relies on provider-native retention/recovery. Its settings, recovery windows, exportability and restoration have not been validated. Normal sync and payment exports are outside the backup job list.

## Authority and contacts

The on-call engineer may isolate an individual suspected compromised employee laptop or restrict an ordinary user account, with logging and escalation. Server isolation, network-wide restrictions and privileged, service or shared-emergency account changes need Ethan's approval, or Clara's when he is unavailable. Business-service restoration needs the same director/deputy authorisation after technical checks.

The company's printed duty card, dated November 2024, retains an obsolete MSP number. Beacon Nine's separate current case-contact record points to the current on-call service. Its escalation ladder calls Imran, then after ten unanswered minutes your on-call service and Ethan, then Clara. These written company arrangements have not been rehearsed.
