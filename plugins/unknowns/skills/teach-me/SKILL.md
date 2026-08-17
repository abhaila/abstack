---
name: teach-me
description: Teach the subject matter behind a task instead of guessing at it. Use when a task requires domain knowledge you do not have — an unfamiliar problem domain, an algorithm, a protocol, a financial or legal concept, a specialist tool — and when the user says "explain", "teach me", "I don't know anything about X", or when a task keeps failing because the vocabulary is wrong. Produces an HTML explainer grounded in this codebase.
---

# Teach Me

## Principle

When you lack the domain knowledge, you do not produce wrong code — you produce code that looks right and asks the wrong question. The gap is in the vocabulary, and vocabulary gaps are invisible from inside.

The fix is not to try harder. It is to **stop and be taught the subject**, then return to the task with the right words.

**Ask to be taught the domain, not given the answer.**

## When to Apply

Stop and run this when:

- You cannot name the parts of the problem you are solving
- You are pattern-matching on the shape of code without understanding what it computes
- Two attempts have failed and the failures do not resemble each other
- The domain has jargon you are using without being able to define it
- You are about to guess at a formula, a threshold, a protocol step, or an accounting rule

**Especially when:**

- The domain is regulated or financial — being confidently wrong has consequences
- The code encodes rules that come from outside engineering
- You are about to ask a specification question you should be able to answer yourself

**Do not use when:**

- You know the domain and need a reminder of the API — read the source
- The question is about *this codebase's* structure — use `blindspot-pass`
- The user wants the task done and the domain is genuinely incidental

## What Separates This From a Summary

A summary tells you what something is. An explainer makes you able to **make decisions in the domain**.

The test: after reading, could you tell whether a proposed implementation is *wrong*? If it only leaves you able to describe the thing, it is a summary and it has failed.

| Summary | Explainer |
|---|---|
| Names the concepts | Shows why the concepts exist |
| Describes the happy path | Shows what goes wrong and why |
| Generic to the domain | Grounded in this codebase's types and files |
| Reads as complete | Names what it deliberately left out |

## Procedure

### Phase 1: State your actual level

Write down what you do and do not know, plainly. "I know this is about revenue recognition. I do not know what a performance obligation is, or why a schedule would be deprecated."

This is not a formality. An explainer pitched at the wrong level is useless, and the only way to pitch it right is to declare the floor.

### Phase 2: Find the domain's real vocabulary

Before explaining anything, extract the terms the codebase and the domain actually use. Read type names, enum values, table names, test names.

For each term, you must be able to state: what it means, what it is *not*, and why it exists as a separate concept. Terms you cannot distinguish from each other are exactly where you will make mistakes.

### Phase 3: Explain the why before the what

Every domain rule exists because something went wrong without it. Lead with the failure the rule prevents. A rule whose purpose you understand is a rule you can apply to a case nobody wrote down.

### Phase 4: Ground every concept in this codebase

<NON-NEGOTIABLE>
Every concept MUST be tied to a concrete artefact in this repository — a type, a table, a function, a test.
</NON-NEGOTIABLE>

An explainer that could have been written without opening the codebase has taught you the textbook, not the system. The textbook version will mislead you at exactly the points where this system deviates.

Name the deviations explicitly: where does this codebase do something non-standard, and why?

### Phase 5: Show the failure modes

For each concept, the mistake a newcomer makes. This is the part that transfers — it is the difference between recognising the term and using it correctly.

### Phase 6: State the boundary

End with what you did *not* cover and what you are still unsure of. An explainer that claims completeness in a domain you just met is the most dangerous possible output.

## Output

Produce an HTML artifact. Read `../html-artifact/SKILL.md` for the file location and page contract.

Pattern-specific body:

1. **Where you are starting from** — the declared knowledge floor
2. **The mental model** — one diagram or short passage that makes the domain's shape clear. Inline SVG where structure matters
3. **The vocabulary** — a table of term, meaning, what it is *not*, and where it lives in this codebase
4. **The rules and why they exist** — each rule with the failure it prevents
5. **How this codebase differs** — deviations from the standard treatment, with the reason
6. **Failure modes** — the mistakes this domain invites, and how each shows up
7. **What this does not cover** — the boundary, stated plainly
8. **Now re-read the task** — the original task restated in correct domain vocabulary

Evidence bar: concepts covered, codebase artefacts cited, deviations found, open questions.

## Red Flags

- A concept with no file, type, or test next to it
- Content that would be identical for any codebase in this domain
- Jargon defined using other undefined jargon
- No failure modes — you have written a brochure
- Claiming completeness
- The task restatement is unchanged from the original, meaning nothing was learned

## Common Rationalisations

| Excuse | Reality |
|---|---|
| "I'll pick it up as I implement" | You will pick up a wrong model and encode it |
| "The code will show me" | Code shows mechanism, not intent. Rules come from outside |
| "I basically know this" | Then state the vocabulary. If you cannot, you do not |
| "This is slowing the task down" | Slower than the rewrite after you got the model wrong? |
| "I'll ask the user instead" | Ask about *their* intent. Teach yourself the *domain* |

## Quick Reference

| Phase | Activity | Complete when |
|---|---|---|
| 1. Level | Declare what you don't know | The floor is explicit |
| 2. Vocabulary | Extract real terms | You can distinguish each from its neighbour |
| 3. Why | Rules before mechanisms | Each rule names the failure it prevents |
| 4. Ground | Tie to this repo | No concept floats free of a file |
| 5. Failures | Newcomer mistakes | Each concept has one |
| 6. Boundary | State the gaps | Uncertainty is visible |
