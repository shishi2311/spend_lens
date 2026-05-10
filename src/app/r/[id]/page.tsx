import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAudit } from "@/lib/audits/storage";
import { AuditResultView } from "@/components/audit-result-view";
import { formatCurrency } from "@/lib/utils";
import { TOOL_LABEL } from "@/engine/pricing";
import { PUBLIC_APP_URL } from "@/lib/env";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const audit = await getAudit(id);
  if (!audit) {
    return {
      title: "Audit not found",
      robots: { index: false, follow: false },
    };
  }

  const monthly = formatCurrency(audit.result.totalMonthlySavings);
  const annual = formatCurrency(audit.result.totalAnnualSavings);
  const tools = audit.result.findings.map((f) => TOOL_LABEL[f.tool]).join(", ");
  const title =
    audit.result.totalMonthlySavings > 0
      ? `${monthly}/mo in AI tool savings — SpendLens`
      : `Spending well on AI tools — SpendLens`;
  const description =
    audit.result.totalMonthlySavings > 0
      ? `This audit found ${monthly}/mo (${annual}/yr) in potential savings across ${tools}. Audit yours for free, no login.`
      : `This audit found no significant overspend across ${tools}. Audit yours to compare.`;

  const url = `${PUBLIC_APP_URL}/r/${id}`;
  const ogImage = `${PUBLIC_APP_URL}/r/${id}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: "SpendLens",
      title,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;
  const audit = await getAudit(id);
  if (!audit) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <AuditResultView
        auditId={audit.id}
        result={audit.result}
        cachedSummary={audit.summary}
      />
    </main>
  );
}
