/**
 * Rule: buy via Credex credits instead of paying retail.
 *
 * Fires when the user is on a paid plan for a Credex-sourced vendor. Uses a
 * conservative average discount (CREDEX_DISCOUNT) — actual savings vary by
 * tool and supply at audit time, so the reason wording is careful not to
 * over-promise.
 */

import { CREDEX_DISCOUNT, CREDEX_SOURCED, findPlan, TOOL_LABEL } from "../pricing";
import type { Rule } from "../types";

const CREDIT_ELIGIBLE_PLANS: Partial<Record<string, ReadonlyArray<string>>> = {
  cursor: ["pro", "business", "enterprise"],
  copilot: ["business", "enterprise"],
  claude: ["pro", "max", "team", "enterprise", "api"],
  chatgpt: ["plus", "team", "enterprise", "api"],
  anthropic_api: ["api"],
  openai_api: ["api"],
};

export const useCreditsRule: Rule = (entry) => {
  if (!CREDEX_SOURCED.includes(entry.tool)) return null;

  const eligible = CREDIT_ELIGIBLE_PLANS[entry.tool];
  if (!eligible || !eligible.includes(entry.plan)) return null;

  if (entry.monthlySpend <= 0) return null;

  const discountPct = Math.round(CREDEX_DISCOUNT * 100);
  const recommendedSpend = entry.monthlySpend * (1 - CREDEX_DISCOUNT);
  const monthlySavings = entry.monthlySpend - recommendedSpend;

  // Only surface if absolute savings are at least $5/mo — otherwise the friction
  // of switching procurement isn't worth it.
  if (monthlySavings < 5) return null;

  const plan = findPlan(entry.tool, entry.plan);
  return {
    tool: entry.tool,
    currentSpend: entry.monthlySpend,
    recommendation: "use_credits",
    recommendedSpend: Math.round(recommendedSpend * 100) / 100,
    monthlySavings: Math.round(monthlySavings * 100) / 100,
    reason: `${TOOL_LABEL[entry.tool]}: paying retail for ${plan?.label ?? entry.plan}. Credex sources discounted ${TOOL_LABEL[entry.tool]} credits from companies that overforecast — typical savings ~${discountPct}% on the same usage.`,
    citations: plan?.source ? [plan.source] : [],
  };
};
