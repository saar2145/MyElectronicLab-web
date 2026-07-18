// Version: 1.0
// Title: Admin Tickets API Route | Important Data: GET/PATCH /api/admin/tickets,
// both require a valid signed admin_session cookie (see lib/admin-auth.ts).

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value;
  return verifySessionToken(token);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('id, created_at, full_name, subject, description, contact, status, notes')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin tickets fetch error:', error.message);
    return NextResponse.json({ error: 'שגיאה בטעינת הפניות.' }, { status: 500 });
  }

  return NextResponse.json({ tickets: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { id, status, notes } = await req.json();
    if (!id) return NextResponse.json({ error: 'חסר מזהה פנייה.' }, { status: 400 });

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from('tickets')
      .update({ status, notes: String(notes ?? '').slice(0, 1000) })
      .eq('id', id);

    if (error) {
      console.error('Admin ticket update error:', error.message);
      return NextResponse.json({ error: 'שגיאה בעדכון הפנייה.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin ticket PATCH error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת.' }, { status: 500 });
  }
}
