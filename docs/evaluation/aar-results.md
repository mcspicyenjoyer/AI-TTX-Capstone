# Snapshot-bound AAR trial

28 October 2026. A valid AI draft is saved for facilitator review, not accepted. This is one synthetic five-position AI-player trial, not a benchmark of human performance, organisational recovery or AAR usefulness. Structure and evidence policy: [ADR-034](../DECISIONS.md#adr-034---bounded-interpretation-and-record-only-aar-at-five).

## Fixed source and result

- Source: `report-75a86561-0d0f-428b-a202-3c6c9c9629b9`.
- Source SHA-256: `349bed839cafbc8b2091fcf0a40a16a6bc4b4bdf19f01c0396606d03d05fcc3e`.
- Saved AAR: `aar-0bfd1991-8ebb-400e-86ef-837ae7922d99`.
- AAR revision-3 hash: `acc00ad9d0add2d8b09c333bd570bea0b166d3b6f845a30dca367435556f2fb9`.
- Five exact user-approved interpretation reviews and zero excluded interpretations were verified before each request. One source snapshot remains; no recapture or new live run.
- Input was that fixed app-record report only. No full profile/source documents, private player discussions or clarification sidecars were transmitted. The report explicitly states that this trial's clarification answers are outside the app record.

The draft has three strengths and one improvement area under each of the three objectives: 12 findings, 21 exact quotations resolving to eight source record IDs, and three proposed improvement actions with owners blank. Eight findings are attributed team decisions, one is a facilitator observation, and three retain unknown gap origin. The five reviewed interpretations are in the input; the draft does not cite them directly as findings or treat them as ground truth. No profile-origin or exercise-origin gap was asserted without the required provenance.

## Adapter and call ledger

The user authorised a narrow CLI pin update after the original worker stopped before claim. An isolated candidate copy passed the unchanged loopback audit and all 14 adapter tests before the repository pin changed. A second audit of the repository copy also passed: zero registered tools, nine forced prohibited calls refused across ten local fixture exchanges, no canary disclosure/write and no credentials at the fixture endpoint. These are local mock exchanges, not model calls or an OS-sandbox guarantee.

The new pin is `codex-cli 0.165.0-alpha.1.2`, SHA-256 `5c1b55966bf9f757dcbf00065c9a6cb862ead55d34b015f1be1939ff18e43943`. Both model calls used the existing ChatGPT subscription and `gpt-6.1-sol`. Model, authentication path, restricted environment, empty tool configuration and application validators were not loosened. Historical interpretation results remain tied to their earlier binary and frozen recipe; no interpretation call or corpus change occurred.

| Event | Prompt | Result | Elapsed | Input tokens | Output tokens |
| --- | --- | --- | --- | --- | --- |
| Pre-claim request | Not sent | CLI mismatch; queued request later expired without `startedAt` | Not a model attempt | Unknown | Unknown |
| AAR call 1 | `record-only-aar-1` | Rejected: a Step 0 quotation used the disallowed `origin-not-established` category | 36.099 s | 36,552 | 2,322 |
| AAR call 2 | `record-only-aar-2` | Valid proposal saved, awaiting human review | 32.775 s | 36,636 | 2,371 |

Total: **2/3 model calls used**, one remaining, **73,188 input / 4,693 output tokens** reported. No unknown usage on the two started model attempts; the separate pre-claim record retains null usage rather than invented counts. No automatic retry or paid fallback. The first invalid output and its usage are retained privately, not removed from the denominator.

All 17 quotations in the rejected output were valid substrings; that did not make its attribution valid. Prompt version 2 states the existing category-to-record restrictions explicitly. It does not relax the validator, alter the snapshot or feed in new facts. A synthetic regression checks that a valid Step 0 quotation still fails the unknown-origin category and succeeds with appropriate facilitator-observation attribution. The second output passes all existing validation, including 21/21 literal quotations. This is structural validity, not a measured semantic accuracy score.

## Verification and review limits

- Windows `npm run check` passed 158 tests plus formatting, lint, types and build after the pin update. The 12 focused AAR tests passed after the prompt clarification and regression addition; the Docker build passed the complete 158-test gate for that final code.
- Live read-only checks at 1440 and 390 pixels verify all 12 findings, 21 quotations, resolvable citation links, three blank owners/proposed statuses, the unchanged five reviews, 20 fictional clocks and five post-exercise analysis records. Screenshots were inspected; no page error or page overflow. The unchanged UI's prior 24-browser-test result belongs to checkpoint `9028cd0`, not a new full-suite run here.
- Original source-table hashes, the snapshot bytes and the confirmed/frozen bindings remain unchanged. Only AAR records and their command receipts changed. There are still zero live clarification records and one source snapshot. The worker exited after the requested call.
- The selected excerpts support discussion strengths: distinguishing known/unknown information, conditional containment authority, minimum-service planning and an authorised restoration hold. They do not prove execution or successful recovery.
- All three improvement areas concern evidence not supplied in this discussion. Before accepting the proposed actions, decide whether each calls for better exercise materials, a separate technical validation activity, or organisational improvement. Do not turn missing simulated results into an organisational capability finding.
- The draft is selective: it does not separately discuss the contact arrangements or four-hour/eight-hour conflict, and it does not cite every reviewed interpretation. Review completeness against the fixed report; do not import private clarifications to fill it. No further model call was spent merely to fill sections.
- Owners remain blank. Human acceptance, prioritisation, owner assignment and independent usefulness evaluation remain outstanding. The post-AAR [follow-up design](../architecture.md#proposed-reviewed-follow-ups) is a proposal only, not implemented or approved branch content.

Private evidence remains at `C:\Users\tanwm\AppData\Local\Packages\OpenAI.Codex_2p2nqsd0c76g0\LocalCache\Local\AI-TTX\aar\2026-10-28`, including the audit, failed/saved provider outputs, immutable-source checks and UI screenshots. This file contains only aggregate results and identifiers. Never recursively bundle runtime folders: exclude player `access.json`, credentials/provider configuration, raw databases, source uploads and private rehearsal transcripts.
