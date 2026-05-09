# PRICING_DATA.md

Every dollar in `src/engine/pricing.ts` traces to an official vendor pricing page. This file is the human-readable source of truth; `pricing.ts` is the machine-readable mirror.

> **Verification policy.** Pricing was pulled in the week of submission. Re-verify before re-deploying — vendor pages change. The `verified` date below is the date each row was last cross-checked against the vendor URL.

> **Note on AI tool pricing volatility.** Multiple vendors changed pricing during the week (Cursor, Claude, OpenAI all run quarterly experiments). The numbers below are what was on the page at the time of the pull. If a number here disagrees with a vendor page, the vendor page wins — file an issue and we'll reconcile.

---

## Cursor
Source: <https://cursor.com/pricing> · verified 2026-05-07

- **Hobby (Free):** $0 · 50 slow requests/day, basic completions
- **Pro:** $20/user/month · 500 fast premium requests/month, full agent + tab + chat
- **Business:** $40/user/month · adds SSO, admin dashboard, centralized billing, audit logs
- **Enterprise:** Custom (typically $60+/user/month at our spot-check) · adds SOC 2 Type II docs, custom contracts, dedicated support

## GitHub Copilot
Source: <https://github.com/features/copilot/plans> · verified 2026-05-07

- **Individual:** $10/user/month
- **Business:** $19/user/month · adds policy controls, IP indemnity, audit logs
- **Enterprise:** $39/user/month · adds Copilot Chat in repo, fine-tuned models, SSO

## Claude (Anthropic)
Source: <https://www.anthropic.com/pricing> · verified 2026-05-07

- **Free:** $0 · limited daily messages on default model
- **Pro:** $20/user/month · 5x more usage than Free, Projects, larger context window
- **Max:** $100/user/month (5x Pro tier) · Higher tier at $200/month (20x Pro) also exists
- **Team:** $25/user/month · **5-seat minimum (vendor-enforced)** · adds shared projects + central billing
- **Enterprise:** Custom · adds SSO/SCIM, audit logs, larger context windows
- **API direct:** Usage-based · users self-report monthly spend

## ChatGPT (OpenAI)
Source: <https://openai.com/chatgpt/pricing/> · verified 2026-05-07
API source: <https://openai.com/api/pricing/> · verified 2026-05-07

- **Plus:** $20/user/month
- **Team:** $25/user/month annual ($30/month if billed monthly) · **2-seat minimum**
- **Enterprise:** Custom · typical street price ~$60+/seat at scale, more below scale
- **API direct:** Usage-based

## Anthropic API direct
Source: <https://www.anthropic.com/pricing#api> · verified 2026-05-07
- Usage-based · users self-report monthly spend

## OpenAI API direct
Source: <https://openai.com/api/pricing/> · verified 2026-05-07
- Usage-based · users self-report monthly spend

## Gemini
Source: <https://gemini.google/subscriptions/> · verified 2026-05-07
API source: <https://ai.google.dev/pricing> · verified 2026-05-07

- **Gemini Pro (AI Pro):** $20/user/month · 2 TB Workspace storage + Gemini Advanced
- **Gemini Ultra (AI Ultra):** $249/user/month · highest limits, Veo, Whisk
- **API direct:** Usage-based

## Windsurf
Source: <https://windsurf.com/pricing> · verified 2026-05-07

- **Pro:** $15/user/month
- **Teams:** $35/user/month · adds team admin + shared credits
- **Enterprise:** Custom

---

## Credex credit discount assumption

**Discount used in engine:** `CREDEX_DISCOUNT = 0.15` (15% off retail).

**Why this number.** Credex sources discounted credits from companies that overforecast or pivoted. Real-world AI infra credit marketplaces show discounts in the 10–30% range depending on tool and current supply. 15% is conservative — it under-promises rather than over-promises in the audit. Once Credex publishes a per-tool discount feed, the engine should consume that instead of a constant.

**Source:** internal Credex framing (the assignment PDF) plus public secondary-market reseller data. This number is documented as an assumption, not a claim.

**Files touching this number:**
- `src/engine/pricing.ts` — `CREDEX_DISCOUNT` constant
- `src/engine/rules/use-credits.ts` — uses the constant in the recommendation math
- The user-facing reason string on `use_credits` findings says "typical savings ~15%" so the audit doesn't pretend to a precision the engine doesn't have

## Re-verification checklist

Before each deploy:
- [ ] Open every URL above; confirm price + plan name match.
- [ ] If a number changed: update the constant in `src/engine/pricing.ts` AND the row above. Bump the `verified` date.
- [ ] Re-run `pnpm test` — engine tests will not catch pricing drift, but they will catch any rule that breaks because a plan slug was renamed.
- [ ] Spot-check the audit on the deployed URL with a known-good input.
