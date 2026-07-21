// Version: 1.1
// Title: Admin Users API Route | Change from v1.0: GET now also returns
// whether each user's email is verified (email_confirmed_at from
// auth.users, via supabase.auth.admin.listUsers - profiles has no such
// column, only auth.users does). Fetches up to 1000 users in one page; if
// the user base ever exceeds that, this needs pagination added. Important
// Data: same signed-cookie admin auth pattern as the other admin routes.
// GET returns every profile (not just pending mentors, unlike
// /api/admin/mentors). DELETE removes the auth.users row via the admin API -
// profiles cascades automatically (on delete cascade), and any of that
// user's cart_items too.

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

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    console.error('Admin users auth fetch error:', authError.message);
    // לא קריטי - עדיף להחזיר את הרשימה בלי "מאומת" מאשר לא להחזיר כלום
    return NextResponse.json({ users: (data ?? []).map((u) => ({ ...u, email_verified: null })) });
  }

  const verifiedById = new Map(authData.users.map((u) => [u.id, !!u.email_confirmed_at]));
  const users = (data ?? []).map((u) => ({ ...u, email_verified: verifiedById.get(u.id) ?? null }));

  return NextResponse.json({ users });
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
