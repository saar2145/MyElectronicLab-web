// Version: 1.3
// Title: Join Class Page | Change from v1.2: simplified back to a pure join
// form - the "already joined, here's my class" branch moved to the new
// dedicated /my-class page, since UserMenu now routes "הכיתה שלי" straight
// there instead of through here. On success, redirects to /my-class instead
// of /my-project. Important Data: joining goes through the
// join_class_by_code() Postgres function via supabase.rpc - students don't
// have general SELECT access to mentor_classes (that would leak every
// class's code).

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';

export default function JoinClassPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [joinedName, setJoinedName] = useState<string | null>(null);

  async function handleSubmit() {
    if (!code.trim()) return;
    setSubmitting(true);
    setError('');

    const supabase = getSupabaseAuthClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }

    const { data, error: rpcError } = await supabase.rpc('join_class_by_code', { p_code: code.trim() });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    setJoinedName(row?.out_class_name ?? 'הכיתה');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 text-center shadow-lg">
        {joinedName ? (
          <>
            <Icon icon="solar:check-circle-bold" width={44} className="mx-auto mb-3 text-green-500" />
            <h1 className="mb-2 text-lg font-bold text-brand-text">הצטרפת בהצלחה!</h1>
            <p className="mb-4 text-sm text-brand-textsoft">אתה עכשיו חלק מהכיתה &quot;{joinedName}&quot;</p>
            <button onClick={() => router.push('/my-class')} className="text-sm font-bold text-brand-linktext hover:underline">
              למעבר לכיתה שלי
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
