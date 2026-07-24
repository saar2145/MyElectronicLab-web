// Version: 1.0
// Title: Rate Limit Helper | Important Data: SERVER-ONLY. Backed by the
// public.check_rate_limit() Postgres function (supabase_schema migration
// "add_api_rate_limiting") - a single atomic UPSERT, safe under concurrent
// requests (no check-then-increment race). Used by /api/chat, /api/tickets,
// and /api/admin/login, none of which had any request throttling before -
// found during the pre-public-launch security review. Client IP is read from
// the x-forwarded-for header, which Vercel's edge sets/overwrites itself (not
// attacker-controlled on Vercel), falling back to "unknown" only if that
// header is somehow absent (e.g. local dev).

import { NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function checkRateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    // אם הבדיקה עצמה נכשלת (למשל תקלת רשת ל-Supabase), לא חוסמים משתמשים
    // לגיטימיים - עדיף להיכשל "פתוח" כאן ולתעד, מאשר להפיל את כל ה-endpoint
    console.error('Rate limit check failed, allowing request:', error.message);
    return true;
  }
  return data === true;
}
