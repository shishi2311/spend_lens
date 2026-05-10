"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface LeadCaptureProps {
  auditId: string;
  /** Tier from the audit — drives copy + Credex CTA. */
  tier: "high" | "low" | "optimal";
}

export function LeadCapture({ auditId, tier }: LeadCaptureProps) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          email,
          company: company || undefined,
          role: role || undefined,
          website,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "Could not save your email. Try again?");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="border-success/40 bg-success/5">
        <CardContent className="flex items-start gap-3 p-6">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" aria-hidden="true" />
          <div>
            <h3 className="font-semibold">You&apos;ll have it in your inbox in a minute.</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {tier === "high"
                ? "Because your audit shows substantial savings, someone from Credex may reach out about discounted credits for the tools you use."
                : "We'll notify you when new optimizations apply to your stack."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const headline =
    tier === "optimal"
      ? "Want a heads-up when new optimizations apply?"
      : tier === "high"
        ? "Email me this report (and let Credex follow up)"
        : "Email me this report";

  const subhead =
    tier === "optimal"
      ? "Your stack is in good shape today. We'll only ping you if that changes."
      : tier === "high"
        ? "We'll send the full audit. For high-savings cases like yours, Credex offers discounted credits — opt in below to talk to the team."
        : "We'll send the full audit and let you know when new optimizations apply.";

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <div className="mb-5 flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <h3 className="font-semibold">{headline}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{subhead}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Email capture form">
          {/* Honeypot — visually hidden but available to bots. */}
          <div className="absolute left-[-9999px]" aria-hidden="true">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="text"
              autoComplete="off"
              tabIndex={-1}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email" className="mb-1 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@startup.com"
              />
            </div>
            <div>
              <Label htmlFor="company" className="mb-1 block">
                Company <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="company"
                type="text"
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role" className="mb-1 block">
              Role <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="role"
              type="text"
              autoComplete="organization-title"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Engineering Manager"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Sending…
              </>
            ) : tier === "optimal" ? (
              "Notify me"
            ) : (
              "Email me this report"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
