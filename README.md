# Luxury Hotel Booking Platform

A multi-tenant hotel booking platform. Multiple hotels are listed; each hotel is a **tenant**
(a user type alongside *guest* and *platform admin*). Guests browse hotels, book rooms, and pay
online via **Xendit**.

Built from the static `luxury-hotel-website` landing page (see `design-reference/`), which
supplies the visual design language for the guest-facing UI.

## Stack
- **Next.js** (App Router) + **TypeScript**
- **Prisma** ORM + **PostgreSQL** (run locally via Homebrew: `brew install postgresql@16`)
- **Auth.js (NextAuth)** — role-based (guest / tenant_owner / admin)
- **Xendit** — payments (test mode in development)

## Multi-tenancy (hybrid schema-per-tenant)
- **Shared `public` schema** — cross-hotel discovery + global data: `tenants`, `users`,
  `hotel_listings` (denormalized catalog used for search/browse).
- **Per-tenant schema `tenant_<id>`** — each hotel's private operational data: `Hotel`, `Room`,
  `Booking`, `Payment`. Cloned from a migrated template; accessed via a `getTenantDb()` helper.

This keeps tenant operational data isolated while still allowing guests to search across all
hotels at once.

---

## Engineering guardrails (hard-enforced)

This repo enforces two rules via Claude Code hooks in [.claude/](.claude/). They are active for
any Claude Code session whose project root is this repo.

### 1. PR-only workflow
**Never commit or push to `main` directly.** Every finished unit of work goes through a feature
branch and a Pull Request. Enforced by the git gate, which blocks commits on `main`/`master` and
pushes to `main`/`master`. See the [`pr-workflow`](.claude/skills/pr-workflow/SKILL.md) skill.

### 2. Pre-commit review gate
**A review runs before every commit.** Findings are classified:
- **Faults** (bugs, security, correctness, broken build) → **block the commit** until fixed.
- **NITs** (style/minor) → warnings only; the user may proceed.

The [`pre-commit-review`](.claude/skills/pre-commit-review/SKILL.md) skill reviews the staged
diff and, on a clean/NIT-only result, writes `.git/.review-pass` with the staged tree hash. The
commit hook refuses to commit unless that marker matches the staged tree.

**Emergency bypass:** prefix a command with `SKIP_REVIEW_GATE=1` (discouraged).

> The hooks self-scope to this repo (git root ending in `/practice`), so they never affect work
> in other repositories — even if configured globally.

---

## Development
```bash
npm install
# configure DATABASE_URL in .env  (local Postgres)
npx prisma migrate dev
npm run seed        # seed 2–4 hotels (tenants) + rooms
npm run dev         # http://localhost:3000
```
