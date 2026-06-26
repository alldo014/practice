---
name: pre-commit-review
description: Review the staged diff before committing. Faults (bugs, security, correctness, broken build) block the commit; NITs (style/minor) are warnings only. On a clean or NIT-only result, records the .git/.review-pass marker so the commit gate allows the commit. Run this before every commit in this repo.
---

# Pre-commit review gate

Enforces the project rule: **every commit is reviewed first — faults block, NITs only warn.**
The commit hook (`.claude/hooks/git-governance-gate.py`) refuses to commit unless this skill
has recorded a passing review whose hash matches the staged tree.

## Steps

1. **Stage the change.** Run `git add -A` (or stage intentionally). The review only covers the
   **staged** diff — anything left unstaged is not reviewed and will not be committed.

2. **Review the staged diff.** Run `git diff --cached` and apply the same rigor as the
   `/code-review` skill. Prioritize, for this codebase:
   - correctness / logic bugs, broken builds, type errors;
   - **tenant isolation** mistakes (data leaking across `tenant_*` schemas, missing
     `tenant_id`/`schema_name` scoping);
   - security (authn/authz gaps, unsanitized input, secrets in code, **Xendit webhook
     signature/token not verified**, SSRF/SQL-injection);
   - data loss, money/total miscalculations, double-booking / availability races.

3. **Classify every finding** as exactly one of:
   - **FAULT** — a real bug, security hole, correctness/logic error, or broken build. Must be fixed.
   - **NIT** — style, naming, minor cleanup, non-blocking suggestion.

4. **Decide:**
   - **If ANY fault exists:** report all faults clearly, do **NOT** write the marker, and tell the
     user the commit is blocked until the faults are fixed. Stop here.
   - **If only NITs (or nothing):** print the NITs as warnings (the user may fix or ignore them),
     then record the pass marker:
     ```bash
     git write-tree > "$(git rev-parse --git-dir)/.review-pass"
     ```
     The marker stores the staged tree hash; the commit hook verifies it matches.

5. **Commit** (typically via the `pr-workflow` skill).

## Notes
- Re-staging files after the review changes the tree hash and invalidates the marker — re-run
  this skill before committing.
- Emergency bypass: prefix the commit with `SKIP_REVIEW_GATE=1` (discouraged — faults should be
  fixed, not bypassed).
