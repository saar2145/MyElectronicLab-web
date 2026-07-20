// Version: 1.0
// Title: Mentor Dashboard | Important Data: gated to role==='mentor' AND
// mentor_approved===true (checked client-side against profiles, which RLS
// already restricts to the user's own row). Class creation generates a
// join_code client-side (lib/join-code.ts) and retries once on the rare
// unique-constraint collision. Each class card links to
// /mentor/classes/[id] for the roster/assignments/notes detail view.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';
import { generateJoinCode } from '@/lib/join-code';

type ClassRow = { id: string; class_name: string; join_code: string; created_at: string; studentCount: number };

export default function MentorDashboardPage() {
  const router = useRouter();
  const [access, setAccess] = useState<'loading' | 'denied-role' | 'pending-approval' | 'ok'>('loading');
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, mentor_approved')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'mentor') {
      setAccess('denied-role');
      return;
    }
    if (!profile.mentor_approved) {
      setAccess('pending-approval');
      return;
    }
    setAccess('ok');

    const { data: rows } = await supabase
      .from('mentor_classes')
      .select('id, class_name, join_code, created_at')
      .order('created_at', { ascending: false });

    const withCounts = await Promise.all(
      (rows ?? []).map(async (c) => {
        const { count } = await supabase
          .from('mentor_class_students')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', c.id);
        return { ...c, studentCount: count ?? 0 };
      })
    );

    setClasses(withCounts);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינה חד-פעמית ב-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- מריץ פעם אחת בלבד ב-mount
  }, []);

  async function createClass() {
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    let attempt = 0;
    let lastError: string | null = null;
    while (attempt < 3) {
      const code = generateJoinCode();
      const { error: insertError } = await supabase
        .from('mentor_classes')
        .insert({ mentor_id: userData.user.id, class_name: newName.trim(), join_code: code });
      if (!insertError) {
        lastError = null;
        break;
      }
      lastError = insertError.message;
      attempt++;
    }

    setCreating(false);
    if (lastError) {
      setError('שגיאה ביצירת הכיתה. נסה שוב.');
      return;
    }
    setNewName('');
    load();
  }

  if (access === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg" dir="rtl">
        <Icon icon="solar:refresh-bold" width={28} className="animate-spin text-brand-textsoft" />
      </div>
    );
  }

  if (access === 'denied-role') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
        <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 text-center shadow-lg">
          <Icon icon="solar:lock-keyhole-bold" width={44} className="mx-auto mb-3 text-brand-textsoft" />
          <h1 className="mb-2 text-lg font-bold text-brand-text">האזור הזה למנחים בלבד</h1>
          <button onClick={() => router.push('/')} className="mt-2 text-sm font-bold text-brand-linktext hover:underline">
            חזרה לקטלוג
          </button>
        </div>
      </div>
    );
  }

  if (access === 'pending-approval') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
        <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 text-center shadow-lg">
          <Icon icon="solar:clock-circle-bold" width={44} className="mx-auto mb-3 text-amber-500" />
          <h1 className="mb-2 text-lg font-bold text-brand-text">ממתין לאישור אדמין</h1>
          <p className="text-sm text-brand-textsoft">חשבון המנחה שלך עדיין לא אושר.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <button onClick={() => router.push('/')} className="mb-4 flex items-center gap-1 text-sm font-bold text-brand-linktext hover:underline">
          <Icon icon="solar:arrow-right-linear" width={18} />
          חזרה לקטלוג
        </button>

        <h1 className="mb-5 flex items-center gap-2 text-lg font-bold text-brand-text">
          <Icon icon="solar:presentation-graph-bold" width={22} /> לוח בקרה - מנחה
        </h1>

        <div className="mb-6 rounded-2xl bg-brand-cardbg p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-brand-text">כיתה חדשה</h2>
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="שם הכיתה"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createClass()}
              className="min-w-[200px] flex-1 rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name"
            />
            <button
              onClick={createClass}
              disabled={creating || !newName.trim()}
              className="rounded-xl bg-brand-name px-5 py-2 text-sm font-bold text-brand-text disabled:opacity-60"
            >
              {creating ? 'יוצר...' : 'צור כיתה'}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>

        <h2 className="mb-3 text-sm font-bold text-brand-text">הכיתות שלי</h2>
        {loading ? (
          <p className="text-center text-brand-textsoft">טוען...</p>
        ) : classes.length === 0 ? (
          <p className="py-16 text-center text-brand-textsoft">עדיין לא יצרת אף כיתה</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/mentor/classes/${c.id}`)}
                className="rounded-2xl bg-brand-cardbg p-5 text-right shadow-sm transition hover:brightness-95"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-brand-text">{c.class_name}</span>
                  <span className="rounded-full bg-brand-picture px-2.5 py-1 text-xs font-bold text-brand-text">{c.studentCount} סטודנטים</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-brand-textsoft">
                  <Icon icon="solar:key-minimalistic-square-linear" width={14} />
                  קוד: <span className="font-mono font-bold tracking-wider">{c.join_code}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
