# Example: Index File

This example shows how to structure a specification index file.

```markdown
# Billing Engine Specification

**Version**: 1.0
**Last Updated**: 2026-01-20

This document provides a comprehensive specification of the Sequence billing engine. It describes how billing schedules, pricing, invoicing, and related concepts work from a behavioural perspective.

## Table of Contents

### Core Concepts

- [1. Billing Schedule Core Concepts](./01-billing-schedule-core-concepts.md) - What a billing schedule is and its components
- [2. Billing Schedule States and Lifecycle](./02-billing-schedule-states-lifecycle.md) - States, transitions, and lifecycle management
- [3. Phases and Phase Configuration](./03-phases-configuration.md) - How phases divide billing schedules

### Billing Mechanics

- [4. Phase Recurrence Preferences](./04-phase-recurrence-preferences.md) - RESET vs CONTINUE behaviour
- [5. Invoice Creation Process](./05-invoice-creation-process.md) - How invoices are generated
- [6. Billing Runs](./06-billing-runs.md) - Orchestration and triggering of invoices

### Pricing Models

- [11. Standard (Fixed) Pricing](./11-fixed-pricing.md) - Flat-rate billing
- [12. One-Time Pricing](./12-one-time-pricing.md) - Single charges
- [13. Usage-Based Pricing: Linear](./13-usage-linear-pricing.md) - Per-unit metered billing
- [14. Usage-Based Pricing: Graduated](./14-usage-graduated-pricing.md) - Tiered pricing

### Adjustments and Modifiers

- [19. Discounts](./19-discounts.md) - Percentage and fixed amount discounts
- [20. Minimums](./20-minimums.md) - Minimum charge thresholds
- [21. Proration](./21-proration.md) - Partial period billing

---

## How to Read This Specification

Each section contains:

- **Overview** - What the concept is and why it matters
- **Configuration** - How to set it up
- **Given/When/Then Scenarios** - Concrete behaviour examples
- **Diagrams** - Visual representations where helpful

The Given/When/Then scenarios serve as executable specifications - they define the exact behaviour the system must exhibit.

## Target Audience

- Engineers onboarding to the billing system
- Product managers making billing-related decisions
- Non-technical stakeholders who need to understand billing behaviour
```
