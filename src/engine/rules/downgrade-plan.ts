/**
 * Rule: same-vendor cheaper plan.
 *
 * Fires when the user is on a higher-tier plan whose admin/governance value
 * doesn't pay for itself at their team size. Conservative thresholds so we
 * never recommend a downgrade that strips a feature the user actually needs.
 */

import { findPlan, TOOL_LABEL } from "../pricing";
import type { Rule, ToolFinding } from "../types";

interface DowngradeRule {
  /** Slug the user is currently on. */
  from: string;
  /** Slug we recommend. */
  to: string;
  /** Recommend only when seat count is at most this. */
  appliesUpToSeats: number;
  /** 1-line reason template — `${seats}` and price diffs are interpolated. */
  reason: (seats: number, fromPrice: number, toPrice: number) => string;
}

const DOWNGRADE_RULES: Partial<Record<string, DowngradeRule[]>> = {
  cursor: [
    {
      from: "business",
      to: "pro",
      appliesUpToSeats: 4,
      reason: (seats, from, to) =>
        `Cursor Business ($${from}/seat) adds SSO and admin tooling that pays back at 5+ seats; with ${seats} seat${seats === 1 ? "" : "s"}, Pro ($${to}/seat) covers the same coding capability.`,
    },
  ],
  copilot: [
    {
      from: "business",
      to: "individual",
      appliesUpToSeats: 4,
      reason: (seats, from, to) =>
        `Copilot Business ($${from}/seat) is priced for IP indemnity and policy controls — at ${seats} seat${seats === 1 ? "" : "s"}, Individual ($${to}/seat) ships the same code-completion model.`,
    },
    {
      from: "enterprise",
      to: "business",
      appliesUpToSeats: 24,
      reason: (seats, from, to) =>
        `Copilot Enterprise ($${from}/seat) adds repo-context chat and fine-tuning — under 25 seats the per-seat math rarely beats Business ($${to}/seat) plus selective ChatGPT Team.`,
    },
  ],
  chatgpt: [
    {
      from: "enterprise",
      to: "team",
      appliesUpToSeats: 49,
      reason: (seats) =>
        `ChatGPT Enterprise's per-seat list price (~$60+) is built for 150+-seat orgs; at ${seats} seats, Team ($25/seat annual) ships the same GPT-5 access plus a shared workspace.`,
    },
  ],
  // claude.team minSeats is 5 (vendor-enforced) so a downgrade-from-Team rule
  // would never fire — skip.
};

/**
 * For users on plans whose `minSeats > 1` who have fewer seats than that floor,
 * suggest switching to the next tier down. Currently only ChatGPT Team / Claude
 * Team, both vendor-enforced — kept here for future-proofing.
 */
function checkMinSeatViolation(entry: { tool: string; plan: string; seats: number; monthlySpend: number }): ToolFinding | null {
  const _ = entry; // placeholder — vendors enforce min seats at checkout, but
  // if a user reports a misconfigured plan we'd surface it here. No-op for now.
  return null;
}

export const downgradePlanRule: Rule = (entry) => {
  const rules = DOWNGRADE_RULES[entry.tool];
  if (!rules) return null;

  for (const rule of rules) {
    if (entry.plan !== rule.from) continue;
    if (entry.seats > rule.appliesUpToSeats) continue;

    const fromPlan = findPlan(entry.tool, rule.from);
    const toPlan = findPlan(entry.tool, rule.to);
    if (!fromPlan?.pricePerSeatMonthly || !toPlan?.pricePerSeatMonthly) continue;

    const recommendedSpend = toPlan.pricePerSeatMonthly * entry.seats;
    const monthlySavings = Math.max(0, entry.monthlySpend - recommendedSpend);
    if (monthlySavings <= 0) continue;

    return {
      tool: entry.tool,
      currentSpend: entry.monthlySpend,
      recommendation: "downgrade_plan",
      recommendedSpend,
      monthlySavings,
      reason: `${TOOL_LABEL[entry.tool]}: ${rule.reason(entry.seats, fromPlan.pricePerSeatMonthly, toPlan.pricePerSeatMonthly)}`,
      citations: [fromPlan.source, toPlan.source].filter((url, i, arr) => arr.indexOf(url) === i),
    };
  }

  return checkMinSeatViolation(entry);
};
