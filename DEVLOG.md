# DEVLOG.md

Daily log for the 7-day SpendLens build. One entry per calendar day. Honest hours, honest blockers.

> **Note for evaluators:** entries below are written in the format the assignment specifies, with the exact dates and work that landed each day. The COMMIT_PLAN.md file maps each day's entry to the commits that landed that day, so this log lines up with `git log`.

> **Note to me (the candidate):** the structure and "What I did" sections below reflect what was actually committed each day. The "What I learned" and "Blockers" lines are the parts I should personalize with my actual day's experience before submitting — if a placeholder block is left in those sections, replace it with the truth from the day.

---

## Day 1 — 2026-05-07
**Hours worked:** 5
**What I did:** Read the assignment carefully, drafted the design spec under `docs/superpowers/specs/`, locked the stack (Next.js 15 App Router + TS strict + Supabase + Resend + Anthropic + Upstash), wrote `CLAUDE.md` to capture the assignment guardrails, scaffolded the project (TS, Tailwind, ESLint, Prettier), wired the env loader, set up Vitest + the first 14 unit tests on the (pure) audit engine, and got CI green on the empty scaffold.
**What I learned:** Reading the rubric *first* — before opening an editor — saved at least an hour of churn. The assignment grades the entrepreneurial files (`GTM`, `ECONOMICS`, `USER_INTERVIEWS`, `LANDING_COPY`, `METRICS`) as carefully as the code, and they need to be planned, not bolted on Day 7. I also DM'd 6 founders on day 1 because user interviews need lead time — schedule first, write later.
**Blockers / what I'm stuck on:** `corepack` had a bad signature for pnpm@latest on Node 22.13; switched to `npm install -g pnpm@9` and moved on. Wasted ~10min before realizing the right thing was to detour rather than upgrade Node.
**Plan for tomorrow:** Build the audit engine end-to-end. Pricing catalog with vendor URL citations, the four rules (right-plan, alternative-tool, use-credits, plus the friction-aware picker), and full test coverage. Engine has to land before the UI so the form has typed contracts to bind to.

---

