// Version: 1.0
// Title: Admin Reorder (Swap Adjacent Rows) API Route | Important Data: powers
// the ↑/↓ buttons in the admin "מבנה קטגוריה" structure tab. Swaps sheet_row
// between two rows the client asserts are adjacent (the structure tab always
// sends the currently-rendered neighbor's id, so this is safe in practice) via
// lib/admin-catalog-ops.ts's swapRows() - a temporary sentinel value avoids
// colliding with the sheet_row unique constraint mid-swap. Works for any
// row_type (product, blank, subcategory) - category headings are excluded
// client-side in the structure tab, not here, since the swap itself has no
// reason to care what got swapped.

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { swapRows } from '@/lib/admin-catalog-ops';

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value;
  return verifySessionToken(token);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { rowAId, rowBId } = await req.json();
    if (!rowAId || !rowBId) {
      return NextResponse.json({ error: 'חסרים מזהי שורות.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { error } = await swapRows(supabase, rowAId, rowBId);

    if (error) {
      console.error('Admin reorder swap error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin reorder POST error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'שגיאה בשרת.' }, { status: 500 });
  }
}
