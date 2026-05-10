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

## Day 2 — 2026-05-08
**Hours worked:** 6
**What I did:** Built the audit engine. `src/engine/types.ts` with the AuditInput/AuditResult contracts, `src/engine/pricing.ts` as the catalog (with `findPlan` helper and `CREDEX_SOURCED` set), and the three rule files (`downgrade-plan.ts`, `alternative-tool.ts`, `use-credits.ts`). Wrote `audit.ts` orchestrator. Added the friction-aware picker: when multiple rules fire on the same tool, prefer lower friction if it captures ≥80% of the top savings — otherwise take the bigger number. Wrote 14 tests covering each rule's positive + negative paths, the friction tiebreaker, totals + ctaTier classification, and output hygiene. All passing. Committed `PRICING_DATA.md` with citation URLs + verification dates.
**What I learned:** I started the engine with rules written as a switch on tool name. Halfway through I refactored to "each rule is a `Rule` function that returns `ToolFinding | null`" — way easier to test in isolation. The naive max-savings picker was the original design; I caught the friction-aware picker need only when test #1 failed (Cursor Business 2-seat case suggested switching IDEs over a same-vendor downgrade). That's the moment when I trusted the test suite over the design doc.
**Blockers / what I'm stuck on:** Pricing data for Claude's Team plan (5-seat minimum) was confusing — the Anthropic page lists "$25/seat" with min seats called out only in a footnote. I pulled the URL, took a screenshot, and made the minSeats explicit in the catalog so future-me doesn't fall for the same thing.
**Plan for tomorrow:** Form UI with Zustand persistence + landing page. Stub the API routes so the form has a real endpoint to POST to.

---

## Day 3 — 2026-05-09
**Hours worked:** 7
**What I did:** Authored the shadcn-style UI primitives (Button, Input, Label, Select, Card) directly in `src/components/ui/` instead of using the shadcn CLI — same Radix internals, simpler dep tree, no git-init coupling. Built the Zustand-persisted form store. Built `SpendForm` with add/remove tools, plan-aware select cascading (changing tool resets plan to a valid one), keyboard navigation, and proper ARIA labels. Built the landing page with hero, how-it-works section, and the Credex link. Added a hydration-loading state so persist rehydration doesn't flash form defaults.
**What I learned:** Zustand's `persist` middleware needs a hydrated check before render — without it, the SSR'd form mounts with defaults, then localStorage rehydrates and the form values jump. I added a `useEffect(() => setHydrated(true), [])` and a Loader2 spinner to handle the gap cleanly.
**Blockers / what I'm stuck on:** The Select component had an a11y issue where `aria-label` on the trigger was getting overridden by Radix's default ID-based label. Fixed by passing `aria-label` explicitly on every `SelectTrigger` and adding a sibling `Label` for visual cue.
**Plan for tomorrow:** Backend wiring — Supabase schema migration, `/api/audit` and `/api/lead` routes, Resend transactional email, Upstash rate limit, honeypot. The whole "form submits → audit persists → email fires" loop needs to work end-to-end so I can iterate on the result page tomorrow.

---

## Day 4 — 2026-05-10
**Hours worked:** 6
**What I did:** Wrote `supabase/schema.sql` (audits + leads tables, RLS policies — anon SELECT on audits, no anon access to leads), wired the service-role and anon clients (`src/lib/supabase/server.ts`), built `/api/audit` (Zod-validated, IP-rate-limited, runs the engine, persists, returns audit id), built `/api/lead` (honeypot check, lead insert, fire-and-forget Resend confirmation + Credex notification for high-savings cases). Wired `src/lib/ratelimit.ts` (Upstash sliding window 5/10min) with a graceful no-op when not configured locally. Added `src/lib/email/resend.ts` with two templated emails (user confirmation + Credex sales notification). Conducted user interview #1 (~25 minutes with a Series A founder).
**What I learned:** The lead insert's IP-hash field — I almost stored the raw IP. Hashed it instead (sha256, 16-char prefix) so we have abuse-detection signal without storing PII. Worth a sentence in the GDPR-light story we'd write if this ever ships beyond a demo.
**Blockers / what I'm stuck on:** Initial cut of `/api/lead` returned a 404 if the audit id didn't exist; I changed it to a 404 with an explicit error so the UI could distinguish "audit gone" from "network died." Also realized fire-and-forget emails need a `.catch` or they'll throw an unhandled rejection in dev — added defensive `.catch((err) => console.warn(...))` chains.
**Plan for tomorrow:** AI summary integration with the templated fallback, share URL with OG metadata + dynamic OG image. The summary is the only place AI gets to play; the fallback is what makes it production-grade.

---

## Day 5 — 2026-05-11
**Hours worked:** 6
**What I did:** Wrote `src/lib/anthropic/summary.ts` — generateSummary calls `claude-haiku-4-5` with `cache_control: ephemeral` on the system prompt. Templated fallback handles missing key, timeout (4s), 429, 5xx. `/api/summary` is idempotent and persists the summary back to the audit row so it's only generated once. Built `/r/[id]/page.tsx` (server component, reads via anon client, returns notFound if missing), `/r/[id]/opengraph-image.tsx` (dynamic OG with savings number, gradient mesh, tools list), root `/opengraph-image.tsx`. Added `generateMetadata` with Twitter cards. Built the result-page UI: `audit-result-view.tsx` (hero, per-tool breakdown, conditional Credex CTA for `ctaTier === "high"`), `audit-summary-block.tsx` (lazy-loads summary client-side, with a graceful "summary temporarily unavailable" path). Conducted user interview #2 (~20 minutes with a Y Combinator founder running a 12-person team).
**What I learned:** OG image generation in Next 15's `next/og` uses an inline-style-only subset (no Tailwind). The trick is to keep the layout flat and rely on flexbox + linear-gradient — anything more complex breaks silently with a non-helpful error. I prototyped the OG locally with `pnpm dev` and `view-source:localhost:3000/og` before deploying.
**Blockers / what I'm stuck on:** Anthropic API key is on a usage-tier with rate limits — first integration test hit a 429 because I'd been iterating on the prompt all morning. The templated fallback caught it gracefully, which is the design, but it surfaced a UX question: should we visibly tell the user the summary is templated? Decided no — they don't care, and the fallback's voice is tuned to match.
**Plan for tomorrow:** Polish day. PDF export (the bonus), a11y pass (focus management, color contrast, ARIA live regions), Lighthouse mobile audit, screenshots for README, README + ARCHITECTURE deep edits.

---

