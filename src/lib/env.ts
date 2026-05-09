/**
 * Server-side env access with explicit typing. Throws at first use of a
 * missing required var rather than failing silently with `undefined` deep in
 * a code path. Client code never imports this module.
 */

import "server-only";

class MissingEnvError extends Error {
  constructor(name: string) {
    super(
      `Missing environment variable: ${name}. Add it to .env.local (see .env.example) or your deployment provider's env settings.`,
    );
    this.name = "MissingEnvError";
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) throw new MissingEnvError(name);
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get anthropicApiKey() {
    return optional("ANTHROPIC_API_KEY");
  },
  get resendApiKey() {
    return optional("RESEND_API_KEY");
  },
  get resendFromEmail() {
    return optional("RESEND_FROM_EMAIL");
  },
  get credexNotifyEmail() {
    return optional("CREDEX_NOTIFY_EMAIL");
  },
  get upstashUrl() {
    return optional("UPSTASH_REDIS_REST_URL");
  },
  get upstashToken() {
    return optional("UPSTASH_REDIS_REST_TOKEN");
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  },
};

export const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
