// Version: 1.1
// Title: Admin Login API Route | Change from v1.0: FIX - added a lockout
// after repeated failed attempts (found during the pre-public-launch
// security review: the admin cookie is signed/httpOnly/strict-SameSite
// correctly, but nothing stopped unlimited password guesses against this
// route). Now capped at 5 attempts per 15 minutes per IP via
// lib/rate-limit.ts - checked BEFORE verifyPassword() runs, so a locked-out
// caller can't keep guessing even if they somehow knew the hash. Important
// Data: POST /api/admin/login - verifies ADMIN_PASSWORD_HASH, sets httpOnly
// signed cookie on success.

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSessionToken } from '@/lib/admin-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkRateLimit(`admin-login:${getClientIp(req)}`, 5, 15 * 60);
    if (!allowed) {
      return NextResponse.json({ error: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד כמה דקות.' }, { status: 429 });
    }

    const { password } = await req.json();

    if (!password || !verifyPassword(String(password))) {
      return NextResponse.json({ error: 'סיסמה שגויה.' }, { status: 401 });
    }

    const token = createSessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60, // שעה
      path: '/',
    });
    return res;
  } catch (e) {
    console.error('Admin login error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת.' }, { status: 500 });
  }
}
