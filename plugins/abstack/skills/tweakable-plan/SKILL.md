---
name: tweakable-plan
description: Write an implementation plan organised around the decisions most likely to change, so they can be corrected before they are expensive. Use before implementing anything multi-step, when a plan needs review, or when the user says "plan this out". Front-loads data models, type interfaces, and flows into a review surface. Produces an HTML plan where every reversible-now decision is visible and callable.
---

# Tweakable Plan

## Principle

A plan is not a schedule. It is **a decision surface** — a chance to change your mind while changing your mind is still free.

Most plans bury their real decisions inside step descriptions, where nobody reviews them. The reviewer reads "Step 3: implement the export service", nods, and discovers three days later that the export service was designed synchronous.

**Surface the decisions that are expensive to reverse. Push the reversible detail down.**

## When to Apply

Write one when:

- The work is more than a couple of hours
- Someone will review before implementation starts
- The change touches a data model, a public interface, or a user-facing flow
- Several approaches are viable and you have picked one

**Do not use when:**

- The task is a single obvious change — just make it
- A full technical proposal is needed for a large project — use `technical-planning`
- The user wants the thing built and the decisions are all trivial

`tweakable-plan` sits between "just do it" and a full technical proposal. It is the working plan for one piece of work.

## Reversibility Is the Organising Principle

<NON-NEGOTIABLE>
The plan MUST open with the decisions ranked by cost-to-reverse, before any steps.
</NON-NEGOTIABLE>

| Tier | Cost to reverse | Examples |
|---|---|---|
| **Locked in** | Migration, backfill, coordinated deploy | Data model, table shape, event schema |
| **Expensive** | Breaks consumers, needs versioning | Public API shape, error contract, type interfaces |
| **Moderate** | A day's rework | Sync vs. async, where a boundary sits |
| **Cheap** | Change it whenever | Naming, file layout, log wording |

The reviewer's attention is finite. Spend it entirely on the top two tiers.

**Every locked-in and expensive decision needs:** what you chose, what else you considered, why you chose it, and **what would change your mind**. That last one is what makes a plan tweakable rather than presentational — it tells the reviewer exactly what information would flip the decision.

## Procedure

### Phase 1: Know the territory first

If the area is unfamiliar, run `blindspot-pass` before planning. A plan written without knowing the landmines schedules work around obstacles you have not found.

If requirements are ambiguous, run `interview-me` first. Planning is not the place to discover you had the wrong requirement.

### Phase 2: Extract the decisions

Go through the work and pull out every decision. Assign each a reversibility tier. Anything in the top two tiers gets a full entry with alternatives and a change-my-mind condition.

If you find yourself with no locked-in decisions, check again — most work has at least one shape that is awkward to undo.

### Phase 3: Write the models and interfaces out in full

<NON-NEGOTIABLE>
Data models and type interfaces go in the plan as actual code, not as prose.
</NON-NEGOTIABLE>

"A table to track export jobs" is unreviewable. The actual `CREATE TABLE`, or the actual data class with its types and nullability, is reviewable in fifteen seconds — and this is where a reviewer catches the mistake that would otherwise need a migration to fix.

Same for the API: the real request and response shape, including the error cases.

### Phase 4: Sequence for early feedback

Order the steps so that the riskiest assumption is tested first, not so the easy work comes first.

Each step states:

- What is done
- **How you will know it worked** — the test, the query, the observable outcome
- What it unblocks

A step with no verification is not a step, it is a hope.

### Phase 5: State what you are not doing

Explicit non-goals. Half of plan review disagreement is about scope that was never in scope, and a non-goals list ends that in one line.

### Phase 6: Name the risks and the rollback

For each real risk: how it shows up, and what you do about it. And for the whole change: how it is turned off if it goes wrong — flag, revert, or "it cannot be, and here is why".

## Output

Produce an HTML artifact. Read `../html-artifact/SKILL.md` for the file location and page contract.

Pattern-specific body:

1. **Goal** — one sentence, as an outcome
2. **Decisions, by reversibility** — locked-in first. Each with the choice, the alternatives, the reasoning, and what would change your mind
3. **Data model** — actual DDL or type definitions
4. **Interfaces** — actual request and response shapes, including errors
5. **Flow** — inline SVG where the sequence is non-obvious
6. **Steps** — ordered for early feedback, each with its verification
7. **Non-goals** — explicit
8. **Risks and rollback** — how each shows up, what you do
9. **Open questions** — with the assumption you will proceed under if unanswered

Evidence bar: decisions surfaced, locked-in count, steps, open questions.

## Red Flags

- Decisions described in prose rather than shown as code
- No locked-in tier — you have not looked hard enough
- A decision without a "what would change my mind"
- Steps without verification
- No non-goals
- The plan reads as a schedule
- Ordered by ease rather than by risk

## Common Rationalisations

| Excuse | Reality |
|---|---|
| "The schema is obvious" | Then writing it out costs a minute and settles it |
| "I'll figure out the interface while building" | Then the reviewer reviews it after it is expensive |
| "Listing alternatives is busywork" | It is the evidence you considered any |
| "Everyone knows what's out of scope" | Nobody does. That is where review arguments come from |
| "I'll sequence easy-first for momentum" | Momentum into a wrong assumption is not progress |

## Quick Reference

| Phase | Activity | Complete when |
|---|---|---|
| 1. Territory | Blindspot / interview first | No unknowns being planned around |
| 2. Decisions | Extract and tier | Top two tiers fully written |
| 3. Models | Real code, not prose | DDL and types reviewable |
| 4. Sequence | Riskiest first | Every step has a verification |
| 5. Non-goals | State exclusions | Scope arguments pre-empted |
| 6. Risks | Signal and response | Rollback named or ruled out |
