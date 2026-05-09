/**
 * Rule: switch to a substantially cheaper alternative tool.
 *
 * Triggers only when (a) the user's primary use case is well-served by the
 * alternative and (b) the savings are meaningful (>= 25% of current spend).
 * Ignores feature parity edge cases — we never claim equivalence beyond the
 * primary use case the user reported.
 */

import { findPlan, TOOL_LABEL } from "../pricing";
import type { Rule, Tool, ToolFinding, UseCase } from "../types";

interface AlternativeRule {
  /** Tool the user is currently paying for. */
  fromTool: Tool;
  fromPlan: string;
  /** Recommend switching to this tool/plan. */
  toTool: Tool;
  toPlan: string;
  /** Use cases this swap is honest for. */
  appliesTo: ReadonlyArray<UseCase>;
  /** Sentence stem describing why the swap is reasonable. */
  reasonStem: string;
}

const ALTERNATIVES: ReadonlyArray<AlternativeRule> = [
  {
    fromTool: "cursor",
    fromPlan: "business",
    toTool: "windsurf",
    toPlan: "pro",
    appliesTo: ["coding", "mixed"],
    reasonStem:
      "Windsurf Pro ($15/seat) ships an agentic IDE comparable for code completion + multi-file edits at less than half the per-seat cost",
  },
  {
    fromTool: "copilot",
    fromPlan: "business",
    toTool: "cursor",
    toPlan: "pro",
    appliesTo: ["coding", "mixed"],
    reasonStem:
      "Cursor Pro ($20/seat) bundles agent + chat + tab completion in one IDE; teams that adopt it typically retire Copilot Business",
  },
  {
    fromTool: "copilot",
    fromPlan: "individual",
    toTool: "windsurf",
    toPlan: "pro",
    appliesTo: ["coding", "mixed"],
    reasonStem:
      "Windsurf Pro ($15/seat) covers the same code-completion ground as Copilot Individual ($10/seat) but adds an agent — usually a wash on price and an upgrade in capability; flag only if the user wants more capability per dollar",
  },
  {
    fromTool: "chatgpt",
    fromPlan: "team",
    toTool: "claude",
    toPlan: "team",
    appliesTo: ["writing", "research", "coding"],
    reasonStem:
      "Claude Team is the same per-seat price ($25) and benchmarks ahead on long-form writing and code; consider it the like-for-like alternative",
  },
];

export const alternativeToolRule: Rule = (entry, ctx) => {
  const candidates = ALTERNATIVES.filter(
    (a) => a.fromTool === entry.tool && a.fromPlan === entry.plan && a.appliesTo.includes(ctx.useCase),
  );
  if (candidates.length === 0) return null;

  let best: ToolFinding | null = null;

  for (const alt of candidates) {
    const altPlan = findPlan(alt.toTool, alt.toPlan);
    if (!altPlan?.pricePerSeatMonthly) continue;

    const recommendedSpend = altPlan.pricePerSeatMonthly * entry.seats;
    const monthlySavings = entry.monthlySpend - recommendedSpend;
    // Only fire when savings >= 25% of current spend AND >= $10/mo absolute.
    // Below that, recommending a tool switch is more friction than value.
    if (monthlySavings < entry.monthlySpend * 0.25) continue;
    if (monthlySavings < 10) continue;
    if (best && best.monthlySavings >= monthlySavings) continue;

    const fromPlan = findPlan(alt.fromTool, alt.fromPlan);
    best = {
      tool: entry.tool,
      currentSpend: entry.monthlySpend,
      recommendation: "switch_tool",
      recommendedSpend,
      monthlySavings,
      reason: `${TOOL_LABEL[entry.tool]} → ${TOOL_LABEL[alt.toTool]}: ${alt.reasonStem} for "${ctx.useCase}" use cases.`,
      citations: [fromPlan?.source, altPlan.source].filter((u): u is string => Boolean(u)),
    };
  }

  return best;
};
