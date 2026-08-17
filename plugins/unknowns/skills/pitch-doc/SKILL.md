---
name: pitch-doc
description: Package work into a single self-contained document that gets a decision from someone who has not been following along. Use when you need buy-in, sign-off, or approval — for a proposal, a completed prototype, a migration, or a change needing a stakeholder's yes. Use when the user says "write this up", "make the case", or "I need to get this approved". Produces an HTML document ending in a specific ask.
---

# Pitch Doc

## Principle

The reader has not been in your head, your branch, or your thread. They have five minutes and a decision to make.

A pitch doc is not a summary of what you did. It is **an argument, arranged so that a decision can be made from it alone** — with the evidence you have already produced doing the persuading.

**One document. No prerequisites. Ends in a specific ask.**

## When to Apply

Write one when:

- You need approval to start, continue, or ship
- The decision-maker has not been following the work
- You have prototypes, plans, or notes scattered across places nobody will visit
- The decision has a cost and needs a real yes or no

**Do not use when:**

- The audience has been in the detail — send the plan, not a pitch
- No decision is being asked for — write a status update instead
- The decision is already made

## The Reader

Assume: intelligent, busy, missing all context, and unwilling to open a second tab.

<NON-NEGOTIABLE>
The document MUST stand alone. Anything essential gets inlined — the mock, the payload, the diagram, the number. A link is for depth, never for the argument.
</NON-NEGOTIABLE>

Write for two reading modes, both of which must work:

- **Skim (60 seconds):** headings, evidence bar, and the ask. Enough to decide.
- **Read (5 minutes):** the reasoning, the alternatives, the risks. Enough to defend the decision to someone else.

## Structure of the Argument

The order is load-bearing. Problem before solution, always — a reader who has not accepted the problem will evaluate your solution as an expense.

1. **The ask** — up front, not at the end. The reader should know within ten seconds what you want
2. **The problem** — as it affects *them*, with a number attached
3. **Why now** — what changed. Without this, "later" is always the safest answer, and later is what you get
4. **The proposal** — what you want to do, shown not described
5. **The evidence** — the mock, the prototype, the measurement, the spike
6. **What it costs** — effort, risk, what it forecloses. Stated by you, before it is asked
7. **Alternatives considered** — including doing nothing, and why they lose
8. **The risks** — the real ones, with your mitigation
9. **The decision** — exactly what you need, from whom, by when

### Lead with the ask

Burying it is the most common failure. A reader who does not know what is wanted reads the whole document in the wrong mode.

### Put a number on the problem

"Users find export slow" is an opinion. "Export takes 40–90 seconds and locks the tab; 31% of attempts are abandoned" is a case. If you have no number, say so plainly and say what it would take to get one — that itself is often the right ask.

### State the cost yourself

A document that only argues in favour reads as a sales pitch and gets discounted. Naming the cost before it is raised is what makes the rest credible.

### Never straw-man the alternatives

Especially "do nothing", which is usually the incumbent and deserves the strongest version of its case.

## Procedure

### Phase 1: Identify the decision and the decider

Name the person and the specific decision. A pitch to "the team" is a pitch to nobody. The ask must be something one identified person can say yes to.

### Phase 2: Gather what you already produced

Pull from your existing artifacts — `mock-first` mocks, `design-directions` comparisons, `brainstorm-options` boards, `implementation-notes` findings, `tweakable-plan` costs.

This is the payoff of the earlier patterns. You are assembling evidence, not manufacturing it.

### Phase 3: Find the number

Query the database, read the logs, count the tickets, time the operation. One real measurement outweighs a page of argument.

Cite where each number came from.

### Phase 4: Inline the evidence

Embed the mock as rendered HTML. Embed the payload. Draw the diagram as inline SVG. If the reader must click to understand the argument, the argument is incomplete.

### Phase 5: Write the ask precisely

Not "thoughts?". Something answerable: "Approve two weeks of engineering time to build direction B, starting the week of 1 September." Name who decides and by when.

## Output

Produce an HTML artifact. Read `../html-artifact/SKILL.md` for the file location and page contract.

Body follows the nine-part structure above. Additionally:

- The **ask appears twice** — once at the top in one sentence, once in full at the bottom
- Evidence is **inlined**, never linked
- Every number carries its source
- A skim path exists: headings and the evidence bar alone must support a decision

Evidence bar: the problem's magnitude, the cost, the alternatives considered, the decision date.

## Red Flags

- The ask is at the bottom only
- The problem has no number and no acknowledgement that it lacks one
- Evidence behind links
- No cost section
- "Do nothing" presented as obviously foolish
- Reads as a status update — no decision requested
- The decider is not named

## Common Rationalisations

| Excuse | Reality |
|---|---|
| "They know the context" | They have twelve other things. Assume nothing |
| "I'll link the prototype" | They will not click. Inline it |
| "Leading with the ask feels pushy" | It is respectful of their time |
| "Mentioning risks weakens it" | Unnamed risks get raised by someone else, and worse |
| "I'll let them decide the next step" | An unspecific ask gets an unspecific answer |

## Quick Reference

| Phase | Activity | Complete when |
|---|---|---|
| 1. Decision | Name decider and decision | One person can say yes |
| 2. Gather | Pull existing artifacts | Evidence assembled, not invented |
| 3. Number | Measure the problem | Sourced, or its absence stated |
| 4. Inline | Embed everything essential | Zero required clicks |
| 5. Ask | Write it precisely | Answerable yes or no, by a date |
