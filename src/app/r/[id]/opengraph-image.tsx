import { ImageResponse } from "next/og";
import { getAudit } from "@/lib/audits/storage";
import { TOOL_LABEL } from "@/engine/pricing";
import type { AuditResult } from "@/engine/types";

export const runtime = "nodejs";
export const alt = "SpendLens audit result";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function Image({ params }: { params: { id: string } }) {
  let result: AuditResult | null = null;
  try {
    const row = await getAudit(params.id);
    result = row?.result ?? null;
  } catch (err) {
    console.warn("[/r/[id]/og] fetch failed, rendering placeholder:", err);
  }

  const monthly = result ? formatUSD(result.totalMonthlySavings) : "—";
  const annual = result ? formatUSD(result.totalAnnualSavings) : "—";
  const tools = result
    ? Array.from(new Set(result.findings.map((f) => TOOL_LABEL[f.tool]))).slice(0, 5).join(" · ")
    : "Audit not found";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px",
          background:
            "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#064e3b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>SpendLens</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: "auto",
          }}
        >
          <div style={{ fontSize: 28, color: "#047857", fontWeight: 600 }}>
            {result && result.totalMonthlySavings > 0
              ? "AI tool spend audit · monthly savings"
              : "AI tool spend audit"}
          </div>
          <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
            {monthly}
            <span style={{ fontSize: 56, fontWeight: 600, color: "#047857" }}> /mo</span>
          </div>
          <div style={{ fontSize: 32, color: "#065f46" }}>
            {result && result.totalMonthlySavings > 0
              ? `${annual} per year if acted on`
              : "You're spending well — full audit inside"}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#065f46",
              opacity: 0.85,
              marginTop: 24,
              maxWidth: 1000,
            }}
          >
            {tools}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 64,
            right: 64,
            fontSize: 22,
            color: "#047857",
            fontWeight: 500,
          }}
        >
          spendlens · credex.rocks
        </div>
      </div>
    ),
    { ...size },
  );
}
