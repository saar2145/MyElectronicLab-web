// Version: 1.0
// Title: Admin Auth Helpers | Important Data: stateless session via HMAC-signed
// token in an httpOnly cookie - no session table needed (appropriate for
// serverless functions with no shared memory between invocations). Mirrors the
// spirit of Code.gs's hashed-password + server-issued-token approach, but with
// real cryptographic signing instead of a CacheService-backed token lookup.

import { createHash, createHmac, timingSafeEqual } from 'crypto';

const SESSION_TTL_MS = 60 * 60 * 1000; // שעה, כמו ב-Apps Script

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  return hashPassword(password) === stored;
}

function sign(payload: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('Missing ADMIN_SESSION_SECRET env var.');
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = String(expires);
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expBuf)) return false;

  const expires = Number(payload);
  return Date.now() < expires;
}
