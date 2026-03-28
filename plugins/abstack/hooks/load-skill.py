#!/usr/bin/env python3
"""SessionStart hook - loads a skill file and outputs JSON for context injection."""

import json
import re
import sys
from pathlib import Path


def strip_frontmatter(content: str) -> str:
    """Remove YAML frontmatter from markdown content."""
    pattern = r"^---\s*\n.*?\n---\s*\n"
    return re.sub(pattern, "", content, count=1, flags=re.DOTALL)


def main() -> None:
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <relative-path-to-skill>", file=sys.stderr)
        sys.exit(1)

    relative_path = sys.argv[1]
    script_dir = Path(__file__).parent
    plugin_root = script_dir.parent
    skill_path = plugin_root / relative_path

    if not skill_path.exists():
        print(f"Error: Skill not found at {skill_path}", file=sys.stderr)
        sys.exit(1)

    content = skill_path.read_text(encoding="utf-8")
    skill_content = strip_frontmatter(content)

    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": skill_content,
        }
    }

    print(json.dumps(output))


if __name__ == "__main__":
    main()
