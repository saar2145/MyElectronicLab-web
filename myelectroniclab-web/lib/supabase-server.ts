// Version: 1.0
// Title: Supabase Server Client | Important Data: SERVER-ONLY - uses
// SUPABASE_SECRET_KEY (no NEXT_PUBLIC_ prefix, never reaches the browser bundle).
// Unlike Google Apps Script, Vercel/Node.js has no restriction preventing use of
// the new sb_secret_... key format (the User-Agent-based block that affected GAS
// does not apply here) - so we use the modern secret key directly.

import { createClient } from '@supabase/supabase-js';

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      'Missing SUPABASE_SECRET_KEY or NEXT_PUBLIC_SUPABASE_URL. ' +
      'Set SUPABASE_SECRET_KEY in Vercel → Settings → Environment Variables ' +
      '(the sb_secret_... key from Supabase → Settings → API Keys).'
    );
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false },
  });
}
