/**
 * Audit storage adapter. Routes everything to Supabase when configured,
 * falls back to a filesystem cache under `.next/cache/spendlens-audits/`
 * when not. Lets local dev work end-to-end without registering Supabase —
 * production keeps the same API and uses the real database.
 *
 * The fallback is dev-only by design:
 *   - It uses local files. Doesn't survive a Vercel cold-start.
 *   - It has no RLS, no anon-vs-service distinction.
 *   - It logs a one-time warning when used.
 *
 * Anything written through this adapter is readable through it. Always.
 */

import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { anonClient, serviceClient } from "@/lib/supabase/server";
import type { AuditInput, AuditResult } from "@/engine/types";

export interface AuditRow {
  id: string;
  input: AuditInput;
  result: AuditResult;
  summary: string | null;
  created_at: string;
}

export interface LeadRow {
  audit_id: string;
  email: string;
  company?: string | null;
  role?: string | null;
  team_size?: number | null;
  ip_hash?: string | null;
}

const LOCAL_AUDITS_DIR = path.join(process.cwd(), ".next", "cache", "spendlens-audits");
const LOCAL_LEADS_FILE = path.join(process.cwd(), ".next", "cache", "spendlens-leads.jsonl");

let warned = false;
function warnLocal(reason: string): void {
  if (warned) return;
  warned = true;
  console.warn(
    `[storage] ${reason}. Falling back to local filesystem cache (${LOCAL_AUDITS_DIR}). ` +
      `Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local for real persistence.`,
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

async function ensureLocalDir(): Promise<void> {
  await fs.mkdir(LOCAL_AUDITS_DIR, { recursive: true });
}

export async function saveAudit(row: AuditRow): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { error } = await supabase.from("audits").insert({
      id: row.id,
      input: row.input,
      result: row.result,
      summary: row.summary,
    });
    if (error) throw error;
    return;
  }
  warnLocal("Supabase not configured");
  await ensureLocalDir();
  await fs.writeFile(
    path.join(LOCAL_AUDITS_DIR, `${row.id}.json`),
    JSON.stringify(row, null, 2),
    "utf-8",
  );
}

export async function getAudit(id: string): Promise<AuditRow | null> {
  // Always try Supabase first if configured. Misconfigurations (e.g. wrong key)
  // surface as a thrown error from the SDK; we treat that as "not found" and
  // log it — dev experience is preserved without masking real issues in prod.
  if (isSupabaseConfigured()) {
    try {
      const supabase = anonClient();
      const { data, error } = await supabase
        .from("audits")
        .select("id, input, result, summary, created_at")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return null;
      return data as AuditRow;
    } catch (err) {
      console.warn("[storage] supabase getAudit failed:", err);
      return null;
    }
  }
  try {
    const buf = await fs.readFile(path.join(LOCAL_AUDITS_DIR, `${id}.json`), "utf-8");
    return JSON.parse(buf) as AuditRow;
  } catch {
    return null;
  }
}

export async function updateSummary(id: string, summary: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { error } = await supabase.from("audits").update({ summary }).eq("id", id);
    if (error) throw error;
    return;
  }
  // Local fallback — re-read, patch, re-write.
  const filePath = path.join(LOCAL_AUDITS_DIR, `${id}.json`);
  try {
    const buf = await fs.readFile(filePath, "utf-8");
    const row = JSON.parse(buf) as AuditRow;
    row.summary = summary;
    await fs.writeFile(filePath, JSON.stringify(row, null, 2), "utf-8");
  } catch (err) {
    console.warn(`[storage] local updateSummary failed for ${id}:`, err);
  }
}

export async function saveLead(lead: LeadRow): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { error } = await supabase.from("leads").insert({
      audit_id: lead.audit_id,
      email: lead.email,
      company: lead.company ?? null,
      role: lead.role ?? null,
      team_size: lead.team_size ?? null,
      ip_hash: lead.ip_hash ?? null,
    });
    if (error) throw error;
    return;
  }
  warnLocal("Supabase not configured (lead capture)");
  await fs.mkdir(path.dirname(LOCAL_LEADS_FILE), { recursive: true });
  await fs.appendFile(
    LOCAL_LEADS_FILE,
    JSON.stringify({ ...lead, created_at: new Date().toISOString() }) + "\n",
    "utf-8",
  );
}
