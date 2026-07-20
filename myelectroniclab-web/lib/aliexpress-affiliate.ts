// Version: 2.0
// Title: AliExpress Affiliate API Client | Change from v1.2: completely
// rewritten by porting the OLD GAS system's working implementation
// (checkAliExpressLinkEligibility_ / fetchAliExpressCommissionRate_ in
// Code.gs v4.7), which the user confirmed actually reached the API
// successfully (the only open issue there was commission % accuracy, never
// IncompleteSignature). The real bugs in v1.0-v1.2: (1) timestamp must be
// "yyyy-MM-dd HH:mm:ss" formatted in GMT (UTC) - not epoch milliseconds
// (a different blog post's advice, which was wrong for this API) and not
// GMT+8 (my own earlier wrong guess); (2) step 2 must call
// aliexpress.affiliate.product.query, not aliexpress.affiliate.productdetail.get
// (a method that likely doesn't exist). Important Data: TWO-STEP process,
// exactly like the old system - step 1 (aliexpress.affiliate.link.generate,
// keyed on the actual URL) determines eligibility for real (a category-level
// guess was the old system's ORIGINAL bug, already fixed there); step 2
// (aliexpress.affiliate.product.query) is informational-only for the
// commission rate, called only if step 1 says eligible. Server-only - never
// import from a client component (uses ALIEXPRESS_APP_SECRET).

import crypto from 'crypto';

const API_URL = 'https://api-sg.aliexpress.com/sync';

function timestamp(): string {
  // בדיוק כמו במערכת הישנה: "yyyy-MM-dd HH:mm:ss" לפי GMT (UTC), לא epoch ms
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

function sign(params: Record<string, string>, secret: string): string {
  const signString = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('');
  return crypto.createHmac('sha256', secret).update(signString, 'utf8').digest('hex').toUpperCase();
}

async function callApi(params: Record<string, string>, secret: string): Promise<{ json: unknown; raw: string } | null> {
  const withSign = { ...params, sign: sign(params, secret) };
  const query = Object.entries(withSign)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  try {
    const res = await fetch(`${API_URL}?${query}`, { method: 'GET' });
    const raw = await res.text();
    try {
      return { json: JSON.parse(raw), raw };
    } catch {
      return { json: null, raw };
    }
  } catch {
    return null;
  }
}

export type EligibilityResult = { eligible: boolean | null; apiError?: string; raw?: string };

// שלב 1 (קובע): מנסה ליצור קישור שותפים אמיתי על ה-URL עצמו - זו בדיקת הזכאות האמיתית
export async function checkLinkEligibility(sourceUrl: string, trackingId: string): Promise<EligibilityResult> {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
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
    tracking_id: trackingId || 'default',
  };

  const result = await callApi(params, appSecret);
  if (!result) return { eligible: null, apiError: 'network error' };

  const json = result.json as Record<string, unknown> | null;
  if (!json) return { eligible: null, apiError: 'unparseable response', raw: result.raw };

  if (json.error_response) {
    const err = json.error_response as Record<string, unknown>;
    return { eligible: null, apiError: String(err.code ?? 'unknown'), raw: result.raw };
  }

  // מבנה תשובה מקונן, בדיוק כמו ב-GAS הישן
  const flat = result.raw;
  const hasPromotionLink = /"promotion_link"\s*:\s*"[^"]+"/.test(flat);
  return { eligible: hasPromotionLink, raw: result.raw };
}

export type CommissionResult = { rate: string | null; raw: string | null };

// שלב 2 (מידע בלבד): אחוז עמלה - לא קובע זכאות, נקרא רק אחרי שלב 1
export async function fetchCommissionRate(productId: string): Promise<CommissionResult> {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
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
  if (!json || json.error_response) return { rate: null, raw: result.raw };

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
