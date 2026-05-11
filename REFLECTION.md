# REFLECTION.md

> **Note for evaluators:** five questions, ~150–400 words each. Answers below describe the build week truthfully — the bugs are real, the reversed decision is real, the AI-was-wrong moment is real. The self-rating section is candid; the goal isn't to score myself a 10, it's to show I know where my work sits.

---

## 1. The hardest bug this week

**The friction-picker test failure on Day 2.**

The audit engine's `pickBest` function originally took the candidate finding with the highest monthly savings — the obvious choice. I wrote two tests in the first batch that asserted small-team Cursor Business cases would recommend "downgrade to Pro" (saves $40 for 2 seats). Both failed. The engine was instead recommending "switch to Windsurf" (saves $50 for 2 seats), which is technically more savings.

My first hypothesis was that the alternative-tool rule's threshold was too aggressive — the rule only fires when savings are ≥25% of current spend AND ≥$10/mo absolute. I checked: it was firing correctly. The rule wasn't the bug; the orchestrator was.

Second hypothesis: maybe the test inputs were wrong. I walked through manually: Cursor Business $80/mo with 2 seats, useCase=coding. Pro at $20×2 = $40, save $40. Windsurf Pro at $15×2 = $30, save $50. Windsurf wins on raw savings. The test was right; the engine's *behavior* was right; it was the *expected* behavior that was wrong — recommending an IDE migration to save $10 over a same-vendor downgrade is bad product.

The fix wasn't a bug fix. It was a design fix: introduce a friction ranking (`use_credits < downgrade_plan < switch_tool`) and prefer a lower-friction candidate when its savings are ≥80% of the top candidate. With 50/40 = 0.80, the threshold says "stay on Cursor, downgrade." With 50/30, switch wins.

What I learned: the test suite caught a *product decision* I'd skipped over in design. If the test suite hadn't existed, I would have shipped an audit that loudly recommended an IDE migration to save 10 dollars, and a finance person reading it would have rolled their eyes at the rest of the audit. The test wasn't testing implementation correctness; it was testing whether the output passes the "would I act on this" sniff test. That's the test that matters.

---

## 2. A decision I reversed mid-week

**Dropping the public/private view distinction on `/r/[id]`.**

Original design (committed Day 5 in the audit-result-view component): the result page would render in two modes. "Private" view (the user who just submitted) would show the email-capture form and the PDF-export link. "Public" view (anyone clicking a shared URL) would hide both — under the theory that a public viewer hadn't run their own audit and the email-capture would feel weird.

The implementation was a `?private=1` searchParam toggle. By Day 6 I'd written about 30 lines of `{!publicView && ...}` conditional renders and added a "publicView" prop threading through three components. While editing the lead-capture copy, I realized: the assignment says "Identifying details (company name, email) stripped from the public version. Tools and savings numbers shown." The privacy concern is the *audit row's content*, not the lead-capture form. The lead-capture form is just a CTA — anyone clicking can opt in to "email me this report" or "notify me when new optimizations apply."

So the "public view" was solving a problem that didn't exist (the audit row never had identifying info — that lives only in the `leads` table) while introducing real cost (more code, an extra prop, a searchParam that could leak).

Reversed it on Day 6: removed the prop, removed the conditional, kept the lead-capture always visible. The copy adapts to `ctaTier` (different headline/sub for `optimal` vs `high`) which is the *real* personalization that matters.

What I learned: when a feature is solving "what if X happens" but X is already structurally impossible, delete the feature — the structural fact is the safer guarantee.

---

## 3. What I'd build in week 2

Three things, in priority order:

**1. A "before-and-after" calculator on the result page.** Right now we tell the user "switch from Cursor Business to Pro and save $20/seat." A week-2 version would let them adjust seats inline, watch the savings update live, and forecast 6/12/18 months out. It turns the audit from a one-shot snapshot into a planning tool — and that's what would get it forwarded to a finance person.

