/**
 * POST /api/summary
 * Body: { auditId }
 *
 * Generates the AI-written 100-word summary for an audit, persists it back
 * to the row so subsequent loads don't re-call Anthropic, and returns it.
 *
 * Idempotent: if `summary` is already set on the row, return it as-is.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAudit, updateSummary } from "@/lib/audits/storage";
import { generateSummary, templatedSummary } from "@/lib/anthropic/summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  auditId: z.string().min(1).max(64),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const audit = await getAudit(parsed.data.auditId);
  if (!audit) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }

  if (audit.summary && audit.summary.length > 0) {
    return NextResponse.json({ summary: audit.summary, cached: true });
  }

  let summary: string;
  try {
    summary = await generateSummary(audit.result);
  } catch (err) {
    console.warn("[/api/summary] generateSummary threw, using template:", err);
    summary = templatedSummary(audit.result);
  }

  // Persist best-effort — don't fail the response on a write error.
  try {
    await updateSummary(parsed.data.auditId, summary);
  } catch (err) {
    console.warn("[/api/summary] failed to persist summary:", err);
  }

  return NextResponse.json({ summary, cached: false });
}
