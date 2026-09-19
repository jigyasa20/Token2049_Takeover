import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key, so it must never be imported
// from a Client Component. RLS stays on and blocks direct anon access.
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}
