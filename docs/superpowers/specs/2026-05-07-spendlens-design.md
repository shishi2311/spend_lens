# SpendLens — Design Spec

**Date:** 2026-05-07
**Author:** Anish (via Claude collaboration)
**Status:** Approved
**Source:** Credex WebDev 2026 Assignment Round 1

## 1. What We're Building

SpendLens is a free web app that gives startup founders and engineering managers a defensible audit of their AI tool spend (Cursor, Copilot, Claude, ChatGPT, Anthropic API, OpenAI API, Gemini, Windsurf). Users input their tools, plans, monthly spend, seats, team size, and primary use case, and get an instant on-screen audit showing per-tool overspend, cheaper plan/alternative recommendations, and total monthly + annual savings. Email is captured *after* value is shown. Results are shareable via a unique public URL with proper Open Graph previews. High-savings cases route to a Credex consultation CTA; honest "you're spending well" surfaces for low-savings.

This is a take-home for a Web Development Intern role at Credex, evaluated on engineering quality *and* entrepreneurial thinking (GTM, economics, user interviews, landing copy, metrics).

**Tagline candidate:** "A second opinion on your AI bill."

## 2. Target User

Primary: Engineering managers and technical founders at seed–Series A startups (5–40 person teams) where AI tools are >2% of total OpEx and there's no one whose job is to audit SaaS spend. They paid the bill last month, suspected they're overpaying, and have no benchmark.

## 3. Core User Flow

1. Cold visitor lands on `/` (from a tweet, blog, or HN).
2. Inputs tools they pay for, plan, monthly spend, seats. Plus team size + primary use case.
3. Submits → instant on-screen audit at `/r/[id]`: per-tool breakdown, hero savings number, AI-generated personalized summary.
4. Email gate appears *after* value is shown ("Email me this report"). High-savings (>$500/mo) audits surface a "Book Credex consultation" CTA.
5. The `/r/[id]` URL is shareable; identifying details (company name, email) are stripped from the public version.
6. Bonus: User can export the audit as PDF.

## 4. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | SSR is non-negotiable for shareable URLs with OG/Twitter cards. API routes keep the Anthropic key server-side. Fast Vercel deploy. TS strict mode for the audit engine's correctness. |
| Styling | **Tailwind + shadcn/ui** | Headless primitives (Radix under the hood) → accessible by default, no template aesthetic, fast to ship. |
| State (form) | **Zustand + zustand/middleware persist** | Form state must survive page reloads. Lighter than Redux, simpler than React Context for this. |
| Backend DB | **Supabase (Postgres)** | Generous free tier. Row Level Security for the public `/r/[id]` read pattern. Hosted, no infra. |
| Email | **Resend** | Cleanest DX, free tier covers the assignment, modern templating. |
| AI | **Anthropic API — claude-haiku-4-5** | Cheap + fast for ~100-word summaries. Templated fallback on failure. |
| Rate limit | **Upstash Redis (free tier)** | IP-based sliding window. Honeypot field as second layer. |
| Tests | **Vitest + Testing Library** | Fast, modern, good TS support. |
| CI | **GitHub Actions** | `lint + typecheck + test` on push to main. |
| Deploy | **Vercel** | First-party Next.js host, edge SSR, free tier. |
| PDF export (bonus) | **react-pdf** or **@react-pdf/renderer** | Server-side render to PDF; clean output without headless Chrome. |

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  ┌───────────────┐    ┌──────────────────┐                  │
│  │ / (landing +  │    │ /r/[id] (public  │                  │
│  │  spend form)  │    │  audit result)   │                  │
│  │  Zustand+LS   │    │  SSR + OG tags   │                  │
│  └───────┬───────┘    └─────────▲────────┘                  │
└──────────┼──────────────────────┼────────────────────────────┘
           │ POST                 │ GET
           ▼                      │
┌─────────────────────────────────┴────────────────────────────┐
│  Next.js API Routes (server)                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ /api/audit   │  │ /api/lead    │  │ /api/summary │       │
│  │ - validate   │  │ - email gate │  │ - Anthropic  │       │
│  │ - run engine │  │ - Resend     │  │ - fallback   │       │
│  │ - persist    │  │ - rate limit │  │              │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼─────────────────┼────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────┐ ┌─────────────┐ ┌──────────────────┐
│ Pure audit       │ │ Supabase    │ │ Anthropic        │
│ engine module    │ │ (Postgres)  │ │ API              │
│ (deterministic)  │ │  audits     │ │                  │
│ + pricing data   │ │  leads      │ │                  │
└──────────────────┘ └─────────────┘ └──────────────────┘
```

### Data flow (a single audit)
1. Form `onSubmit` → `POST /api/audit` with validated payload (Zod).
2. API route: rate-limit check → run pure `runAudit(input)` → insert audit row in Supabase → return `{ id }`.
3. Client redirects to `/r/[id]`.
4. `/r/[id]` is a server component: reads audit by id (anon RLS), renders breakdown, fires `/api/summary` to fetch the AI summary (with templated fallback on failure).
5. Below the fold: email gate → `POST /api/lead` → insert lead → Resend confirmation email.

## 6. The Audit Engine (the core)

The audit engine is a **pure TypeScript module** with no I/O, no network, no AI. Given an input, it deterministically returns an `AuditResult`.

### Types
```ts
type Tool = 'cursor' | 'copilot' | 'claude' | 'chatgpt' | 'anthropic_api'
          | 'openai_api' | 'gemini' | 'windsurf';

type UseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed';

interface ToolEntry {
  tool: Tool;
  plan: string;          // tool-specific enum
  monthlySpend: number;  // user-reported, USD
  seats: number;
}

interface AuditInput {
  tools: ToolEntry[];
  teamSize: number;
  useCase: UseCase;
}

type RecommendationKind =
  | 'downgrade_plan'      // same vendor, cheaper plan
  | 'switch_tool'         // different vendor, similar capability
  | 'use_credits'         // Credex angle
  | 'already_optimal';    // honest no-op

interface ToolFinding {
  tool: Tool;
  currentSpend: number;
  recommendation: RecommendationKind;
  recommendedSpend: number;
  monthlySavings: number;
  reason: string;         // 1-sentence, defensible
  citations: string[];    // pricing URLs from PRICING_DATA.md
}

interface AuditResult {
  findings: ToolFinding[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  ctaTier: 'high' | 'low' | 'optimal';  // drives Credex CTA visibility
}
```

### Rules (each rule = pure function `(entry, context) => ToolFinding | null`)
1. **Right-plan check** — Team plan with ≤2 seats → recommend Pro.
2. **Cheaper-same-vendor** — Compare current plan price vs. minimum plan that satisfies seat + use-case requirements.
3. **Alternative-tool** — Per `useCase`, if a substantially cheaper tool covers the use case (e.g., Cursor Business → Claude Code direct for coding), surface it with delta.
4. **Retail-vs-credits** — For tools Credex sources (Cursor, Claude, ChatGPT Enterprise), if user is on retail Business/Enterprise: recommend `use_credits`.

The engine returns the *single highest-savings* recommendation per tool (no double-counting). Total savings are summed; `ctaTier` is derived from total monthly savings:

- `total > $500` → `'high'` (Credex CTA prominent)
- `$100 ≤ total ≤ $500` → `'low'` (Credex CTA secondary, still shown but not prominent)
- `total < $100` AND no findings → `'optimal'` (no Credex push; "you're spending well" + notify-me signup)
- `total < $100` AND ≥1 finding → `'low'` (small wins shown honestly)

### Why hardcoded rules, not AI
The assignment is explicit: "knowing when not to use AI is part of the test." Rules are auditable, testable, and a finance person can read the reason and agree. AI is reserved for the personalized 100-word summary.

## 7. AI Summary (`/api/summary`)

Single Anthropic call, claude-haiku-4-5. Prompt takes the `AuditResult` and emits a friendly ~100-word paragraph framing the findings to the user. Full prompt + iteration notes go in `PROMPTS.md`.

**Failure handling:** Try → on 429/5xx/timeout (3s) → fall back to a templated string built from the same `AuditResult` ("You could save ~$X/mo. The biggest opportunity is …"). User never sees an error.

**Caching:** Summary is generated *once* per audit and persisted to `audits.summary`. On every subsequent `/r/[id]` page load it's read from the row, no Anthropic call. The route hits `/api/summary` only when `audits.summary IS NULL`. Templated fallbacks are also persisted (so a temporary outage doesn't permanently degrade the report — admin can null+regenerate later).

**Prompt caching:** Use the Anthropic SDK's `cache_control` on the system prompt (which contains pricing context). Halves cost across the day's audits.

## 8. Persistence Schema (Supabase)

```sql
-- audits: the canonical record. Public reads via RLS for /r/[id].
create table audits (
  id           text primary key,            -- nanoid(10)
  input        jsonb not null,              -- AuditInput (raw user input)
  result       jsonb not null,              -- AuditResult
  summary      text,                        -- AI-generated, nullable
  created_at   timestamptz default now()
);

-- leads: identifying info. Never readable by anon role.
create table leads (
  id            uuid primary key default gen_random_uuid(),
  audit_id      text references audits(id),
  email         text not null,
  company       text,
  role          text,
  team_size     int,
  created_at    timestamptz default now()
);

create index leads_audit_id_idx on leads(audit_id);

-- RLS: anon can SELECT audits but not leads. Service role inserts both.
```

The public `/r/[id]` route reads `audits` only — leads stay server-side.

## 9. Shareable URL & OG

- Route: `/r/[id]` is a server component.
- `generateMetadata({ params })` builds OG + Twitter card tags from the audit (title: "Saved $X/mo", description excerpt, dynamic OG image at `/og/[id]`).
- Dynamic OG image: Next.js `ImageResponse` (no headless Chrome). Renders savings number + tools list.
- Identifying fields are simply not stored in `audits.result` — they live only in `leads`.

## 10. Abuse Protection

- **IP rate limit:** Upstash sliding window — 5 audits / 10 min / IP. Why Upstash: free tier, edge-compatible, no infra. Documented in DEVLOG.
- **Honeypot:** Hidden form field; submissions with it filled are silently 200'd but never persisted. Cheap, no UX cost, kills naive bots.
- **No hCaptcha:** Adds friction before value is shown. Rate limit + honeypot suffices for the threat model (this is a free public tool, not high-stakes).

## 11. Accessibility & Performance

Lighthouse mobile targets: Perf ≥85, A11y ≥90, BP ≥90. Approach:
- shadcn/Radix primitives (correct ARIA out of the box).
- Form: real labels, error messages tied via `aria-describedby`, keyboard nav, focus trap on modal.
- Color contrast: verify against WCAG AA in tokens.
- Static-first rendering on `/r/[id]`; defer AI summary client-side after initial paint.
- Next.js `next/image` for any imagery; system fonts or `next/font` for one webfont.

## 12. Testing Strategy

**5+ unit tests on the audit engine** (assignment minimum):
1. Right-plan downgrade fires when Team plan has 2 seats.
2. Cheaper-same-vendor fires when Pro covers usage.
3. Alternative-tool fires only when matching `useCase`.
4. `use_credits` fires for vendors Credex sources.
5. `already_optimal` returns no findings when user is on minimum-fitting plans.
6. Total monthly + annual savings sum correctly across multi-tool input.
7. `ctaTier` thresholds (>$500, <$100) classify correctly.

**Plus:** at least one integration test for `/api/audit` (request → response shape).

All tests run in `vitest`. CI runs `pnpm lint && pnpm typecheck && pnpm test` on every push to main.

## 13. Required Repo Files (assignment-mandated, non-optional)

Repo root must contain, exact filenames:
- `README.md` — summary, screenshots/Loom, quick start, "Decisions" section, deployed URL.
- `ARCHITECTURE.md` — Mermaid system diagram, data flow, stack rationale, "10k audits/day" plan.
- `DEVLOG.md` — 7 dated entries, exact format from assignment.
- `REFLECTION.md` — 5 questions, 150–400 words each.
- `TESTS.md` — every test listed.
- `PRICING_DATA.md` — every number traces to vendor URL with date.
- `PROMPTS.md` — full LLM prompts + reasoning.
- `GTM.md` — 300–700 words, target user, channels, first 100 users plan.
- `ECONOMICS.md` — 300–700 words, unit economics, $1M ARR math.
- `USER_INTERVIEWS.md` — 3 real interviews, 150–300 words each.
- `LANDING_COPY.md` — hero, sub, CTA, social proof, FAQ.
- `METRICS.md` — North Star + 3 inputs + pivot trigger.
- `.github/workflows/ci.yml` — lint + tests on push to main.

## 14. What I'd Do Differently at 10k audits/day

- Move the audit engine to a Cloudflare Worker (cold-start, edge proximity).
- Materialized view of pricing data, refreshed via a cron job that scrapes vendor pages and PRs to `PRICING_DATA.md`.
- Replace Supabase Postgres for audit storage with KV (Cloudflare or Upstash) — audits are write-heavy, read-rare.
- Background-job pipeline for AI summaries (BullMQ on Redis), so `/api/audit` doesn't block on Anthropic.
- Real captcha (hCaptcha or Turnstile) above ~1k audits/day.

## 15. Out of Scope for Round 1

- User accounts / login (assignment forbids it before value).
- Editing / re-running an audit (each audit is immutable, share-only).
- Direct integrations (no OAuth into vendor billing). User self-reports.
- All bonuses except PDF export.

## 16. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Pricing data goes stale mid-week | Pull all pricing Day 2; date-stamp; spot-recheck Day 6 before submission. |
| User interviews can't be scheduled | DM 6+ founders Day 1 (2x oversample). Have backup pool from college network. |
| Lighthouse Perf <85 on mobile | Audit Day 6 with `lighthouse-ci`; defer AI summary client-side; optimize fonts/images. |
| Anthropic API rate limit / outage | Templated fallback engaged on any non-200; logged + degrades gracefully. |
| One-shot codebase appearance (auto-reject signal) | Commits across ≥5 days; meaningful messages; small atomic commits; DEVLOG honesty. |

## 17. Decisions to Document in README

(For the README "Decisions" section — pre-thought so they're real, not retrofit):
1. **Why Next.js over vanilla React+Vite:** SSR for OG tags on shareable URLs is the single load-bearing reason — without it the viral loop has no preview cards.
2. **Why hardcoded audit rules over LLM-as-judge:** Defensibility. Finance reads the reason; rules trace to pricing URLs; deterministic = testable.
3. **Why email-after-value:** Conversion data on lead-gen audits universally shows higher quality + lower abandonment when value is shown first. Also assignment-mandated.
4. **Why Supabase over D1/Firebase:** Postgres + RLS is the simplest way to enforce "anon can read audits, not leads" without a custom auth layer.
5. **Why rate-limit + honeypot, not captcha:** Captchas before value would kill the funnel; the threat model (free public tool) doesn't justify the friction.

---

**This spec is locked.** Phase plan and CLAUDE.md follow.
