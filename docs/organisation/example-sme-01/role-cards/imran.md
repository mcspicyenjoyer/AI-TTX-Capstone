# Imran Salleh

*For Imran's player only. Fictional role card; all calls, payments, filings and external contacts are simulated. Edition org-draft-0.3; Monday 28 September 2026, 09:00 SGT.*

## Your desk

You are the sole internal IT Executive, coordinating access, laptops, Goh & Mercer's maintenance and Beacon Nine's SOC cases. You maintain the company decision log. No internal deputy or alternate log-keeper is appointed. Goh & Mercer's technical cover does not fill those company roles.

Goh & Mercer supports weekdays 08:30-18:00, with critical-incident on-call support afterward and a one-hour acknowledgement target. Beacon Nine monitors continuously.

## Configuration and maintenance

TE-DC01 controls local file and staff VPN identity and synchronises staff identities to Company Sign-in. Cloud-only administrators are separate. Local, VPN and cloud sessions have distinct administration.

Interactive Microsoft 365 staff/admin accounts, staff VPN, Finance Books and PayrollVault require MFA. The active MSP emergency VPN identity `vendor-emergency` is password-only; its credential is vaulted. Banking uses separate authentication.

Endpoint Guard covers all 42 laptops, TE-DC01 and TE-LIC01. TE-FS01's legacy metadata plug-in prevents installation of the current agent. That exception is on your remediation list. The file server dates from 2017; replacement is delayed by the plug-in dependency. September's TE-VPN01 maintenance was deferred for project work.

The office has one fibre connection. Remote cloud email and ProjectHub access do not use it, but office-file access and new checkouts of TE-LIC01's 18 floating licences use the office network or VPN. Six company phones are managed; personal phones used for routine WhatsApp coordination are not company-managed.

## Recovery records

You review Goh & Mercer's nightly job summaries. TE-BK01 jobs cover only TE-FS01, TE-DC01 and TE-LIC01, with an off-site copy job, separate backup login and 30-day retention. Immutability, independent isolation and a current end-to-end restore result are not established.

The continuity note specifies four-hour file-service recovery; Goh & Mercer's worksheet budgets eight. They remain unreconciled.

There is no independent backup or scheduled recovery-export job for Exchange, ProjectHub, OneDrive, Finance Books or PayrollVault. The company relies on provider-native retention/recovery; settings, recovery windows, exportability and restoration have not been validated. Normal sync and payment exports are outside the backup job list.

## Standing arrangements

You or Goh & Mercer's on-call engineer may isolate an individual employee laptop or restrict an ordinary user account on suspected compromise, with logging and escalation. Server isolation, network-wide restrictions and privileged, service or shared-emergency account changes require Ethan's approval, or Clara's when he is unavailable.

The printed duty card was last updated in November 2024 and contains an obsolete MSP number. Beacon Nine's separate SOC case-contact record is current. Its ladder calls you, then after ten unanswered minutes Goh & Mercer on-call and Ethan, then Clara.

A phone conference is the agreed primary crisis channel. The restricted crisis WhatsApp group was never created. An offline decision-log template exists. The authority, communications and logging arrangements have not been rehearsed.

The written communications note calls for callback identity checks and prohibits uploading payroll, credentials or confidential drawings to crisis chat.
