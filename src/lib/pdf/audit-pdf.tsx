/**
 * Server-side PDF rendering of an audit report.
 *
 * Uses @react-pdf/renderer to build the PDF tree without headless Chrome.
 * Trade-off: limited styling (Tailwind doesn't apply); we hand-style with the
 * library's primitives for a clean, professional one-page layout.
 */

import * as React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { TOOL_LABEL } from "@/engine/pricing";
import type { AuditResult, RecommendationKind } from "@/engine/types";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#0f172a",
    lineHeight: 1.5,
  },
  brand: {
    fontSize: 14,
    color: "#10b981",
    fontFamily: "Helvetica-Bold",
    marginBottom: 24,
  },
  hero: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  subhero: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
    marginBottom: 10,
    color: "#0f172a",
  },
  findingRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 12,
    marginBottom: 12,
  },
  findingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  toolLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  savings: {
    fontSize: 12,
    color: "#10b981",
    fontFamily: "Helvetica-Bold",
  },
  metaLine: {
    color: "#64748b",
    fontSize: 10,
    marginBottom: 4,
  },
  reason: {
    fontSize: 11,
    color: "#1e293b",
  },
  citations: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 36,
    left: 48,
    right: 48,
    fontSize: 9,
    color: "#94a3b8",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const RECOMMENDATION_LABEL: Record<RecommendationKind, string> = {
  downgrade_plan: "Downgrade plan",
  switch_tool: "Switch tool",
  use_credits: "Buy via Credex credits",
  already_optimal: "Already optimal",
};

function fmt(n: number, p: number = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: p,
    maximumFractionDigits: p,
  }).format(n);
}

export function AuditPdf({ result, auditId }: { result: AuditResult; auditId: string }) {
  const generated = new Date().toISOString().slice(0, 10);
  return (
    <Document title={`SpendLens Audit ${auditId}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>SpendLens · AI spend audit</Text>

        <Text style={styles.hero}>
          {result.totalMonthlySavings > 0
            ? `${fmt(result.totalMonthlySavings)}/mo in potential savings`
            : "You're spending well on AI tools."}
        </Text>
        {result.totalMonthlySavings > 0 && (
          <Text style={styles.subhero}>{fmt(result.totalAnnualSavings)} per year if acted on.</Text>
        )}

        <Text style={styles.sectionTitle}>Per-tool breakdown</Text>
        {result.findings.map((f, i) => (
          <View key={i} style={styles.findingRow}>
            <View style={styles.findingHeader}>
              <Text style={styles.toolLabel}>{TOOL_LABEL[f.tool]}</Text>
              <Text style={styles.savings}>
                {f.recommendation === "already_optimal"
                  ? "—"
                  : `+${fmt(f.monthlySavings, 2)}/mo`}
              </Text>
            </View>
            <Text style={styles.metaLine}>
              Currently {fmt(f.currentSpend)}/mo → {RECOMMENDATION_LABEL[f.recommendation]}
              {f.recommendation !== "already_optimal" &&
                ` (~${fmt(f.recommendedSpend, 2)}/mo recommended)`}
            </Text>
            <Text style={styles.reason}>{f.reason}</Text>
            {f.citations.length > 0 && (
              <Text style={styles.citations}>Sources: {f.citations.join("  ·  ")}</Text>
            )}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>Generated {generated} · spendlens · credex.rocks</Text>
          <Text>Audit ID {auditId}</Text>
        </View>
      </Page>
    </Document>
  );
}