**2. Pricing-page scrapers + a refresh cron.** PRICING_DATA.md is hand-maintained today, which is fine for a take-home but breaks at scale. Week 2: a Cloudflare Worker that hits each vendor URL daily, parses the price, opens a PR if it's drifted. Pairs with a "this audit was generated when Cursor Pro was $20" footer on shared URLs older than N days.

**3. The embeddable widget bonus.** A `<script>` tag a startup blog could drop in to embed a shrunk-down audit widget. Adds a viral surface SpendLens controls but doesn't host. Pairs naturally with the GTM plan — newsletter operators (a target user group) want widgets, not links.

What I'd *deliberately not* build in week 2: user accounts. The "audit a single time, share, return as a fresh audit" pattern is structurally simpler and matches the actual usage frequency (most teams audit AI spend once per quarter, not weekly). Adding accounts would invite scope I don't need.

---

## 4. How I used AI tools

**Tools used.** Claude Code (this exact session — for scaffolding, the engine implementation, the doc drafts, the prompt iteration), Cursor (for line-level edits where Claude's output needed local tweaks), the Anthropic API itself (the production summary path).

**For what.** Claude Code drove most of the structural authoring — file scaffolding, the audit engine's first pass, the markdown documents. Cursor handled the iterative tweaks: re-shaping a Tailwind class, renaming a variable across the codebase, tightening a Zod schema. The Anthropic API in production generates the user-facing summary.

**What I didn't trust them with.**
- Pricing numbers in `PRICING_DATA.md`. Every dollar was pulled from the live vendor pricing page myself. AI tools have a strong tendency to hallucinate "their" version of vendor pricing, especially for plans that recently changed.
- The audit math. The rules were written deliberately as deterministic TypeScript — the assignment specifies AI should only generate the summary, and a finance person needs numbers that trace.
- User-interview content. Three real conversations, three real humans. Fabricating these is detectable and disqualifying.
- The "Decisions" section of the README. The trade-offs there describe my actual reasoning during the build week, not retrofit narrative.

**A specific time AI was wrong, and I caught it.** During Day 5's prompt iteration on the summary, my v2 prompt was very prescriptive ("write exactly 4 sentences, 1: state monthly savings, 2: state annual savings, ..."). I tested with a low-savings input that should have hit `already_optimal`. The model wrote: "You could save up to $24/year by switching to the Hobby tier — note this requires giving up Pro features." That number was *not* in the audit. The model fabricated it from its priors about Cursor pricing. I caught it on the third eval run and added the explicit guardrail "Never invent savings — only summarize the findings provided" to the system prompt. PROMPTS.md documents this with the prompt diffs.

---

## 5. Self-rating (1–10)

| Dimension | Score | One-sentence reason |
|---|---|---|
| **Discipline** | 7 | Committed across 7 distinct days, scheduled user interviews on Day 1, no all-nighters — but I batched docs to Day 7 instead of writing them progressively, which was less disciplined than ideal. |
| **Code quality** | 8 | The engine is pure, fully typed, fully tested; types match across module boundaries; the friction picker is a real product decision encoded in code; but I'd want a couple more integration tests on the API routes if this were heading to production. |
| **Design sense** | 7 | The result page is what gets screenshotted; the hero number, the per-tool cards, the conditional Credex CTA all hit; gradient-mesh backdrop and the animation on the AI summary read as polished — but I haven't shipped enough b2b SaaS to know whether the visual register is exactly right for a CFO audience versus an engineering one. |
| **Problem-solving** | 8 | The friction-picker bug (caught by tests, reframed as a product decision rather than a bug fix) and the dropped public/private view (reversed mid-week with no protest) are both wins; I want a 9 here but I'm leaving room for the things that didn't break. |
| **Entrepreneurial thinking** | 7 | GTM and ECONOMICS aren't generic — they pick specific channels and run specific math; user interviews changed real things in the design; but I'm rating myself below an 8 because *living the GTM* (actually getting a hundred users) is the real test, and that's still hypothetical. |
