---
name: pr-workflow
description: Finish a unit of work the required way — feature branch, reviewed commit, push, and a PR against alldo014/practice. Never commit or push to main directly. Use whenever a unit of work is ready to land.
---

# PR-only workflow

Enforces the project rule: **never commit/push to `main` directly — every finished unit of work
goes through a Pull Request.** The git gate (`.claude/hooks/git-governance-gate.py`) blocks
commits on main and pushes to main.

## Steps

1. **Branch.** If on `main`/`master`, create a feature branch named `<type>/<short-desc>`:
   ```bash
   git switch -c feat/booking-flow      # or chore/…, fix/…, docs/…
   ```

2. **Stage.** `git add -A` (or stage intentionally).

3. **Review gate.** Run the `pre-commit-review` skill. If it reports **faults**, fix them and
   re-run. Do not proceed until it records a pass marker.

4. **Commit.** Use a conventional-commit message and end it with the co-author trailer:
   ```bash
   git commit -m "feat: add guest booking flow

   Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
   ```

5. **Push the feature branch** (never main):
   ```bash
   git push -u origin <branch>
   ```

6. **Open the PR** against `alldo014/practice`, linking the issue it closes:
   ```bash
   gh pr create --repo alldo014/practice --base main \
     --title "<title>" \
     --body "Closes #<issue>

   <summary>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)"
   ```

7. After review/merge on GitHub, sync locally with `git switch main && git pull`. Never
   `git push` to main.
