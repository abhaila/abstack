---
name: reference-port
description: Port behaviour from a concrete reference implementation instead of describing what you want. Use when a working example of the desired behaviour exists — in another repo, a library, a competitor's open source, or elsewhere in this codebase — and when the user says "make it work like X", "similar to Y", or shares a screenshot or a link. Produces an HTML mapping from the reference's mechanism to this codebase.
---

# Reference Port

## Principle

A description of behaviour loses exactly the details that matter. A screenshot shows you the result and hides the mechanism.

**Source code is the highest-fidelity reference there is.** When a working implementation of what you want exists, read it — the real specification is in the parts nobody would think to describe.

**Point at the source, not at a picture of the source.**

## When to Apply

Port from a reference when:

- A working implementation of the desired behaviour exists anywhere you can read
- The user says "like X does it"
- The behaviour has non-obvious details — easing, retry semantics, edge-case handling, ordering
- This codebase already solves a similar problem elsewhere

**Do not use when:**

- No reference exists — you are designing, so use `design-directions`
- The reference's licence forbids reuse and you would be copying rather than learning
- The reference solves a genuinely different problem and the resemblance is superficial

## Fidelity Ladder

Always climb to the highest rung available.

| Rung | Reference | What survives |
|---|---|---|
| 1 (best) | **Source code** | Mechanism, edge cases, constants, ordering |
| 2 | Running implementation you can drive | Real behaviour, timing, states |
| 3 | Documentation or spec | Intent, contract, some edge cases |
| 4 | Video or recording | Timing and feel, no mechanism |
| 5 (worst) | Screenshot or description | Appearance only |

If given a rung-5 reference, **go and find the rung-1 version.** The library is on npm or Maven; the competitor's app has a JS bundle; the pattern exists three modules over in this repo. Ten minutes of searching beats a day of guessing at rung 5.

<NON-NEGOTIABLE>
Before porting, state which rung your reference is on. If it is below rung 3, say what you tried in order to climb higher.
</NON-NEGOTIABLE>

## The Trap

Porting is not copying. The reference solves its problem in its architecture, with its constraints. Copy the code and you import assumptions that do not hold here.

**Extract the mechanism. Re-implement in this codebase's idiom.**

Two questions to answer for every piece you take:

1. **Why does it do it this way?** If you cannot say, you cannot know whether the reason applies here.
2. **What is true there that is not true here?** Different concurrency model, different data shape, different error handling, different framework.

## Procedure

### Phase 1: Get the source

Find the highest-fidelity version available. Clone it, install it and read `node_modules`, find the file in this repo, unminify the bundle. State exactly what you obtained and its version or commit.

### Phase 2: Isolate the relevant part

A reference is mostly irrelevant to your task. Identify the specific files and functions that produce the behaviour you want, and name them precisely — `path/file.ts:120-180`, not "the animation code".

### Phase 3: Extract the mechanism

Write down how it actually works, in your own words, at the level of the algorithm. Include:

- The **constants** and where they came from, if you can tell. Magic numbers in a reference are usually tuned, and guessing at them is where ports go wrong
- The **ordering** — what must happen before what
- The **edge cases it handles** — often the reason to port at all
- What it **deliberately does not do**

### Phase 4: Map the assumptions

Two columns: what the reference assumes, and whether it holds here.

This is the phase that prevents a broken port. Different runtime, different threading, nullable where the reference had non-null, a framework that batches where the reference did not.

### Phase 5: Translate to local idiom

<NON-NEGOTIABLE>
Ported code MUST follow this codebase's conventions, not the reference's. Run the relevant engineering skill for the target language before writing.
</NON-NEGOTIABLE>

Reference naming, error handling, and structure all get converted. A port that reads as foreign is a maintenance problem forever.

### Phase 6: Record deliberate divergences

Where you chose to differ, say so and why. Otherwise a future reader will "fix" your intentional change back to match the reference.

## Output

Produce an HTML artifact. Read `../html-artifact/SKILL.md` for the file location and page contract.

Pattern-specific body:

1. **The reference** — what it is, where it came from, version or commit, licence, and which rung
2. **The relevant part** — exact files and line ranges, with the key excerpt
3. **The mechanism** — how it works, in your words, including constants, ordering, and handled edge cases
4. **Assumption map** — a table of what the reference assumes against whether it holds here
5. **The translation** — reference construct in one column, this codebase's equivalent in the other
6. **Deliberate divergences** — where you differ and why
7. **What you did not port** — the parts left behind, and the reason

Evidence bar: reference version, files read, lines examined, assumptions checked, divergences.

## Red Flags

- Working from a screenshot without having tried to find the source
- "It does something like a spring animation" — you have not read it
- Constants copied without any attempt to understand them
- Ported code that reads as foreign in this codebase
- No assumption map
- You cannot explain why the reference does something the way it does

## Common Rationalisations

| Excuse | Reality |
|---|---|
| "I know roughly how it works" | Roughly is where the edge cases live |
| "The source is minified" | Unminify it, or read the pre-bundle package |
| "I'll copy it and adapt later" | Later never comes and the assumptions stay |
| "It's a small behaviour" | Small behaviours have the most tuned constants |
| "Reading the source takes too long" | It takes less time than reverse-engineering it from a video |

## Quick Reference

| Phase | Activity | Complete when |
|---|---|---|
| 1. Source | Climb the ladder | Rung stated, version recorded |
| 2. Isolate | Name files and lines | Precise, not approximate |
| 3. Mechanism | Explain in your words | Constants and ordering captured |
| 4. Assumptions | Reference vs. here | Every mismatch listed |
| 5. Translate | Local idiom | Reads as native code |
| 6. Diverge | Record differences | Nobody will "fix" them back |
