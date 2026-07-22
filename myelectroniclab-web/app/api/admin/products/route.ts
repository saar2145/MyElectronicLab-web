// Version: 1.2
// Title: Admin Products API Route | Change from v1.1: (1) GET now also
// returns subcategories, nested under their parent category (categorySheetRow),
// PLUS the full raw sorted row list (including 'blank' rows) as `rows`, for
// the admin "מבנה קטגוריה" structure tab; (2) POST accepts an optional
// subcategorySheetRow and now stops the insertion scan at the next
// subcategory too, not just the next category - fixes a real silent bug
// where a product added to a category that has subcategories used to land
// inside the LAST subcategory's block instead of becoming a loose product
// directly under the category (groupCatalog() in lib/catalog.ts assigns a
// product row to whichever subcategory it last saw, so the old "insert right
// before the next CATEGORY" logic was wrong whenever subcategories existed in
// between); (3) DELETE now also allows deleting a 'blank' placeholder row,
// not just 'product' rows. Change from v1.0: GET
// resolves each product's ACTUAL category by walking all rows in sheet_row
// order (see lib/catalog.ts's groupCatalog()); PATCH edits an existing
// product's fields. Important Data: the catalog is NOT a normal relational
// category system - see lib/admin-catalog-ops.ts for the shared insert/shift/
// move/swap primitives used here and by the new /category, /subcategory,
// /blank, /move, /reorder routes. PATCH intentionally does NOT support moving
// a product to a different category - use POST /api/admin/products/move for that.

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { fetchSortedRows, findCategoryEnd, findSubcategoryEnd, shiftUpFrom } from '@/lib/admin-catalog-ops';

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value;
  return verifySessionToken(token);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, sheet_row, row_type, name, model, price, description, image_url, link, category_title')
    .order('sheet_row', { ascending: true });

  if (error) {
    console.error('Admin products fetch error:', error.message);
    return NextResponse.json({ error: 'שגיאה בטעינת המוצרים.' }, { status: 500 });
  }

  const rows = data ?? [];

  // בונה את רשימת הקטגוריות עם תתי-הקטגוריות שלהן מקוננות - הולך על השורות
  // בסדר sheet_row וצובר תתי-קטגוריה תחת הקטגוריה האחרונה שנראתה
  type SubcatOption = { sheet_row: number; title: string | null };
  const categories: { sheet_row: number; title: string | null; subcategories: SubcatOption[] }[] = [];
  let openCategory: (typeof categories)[number] | null = null;

  for (const row of rows) {
    if (row.row_type === 'category') {
      openCategory = { sheet_row: row.sheet_row, title: row.category_title, subcategories: [] };
      categories.push(openCategory);
      continue;
    }
    if (row.row_type === 'subcategory' && openCategory) {
      openCategory.subcategories.push({ sheet_row: row.sheet_row, title: row.category_title });
    }
  }

  // פותר את הקטגוריה האמיתית של כל מוצר, בדיוק כמו lib/catalog.ts:
  // הולך על השורות בסדר sheet_row ומזכיר מה הייתה הקטגוריה/תת-קטגוריה
  // האחרונה שנראתה לפני המוצר הזה
  let currentCategory: string | null = null;
  let currentSubcategory: string | null = null;
  const productsResolved: Array<(typeof rows)[number] & { resolved_category: string | null }> = [];

  for (const row of rows) {
    if (row.row_type === 'category') {
      currentCategory = row.category_title ?? null;
      currentSubcategory = null;
      continue;
    }
    if (row.row_type === 'subcategory') {
      currentSubcategory = row.category_title ?? null;
      continue;
    }
    if (row.row_type === 'product') {
      productsResolved.push({
        ...row,
        resolved_category: currentSubcategory ? `${currentCategory ?? ''} / ${currentSubcategory}` : currentCategory,
      });
    }
  }

  // rows: הרשימה המלאה כולל תאים ריקים (blank) - ל"מבנה קטגוריה" בצד האדמין,
  // שצריך את סדר השורות האמיתי (לא רק את המוצרים המסוננים כמו productsResolved)
  return NextResponse.json({ categories, products: productsResolved, rows });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { categorySheetRow, subcategorySheetRow, name, model, price, description, link, image_url } = await req.json();

    if (!categorySheetRow || !name) {
      return NextResponse.json({ error: 'חסרה קטגוריה או שם מוצר.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const rows = await fetchSortedRows(supabase);

    // אם נבחרה תת-קטגוריה - ההכנסה בסוף הבלוק שלה (עוצרת גם על תת-קטגוריה
    // הבאה, לא רק קטגוריה - זה מה שתוקן ב-v1.2). אחרת, בסוף כל בלוק הקטגוריה.
    const insertionPoint = subcategorySheetRow
      ? findSubcategoryEnd(rows, subcategorySheetRow)
      : findCategoryEnd(rows, categorySheetRow);

    if (insertionPoint === null) {
      return NextResponse.json({ error: 'הקטגוריה או תת-הקטגוריה לא נמצאה.' }, { status: 400 });
    }

    await shiftUpFrom(supabase, rows, insertionPoint);

    const { error: insertError } = await supabase.from('products').insert({
      sheet_row: insertionPoint,
      row_type: 'product',
      name,
      model: model || null,
      price: price ? Number(price) : null,
      description: description || null,
      link: link || null,
      image_url: image_url || null,
    });

    if (insertError) {
      console.error('Admin product insert error:', insertError.message);
      return NextResponse.json({ error: 'שגיאה בהוספת המוצר.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin products POST error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'שגיאה בשרת.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { id, name, model, price, description, link, image_url } = await req.json();
    if (!id || !name) {
      return NextResponse.json({ error: 'חסר מזהה או שם מוצר.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from('products')
      .update({
        name,
        model: model || null,
        price: price === '' || price === null || price === undefined ? null : Number(price),
        description: description || null,
        link: link || null,
        image_url: image_url || null,
      })
      .eq('id', id)
      .eq('row_type', 'product');

    if (error) {
      console.error('Admin product update error:', error.message);
      return NextResponse.json({ error: 'שגיאה בעדכון המוצר.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin products PATCH error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'חסר מזהה מוצר.' }, { status: 400 });

    const supabase = getSupabaseServerClient();
    // מוחק מוצר או תא ריק (blank) - לעולם לא שורת קטגוריה/תת-קטגוריה דרך ה-route הזה
    const { error } = await supabase.from('products').delete().eq('id', id).in('row_type', ['product', 'blank']);
    if (error) {
      console.error('Admin product delete error:', error.message);
      return NextResponse.json({ error: 'שגיאה במחיקת המוצר.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin products DELETE error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת.' }, { status: 500 });
  }
}
