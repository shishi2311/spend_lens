/**
 * AI summary generator. Single Anthropic call with templated fallback.
 *
 * Why this is the only place we use AI: the audit math itself must be
 * deterministic and defensible (rule-based, citation-backed). The summary is
 * pure prose framing — exactly the kind of natural-language task LLMs are
 * good at and where small variation per user is the desired behavior.
 *
 * If the API key is missing or the call fails, we fall back to a templated
 * paragraph built from the same AuditResult so the user never sees an error.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { TOOL_LABEL } from "@/engine/pricing";
import type { AuditResult } from "@/engine/types";
import { formatCurrency } from "../utils";
import { env } from "../env";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 320;
const TIMEOUT_MS = 4000;

const SYSTEM_PROMPT = `You are an analyst writing a 100-word audit summary for a startup founder reviewing their AI tool spend.

Voice: direct, useful, no hype. Lead with the headline number. Then the single biggest opportunity, with the dollar value. End with one concrete next step. Never invent savings — only summarize the findings provided.

Constraints:
- 100 words ± 10
- Plain text, no markdown, no emoji
- Address the reader as "you"
- If totalMonthlySavings is under $100, say so honestly and reframe as a "you're spending well" message
- Do not list every tool — pick the 1–2 highest-impact findings`;

function userPrompt(result: AuditResult): string {
  const top = [...result.findings]
    .filter((f) => f.recommendation !== "already_optimal")
    .sort((a, b) => b.monthlySavings - a.monthlySavings)
    .slice(0, 3)
    .map(
      (f) =>
        `- ${TOOL_LABEL[f.tool]}: ${formatCurrency(f.currentSpend)} → ${formatCurrency(f.recommendedSpend, { precision: 2 })} (saves ${formatCurrency(f.monthlySavings, { precision: 2 })}/mo). ${f.reason}`,
    )
    .join("\n");

  return `Audit findings:
- Total monthly savings: ${formatCurrency(result.totalMonthlySavings)}
- Total annual savings: ${formatCurrency(result.totalAnnualSavings)}
- CTA tier: ${result.ctaTier}

Top opportunities:
${top || "(no actionable findings — all tools are on optimal plans)"}

Write the 100-word summary now.`;
}

export function templatedSummary(result: AuditResult): string {
  if (result.totalMonthlySavings < 100) {
    return `Your stack is in good shape — based on what you reported, there's no significant overspend to flag. That's rarer than it sounds: most teams have $200+/mo of recoverable spend by the time they audit. Keep an eye on usage as your seat count grows; the math changes fast past 5 paid seats. We'll send a refreshed audit when new credit supply opens for the tools you use, in case that ever shifts the picture for you.`;
  }
  const top = [...result.findings]
    .filter((f) => f.recommendation !== "already_optimal")
    .sort((a, b) => b.monthlySavings - a.monthlySavings)[0];
  const monthly = formatCurrency(result.totalMonthlySavings);
  const annual = formatCurrency(result.totalAnnualSavings);
  if (!top) {
    return `You could save ${monthly} per month (${annual} per year) on AI tools you reported. The fastest path is one of the recommendations above — most take under five minutes to act on. Email yourself the report and forward it to whoever owns the budget; it's calibrated to be defensible to finance.`;
  }
  return `You could save ${monthly} per month (${annual} per year) on the AI tools you reported. The single biggest opportunity is ${TOOL_LABEL[top.tool]}: ${top.reason} That alone reclaims ${formatCurrency(top.monthlySavings, { precision: 2 })}/mo. The remaining wins are smaller but additive — most teams act on the top two findings the same day. Email this report and forward it to whoever owns the budget; the reasoning traces to vendor pricing pages and is calibrated to be defensible to finance.`;
}

export async function generateSummary(result: AuditResult): Promise<string> {
  const apiKey = env.anthropicApiKey;
  if (!apiKey) {
    return templatedSummary(result);
  }

  const client = new Anthropic({
    apiKey,
    timeout: TIMEOUT_MS,
    maxRetries: 1,
  });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt(result) }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return text || templatedSummary(result);
  } catch (err) {
    console.warn("[anthropic] summary generation failed, using template:", err);
    return templatedSummary(result);
  }
}
