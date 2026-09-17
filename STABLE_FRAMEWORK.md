# STABLE Framework for App Development

**STABLE** is a practical engineering framework for building applications that are precise, maintainable, architecture-respecting, regression-safe, performance-aware, scalable, and extensible.

It is designed for both traditional software development and AI-assisted development, including Vibe Coding with tools such as Claude Code, Antigravity, Cursor, Windsurf, GitHub Copilot, and similar coding assistants.

---

## Core Philosophy

> Build with the smallest correct change, aligned to the project architecture, validated through testing and traceability, protected against regression, and prepared to scale and evolve.

The goal is not to over-engineer every feature. The goal is to build cleanly enough that the application can grow without becoming fragile, expensive to maintain, or difficult to extend.

---

## STABLE Overview

| Letter | Meaning | Main Goal |
|---|---|---|
| **S** | **Surgical & SOLID** | Make precise changes using strong design principles. |
| **T** | **Testable & Traceable** | Verify correctness and make behavior observable. |
| **A** | **Architecture-Aligned & Available** | Respect the project structure and design for reliability. |
| **B** | **Balanced for Bottlenecks** | Handle performance, capacity, load, and throughput pragmatically. |
| **L** | **Low-Regression & Loosely Coupled** | Protect existing behavior and reduce fragile dependencies. |
| **E** | **Expandable & Elastic** | Support future features and growth without major rewrites. |

---

# 1. S — Surgical & SOLID

## Rule

> Make the smallest correct change that solves the problem cleanly.

## Meaning

Changes should be precise, targeted, and justified. Avoid unnecessary rewrites, broad refactors, or touching unrelated files. Every change should preserve clarity and follow sound design principles.

## Practices

- Change only what is necessary.
- Keep functions, components, classes, and modules focused.
- Avoid mixing UI logic, business logic, data access, and infrastructure concerns.
- Prefer simple, readable code over clever code.
- Refactor only when it reduces complexity, removes duplication, or enables the feature safely.
- Avoid creating large “god” components, services, controllers, or utility files.

## SOLID Principles

### Single Responsibility Principle
Each unit should have one clear reason to change.

### Open/Closed Principle
Code should be open for extension but closed for unnecessary modification.

### Liskov Substitution Principle
A derived implementation should behave correctly wherever the base abstraction is expected.

### Interface Segregation Principle
Use focused interfaces instead of large, overloaded interfaces.

### Dependency Inversion Principle
Depend on abstractions where it improves flexibility and testability.

## Quick Check

- Is this the smallest correct change?
- Is each unit doing one job well?
- Did I avoid unrelated rewrites?
- Does this follow SOLID where appropriate?

---

# 2. T — Testable & Traceable

## Rule

> Every meaningful change should be verifiable.

## Meaning

A feature is not complete until there is a clear way to prove that it works and that it did not break important existing behavior.

## Practices

- Define acceptance criteria before implementation.
- Add or update tests for important logic.
- Validate API inputs and outputs.
- Check edge cases, error states, permissions, and loading states.
- Use clear logs for critical flows and failures.
- Keep naming, commits, and comments understandable.
- Make important behavior traceable through code, logs, metrics, or documentation.

## Verification Types

- **Static checks:** linting, formatting, type checking.
- **Unit tests:** business logic and isolated functions.
- **Integration tests:** APIs, services, database, auth, billing, and external dependencies.
- **End-to-end tests:** critical user flows.
- **Manual QA:** UI behavior, responsiveness, accessibility, and edge cases.
- **Observability:** logs, metrics, error reporting, and traces.

## Quick Check

- How do I know this works?
- What tests or checks prove it?
- If it fails in production, how will I detect it?
- Can another developer trace what changed and why?

---

# 3. A — Architecture-Aligned & Available

## Rule

> Build features where they belong, and make important flows dependable.

## Meaning

Every change must respect the project’s architecture, naming conventions, folder structure, data flow, and existing patterns. Critical features should also degrade safely when dependencies fail.

## Practices

- Follow the existing architecture unless there is a strong reason to improve it.
- Put logic in the correct layer:
  - UI / presentation
  - domain / business logic
  - application services
  - data access
  - infrastructure / integrations
- Maintain clear module and service boundaries.
- Use retries, timeouts, fallbacks, and graceful degradation where appropriate.
- Avoid making one dependency failure collapse the entire system.
- Use queues or background jobs for long-running or unreliable tasks.

