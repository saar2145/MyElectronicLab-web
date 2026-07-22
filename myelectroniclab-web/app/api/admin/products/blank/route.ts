// Version: 1.0
// Title: Admin Blank Placeholder API Route | Important Data: inserts a
// row_type='blank' row - an empty grid-cell placeholder used to control where
// the public catalog's responsive grid wraps to a new row (see
// lib/catalog.ts's groupCatalog() and components/CategorySection.tsx for the
// render side). Position resolution mirrors /subcategory: categorySheetRow
// (required) + optional subcategorySheetRow (append at end of that
// subcategory's block) + optional beforeSheetRow (arbitrary position within
// the category, validated to actually fall inside it - used by the "מבנה
// קטגוריה" structure tab's "+" between-rows action). Deleting a blank row
// goes through the existing DELETE /api/admin/products (extended in v1.2 to
// accept row_type 'blank' too), not a route here.

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { fetchSortedRows, findCategoryEnd, findSubcategoryEnd, shiftUpFrom } from '@/lib/admin-catalog-ops';

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value;
  return verifySessionToken(token);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { categorySheetRow, subcategorySheetRow, beforeSheetRow } = await req.json();
    if (!categorySheetRow) {
      return NextResponse.json({ error: 'חסרה קטגוריה.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const rows = await fetchSortedRows(supabase);
    const categoryEnd = findCategoryEnd(rows, categorySheetRow);
    if (categoryEnd === null) {
      return NextResponse.json({ error: 'הקטגוריה לא נמצאה.' }, { status: 400 });
    }

    let insertionPoint: number;
    if (beforeSheetRow) {
      const inRange = beforeSheetRow > categorySheetRow && beforeSheetRow <= categoryEnd;
      if (!inRange) {
        return NextResponse.json({ error: 'נקודת ההכנסה לא שייכת לקטגוריה הזו.' }, { status: 400 });
      }
      insertionPoint = beforeSheetRow;
    } else if (subcategorySheetRow) {
      const subEnd = findSubcategoryEnd(rows, subcategorySheetRow);
      if (subEnd === null) {
        return NextResponse.json({ error: 'תת-הקטגוריה לא נמצאה.' }, { status: 400 });
      }
      insertionPoint = subEnd;
    } else {
      insertionPoint = categoryEnd;
    }

    await shiftUpFrom(supabase, rows, insertionPoint);

    const { error } = await supabase.from('products').insert({
      sheet_row: insertionPoint,
      row_type: 'blank',
    });

    if (error) {
      console.error('Admin create blank cell error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sheet_row: insertionPoint });
  } catch (e) {
    console.error('Admin create blank cell POST error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'שגיאה בשרת.' }, { status: 500 });
  }
}
