# LANDING_COPY.md

The actual copy a marketer would ship. Some of this is already in the deployed UI; some is a future iteration of it. Where they differ, the deployed version is the *current* answer; this file is the *intended* answer.

## Hero headline (≤10 words)

**A second opinion on your AI bill.**

Alternates considered (rejected, with reasoning):
- "Audit your startup's AI tool spend." → too literal, no emotional hook.
- "Stop overpaying for Cursor, Claude, and Copilot." → too negative; positions us as anti-vendor when we're actually pro-procurement.
- "Mint, but for AI tools." → assignment phrases it this way; readable but uses a competitor's name in our own headline, not great.

## Subheadline (≤25 words)

**Free 30-second audit. We compare your stack against current vendor pricing and surface overspend, cheaper alternatives, and credit-market angles.**

Alternates:
- "No login. No credit card. We don't ask for your email until you've seen the report."
- "Built by Credex — discounted AI infrastructure credits."

## Primary CTA copy

**Get my audit** *(unchanged in deployed UI — it's the verb the user wants and avoids "submit" / "start" generics).*

Secondary CTA (post-audit, on result page): **Email me this report**

## Social proof block (mocked — clearly indicate this in the page)

> Mocked for design. Replace with real numbers once we have them.

```
Audited stacks from teams at:
[Acme]  [Initech]  [Hooli]  [Globex]  [Stark]
                                                
"$2,400/mo of AI overspend we hadn't noticed."
— eng manager, Series A SaaS (mocked)

"The audit was the only piece of finance work this quarter
my CFO didn't ask three follow-up questions about."
— founding engineer, seed-stage (mocked)
```

What scores well in social proof for SpendLens specifically:
- **Specific dollar numbers**, not generic "we love it" testimonials.
- **Job title + stage** — "Series A founding engineer" is more credible than "Bob, CEO."
- **One contradiction** — a quote that admits the audit didn't find much (e.g., "We were already spending well, but at least now I have something to show finance"). This signals honesty over manufactured hype.

## FAQ — 5 real Q&As

### 1. Is the audit really free? What's the catch?

Yes, free. No login, no credit card, no email until you see the report. The catch — if you want to call it that — is that SpendLens is built by Credex, and Credex sells discounted AI infrastructure credits. If your audit shows >$500/mo in overspend, you'll see a "talk to Credex" CTA. If it doesn't, you won't. We don't manufacture savings to push that CTA — read the audit logic in `src/engine/` if you don't trust us.

### 2. Where do the prices come from? Can I trust them?

Every dollar in the audit traces to an official vendor pricing page. Sources are documented in [`PRICING_DATA.md`](PRICING_DATA.md) on the GitHub repo, with the date each number was verified. If a vendor changed their pricing this week, the audit might be slightly stale — file an issue and we'll update.

### 3. How is the audit logic actually decided? Is it AI?

The audit math is a deterministic rule engine, not AI. Same input always produces the same output. The four rules — right-plan, cheaper-same-vendor, alternative-tool, retail-vs-credits — pick the highest-savings recommendation per tool, with a friction tiebreaker so we don't tell you to migrate IDEs over a $20/seat saving when a same-vendor downgrade would do. The only place AI is used is the ~100-word personalized summary at the top of the report.

### 4. What happens to my data?

Your audit input (tools + plans + spend) is stored in our database keyed to a random ID. Your email and company name (if you provide them) are stored in a separate table that's only accessible server-side — they never appear on the public share URL. The IP is hashed (sha256, prefix only) for abuse detection; we don't store raw IPs. We don't sell or share your data with anyone except Credex sales (and only if you opted into that for a high-savings audit).

### 5. Can I share my audit?

Yes — every audit gets a unique public URL like `/r/abcd1234`. Identifying details (your email, company name) are stripped from the public version. The shareable URL has Open Graph tags so it previews cleanly on X/Twitter and Slack. We *want* you to share it; that's how the tool reaches the next person who needs it.

## Tone guidelines

For all SpendLens copy, in any surface:
- **Direct, no hype.** "You could save $X/mo" beats "Unlock massive savings!"
- **Numbers in the headline whenever possible.** Specific dollar figures earn trust.
- **Address the reader as "you."** Not "the user," not "founders." You.
- **Admit the limits.** "The audit might not find much for you" reads more credible than "We guarantee savings."
- **No emoji in marketing copy.** (Emoji are fine in casual community surfaces — Discord, Slack — just not on the landing page or emails.)
