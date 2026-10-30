# Project documentation map

Checkpoint: 2026-10-30, after merged PR #3. Start with [AGENTS.md](../AGENTS.md) and [the shared handoff](AI_HANDOFF.md). Follow the repository's instruction precedence; this index does not replace the current human request or authorize implementation of a later sprint.

## Requirements and engineering authority

| Document                                                                                                                                                                     | Role                                                                              | Maintenance rule                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [AGENTS.md](../AGENTS.md)                                                                                                                                                    | Permanent repository rules, safety, STABLE workflow and sprint boundary           | Apply to every agent; preserve safeguards                                    |
| [Product specification](product/PRODUCT_SPEC.md)                                                                                                                             | Business/product requirements                                                     | Change only for an approved requirements change                              |
| [Detailed product source](product/Cahier_des_charges_SaaS_Gestion_Scolarite_V2_EDXSTORE.docx.md) and [product PDF](product/Cahier_des_charges_SaaS_Gestion_Scolarite_V2.pdf) | The `.docx.md` is a missing-DOCX notice; the PDF is the available detailed source | Read the actual available source; do not assume a missing native file exists |
| [Active Sprint 0 prompt](prompts/SPRINT_0_MASTER_PROMPT.md)                                                                                                                  | Current sprint scope and Definition of Done                                       | Keep Sprint 0 active until the owner explicitly changes it                   |
| [STABLE framework](engineering/STABLE_FRAMEWORK.md)                                                                                                                          | Engineering method                                                                | Preserve normative guidance during status updates                            |
| [STABLE coding skill](../ai-rules/STABLE_AI_CODING_SKILL.md)                                                                                                                 | AI implementation/verification/reporting method                                   | Apply alongside the repository rules                                         |

Root product/framework/prompt/skill copies remain available as distribution references. They were not rewritten to encode changing deployment status or pay down unrelated formatting debt. Compare conflicting copies and report genuine discrepancies before changing requirements.

## Operational documents

| Document                                      | Owns                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Project tracker](PROJECT_TRACKER.md)         | Every sprint/milestone ID, status and progress, synchronized with UI data          |
| [AI handoff](AI_HANDOFF.md)                   | Cross-agent restart instructions, invariants, environment and verification runbook |
| [Sprint 0 validation](SPRINT_0_VALIDATION.md) | Dated executed checks, coverage matrix, failure states and acceptance gaps         |
| [Architecture](ARCHITECTURE.md)               | Module/runtime boundaries and provider adapters                                    |
| [Data model](DATA_MODEL.md)                   | Tables, migration chain, RPC/constraint and financial-domain boundaries            |
| [Security](SECURITY.md)                       | Authentication/authorization, secrets, isolation and known security limits         |
| [Decisions](DECISIONS.md)                     | Durable ADRs and engineering choices                                               |
| [Authentication](AUTHENTICATION.md)           | Auth/cookie/email/invitation behavior and external configuration                   |
| [Administration](ADMINISTRATION.md)           | Role/status/settings transitions, locks, stale writes and audit semantics          |
| [Database testing](DATABASE_TESTING.md)       | Hosted transactional tests versus isolated committed race fixtures                 |
| [CI](CI.md)                                   | Event coverage, required gate, artifacts, isolation and main protection            |
| [Implementation log](IMPLEMENTATION_LOG.md)   | Append-only dated delivery/deployment/verification history                         |

## Agent entry points

- Codex and other repository agents: [AGENTS.md](../AGENTS.md).
- Claude Code: [CLAUDE.md](../CLAUDE.md), then the shared rules/handoff.
- Antigravity: [ANTIGRAVITY.md](../ANTIGRAVITY.md), then the shared rules/handoff. This is a documented entry point; no tool-specific automatic loading is claimed.

## Updating status

Update `src/modules/project-tracker/tracker-data.ts` and `PROJECT_TRACKER.md` together; a unit test checks every table ID/status/progress row. Update dated evidence only after checks actually execute. Include source branch/commit/PR context in the handoff or review record; verify live GitHub and database state before acting on old snapshots. Keep credentials and real connection URLs out of all documents.

## Next sprint proposal

The [bounded Sprint 1 prompt](prompts/SPRINT_1_MASTER_PROMPT.md) is proposed and inactive. The [foundation completion gate](SPRINT_0_COMPLETION_GATE.md) is not passed; Sprint 0 remains active. Approval and implementation follow the documented gate, rather than the presence of a prompt file.
