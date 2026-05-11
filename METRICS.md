# METRICS.md

## North Star metric

**Weekly Credex consultations booked from a high-savings audit.**

Why this one and not something simpler:

- DAU is wrong. SpendLens is a tool people use **once a quarter**, not daily. A DAU goal would push the team to add features that turn the audit into a dashboard, which is exactly the wrong product for the user we're building for.
- "Audits completed" is wrong. It's a vanity number — easily inflated by traffic spikes from a single Twitter thread, and the floor is meaningless if conversion downstream is broken.
- "Email captures" is closer but still wrong. Email-only leads convert at a low rate; counting them as a success metric would push toward dark patterns (gating value behind email).
- **Consultations booked from high-savings audits** is the right metric because (a) it requires the audit logic to actually find real overspend, (b) it requires the result-page UX to convert that finding into a CTA click, and (c) it is **load-bearing for revenue** — it's the step Credex's existing sales pipeline takes over from.

The "from a high-savings audit" qualifier matters: it forces the audit logic to stay honest. Manufacturing fake savings to inflate this metric would *not* help — those leads would fail the consultation call when Credex sales asks for the audit details.

## 3 input metrics that drive the North Star

### 1. Audit completion rate (form-submit → audit-result-rendered)

Why: every step before this is upstream of the entire funnel. If 50% of form starters drop off, no improvement to the result page or CTA matters. Bench: should be ≥85% — the form is short, the audit is fast, no real reason to abandon mid-flow except UX bugs (network error during submit, validation noise) or rage-quit on price input.

### 2. High-savings rate (% of audits with `ctaTier === "high"`)

Why: this is a measure of how *real* the audit logic is for the user base we're reaching. If it's <10%, either (a) the audit rules are too conservative, or (b) the GTM is reaching the wrong audience (people who don't actually have AI overspend). Bench: 15–25% is healthy. Above 40% suggests the rules are too aggressive — sounds great until a finance person reviews the report and the recommendations don't hold up.

### 3. Audit → Credex CTA click-through rate (high-savings cohort only)

Why: closes the loop on the result page's most consequential element. If high-savings audits exist but no one clicks the CTA, the result page is failing the most important conversion in the funnel. Bench: ≥20% click-through on the high-savings cohort is the goal. Below 10% means we need to A/B the CTA placement, copy, or visual prominence.

## What I'd instrument first

Day one of production, instrument these events in this order — each one is the *minimum* to debug the funnel:

1. **`audit_submitted`** with `{ audit_id, tool_count, total_spend, ip_hash }` — gives the denominator for everything downstream.
2. **`audit_rendered`** on the `/r/[id]` page first paint — gives the form-submit → result rate.
3. **`summary_generated`** with `{ audit_id, source: "anthropic" | "templated", duration_ms }` — observability for the AI fallback path.
4. **`cta_clicked`** with `{ audit_id, cta_tier, target: "credex" | "email" | "pdf" | "share" }` — closes the conversion loop.
5. **`lead_captured`** with `{ audit_id, has_company, has_role }` — the email gate's success rate.

Tooling: PostHog free tier covers this scope at the volume we expect for the first few months. Switch to Amplitude or Mixpanel only if PostHog's data model becomes limiting.

What I'd *deliberately not* instrument first: anything user-identifying (the goal is to get to product-market fit signal as fast as possible without inviting privacy debt). All events are keyed by `audit_id` (random) and `ip_hash` (hashed). Email is captured separately and never joined to event streams without explicit user consent.

## What number triggers a pivot decision

**Pivot trigger: less than 5 high-savings audits per 100 audits, sustained over 2 consecutive weeks.**

Why this specific number: the economics in [ECONOMICS.md](ECONOMICS.md) assume ~15% of audits are high-savings. At 5%, the audit isn't surfacing real overspend at the rate the business model needs — either:
- (a) the audit rules are too conservative and need to be tuned more aggressively (fixable),
- (b) the user base we're reaching has already optimized their AI spend (then we're fishing in a depleted pond — shift GTM to less-sophisticated user segments),
- (c) the assumption that startups are systematically overpaying for AI tools is just wrong (then this product is a bad fit for the market and we either pivot to a different audit space — security, DevOps tooling — or shut it down).

What I'd *not* do: lower the high-savings threshold (currently $500/mo) to inflate the high-savings count. That's the kind of metric-gaming that solves nothing and breaks downstream sales conversations.

## Other metrics worth tracking (lower priority)

- **Audit share rate** — how many audits get their `/r/[id]` URL visited by someone other than the original submitter, in the first 7 days. Signal for organic virality.
- **Per-tool finding distribution** — which tools generate the most `use_credits` recommendations, which generate the most `switch_tool`. Tells us where to deepen the rule logic.
- **Time to first byte on `/r/[id]`** — Lighthouse-adjacent. SSR + dynamic OG image must stay fast or sharing breaks.
- **Anthropic call success rate** — `summary_generated` source split. Templated rate ≥10% means the AI integration needs hardening.

These are tier-2 metrics. Don't add them until the North Star + 3 inputs are working.
