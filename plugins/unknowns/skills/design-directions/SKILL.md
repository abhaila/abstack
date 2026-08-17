---
name: design-directions
description: Generate several genuinely different directions for the same problem so the user can recognise what they want. Use when requirements are hard to articulate, when the user says "I'll know it when I see it", when a first attempt was rejected without a clear reason, or before committing to an approach for a feature, a UI, an API shape, or an architecture. Produces an HTML comparison of distinct directions with their trade-offs.
---

# Design Directions

## Principle

Some requirements cannot be written down, only recognised. The user cannot tell you they wanted the simpler one until they see both.

More questions will not surface these. **Options will.** Showing three genuinely different directions converts an unanswerable question into a two-second reaction.

**Different directions, not variations on one.**

## When to Apply

Generate directions when:

- The user cannot specify what they want, but will react to what they see
- A previous attempt was rejected with "not quite" and no more detail
- The solution space is genuinely wide — several defensible approaches exist
- The decision is expensive to reverse: an API shape, a data model, a core interaction

**Do not use when:**

- One approach is obviously correct — say so and build it
- The user has already chosen — building alternatives is not helpful, it is second-guessing
- The differences would be cosmetic

## What Makes Directions Different

<NON-NEGOTIABLE>
Directions MUST differ in what they optimise for, not in their surface.
</NON-NEGOTIABLE>

Three variations of one idea teach nothing. Each direction must be the **best possible answer to a different question**.

| Not a direction | A direction |
|---|---|
| Same architecture, different names | Optimise for simplicity vs. optimise for extensibility |
| Same layout, different colours | Dense and expert vs. guided and progressive |
| Same API, different verbs | Chatty and flexible vs. one call, fixed shape |
| Same model, extra field | Event-sourced vs. current-state |

**The test:** each direction must have a scenario where it clearly wins and the others clearly lose. If you cannot name that scenario, it is not a distinct direction.

State the axis you varied along, explicitly. The axis is what the user is actually choosing between.

## Procedure

### Phase 1: Find the real axis

What is the genuine tension in this problem? Speed against flexibility. Simplicity against power. Explicit against inferred.

Name it. Every direction is then a different position on that axis, which is what makes the comparison meaningful rather than a menu.

### Phase 2: Generate three or four

Three is usually right. Two reads as a false binary; five dilutes attention.

**Include one direction that is more minimal than you think they want.** It is chosen more often than expected, and it exposes which complexity in the others is actually load-bearing.

Give each a name that describes its philosophy, not its number. "The thin adapter", "The full pipeline" — not "Option A".

### Phase 3: Make each one the strongest version of itself

Never build a straw man. If a direction only exists to make another look good, delete it — you have already made the decision and should say so instead.

Each direction gets a genuine advocate's case.

### Phase 4: Show, at the right fidelity

Enough detail to react to, not enough to be expensive.

| Kind | Fidelity |
|---|---|
| UI | Rendered HTML/CSS in the artifact — real layout, real proportions |
| API | The actual request and response for one representative call |
| Architecture | An inline SVG showing components and the flow between them |
| Data model | The core types, with the fields that differ highlighted |

### Phase 5: State the cost honestly

Each direction gets its real cost — build effort, what it forecloses, what it makes harder later. A comparison with no costs is a sales page.

### Phase 6: Recommend

<NON-NEGOTIABLE>
End with a recommendation and the reasoning. Presenting options without a view is abdication.
</NON-NEGOTIABLE>

You have thought about this longer than the reader. Say which one you would pick and what would change your mind.

## Output

Produce an HTML artifact. Read `../html-artifact/SKILL.md` for the file location and page contract.

Pattern-specific body:

1. **The axis** — the tension being traded, stated in one sentence
2. **The directions**, each with:
   - A name describing its philosophy
   - **The question it answers best** — one line
   - The concrete artefact — rendered UI, real payload, inline SVG, or types
   - **Wins when** — the scenario where it is clearly right
   - **Loses when** — the scenario where it is clearly wrong
   - **Cost** — build effort and what it forecloses
3. **Side by side** — one table, directions as columns, decision criteria as rows
4. **Recommendation** — the pick, the reasoning, and what would change it
5. **What they share** — decisions common to all directions, so those are not re-litigated

Evidence bar: directions generated, axis varied, decision criteria compared.

## Red Flags

- Directions differing only in naming or styling
- A direction you cannot name a winning scenario for
- Every direction landing at a similar cost — you have not spread far enough
- No minimal option
- No recommendation
- A straw man included to make the favourite look good

## Common Rationalisations

| Excuse | Reality |
|---|---|
| "I'll build the good one properly" | Then say that. Do not fake a comparison |
| "Three options is three times the work" | At mockup fidelity it is not, and one rejection costs more |
| "They'll pick the complicated one" | They often pick the minimal one. That is the finding |
| "It's not my place to recommend" | You have the most context. Use it |
| "They can combine them" | Sometimes — but say which combination and what it costs |

## Quick Reference

| Phase | Activity | Complete when |
|---|---|---|
| 1. Axis | Name the real tension | One sentence, non-obvious |
| 2. Generate | 3–4 positions, one minimal | Each answers a different question |
| 3. Strengthen | Best version of each | No straw men |
| 4. Show | Right fidelity per kind | Reactable, not expensive |
| 5. Cost | Honest trade-offs | Each has a "loses when" |
| 6. Recommend | Pick and justify | Says what would change your mind |
