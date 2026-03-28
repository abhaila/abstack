# Technical Proposal: [Concise Title]

## 1) Executive Summary
- [ ] Objective: [One-paragraph summary of the desired outcome]
- [ ] Scope: [In-scope / Out-of-scope components/services]
- [ ] Success Metrics: [SLIs/SLOs, business KPIs, error budget impact]

## 2) Business Context and Goals
- [Context, stakeholders, user impact, value, and constraints]
- [Links to product specs, ADRs, tickets, and timelines]

## 3) Requirements Summary
### 3.1 Functional Requirements
- [Capabilities, APIs/contracts (REST/gRPC/GraphQL), workflows]
- [Inputs/outputs, validation, idempotency, pagination, rate limits]
- [Backward compatibility and deprecation windows]

### 3.2 Non-Functional Requirements
- [Performance targets: p50/p95 latency, throughput, resource budget]
- [Reliability: availability, retries/backoff, timeouts, circuit-breaking]
- [Security/privacy: authN/Z, scopes, data handling, encryption, compliance]
- [Observability: logging, metrics, tracing, diagnostics]
- [Accessibility/UX (if applicable)]

### 3.3 Data and Schema
- [Schema changes, migrations, backfills, reindexing]
- [Data lifecycle, retention, PII classification, encryption]
- [Data quality validation, reconciliation steps]

## 4) Current State Analysis
- [ ] Architecture Overview:
    - [Systems/services/modules involved, data flows, dependencies]
- [ ] Code Files Affected:
    - [service-a/path/file.ext — brief description]
    - [service-b/path/file.ext — brief description]
- [ ] Current Behavior:
    - [Summarize relevant flows and interactions]
- [ ] Constraints/Assumptions:
    - [Enumerate findings and inferred assumptions]

## 5) Proposed Design
### 5.1 High-Level Approach
- [Approach, rationale, alternatives considered, trade-offs]

### 5.2 Detailed Change List (by component/file)
For each impacted unit, specify operation, content changes, and rationale.

- Component: [service/module/package]
    - Path: [repo/path.ext]
        - [ ] Operation: [Create | Modify | Remove | Move]
        - [ ] Summary of change:
            - [Line-level intent, functions/endpoints affected, config keys]
        - [ ] Backward compatibility:
            - [Flags, fallbacks, dual-read/write, migration path]
        - [ ] Testing notes:
            - [How to verify this specific change]

[Repeat for all impacted components/files]

### 5.3 API/Contract Changes and Interfaces
- [OpenAPI/Protobuf/GraphQL schema diffs]
- Versioning strategy and deprecation timeline
- Contract tests required and consumer/provider impact

### 5.4 Data Migration and Backfill Plan
- Migration steps, ordering, batching strategy, lock/time window considerations
- Roll-forward and rollback strategy; data validation/reconciliation
- Safety guards: idempotency, retries, partial failure handling

### 5.5 Configuration and Feature Flags
- New/updated config keys and defaults
- Feature flag strategy (enablement sequence, kill switches, fallback behavior)

### 5.6 Security and Privacy
- Threat model changes, attack surface, dependency risks
- AuthN/Z updates, scopes/roles, audit logging
- PII handling, encryption, token/key management

### 5.7 Observability
- Logs: structure, levels, redaction
- Metrics: counters/gauges/histograms; alert thresholds
- Tracing: spans/tags; propagation across services
- Dashboard and alert updates

### 5.8 Performance and Reliability
- Expected resource impact, capacity planning, caching strategy
- Timeouts/retries/backoff settings; circuit-breaking; bulkheads
- Load testing profile and success thresholds

### 5.9 CI/CD and DevEx
- Pipeline updates (build, test, security scans, policy checks)
- Promotion criteria, environment parity, test data management
- Local dev tooling updates and documentation

## 6) Deployment, Rollout, and Backout
- [ ] Deployment Steps:
    - [Ordered steps per environment/region]
- [ ] Rollout Strategy:
    - [Blue/green, canary, progressive exposure, shadow traffic, A/B]
- [ ] Soak/Validation Plan:
    - [Health checks, metrics gates, manual checks]
- [ ] Backout Plan:
    - [Rollback steps, data reversion/forward-fix plan, contingency triggers]

## 7) Testing Strategy
- [ ] Unit tests: [coverage targets, key cases]
- [ ] Integration tests: [service-to-service, DB, queue]
- [ ] Contract tests: [consumer/provider]
- [ ] E2E tests: [user journey/system validation]
- [ ] Non-functional: [load/stress, chaos/resilience, security tests]
- [ ] Manual validation (copy-paste runnable):
```
1) [Command/request]
2) [Expected result/metrics]
3) [Cleanup/rollback]
```

## 8) Risks and Mitigations
- [Enumerate risks, likelihood, impact, detection, mitigation, owners]
- [Operational risks and monitoring strategies]

## 9) Alternatives Considered
- [Alternative A: pros/cons]
- [Alternative B: pros/cons]
- Decision rationale and selection criteria

## 10) Cost and Sustainability
- Cloud/resource cost impact and budget considerations
- Technical debt implications and maintenance overhead
- Sustainability: performance/cost trade-offs, team ownership

## 11) Open Questions and Assumptions
- [ ] OPEN: [Question]
- [ ] OPEN: [Question]
- [ ] ASSUMPTION (VALIDATION REQUIRED): [Assumption]
- Resolution plan, owner, and timeline

## 12) Story Seeds for Handoff (Single-Commit Oriented)
Prepare crisp, atomic seeds for `create-stories`. Each seed must be implementable in 2–4 hours as one atomic commit.

- [ ] Seed 1: [User-focused title]
    - Context: [What/where/why]
    - Implementation hints: [Likely files/services, tests]
    - Acceptance check: [1–3 bullet points]

[Add additional seeds as needed]

## 13) Appendix
### 13.1 Code References and Links
- [Direct links to relevant repos/files/functions; ownership and notes]

### 13.2 Verification Commands
```
# Add safe, idempotent commands or scripts used for verification
```

### 13.3 Glossary
- [Define domain-specific terms, acronyms, and key concepts]
