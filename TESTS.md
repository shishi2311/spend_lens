# TESTS.md

Every automated test in the repo. All run in `vitest` via `pnpm test`.

## How to run

```bash
pnpm test          # one-shot
pnpm test:watch    # watch mode while iterating on the engine
```

CI runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every push to `main` and every PR. The build is included as a smoke test for the full Next.js compile path (catches type errors that escape `tsc --noEmit`, e.g., metadata files).

## Audit engine tests

**File:** [`tests/engine/audit.test.ts`](tests/engine/audit.test.ts) — 14 tests, all passing as of submission.

| # | Suite | Test | What it covers |
|---|---|---|---|
| 1 | downgrade-plan | recommends Cursor Pro when a small team is on Cursor Business | Same-vendor cheaper-plan rule fires for Cursor Business at ≤4 seats. Asserts both the recommendation kind and the exact recommended spend. |
| 2 | downgrade-plan | recommends Copilot Individual when a small team is on Copilot Business | Same rule for Copilot — guards the "small-team Business is overkill" reasoning. |
| 3 | downgrade-plan | does NOT downgrade Cursor Business when seats ≥ 5 | Boundary check — Business is right-sized at scale, so the rule must not fire. |
| 4 | alternative-tool | suggests Windsurf for Cursor Business when use case is coding | Switch-tool rule fires when (a) use case matches and (b) savings ≥ 25% AND ≥ $10/mo. Confirms the friction picker correctly chooses the higher-savings switch when downgrade isn't available. |
| 5 | alternative-tool | does NOT suggest a tool switch for non-matching use cases | Use-case gating — switching IDEs makes no sense for "writing", so the rule must skip and use_credits must take over. |
| 6 | use-credits | recommends Credex credits for retail Anthropic API spend | use-credits rule for an API-direct path (no per-seat plan). Asserts ~15% savings on $500/mo spend. |
| 7 | use-credits | does NOT fire use-credits for tools Credex doesn't source | Negative test — Gemini isn't in `CREDEX_SOURCED`, so audit should fall through to `already_optimal`. |
| 8 | use-credits | does NOT fire use-credits when savings would be under $5/mo | Floor-test — 15% of $20 = $3, below the $5 floor; rule returns null and `already_optimal` wins. |
| 9 | totals + ctaTier | sums monthly + annual savings across multiple tools | End-to-end multi-tool input → correct totals + ×12 annualization. Also exercises the friction picker (downgrade vs switch) on Cursor. |
| 10 | totals + ctaTier | classifies ctaTier='high' when monthly savings exceed $500 | Confirms the high-tier threshold; this drives the prominent Credex CTA on the result page. |
| 11 | totals + ctaTier | classifies ctaTier='low' for moderate savings ($100–$500) | Confirms downgrade rule fires correctly at the lower spend tier. |
| 12 | totals + ctaTier | classifies ctaTier='optimal' when nothing fires and totals are tiny | Honesty branch — Free plan with zero spend produces zero savings and `optimal` tier. |
| 13 | hygiene | returns one finding per tool entry, in input order | Output cardinality + ordering — the result page renders findings in the order the user inputted them. |
| 14 | hygiene | never reports negative savings | Math invariant — saving "negative $20" would be a bug; the engine clamps at zero. |

## What's *not* tested (and why)

- **API routes** — direct integration tests would need a real Supabase instance; in this repo we exercise them via the build's typecheck pass + manual smoke tests on the deployed URL. A future iteration would add tests using `@supabase/supabase-local` or a mocked Postgres.
- **UI components** — Testing Library is installed but the form/results/lead components are predominantly composition over Radix primitives. The engine is where the bugs live, so that's where tests live. (See REFLECTION for more on this trade-off.)
- **PDF rendering** — `@react-pdf/renderer` is a black box. We snapshot-test only by visual smoke on a deployed audit URL.
- **OG image rendering** — same reasoning as PDF.

## Adding tests

For new audit engine rules:
1. Add the test to a new `describe` block in [`tests/engine/audit.test.ts`](tests/engine/audit.test.ts).
2. Use the `makeInput()` helper to keep the rest of the input shape default.
3. Assert both the recommendation kind and the exact savings number — magic numbers in tests are good when they trace to vendor pricing.
