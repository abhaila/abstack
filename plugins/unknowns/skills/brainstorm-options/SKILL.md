---
name: brainstorm-options
description: Generate a wide, honestly-ranked set of possible approaches to a problem before narrowing to one. Use when facing an open-ended problem, when the first idea is the only idea on the table, when a metric needs moving and the cause is unclear, or when the user says "brainstorm", "what are our options", or "how could we approach this". Produces an HTML board of options ranked by effort against expected impact.
---

# Brainstorm Options

## Principle

The first idea is rarely the best idea. It is just the one that arrived first, and it anchors everything after it.

Deliberately generating a wide set — including options you will reject — is how you find out whether the obvious answer was actually the right one. **The rejected options are not waste. They are the evidence that the chosen one is good.**

## When to Apply

Brainstorm when:

- The problem is open-ended: "reduce churn", "make this faster", "improve onboarding"
- Exactly one solution is on the table and nobody has questioned it
- The obvious fix is expensive
- Symptoms are clear but the cause is not

**Do not brainstorm when:**

- The problem is a known bug with a known cause — go and fix it
- The decision has already been made and this would be theatre
- The solution space is genuinely narrow

## Diverge Before You Converge

<NON-NEGOTIABLE>
Generate the full set BEFORE evaluating any of it. Judging while generating kills the unusual options, which are the only reason to brainstorm.
</NON-NEGOTIABLE>

Two separate passes. Do not merge them.

### Force spread across categories

Left alone, every option lands in the same category — usually "build a feature". Deliberately generate at least one in each:

| Category | The move |
|---|---|
| **Remove** | Delete something. What if the feature causing this just went away? |
| **Change defaults** | Same system, different starting state. Often the cheapest real win |
| **Build** | The obvious category. Cap it — do not let it fill the board |
| **Communicate** | Nothing changes but what users are told, and when |
| **Measure** | You cannot fix it yet. Instrument first |
| **Buy or reuse** | Something existing already solves this |
| **Do nothing** | Always include it. Sometimes it is correct, and it sets the baseline |

An option list that is entirely "build" means you brainstormed inside one category.

## Procedure

### Phase 1: State the problem as an outcome

Not "add a retry button" but "users lose work when the upload fails". A solution stated as a problem constrains the whole exercise to that solution.

If the brief arrives as a solution, work backwards to the outcome first, and say that you did.

### Phase 2: Establish what is actually happening

Brainstorming without evidence produces a list of guesses. Before generating, gather what you can: the numbers, the logs, the support tickets, the code path.

State what you know, and — importantly — what you assumed because you could not find out.

### Phase 3: Diverge

Generate ten or more options across the categories. No evaluation, no filtering. Bad options are cheap here and expensive to think of later.

### Phase 4: Converge — rank by effort against impact

For each option: expected impact, effort, and **confidence**.

Confidence is the field most often skipped and it matters most. "High impact, low effort, low confidence" is not the same bet as "medium impact, low effort, high confidence" — and treating them the same is how teams waste quarters.

Sort into four groups:

- **Do now** — low effort, high confidence
- **Decide** — high impact, high effort. Needs a real conversation
- **Learn first** — high potential, low confidence. Measure before building
- **Rejected** — with the reason, kept visible

### Phase 5: Keep the rejects

<NON-NEGOTIABLE>
Rejected options stay in the artifact with the reason for rejection.
</NON-NEGOTIABLE>

Otherwise someone proposes them again next quarter, and nobody remembers why they were dropped. A rejection with a reason is durable knowledge.

### Phase 6: Recommend a next action

One thing to do next, not a strategy. Usually the cheapest option that would raise confidence in the expensive one.

## Output

Produce an HTML artifact. Read `../html-artifact/SKILL.md` for the file location and page contract.

Pattern-specific body:

1. **The outcome** — the problem as a result, not a solution
2. **What we know** — evidence gathered, with sources, and assumptions flagged separately
3. **The options** — the full set, grouped by category, each with impact, effort, confidence, and the assumption it rests on
4. **The grid** — effort against impact, plotted, with confidence shown by weight or shading
5. **Do now / Decide / Learn first / Rejected** — the four groups
6. **Rejected, with reasons** — kept visible
7. **Recommended next action** — one thing, with what it would tell us

Evidence bar: options generated, categories covered, sources consulted, options rejected.

## Red Flags

- Every option is in the "build" category
- Fewer than eight options — you converged too early
- No "do nothing" baseline
- No confidence rating
- Rejected options deleted rather than kept
- The recommendation is the first idea, and nothing in between tested it
- Impact figures with no source

## Common Rationalisations

| Excuse | Reality |
|---|---|
| "We already know what to build" | Then this takes twenty minutes and confirms it |
| "Most of these are bad" | Yes. That is what makes the good one visible |
| "Ranking needs data we don't have" | Rank by confidence and say so. That is the finding |
| "Do nothing isn't an option" | It is always an option. It is the baseline you beat |
| "This is just a list" | A list with effort, impact and confidence is a decision document |

## Quick Reference

| Phase | Activity | Complete when |
|---|---|---|
| 1. Outcome | Restate as a result | No solution embedded in the problem |
| 2. Evidence | Gather what is true | Assumptions marked as assumptions |
| 3. Diverge | 10+, all categories | Not just "build" |
| 4. Converge | Impact, effort, confidence | Every option has all three |
| 5. Reject | Keep with reasons | Nothing silently dropped |
| 6. Next action | One cheapest useful step | Says what it would resolve |
