# PROMPTS.md

The full LLM prompts used in SpendLens. Why they're written this way. What didn't work.

---

## Where AI is used (and where it isn't)

AI is used for **exactly one feature**: the ~100-word personalized summary on the audit result page. Everything else — pricing comparisons, rule application, savings math, citations — is deterministic TypeScript. The assignment is explicit that knowing when *not* to use AI is part of the test, and a finance person reading the per-tool reason needs numbers that trace to vendor URLs, not LLM judgment.

## The summary prompt

Source: [`src/lib/anthropic/summary.ts`](src/lib/anthropic/summary.ts)

### Model
`claude-haiku-4-5` — cheap, fast (sub-second), and easily good enough for ~100 words of grounded prose. Sonnet was overkill for the task; Opus would be wasteful.

### System prompt (with `cache_control: ephemeral`)

```
You are an analyst writing a 100-word audit summary for a startup founder reviewing their AI tool spend.

Voice: direct, useful, no hype. Lead with the headline number. Then the single biggest opportunity, with the dollar value. End with one concrete next step. Never invent savings — only summarize the findings provided.

Constraints:
- 100 words ± 10
- Plain text, no markdown, no emoji
- Address the reader as "you"
- If totalMonthlySavings is under $100, say so honestly and reframe as a "you're spending well" message
- Do not list every tool — pick the 1–2 highest-impact findings
```

### User prompt template

```
Audit findings:
- Total monthly savings: ${monthly}
- Total annual savings: ${annual}
- CTA tier: ${ctaTier}

Top opportunities:
${topThreeFindings}

Write the 100-word summary now.
```

`topThreeFindings` is the highest-savings, non-`already_optimal` findings, formatted as `- {Tool}: ${current} → ${recommended} (saves ${savings}/mo). {reason}`.

### Why these specific instructions

- **"Lead with the headline number" + "no hype"** — early iterations produced "Wow! You could save..." style copy. That tonally clashes with a finance audience and also reads as untrustworthy. Direct + boring is the right register.
- **"100 words ± 10"** — too long and people scroll past it. Too short and the LLM tends to skip the "next step" sentence. 100 ± 10 hits the sweet spot in eval.
- **"Never invent savings — only summarize the findings provided"** — the strongest hallucination control. Without this, the model sometimes added "you could also save by..." with numbers that weren't in the audit.
- **"Plain text, no markdown, no emoji"** — the result page renders the summary inside a styled card; markdown would render literally as asterisks. Emoji break the tone.
- **"Address the reader as 'you'"** — pushes against the model's default "the user" voice that shows up on terse system prompts.
- **"If totalMonthlySavings is under $100, say so honestly"** — paired with the engine's `optimal` ctaTier, this is what prevents the manufactured-savings failure mode the assignment calls out.
- **`cache_control: ephemeral` on the system prompt** — the system prompt is identical for every call. Marking it cacheable means subsequent calls within the cache window skip re-tokenizing it, halving cost on the system-prompt portion.

## What didn't work — iteration log

These are real failures from prompt-tuning, not retrofit theatre. Each one corresponds to a specific prompt version I tried and abandoned.

### v1 — too generic, too cheery
```
You are a helpful assistant. Summarize this audit for the user.
```
Output: emoji-laden, used "the user" instead of "you", buried the savings number, sometimes added recommendations not in the input. Killed.

### v2 — too prescriptive
```
Write exactly 4 sentences:
1. State the monthly savings.
2. State the annual savings.
3. State the biggest finding.
4. Tell them to act on it.
```
Output: stilted, redundant ("$X/mo · $X * 12 per year · the biggest is..."), and the model refused to compress when there was nothing to say. Killed.

### v3 — final
The current prompt — voice + constraints + a "never invent" guardrail + an explicit branch for the low-savings case. Outputs in eval are tight and on-brand.

### A specific time the AI was wrong
While testing v2 with the input `[{ tool: 'cursor', plan: 'pro', monthlySpend: 20, seats: 1 }]` (no findings — should hit `already_optimal`), the model wrote: "You could save up to $24/year by switching to the Hobby tier — note this requires giving up Pro features." That number was never in the audit; the model fabricated it from priors about Cursor pricing. The `"Never invent savings — only summarize the findings provided"` constraint in the system prompt eliminates this class of failure in v3.

## Failure handling — the templated fallback

Source: [`src/lib/anthropic/summary.ts`](src/lib/anthropic/summary.ts), function `templatedSummary`.

If the Anthropic call fails (timeout > 4s, 429, 5xx, missing API key, network error), `generateSummary` returns a hand-written templated paragraph derived from the same `AuditResult`. It branches on `totalMonthlySavings < 100` for the "you're spending well" case and on the presence of a top finding otherwise. Templated summaries are **persisted** to the same `audits.summary` column — a transient outage doesn't permanently degrade the report; an admin can null + regenerate later.

The fallback's voice was tuned to closely match the AI prompt's output, so a user can't tell the difference. That's deliberate: we don't want a worse experience to get correlated with a sketchy provider day.

## What I'd add next week

- **A/B the prompt against a "more direct, less explanatory" variant** — eval on conversion rate (audit → email captured).
- **Few-shot examples in the system prompt for unusual cases** (no findings, single finding with mid-tier savings) — should reduce the templated fallback's role even further.
- **Streaming the summary** — under the current synchronous path, the user waits ~1s for the summary to appear. Streaming would feel instant.
