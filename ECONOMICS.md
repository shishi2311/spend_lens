# ECONOMICS.md

If Credex deployed SpendLens tomorrow, here's the unit economics. Numbers are estimates with reasoning shown — approximate is better than absent.

## What's a converted lead worth to Credex?

**Credex sells discounted AI infrastructure credits.** A "converted lead" = an audit user who actually purchases credits.

Assume the average converting customer:
- Has a stack like the audits we generate: ~$2,000/mo total AI spend (roughly the median for a 10–20 person team using 3+ tools)
- Buys ~$1,500/mo of that through Credex at a 15% discount vs. retail (the rest stays direct because not all vendors are sourceable)
- Stays on Credex for **18 months average** (turnover is real — startups change tools, get acquired, run out of money)

Credex's likely take rate on credits: ~30% margin on the spread between wholesale and customer price (this is industry-standard for credit/secondary marketplaces). On $1,500/mo spend with a 15% retail discount and a 30% Credex margin, Credex earns roughly:

`$1,500 × 0.15 × (0.30 / (1 - 0.30)) ≈ $96/mo` in net contribution.

Over 18 months: **~$1,730 LTV per converted lead.**

This is back-of-envelope — real numbers depend on Credex's actual wholesale economics, which I don't have. The order of magnitude (low four figures) is what matters for sizing the channel.

## CAC at each channel from the GTM plan

For each channel, I estimate the cost to acquire one *audit user*, and separately the conversion rate from *audit user* → *paying Credex customer*.

| Channel | Cost per audit user | Audit→Pay conversion | Effective CAC per paying customer |
|---|---|---|---|
| Show HN front page (1 spot/30 days) | ~$0 cash, ~6h work | 0.5% | ~$10 (cost = my time amortized) |
| Reddit substantive comments | ~$0 cash, ~10h work | 1.0% | ~$25 |
| Twitter/X threads from authority lists | ~$0 cash, ~4h/post | 1.5% | ~$30 (high signal, lower volume) |
| Cold DMs to engineering managers | ~$0 cash, ~30 min/lead | 4.0% | ~$15 (much lower volume) |
| Credex sales conversations (existing) | ~$0 cash, embedded | 12.0% | $0 (it's an existing sales tool, not new acquisition) |
| Guest blog post on complementary tool | ~$0 cash, ~12h work | 1.0% | ~$30 |

The Credex-existing-channel is structurally the cheapest. The cold-DM path produces high-quality leads that convert at 4× the public funnels, but doesn't scale.

**Realistic blended CAC:** **~$20** per paying customer in the first 100 days, mostly because the early channels are zero-marginal-cost and Credex's existing-pipeline conversion is essentially free.

## Conversion math that makes this profitable

Let's call the funnel:
- **A = audit completed**
- **B = email captured** (lead, no payment commitment)
- **C = Credex consultation booked** (high-intent, sales conversation initiated)
- **D = credit purchase** (paying customer)

We need to find the rates that make CAC < LTV by a healthy margin (LTV/CAC ≥ 3 is the SaaS rule of thumb; Credex with a fast-growing inventory might tolerate higher).

Using the LTV figure of ~$1,730 and a target LTV/CAC ≥ 3, max CAC is ~$580.

What conversion rates from the funnel make the unit economics work?

**Conservative scenario (signal: skeptical-finance-person reading audits):**
- A → B: 25% (quarter of audit takers leave their email)
- B → C: 15% (only the high-savings cohort books)
- C → D: 30% (consultation closes 30% of bookings)
- A → D = 0.25 × 0.15 × 0.30 = **1.1%**

If 100 audits are generated for ~$0 marginal cost (organic), that's 1.1 customers. At $1,730 LTV: **~$1,900 in expected LTV per 100 audits.**

**Aggressive scenario:**
- A → B: 40% (the result page is good enough)
- B → C: 25% (Credex's CTA performs)
- C → D: 40%
- A → D = 0.04 = **4%**

100 audits → 4 customers → ~$6,900 LTV.

**Reality lands between these.** Even at 1.1% conversion, the channel is profitable at any CAC under $1,000 — and our CAC will be far below that on the first 100 days.

## What would have to be true for $1M ARR in 18 months

$1M ARR = $1M / $1,730 LTV = **~580 paying customers** over 18 months at the average cohort.

Working backward:
- Need ~580 customers / 18 months = **~32 net-new customers per month**.
- At 1.1% A → D: **2,900 audits/month** (~95/day).
- At 4% A → D: **800 audits/month** (~26/day).

**Realistic target: ~50 audits/day sustained.** That's roughly the throughput of a single non-trivial X thread per week + an active Reddit presence + Credex's own funnel.

What has to be true:
1. **Audit logic is genuinely useful, not just a curiosity.** If the average audit surfaces <$100/mo savings, conversion to Credex is doomed — the friction of switching procurement isn't worth $30. Today's engine is calibrated to find real savings; we need to confirm that empirically with the first 200 audits.
2. **The result page survives the screenshot test.** OG image, hero number, and the per-tool table need to look credible enough that someone sharing the audit on X gets a click-through. Without virality, we're paying full CAC on every customer.
3. **Vendor pricing stays in the $20–$60/seat band.** If AI tools commoditize down to $5/seat, the absolute savings shrink and so do Credex's margins. Counterintuitively, we *need* prices to stay high for the model to work.
4. **Credex's wholesale supply doesn't run dry.** SpendLens drives demand; Credex needs supply to fulfill it. The thesis assumes overforecast/pivot supply continues at current rates. A market correction that cuts AI startup pivots in half would compress Credex's discount.
5. **Each channel's conversion holds up at scale.** The 4% A → D number is plausible for the first 100 cold DMs because they're personalized. At 32/month sustained, we need the public channels (HN, Reddit, X) to hold ~1% A → D — that's tighter, but achievable with a result page that's actually viral.

If any of (1) (3) or (4) is false, the model breaks. (2) and (5) are ops problems and are recoverable.
