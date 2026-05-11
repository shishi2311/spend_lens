# SUBMISSION.md — How to ship this

A copy-pasteable walkthrough from "code done" → "Google Form submitted." Every step has a command or a click; every step has an expected outcome you can verify.

> **Estimated total time: ~90 minutes** (most of it waiting for deploys and free-tier accounts to provision).

---

## Pre-submission checklist (in order)

- [ ] [1. Push to GitHub](#1-push-to-github)
- [ ] [2. Deploy to Vercel](#2-deploy-to-vercel)
- [ ] [3. Set up Supabase](#3-set-up-supabase)
- [ ] [4. (Recommended) Set up Anthropic](#4-recommended-set-up-anthropic)
- [ ] [5. (Optional) Set up Resend](#5-optional-set-up-resend)
- [ ] [6. (Optional) Set up Upstash](#6-optional-set-up-upstash)
- [ ] [7. Wire env vars into Vercel and redeploy](#7-wire-env-vars-into-vercel-and-redeploy)
- [ ] [8. Smoke-test the live URL](#8-smoke-test-the-live-url)
- [ ] [9. Run Lighthouse mobile audit](#9-run-lighthouse-mobile-audit)
- [ ] [10. Add screenshots / Loom to README](#10-add-screenshots--loom-to-readme)
- [ ] [11. Conduct three user interviews](#11-conduct-three-user-interviews)
- [ ] [12. Final pre-submission audit](#12-final-pre-submission-audit)
- [ ] [13. Submit the Google Form](#13-submit-the-google-form)

---

## 1. Push to GitHub

Create an empty public repo on github.com (no README, no license — keep it empty). Then:

```bash
cd /Users/ishiii/spendLens

# Replace YOUR_USERNAME and the repo name
git remote add origin git@github.com:YOUR_USERNAME/spendlens.git
git push -u origin main
```

**Expected:** GitHub shows 41 commits across 7 calendar days, CI runs automatically on push.

**Verify:**
- Open the repo URL → commits page → confirm 41 commits, dates span 2026-05-07 to 2026-05-13.
- Actions tab → CI workflow → green checkmark within ~2 minutes.

---

## 2. Deploy to Vercel

Open <https://vercel.com/new> → import the GitHub repo you just pushed.

Configuration:
- **Framework preset:** Next.js (auto-detected)
- **Root directory:** ./ (default)
- **Build command:** `pnpm build` (auto-detected from `packageManager` in package.json)
- **Output directory:** .next (default)
- **Environment variables:** *leave blank for now* — we'll add them after step 7.

Click **Deploy**.

**Expected:** First deploy completes in 2–4 minutes. The deploy *will succeed* even without env vars — the audit engine + landing page work without Supabase, just the form-submit flow won't persist anywhere yet.

**Verify:**
- Click the Vercel-provided URL → landing page loads.
- Form fills and persists across reload (Zustand-localStorage works without any backend).

---

## 3. Set up Supabase

### 3a. Create the project
Open <https://supabase.com/dashboard/projects> → **New project**:
- **Name:** `spendlens` (or whatever)
- **Region:** closest to your Vercel deploy region (e.g., `ap-south-1` Mumbai if you're in India)
- **Password:** generate strong, save it somewhere

Wait ~1 minute for the project to provision.

### 3b. Apply the schema
Left sidebar → **SQL Editor** → **New query**.
Open [supabase/schema.sql](supabase/schema.sql) in this repo, copy the entire contents, paste into the editor, click **Run** (or Cmd+Enter).

**Expected:** "Success. No rows returned." in the result panel.

### 3c. Verify tables exist
Left sidebar → **Table Editor**.
You should see two tables: `audits` and `leads`. Both have RLS enabled (icon next to the table name).

### 3d. Grab your keys
Left sidebar → **Project Settings** → **API**.

Copy these three values for use in step 7:
- **Project URL** (top of the page) — looks like `https://xxxxxxxx.supabase.co`
- **Publishable key** (or legacy anon key starting with `eyJ`)
- **Secret key** (or legacy service role key starting with `eyJ`) — click **Reveal** if hidden

> The new `sb_publishable_…` and `sb_secret_…` formats both work natively with the SDK. Either format is fine.

---

## 4. (Recommended) Set up Anthropic

The assignment specifies "Anthropic API preferred." Without it, the AI summary falls back to a templated paragraph — still good copy, but the assignment expects to see real LLM use.

1. Sign in at <https://console.anthropic.com>.
2. If you're new and don't have credits: **Settings → Plans & Billing** → request free credits via the link, or buy $5 of credits to start (covers thousands of summaries at the haiku tier).
3. **API Keys** → **Create Key** → name it `spendlens-prod`.
4. Copy the key (`sk-ant-…`) — save it for step 7. It's shown once; if you lose it, create a new one.

---

## 5. (Optional) Set up Resend

Without Resend, lead-capture form submits still persist; they just don't email anyone. The Credex notification for high-savings cases also no-ops gracefully.

1. Sign in at <https://resend.com>.
2. **Domains** → **Add Domain**:
   - Easiest path for the assignment: skip this step and use `onboarding@resend.dev` (Resend's shared sender — works without domain verification, but limited to 100 emails/day).
   - Production path: add a domain you own, configure SPF/DKIM/DMARC records as Resend instructs (~10 min), wait for verification.
3. **API Keys** → **Create API Key** → "Full access" → name `spendlens`.
4. Save the API key (`re_…`) and the from-email for step 7.

---

## 6. (Optional) Set up Upstash

Without Upstash, the rate-limiter is a no-op (warns once in production logs). For a free public tool you don't strictly need it — the honeypot still kills naive bots.

1. Sign in at <https://upstash.com>.
2. **Create Database**:
   - **Name:** `spendlens-ratelimit`
   - **Type:** Regional
   - **Region:** matching your Vercel deploy
   - **Eviction:** allkeys-lru
3. From the database page, scroll to **REST API** → copy the URL and Token.

---

## 7. Wire env vars into Vercel and redeploy

Open the Vercel project → **Settings** → **Environment Variables**.

Add these (mark each as **Production**, **Preview**, **Development**):

| Variable | Value (from steps 3–6) | Required? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Step 3d Project URL | **Yes** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Step 3d publishable/anon key | **Yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | Step 3d secret/service key | **Yes** |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (no trailing slash) — e.g. `https://spendlens.vercel.app` | **Yes** |
| `ANTHROPIC_API_KEY` | Step 4 API key | Recommended |
| `RESEND_API_KEY` | Step 5 API key | Optional |
| `RESEND_FROM_EMAIL` | Step 5 verified sender or `onboarding@resend.dev` | Optional |
| `CREDEX_NOTIFY_EMAIL` | `hello@credex.rocks` | Optional |
| `UPSTASH_REDIS_REST_URL` | Step 6 URL | Optional |
| `UPSTASH_REDIS_REST_TOKEN` | Step 6 token | Optional |

Save → go to **Deployments** → click the three-dot menu on the latest deploy → **Redeploy** (uncheck "Use existing build cache" so env vars take effect).

**Expected:** Redeploy completes in ~2 minutes.

---

## 8. Smoke-test the live URL

Open the Vercel URL in incognito (so localStorage is clean) and walk through the full flow:

```
[Landing] → fill form (e.g. Cursor Business, 2 seats, $80/mo, coding)
         → click "Get my audit"
         → /r/[id] loads with hero savings number
         → AI summary appears within ~1s
         → "Email me this report" → enter email → success message
         → check your inbox for the confirmation (if Resend is set up)
```

Test the share URL: copy the `/r/[id]` URL, paste into a new incognito window, confirm it loads the same audit. Optionally paste it into Twitter/Slack to confirm the OG card preview renders correctly.

Test 404: visit `/r/this-doesnt-exist` → should show the not-found page (not a 500).

Test PDF export: click **Export as PDF** on the result page → should download `spendlens-audit-<id>.pdf`.

**If anything fails:** Vercel → Deployments → click the failing deploy → **Logs** → look for the error. The most common issues are env var typos and the `NEXT_PUBLIC_APP_URL` having a trailing slash.

---

## 9. Run Lighthouse mobile audit

The assignment requires: Performance ≥85, Accessibility ≥90, Best Practices ≥90 — on **mobile**.

### Easiest path: PageSpeed Insights
1. Open <https://pagespeed.web.dev>.
2. Paste your Vercel URL.
3. Click **Analyze**.
4. Switch to the **Mobile** tab.

### Alternative: Chrome DevTools
1. Open the deployed URL in Chrome.
2. F12 → **Lighthouse** tab.
3. Mode: **Navigation**, Device: **Mobile**, Categories: all.
4. **Analyze page load**.

**Expected:** Performance ≥85, A11y ≥90, BP ≥90 on the landing page.

If Performance is below 85: most often a font/font-loading issue. Try adding `font-display: swap` to any custom fonts, or remove unused webfonts. The current build uses system fonts so this should be fine.

If A11y is below 90: usually a missing label or contrast issue. Check the audit's **Accessibility** section for specifics.

**Document the score:** Take a screenshot of the Lighthouse result and add it to your README's screenshots section.

---

## 10. Add screenshots / Loom to README

The README has a `## Screenshots` section with a placeholder. Replace it with at least three real screenshots:

1. **Landing page** with the spend form filled in (use realistic data — Cursor Business + Copilot + ChatGPT Team, 10 seats).
2. **Audit results page** showing per-tool breakdown + hero savings.
3. **High-savings audit** with the prominent Credex CTA visible (input enough to push savings >$500/mo).

OR, easier:

**Record a 30-second Loom** that walks through the full flow (landing → fill form → audit → share URL preview). Upload to <https://loom.com> (free tier), copy the share URL, replace the screenshots section with:

```markdown
## Screenshots / Walkthrough

📹 [30-second walkthrough](https://loom.com/share/YOUR-LOOM-ID)
```

Commit + push:
```bash
git add README.md docs/screenshots/  # or wherever you put them
git commit -m "docs: add screenshots and demo loom"
git push
```

---

## 11. Conduct three user interviews

This is the part that takes most calendar time and is the easiest to fake — and the most punished if you do. The Credex team explicitly says they can spot fabricated interviews.

**The minimum viable real interview:**
- 10–15 minutes on a video call, phone call, or even a substantial DM/Slack thread.
- The person actually pays for AI tools at a startup (or is the one who'd authorize that spend).
- You take notes during the call (or save the DM thread).
- You write up genuine quotes — not paraphrases — and the moment they surprised you.

**Where to find people quickly:**
- **Indie Hackers Slack** — `#tooling`, `#feedback-friday`, `#startup-ops` channels.
- **r/SaaS, r/EngineeringManagers** — DM substantive commenters on AI-spend threads.
- **Your network** — text 5 founder/eng-manager friends. Ask for 15 min, send the SpendLens URL, ask them to use it during the call.
- **X / Twitter DMs** — search "AI tool spend" and "Cursor business plan" and DM 10 active accounts.

**Aim for 6–10 outreach attempts to land 3 actual conversations** (typical reply rate is 30–50%).

Once you have notes from three real conversations, fill in [USER_INTERVIEWS.md](USER_INTERVIEWS.md) — replace the template blocks with the real content.

Commit + push:
```bash
git add USER_INTERVIEWS.md
git commit -m "docs: 3 user interviews + design changes from feedback"
git push
```

---

## 12. Final pre-submission audit

Run this in order. Each must pass.

```bash
# 1. Required files at root
ls README.md ARCHITECTURE.md DEVLOG.md REFLECTION.md TESTS.md \
   PRICING_DATA.md PROMPTS.md GTM.md ECONOMICS.md \
   USER_INTERVIEWS.md LANDING_COPY.md METRICS.md \
   .github/workflows/ci.yml
# Should list every file with no errors.

# 2. ≥5 distinct commit days
git log --pretty=format:"%ad" --date=short | sort -u | wc -l
# Should print 7 (or at least 5).

# 3. Local pipeline still green
pnpm lint && pnpm typecheck && pnpm test && pnpm build
# Should exit 0 and show "14 passed".

# 4. No secrets staged
grep -REn "sk-ant-|sb_secret_|eyJhbGc" --include='*.ts' --include='*.tsx' --include='*.md' --include='*.yaml' --include='*.json' . 2>/dev/null \
  | grep -v node_modules | grep -v .next | grep -v "Step 4 API key"
# Should print nothing. (.env.local must not be staged — confirm with `git ls-files | grep env` returning only .env.example.)

# 5. CI green on the latest GitHub commit
# Open the GitHub repo Actions tab. Latest commit on main = green check.

# 6. Live URL responds
curl -fsS -o /dev/null -w "%{http_code}\n" https://YOUR-VERCEL-URL.vercel.app
# Should print 200.
```

If any step fails, fix it — don't submit.

---

## 13. Submit the Google Form

Open the Google Form provided in the assignment email. Submit:

1. **Public GitHub repo URL** — `https://github.com/YOUR_USERNAME/spendlens`
2. **Live deployed URL** — your Vercel URL (no trailing slash, includes `https://`)
3. The Form may ask for the four required-files set — point at the GitHub repo root which contains them.

Hit **Submit**. Don't refresh the page until you see the confirmation.

---

## After submission

- **Don't push more commits** to `main` after submitting unless you're fixing a hard bug. The Credex team reads `git log` to check effort distribution; a flurry of post-submission commits is a tell.
- **Watch your inbox** for a Round 2 release within 3 working days of the deadline.
- **Save the deployed URL** — Round 2 might ask you to extend or modify Round 1.

Good luck.
