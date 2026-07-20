// Version: 1.0
// Title: Admin Mentors API Route | Important Data: GET/PATCH /api/admin/mentors,
// same auth pattern as /api/admin/tickets (signed admin_session cookie).
// Uses the service-role client so it bypasses the profiles RLS policies (which
// only let a user read/update their own row) - this is the one place in the
// app that's allowed to see every pending mentor. action: 'approve' sets
// mentor_approved = true; action: 'reject' deletes both the profile row and
// the underlying auth user (via supabase.auth.admin.deleteUser), since a
// rejected mentor signup shouldn't leave an orphaned, permanently-unapproved
// account sitting around.

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
    .select('id, full_name, phone, email, college, created_at')
    .eq('role', 'mentor')
    .eq('mentor_approved', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Admin mentors fetch error:', error.message);
    return NextResponse.json({ error: 'שגיאה בטעינת המנחים הממתינים.' }, { status: 500 });
  }

  return NextResponse.json({ mentors: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { id, action } = await req.json();
    if (!id || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'בקשה לא תקינה.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (action === 'approve') {
      const { error } = await supabase.from('profiles').update({ mentor_approved: true }).eq('id', id);
      if (error) {
        console.error('Mentor approve error:', error.message);
        return NextResponse.json({ error: 'שגיאה באישור המנחה.' }, { status: 500 });
      }
    } else {
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) {
        console.error('Mentor reject (deleteUser) error:', authError.message);
        return NextResponse.json({ error: 'שגיאה בדחיית המנחה.' }, { status: 500 });
      }
      // profiles row is deleted automatically via "on delete cascade" from auth.users
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin mentors PATCH error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת.' }, { status: 500 });
  }
}
