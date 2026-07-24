// Version: 1.1
// Title: Tickets API Route | Change from v1.0: FIX - unauthenticated POST
// endpoint had no request limit at all (found during the pre-public-launch
// security review) - now capped at 5 submissions per hour per IP via
// lib/rate-limit.ts. Important Data: POST /api/tickets - writes to the
// "tickets" table via the server-only Supabase client. Basic input sanitization
// (length caps) mirrors the original Code.gs submitTicket() limits.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

function clamp(value: unknown, maxLen: number): string {
  return String(value ?? '').trim().slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkRateLimit(`tickets:${getClientIp(req)}`, 5, 60 * 60);
    if (!allowed) {
      return NextResponse.json({ error: 'יותר מדי פניות. נסה שוב מאוחר יותר.' }, { status: 429 });
    }

    const body = await req.json();

    const subject = clamp(body.subject, 100);
    const description = clamp(body.description, 800);

    if (!subject) {
      return NextResponse.json({ error: 'יש לבחור נושא לפנייה.' }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: 'יש להזין תיאור לפנייה.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('tickets').insert({
      full_name: clamp(body.fullName, 100),
      subject,
      description,
      contact: clamp(body.contact, 150),
      status: 'פתוח',
    });

    if (error) {
      console.error('Supabase ticket insert error:', error.message);
      return NextResponse.json({ error: 'שגיאה בשמירת הפנייה. נסה שוב.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Tickets API error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת. נסה שוב.' }, { status: 500 });
  }
}
