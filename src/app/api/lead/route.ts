/**
 * POST /api/lead
 * - Validates email + optional fields via Zod
 * - Honeypot: any value in `website` field = silent 200, no insert (kills naive bots)
 * - Persists lead row (server-only via service role; RLS blocks anon reads)
 * - Sends confirmation email to the user (Resend) — no-op if not configured
 * - For high-savings audits: notifies Credex sales
 */

import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { leadInputSchema } from "@/engine/schema";
import { getAudit, saveLead } from "@/lib/audits/storage";
import { sendAuditConfirmation, notifyCredexHighSavings } from "@/lib/email/resend";
import { clientIpFromHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = leadInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Honeypot: bots fill every field they see; humans never see `website`.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Confirm the audit exists (cheap defense against random IDs).
  const audit = await getAudit(parsed.data.auditId);
  if (!audit) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }

  const ipHash = hashIp(clientIpFromHeaders(request.headers));

  try {
    await saveLead({
      audit_id: parsed.data.auditId,
      email: parsed.data.email,
      company: parsed.data.company ?? null,
      role: parsed.data.role ?? null,
      team_size: parsed.data.teamSize ?? null,
      ip_hash: ipHash,
    });
  } catch (err) {
    console.error("[/api/lead] persist failed:", err);
    return NextResponse.json({ error: "Failed to save lead." }, { status: 500 });
  }

  const result = audit.result;

  // Fire-and-forget emails (don't block the response on SMTP).
  sendAuditConfirmation({ to: parsed.data.email, auditId: parsed.data.auditId, result }).catch(
    (err) => console.warn("[/api/lead] confirmation email failed:", err),
  );
  if (result.ctaTier === "high") {
    notifyCredexHighSavings({
      auditId: parsed.data.auditId,
      email: parsed.data.email,
      company: parsed.data.company,
      result,
    }).catch((err) => console.warn("[/api/lead] credex notify failed:", err));
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
