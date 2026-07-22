// Version: 1.0
// Title: Admin Move Product/Blank API Route | Important Data: moves an
// existing product or blank row (never a category/subcategory heading - out
// of scope for this pass) to a different category and/or subcategory. Uses
// lib/admin-catalog-ops.ts's moveRow(), which closes the gap at the old
// position and opens one at the new position via a temporary sentinel
// sheet_row, so it never transiently collides with the sheet_row unique
// constraint. destSubcategorySheetRow is optional - omit it to make the row a
// "loose" item directly under destCategorySheetRow (no subcategory).

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { findCategoryEnd, findSubcategoryEnd, moveRow } from '@/lib/admin-catalog-ops';

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value;
  return verifySessionToken(token);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { rowId, destCategorySheetRow, destSubcategorySheetRow } = await req.json();
    if (!rowId || !destCategorySheetRow) {
      return NextResponse.json({ error: 'חסר מזהה שורה או קטגוריית יעד.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // ולידציה: לא מזיזים שורת קטגוריה/תת-קטגוריה עצמה דרך ה-route הזה
    const { data: target } = await supabase.from('products').select('row_type').eq('id', rowId).maybeSingle();
    if (!target || (target.row_type !== 'product' && target.row_type !== 'blank')) {
      return NextResponse.json({ error: 'אפשר להעביר רק מוצר או תא ריק.' }, { status: 400 });
    }

    const { error } = await moveRow(supabase, rowId, (rowsWithoutMoved) =>
      destSubcategorySheetRow
        ? findSubcategoryEnd(rowsWithoutMoved, destSubcategorySheetRow)
        : findCategoryEnd(rowsWithoutMoved, destCategorySheetRow)
    );

    if (error) {
      console.error('Admin move product error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin move product POST error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'שגיאה בשרת.' }, { status: 500 });
  }
}
