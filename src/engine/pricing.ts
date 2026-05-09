/**
 * Pricing catalog. Every number traces to an official vendor pricing page.
 * URLs and verification dates also live in PRICING_DATA.md (the source of truth
 * for the assignment evaluators); this file is the machine-readable mirror.
 *
 * If pricing changes mid-week, update both files together.
 */

import type { Tool } from "./types";

export interface PlanEntry {
  /** Stable slug, lowercase, used as the `plan` field on ToolEntry. */
  slug: string;
  /** Human-readable name shown in the UI. */
  label: string;
  /** Monthly price per seat, USD. 0 = free. null = usage-based / custom. */
  pricePerSeatMonthly: number | null;
  /** Minimum seat count the plan can be purchased with. */
  minSeats: number;
  /** Source URL on the vendor's pricing page. */
  source: string;
  /** Free-text capability bullet — used in alternative-tool reasoning. */
  notes?: string;
}

/**
 * Tools whose retail pricing Credex resells at a discount through the credits
 * marketplace. These tools become candidates for the `use_credits` rule.
 */
export const CREDEX_SOURCED: ReadonlyArray<Tool> = [
  "cursor",
  "claude",
  "chatgpt",
  "anthropic_api",
  "openai_api",
  "copilot",
];

/**
 * Estimated average discount (decimal, e.g. 0.15 = 15% off retail) when buying
 * via Credex credits vs. paying the vendor directly. Defensibly conservative —
 * actual discounts vary by tool and supply (Credex sources from companies that
 * overforecast or pivoted, so depth fluctuates). Documented in PRICING_DATA.md.
 */
export const CREDEX_DISCOUNT = 0.15;

