# Repository instructions

This is the SME-focused AI-assisted Technical TTX-in-a-Box capstone, a discussion exercise application.

## Read before work
- Read `docs/PROJECT.md` and `docs/WORK.md` first.
- Consult `docs/architecture.md`, `docs/QUALITY.md` and relevant entries in `docs/DECISIONS.md`.
- Inspect implementation, tests and Git status. Preserve unrelated files and user changes.
- Requirements belong in PROJECT, design in architecture, choices in DECISIONS and execution status in WORK. Link rather than duplicate.
- Report material contradictions; prior chats and proposed designs do not silently become approved requirements.

## Change discipline
- Complete the authorised task and its acceptance criteria, not the entire backlog.
- Reuse existing code and contracts. Keep application rules separate from UI, storage and provider-specific adapters.
- Create only modules needed now; no speculative microservices, custom skills or parallel frameworks.
- Keep the existing lowercase `docs/architecture.md`.
- Do not reset history, discard user work or include unrelated refactoring.
- Proceed with reversible work already authorised; do not request permission again for the same scope.
- Record purpose, alternatives and maintenance cost for dependencies within an approved scaffold.
- Resolve unapproved stack, hosting, provider and data-location decisions before dependent work. Tool availability is not organisation approval.
- Obtain explicit authority for destructive non-test migrations, weakening approval/access requirements, or publication, deployment and paid operations outside the authorised task.

## Application rules
- AI output is an untrusted proposal, not authoritative state or release permission.
- Validate boundary inputs using application-owned schemas; never execute supplied schemas, expressions or generated code.
- Approval identifies exact content revision, recipients and required run state; validate again in the release transaction.
- Participant projections must exclude facilitator-only data server-side.
- Keep confirmed facts, assumptions, unknowns and provenance distinct.
- Preserve durable activity and manual continuation when AI fails.
- Never invent a successful delivery or an observed action without evidence.

## Data, checks and handover
- Use synthetic or explicitly approved fixtures. Do not commit secrets, organisation uploads or sensitive runtime records.
- Store live data outside this synchronised repository. Do not log credentials or restricted content.
- Do not send data or messages externally without applicable authorisation.
- Run meaningful checks for changed behaviour and relevant failure paths; ordinary software tests must not depend on live AI.
- Do not weaken tests to make them pass or create placeholder success checks.
- Review the diff, update affected documents and WORK, and report checks run, failures and limitations.
- Design documentation is not evidence of implemented or tested runtime behaviour.

These instructions do not configure filesystem, network or hosting permissions.
