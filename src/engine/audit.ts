/**
 * Top-level audit engine entry point.
 *
 * Pure: same input → same output, no I/O, no clock, no randomness.
 * The only side effect a caller will see is the returned AuditResult.
 */

import { alternativeToolRule } from "./rules/alternative-tool";
import { downgradePlanRule } from "./rules/downgrade-plan";
import { useCreditsRule } from "./rules/use-credits";
import { TOOL_LABEL } from "./pricing";
import type { AuditInput, AuditResult, RecommendationKind, Rule, ToolFinding } from "./types";

const RULES: ReadonlyArray<Rule> = [downgradePlanRule, alternativeToolRule, useCreditsRule];

/**
 * Lower number = lower switching friction for the user. Used as a tiebreaker
 * when multiple rules fire with comparable savings — a finance person
 * defending the audit would choose the lower-friction path when savings are
 * within 20% of each other.
 */
const FRICTION_RANK: Record<RecommendationKind, number> = {
  already_optimal: 0,
  use_credits: 1, // Just a procurement change — same tool, same plan.
  downgrade_plan: 2, // Account admin change — same vendor.
  switch_tool: 3, // Workflow migration — onboarding everyone to a new tool.
};

const FRICTION_PREFERENCE_THRESHOLD = 0.8;

function pickBest(candidates: ToolFinding[]): ToolFinding | null {
  if (candidates.length === 0) return null;
  const top = candidates.reduce((a, b) => (b.monthlySavings > a.monthlySavings ? b : a));
  // If a lower-friction candidate captures at least 80% of the top savings,
  // prefer it: the user keeps their existing workflow and still wins most of
  // the savings.
  const lowerFriction = candidates.find(
    (c) =>
      FRICTION_RANK[c.recommendation] < FRICTION_RANK[top.recommendation] &&
      c.monthlySavings >= top.monthlySavings * FRICTION_PREFERENCE_THRESHOLD,
  );
  return lowerFriction ?? top;
}

function pickBestPerTool(input: AuditInput): ToolFinding[] {
  const findings: ToolFinding[] = [];

  for (const entry of input.tools) {
    const candidates: ToolFinding[] = [];
    for (const rule of RULES) {
      const candidate = rule(entry, input);
      if (candidate) candidates.push(candidate);
    }
    const best = pickBest(candidates);

    if (!best) {
      // Honest "you're spending well" finding so the result page can show
      // every tool the user inputted — not a silent omission.
      findings.push({
        tool: entry.tool,
        currentSpend: entry.monthlySpend,
        recommendation: "already_optimal",
        recommendedSpend: entry.monthlySpend,
        monthlySavings: 0,
        reason: `${TOOL_LABEL[entry.tool]}: on the right plan for ${entry.seats} seat${entry.seats === 1 ? "" : "s"}; no cheaper path covers the same ground today.`,
        citations: [],
      });
    } else {
      findings.push(best);
    }
  }

  return findings;
}

function deriveCtaTier(totalMonthlySavings: number, hasFindings: boolean): AuditResult["ctaTier"] {
  if (totalMonthlySavings > 500) return "high";
  if (totalMonthlySavings >= 100) return "low";
  if (hasFindings) return "low";
  return "optimal";
}

export function runAudit(input: AuditInput): AuditResult {
  const findings = pickBestPerTool(input);
  const totalMonthlySavings =
    Math.round(findings.reduce((sum, f) => sum + f.monthlySavings, 0) * 100) / 100;
  const totalAnnualSavings = Math.round(totalMonthlySavings * 12 * 100) / 100;
  const hasFindings = findings.some((f) => f.recommendation !== "already_optimal");

  return {
    findings,
    totalMonthlySavings,
    totalAnnualSavings,
    ctaTier: deriveCtaTier(totalMonthlySavings, hasFindings),
  };
}
