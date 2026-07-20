// Version: 1.0
// Title: Admin Users API Route | Important Data: GET/DELETE /api/admin/users,
// same signed-cookie admin auth pattern as the other admin routes. GET returns
// every profile (not just pending mentors, unlike /api/admin/mentors). DELETE
// removes the auth.users row via the admin API - profiles cascades
// automatically (on delete cascade), and any of that user's cart_items too.

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
    .from('profiles')
    .select('id, full_name, phone, email, role, college, mentor_approved, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin users fetch error:', error.message);
    return NextResponse.json({ error: 'שגיאה בטעינת המשתמשים.' }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'חסר מזהה משתמש.' }, { status: 400 });

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.error('Admin user delete error:', error.message);
      return NextResponse.json({ error: 'שגיאה במחיקת המשתמש.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin users DELETE error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת.' }, { status: 500 });
  }
}
