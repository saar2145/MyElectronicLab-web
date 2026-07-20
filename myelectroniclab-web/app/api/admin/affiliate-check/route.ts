// Version: 2.2
// Title: Admin Affiliate Check API Route | Change from v2.1: fixed a real
// logic bug - `status` was initialized to 'broken' and never advanced on a
// SUCCESSFUL pre-check (only the failure branches touched it), so
// `if (status !== 'broken')` below always evaluated false and step 1/2
// (the actual AliExpress calls) never ran at all, even for perfectly healthy
// links - producing exactly what was reported: HTTP 200, status "broken",
// empty details. Not an AliExpress/network issue - pure control-flow bug on
// my end. Important Data: step 1 (checkLinkEligibility) is called on the
// product's ORIGINAL stored link (AliExpress's own API resolves it); step 2
// (fetchCommissionRate) only runs if step 1 says eligible, using the item id
// extracted from the pre-check's resolved URL. Runs products SEQUENTIALLY
// with a delay between AliExpress calls (rate limits + serverless timeout
// ceiling; large catalogs may need chunking later).

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { checkLinkEligibility, fetchCommissionRate, extractItemId } from '@/lib/aliexpress-affiliate';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,he;q=0.8',
};

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value;
  return verifySessionToken(token);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, link')
    .eq('row_type', 'product')
    .order('id', { ascending: true });

  const { data: checks } = await supabase
    .from('affiliate_link_checks')
    .select('product_id, checked_at, status, http_status, commission_rate, details')
    .order('checked_at', { ascending: false });

  type CheckRow = NonNullable<typeof checks>[number];
  const latestByProduct = new Map<number, CheckRow>();
  (checks ?? []).forEach((c) => {
    if (!latestByProduct.has(c.product_id)) latestByProduct.set(c.product_id, c);
  });

  const rows = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    link: p.link,
    check: latestByProduct.get(p.id) ?? null,
  }));

  return NextResponse.json({ products: rows });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const trackingId = (process.env.ALIEXPRESS_TRACKING_ID || '').trim() || 'default';

  const { productId } = await req.json().catch(() => ({ productId: null }));

  const query = supabase.from('products').select('id, link').eq('row_type', 'product').not('link', 'is', null);
  const { data: products } = productId ? await query.eq('id', productId) : await query;

  const results: { productId: number; status: string }[] = [];

  for (const product of products ?? []) {
    if (!product.link) continue;

    let httpStatus: number | null = null;
    let resolvedUrl: string | null = null;
    let itemId: string | null = null;
    let status: 'ok' | 'broken' | 'no_affiliate_tag' | 'rate_mismatch' | 'api_error' = 'broken';
    let commissionRate: number | null = null;
    let details = '';

    // בדיקה מקדימה זולה: הקישור בכלל עונה? (לא קורא ל-API של AliExpress בשביל זה)
    // עם User-Agent של דפדפן אמיתי - AliExpress חוסם לעתים קרובות בקשות בלי זה
    try {
      const res = await fetch(product.link, { method: 'GET', redirect: 'follow', headers: BROWSER_HEADERS });
      httpStatus = res.status;
      resolvedUrl = res.url;
      if (res.status >= 200 && res.status < 400) {
        itemId = extractItemId(resolvedUrl);
        status = 'ok'; // מתקדם מעבר ל'broken' ההתחלתי - זה מה שהיה חסר
      } else {
        status = 'broken';
        details = `HTTP ${res.status} מהקישור (${res.statusText || 'ללא הודעה'})`;
      }
    } catch (e) {
      status = 'broken';
      details = `שגיאת רשת בבדיקת הקישור: ${e instanceof Error ? e.message : String(e)}`;
    }

    // שלב 1 (קובע): זכאות אמיתית - בדיוק כמו במערכת הישנה, על ה-URL המקורי
    if (status !== 'broken') {
      const eligibility = await checkLinkEligibility(product.link, trackingId);
      await sleep(1100); // נימוס כלפי ApiCallLimit - כמו במערכת הישנה

      if (eligibility.eligible === null) {
        status = 'api_error';
        details = `${eligibility.apiError ?? 'unknown'}\n\n${(eligibility.raw ?? '').slice(0, 1500)}`;
      } else if (eligibility.eligible === false) {
        status = 'no_affiliate_tag';
        details = 'הקישור עובד אבל לא זכאי לעמלה כרגע (AliExpress לא מחזיר promotion_link)';
      } else if (itemId) {
        // שלב 2 (מידע בלבד): אחוז עמלה, רק אם שלב 1 אישר זכאות
        const rateInfo = await fetchCommissionRate(itemId);
        await sleep(1100);
        status = 'ok';
        commissionRate = rateInfo.rate ? parseFloat(rateInfo.rate) : null;
        if (!rateInfo.rate) details = `זכאי לעמלה אך לא הצלחתי לקבל אחוז מדויק.\n\n${(rateInfo.raw ?? '').slice(0, 1500)}`;
      } else {
        status = 'ok';
        details = 'זכאי לעמלה, אך לא הצלחתי לחלץ item ID לבדיקת אחוז העמלה';
      }
    }

    await supabase.from('affiliate_link_checks').insert({
      product_id: product.id,
      status,
      http_status: httpStatus,
      resolved_url: resolvedUrl,
      item_id: itemId,
      commission_rate: commissionRate,
      details,
    });

    results.push({ productId: product.id, status });
  }

  return NextResponse.json({ ok: true, checked: results.length, results });
}
