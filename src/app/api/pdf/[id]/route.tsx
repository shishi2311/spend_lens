/**
 * GET /api/pdf/[id]
 * Renders the audit as a downloadable PDF using @react-pdf/renderer.
 */

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAudit } from "@/lib/audits/storage";
import { AuditPdf } from "@/lib/pdf/audit-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const audit = await getAudit(id);
  if (!audit) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }

  const buffer = await renderToBuffer(<AuditPdf auditId={audit.id} result={audit.result} />);
  // Copy into a fresh ArrayBuffer — sidesteps the lib-dom vs lib-node
  // BodyInit type drift (Node's Buffer reports ArrayBufferLike, DOM expects
  // ArrayBuffer concretely).
  const ab = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(ab).set(buffer);

  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="spendlens-audit-${audit.id}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
