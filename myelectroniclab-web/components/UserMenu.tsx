// Version: 1.6
// Title: User Menu (Header) | Change from v1.5: added a colored dot on the
// avatar for students - red = something overdue (unfinished class assignment
// or personal task past its due date), yellow = unread mentor message or any
// unfinished task/assignment without being overdue yet, green = all clear.
// Only shown if the student has joined at least one class. Important Data:
// client component placed in AppShell's HeaderNav, next to the cart button -
// the header itself is `sticky top-0`, so this avatar stays visible on
// scroll without extra positioning. Reads the Supabase auth session
// client-side, then fetches the matching profiles row - RLS already permits
// a user to select their own row. Subscribes to onAuthStateChange so the menu
// updates immediately after login/logout without a full page reload.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';
import { getAvatarIcon } from '@/lib/avatar-icons';

type Profile = { full_name: string; avatar_icon: string; role: 'student' | 'mentor'; mentor_approved: boolean };
type DotColor = 'red' | 'yellow' | 'green' | null;

const DOT_CLASS: Record<'red' | 'yellow' | 'green', string> = {
  red: 'bg-red-500',
  yellow: 'bg-amber-400',
  green: 'bg-green-500',
};

async function computeStudentDot(userId: string): Promise<DotColor> {
  const supabase = getSupabaseAuthClient();
  const today = new Date(new Date().toDateString());

  const { data: memberships } = await supabase
    .from('mentor_class_students')
    .select('class_id, student_last_read_at')
    .eq('student_id', userId);
  if (!memberships || memberships.length === 0) return null;

  const classIds = memberships.map((m) => m.class_id);

  const [{ data: mentorMsgs }, { data: assignments }, { data: completions }, { data: tasks }] = await Promise.all([
    supabase.from('personal_notes').select('class_id, created_at').eq('student_id', userId).eq('sender', 'mentor').in('class_id', classIds),
    supabase.from('class_assignments').select('id, class_id, due_date').eq('archived', false).in('class_id', classIds),
    supabase.from('assignment_completions').select('assignment_id').eq('student_id', userId),
    supabase.from('personal_notes').select('due_date').eq('student_id', userId).eq('note_type', 'task').eq('completed', false),
  ]);

  const readAtByClass = new Map(memberships.map((m) => [m.class_id, m.student_last_read_at as string | null]));
  const hasUnreadMessage = (mentorMsgs ?? []).some((n) => {
    const readAt = readAtByClass.get(n.class_id);
    return !readAt || new Date(n.created_at) > new Date(readAt);
  });

  const completedIds = new Set((completions ?? []).map((c) => c.assignment_id));
  const pendingAssignments = (assignments ?? []).filter((a) => !completedIds.has(a.id));
  const pendingTasks = tasks ?? [];

  const hasOverdue =
    pendingAssignments.some((a) => a.due_date && new Date(a.due_date) < today) ||
    pendingTasks.some((t) => t.due_date && new Date(t.due_date) < today);

  const hasPending = hasUnreadMessage || pendingAssignments.length > 0 || pendingTasks.length > 0;

  if (hasOverdue) return 'red';
  if (hasPending) return 'yellow';
  return 'green';
}

export default function UserMenu() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasClass, setHasClass] = useState(false);
  const [dot, setDot] = useState<DotColor>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseAuthClient();

    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_icon, role, mentor_approved')
        .eq('id', userId)
        .maybeSingle();
      setProfile(data);

      if (data?.role === 'student') {
        const { count } = await supabase
          .from('mentor_class_students')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', userId);
        setHasClass((count ?? 0) > 0);
        setDot(await computeStudentDot(userId));
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) loadProfile(data.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseAuthClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-brand-cardbg/60" />;
  }

  if (!profile) {
    return (
      <a
        href="/login"
        className="flex shrink-0 items-center gap-2 rounded-full bg-brand-cardbg px-4 py-3 text-base font-bold text-brand-text shadow-md transition hover:brightness-95 sm:px-6 sm:text-lg"
      >
        <Icon icon="solar:login-2-bold" width={22} />
        <span>התחברות</span>
      </a>
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        title={profile.full_name}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand-cardbg shadow-md ring-2 ring-brand-picture transition hover:brightness-95"
      >
        <Icon icon={getAvatarIcon(profile.avatar_icon)} width={24} className="text-brand-text" />
        {dot && <span className={`absolute -left-0.5 -top-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-brand-cardbg ${DOT_CLASS[dot]}`} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-2 w-52 rounded-xl bg-brand-cardbg p-2 shadow-2xl ring-1 ring-black/5">
            <div className="truncate px-3 py-2 text-sm font-bold text-brand-text">{profile.full_name}</div>
            <a
              href="/profile"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-text hover:bg-brand-bg"
            >
              <Icon icon="solar:user-id-bold" width={18} />
              הפרופיל שלי
            </a>

            {profile.role === 'student' && (
              <>
                <a
                  href="/my-project"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-text hover:bg-brand-bg"
                >
                  <Icon icon="solar:flag-bold" width={18} />
                  הפרויקט שלי
                </a>
                <a
                  href={hasClass ? '/my-class' : '/join-class'}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-brand-text hover:bg-brand-bg"
                >
                  <span className="flex items-center gap-2">
                    <Icon icon={hasClass ? 'solar:users-group-rounded-bold' : 'solar:users-group-two-rounded-bold'} width={18} />
                    {hasClass ? 'הכיתה שלי' : 'הצטרפות לכיתה'}
                  </span>
                  {dot && <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[dot]}`} />}
                </a>
              </>
            )}

            {profile.role === 'mentor' && profile.mentor_approved && (
              <a
                href="/mentor"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-text hover:bg-brand-bg"
              >
                <Icon icon="solar:presentation-graph-bold" width={18} />
                לוח בקרה - מנחה
              </a>
            )}

            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-brand-bg"
            >
              <Icon icon="solar:logout-2-bold" width={18} />
              התנתקות
            </button>
          </div>
        </>
      )}
    </div>
  );
}
