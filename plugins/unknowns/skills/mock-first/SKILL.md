---
name: mock-first
description: Build a non-functional mock of an interface before wiring any logic behind it. Use before implementing a UI screen, a component, an API surface, a CLI, or a report — anywhere the shape of the thing should be agreed before the plumbing is built. Use when the user says "mock it up", "show me what it would look like", or when implementation would be expensive to redo. Produces a clickable-but-fake HTML mock.
---

# Mock First

## Principle

Wiring is the expensive part. Shape is the part people have opinions about.

Building the shape first — with nothing behind it — gets those opinions **before** the wiring exists to be thrown away. A mock costs an hour; a rewired feature costs a day and a half of it is annoyance.

**Agree the shape while it is still free to change.**

## When to Apply

Mock first when:

- The interface will be reviewed by someone else before it ships
- The states are non-obvious — empty, loading, error, partial, too-many
- Implementation cost is high relative to the cost of drawing it
- You are unsure how something should behave in an edge case, and the answer is a design decision, not a technical one

**Especially when:**

- The feature has a "no results" or "still loading" case nobody has thought about
- You are about to build a form
- The data shape and the display shape are not the same

**Do not mock when:**

- The interface is already specified and agreed
- It is one field on an existing screen
- The real thing is genuinely faster to build than the mock

## What a Mock Is For

Not to look pretty. To **force the questions the happy path hides**.

A mock earns its keep when it makes you ask: what does this show with no data? With one item? With four hundred? While loading? When the request fails halfway? When the text is three times longer than the example?

<NON-NEGOTIABLE>
A mock MUST include every state, not just the populated happy path. The states are the point.
</NON-NEGOTIABLE>

| Required state | The question it forces |
|---|---|
| Empty | What does a new user see? Is there a way forward? |
| Single item | Does the layout collapse? Is the header still justified? |
| Typical | The one everybody draws |
| Overloaded | Does it scroll, paginate, truncate, or break? |
| Loading | Skeleton, spinner, or nothing? Does the layout shift? |
| Error | What can the user do about it? |
| Partial failure | Some data arrived. Show it, or fail whole? |

The last one is where most designs are silent, and it is a real product decision.

## Procedure

### Phase 1: Name the states

Before drawing anything, list every state from the table above that applies. If you cannot say what a state should show, that is the first thing to resolve — it is a decision, not a detail.

### Phase 2: Use realistic fake data

<NON-NEGOTIABLE>
Never use "Lorem ipsum" or "Item 1, Item 2". Fake data MUST be realistic in shape, length, and awkwardness.
</NON-NEGOTIABLE>

Real data is ugly. It has a customer whose name is forty characters, an amount that is negative, a date from 2019, a status nobody documented, a null where you expected a string.

Placeholder data hides exactly the problems a mock exists to reveal. Pull representative values from the actual database or fixtures where you can.

### Phase 3: Build the shape, wire nothing

Static HTML and CSS. Buttons that do not submit. Fields that do not validate. A "next" link that switches to the next mocked state.

The one thing worth wiring: **switching between states**, so a reviewer can see all of them without editing the file.

### Phase 4: Annotate the decisions

Mark every place where you made a call the requester did not specify. A numbered pin next to the element, with a note saying what you chose and what the alternative was.

These annotations are the actual deliverable. They convert your silent assumptions into visible questions.

### Phase 5: List what the shape demands

The mock implies data. Write down what the backend would have to provide: fields, sort order, counts, whether the total is available before the page is.

This routinely surfaces a requirement the existing API cannot meet — which is far better to discover now.

## Output

Produce an HTML artifact. Read `../html-artifact/SKILL.md` for the file location and page contract.

Pattern-specific body:

1. **The interface**, rendered at real fidelity, with a state switcher across all states
2. **State inventory** — each state, what it shows, and the decision it embodies
3. **Annotations** — numbered pins on choices you made, each with what you picked and the alternative
4. **What this requires** — the data contract the shape implies, and whether the current API can serve it
5. **Open questions** — the states you could not resolve alone
6. **What is deliberately fake** — stated plainly, so nobody mistakes the mock for progress

Evidence bar: states mocked, decisions annotated, data requirements implied, open questions.

## Red Flags

- Only the happy path is drawn
- "Lorem ipsum", "Item 1", "John Doe", "test@test.com"
- Every string is the same convenient length
- No annotations — meaning you either made no decisions or hid them
- You started wiring real data "just to see"
- The mock is prettier than it is complete

## Common Rationalisations

| Excuse | Reality |
|---|---|
| "I'll just build the real thing" | Then rebuild it after the review |
| "The empty state is obvious" | It is the state most users see first |
| "I'll use placeholder data for speed" | Placeholder data hides the problems you are mocking to find |
| "Error states are edge cases" | They are the states users remember |
| "I'll add the other states later" | Later they cost a refactor, not a paragraph |

## Quick Reference

| Phase | Activity | Complete when |
|---|---|---|
| 1. States | List all applicable | None left undecided |
| 2. Data | Realistic and awkward | Long, null, negative, stale values present |
| 3. Build | Shape only, no wiring | State switcher works, nothing else does |
| 4. Annotate | Pin every silent decision | Assumptions are visible |
| 5. Requirements | Data the shape demands | Gaps against the current API named |
