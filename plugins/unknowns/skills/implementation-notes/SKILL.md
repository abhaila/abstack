---
name: implementation-notes
description: Keep a running log of every deviation from the plan while building, so mid-build surprises become durable inputs instead of vanishing into scrollback. Use when starting implementation of anything multi-step, when following a plan or tech proposal, or when the user says "keep notes as you go" or "log what you find". Appends to a markdown log during the build and renders an HTML summary at the end.
---

# Implementation Notes

## Principle

Plans are written before the code is understood. Every build hits surprises the plan did not anticipate — and each surprise is a decision made under pressure, then forgotten.

The surprises are the most valuable thing produced during implementation, and they are the only thing routinely thrown away. Scrollback is not memory.

**Log the deviations as they happen. They are the input to the next attempt.**

## When to Apply

Keep notes when:

- Implementation follows a plan or tech proposal
- The work spans more than one session
- Someone else will review, continue, or repeat this work
- The area is unfamiliar

**Especially when:**

- The plan was written by someone else, or by you a while ago
- You expect to hit edge cases the plan cannot have covered
- The work may need repeating for other modules

**Do not use when:**

- The change is a single commit that matched the plan exactly

## What Counts as an Entry

Not a commit log. Git already has that. The log records **things a reader could not reconstruct from the diff.**

| Type | Log it when | Why it matters |
|---|---|---|
| **Plan-confirmed** | A step went as planned | Proves the plan held; short entry |
| **Deviation** | Reality forced a different approach | The plan was wrong here. Highest value |
| **Discovery** | You learned something not in the plan | Feeds `blindspot-pass` next time |
| **Needs judgment** | You made a call the user should review | The escalation queue |
| **Deferred** | You consciously left something | Otherwise it is silently lost |

A deviation entry always records: **what the plan said, what you found, what you did instead, and why.** Missing the "why" makes the entry unusable.

## The Conservative Rule

<NON-NEGOTIABLE>
On hitting an unplanned decision: take the conservative option, log it as "needs judgment", and keep going. Do not stop, and do not silently take the clever option.
</NON-NEGOTIABLE>

Conservative means: preserves existing behaviour, easier to reverse, fails loudly rather than quietly, narrower in scope.

This is what makes the pattern work. Stopping at every surprise makes the build unusable; deciding silently makes the review worthless. Logging keeps momentum *and* keeps the decision visible.

## Procedure

### Phase 1: Open the log

Create `docs/notes/<YYYY-MM-DD>-<feature>-implementation.md` at the start of the build, not retrospectively.

Header records: the plan being followed, the branch, and the start time.

### Phase 2: Log as you go

<NON-NEGOTIABLE>
Write the entry when it happens, not at the end. Retrospective notes lose the "why", which is the only part worth keeping.
</NON-NEGOTIABLE>

Each entry:

```markdown
### <time> · <type> · <one-line title>

**Plan said:** ...
**Found:** ...
**Did:** ...
**Why:** ...
**Cost:** ... (only if it changed effort materially)
```

Keep it short. Four lines beat four paragraphs, and a log that feels expensive stops being written.

### Phase 3: Escalate the judgment calls

When a "needs judgment" entry appears, keep building — but surface it to the user at the next natural break rather than at the very end. A judgment call reviewed early is cheap; one reviewed at the end is a rework.

### Phase 4: Close the log

At the end, render the HTML summary and answer three questions:

- **Did the plan hold?** Which steps matched, which did not
- **What would a better plan have said?** Concrete corrections, feeding the next `tweakable-plan`
- **What still needs a decision?** The judgment queue

### Phase 5: Feed it forward

The log is an input, not an archive:

- Deviations become corrections to the plan's assumptions
- Discoveries become findings for the next `blindspot-pass`
- Judgment calls become review items, or open questions in a `pitch-doc`
- The summary becomes the substance of the PR description

## Output

Two files.

**During the build:** the markdown log, appended live.

**At the end:** an HTML artifact. Read `../html-artifact/SKILL.md` for the file location and page contract.

Pattern-specific body:

1. **The plan being followed** — link, and how closely it held
2. **Filterable timeline** — all entries, filterable by type. Deviations and judgment calls prominent
3. **The deviations** — each with plan, finding, action, and reason
4. **Needs your judgment** — the escalation queue, each with the conservative choice taken and the alternative
5. **What a better plan would have said** — concrete corrections
6. **Discoveries for next time** — feeding the next blindspot pass
7. **Deferred** — what was consciously left, and what it would take

Evidence bar: entries, deviations, judgment calls, deferred items, steps that matched the plan.

## Red Flags

- The log written at the end from memory
- Entries that restate commit messages
- A deviation with no "why"
- No deviations at all in a multi-day build — you are not noticing them
- Judgment calls surfaced only at the very end
- The log is longer than the diff

## Common Rationalisations

| Excuse | Reality |
|---|---|
| "I'll remember and write it up after" | You will remember what you did, not why |
| "It's in the commit messages" | Commits record the change, not the rejected alternative |
| "Logging slows me down" | Four lines per surprise. The rework is slower |
| "The deviation was obvious" | Obvious in context. The reviewer has no context |
| "I'll just ask about it now" | Log it and keep going. Batch the questions |

## Quick Reference

| Phase | Activity | Complete when |
|---|---|---|
| 1. Open | Create the log first | Exists before code is written |
| 2. Log | Write at the moment | Every deviation has a "why" |
| 3. Escalate | Surface judgment calls early | Not saved for the end |
| 4. Close | Render summary | Plan corrections stated |
| 5. Feed forward | Route into plan, PR, blindspots | Nothing dies in the file |
