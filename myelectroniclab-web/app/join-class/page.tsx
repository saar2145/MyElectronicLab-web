// Version: 1.1
// Title: Join Class Page | Change from v1.0: shows the real RPC error message
// instead of a generic string - same recurring lesson in this project (a
// generic message hides RLS/permission/missing-object causes we actually need
// to see). Important Data: calls the join_class_by_code() Postgres function
// (see supabase_schema_v1.6_mentor_classes.sql) via supabase.rpc - this is
// intentional: students don't have SELECT access to mentor_classes directly
// (that would leak every class's code), so joining has to go through this
// SECURITY DEFINER function instead of a normal insert.

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
    setJoinedName(row?.class_name ?? 'הכיתה');
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
