/**
 * POST /api/audit
 * - Validates input via Zod
 * - Rate-limits by IP (Upstash sliding window)
 * - Runs the pure audit engine (no I/O inside it)
 * - Persists the audit row in Supabase
 * - Returns the audit id for redirect to /r/[id]
 */

import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { runAudit } from "@/engine/audit";
import { auditInputSchema } from "@/engine/schema";
import { saveAudit } from "@/lib/audits/storage";
import { checkAuditRateLimit, clientIpFromHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// URL-safe alphabet, 10 chars → ~64 bits of entropy. Plenty for unguessable
// share URLs without padding to 21 chars.
const newId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const limit = await checkAuditRateLimit(ip);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many audits from your IP. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = auditInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const result = runAudit(parsed.data);
  const id = newId();

  try {
    await saveAudit({
      id,
      input: parsed.data,
      result,
      summary: null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/audit] persist failed:", err);
    return NextResponse.json({ error: "Failed to persist audit." }, { status: 500 });
  }

  return NextResponse.json({ id, result }, { status: 201 });
}
