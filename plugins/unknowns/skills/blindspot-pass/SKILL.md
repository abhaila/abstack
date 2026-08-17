---
name: blindspot-pass
description: Surface unknown unknowns before touching unfamiliar code. Use when starting work in a module, service, or subsystem you have not worked in before, when inheriting someone else's code, when a task sounds simple but the area is old, or when you are about to plan work in territory you cannot describe confidently. Produces an HTML report of landmines, unwritten conventions, missing concepts, and prior attempts — plus how to prompt for each one.
---

# Blindspot Pass

## Principle

The expensive failures are not the things you knew you didn't know. They are the things you had no reason to ask about.

Before touching unfamiliar code, spend one cheap pass finding out **what you would otherwise have learned the hard way** — mid-migration state, a convention nobody wrote down, a previous attempt at exactly this task that got reverted.

**A blindspot pass is the cheapest hour in the whole task.**

## When to Apply

Run one before:

- Your first change in a module or service
- Any task in code older than you have been on the team
- Planning work you cannot currently describe in your own words
- Estimating anything in unfamiliar territory

**Especially when:**

- The task sounds like a two-day job
- The module has a clean-looking interface
- Someone said "it should just be a case of..."
- You are about to write a plan for an area you have never read

**Do not skip when:**

- You are in a hurry — this is the pass that saves the time
- The change is small — small changes in strange code are how outages happen
- You have read the module once — reading is not the same as knowing what bites

## The Four Things You Are Hunting

| Category | What it is | How it bites |
|---|---|---|
| **Landmine** | Code that behaves differently from how it reads | You do the obvious thing and it silently fails |
| **Unwritten convention** | A rule everyone follows that is written nowhere | Your code passes review and breaks a norm |
| **Missing concept** | A domain idea not visible from the interfaces | You model the problem wrong from the start |
| **Prior attempt** | Someone already tried this | You rediscover their dead end at full price |

## Procedure

### Phase 1: Establish the scope

State exactly which directories, modules, or services you are examining. Everything you claim afterwards is bounded by this. Count the files.

```bash
find <scope> -type f -name '*.<ext>' | wc -l
```

### Phase 2: Read history, not just code

Current code tells you what is. History tells you what went wrong.

```bash
git log --oneline -- <scope> | wc -l
git log --since='12 months ago' --format='%h %s' -- <scope>
git log --format='%h %s' --grep='revert' -i -- <scope>
git log --format='%h %s' --grep='fix\|hotfix\|urgent' -i -- <scope> | head -30
```

Hunt specifically for:

- **Reverts** — a revert is a landmine with a commit message attached
- **Repeated fixes to one file** — churn marks fragility
- **Commits that touch the scope and a migration together** — schema is in motion
- **Long gaps followed by a burst** — someone tried something recently

### Phase 3: Find the in-flight work

Half-finished migrations are the single richest source of landmines, because the code reads as though the migration finished.

- Migration directories: which are applied, which are pending, which are stalled
- Feature flags gating code in this scope, and their current default
- Two implementations of the same thing where one is "new"
- `TODO`, `FIXME`, `DEPRECATED`, `LEGACY`, `DO NOT` comments
- Duplicate write paths — a value written to two places but read from one

### Phase 4: Find the conventions nobody wrote down

Read three to five existing implementations of the same kind of thing in this scope. What do all of them do that no documentation mentions?

- A wrapper everyone routes through instead of calling the obvious API
- An ordering requirement between calls
- A registration step in a file far from the implementation
- An error type or logging call every sibling includes

If every sibling does it and nothing forces it, it is an unwritten convention and you will forget it.

### Phase 5: Rank by consequence

Order every finding by **what it costs to discover late**, not by how interesting it is. A silent production failure outranks a naming inconsistency, always.

### Phase 6: Write the prompt fix

<NON-NEGOTIABLE>
Every finding MUST carry a "how to prompt around this" line — a concrete instruction to paste into the next session.
</NON-NEGOTIABLE>

A blindspot you cannot act on is trivia. The payload of this skill is a set of instructions that make the *next* prompt better.

Good: "When creating sessions for the new provider, route everything through `SessionBridge.write()` — never `RedisSessionStore` or `pg_sessions` directly. Explain the MIG-118 read/write split before writing any session code."

Bad: "Be careful with sessions."

## Output

Produce an HTML artifact. Read `../html-artifact/SKILL.md` for the file location and page contract.

Pattern-specific body:

1. **What you asked for** — restate the task as it sounds. One short paragraph. This sets up the gap.
2. **What you are actually walking into** — the same task, described accurately, in two or three sentences.
3. **Counts by category** — landmines, unwritten conventions, missing concepts, prior attempts.
4. **The findings**, ordered by consequence. Each one carries:
   - Category label and number
   - A one-line title stating the surprise
   - **What is true** — the mechanism, with file paths and commits
   - **Why it bites** — the plausible wrong move and its consequence
   - **How to prompt around it** — copyable instruction
5. **What is genuinely fine** — the parts that work as they appear. Reassurance is information; without it the reader distrusts everything.

Evidence bar: files scanned, commits examined, time window, findings by category.

## Red Flags

- A finding with no file path or commit hash
- "Be careful with X" as a prompt fix
- Fewer than three findings in a module older than a year — you have not looked at history
- Every finding is a code-quality opinion. Those are not blindspots
- You did not read a single commit message
- You claim something is fine without having checked it

## Common Rationalisations

| Excuse | Reality |
|---|---|
| "I read the module, I'm fine" | Reading shows you what is there, not what is missing |
| "This is just a small change" | Small changes in strange code cause the biggest surprises |
| "I'll find out as I go" | You will — at implementation cost instead of reading cost |
| "The tests will catch it" | Tests encode what someone already knew to check |
| "Nothing looked weird" | Landmines look normal. That is the definition |

## Quick Reference

| Phase | Activity | Complete when |
|---|---|---|
| 1. Scope | Name and count the files | The boundary is explicit |
| 2. History | Reverts, churn, hotfixes | You know what went wrong before |
| 3. In-flight | Migrations, flags, dual paths | You know what is mid-move |
| 4. Conventions | Read 3–5 siblings | You can list the unwritten rules |
| 5. Rank | Order by cost-if-late | Worst first, rule stated |
| 6. Prompt fix | One instruction per finding | Every finding is actionable |
