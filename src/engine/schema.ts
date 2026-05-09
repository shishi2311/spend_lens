/**
 * Zod schemas for AuditInput. Used at the API boundary so the engine can
 * trust its input is the right shape without redundant runtime checks.
 */

import { z } from "zod";
import { PRICING } from "./pricing";
import type { Tool } from "./types";

const TOOL_SLUGS = Object.keys(PRICING) as Tool[];

export const toolEntrySchema = z
  .object({
    tool: z.enum(TOOL_SLUGS as [Tool, ...Tool[]]),
    plan: z.string().min(1),
    monthlySpend: z.number().min(0).max(1_000_000),
    seats: z.number().int().min(1).max(10_000),
  })
  .refine((entry) => PRICING[entry.tool].some((p) => p.slug === entry.plan), {
    message: "Plan does not exist for this tool.",
    path: ["plan"],
  });

export const auditInputSchema = z.object({
  tools: z.array(toolEntrySchema).min(1).max(8),
  teamSize: z.number().int().min(1).max(10_000),
  useCase: z.enum(["coding", "writing", "data", "research", "mixed"]),
});

export const leadInputSchema = z.object({
  auditId: z.string().min(1).max(64),
  email: z.string().email().max(254),
  company: z.string().max(120).optional(),
  role: z.string().max(80).optional(),
  teamSize: z.number().int().min(1).max(10_000).optional(),
  /** Honeypot — must be empty. Bots fill all fields. */
  website: z.string().max(0).optional().or(z.literal("")),
});
