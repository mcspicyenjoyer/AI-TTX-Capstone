# Operational development handoff

The operational workstream has a runnable, server-backed entry in the shared TTX Platform. It deliberately contains development context rather than an incident scenario. Use this boundary to contribute operational content and behaviour while the technical five-inject baseline proceeds. Scope remains in [PROJECT](PROJECT.md#ownership-and-exercise-scope); design is in [architecture](architecture.md#operational-development-skeleton), and verified results are in [WORK](WORK.md#current-verification).

## Start locally

Use your own checkout and branch, not the other worker's synchronised directory. Start from current `main`, which is the integration handoff, rather than the earlier `21eacaa` planning checkpoint. Git carries source, not another laptop's access codes, database or Docker volume. No AI account is needed.

In PowerShell, from the repository root:

```powershell
$env:TTX_PORT = '3011'
docker compose -p ai-ttx-operational-dev up --build -d --wait
docker compose -p ai-ttx-operational-dev exec app node dist/server/show-access.js
```

Open [the operational development application](http://localhost:3011) and sign in as `operational` with the locally generated code. The exercise selector opens **Operational development workspace**. Expect synthetic context, an explicit preparation hold, no recorded activity and **Development / Not playable**. Loading, read errors and refresh use the real API. There is no operational start/release action, response form, grading or report.

The project name gives this checkout a separate `ai-ttx-operational-dev_exercise-data` volume. Keep the same port environment when rebuilding or starting this project. Choose another unused port if needed. `docker compose -p ai-ttx-operational-dev stop` stops it without deleting progress. Never use volume deletion or mutate a shared demonstration database to refresh fixtures. Credentials belong to the local volume and must not enter Git, screenshots or messages.

## Contribution boundaries

| Area | Entry point and ownership |
| --- | --- |
| Operational context | [operational-fixture.ts](../src/server/operational-fixture.ts), owned by the operational worker. Develop original synthetic content here or a focused operational module when needed. |
| Technical delivery fixture | [technical-fixture.ts](../src/server/technical-fixture.ts), owned by the technical worker. Do not turn it into operational defaults. |
| Shared data contracts | [exercise.ts](../src/contracts/exercise.ts), coordinated with the technical/integration owner. Both API and UI use these schemas/types. [outcomes.ts](../src/contracts/outcomes.ts) currently implements technical team policy, not an agreed operational extension. |
| Rules and persistence | [exercise-service.ts](../src/server/exercise-service.ts), [exercise-store.ts](../src/server/exercise-store.ts), [exercise-validation.ts](../src/server/exercise-validation.ts). Extend shared rules once, not a parallel backend. Coordinate migrations before dependent work. |
| API and demo composition | [exercise-routes.ts](../src/server/exercise-routes.ts), [exercise-demo.ts](../src/server/exercise-demo.ts). Membership is explicit; a route label does not grant authority. |
| UI | [exercise-workspace.tsx](../src/ui/exercise-workspace.tsx) is the shell; [facilitator-exercise.tsx](../src/ui/facilitator-exercise.tsx), [participant-exercise.tsx](../src/ui/participant-exercise.tsx) and [use-exercise-workspace.ts](../src/ui/use-exercise-workspace.ts) hold focused views/state. Put genuinely different operational views in a focused module, not duplicate authentication/release controls. |
| Tests | [exercise.test.ts](../tests/exercise.test.ts), [exercise.spec.ts](../tests/browser/exercise.spec.ts). Add track-specific cases alongside shared regressions. |
| Root configuration | Package manifest/lockfile, Docker, global CSS and shared schemas/migrations are coordinated integration changes, not independent workstream choices. |

Current package: `operational-development`, revision `package-r1`, run `operational-dev-01`, track `operational`. The package points to the unchanged synthetic `example-sme-01/profile-r1` identity/hash but exposes no technical profile facts. The operational identity has no profile-review or technical-run membership. Neither role names nor company decision authority grant application permissions.

Package kind currently supports only `engineering-fixture` and `development-skeleton`. A skeleton must have zero injects; an engineering fixture needs content. Adding a production/reviewed scenario kind, objective/evaluation/branch structures, profile access or operational play is a coordinated contract task, not permission to relabel unreviewed content as approved. No operational scenario, scoring standard or participant assignment has been selected for the other worker.

ADR-025 limits the contact-route Step 0 gate and wording to technical runs. Operational preparation must be designed by its owner; the existing skeleton remains held for its own development status. The new technical response/review/closure routes reject operational writes. Coordinate the minimal position -> variants -> per-role evidence structure, exact release/outcome references and facilitator next-variant choice before either worker depends on an expanded package schema. This boundary is proposed, not teammate agreement already obtained.

## API examples

All routes require the generated server session. POST requests also require the configured local Origin. Use the shared API client and schemas; do not supply an actor ID, role switch or arbitrary schema.

`GET /api/tracks/operational/runs`, as the operational account, returns this seeded list:

```json
[
  {
    "id": "operational-dev-01",
    "track": "operational",
    "title": "Operational development workspace",
    "state": "draft",
    "kind": "development-skeleton"
  }
]
```

`GET /api/tracks/operational/runs/operational-dev-01/review` validates against `ReviewSchema`: `run`, `package`, package/assignment hashes, `members`, `profileConfirmed`, `preparation`, `step0Checks`, `step0Ready`, `approval`, `nextInject` and `releases`. The fixture has null preparation/approval/next inject and empty Step 0/release lists. `step0Ready: true` means the technical gate is inapplicable, not operational readiness; participant briefing uses `step0Status: not-required`. The confirmation flag reflects the shared profile's actual state, not operational approval. Its activity route returns `[]` until an implemented event occurs. The same account's direct technical review request returns 403; its profile list is empty.

The following is the existing technical approval request construction, not a command permitted on the operational skeleton. `review` is a freshly validated facilitator review; use the returned hashes rather than computing authority in the browser:

```ts
const inject = review.package.injects.find((item) => item.id === review.nextInject!.id)!;
const input: ApproveRequest = {
  expectedRunRevision: review.run.revision,
  idempotencyKey: crypto.randomUUID(),
  packageHash: review.packageHash,
  injectId: inject.id,
  injectRevisionId: inject.revisionId,
  contentHash: review.nextInject!.contentHash,
  recipientIds: selectedAssignedParticipantIds,
};
```

POST this shape to `.../approvals` only after the technical fixture's profile confirmation, recorded team contact-route evidence with a current Ready decision (`.../step0`), and briefing/start. The new check takes respondent IDs, `firstContact`, `contactRoute`, `fallback`, `decision`, `rationale`, package/assignment hashes, expected run revision and idempotency key; no actor ID. It is facilitator-only and unavailable for the operational skeleton. The result validates against `ApprovalSchema` and binds the exact recipients/content/run revision. A subsequent, separately requested `.../releases` body uses `{ approvalId, expectedRunRevision, idempotencyKey }`; it cannot include replacement content or recipients. Retain the exact body/key after an uncertain response. A changed command needs a new key and fresh review. Read the [API table](architecture.md#browser-api-contract) for the remaining implemented routes and safe error envelope.

## Revision and test workflow

Stored package revisions and existing runs are not overwritten on startup. Changing the same seed ID/revision in source will not change an existing database and emits an identity-only warning. Schema v4 adds four outcome tables without rewriting old profile, run, Step 0 or release data/codes. Older partial-coverage technical checks need a new all-role record before Ready/resume, not an invented migrated answer. For development changes, introduce a new package revision and run identity with assigned members, or start a separately named disposable Compose project. Do not reset the original demonstration volume. Changed package/assignments invalidate preparation and pending approval; in-place repair and run administration are not exposed.

Before integration, use the [README verification commands](../README.md#verification). Add cases for new content references, invalid track/package bindings, direct unauthorised calls, role-private projections, exact approval, retries and rollback where the change affects execution. Keep technical profile and release regressions passing. Ordinary tests use temporary synthetic data, no live AI, and the browser projects use separate local servers/databases.

## Current limits

The operational entry is a validated read-only development fixture, not a finished exercise. The technical engineering loop now captures response revisions, facilitator dispositions and explicit closure/completion; five/ten-entry contract tests exercise the same guards. Its flat message array is not a position/variant/role-artefact model: agree the [next contract boundary](architecture.md#next-package-contract-boundary) before expanding pilot content. Package editing, branch selection, ingestion, AI and AAR remain unimplemented. Activity reads expose the latest 100 events, while outcome review returns complete outcome histories; neither is a paginated audit export. In-app availability is not evidence of a person's viewing or real action.

Next shared work is the minimal package contract above; select the technical incident/objectives before authoring its five positions or reference inputs. Technical pause freezes new outcome writes under ADR-025, with local drafts retained. The operational worker can develop content/views independently of future AI/account decisions. Figma and local concept figures remain historical, not synchronised implementation evidence.
