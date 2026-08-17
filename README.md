# abstack

Claude Code skills for the abstack — Kotlin backend, React frontend, Postgres via Docker.

## Installation

Add this marketplace to Claude Code:

```bash
claude plugin marketplace add abhaila/abstack
```

Install the `abstack` plugin:

```bash
claude plugin install abstack@abstack
```

## Skills

| Skill | When it triggers |
|---|---|
| `abstack:kotlin-engineer` | Writing, reviewing, or refactoring Kotlin backend code |
| `abstack:verify` | After making changes — confirms the feature works end-to-end in the running stack |
| `abstack:git-commit` | Any git interaction — enforces Conventional Commits and handles push/rebase |
| `abstack:technical-planning` | Starting a new feature, writing a tech proposal, or assessing feasibility |
| `abstack:coder` | Turning a plan into working code |
| `abstack:debugging` | Tracking down bugs, test failures, or unexpected behaviour |
| `abstack:writing-user-stories` | Writing user stories |
| `abstack:documenting-code` | Documenting code |
| `abstack:default-behaviour` | Loaded automatically on session start — core operating principles |

## Finding your unknowns

Eleven skills for surfacing what you don't know, before it gets expensive to find out.
Based on [A Field Guide to Claude Fable 5: Finding Your Unknowns](https://claude.com/blog/a-field-guide-to-claude-fable-finding-your-unknowns)
and [The unreasonable effectiveness of HTML](https://github.com/ThariqS/html-effectiveness).

The premise: the quality of the work is capped by how well the unknowns were
clarified, not by how well the knowns were specified. Each skill is a cheap way to
find out what you didn't know while it's still free to change your mind.

### Before you build

| Skill | Use when | Finds |
|---|---|---|
| `abstack:blindspot-pass` | First change in unfamiliar code | Landmines, unwritten conventions, prior reverted attempts |
| `abstack:teach-me` | The task needs domain knowledge you lack | The vocabulary you're missing, grounded in this repo |
| `abstack:interview-me` | Requirements are ambiguous | Answers, asked one at a time, ordered by blast radius |
| `abstack:design-directions` | "I'll know it when I see it" | Which direction they wanted, by showing three |
| `abstack:mock-first` | Before wiring an interface | The empty, error and overloaded states nobody specified |
| `abstack:brainstorm-options` | Open-ended problem, one idea on the table | The options nobody generated, ranked by confidence |
| `abstack:reference-port` | A working implementation exists | The mechanism, by reading source instead of guessing |
| `abstack:tweakable-plan` | Before implementing anything multi-step | The decisions that are expensive to reverse |

### While you build

| Skill | Use when | Finds |
|---|---|---|
| `abstack:implementation-notes` | Following a plan | Every deviation, logged as it happens rather than lost to scrollback |

### After you build

| Skill | Use when | Finds |
|---|---|---|
| `abstack:pitch-doc` | You need a decision | Whether the case stands up without you in the room |
| `abstack:change-quiz` | Before merging code you didn't write line by line | The parts of the diff you skimmed |

### Shared

| Skill | Use when |
|---|---|
| `abstack:html-artifact` | Loaded by the eleven above — defines the local HTML output contract |

All eleven write a self-contained HTML file to `docs/unknowns/` and open it. No build
step, no dependencies, no network requests. Every artifact opens with an evidence bar
of counted facts — files scanned, commits examined, deviations logged — which is the
part that makes hand-waving visible.
