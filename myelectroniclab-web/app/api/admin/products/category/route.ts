// Version: 1.0
// Title: Admin Create Category API Route | Important Data: always appends the
// new category row at the very end of the whole catalog (max sheet_row + 1) -
// there is intentionally no way to choose where among existing top-level
// categories it lands in this pass (see the admin UI plan discussed with the
// user). Reordering categories themselves is a separate, not-yet-built
// feature. See lib/admin-catalog-ops.ts for the shared row-shift primitives.

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { fetchSortedRows } from '@/lib/admin-catalog-ops';

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value;
  return verifySessionToken(token);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { title, subtitle } = await req.json();
    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'חסרה כותרת קטגוריה.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const rows = await fetchSortedRows(supabase);
    const insertionPoint = (rows[rows.length - 1]?.sheet_row ?? 0) + 1;

    const { error } = await supabase.from('products').insert({
      sheet_row: insertionPoint,
      row_type: 'category',
      category_title: String(title).trim(),
      category_subtitle: subtitle ? String(subtitle).trim() : null,
    });

    if (error) {
      console.error('Admin create category error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sheet_row: insertionPoint });
  } catch (e) {
    console.error('Admin create category POST error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'שגיאה בשרת.' }, { status: 500 });
  }
}
