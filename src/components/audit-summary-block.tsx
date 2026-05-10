"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  auditId: string;
  /** If pre-rendered (e.g. from server with cached summary), pass it here. */
  initial?: string | null;
}

export function AuditSummaryBlock({ auditId, initial }: Props) {
  const [summary, setSummary] = useState<string | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auditId }),
        });
        if (!res.ok) {
          if (!cancelled) setError("Could not load summary.");
          return;
        }
        const data = (await res.json()) as { summary: string };
        if (!cancelled) setSummary(data.summary);
      } catch {
        if (!cancelled) setError("Could not load summary.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auditId, initial]);

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        Summary temporarily unavailable. The audit findings above are the same regardless.
      </p>
    );
  }

  if (!summary) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-muted-foreground"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Generating personalized summary…
      </div>
    );
  }

  return (
    <p className="text-base leading-relaxed text-foreground/90 animate-fade-in-up">{summary}</p>
  );
}
