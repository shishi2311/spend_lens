/**
 * Server-side Supabase clients. Two flavors:
 *
 *  - `serviceClient()`: bypasses RLS via the service role key. Used for
 *    inserting audits + leads. NEVER call from a client component.
 *  - `anonClient()`: respects RLS. Used for reads from `audits` (which RLS
 *    allows) but not from `leads`. Safe to call from server components.
 */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env";

let _service: SupabaseClient | null = null;
let _anon: SupabaseClient | null = null;

export function serviceClient(): SupabaseClient {
  if (!_service) {
    _service = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _service;
}

export function anonClient(): SupabaseClient {
  if (!_anon) {
    _anon = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _anon;
}
