// Version: 1.2
// Title: AliExpress Affiliate API Client | Change from v1.1: v1.1's "/sync
// path prefix" theory was wrong (reverted) - found a real, working NodeJS
// code sample confirming the actual bug: sign_method=sha256 expects
// TIMESTAMP AS EPOCH MILLISECONDS (Date.now()), not the "yyyy-MM-dd HH:mm:ss"
// string format v1.0/v1.1 used (that format is for the older md5 signing
// mode, a different code path entirely - mixing them is what produced
// IncompleteSignature). Important Data: sort all params alphabetically by
// key, concatenate as "key"+"value" pairs with no separators, HMAC-SHA256
// that string with the app secret, uppercase hex - no path prefix, no
// secret-embedded-in-message. Server-only - never import from a client
// component (uses ALIEXPRESS_APP_SECRET).

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
  // sign_method=sha256 מצפה למילישניות מאז epoch (Date.now()), לא לפורמט תאריך
  // מחרוזתי - זה היה הבאג האמיתי, ראה הערת הגרסה למעלה
  return String(Date.now());
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