## Availability Considerations

- What happens if the database is slow or unavailable?
- What happens if a third-party API fails?
- What happens if an email, payment, storage, or AI service times out?
- Can the user recover or retry safely?
- Are critical operations idempotent where needed?

## Quick Check

- Does this fit the existing architecture?
- Is the logic placed in the right layer?
- Does the feature fail safely?
- Does the user experience remain acceptable during partial failure?

---

# 4. B — Balanced for Bottlenecks

## Rule

> Optimize for real bottlenecks, not imaginary ones.

## Meaning

Performance and scalability matter, but premature complexity is dangerous. The goal is to identify likely bottlenecks and address them with the right level of engineering.

## Practices

- Measure before optimizing when possible.
- Use pagination for large datasets.
- Add database indexes for important queries.
- Avoid repeated expensive operations.
- Cache frequently accessed or expensive-to-compute data.
- Batch, chunk, stream, or queue heavy operations where needed.
- Parallelize independent tasks carefully.
- Avoid hotspots in data models, database writes, or traffic distribution.
- Use load balancing and autoscaling when the product justifies it.

## Bottleneck Areas

### Scalability
Can the feature handle more users, data, requests, and tenants?

### Capacity / Throughput
Can the system process expected request volume without slowing down?

### Load Distribution
Are traffic, reads, writes, jobs, and storage distributed safely?

### Execution Speed
Can slow workflows be cached, batched, parallelized, streamed, or moved to background jobs?

## Quick Check

- Where is the real bottleneck?
- Will this work with 10x more data or users?
- Should this be cached, paginated, queued, batched, or indexed?
- Am I avoiding unnecessary infrastructure complexity?

---

# 5. L — Low-Regression & Loosely Coupled

## Rule

> New work must not break existing behavior, contracts, or workflows.

## Meaning

Regression safety is a business requirement. Existing users, APIs, auth flows, billing flows, integrations, and database behavior must be protected.

## Practices

- Identify affected features before coding.
- Preserve existing UI flows unless change is intentional.
- Preserve API contracts or version them safely.
- Avoid breaking database schemas without migrations and rollback plans.
- Keep dependencies explicit and minimal.
- Prefer composition over rigid inheritance or tight coupling.
- Use feature flags for risky changes.
- Maintain backward compatibility where possible.

## Protect These Areas

- Authentication and authorization
- Billing and subscriptions
- API contracts
- Database behavior and migrations
- User roles and permissions
- Existing UI flows
- External integrations
- Notifications and email flows
- Data import/export behavior
- Admin workflows

## Quick Check

- What existing feature could this break?
- Did I preserve current contracts and flows?
- Are dependencies minimal and explicit?
- Can this module change later without creating a large ripple effect?

---

# 6. E — Expandable & Elastic

## Rule

> Build for future growth without overbuilding too early.

## Meaning

The application should be easy to extend and capable of scaling when needed. The solution should prepare the path for growth without adding unnecessary complexity today.

## Practices

- Design clean extension points.
- Prefer configuration over hardcoding.
- Keep domain models flexible enough for likely future needs.
- Keep stateless application layers where possible.
- Externalize environment-specific settings.
- Use CDNs for static assets where appropriate.
- Prepare for horizontal scaling when the product needs it.
- Consider multi-tenant, region, and data locality requirements when relevant.

## Expansion Areas

- New features
- New user roles
- New subscription plans
- New integrations
- More tenants or organizations
- More data volume
- More geographic regions
- More automation and AI workflows

## Quick Check

- Can I add related features later without rewriting the core?
- Are configs and business rules hardcoded unnecessarily?
- Can this scale in usage, data, or geography if needed?
- Am I preparing wisely without over-engineering?

---

# Supporting Engineering Principles

## KISS — Keep It Simple
Use the simplest solution that satisfies the requirement correctly.

## YAGNI — You Are Not Gonna Need It
Do not build hypothetical features too early.

## DRY — Do Not Repeat Yourself
Remove harmful duplication, but avoid premature abstraction.

## Separation of Concerns
Keep UI, business logic, data access, and infrastructure separate.

## Security by Default
Validate inputs, protect secrets, enforce auth, sanitize outputs, use least privilege, and avoid leaking sensitive information.

