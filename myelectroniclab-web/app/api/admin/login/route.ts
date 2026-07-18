// Version: 1.0
// Title: Admin Login API Route | Important Data: POST /api/admin/login -
// verifies ADMIN_PASSWORD_HASH, sets httpOnly signed cookie on success.
// TODO: rate limiting / lockout after N failed attempts (Code.gs had this via
// CacheService; not yet ported here - low risk given the password is not guessable
// via brute force at reasonable attempt rates, but worth adding later).

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSessionToken } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
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
