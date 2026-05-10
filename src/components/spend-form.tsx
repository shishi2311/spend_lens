"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PRICING, TOOL_LABEL } from "@/engine/pricing";
import type { Tool, UseCase } from "@/engine/types";
import { useAuditForm } from "@/lib/store/audit-store";

const TOOLS: Tool[] = [
  "cursor",
  "copilot",
  "claude",
  "chatgpt",
  "anthropic_api",
  "openai_api",
  "gemini",
  "windsurf",
];

const USE_CASES: { value: UseCase; label: string }[] = [
  { value: "coding", label: "Coding / engineering" },
  { value: "writing", label: "Writing / content" },
  { value: "data", label: "Data / analytics" },
  { value: "research", label: "Research" },
  { value: "mixed", label: "Mixed" },
];

export function SpendForm() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tools = useAuditForm((s) => s.tools);
  const teamSize = useAuditForm((s) => s.teamSize);
  const useCase = useAuditForm((s) => s.useCase);
  const updateTool = useAuditForm((s) => s.updateTool);
  const addTool = useAuditForm((s) => s.addTool);
  const removeTool = useAuditForm((s) => s.removeTool);
  const setTeamSize = useAuditForm((s) => s.setTeamSize);
  const setUseCase = useAuditForm((s) => s.setUseCase);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const validTools = tools.filter((t) => t.monthlySpend > 0 || t.tool === "claude" /* free is OK */);
    if (validTools.length === 0) {
      setError("Add at least one tool with a monthly spend.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tools, teamSize, useCase }),
      });

      if (response.status === 429) {
        setError("Too many audits from your network. Try again in a few minutes.");
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "Something went wrong. Please try again.");
        return;
      }

      const data = (await response.json()) as { id: string };
      router.push(`/r/${data.id}`);
    } catch {
      setError("Network error — please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    // Prevent hydration mismatch from Zustand persist rehydration timing.
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="AI spend audit form">
      <Card>
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your AI tools</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                addTool({ tool: "cursor", plan: "pro", monthlySpend: 0, seats: 1 })
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add tool
            </Button>
          </div>

          <ul className="space-y-4" aria-live="polite">
            {tools.map((entry, index) => {
              const plans = PRICING[entry.tool];
              return (
                <li
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-lg border bg-background/50 p-4 sm:grid-cols-12"
                >
                  <div className="sm:col-span-3">
                    <Label htmlFor={`tool-${index}`} className="mb-1 block text-xs">
                      Tool
                    </Label>
                    <Select
                      value={entry.tool}
                      onValueChange={(value) => {
                        const newTool = value as Tool;
                        const firstPlan = PRICING[newTool][0]?.slug ?? "pro";
                        updateTool(index, { tool: newTool, plan: firstPlan });
                      }}
                    >
                      <SelectTrigger id={`tool-${index}`} aria-label="Tool">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TOOLS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TOOL_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3">
                    <Label htmlFor={`plan-${index}`} className="mb-1 block text-xs">
                      Plan
                    </Label>
                    <Select
                      value={entry.plan}
                      onValueChange={(value) => updateTool(index, { plan: value })}
                    >
                      <SelectTrigger id={`plan-${index}`} aria-label="Plan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((p) => (
                          <SelectItem key={p.slug} value={p.slug}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3">
                    <Label htmlFor={`spend-${index}`} className="mb-1 block text-xs">
                      Monthly spend (USD)
                    </Label>
                    <Input
                      id={`spend-${index}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={entry.monthlySpend || ""}
                      onChange={(e) =>
                        updateTool(index, { monthlySpend: Number(e.target.value) || 0 })
                      }
                      placeholder="0"
                      aria-describedby={`spend-${index}-hint`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor={`seats-${index}`} className="mb-1 block text-xs">
                      Seats
                    </Label>
                    <Input
                      id={`seats-${index}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={entry.seats}
                      onChange={(e) =>
                        updateTool(index, { seats: Math.max(1, Number(e.target.value) || 1) })
                      }
                    />
                  </div>

                  <div className="flex items-end justify-end sm:col-span-1">
                    {tools.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTool(index)}
                        aria-label={`Remove ${TOOL_LABEL[entry.tool]}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <Label htmlFor="team-size" className="mb-1 block">
              Team size
            </Label>
            <Input
              id="team-size"
              type="number"
              inputMode="numeric"
              min={1}
              value={teamSize}
              onChange={(e) => setTeamSize(Math.max(1, Number(e.target.value) || 1))}
              aria-describedby="team-size-hint"
            />
            <p id="team-size-hint" className="mt-1 text-xs text-muted-foreground">
              Total people on your team — including those without AI seats.
            </p>
          </div>

          <div>
            <Label htmlFor="use-case" className="mb-1 block">
              Primary use case
            </Label>
            <Select value={useCase} onValueChange={(v) => setUseCase(v as UseCase)}>
              <SelectTrigger id="use-case" aria-label="Primary use case">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USE_CASES.map((uc) => (
                  <SelectItem key={uc.value} value={uc.value}>
                    {uc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          We don&apos;t ask for your email until you&apos;ve seen the audit.
        </p>
        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Auditing…
            </>
          ) : (
            "Get my audit"
          )}
        </Button>
      </div>
    </form>
  );
}
