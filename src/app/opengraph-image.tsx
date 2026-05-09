import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "SpendLens — A second opinion on your AI bill";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          background:
            "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#064e3b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 13,
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: 28,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>SpendLens</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: "auto",
            marginBottom: 40,
          }}
        >
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
            A second opinion on
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -2,
              color: "#047857",
            }}
          >
            your AI bill.
          </div>
          <div style={{ fontSize: 28, color: "#065f46", maxWidth: 900, marginTop: 12 }}>
            Instant audit of your startup&apos;s AI tool spend. Defensible, citation-backed
            recommendations. No login.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
