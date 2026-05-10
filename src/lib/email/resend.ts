/**
 * Transactional email via Resend.
 *
 * Two emails: one to the user confirming their audit, one to Credex (only
 * for high-savings audits) so sales can follow up.
 *
 * If Resend isn't configured (no API key), emails are no-ops with a warn —
 * the audit + lead row still persist and the UX still works.
 */

import "server-only";
import { Resend } from "resend";
import { TOOL_LABEL } from "@/engine/pricing";
import type { AuditResult } from "@/engine/types";
import { formatCurrency } from "../utils";
import { env, PUBLIC_APP_URL } from "../env";

interface ConfirmAuditArgs {
  to: string;
  auditId: string;
  result: AuditResult;
}

interface NotifyCredexArgs {
  auditId: string;
  email: string;
  company?: string;
  result: AuditResult;
}

function getClient(): Resend | null {
  const apiKey = env.resendApiKey;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function shareUrl(auditId: string): string {
  return `${PUBLIC_APP_URL}/r/${auditId}`;
}

export async function sendAuditConfirmation({ to, auditId, result }: ConfirmAuditArgs): Promise<void> {
  const client = getClient();
  if (!client) {
    console.warn("[resend] not configured — skipping audit confirmation email");
    return;
  }
  const from = env.resendFromEmail;
  if (!from) {
    console.warn("[resend] RESEND_FROM_EMAIL not set — skipping confirmation");
    return;
  }

  const monthly = formatCurrency(result.totalMonthlySavings);
  const annual = formatCurrency(result.totalAnnualSavings);
  const url = shareUrl(auditId);

  const topFindings = [...result.findings]
    .filter((f) => f.recommendation !== "already_optimal")
    .sort((a, b) => b.monthlySavings - a.monthlySavings)
    .slice(0, 3)
    .map((f) => `<li><strong>${TOOL_LABEL[f.tool]}</strong> — ${f.reason} (saves ${formatCurrency(f.monthlySavings, { precision: 2 })}/mo)</li>`)
    .join("");

  try {
    await client.emails.send({
      from,
      to,
      subject: `Your SpendLens audit — ${monthly}/mo potential savings`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
          <h1 style="font-size:24px;margin:0 0 16px;color:#0f172a">Your AI spend audit</h1>
          <p style="font-size:18px;margin:0 0 8px"><strong>${monthly}/mo</strong> in potential monthly savings.</p>
          <p style="margin:0 0 24px;color:#64748b">${annual}/year if you act on every finding.</p>
          ${topFindings ? `<h2 style="font-size:16px;margin:24px 0 8px">Top opportunities</h2><ul style="padding-left:20px;line-height:1.6">${topFindings}</ul>` : ""}
          <p style="margin:24px 0 8px"><a href="${url}" style="display:inline-block;background:#10b981;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">View full audit</a></p>
          <p style="margin:24px 0 0;color:#64748b;font-size:13px">${result.ctaTier === "high" ? "Because your audit shows substantial savings, someone from Credex may reach out about discounted credits for the tools you use." : "We'll let you know if new optimizations apply to your stack."}</p>
        </div>
      `,
      text: `Your AI spend audit\n\n${monthly}/mo in potential savings (${annual}/year).\n\nFull audit: ${url}\n\n${result.ctaTier === "high" ? "Because your audit shows substantial savings, someone from Credex may reach out about discounted credits for the tools you use." : "We'll notify you if new optimizations apply to your stack."}`,
    });
  } catch (err) {
    console.warn("[resend] failed to send audit confirmation:", err);
  }
}

export async function notifyCredexHighSavings({ auditId, email, company, result }: NotifyCredexArgs): Promise<void> {
  const client = getClient();
  if (!client) return;
  const from = env.resendFromEmail;
  const to = env.credexNotifyEmail;
  if (!from || !to) return;

  try {
    await client.emails.send({
      from,
      to,
      subject: `[SpendLens] High-savings lead: ${formatCurrency(result.totalMonthlySavings)}/mo — ${email}`,
      text: `New high-savings audit completed.

Email: ${email}
${company ? `Company: ${company}\n` : ""}Audit: ${shareUrl(auditId)}
Monthly savings: ${formatCurrency(result.totalMonthlySavings)}
Annual savings: ${formatCurrency(result.totalAnnualSavings)}
Tier: ${result.ctaTier}

Tools audited: ${result.findings.map((f) => TOOL_LABEL[f.tool]).join(", ")}`,
    });
  } catch (err) {
    console.warn("[resend] failed to notify Credex:", err);
  }
}
