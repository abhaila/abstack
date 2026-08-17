---
name: interview-me
description: Interview the user one question at a time to resolve ambiguity before building, ordered by how much each answer would change the architecture. Use when requirements are vague, when a request has several reasonable readings, before writing an implementation plan, or when the user says "interview me", "ask me questions", or "what do you need to know". Produces an HTML record of questions, answers, and the decisions they settled.
---

# Interview Me

## Principle

Guessing at an ambiguous requirement is cheap to do and expensive to undo. Asking is the reverse.

But not all questions are worth the same. **Order questions by blast radius** — how much the answer would change the shape of the system. A question whose answer changes the data model is worth ten questions about wording.

**One question at a time. Highest blast radius first.**

## When to Apply

Run an interview when:

- A request has more than one reasonable interpretation
- You are about to write a plan and are filling gaps with assumptions
- The work touches a data model, a public interface, or a user-facing flow
- The user explicitly asks to be interviewed

**Do not run one when:**

- The task is mechanical and the answer cannot change the design
- The user has already given a detailed spec — read it before asking anything
- You could answer the question yourself by reading the code. **Read first, ask second**

<NON-NEGOTIABLE>
Never ask a question the codebase already answers. Search before you ask. A question you could have answered by reading spends the user's attention on your laziness.
</NON-NEGOTIABLE>

## Blast Radius

Rank every candidate question by what changes if the answer flips.

| Radius | The answer changes | Examples |
|---|---|---|
| **Architectural** | Data model, service boundaries, sync vs async | Is this per-user or per-account? Must it survive a restart? |
| **Interface** | Public API shape, types, error contract | Does this return partial results, or fail whole? |
| **Behavioural** | What the system does in a specific case | What happens on a duplicate submission? |
| **Cosmetic** | Wording, ordering, defaults | What should the button say? |

Ask architectural questions first. If the budget runs out, cosmetic questions were the right ones to lose.

**The test:** "If they answer the opposite way, what do I throw away?" If the answer is "nothing", it is not a good question.

## Procedure

### Phase 1: Read before asking

Search the codebase for anything that already settles a candidate question. Existing patterns, similar features, prior migrations, tests that encode the rule.

Every question you delete here is one the user does not have to answer.

### Phase 2: Draft and rank

Write every open question. For each, note what changes if the answer flips. Discard the ones where nothing changes. Sort by radius.

Count them. State the count up front so the user knows the shape of the conversation.

### Phase 3: Ask, one at a time

<NON-NEGOTIABLE>
Use the `AskUserQuestion` tool. One question per call. Never batch questions into plain text.
</NON-NEGOTIABLE>

For each question:

- **State why it matters** before the options — name what changes
- **Offer 2–4 concrete options**, not open prompts. "Per-account or per-user?" beats "How should scoping work?"
- **Recommend one** and say why. You have read the code; you have an opinion. Put it first and mark it recommended
- **Make the options genuinely different.** Two phrasings of the same choice waste the turn

### Phase 4: Re-rank after every answer

An answer can delete later questions, or promote a question you had ranked cosmetic. Re-sort before asking the next one.

Say when this happens: "That removes questions 4 and 6."

### Phase 5: Stop

Stop when the remaining questions are all cosmetic, or the user says to proceed.

**Do not stop with unstated assumptions.** If questions remain unanswered, state the assumption you will build under, explicitly, so a wrong assumption is visible rather than buried.

## Output

Produce an HTML artifact. Read `../html-artifact/SKILL.md` for the file location and page contract.

Pattern-specific body:

1. **What I read first** — files and patterns consulted, and which candidate questions they killed
2. **The questions**, in the order asked, each with:
   - Blast radius label
   - Why it mattered — what changed depending on the answer
   - The options offered, and which was recommended
   - **The answer given**
   - **What it settled** — the concrete decision now locked
3. **Assumptions I am proceeding under** — every unanswered question, with the assumption and how to correct it
4. **What this changes** — decisions that differ from what you would have built without the interview

Evidence bar: questions drafted, questions killed by reading, questions asked, decisions settled, assumptions remaining.

## Red Flags

- Asking anything answerable by `grep`
- More than one question in a single message
- Options that are rephrasings of each other
- No recommendation — you read the code, you have a view
- Asking cosmetic questions before architectural ones
- Finishing with silent assumptions
- The interview did not change anything you were going to build

## Common Rationalisations

| Excuse | Reality |
|---|---|
| "I'll ask everything at once to save time" | Later answers depend on earlier ones. Batching wastes both |
| "I don't want to bother them" | A wrong data model bothers them far more |
| "I'll just pick a sensible default" | Fine — but state it as an assumption, do not bury it |
| "They said build it, not ask questions" | They said build the right thing |
| "I have no strong opinion" | You read the code. Form one |

## Quick Reference

| Phase | Activity | Complete when |
|---|---|---|
| 1. Read | Search for existing answers | No question survives that code answers |
| 2. Rank | Sort by blast radius | Architectural questions are first |
| 3. Ask | `AskUserQuestion`, one at a time | Each has options and a recommendation |
| 4. Re-rank | Re-sort after each answer | Dead questions dropped out loud |
| 5. Stop | Cosmetic-only, or told to proceed | Every remaining gap is a stated assumption |
