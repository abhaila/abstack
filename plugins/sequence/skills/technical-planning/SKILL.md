---
name: technical-planning
description: Lead interactive Q&A discovery to gather requirements and create production-ready technical proposals. Use when starting new features, designing implementations, creating technical proposals, planning refactoring efforts, assessing feasibility of changes, improving test architecture, evaluating code quality improvements, or needing structured requirements gathering with codebase assessment. Triggers on phrases like "tech proposal", "write up a proposal", "feasibility assessment", "refactoring plan", or "how feasible".
---

# Technical Planning Skill

This skill guides an expert engineer through:
1) An iterative, interactive Q&A loop to gather and refine requirements (single-question cadence).
2) A systematic production-grade codebase assessment to identify all impacted components, dependencies, risks, and operational implications.
3) The creation of a comprehensive, implementation-ready Technical Proposal.

The final output is a single markdown file written to the `docs/plans`, suitable for direct handoff to other agents.

---

## Purpose and Scope

- Lead a structured Q&A loop to transform an initial idea into a clear, complete set of requirements for production systems.
- When the user confirms discovery is complete, assess the codebase(s) to determine precisely what changes are required across services, modules, APIs, data stores, infra, and CI/CD.
- Produce a deeply detailed technical proposal including component-by-component change plans, testing strategies, rollout and rollback, and operational readiness.
- Ensure the proposal is directly consumable by the next AI agent or human software engineer.

---

## Output Requirements

### File Naming

**Filename format**: `<YYYY-MM-DD>-tech-proposal-{slug}.md`

Examples:
- `docs/plans/2026-01-17-tech-proposal-oauth-integration.md`
- `docs/plans/2026-01-17-tech-proposal-user-permissions.md`

- You MUST write the final technical proposal to a markdown file in the `docs/plans` directory at the repo root with sequential numbering.
- After writing the file, return only a concise confirmation with the created file path. Do not include other narrative content.

CRITICAL: The proposal must contain sufficient detail that a competent engineer could implement the change without additional clarification.

---

## Interactive Discovery Workflow

**CRITICAL REQUIREMENT**: You MUST use the `AskUserQuestion` tool for ALL discovery questions. Do NOT ask questions in plain text.

You must run a Q&A loop until the user explicitly says to stop and proceed to the proposal. Stop signals include: "done", "proceed", "finalize", "write proposal", or explicit confirmation that the requirements are complete.

Discovery loop protocol:
1) Confirm the initial intent by paraphrasing the user's goal and target impact.
2) Use the `AskUserQuestion` tool to ask ONE focused question at a time.
3) After receiving each answer:
   - Summarize what you learned.
   - Identify assumptions and open questions.
   - Propose sensible defaults and ask for confirmation using `AskUserQuestion` tool.
4) Repeat until the user signals completion.

**Question Protocol**:
- **ONE question at a time** - Never ask multiple questions in one message
- **ALWAYS use AskUserQuestion tool** - Never ask questions in plain text
- **Provide 2-4 options** when possible to guide the user
- **Include an "Other" option** automatically available for custom input
- **Short headers** (max 12 chars) for question chips/tags

Information you MUST capture during discovery (production-focused):
- Objective and value
  - Core problem/opportunity, affected personas/systems, expected outcomes.
  - Measurable success metrics (SLIs/SLOs, error budget impact, latency targets, conversion lift, cost reduction).
- Scope boundaries
  - In-scope vs. out-of-scope components/services/modules.
  - Environments (dev/staging/prod), regions, tenants.
- Functional requirements
  - Capabilities, APIs/contracts (REST/gRPC/etc), CLI/UX flows.
  - Inputs/outputs, validation rules, idempotency, ordering, pagination, rate limits.
  - Backward compatibility and deprecation windows.
- Data and schema
  - Data model changes, migrations, backfills, reindexing.
  - Data lifecycle, retention, PII classification, encryption at rest/in transit.
- Non-functional requirements
  - Performance (latency, throughput, resource use), reliability (availability, retry, backoff), scalability (horizontal/vertical, sharding).
  - Security/privacy/compliance (authN/Z, RBAC/ABAC, SOC2/PCI/GDPR/CCPA), secrets handling, key rotation, least-privilege.
  - Observability (logging, metrics, tracing), diagnostics, runbook needs.
- Integration and dependencies
  - Internal/external services, message buses, schedulers, caches, CDNs.
  - Client compatibility (web/mobile/SDK versions) and version drift.
  - Third-party limits/quotas and SLAs.
- Operational considerations
  - CI/CD pipeline changes, feature flags, canary strategy, migration windows.
  - On-call ownership, alerting, dashboards, support playbooks.
  - Rollback/forward-fix strategy and data safety.
- Risks and assumptions
  - Technical, product, operational, security, and compliance risks.
  - Assumptions that require validation and their owners.
- Definition of Done (DoD)
  - Implementation, tests, docs, observability, security review, release notes, runbook updates, and sign-offs.

**Example AskUserQuestion Usage**:

