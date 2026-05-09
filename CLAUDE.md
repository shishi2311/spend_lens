# CLAUDE.md

Guardrails for working on **SpendLens** — a 7-day take-home for the Credex Web Dev Intern role. Submission deadline: 7 days from project start. Every choice in this file traces back to the assignment rubric (`Credex WebDev 2026 Assignment.pdf`).

**Design spec:** [docs/superpowers/specs/2026-05-07-spendlens-design.md](docs/superpowers/specs/2026-05-07-spendlens-design.md) — read this before any architecture decision.

---

## Non-negotiable assignment rules (auto-reject if violated)

1. **Required files at repo root, exact names** — missing any one = automatic rejection:
   - `README.md`, `ARCHITECTURE.md`, `DEVLOG.md`, `REFLECTION.md`, `TESTS.md`, `PRICING_DATA.md`, `PROMPTS.md`, `GTM.md`, `ECONOMICS.md`, `USER_INTERVIEWS.md`, `LANDING_COPY.md`, `METRICS.md`
   - `.github/workflows/ci.yml`
2. **Git history:** commits across **≥5 distinct calendar days** within the 7-day window. Verify with `git log --pretty=format:"%ad" --date=short | sort -u | wc -l`.
3. **Conventional Commits** — `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`. Messages must be specific. Banned: "update", "wip", "asdf", "fix stuff".
4. **DEVLOG.md** — one entry per day for **all 7 days**, exact format below. Backdating is detectable from git history. If a day was 0 hours, write that honestly.
5. **5+ working tests on the audit engine.** They will be run.
6. **CI must be green** on the latest commit on `main`.
7. **Live deployed URL** must be reachable. Localhost screenshots are rejected.
8. **Lighthouse mobile** on the deployed URL: **Performance ≥85, Accessibility ≥90, Best Practices ≥90.**
9. **No secrets in repo.** Every key in `.env.local` (gitignored) and Vercel env vars.
10. **Pricing data must trace to vendor URLs.** Every number in `PRICING_DATA.md` cites an official pricing page + date pulled.
11. **3 real user interviews.** Fabricated interviews = instant reject (the team can spot them).
12. **No website builders, no template UIs.** Tailwind/shadcn/Radix/MUI/Mantine are fine.

### DEVLOG entry format (exact)
```
## Day N — YYYY-MM-DD
**Hours worked:** X
**What I did:** ...
**What I learned:** ...
**Blockers / what I'm stuck on:** ...
**Plan for tomorrow:** ...
```

---

## Product principles (drive every UX decision)

1. **Email is captured AFTER value is shown, never before.** No login. No gate before audit results.
2. **Don't manufacture savings.** If audit shows <$100/mo or already-optimal, say so honestly. Capture the lead with a "notify me when new optimizations apply" signup. The "be honest" path scores; fake savings auto-reject on human review.
3. **Audit reasoning must be defensible.** A finance person reads the per-tool reason and agrees. Not "Cursor bad" — actual usage-fit reasoning with numbers and citations.
4. **The result page is the viral artifact.** It will be screenshotted and shared. Visual quality matters more here than anywhere else.
5. **High-savings (>$500/mo)** → surface Credex consultation CTA prominently. **Low/optimal** → still capture the lead, no Credex push.
6. **Strip identifying info from the public `/r/[id]` URL.** Company/email live only in `leads`, never in `audits.result`.

---

## Engineering rules

### When to use AI vs. rules
- **Audit math = rule-based, not AI.** Pure TypeScript module. Deterministic. The assignment is explicit: "knowing when not to use AI is part of the test."
- **AI is used for exactly one thing:** the ~100-word personalized summary on the result page. Anthropic API (claude-haiku-4-5). Templated fallback on any failure. Full prompt in `PROMPTS.md`.

### Code quality bar
- **TypeScript strict mode.** No `any` in the audit engine. `unknown` + narrow at boundaries.
- **The audit engine is pure.** No I/O, no fetch, no DB. Input → output. This is what makes it testable and defensible.
- **Validate at boundaries with Zod.** API routes parse incoming JSON; engine receives already-typed input.
- **Don't over-engineer.** No premature abstraction. No "factory" or "manager" classes. Three similar lines beats a clever generic.
- **Don't add error handling for impossible cases.** Trust internal code. Validate at the API boundary, then trust the types.
- **No comments unless the *why* is non-obvious.** Names should explain *what*. Comments explain *why a hidden constraint forced this*.
- **Small files.** If a file grows past ~200 lines, split it. The audit engine should be a directory of rule files, not one mega-file.

