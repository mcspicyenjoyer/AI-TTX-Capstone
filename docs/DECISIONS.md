# Decisions

Accepted means a direction for the user's authorised baseline, not organisation deployment or data approval.

| ID / status / date | Decision and reason | Alternatives / consequence |
| --- | --- | --- |
| ADR-001 / Accepted / 2026-09-15 | Establish one authoritative location per kind of information before features. | Avoid competing PRD/SPEC/MEMORY files. Preserve the existing lowercase architecture document. |
| ADR-002 / Accepted / 2026-09-15 | One application with clear feature boundaries and storage/AI/delivery adapters. | Microservices add unnecessary deployment work. Create modules only as needed. |
| ADR-003 / Accepted / 2026-09-15 | Implement synthetic deterministic play before AI or parsing. | Separates state/control defects from content uncertainty; full target scope remains intact. |
| ADR-004 / Accepted / 2026-09-15 | Revision-specific approval, server-side projections and transactional durable release. | An editable approved flag and UI-only hiding cannot enforce the rules. |
| ADR-005 / Accepted / 2026-09-15 | Live state outside Git and OneDrive source. | Exact approved path and backup procedure still open. |
| ADR-006 / Proposed | Node/TypeScript, npm, React, Fastify, JSON Schema and SQLite from the existing design. | Record exact dependencies, alternatives, maintenance cost and work-machine compatibility before install. |
| ADR-007 / Proposed | Loopback synthetic demonstration with explicit participant identity/permissions. | A client-selected role must not grant facilitator access. LAN/TLS deployment needs a separate decision. |
| ADR-008 / Partially superseded / 2026-09-15 | Provider investigation now follows ADR-011. Format-specific ingestion remains deferred. | No parser or tested AI integration selected. |
| ADR-009 / Proposed | One real verification command, later reused by approved CI. | Scaffold must create actual format/lint/type/test/build checks; no placeholder success script. |
| ADR-010 / Accepted for task planning / 2026-09-15 | User leads backend; teammate leads frontend. One repository, shared contracts and small integrated checkpoints. | Separate repositories would add contract distribution and coordination work. Backend owner coordinates shared schemas and package/lockfile changes; both review interface changes. No teammate has been contacted or granted access. |
| ADR-011 / Proposed implementation / 2026-09-15 | Investigate Codex app-server with managed ChatGPT sign-in behind a backend adapter for a local synthetic demonstration, reflecting the user's subscription preference. Run a small AI feasibility task after the deterministic exercise loop, before full parsing. | This refines the later sequence without replacing ADR-003. Alternatives: manual reviewed proposals or a separately authorised API provider. App-server adds process/protocol, authentication, isolation and version-maintenance costs; official docs label it experimental and unsupported for production workloads. No package, model, account sharing, paid API fallback or production deployment is approved by this proposal. |

New decisions record status, date, reasons, alternatives, consequences and affected requirements. Supersede accepted decisions explicitly.
