---
name: stable-app-development
summary: Apply the STABLE Framework to app development, refactoring, debugging, and AI-assisted Vibe Coding.
description: Use this skill whenever implementing, modifying, debugging, refactoring, or reviewing application code. It enforces surgical changes, SOLID design, testability, architecture alignment, bottleneck awareness, low-regression delivery, and expandable/scalable implementation.
---

# STABLE App Development Skill

## Purpose

Use this skill to guide AI-assisted development in a disciplined, production-aware way. The goal is to prevent messy Vibe Coding, unnecessary rewrites, broken flows, hidden regressions, weak architecture, and unscalable code.

This skill applies the **STABLE Framework**:

- **S** — Surgical & SOLID
- **T** — Testable & Traceable
- **A** — Architecture-Aligned & Available
- **B** — Balanced for Bottlenecks
- **L** — Low-Regression & Loosely Coupled
- **E** — Expandable & Elastic

---

# When to Use This Skill

Use this skill for:

- New feature implementation
- Bug fixing
- Refactoring
- UI changes
- API changes
- Database changes
- Authentication and authorization changes
- Billing and subscription changes
- Integration work
- Performance improvements
- Deployment fixes
- Build errors
- Production-readiness review
- Code review
- AI-generated code cleanup

Do not use this skill to justify over-engineering. Use it to build cleanly, safely, and pragmatically.

---

# Core Instruction

Before making code changes, apply the STABLE process:

1. Analyze the request.
2. Identify affected files, modules, APIs, database areas, dependencies, and user flows.
3. Determine the smallest safe implementation.
4. Preserve architecture and existing behavior.
5. Implement with clean, maintainable code.
6. Validate with tests, builds, type checks, and manual verification steps.
7. Summarize what changed, what was verified, and what risks remain.

---

# Operating Rules

## S — Surgical & SOLID

Make precise, minimal, targeted changes.

Follow SOLID principles:

- **Single Responsibility:** each module, function, class, or component should have one clear purpose.
- **Open/Closed:** prefer extension points over repeated modification of core logic.
- **Liskov Substitution:** implementations must honor the expectations of their abstractions.
- **Interface Segregation:** prefer small focused interfaces over large overloaded contracts.
- **Dependency Inversion:** depend on abstractions where it improves maintainability and testability.

Rules:

- Do not rewrite unrelated areas.
- Do not change public behavior unless explicitly requested.
- Do not introduce unnecessary abstractions.
- Do not create large god files, god components, god services, or god controllers.
- Prefer readable, maintainable code over clever code.

---

## T — Testable & Traceable

Every meaningful change must be verifiable.

Rules:

- Define acceptance criteria before implementation.
- Preserve or improve type safety.
- Add or update tests when logic, APIs, database behavior, auth, billing, or critical flows change.
- Add validation for inputs, outputs, permissions, and edge cases.
- Add useful logs or error handling for critical operations.
- Provide clear verification steps after implementation.

Verification should consider:

- Unit tests
- Integration tests
- End-to-end tests
- Build checks
- Type checks
- Lint checks
- Manual QA steps
- Logs and observability

---

## A — Architecture-Aligned & Available

Follow the project’s existing architecture and make critical flows dependable.

Rules:

- Inspect existing patterns before implementing.
- Place logic in the correct layer:
  - UI / presentation
  - domain / business logic
  - application services
  - data access
  - infrastructure / integrations
- Maintain existing naming conventions, folder structure, and coding style.
- Avoid mixing responsibilities across layers.
- Handle failures safely with retries, timeouts, fallbacks, or graceful degradation where appropriate.
- For long-running or unreliable tasks, consider background jobs or queues.

Availability considerations:

- What happens if the database fails?
- What happens if a third-party API fails?
- What happens if authentication, billing, email, storage, or AI services fail?
- Can the user retry safely?
- Are important operations idempotent where needed?

---

## B — Balanced for Bottlenecks

Be performance-aware without premature over-engineering.

Rules:

- Identify likely bottlenecks before optimizing.
- Use pagination for large datasets.
- Avoid unnecessary network calls and repeated expensive operations.
- Consider indexes for important queries.
- Cache expensive or frequently accessed data when useful.
- Batch, chunk, stream, parallelize, or queue heavy operations when justified.
- Avoid traffic, database, queue, or storage hotspots.
- Do not add distributed-system complexity unless product needs justify it.

Ask:

- Will this work with 10x more users or data?
- Is there a query, loop, API call, file operation, or AI call that could become expensive?
- Should this be cached, paginated, indexed, queued, batched, or moved to a background job?

---

## L — Low-Regression & Loosely Coupled

Protect existing behavior and reduce fragile dependencies.

Rules:

- Identify every existing flow that may be affected.
- Preserve API contracts unless a versioned or coordinated change is requested.
- Preserve authentication, authorization, billing, database, and integration behavior.
- Use backward-compatible changes where possible.
- Avoid tight coupling between modules.
- Keep dependencies explicit and minimal.
- Use feature flags, migration plans, or rollback plans for risky changes.
- Do not remove existing functionality unless explicitly asked.

Protect especially:

- Login and signup
- Role-based access control
- Payment and subscription flows
- Admin flows
- User dashboards
- Database migrations
- Public APIs
- Webhooks
- Email/notification flows
- Third-party integrations
- Existing UI routes and navigation

---

## E — Expandable & Elastic

Build for future growth without building imaginary features too early.

Rules:

- Avoid hardcoding values that should be configurable.
- Keep extension points clean.
- Make domain models flexible enough for likely future requirements.
- Keep stateless layers stateless where practical.
- Externalize environment-specific configuration.
- Support future plans, roles, modules, integrations, tenants, or automation when likely.
- Avoid overbuilding complex infrastructure before it is needed.