### Stack (locked, see ARCHITECTURE.md for justifications)
- Next.js 15 (App Router) + TypeScript strict
- Tailwind + shadcn/ui (Radix primitives)
- Zustand + persist middleware (form state across reloads)
- Supabase Postgres (audits, leads tables; RLS-enforced anon/service split)
- Resend (transactional email)
- Anthropic API — claude-haiku-4-5 (with prompt caching on system prompt)
- Upstash Redis (IP rate limit) + honeypot field
- Vitest + Testing Library
- GitHub Actions CI: `pnpm lint && pnpm typecheck && pnpm test`
- Vercel (deploy)
- react-pdf (PDF export — bonus only, after MVP locks)

### What's banned in this codebase
- Closed-source / private dependencies.
- `console.log` in committed code (use a tagged logger if needed).
- `eslint-disable` without an inline comment explaining why.
- `// @ts-ignore` (use `// @ts-expect-error` with a reason if truly forced).
- `any`. Use `unknown` and narrow.
- Hardcoded API keys. Always `process.env.X` with runtime existence check at server boot.
- "Just for now" hacks without a `// TODO(name): why this is temporary` and a follow-up issue.

### Git workflow
- Conventional Commits, scope-tagged when useful: `feat(engine):`, `fix(api):`, `docs(devlog):`.
- Atomic commits. One concept per commit. PR-ready even though we're committing direct to main.
- **Commit at least once per working day.** This is graded.
- Never `--no-verify`. If the pre-commit hook fails, fix the underlying issue.
- Never `--amend` or `--force` published commits.

### CI must enforce
- ESLint (Next.js + TypeScript recommended).
- TypeScript `noEmit` (strict).
- `vitest run`.
- (Optional) Playwright smoke on the result page render.

---

## File-creation policy

- **Don't create new markdown files** unless the assignment requires them or the user asks. The 12 required files at root cover documentation. No `NOTES.md`, no `TODO.md`, no `IDEAS.md` — those belong in DEVLOG entries or commit messages.
- The design spec lives at `docs/superpowers/specs/`. Don't duplicate it elsewhere.
- Code files: prefer editing existing modules over creating new ones. New file only when a new concept earns it.

## Communication policy in commits/docs

- Honest > impressive. The DEVLOG and REFLECTION reward specificity, including "I was stuck for 4 hours on this dumb thing" entries.
- The REFLECTION must include one specific time AI was wrong and you caught it. Don't fabricate this — note real instances as they happen during the week (commit footnote or DEVLOG line).
- Disclose AI usage honestly in REFLECTION. The team can detect one-shot codebases; it auto-rejects. Use AI for scaffolding/boilerplate/research; understand and own every line that lands in `engine/`.

---

## Quick reference: what to check before "done"

Before claiming any phase is complete:
- [ ] Tests pass locally (`pnpm test`).
- [ ] Typecheck passes (`pnpm typecheck`).
- [ ] Lint passes (`pnpm lint`).
- [ ] Commit message is conventional and specific.
- [ ] DEVLOG entry for today is updated.
- [ ] If pricing data was added/changed, citation in `PRICING_DATA.md` is updated.
- [ ] No secrets staged (`git diff --cached | grep -iE 'sk-|api.?key|secret'` returns nothing).

Before submission:
- [ ] All 12 required files exist at repo root.
- [ ] DEVLOG has 7 dated entries.
- [ ] CI is green on the latest commit.
- [ ] Deployed URL loads, audit flow works end-to-end, shareable URL works in incognito.
- [ ] Lighthouse mobile: Perf ≥85, A11y ≥90, BP ≥90.
- [ ] 3 real user interviews documented in `USER_INTERVIEWS.md`.
- [ ] `git log --pretty=format:"%ad" --date=short | sort -u | wc -l` ≥ 5.
- [ ] No `.env*` files staged. `.gitignore` covers them.
