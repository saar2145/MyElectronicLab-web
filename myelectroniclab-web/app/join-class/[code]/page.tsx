// Version: 1.1
// Title: Join Class By Link | Change from v1.0: UI/UX refinement pass (visual
// only) - AuthBrandHeader + gradient accent bar/button on every non-loading
// screen, matching the rest of the auth-page family. Important Data: this is what a mentor's
// shareable link (/join-class/[code]) opens to - unlike the manual code-entry
// flow at /join-class, this shows a confirmation card ("כיתה X, מנחה Y") via
// the get_class_by_code() preview RPC BEFORE joining, so the student knows
// what they're accepting. Actually joining still calls the existing
// join_class_by_code() RPC (supabase_schema_v1.6). If not logged in,
// redirects to /login first (session doesn't survive query params, so the
// code is preserved via the URL path itself - the user just re-visits the
// same link after logging in).

'use client';

import { useEffect, useState, use as usePromise } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';
import AuthBrandHeader from '@/components/AuthBrandHeader';

const cardClass =
  "relative overflow-hidden rounded-2xl bg-brand-cardbg p-8 text-center shadow-xl ring-1 ring-black/5 before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-[linear-gradient(90deg,var(--header-grad-from),var(--header-grad-to))] before:content-['']";

type Preview = { class_name: string; description: string; mentor_name: string };

export default function JoinClassByLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = usePromise(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseAuthClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push(`/login?next=/join-class/${code}`);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('get_class_by_code', { p_code: code });
      const row = Array.isArray(data) ? data[0] : data;
      if (rpcError || !row) {
        setNotFound(true);
      } else {
        setPreview(row);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- מריץ פעם אחת בלבד ב-mount
  }, []);

  async function handleJoin() {
    setJoining(true);
    setError('');
    const supabase = getSupabaseAuthClient();
    const { error: rpcError } = await supabase.rpc('join_class_by_code', { p_code: code });
    setJoining(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setJoined(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg" dir="rtl">
        <Icon icon="solar:refresh-bold" width={28} className="animate-spin text-brand-textsoft" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
        <div className="w-full max-w-sm">
          <AuthBrandHeader />
          <div className={cardClass}>
          <Icon icon="solar:danger-triangle-bold" width={44} className="mx-auto mb-3 text-red-500" />
          <h1 className="mb-2 text-lg font-bold text-brand-text">קישור לא תקין</h1>
          <p className="text-sm text-brand-textsoft">הכיתה לא נמצאה - ייתכן שהקישור פג תוקף.</p>
          </div>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
        <div className="w-full max-w-sm">
          <AuthBrandHeader />
          <div className={cardClass}>
          <Icon icon="solar:check-circle-bold" width={44} className="mx-auto mb-3 text-green-500" />
          <h1 className="mb-2 text-lg font-bold text-brand-text">הצטרפת בהצלחה!</h1>
          <p className="mb-4 text-sm text-brand-textsoft">אתה עכשיו חלק מהכיתה &quot;{preview?.class_name}&quot;</p>
          <button onClick={() => router.push('/my-class')} className="text-sm font-bold text-brand-linktext hover:underline">
            למעבר לכיתה שלי
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <AuthBrandHeader />
        <div className={cardClass}>
        <Icon icon="solar:users-group-two-rounded-bold" width={44} className="mx-auto mb-3 text-brand-linktext" />
        <h1 className="mb-1 text-lg font-bold text-brand-text">הצעת הצטרפות לכיתה</h1>
        <p className="mb-4 text-sm text-brand-textsoft">קיבלת קישור להצטרפות לכיתה הבאה:</p>

        <div className="mb-5 rounded-xl bg-brand-bg p-4 text-right">
          <div className="mb-1 text-base font-bold text-brand-text">{preview?.class_name}</div>
          <div className="text-xs text-brand-textsoft">מנחה: {preview?.mentor_name}</div>
          {preview?.description && <p className="mt-2 text-xs text-brand-text">{preview.description}</p>}
        </div>

        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-px hover:shadow-lg disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
        >
          {joining ? 'מצטרף...' : 'הצטרף לכיתה'}
        </button>
        </div>
      </div>
    </div>
  );
}
