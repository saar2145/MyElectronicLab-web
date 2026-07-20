// Version: 1.4
// Title: User Menu (Header) | Change from v1.3: the class-related link for
// students now checks membership (mentor_class_students, self-select RLS
// policy) and swaps label/icon - "הצטרפות לכיתה" before joining, "הכיתה שלי"
// after. Both point to /join-class, which itself branches on membership (see
// that page's v1.2 notes). Important Data: client component placed in
// AppShell's HeaderNav, next to the cart button - the header itself is
// `sticky top-0`, so this avatar stays visible on scroll without extra
// positioning. Reads the Supabase auth session client-side, then fetches the
// matching profiles row - RLS already permits a user to select their own row.
// Subscribes to onAuthStateChange so the menu updates immediately after
// login/logout without a full page reload.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';
import { getAvatarIcon } from '@/lib/avatar-icons';

type Profile = { full_name: string; avatar_icon: string; role: 'student' | 'mentor'; mentor_approved: boolean };

export default function UserMenu() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasClass, setHasClass] = useState(false);
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
        className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-cardbg shadow-md ring-2 ring-brand-picture transition hover:brightness-95"
      >
        <Icon icon={getAvatarIcon(profile.avatar_icon)} width={24} className="text-brand-text" />
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
                  href="/join-class"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-text hover:bg-brand-bg"
                >
                  <Icon icon={hasClass ? 'solar:users-group-rounded-bold' : 'solar:users-group-two-rounded-bold'} width={18} />
                  {hasClass ? 'הכיתה שלי' : 'הצטרפות לכיתה'}
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
