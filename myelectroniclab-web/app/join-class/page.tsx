// Version: 1.2
// Title: Join Class Page | Change from v1.1: now checks membership first - if
// the student already joined a class, shows "הכיתה שלי" info (using the
// mentor_classes_member_select RLS policy from
// supabase_schema_v1.9_two_way_messages.sql) instead of the join form, with
// links into /my-project's tasks/messages tabs. Important Data: joining still
// goes through the join_class_by_code() Postgres function via supabase.rpc -
// students don't have general SELECT access to mentor_classes (that would
// leak every class's code).

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';

type MyClass = { id: string; class_name: string };

export default function JoinClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myClasses, setMyClasses] = useState<MyClass[]>([]);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [joinedName, setJoinedName] = useState<string | null>(null);

  async function load() {
    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }
    const { data } = await supabase.from('mentor_classes').select('id, class_name');
    setMyClasses(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינה חד-פעמית ב-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- מריץ פעם אחת בלבד ב-mount
  }, []);

  async function handleSubmit() {
    if (!code.trim()) return;
    setSubmitting(true);
    setError('');

    const supabase = getSupabaseAuthClient();
    const { data, error: rpcError } = await supabase.rpc('join_class_by_code', { p_code: code.trim() });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    setJoinedName(row?.out_class_name ?? 'הכיתה');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg" dir="rtl">
        <Icon icon="solar:refresh-bold" width={28} className="animate-spin text-brand-textsoft" />
      </div>
    );
  }

  if (!joinedName && myClasses.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
        <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 text-center shadow-lg">
          <Icon icon="solar:users-group-two-rounded-bold" width={44} className="mx-auto mb-3 text-brand-linktext" />
          <h1 className="mb-1 text-lg font-bold text-brand-text">הכיתה שלי</h1>
          <div className="my-4 flex flex-col gap-2">
            {myClasses.map((c) => (
              <div key={c.id} className="rounded-xl bg-brand-bg px-4 py-3 text-sm font-bold text-brand-text">
                {c.class_name}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => router.push('/my-project')} className="rounded-xl bg-brand-name py-2.5 text-sm font-bold text-brand-text">
              מטלות והודעות
            </button>
            <button onClick={() => setMyClasses([])} className="text-xs font-bold text-brand-linktext hover:underline">
              הצטרפות לכיתה נוספת
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 text-center shadow-lg">
        {joinedName ? (
          <>
            <Icon icon="solar:check-circle-bold" width={44} className="mx-auto mb-3 text-green-500" />
            <h1 className="mb-2 text-lg font-bold text-brand-text">הצטרפת בהצלחה!</h1>
            <p className="mb-4 text-sm text-brand-textsoft">אתה עכשיו חלק מהכיתה &quot;{joinedName}&quot;</p>
            <button onClick={() => router.push('/my-project')} className="text-sm font-bold text-brand-linktext hover:underline">
              לצפייה בפרויקט שלי
            </button>
          </>
        ) : (
          <>
            <Icon icon="solar:users-group-two-rounded-bold" width={44} className="mx-auto mb-3 text-brand-linktext" />
            <h1 className="mb-1 text-lg font-bold text-brand-text">הצטרפות לכיתה</h1>
            <p className="mb-5 text-sm text-brand-textsoft">הכנס את הקוד שקיבלת מהמנחה שלך</p>

            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="קוד כיתה"
              className="mb-3 w-full rounded-xl border border-brand-category bg-brand-bg px-4 py-2.5 text-center font-mono text-lg font-bold tracking-widest text-brand-text outline-none focus:border-brand-name"
              maxLength={8}
              autoFocus
            />

            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || !code.trim()}
              className="w-full rounded-xl bg-brand-name py-2.5 text-sm font-bold text-brand-text disabled:opacity-60"
            >
              {submitting ? 'מצטרף...' : 'הצטרף לכיתה'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
