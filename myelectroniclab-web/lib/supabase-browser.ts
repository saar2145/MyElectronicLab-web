// Version: 1.0
// Title: Supabase Auth Browser Client | Important Data: separate from lib/supabase.ts
// (a plain anon client used inside a Server Component to read products - no cookies
// involved). This client uses @supabase/ssr's createBrowserClient so auth sessions
// persist via cookies instead of localStorage, staying in sync with middleware.ts and
// any future server-side session reads. Only import this from 'use client' files.

import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createBrowserClient(url, key);
}
