/**
 * Audit engine types. Pure data shapes — no I/O, no dependencies.
 *
 * The engine is deliberately decoupled from Next, React, and the database
 * so it can be unit-tested in isolation and evolved independently.
 */

export type Tool =
  | "cursor"
  | "copilot"
  | "claude"
  | "chatgpt"
  | "anthropic_api"
  | "openai_api"
  | "gemini"
  | "windsurf";

export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

export interface ToolEntry {
  tool: Tool;
  /** Tool-specific plan slug (e.g., "pro", "team", "business"). See pricing.ts. */
  plan: string;
  /** User-reported monthly spend in USD (a number, not a string). */
  monthlySpend: number;
  /** Number of paid seats on this tool. */
  seats: number;
}

export interface AuditInput {
  tools: ToolEntry[];
  teamSize: number;
  useCase: UseCase;
}

export type RecommendationKind =
  | "downgrade_plan" /** Same vendor, cheaper plan */
  | "switch_tool" /** Different vendor, similar capability */
  | "use_credits" /** Buy via Credex instead of retail */
  | "already_optimal"; /** Honest no-op */

export interface ToolFinding {
  tool: Tool;
  /** What the user reported they pay today, monthly USD. */
  currentSpend: number;
  recommendation: RecommendationKind;
  /** What the recommended path would cost monthly USD. */
  recommendedSpend: number;
  /** currentSpend − recommendedSpend, never negative. */
  monthlySavings: number;
  /** 1-sentence, finance-defensible reason citing numbers. */
  reason: string;
  /** Vendor pricing URLs that back the numbers in `reason`. */
  citations: string[];
}

export type CtaTier = "high" | "low" | "optimal";

export interface AuditResult {
  findings: ToolFinding[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  ctaTier: CtaTier;
}

/**
 * Each rule receives a single ToolEntry plus the broader audit context and
 * returns a candidate finding (or null if the rule doesn't apply). The
 * engine picks the highest-savings finding per tool.
 */
export type Rule = (entry: ToolEntry, ctx: AuditInput) => ToolFinding | null;
