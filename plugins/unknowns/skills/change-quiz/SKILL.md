---
name: change-quiz
description: Verify you actually understand a change before merging it, using a report that ends in a quiz you must pass. Use before merging a PR you did not write line by line, before merging agent-generated code, when returning to a long-running branch, or when the user says "quiz me", "do I understand this", or "make sure I get this before I merge". Produces an interactive HTML report with a self-graded quiz.
---

# Change Quiz

## Principle

Skimming a diff feels like reviewing it. It is not, and the gap is invisible from the inside — you cannot tell what you failed to notice.

A quiz closes the gap by making comprehension **falsifiable**. You either answer correctly or you do not, and the failure points precisely at the part you skipped.

**The artifact should not let you feel done until you actually are.**

## When to Apply

Run one before merging when:

- You did not write every line — agent-generated, a teammate's PR, or your own branch from three weeks ago
- The diff is large enough that you skimmed part of it
- The change touches money, auth, data integrity, or anything with a migration
- You will own this code and someone will ask you about it

**Especially when:**

- You are about to approve something you understand less well than you would admit
- The change introduces behaviour that is not visible in the diff — a job, a flag, a retry, a race

**Do not use when:**

- You wrote it line by line
- The change is a rename or a version bump
- You need a *code review* — that finds defects. This verifies *your* understanding. Different jobs, run both

## What Makes a Question Good

<NON-NEGOTIABLE>
Every question MUST be answerable only by someone who understood the change. Questions answerable from the diff's surface — file names, function names, line counts — are worthless.
</NON-NEGOTIABLE>

| Bad question | Good question |
|---|---|
| Which file has the new endpoint? | A user retries an export while the first is still running. What happens, and why that choice? |
| How many files changed? | Why does the worker read from the original upload rather than the proxy? |
| What is the new table called? | Two workers pick up the same job. What stops them both rendering it? |
| Does this add a migration? | The migration is applied but the deploy fails. What state is the system in? |

Good questions come from four places:

1. **Non-obvious deliberate choices** — where the author picked the less obvious option
2. **Failure modes** — what happens when the new path breaks halfway
3. **Concurrency and ordering** — two of these at once, or out of order
4. **Deployment gaps** — the window where the migration has run but the code has not, or vice versa

Every question must have an **answer with a reason**, and the reason must be traceable to a specific line. If you cannot cite it, the question is unfair.

## Procedure

### Phase 1: Read the whole diff, properly

```bash
git diff <base>...HEAD --stat
git diff <base>...HEAD
git log <base>..HEAD --format='%h %s'
```

You cannot write questions about a diff you skimmed. This phase is the actual work; the quiz just proves it happened.

### Phase 2: Build the mental model

Before and after, as a structure. Where does a request go now that it did not before? What is new in the system that a diff does not show — a table, a queue, a job, a flag, a permission?

This becomes the diagram, and if you cannot draw it you have not understood the change.

### Phase 3: Find the non-obvious behaviours

The three to five things a skim will not tell you. For each: what it is, why it was done that way, and what it costs. These are the reasoning behind the change, and they are what the quiz tests.

### Phase 4: Write the questions

Six to ten. Fewer is not a test; more is not read.

- Multiple choice, with **plausible** wrong answers. A wrong answer nobody would pick tests nothing
- Draw distractors from what a *skimmer* would believe — that is exactly the failure mode being detected
- Cover every non-obvious behaviour and at least one failure mode
- Each answer explains *why*, with a file reference

### Phase 5: Grade honestly

The quiz grades in the page. A wrong answer reveals the explanation and **links to the section that covers it**.

<NON-NEGOTIABLE>
A failed quiz means do not merge. Re-read the section, then retake. The result is the point — do not soften it.
</NON-NEGOTIABLE>

## Output

Produce an interactive HTML artifact. Read `../html-artifact/SKILL.md` for the file location and page contract.

Pattern-specific body:

1. **What changed and why** — the change in three sentences, as a purpose rather than a file list
2. **The mental model** — inline SVG, before against after
3. **Non-obvious behaviours** — three to five, each with what, why, and cost
4. **What to watch after merge** — the metric, log line, or alert that would show this going wrong
5. **The quiz** — 6–10 multiple choice, graded in-page, with explanations and section links on a wrong answer
6. **Verdict** — pass and you are ready; fail and you are told which section to re-read

Interaction requirements:

- Grades client-side in vanilla JS, no network
- Answers not visible in the rendered page before submission
- Wrong answers reveal the reason and link to the relevant section
- **The content above the quiz is fully readable with JavaScript disabled**

Evidence bar: files changed, lines added and removed, commits, non-obvious behaviours, questions.

## Red Flags

- Questions answerable from file names alone
- Implausible distractors
- An answer you cannot cite a line for
- Fewer than six questions
- No failure-mode question
- You wrote the quiz without reading the whole diff
- You failed and merged anyway

## Common Rationalisations

| Excuse | Reality |
|---|---|
| "I reviewed it already" | Reviewing finds defects. This finds *your* gaps |
| "It's agent-written and the tests pass" | Tests encode what someone thought to check |
| "I'll learn it when it breaks" | At 3am, in production, without the diff open |
| "Writing a quiz for my own code is silly" | You did not write this code. You approved it |
| "I got 4 out of 8 but I get the gist" | You do not. That is what the score means |

## Quick Reference

| Phase | Activity | Complete when |
|---|---|---|
| 1. Read | Whole diff, properly | No file skimmed |
| 2. Model | Before vs. after | You can draw it |
| 3. Behaviours | 3–5 non-obvious | Each has what, why, cost |
| 4. Questions | 6–10, plausible distractors | Each cites a line |
| 5. Grade | In-page, honest | Fail means do not merge |
