// Version: 1.1
// Title: Profile Page | Change from v1.0: avatar picker now shows all 27
// icons in a dense grid instead of 9 large buttons - see lib/avatar-icons.ts
// v2.0. Important Data: shows all profile fields for the logged-in user
// (name, phone, email, gender, role, college, mentor_approved) and lets them
// change their avatar_icon (updates profiles table directly - RLS's
// profiles_update_own policy permits this). Redirects to /login if no
// session. Read-only for now on the other fields (name/phone/etc. editing is
// not part of this pass - only avatar changes are wired to save).

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';
import { AVATAR_ICONS } from '@/lib/avatar-icons';

type Profile = {
  full_name: string;
  phone: string;
  email: string;
  gender: string;
  role: 'student' | 'mentor';
  college: string;
  mentor_approved: boolean;
  avatar_icon: string;
};

const rowClass = 'flex items-center justify-between border-b border-brand-category py-3 last:border-0';
const labelClass = 'text-sm text-brand-textsoft';
const valueClass = 'text-sm font-bold text-brand-text';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseAuthClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/login');
        return;
      }
      const { data: row } = await supabase
        .from('profiles')
        .select('full_name, phone, email, gender, role, college, mentor_approved, avatar_icon')
        .eq('id', data.user.id)
        .maybeSingle();
      setProfile(row);
      setLoading(false);
    });
  }, [router]);

  async function handleAvatarChange(key: string) {
    if (!profile) return;
    setSavingAvatar(true);
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('profiles').update({ avatar_icon: key }).eq('id', userData.user.id);
      setProfile({ ...profile, avatar_icon: key });
    }
    setSavingAvatar(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg" dir="rtl">
        <Icon icon="solar:refresh-bold" width={28} className="animate-spin text-brand-textsoft" />
      </div>
    );
  }

  if (!profile) return null;

  const roleLabel = profile.role === 'mentor' ? 'מנחה' : 'סטודנט';

  return (
    <div className="min-h-screen bg-brand-bg p-4" dir="rtl">
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => router.push('/')}
          className="mb-4 flex items-center gap-1 text-sm font-bold text-brand-linktext hover:underline"
        >
          <Icon icon="solar:arrow-right-linear" width={18} />
          חזרה לקטלוג
        </button>

        <div className="rounded-2xl bg-brand-cardbg p-6 shadow-lg">
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-picture ring-4 ring-brand-name">
              <Icon icon={AVATAR_ICONS.find((a) => a.key === profile.avatar_icon)?.icon ?? AVATAR_ICONS[0].icon} width={40} className="text-brand-text" />
            </div>
            <h1 className="text-lg font-bold text-brand-text">{profile.full_name}</h1>
            {profile.role === 'mentor' && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  profile.mentor_approved ? 'bg-green-500/15 text-green-600' : 'bg-amber-500/15 text-amber-600'
                }`}
              >
                {profile.mentor_approved ? 'מנחה מאושר' : 'ממתין לאישור אדמין'}
              </span>
            )}
          </div>

          <div className="mb-6">
            <h2 className="mb-2 text-sm font-bold text-brand-text">פרטים אישיים</h2>
            <div className={rowClass}>
              <span className={labelClass}>טלפון</span>
              <span className={valueClass}>{profile.phone}</span>
            </div>
            <div className={rowClass}>
              <span className={labelClass}>מייל</span>
              <span className={valueClass}>{profile.email}</span>
            </div>
            <div className={rowClass}>
              <span className={labelClass}>מין</span>
              <span className={valueClass}>{profile.gender}</span>
            </div>
            <div className={rowClass}>
              <span className={labelClass}>סוג משתמש</span>
              <span className={valueClass}>{roleLabel}</span>
            </div>
            <div className={rowClass}>
              <span className={labelClass}>מכללה</span>
              <span className={valueClass}>{profile.college}</span>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-bold text-brand-text">
              תמונת פרופיל {savingAvatar && <span className="text-xs font-normal text-brand-textsoft">(שומר...)</span>}
            </h2>
            <div className="grid grid-cols-7 gap-1.5 rounded-xl border border-brand-category bg-brand-bg p-2">
              {AVATAR_ICONS.map((a) => {
                const selected = profile.avatar_icon === a.key;
                return (
                  <button
                    key={a.key}
                    onClick={() => handleAvatarChange(a.key)}
                    disabled={savingAvatar}
                    title={a.label}
                    className={`flex aspect-square items-center justify-center rounded-lg transition disabled:opacity-50 ${
                      selected ? 'bg-brand-picture ring-2 ring-brand-linktext' : 'hover:bg-brand-picture/50'
                    }`}
                  >
                    <Icon icon={a.icon} width={18} className="text-brand-text" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
