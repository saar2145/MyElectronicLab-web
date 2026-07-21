// Version: 1.2
// Title: Admin Users API Route | Change from v1.1: GET now also returns
// class_name(s) for each user - joined from mentor_class_students +
// mentor_classes (a student can technically be in more than one class; if
// so, names are joined with ", "). null if not in any class. Important
// Data: same signed-cookie admin auth pattern as the other admin routes. GET
// returns every profile (not just pending mentors, unlike
// /api/admin/mentors). Also returns whether each user's email is verified
// (email_confirmed_at from auth.users, via supabase.auth.admin.listUsers -
// profiles has no such column). Fetches up to 1000 auth users in one page;
// if the user base ever exceeds that, this needs pagination added. DELETE
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

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const verifiedById = authError ? new Map<string, boolean>() : new Map(authData.users.map((u) => [u.id, !!u.email_confirmed_at]));
  if (authError) console.error('Admin users auth fetch error:', authError.message);

  const { data: roster } = await supabase.from('mentor_class_students').select('class_id, student_id');
  const { data: classes } = await supabase.from('mentor_classes').select('id, class_name');
  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.class_name]));

  const classNamesByStudent = new Map<string, string[]>();
  (roster ?? []).forEach((r) => {
    const name = classNameById.get(r.class_id);
    if (!name) return;
    const list = classNamesByStudent.get(r.student_id) ?? [];
    list.push(name);
    classNamesByStudent.set(r.student_id, list);
  });

  const users = (data ?? []).map((u) => ({
    ...u,
    email_verified: authError ? null : (verifiedById.get(u.id) ?? false),
    class_name: (classNamesByStudent.get(u.id) ?? []).join(', ') || null,
  }));

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