Ask:

- Can this feature be extended later without a rewrite?
- Can this handle more users, data, tenants, or regions if needed?
- Am I preparing for growth without making the current version unnecessarily complex?

---

# Required Workflow for AI Coding Agents

When receiving a development request, respond and act using this structure.

## 1. Request Understanding

Restate the goal in clear technical terms.

Identify:

- Feature or bug objective
- Relevant app area
- Expected behavior
- Constraints
- What must not break

## 2. Impact Analysis

Identify likely affected areas:

- Files
- Components
- Services
- APIs
- Database tables or collections
- Auth or permissions
- Billing or subscriptions
- Integrations
- Tests
- Build/deployment configuration

## 3. STABLE Plan

Create a focused implementation plan:

- Smallest safe change
- Architecture placement
- Data/API changes if any
- Validation and error handling
- Tests or verification steps
- Regression risks

## 4. Implementation

Implement carefully:

- Keep changes minimal
- Follow existing patterns
- Preserve type safety
- Use clear names
- Keep responsibilities separated
- Avoid unrelated changes

## 5. Verification

Run or recommend verification:

- Install/build command if relevant
- Type check
- Lint
- Unit/integration/e2e tests
- Manual user-flow checks
- Regression checks

## 6. Final Summary

Summarize:

- What changed
- Files changed
- How it was verified
- Remaining risks or follow-up tasks

---

# Output Contract

For each implementation, provide:

```text
STABLE Analysis
- Goal:
- Affected Areas:
- Risks:
- Plan:

Implementation Summary
- Changed:
- Preserved:
- Why this approach:

Verification
- Checks run:
- Manual tests:
- Regression areas reviewed:

Remaining Notes
- Risks:
- Follow-ups:
```

Use this full structure for complex tasks. For small tasks, use a shorter version while still applying the same reasoning.

---

# Guardrails

The AI coding agent must not:

- Rewrite the whole app for a small feature.
- Change unrelated files without a clear reason.
- Break existing APIs, routes, database behavior, auth, billing, or integrations.
- Remove working functionality unless explicitly instructed.
- Introduce new libraries without explaining why they are necessary.
- Add unnecessary abstraction or infrastructure.
- Ignore existing project conventions.
- Skip validation for critical flows.
- Hide uncertainty.
- Claim tests passed if they were not run.

The AI coding agent should:

- Ask a clarifying question only when truly blocked.
- Prefer safe assumptions for small implementation details.
- Explain risky changes before making them.
- Keep the codebase cleaner or at least not worse.
- Be honest about what was verified and what was not.

---

# Reusable Implementation Prompt

Use this prompt when asking an AI coding assistant to implement a feature:

```text
Use the STABLE App Development Skill for this task.

Goal:
[Describe the feature, bug fix, refactor, or improvement.]

Context:
[Describe the app, framework, files, current behavior, screenshots, errors, or constraints.]

Requirements:
[List exact requirements.]

Do not break:
[List existing flows, APIs, auth, billing, database behavior, integrations, or UI areas that must remain unchanged.]

Apply STABLE:
- Surgical & SOLID: make the smallest correct change and follow SOLID principles.
- Testable & Traceable: define acceptance criteria and add/describe tests or verification.
- Architecture-Aligned & Available: follow existing patterns and handle failure safely.
- Balanced for Bottlenecks: consider performance, pagination, caching, queues, indexes, and likely bottlenecks without over-engineering.
- Low-Regression & Loosely Coupled: protect existing behavior and keep dependencies minimal.
- Expandable & Elastic: design for likely future growth without unnecessary complexity.

Before coding:
1. Analyze the request.
2. Identify affected files/modules.
3. Propose a focused plan.

Then implement carefully and finish with:
- Summary of changes
- Files changed
- Verification steps completed
- Regression risks reviewed
- Any remaining risks or follow-ups
```

---

# Reusable Debugging Prompt

```text
Use the STABLE App Development Skill to debug this issue.

Problem:
[Paste the error, screenshot details, logs, stack trace, or broken behavior.]

Expected behavior:
[Describe what should happen.]

Recent changes:
[Describe what changed recently, if known.]

Constraints:
[Describe what must not be broken.]

Please:
1. Diagnose the likely root cause.
2. Identify affected files or modules.
3. Propose the smallest safe fix.
4. Implement only the necessary changes.
5. Verify the fix and check for regressions.
6. Explain what changed and why.
```

---

# Reusable Refactoring Prompt

```text
Use the STABLE App Development Skill to refactor this area safely.

Target area:
[Files, components, services, or modules.]

Reason for refactor:
[Complexity, duplication, performance, architecture cleanup, testability, etc.]

Constraints:
- Preserve existing behavior.
- Preserve API contracts.
- Preserve database behavior.
- Preserve auth, billing, integrations, and UI flows unless explicitly stated.

Please:
1. Analyze current structure.
2. Identify risks.
3. Propose a minimal refactor plan.
4. Apply SOLID and separation of concerns.
5. Avoid unnecessary rewrites.
6. Add or update tests/verification steps.
7. Summarize changes and regression checks.
```

---

# Suggested Repository Placement

Recommended options:

```text
docs/STABLE_FRAMEWORK.md
ai-rules/STABLE_AI_CODING_SKILL.md
```

For project-level AI coding guidance, also consider adding a shorter reference in:

```text
CLAUDE.md
AGENTS.md
.cursor/rules/stable-framework.md
```

Use the locations supported by your actual coding assistant setup.
