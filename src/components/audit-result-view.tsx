import Link from "next/link";
import { ArrowDownRight, ArrowRight, ExternalLink, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TOOL_LABEL } from "@/engine/pricing";
import type { AuditResult, RecommendationKind } from "@/engine/types";
import { cn, formatCurrency } from "@/lib/utils";
import { LeadCapture } from "./lead-capture";
import { AuditSummaryBlock } from "./audit-summary-block";

const RECOMMENDATION_LABEL: Record<RecommendationKind, string> = {
  downgrade_plan: "Downgrade plan",
  switch_tool: "Switch tool",
  use_credits: "Buy via Credex credits",
  already_optimal: "Already optimal",
};

interface Props {
  auditId: string;
  result: AuditResult;
  /** Server-fetched cached summary, if any. */
  cachedSummary?: string | null;
}

export function AuditResultView({ auditId, result, cachedSummary = null }: Props) {
  const hasFindings = result.findings.some((f) => f.recommendation !== "already_optimal");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Your audit
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          {hasFindings ? (
            <>
              You could save{" "}
              <span className="text-primary">{formatCurrency(result.totalMonthlySavings)}</span>{" "}
              <span className="text-2xl font-semibold text-muted-foreground sm:text-3xl">/mo</span>
            </>
          ) : (
            <>You&apos;re spending well.</>
          )}
        </h1>
        {hasFindings && (
          <p className="text-lg text-muted-foreground">
            That&apos;s {formatCurrency(result.totalAnnualSavings)} per year if you act on every
            finding below.
          </p>
        )}
      </header>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 sm:p-8">
          <AuditSummaryBlock auditId={auditId} initial={cachedSummary} />
        </CardContent>
      </Card>

      <section aria-label="Per-tool breakdown" className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Per-tool breakdown</h2>
        <ul className="space-y-3">
          {result.findings.map((f, i) => {
            const isOptimal = f.recommendation === "already_optimal";
            return (
              <li key={`${f.tool}-${i}`}>
                <Card className={cn(!isOptimal && "border-l-4 border-l-primary")}>
                  <CardContent className="grid gap-4 p-5 sm:grid-cols-12 sm:p-6">
                    <div className="sm:col-span-3">
                      <p className="text-sm text-muted-foreground">Tool</p>
                      <p className="mt-1 font-semibold">{TOOL_LABEL[f.tool]}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Currently {formatCurrency(f.currentSpend)}/mo
                      </p>
                    </div>
                    <div className="sm:col-span-3">
                      <p className="text-sm text-muted-foreground">Recommendation</p>
                      <p className="mt-1 inline-flex items-center gap-1 font-semibold">
                        {!isOptimal && <ArrowDownRight className="h-4 w-4 text-primary" aria-hidden="true" />}
                        {RECOMMENDATION_LABEL[f.recommendation]}
                      </p>
                      {!isOptimal && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Recommended ~{formatCurrency(f.recommendedSpend, { precision: 2 })}/mo
                        </p>
                      )}
                    </div>
                    <div className="sm:col-span-3">
                      <p className="text-sm text-muted-foreground">Monthly savings</p>
                      <p
                        className={cn(
                          "mt-1 text-2xl font-bold tabular-nums",
                          !isOptimal ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {formatCurrency(f.monthlySavings, { precision: 2 })}
                      </p>
                    </div>
                    <div className="sm:col-span-12">
                      <p className="text-sm leading-relaxed text-foreground/80">{f.reason}</p>
                      {f.citations.length > 0 && (
                        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          {f.citations.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              {new URL(url).hostname.replace("www.", "")}
                            </a>
                          ))}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      {result.ctaTier === "high" && (
        <Card className="border-primary/40 bg-primary text-primary-foreground">
          <CardContent className="space-y-3 p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-wider opacity-80">
              You&apos;re leaving real money on the table
            </p>
            <h2 className="text-balance text-2xl font-bold sm:text-3xl">
              Capture {formatCurrency(result.totalMonthlySavings)}/mo with discounted Credex
              credits.
            </h2>
            <p className="text-balance text-sm opacity-95 sm:text-base">
              Credex sources real, discounted credits for the same tools you&apos;re paying retail
              for — Cursor, Claude, Copilot, ChatGPT and more. Same usage, lower bill.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
            >
              <a href="https://credex.rocks" target="_blank" rel="noopener noreferrer">
                Talk to Credex <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      <LeadCapture auditId={auditId} tier={result.ctaTier} />

      <div className="flex flex-wrap items-center gap-3 border-t pt-6 text-sm">
        <Link href="/" className="text-muted-foreground hover:underline">
          ← Audit a different stack
        </Link>
        <span className="text-muted-foreground">·</span>
        <a
          href={`/api/pdf/${auditId}`}
          className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
        >
          <FileText className="h-3 w-3" aria-hidden="true" /> Export as PDF
        </a>
      </div>
    </div>
  );
}
