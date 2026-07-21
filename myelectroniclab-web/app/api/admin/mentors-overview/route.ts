// Version: 1.0
// Title: Admin Mentors Overview API Route | Important Data: distinct from
// /api/admin/mentors (which only handles PENDING mentor approval). This one
// lists every APPROVED mentor with the classes they created and each
// class's student roster - powers the new "מנחים" admin section. Built with
// separate queries + server-side joining rather than PostgREST embedding,
// since mentor_class_students.student_id references auth.users, not
// public.profiles (no FK for embedding to use - same reason as the mentor
// class detail page's roster query).

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

  const { data: mentors } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, created_at')
    .eq('role', 'mentor')
    .eq('mentor_approved', true)
    .order('full_name', { ascending: true });

  const { data: classes } = await supabase
    .from('mentor_classes')
    .select('id, mentor_id, class_name, join_code, created_at')
    .order('created_at', { ascending: false });

  const { data: roster } = await supabase.from('mentor_class_students').select('class_id, student_id');

  const studentIds = Array.from(new Set((roster ?? []).map((r) => r.student_id)));
  const { data: studentProfiles } = studentIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', studentIds)
    : { data: [] as { id: string; full_name: string; email: string }[] };

  const studentById = new Map((studentProfiles ?? []).map((s) => [s.id, s]));

  const result = (mentors ?? []).map((mentor) => {
    const mentorClasses = (classes ?? [])
      .filter((c) => c.mentor_id === mentor.id)
      .map((c) => {
        const studentIdsInClass = (roster ?? []).filter((r) => r.class_id === c.id).map((r) => r.student_id);
        const students = studentIdsInClass.map((id) => studentById.get(id)).filter(Boolean);
        return {
          id: c.id,
          class_name: c.class_name,
          join_code: c.join_code,
          created_at: c.created_at,
          students,
        };
      });

    return { ...mentor, classes: mentorClasses };
  });

  return NextResponse.json({ mentors: result });
}