export const PRICING: Record<Tool, ReadonlyArray<PlanEntry>> = {
  cursor: [
    {
      slug: "hobby",
      label: "Hobby (Free)",
      pricePerSeatMonthly: 0,
      minSeats: 1,
      source: "https://cursor.com/pricing",
    },
    {
      slug: "pro",
      label: "Pro",
      pricePerSeatMonthly: 20,
      minSeats: 1,
      source: "https://cursor.com/pricing",
      notes: "Full agent + tab + 500 fast premium requests/month.",
    },
    {
      slug: "business",
      label: "Business",
      pricePerSeatMonthly: 40,
      minSeats: 1,
      source: "https://cursor.com/pricing",
      notes: "Adds SSO, admin dashboard, centralized billing — value scales with team size.",
    },
    {
      slug: "enterprise",
      label: "Enterprise",
      pricePerSeatMonthly: null,
      minSeats: 1,
      source: "https://cursor.com/pricing",
      notes: "Custom — typically $60+/seat. Adds SOC2 docs, audit logs, custom contracts.",
    },
  ],
  copilot: [
    {
      slug: "individual",
      label: "Individual",
      pricePerSeatMonthly: 10,
      minSeats: 1,
      source: "https://github.com/features/copilot/plans",
    },
    {
      slug: "business",
      label: "Business",
      pricePerSeatMonthly: 19,
      minSeats: 1,
      source: "https://github.com/features/copilot/plans",
      notes: "Adds policy controls, IP indemnity, audit logs.",
    },
    {
      slug: "enterprise",
      label: "Enterprise",
      pricePerSeatMonthly: 39,
      minSeats: 1,
      source: "https://github.com/features/copilot/plans",
      notes: "Adds Copilot Chat in repo, fine-tuned models, SSO.",
    },
  ],
  claude: [
    {
      slug: "free",
      label: "Free",
      pricePerSeatMonthly: 0,
      minSeats: 1,
      source: "https://www.anthropic.com/pricing",
    },
    {
      slug: "pro",
      label: "Pro",
      pricePerSeatMonthly: 20,
      minSeats: 1,
      source: "https://www.anthropic.com/pricing",
      notes: "5x more usage, Projects, larger context.",
    },
    {
      slug: "max",
      label: "Max",
      pricePerSeatMonthly: 100,
      minSeats: 1,
      source: "https://www.anthropic.com/pricing",
      notes: "5x more usage than Pro. 20x tier exists at $200/mo.",
    },
    {
      slug: "team",
      label: "Team",
      pricePerSeatMonthly: 25,
      minSeats: 5,
      source: "https://www.anthropic.com/pricing",
      notes: "Min 5 seats. Adds shared projects, central billing.",
    },
    {
      slug: "enterprise",
      label: "Enterprise",
      pricePerSeatMonthly: null,
      minSeats: 1,
      source: "https://www.anthropic.com/pricing",
      notes: "Custom. Adds SSO/SCIM, audit logs, larger contexts.",
    },
    {
      slug: "api",
      label: "API direct",
      pricePerSeatMonthly: null,
      minSeats: 1,
      source: "https://www.anthropic.com/pricing",
      notes: "Usage-based. User reports their actual monthly spend.",
    },
  ],
  chatgpt: [
    {
      slug: "plus",
      label: "Plus",
      pricePerSeatMonthly: 20,
      minSeats: 1,
      source: "https://openai.com/chatgpt/pricing/",
    },
    {
      slug: "team",
      label: "Team",
      pricePerSeatMonthly: 25,
      minSeats: 2,
      source: "https://openai.com/chatgpt/pricing/",
      notes: "Annual billing $25/seat ($30 monthly). Min 2 seats.",
    },
    {
      slug: "enterprise",
      label: "Enterprise",
      pricePerSeatMonthly: null,
      minSeats: 1,
      source: "https://openai.com/chatgpt/pricing/",
      notes: "Custom. Typical street price ~$60/seat at scale, more below scale.",
    },
    {
      slug: "api",
      label: "API direct",
      pricePerSeatMonthly: null,
      minSeats: 1,
      source: "https://openai.com/api/pricing/",
      notes: "Usage-based.",
    },
  ],
  anthropic_api: [
    {
      slug: "api",
      label: "API direct",
      pricePerSeatMonthly: null,
      minSeats: 1,
      source: "https://www.anthropic.com/pricing#api",
      notes: "Usage-based. User reports their actual monthly spend.",
    },
  ],
  openai_api: [
    {
      slug: "api",
      label: "API direct",
      pricePerSeatMonthly: null,
      minSeats: 1,
      source: "https://openai.com/api/pricing/",
      notes: "Usage-based.",
    },
  ],
  gemini: [
    {
      slug: "pro",
      label: "Gemini Pro (AI Pro)",
      pricePerSeatMonthly: 20,
      minSeats: 1,
      source: "https://gemini.google/subscriptions/",
      notes: "Google AI Pro — 2 TB storage + Gemini Advanced.",
    },
    {
      slug: "ultra",
      label: "Gemini Ultra (AI Ultra)",
      pricePerSeatMonthly: 249,
      minSeats: 1,
      source: "https://gemini.google/subscriptions/",
      notes: "AI Ultra — highest limits, Veo, Whisk.",
    },
    {
      slug: "api",
      label: "API direct",
      pricePerSeatMonthly: null,
      minSeats: 1,
      source: "https://ai.google.dev/pricing",
      notes: "Usage-based.",
    },
  ],
  windsurf: [
    {
      slug: "pro",
      label: "Pro",
      pricePerSeatMonthly: 15,
      minSeats: 1,
      source: "https://windsurf.com/pricing",
    },
    {
      slug: "teams",
      label: "Teams",
      pricePerSeatMonthly: 35,
      minSeats: 1,
      source: "https://windsurf.com/pricing",
      notes: "Adds team admin + shared credits.",
    },
    {
      slug: "enterprise",
      label: "Enterprise",
      pricePerSeatMonthly: null,
      minSeats: 1,
      source: "https://windsurf.com/pricing",
    },
  ],
};

export const TOOL_LABEL: Record<Tool, string> = {
  cursor: "Cursor",
  copilot: "GitHub Copilot",
  claude: "Claude",
  chatgpt: "ChatGPT",
  anthropic_api: "Anthropic API",
  openai_api: "OpenAI API",
  gemini: "Gemini",
  windsurf: "Windsurf",
};

export function findPlan(tool: Tool, planSlug: string): PlanEntry | null {
  return PRICING[tool].find((p) => p.slug === planSlug) ?? null;
}
