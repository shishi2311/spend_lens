# GTM.md

## Target user (specific, not "startups")

The exact user: **a technical co-founder or first-engineering-hire at a 5–25 person seed-or-Series-A startup, who personally signed up for at least three of {Cursor, Copilot, Claude, ChatGPT, OpenAI API} on the company card in the last 12 months, and who is one CFO email away from being told to cut SaaS by 20%**. They review tools because no one else will.

A close second: **engineering managers at Series A/B startups (25–60 people) who got a "what is all this AI spend?" Slack from finance this week** and now have to put a number on what they're getting for it.

What they have in common: they bought the AI tool, they're the one who can rationalize the bill, and they have *no benchmark* — no one's told them whether their spend is normal for their stage. Spotting that gap is what makes SpendLens a real product, not just a calculator.

## What they Google or scroll past right before they'd want this

- "is github copilot business worth it"
- "cursor pro vs business" — high-intent, plan-comparison searches
- "ai tool budget for 10 person startup"
- "claude team vs pro" — vendor-comparison threads on Reddit (r/cursor, r/ChatGPT, r/LocalLLaMA, r/EngineeringManagers)
- Twitter/X threads from CFO-shaped accounts (Adam Nash, David Heinemeier Hansson) about SaaS sprawl
- Indie hackers' Slack `#opex` channels
- Hacker News stories about "we dropped $X by switching from Y to Z"

These all surface 1–2 tools at a time, but never the *whole picture* of someone's AI stack. SpendLens is the only thing that audits the stack as a portfolio.

## Where they hang out online

Specific surfaces I'd pursue, in priority order:

1. **r/CursorAI and r/Cursor** — high-intent, deeply price-sensitive. AMA-style "how much do you spend on AI tools" thread with a link to the audit at the end converts well, and the community has tolerance for self-promo when it's a free tool.
2. **The Indie Hackers `#tooling` Slack** — tightly clustered audience of solo founders + small teams, exactly the SpendLens user. A weekly thread there would reach a few hundred without paid promotion.
3. **YC Slack — `#ai-tools` and `#startup-ops` channels** — high-leverage if a single batch member shares the audit. Risk: gating means I can't hit it directly without insider help.
4. **CXO Talks and CFO Connect Slack** — the *finance* angle. Most AI-spend tools market to engineers; targeting the CFO/Controller audience with "your engineering org just spent $50k on AI tools, here's the audit" is the unfair angle.
5. **X (Twitter) lists** — "CFOs of SaaS startups" list maintained by Sacra, "indie founders" list maintained by Pieter Levels, "DevTool founders" list maintained by Nikita Bier. A thread tagged at the right list members lands.
6. **Hacker News** — Show HN with a free, working demo and a *non-defensive* "this is what I learned auditing my own AI bill" post (not a feature dump). Best window: Tuesday morning Pacific.

## How I'd get the first 100 users in 30 days, $0 paid

- **Days 1–3:** I personally audit my own startup's stack and 3 friends' stacks; tweet the results (with their permission) as before/after dollar numbers. **Goal: 5 users, but the visual artifact is the seed.**
- **Days 4–7:** Show HN post timed for Tuesday 9am PT. Title pattern: "SpendLens — a free audit of your startup's AI tool spend (we found $X/mo overpriced in our own)." Body: the engineering writeup (audit logic, why hardcoded rules, the friction picker), not a feature dump. **Goal: 30 users from the front-page bump.**
- **Days 8–14:** Three deeply researched comments on r/Cursor / r/EngineeringManagers / r/SaaS plan-comparison threads — each one a real, in-depth answer that *includes* "and you can audit your full stack here." Not link-spam; substantive comments where the link belongs. **Goal: 20 users.**
- **Days 15–21:** A guest blog post on a complementary tool's blog — Cursor's, Anthropic's developer blog, or a finance-engineering hybrid like Pry/Rho. Pitch: "the case for treating AI tools like SaaS — what we learned auditing 100 stacks." **Goal: 25 users.**
- **Days 22–30:** DM 50 Series A engineering managers individually with a personalized "I noticed you posted about AI spend on X — here's a free 90-second audit." 50 → 20 replies → 10 audits is realistic. **Goal: 10 users + 10 high-quality conversations to refine the product.**

That sums to **~90 users**. The 10 missing are slack — interview fall-out, screenshots that go viral once unprompted. **Stretch: 100.**

## The unfair distribution channel

Credex itself is the unfair channel. Every Credex sales conversation can end with "and we'll send you the audit" — meaning every existing Credex prospect, supplier, and partner is a captive distribution surface SpendLens can ride. No competitor can do this. That's also why building this *as Credex* (not as a separate brand) is the right call: the audit is the wedge, the credit purchase is the business, and the audit's findings *are* a Credex sales pitch.

## Week 1 traction if it works

**Week 1 success looks like:**
- 200 audit submissions (vs. 10–20 in a typical Show HN dud)
- 30 emails captured (15% of submissions)
- 5 audits with `ctaTier === "high"` (>$500/mo savings) — these are direct Credex sales leads
- 1 unsolicited screenshot reshared on X with a sub-3-figure-followers original poster (organic virality signal)
- 2 substantive product issues filed by users (signal that they used it, not just visited)

**Triggers a pivot:** if 200+ submissions yields fewer than 3 high-tier audits — meaning the audit logic isn't surfacing real overspend at the rate the assignment thesis assumes — that's a sign the rules need to be tuned more aggressively, or the target user isn't the one I picked.
