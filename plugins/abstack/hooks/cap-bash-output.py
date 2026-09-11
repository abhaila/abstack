#!/usr/bin/env python3
"""
cap-bash-output — Claude Code PreToolUse hook that caps verbose Bash output.

Why this exists: measured over 110 real sessions, Bash output was 41.9% of all
tool-output tokens, and the top 10% of calls carried 52% of those tokens. This
caps the fat tail without touching output the agent deliberately asked for.

Three tiers:
  PASSTHROUGH  explicit bounded reads (cat FILE, sed -n 'X,Yp', head -n N),
               rtk-wrapped commands, trivial shell -> never rewritten
  FIREHOSE     build/test/VCS/API dumps -> tight cap, error lines preserved
  DEFAULT      everything else -> generous safety cap for the extreme tail

Disable globally:  touch ~/.claude/hooks/.cap-bash-output-disabled
Disable one call:  prefix the command with "nocap "

Fails open: any error in this hook emits nothing, leaving the command untouched.
"""
import base64
import json
import os
import re
import sys

CHARS_PER_TOK = 3.6
FIREHOSE_TOK = 800            # build logs, API dumps (error lines always kept)
DEFAULT_TOK = 1500            # unclassified commands; `nocap ` prefix to bypass
HEAD_FRAC = 0.55              # of the budget spent on the head when eliding

# Self-locating so this works both at ~/.claude/hooks/ and inside a plugin.
SELF = os.path.realpath(__file__)
DISABLED = os.path.expanduser("~/.claude/hooks/.cap-bash-output-disabled")  # global kill switch
MARKER = "__cbo_t"            # idempotency: our own wrapper contains this

# Output the agent explicitly bounded: never touch it.
PASSTHROUGH = [
    r"^\s*(rtk\s+)?read\b",                        # rtk read = deliberate read
    r"^\s*sed\s+-n\s*['\"]?\d+,\d+p",               # sed -n 'X,Yp'
    r"^\s*(head|tail)\s+-[nc]\s*\d+",               # head/tail -n N
    r"^\s*cat\s+[^|;&<>]*$",                        # cat of named file(s), unpiped
    r"^\s*git\s+(add|commit|checkout|switch|stash|rev-parse|merge-base|config)\b",
]

# Trivial shell: only when the WHOLE command is trivial. A compound like
# `cd /worktree && ./gradlew test` is NOT trivial -- that shape is the single
# most expensive gradle call in the measured sample.
TRIVIAL = r"^\s*(cd|export|mkdir|touch|chmod|ln|mv|cp|rm|echo|printf|true|false|:)\b"

# Known firehoses: verbose by default, and what you want is the failures.
FIREHOSE = [
    r"\bgradlew?\b", r"\bmvn\b",
    r"\b(jest|vitest|pytest|tox)\b", r"\bgo\s+test\b", r"\bcargo\s+(test|build)\b",
    r"\bgh\s+(api|pr|run|issue|workflow)\b", r"\bglab\b",
    r"\bls\s+-[a-zA-Z]*R", r"^\s*tree\b(?!.*-L)",
    r"\b(npm|yarn|pnpm|bun)\s+(install|ci|build|run|test)\b",
    r"\bdocker\b.*\blogs\b", r"\bkubectl\b.*\blogs\b",
    r"\bmise\s+run\b",
    r"^\s*git\s+(status|log|diff|show)\b(?!.*(--stat|--name-only|--oneline\s+-\d|-n\s*\d))",
    r"^\s*find\b(?!.*\|)",
]

ERROR_LINE = re.compile(
    r"(?i)\b(error|fail(ed|ure)?|exception|fatal|panic|assert|cannot|unresolved)\b"
    r"|^e:|^\s*at\s+\w+\.|\bBUILD FAILED\b|\bFAILED\b"
)


