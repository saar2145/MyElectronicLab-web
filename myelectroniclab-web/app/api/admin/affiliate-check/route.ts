// Version: 1.0
// Title: Admin Affiliate Check API Route | Important Data: GET returns the
// most recent check per product (for the admin table). POST runs a fresh
// check batch: for each product with a link, (1) follows redirects to get the
// resolved URL + HTTP status - this alone catches dead/removed listings and
// links that lost their affiliate tracking domain/param; (2) if a resolved
// AliExpress item_id was found, calls the AliExpress Affiliate API
// (lib/aliexpress-affiliate.ts) to confirm the live commission rate. Runs
// products SEQUENTIALLY with a small delay between AliExpress API calls (not
// Promise.all) - both to respect their rate limits and because a Vercel
// serverless function has a timeout ceiling; for large catalogs this may need
// chunking into multiple requests later (not handled yet - flagged in chat).

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { fetchAffiliateProductDetail, extractItemId } from '@/lib/aliexpress-affiliate';

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

  const { productId } = await req.json().catch(() => ({ productId: null }));

  const query = supabase.from('products').select('id, link').eq('row_type', 'product').not('link', 'is', null);
  const { data: products } = productId ? await query.eq('id', productId) : await query;

  const results: { productId: number; status: string }[] = [];

  for (const product of products ?? []) {
    if (!product.link) continue;

    let httpStatus: number | null = null;
    let resolvedUrl: string | null = null;
    let status: 'ok' | 'broken' | 'no_affiliate_tag' | 'rate_mismatch' | 'api_error' = 'broken';
    let itemId: string | null = null;
    let commissionRate: number | null = null;
    let details = '';

    // שכבה 1: בריאות הקישור
    try {
      const res = await fetch(product.link, { method: 'GET', redirect: 'follow' });
      httpStatus = res.status;
      resolvedUrl = res.url;

      if (res.status >= 200 && res.status < 400) {
        const hasTracking = /s\.click\.aliexpress\.com|aff_fcid=|aff_platform=|sk=/.test(product.link) || /s\.click\.aliexpress\.com/.test(resolvedUrl);
        itemId = extractItemId(resolvedUrl);
        status = hasTracking || itemId ? 'ok' : 'no_affiliate_tag';
      } else {
        status = 'broken';
        details = `HTTP ${res.status} מהקישור`;
      }
    } catch (e) {
      status = 'broken';
      details = `שגיאת רשת: ${String(e)}`;
    }

    // שכבה 2: אימות שיעור עמלה מול AliExpress (רק אם שכבה 1 עברה ויש item id)
    if (status === 'ok' && itemId) {
      const affResult = await fetchAffiliateProductDetail(itemId);
      if (!affResult.ok) {
        status = 'api_error';
        details = affResult.rawResponse.slice(0, 2000);
      } else {
        commissionRate = affResult.commissionRate;
      }
      await sleep(400); // נימוס כלפי ה-rate limit של AliExpress
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