## Fail Safely
Handle errors intentionally. Provide clear fallbacks, retries, and recovery paths.

## Observability
Use logs, metrics, traces, and alerts where they create operational value.

## Documentation as Leverage
Document important architecture, flows, assumptions, and decisions.

## Progressive Enhancement
Start with a solid simple version, then strengthen it based on evidence and product needs.

---

# STABLE Development Cycle

Use this cycle for every feature, bug fix, refactor, or AI-assisted development task.

## 1. Scope

- What is the exact problem?
- What is the smallest useful solution?
- What must not break?
- What is out of scope?

## 2. Think

- Which layer does this belong to?
- What existing patterns should be followed?
- What future needs should be lightly prepared for?
- What assumptions need confirmation?

## 3. Assess Risk

- What regressions are possible?
- Are there API, database, auth, billing, security, or integration impacts?
- Are there performance or scalability concerns?
- Is a migration, feature flag, or rollback plan needed?

## 4. Build

- Implement surgically.
- Keep code clean and readable.
- Respect the architecture.
- Apply SOLID where appropriate.
- Avoid unnecessary rewrites.

## 5. Validate

- Run type checks, linting, tests, and builds.
- Verify affected user flows.
- Check logs and error handling.
- Confirm regression safety.

## 6. Evolve

- Refine only where useful.
- Document key decisions.
- Summarize changes and risks.
- Leave the codebase cleaner or at least not worse.

---

# STABLE Checklist for Pull Requests

Use this before merging code.

## Surgical & SOLID

- [ ] The change is focused and limited to the requirement.
- [ ] Responsibilities are separated clearly.
- [ ] SOLID principles are followed where appropriate.
- [ ] No unnecessary rewrites or unrelated refactors were introduced.

## Testable & Traceable

- [ ] Acceptance criteria are satisfied.
- [ ] Tests or validation steps were added or executed.
- [ ] Important errors are visible through logs or user-safe messages.
- [ ] The change is understandable from commits, PR notes, or documentation.

## Architecture-Aligned & Available

- [ ] The implementation follows existing project patterns.
- [ ] Logic is placed in the correct layer.
- [ ] Failure cases are handled safely.
- [ ] Critical flows remain dependable.

## Balanced for Bottlenecks

- [ ] Queries, loops, network calls, and heavy operations are reasonable.
- [ ] Pagination, caching, batching, indexing, queues, or async processing were considered where relevant.
- [ ] No premature infrastructure complexity was added.

## Low-Regression & Loosely Coupled

- [ ] Existing UI flows, API contracts, auth, billing, database behavior, and integrations are protected.
- [ ] Dependencies are minimal and explicit.
- [ ] Backward compatibility was preserved or migration steps were included.

## Expandable & Elastic

- [ ] The solution can support likely future features.
- [ ] Hardcoding was avoided where configuration is more appropriate.
- [ ] The design can grow without a major rewrite.

---

# STABLE Prompt Template for AI-Assisted Development

Use this prompt with AI coding tools before asking them to implement a feature.

```text
Apply the STABLE Framework to this implementation.

S — Surgical & SOLID:
Make the smallest correct change needed. Follow SOLID principles. Keep responsibilities separated and avoid unnecessary rewrites.

T — Testable & Traceable:
Define acceptance criteria. Preserve type safety. Add or update appropriate validation, tests, logs, or observable checks.

A — Architecture-Aligned & Available:
Follow the project’s existing architecture, patterns, folder structure, and boundaries. Ensure important flows remain resilient and fail safely.

B — Balanced for Bottlenecks:
Consider performance, throughput, load distribution, caching, pagination, indexing, async processing, queues, batching, and likely bottlenecks. Do not over-engineer.

L — Low-Regression & Loosely Coupled:
Protect existing features, UI flows, API contracts, authentication, authorization, billing, integrations, and database behavior. Keep dependencies minimal and explicit.

E — Expandable & Elastic:
Build so the solution can be extended later and scaled as needed without major rewrites.

Work step by step:
1. Analyze the request.
2. Identify affected files, modules, APIs, database areas, and user flows.
3. Propose a focused implementation plan.
4. Implement carefully.
5. Verify correctness and regression safety.
6. Summarize what changed, how it was verified, and any remaining risks.
```

---

# One-Line Definition

> **STABLE means building small, clean, testable, resilient, scalable changes that protect the current system and support future growth.**
