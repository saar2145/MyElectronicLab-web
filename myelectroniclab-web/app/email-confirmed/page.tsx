// Version: 1.0
// Title: Email Confirmed Page | Important Data: this is the emailRedirectTo
// target passed in register/page.tsx's signUp() call - without it, Supabase
// falls back to whatever the project's Site URL is set to, which was still
// the default localhost:3000 (a very common leftover from initial setup),
// producing exactly the "redirects to a broken localhost address" complaint.
// IMPORTANT MANUAL STEP: this URL must also be added to Supabase's
// Authentication → URL Configuration → Redirect URLs allow-list, or Supabase
// will reject the redirect outright and fall back to Site URL anyway - same
// lesson as the /reset-password redirect earlier in this project. By the
// time this page loads, Supabase has already processed the confirmation
// server-side (the token is consumed before the redirect happens) - this
// page doesn't need to do anything itself, it's purely a friendly landing
// screen.

'use client';

import { Icon } from '@iconify/react';

export default function EmailConfirmedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 text-center shadow-lg">
        <Icon icon="solar:check-circle-bold" width={48} className="mx-auto mb-3 text-green-500" />
        <h1 className="mb-2 text-lg font-bold text-brand-text">המייל אומת בהצלחה!</h1>
        <p className="mb-5 text-sm text-brand-textsoft">החשבון שלך מוכן. אפשר להתחבר עכשיו.</p>
        <a
          href="/login"
          className="inline-block rounded-xl bg-brand-name px-6 py-2.5 text-sm font-bold text-brand-text"
        >
          מעבר להתחברות
        </a>
      </div>
    </div>
  );
}
