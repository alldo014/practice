#!/usr/bin/env python3
"""
PreToolUse(Bash) governance gate for the `practice` repo.

Hard-enforces two project rules:
  1. PR-only workflow   -> no `git commit` on main/master, no `git push` to main/master.
  2. Pre-commit review  -> a `git commit` is allowed only when the pre-commit-review skill
                           recorded a pass marker (.git/.review-pass) whose hash matches the
                           current staged tree. Faults => no marker => commit blocked.
                           NITs never remove the marker, so they never block.

Reads the hook payload as JSON on stdin and, to block, prints a PreToolUse "deny" decision.
Self-scoped: only enforces when the command's git root ends in "/practice".
Emergency bypass: set SKIP_REVIEW_GATE=1 (discouraged).
"""
import sys
import os
import re
import json
import subprocess


def git(args, cwd):
    try:
        out = subprocess.run(
            ["git", "-C", cwd] + args,
            capture_output=True, text=True, check=False,
        )
        return out.stdout.strip()
    except Exception:
        return ""


def deny(reason):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)


def allow():
    sys.exit(0)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        allow()  # never break tools on a parse error

    cmd = (data.get("tool_input") or {}).get("command", "") or ""
    cwd = data.get("cwd") or os.getcwd()

    is_commit = re.search(r"\bgit\b[^&|;]*\bcommit\b", cmd) is not None
    is_push = re.search(r"\bgit\b[^&|;]*\bpush\b", cmd) is not None
    if not (is_commit or is_push):
        allow()

    gitroot = git(["rev-parse", "--show-toplevel"], cwd)
    # Self-scope: only the practice repo is governed.
    if not gitroot.endswith("/practice"):
        allow()

    if os.environ.get("SKIP_REVIEW_GATE") == "1":
        allow()

    branch = git(["rev-parse", "--abbrev-ref", "HEAD"], gitroot)

    if is_push:
        if branch in ("main", "master") or re.search(r"\b(main|master)\b", cmd):
            deny(
                "PR-only workflow: pushing to main/master is blocked. "
                "Push your feature branch (git push -u origin <branch>) and open a PR "
                "(see the pr-workflow skill)."
            )
        allow()

    # is_commit
    if branch in ("main", "master"):
        deny(
            f"PR-only workflow: direct commits to '{branch}' are blocked. "
            "Create a feature branch first: git switch -c <type>/<desc> (see the pr-workflow skill)."
        )

    marker = os.path.join(gitroot, ".git", ".review-pass")
    staged_tree = git(["write-tree"], gitroot)
    if not staged_tree:
        deny("Pre-commit review gate: could not compute the staged tree (nothing staged or index conflict).")
    if not os.path.isfile(marker):
        deny(
            "Pre-commit review gate: no passing review recorded for these staged changes. "
            "Run the pre-commit-review skill — faults must be fixed before this commit is allowed."
        )
    try:
        recorded = open(marker).read().strip()
    except Exception:
        recorded = ""
    if recorded != staged_tree:
        deny(
            "Pre-commit review gate: the staged changes differ from the last reviewed tree "
            f"(staged={staged_tree[:10]}, reviewed={recorded[:10] or 'none'}). "
            "Re-run the pre-commit-review skill on the current staged diff."
        )
    allow()


if __name__ == "__main__":
    main()
