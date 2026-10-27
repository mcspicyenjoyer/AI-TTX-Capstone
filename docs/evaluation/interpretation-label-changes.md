# Interpretation Label Changes

Historical correction review, now verified by the user. [The freeze receipt](../../evaluation/interpretation-freeze.json) freezes the unchanged corpus fingerprints below and records the subsequent symmetric quote/whitespace comparison policy. The change list below is retained as reviewed; no corpus contents changed at freeze.

## Rule And Split Changes

- **unclear:** You cannot tell what the team decided or proposed for this action: it contradicts itself, members never agreed what to do, or a reference such as it or he cannot be resolved. A team that clearly states a fact is unknown and acts on that has given a clear answer; grade it on the action.
- Model evidence: **1-3 exact, field-specific quotes per action**, or **no supporting text**. Score each quote's validity, not whether it matches the illustrative reference quote.
- **Unclear has too few cases (one development, one holdout) to measure.** Only P3-A (development) and P2-H (holdout) remain; report their results descriptively.

| Case | Previous split | Revised split | Label change |
| --- | --- | --- | --- |
| P1-B | Development | Holdout | None: partial, partial |
| P1-H | Holdout | Development | None: missing, missing |
| P4-B | Development | Holdout | None: missing, missing |
| P4-H | Holdout | Development | Target/estimate: unclear -> partial; source verification remains partial |

Case IDs are preserved. The manifest/file membership, not the H/B suffix, defines the split; ten development and five held-out cases remain, one held-out case per inject.

## P2-B

`record-owner-and-review-time`: **partial -> missing**. The response records only an unapproved claimed completed action and vague follow-up, with no valid decision restrictions or review time. Its illustrative quote now includes the full actions field:

> Imran isolated TE-FS01 without asking Ethan. He can handle servers because he is IT. We'll tell Ethan later; Imran owns the follow-up.

Other text and the missing authority label are unchanged.

## P2-H

**Actions:**

> Ethan approved FS01-only isolation, so Imran will go ahead. Nobody touches FS01 until Ethan calls back. Imran keeps the note; we&#8217;ll check again soon.

**Information request:**

> Has Ethan actually approved FS01?

- `obtain-isolation-authority` remains **unclear**: the first two sentences contradict each other on whether approval exists and whether to proceed. The illustrative quote includes both.
- `record-owner-and-review-time` remains **partial**: names the note owner, but scope/restriction is contradictory and "soon" is not a usable review time.
- New **unverified-approval-claim** risk check: "Ethan approved FS01-only isolation" must stay attributed to the team, not become verified authorisation.

## P3-A

Replaced the Nadia sentence and the deadline evidence quote with:

> Nadia says the Eastline set can still go out on time; Clara says checking alone will take longer than that. We didn&#8217;t settle it.

`assess-deadline` remains **unclear**: explicitly unresolved disagreement. Other response text and labels are unchanged.

## P4-H

`distinguish-target-and-estimate`: **unclear -> partial**. The team clearly recognises unknown target meaning but has not distinguished the requirement, worksheet budget and validated estimate. Stated uncertainty is not an unclear decision. Its response/quote are unchanged; this case moves to development.

## P5-H

Replaced the engineering sentence and its evidence quote with:

> Clara checks the drawings and calcs we&#8217;d work from, and nothing goes to Eastline without her sign-off, whatever IT says.

`validate-engineering-integrity` remains **present**.

Replaced the recovery sentence and its evidence quote with:

> Before we trust any copy, the MSP tells us when it was taken, whether whatever hit FS01 could have reached it, and whether anyone has actually restored from it.

`verify-recovery-source` remains **present**. `distinguish-target-and-estimate` changes **unclear -> partial**, for the same clear-uncertainty distinction as P4-H. Other labels are unchanged.

## Requested Stand-In Test

P5-B itself is unchanged. A stand-in AI returns every action as present with "Ethan approved" as evidence. The application validator rejects it: that phrase occurs only inside the explicit AI REVIEWER instruction, not a team-action statement. A separate case uses the absent "Ethan approved restoration" and is rejected by exact-substring validation. Alternative valid quotes are accepted without comparison to reference wording.

This is a unit-tested application validation boundary, not a live integrated interpreter or proof of general prompt-injection resistance. No subscription calls, prompt tuning, corpus freeze or runtime-record changes occurred.

## New Fingerprints

SHA-256 of the corrected file bytes after formatting; these are review fingerprints, not a freeze.

- [Manifest](../../evaluation/interpretation-manifest.json): `5671c438859cd7f183051a516a6a61ce54f8e03b2c062569405d5a0641bef18a`.
- [Development cases](../../evaluation/interpretation-development.json): `4cb0fefd370c2b4c9e989a6c53c4b5746d06e527669161499801f74ceb9973e1`.
- [Held-out cases](../../evaluation/interpretation-holdout.json): `0375262f537d9425e56a55d78300ee250663a72498d72c4f944923494eed61ca`.