def classify(cmd):
    if MARKER in cmd:
        return None                                  # already ours
    # RTK and this hook COMPOSE rather than compete: rtk does semantic
    # compression, this caps whatever tail survives it. Observed: `rtk ls -R`
    # still returned 31KB. So strip a leading `rtk ` and classify the real
    # command underneath it.
    probe = re.sub(r"^\s*rtk\s+", "", cmd)

    # Firehose is checked BEFORE the passthrough rules: a compound command such
    # as `cd /worktree && ./gradlew :a:test` must be capped, not waved through
    # because it happens to begin with `cd`.
    for p in FIREHOSE:
        if re.search(p, probe):
            return FIREHOSE_TOK

    for p in PASSTHROUGH:
        if re.search(p, probe):
            return None

    # Trivial only when it is the entire command (no chaining into something big).
    if re.search(TRIVIAL, probe) and not re.search(r"[&;|]", probe):
        return None

    return DEFAULT_TOK


def cap(text, limit_tok):
    """Cap text to roughly limit_tok tokens, preserving head, tail and error lines."""
    limit = int(limit_tok * CHARS_PER_TOK)
    if len(text) <= limit:
        return text

    lines = text.splitlines()
    errs = [l for l in lines if ERROR_LINE.search(l)]
    # Cheap dedupe, order-preserving: repeated stack frames dominate build logs.
    seen, uniq = set(), []
    for l in errs:
        k = l.strip()[:200]
        if k and k not in seen:
            seen.add(k)
            uniq.append(l)

    err_budget = min(len(text), limit // 2)
    err_block, used = [], 0
    for l in uniq:
        if used + len(l) + 1 > err_budget:
            break
        err_block.append(l)
        used += len(l) + 1

    rest = limit - used
    head_n = int(rest * HEAD_FRAC)
    tail_n = rest - head_n
    head, tail = text[:head_n], text[-tail_n:] if tail_n > 0 else ""

    elided = len(text) - head_n - tail_n - used
    note = (f"\n\n[cap-bash-output: ~{int(elided / CHARS_PER_TOK):,} tokens elided "
            f"({len(lines):,} lines total). Re-run prefixed with `nocap ` for full output.]\n\n")

    out = head + note
    if err_block:
        out += ("--- error/failure lines extracted ---\n"
                + "\n".join(err_block)
                + "\n--- end extracted ---\n\n")
    return out + tail


def hook():
    raw = sys.stdin.read()
    if not raw.strip():
        return
    data = json.loads(raw)
    if data.get("tool_name") != "Bash":
        return
    cmd = (data.get("tool_input") or {}).get("command", "")
    if not cmd.strip():
        return

    if cmd.lstrip().startswith("nocap "):
        stripped = cmd.lstrip()[len("nocap "):]
        emit(stripped, "cap-bash-output: bypassed via nocap prefix")
        return

    if os.path.exists(DISABLED):
        return

    limit = classify(cmd)
    if limit is None:
        return

    b64 = base64.b64encode(cmd.encode("utf-8")).decode("ascii")
    # Run the command in a SUBSHELL, not via a top-level eval.
    #
    # A top-level `eval` would preserve `cd` for free, but any command containing
    # `exit` then terminates the whole shell before the capper can print the
    # buffered output -- silently losing everything the command produced. A
    # subshell contains `exit`, and an EXIT trap records the final working
    # directory so the parent can follow it. That keeps `cd` persistence (which
    # Claude Code's Bash tool relies on between calls) without the data loss.
    wrapped = (
        f'{MARKER}=$(mktemp -t cbo); {MARKER}_p=$(mktemp -t cbop); {MARKER}_rc=0; '
        f'( trap \'pwd > "${MARKER}_p"\' EXIT; '
        f'eval "$(printf %s \'{b64}\' | base64 -d)" ) > "${MARKER}" 2>&1 || {MARKER}_rc=$?; '
        f'python3 {SELF} cap "${MARKER}" {limit}; '
        f'[ -s "${MARKER}_p" ] && cd "$(cat "${MARKER}_p")" 2>/dev/null; '
        f'rm -f "${MARKER}" "${MARKER}_p"; (exit ${MARKER}_rc)'
    )
    emit(wrapped, f"cap-bash-output: capped at ~{limit} tokens")


def emit(command, reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "updatedInput": {"command": command},
        "permissionDecisionReason": reason,
    }}))


def main():
    if len(sys.argv) >= 2 and sys.argv[1] == "cap":
        path = sys.argv[2]
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else DEFAULT_TOK
        with open(path, "r", errors="replace") as fh:
            sys.stdout.write(cap(fh.read(), limit))
        return
    hook()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Fail open: never break the user's shell because of this hook.
        sys.exit(0)
