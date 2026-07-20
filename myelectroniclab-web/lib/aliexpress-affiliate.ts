// Version: 2.1
// Title: AliExpress Affiliate API Client | Change from v2.0: the ported logic
// from the old GAS system is byte-for-byte equivalent (verified again) and
// still produces IncompleteSignature - shifting suspicion to the env vars
// themselves (stray whitespace/newline from copy-paste into Vercel, or not
// set on all environments). Added: (1) .trim() on all three env vars
// defensively; (2) the exact param string that gets signed (everything
// EXCEPT the secret itself) is now included in error `raw` output, so a
// mismatch against what you'd expect can be seen directly instead of
// guessed at. Important Data: TWO-STEP process - step 1
// (aliexpress.affiliate.link.generate, keyed on the actual URL) determines
// eligibility for real; step 2 (aliexpress.affiliate.product.query) is
// informational-only for the commission rate, called only if step 1 says
// eligible. Server-only - never import from a client component (uses
// ALIEXPRESS_APP_SECRET).

import crypto from 'crypto';

const API_URL = 'https://api-sg.aliexpress.com/sync';

function envVar(name: string): string {
  return (process.env[name] ?? '').trim();
}

function timestamp(): string {
  // בדיוק כמו במערכת הישנה: "yyyy-MM-dd HH:mm:ss" לפי GMT (UTC), לא epoch ms
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

function buildSignString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('');
}

function sign(signString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(signString, 'utf8').digest('hex').toUpperCase();
}

async function callApi(params: Record<string, string>, secret: string): Promise<{ json: unknown; raw: string; signString: string } | null> {
  const signString = buildSignString(params);
  const withSign = { ...params, sign: sign(signString, secret) };
  const query = Object.entries(withSign)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  try {
    const res = await fetch(`${API_URL}?${query}`, { method: 'GET' });
    const raw = await res.text();
    try {
      return { json: JSON.parse(raw), raw, signString };
    } catch {
      return { json: null, raw, signString };
    }
  } catch {
    return null;
  }
}

function diagnosticSuffix(signString: string, appKey: string, appSecretLen: number): string {
  return `\n\n--- דיאגנוסטיקה (בלי הסוד עצמו) ---\napp_key: "${appKey}" (אורך: ${appKey.length})\nאורך app_secret: ${appSecretLen}\nמחרוזת שנחתמה: ${signString}`;
}

export type EligibilityResult = { eligible: boolean | null; apiError?: string; raw?: string };

// שלב 1 (קובע): מנסה ליצור קישור שותפים אמיתי על ה-URL עצמו - זו בדיקת הזכאות האמיתית
export async function checkLinkEligibility(sourceUrl: string, trackingIdInput: string): Promise<EligibilityResult> {
  const appKey = envVar('ALIEXPRESS_APP_KEY');
  const appSecret = envVar('ALIEXPRESS_APP_SECRET');
  const trackingId = trackingIdInput.trim() || 'default';
  if (!appKey || !appSecret) return { eligible: null, apiError: 'Missing ALIEXPRESS_APP_KEY/APP_SECRET' };

  const params: Record<string, string> = {
    method: 'aliexpress.affiliate.link.generate',
    app_key: appKey,
    sign_method: 'sha256',
    timestamp: timestamp(),
    v: '2.0',
    format: 'json',
    promotion_link_type: '0',
    source_values: sourceUrl,
    tracking_id: trackingId,
  };

  const result = await callApi(params, appSecret);
  if (!result) return { eligible: null, apiError: 'network error' };

  const json = result.json as Record<string, unknown> | null;
  if (!json) return { eligible: null, apiError: 'unparseable response', raw: result.raw + diagnosticSuffix(result.signString, appKey, appSecret.length) };

  if (json.error_response) {
    const err = json.error_response as Record<string, unknown>;
    return {
      eligible: null,
      apiError: String(err.code ?? 'unknown'),
      raw: result.raw + diagnosticSuffix(result.signString, appKey, appSecret.length),
    };
  }

  const hasPromotionLink = /"promotion_link"\s*:\s*"[^"]+"/.test(result.raw);
  return { eligible: hasPromotionLink, raw: result.raw };
}

export type CommissionResult = { rate: string | null; raw: string | null };

// שלב 2 (מידע בלבד): אחוז עמלה - לא קובע זכאות, נקרא רק אחרי שלב 1
export async function fetchCommissionRate(productId: string): Promise<CommissionResult> {
  const appKey = envVar('ALIEXPRESS_APP_KEY');
  const appSecret = envVar('ALIEXPRESS_APP_SECRET');
  if (!appKey || !appSecret) return { rate: null, raw: 'Missing ALIEXPRESS_APP_KEY/APP_SECRET' };

  const params: Record<string, string> = {
    method: 'aliexpress.affiliate.product.query',
    app_key: appKey,
    sign_method: 'sha256',
    timestamp: timestamp(),
    v: '2.0',
    format: 'json',
    product_ids: productId,
    target_currency: 'USD',
    target_language: 'EN',
  };

  const result = await callApi(params, appSecret);
  if (!result) return { rate: null, raw: 'network error' };

  const json = result.json as Record<string, unknown> | null;
  if (!json || json.error_response) {
    return { rate: null, raw: result.raw + diagnosticSuffix(result.signString, appKey, appSecret.length) };
  }

  const commissionMatch = result.raw.match(/"commission_rate"\s*:\s*"?([0-9.]+)"?/);
  return { rate: commissionMatch ? `${commissionMatch[1]}%` : null, raw: result.raw };
}

// מחלץ item id ממגוון הפורמטים של קישורי AliExpress (אחרי שהקישור המקוצר נפתר)
export function extractItemId(url: string): string | null {
  const patterns = [/\/item\/(\d+)\.html/, /[?&]productId=(\d+)/, /[?&]product_id=(\d+)/, /[?&]id=(\d+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
