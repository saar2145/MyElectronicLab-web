// Version: 1.0
// Title: AliExpress Affiliate API Client | Important Data: implements the
// standard TOP (Taobao Open Platform) request-signing scheme that AliExpress's
// Open API inherited - sort all params alphabetically by key, concatenate as
// "key"+"value" pairs with no separators, then HMAC-SHA256 that string with
// the app secret, uppercase hex. This is the well-documented standard pattern,
// but I could not test it against real credentials while writing this (no
// sandbox access to your AliExpress account) - so this is the single most
// likely point of failure. On ANY unexpected response shape, this
// deliberately stores the raw JSON in the check's `details` column instead of
// silently failing, so a real failure can be diagnosed from the actual
// response instead of guessed at - same lesson as every other "show the real
// error" fix earlier in this project. Server-only - never import from a
// client component (uses ALIEXPRESS_APP_SECRET).

import crypto from 'crypto';

const API_ENDPOINT = 'https://api-sg.aliexpress.com/sync';

function signParams(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join('');
  return crypto.createHmac('sha256', secret).update(sorted, 'utf8').digest('hex').toUpperCase();
}

function timestamp(): string {
  // TOP API מצפה לפורמט הזה, לפי אזור זמן סין (GMT+8) - לא לפי שעון השרת
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

export type AffiliateProductResult = {
  ok: boolean;
  commissionRate: number | null;
  rawResponse: string;
};

export async function fetchAffiliateProductDetail(itemId: string): Promise<AffiliateProductResult> {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID;

  if (!appKey || !appSecret || !trackingId) {
    return { ok: false, commissionRate: null, rawResponse: 'Missing ALIEXPRESS_APP_KEY/APP_SECRET/TRACKING_ID env vars' };
  }

  const params: Record<string, string> = {
    app_key: appKey,
    method: 'aliexpress.affiliate.productdetail.get',
    sign_method: 'sha256',
    timestamp: timestamp(),
    v: '2.0',
    format: 'json',
    product_ids: itemId,
    tracking_id: trackingId,
    target_currency: 'ILS',
    target_language: 'HE',
    fields: 'commission_rate,hot_product_commission_rate,product_id,target_sale_price',
  };

  const sign = signParams(params, appSecret);
  const query = new URLSearchParams({ ...params, sign }).toString();

  try {
    const res = await fetch(`${API_ENDPOINT}?${query}`, { method: 'GET' });
    const text = await res.text();

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: false, commissionRate: null, rawResponse: text };
    }

    // מבנה התשובה של TOP API משתנה קצת בין endpoints - מחפש את שדה שיעור העמלה
    // בכמה מסלולים אפשריים במקום להניח מבנה אחד; אם לא נמצא, מחזיר את כל
    // ה-JSON הגולמי כדי שאפשר יהיה לתקן את הנתיב המדויק בפועל
    const flat = JSON.stringify(json);
    const commissionMatch = flat.match(/"(?:hot_product_)?commission_rate"\s*:\s*"?([0-9.]+)"?/);
    const errorMatch = flat.match(/"error_response"/);

    if (errorMatch) {
      return { ok: false, commissionRate: null, rawResponse: text };
    }

    if (commissionMatch) {
      return { ok: true, commissionRate: parseFloat(commissionMatch[1]), rawResponse: text };
    }

    return { ok: false, commissionRate: null, rawResponse: text };
  } catch (e) {
    return { ok: false, commissionRate: null, rawResponse: String(e) };
  }
}

// מחלץ item id ממגוון הפורמטים של קישורי AliExpress (אחרי שהקישור המקוצר נפתר)
export function extractItemId(url: string): string | null {
  const patterns = [/\/item\/(\d+)\.html/, /[?&]productId=(\d+)/, /[?&]product_id=(\d+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
