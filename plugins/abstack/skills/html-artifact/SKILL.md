---
name: html-artifact
description: Produce a self-contained local HTML artifact as the output of a thinking or reporting task. Use when a skill asks for an HTML artifact, or when the user asks for a report, explainer, plan, brainstorm, review, quiz, or dashboard as a page rather than terminal text. Defines the file location, required page structure, evidence bar, and styling contract shared by the unknowns skills.
---

# HTML Artifact

## Principle

Terminal output scrolls away. A file on disk does not.

HTML is the right output format when the work needs to be **re-read, shared, or navigated** — a plan you will consult for a week, a report someone else must approve, a quiz you must actually take. It is the wrong format for a one-line answer.

The value is not the styling. It is that an HTML artifact **forces structure** — you cannot fill in an evidence bar without doing the work that produces the numbers.

## When to Apply

Produce an HTML artifact when:

- A skill in the unknowns family (`blindspot-pass`, `interview-me`, `tweakable-plan`, `change-quiz`, and the rest) instructs it
- The output has more than three sections, or contains a comparison
- Someone other than the requester will read it
- The output is interactive — a quiz, a toggle, a filterable list

Do not produce one when:

- The answer fits in a paragraph
- The user asked a direct question and wants a direct answer
- The content belongs in a tracked source file (a real spec, a README, an ADR)

## Output Contract

### Location

```
docs/unknowns/<YYYY-MM-DD>-<pattern>-<slug>.html
```

Examples:

- `docs/unknowns/2026-08-17-blindspot-pass-auth-module.html`
- `docs/unknowns/2026-08-17-change-quiz-export-feature.html`

Rules:

- Create `docs/unknowns/` if it does not exist
- If the repo has no `docs/` directory, use `.unknowns/` at the repo root and add it to `.gitignore`
- One file per run. Never overwrite a previous run's artifact — a new date or slug means a new file
- After writing, open it: `open <path>` on macOS, `xdg-open <path>` on Linux

### Self-contained, always

- No build step, no bundler, no framework
- No external requests of any kind — no CDN scripts, no web fonts, no remote images
- All CSS in a single `<style>` block, all JS in a single `<script>` block
- Embed images as `data:` URIs, or draw them as inline SVG
- The file must render correctly opened directly from `file://`

## Required Page Structure

Every artifact has these five parts in this order.

### 1. Eyebrow

A single line naming the pattern and its phase.

```html
<p class="eyebrow">Blindspot pass · Pre-implementation</p>
```

### 2. Title and standfirst

An `<h1>` naming the specific subject — not the pattern. "Unknown unknowns: the auth module", not "Blindspot pass".

Below it, one or two sentences of standfirst stating what the reader is looking at and what they should do with it.

### 3. Evidence bar

<NON-NEGOTIABLE>
Every artifact MUST open with a bar of counted facts derived from work you actually did.
</NON-NEGOTIABLE>

This is the anti-hand-waving device. You cannot write "47 files scanned, 214 commits since January, 3 migrations in flight, 1 reverted attempt" without having looked. A reader can tell in two seconds whether the artifact is grounded.

```html
<div class="evidence">
  <span><b>47</b> files scanned</span>
  <span><b>214</b> commits since Jan 2026</span>
  <span><b>4</b> landmines</span>
  <span><b>1</b> reverted attempt</span>
</div>
```

Rules for the evidence bar:

- Between three and six figures
- Every figure must come from a command you ran or a file you read — `git log`, `find`, a test run, a line count
- Never estimate, round for effect, or invent a plausible-looking number
- If you genuinely cannot count something, leave it out rather than guess
- State the scope you searched, so the reader knows the boundary of your claim

### 4. Body

Pattern-specific. Defined by the skill that invoked this one.

Two rules apply everywhere:

- **Every claim carries its evidence.** Name the file, the commit, the PR, the test. `services/auth/session.kt:88`, not "the session code".
- **Order by consequence.** The item that would cost most to discover late goes first. Say what the ordering rule is.

### 5. Provenance footer

```html
<footer>
  Generated 2026-08-17 · branch <code>feat/sso-provider</code> ·
  scope <code>services/auth/</code> · <code>blindspot-pass</code>
</footer>
```

Date, branch, the scope you examined, and the pattern name. This makes a stale artifact obvious.

## Styling Contract

Keep it plain. The artifact is a document, not a design exercise.

- System font stack — never load a web font
- One accent colour, used for emphasis and links only
- Max content width around `72ch`; body text at least `16px`
- Semantic HTML: real `<h2>`, `<table>`, `<details>`, `<ol>`. Not a wall of `<div>`
- Responds to `prefers-color-scheme` — define light values on `:root`, override under `@media (prefers-color-scheme: dark)`
- Wide content (tables, code blocks, diagrams) scrolls inside its own `overflow-x: auto` container. The page body never scrolls sideways
- Prints cleanly — `@media print` hides interactive chrome and avoids page breaks mid-section

### Interaction

Only where it does real work: a quiz that grades answers, a filter over a long list, `<details>` to collapse depth.

- Plain vanilla JS, no framework
- The page must be fully readable with JavaScript disabled — interaction enhances, never gates content
- No analytics, no tracking, no network calls

## Diagrams

Prefer inline SVG for anything structural — a before/after flow, a sequence, a dependency graph. Hand-write it; a boxes-and-arrows diagram is a handful of `<rect>` and `<line>` elements.

Give SVG text an explicit `fill` using a CSS variable so it survives a theme flip. Never rely on an external diagramming library.

## Red Flags

Stop if you catch any of these:

- An evidence bar figure you did not actually count
- "Approximately", "several", "many" in a slot that should hold a number
- A claim without a file path, commit, or PR next to it
- A `<script src="https://...">` or `<link href="https://fonts...">`
- Styling effort exceeding content effort
- Overwriting yesterday's artifact instead of writing a new one

## Quick Reference

| Part | Requirement |
|---|---|
| Path | `docs/unknowns/<date>-<pattern>-<slug>.html` |
| Dependencies | None. Opens from `file://` |
| Eyebrow | Pattern · phase |
| Title | Names the subject, not the pattern |
| Evidence bar | 3–6 counted figures, all real |
| Body | Every claim cites a file, commit, or PR |
| Ordering | By consequence, and say so |
| Footer | Date, branch, scope, pattern |
| Theme | Light and dark via `prefers-color-scheme` |
| After writing | `open <path>` |