```
AskUserQuestion tool with:
{
  "questions": [
    {
      "question": "What is the primary deployment strategy for this change?",
      "header": "Deployment",
      "options": [
        {
          "label": "Feature flag rollout",
          "description": "Gradual rollout using feature flags with percentage-based targeting"
        },
        {
          "label": "Blue-green deployment",
          "description": "Deploy to new environment, switch traffic all at once"
        },
        {
          "label": "Canary deployment",
          "description": "Gradual traffic shift to new version with monitoring"
        },
        {
          "label": "Direct deployment",
          "description": "Standard deployment without special rollout strategy"
        }
      ],
      "multiSelect": false
    }
  ]
}
```

Suggested discovery areas (ask ONE question at a time using AskUserQuestion):

**Objective and Value**
- What is the primary business outcome?
- How will success be measured?

**Scope and Constraints**
- Which components/services are in scope?
- What constraints must be respected (regulatory, SLA, platform)?

**Functional Details**
- What are the key user workflows?
- What error scenarios must be handled?

**Data and Schema**
- What data model changes are needed?
- Are migrations/backfills required?

**Non-Functional Expectations**
- What are the performance targets (latency, throughput)?
- What security/compliance requirements apply?

**Integration and Compatibility**
- Which systems are affected (upstream/downstream)?
- What client compatibility is required?

**Rollout and Operations**
- What deployment strategy should be used?
- What monitoring/alerting is needed?

**Risks and Open Questions**
- What are the biggest unknowns?
- What trade-offs are acceptable?

**For each area, use AskUserQuestion with clear options that guide the user to comprehensive answers.**

Working notes during discovery:
- Maintain a concise "Discovery Ledger" (objective, decisions, assumptions, open items).
- Confirm/update the ledger after each Q&A iteration.

Transition to planning:
- When the user signals completion, acknowledge discovery closure.
- If key details are missing, document explicit ASSUMPTIONS and proceed, tagging each as "ASSUMPTION — VALIDATION REQUIRED".

---

## Production Codebase Assessment Procedure

Perform a structured assessment across the relevant codebase(s) to map the requested change to concrete components, contracts, configurations, and operational assets.

Orientation and inventory (general, not repo-specific):
- Architecture overview: monolith, microservices, modular monorepo, polyrepo.
- Languages/frameworks/runtimes and major libraries.
- Domain boundaries, service ownership, API gateways, and message flows.
- Data stores (SQL/NoSQL/warehouse), schema toolchains, migrations, and DR.
- Infra-as-Code (Terraform/CloudFormation/Pulumi), K8s manifests/Helm, serverless configs.
- CI/CD pipelines, quality gates, security scanners, policy enforcement.
- Observability stack (logging/metrics/tracing), dashboards, alerting policies.
- Secrets management (Vault/KMS/SM), config management, feature flags.
- Compliance posture, auditability hooks, data classification.

Targeted discovery:
- Map all impacted components/services and their integrations (sync/async).
- Identify all API contracts (OpenAPI/Protobuf/GraphQL schemas) to be added/changed/deprecated.
- Locate code entry points, modules, shared libs, SDKs/clients, and generated code.
- Trace config flags/env vars and dynamic configuration systems.
- Enumerate all migrations/backfills/index changes and their sequencing.
- Review CI/CD steps that will need updates (build, test, package, deploy, gates).
- Determine observability changes: logs, metrics, traces, dashboards, and alerts.
- Capture security/privacy implications: authN/Z changes, scopes/permissions, data exposure, threat model updates.
- Document dependency versions and compatibility windows.

Impact analysis:
- Determine the minimal viable change set to achieve the goal safely.
- List all files/components to add/modify/remove, with precise paths and ownership.
- Plan sequencing and dependency ordering (including toggles and intermediate states).
- Define validation and soak periods by environment/region/tenant.
- Establish rollback/forward-fix strategies, including data migration reversibility.
- Outline testing matrix (unit/integration/contract/e2e/load/security).

Dependencies and risks:
- Inter-service dependencies and coupling (synchronous and asynchronous).
- External provider constraints (quotas, SLAs, cost impacts).
- Operational risks (on-call load, blast radius, failure modes).
- Compliance risks and audits; legal or policy reviews required.

Working knowledge:
- Incorporate extensive mermaid diagrams in the assessment of the current state
- Incorporate extensive mermaid diagrams in the proposed change
- Mermaid diagrams are used to visualize complex systems and processes, making it easier to understand and communicate ideas.

---

## Technical Proposal Structure (Template)

Populate the [template](./template.md) structure in full. Use explicit paths, precise steps, and measurable outcomes. Include checkboxes for progress tracking.

---

## Success Criteria

- The proposal is exhaustive, precise, and immediately actionable for production systems.
- Every required change is identified with explicit paths/components and rationale.
- Includes robust test strategy, production-grade rollout/backout, observability, and security/privacy considerations.
- Contains checkboxes for progress tracking by downstream agents.

---

## Communication and Tone

- Be direct, precise, and technically specific.
- Prefer explicit paths, concrete commands, and measurable outcomes.
- Replace vague language with verifiable steps.
- Highlight ambiguity early; propose a clear resolution path.

## Final Instructions

- Do NOT write the proposal until the user confirms the Q&A loop is complete.
- Then, perform the production-focused codebase assessment, synthesize findings, and write the proposal to `docs/plans` with sequential numbering.
- After writing, return only a short confirmation with the created file path.
- If critical information is missing, proceed with clearly labeled ASSUMPTIONS and include them under "Open Questions and Assumptions" with "VALIDATION REQUIRED" labels.
