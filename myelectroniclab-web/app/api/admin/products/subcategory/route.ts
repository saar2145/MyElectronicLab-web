// Version: 1.0
// Title: Admin Create Subcategory API Route | Important Data: categorySheetRow
// (required) is the parent category. beforeSheetRow (optional) is the sheet_row
// of an existing row to insert immediately before - used by the admin's
// "מבנה קטגוריה" structure tab to insert a subcategory at an arbitrary point,
// not just at the end of the category. If omitted, defaults to the end of the
// category's block (findCategoryEnd). beforeSheetRow is validated to actually
// fall within the target category's own block, so a stray sheet_row can't be
// used to insert a subcategory heading into an unrelated category.

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { fetchSortedRows, findCategoryEnd, shiftUpFrom } from '@/lib/admin-catalog-ops';

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value;
  return verifySessionToken(token);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { categorySheetRow, beforeSheetRow, title } = await req.json();
    if (!categorySheetRow || !title || !String(title).trim()) {
      return NextResponse.json({ error: 'חסרה קטגוריית-אב או כותרת תת-קטגוריה.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const rows = await fetchSortedRows(supabase);
    const categoryEnd = findCategoryEnd(rows, categorySheetRow);
    if (categoryEnd === null) {
      return NextResponse.json({ error: 'הקטגוריה לא נמצאה.' }, { status: 400 });
    }

    let insertionPoint = categoryEnd;
    if (beforeSheetRow) {
      const inRange = beforeSheetRow > categorySheetRow && beforeSheetRow <= categoryEnd;
      if (!inRange) {
        return NextResponse.json({ error: 'נקודת ההכנסה לא שייכת לקטגוריה הזו.' }, { status: 400 });
      }
      insertionPoint = beforeSheetRow;
    }

    await shiftUpFrom(supabase, rows, insertionPoint);

    const { error } = await supabase.from('products').insert({
      sheet_row: insertionPoint,
      row_type: 'subcategory',
      category_title: String(title).trim(),
    });

    if (error) {
      console.error('Admin create subcategory error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sheet_row: insertionPoint });
  } catch (e) {
    console.error('Admin create subcategory POST error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'שגיאה בשרת.' }, { status: 500 });
  }
}
