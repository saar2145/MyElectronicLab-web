// Version: 1.1
// Title: Admin Products API Route | Change from v1.0: (1) GET now resolves
// each product's ACTUAL category by walking all rows in sheet_row order and
// tracking the most recent category/subcategory seen - exactly like
// lib/catalog.ts's groupCatalog() does for the public site. Before this, the
// admin list showed "-" for every product's category because it read
// category_title directly off the product row, which is only ever set on
// category-type rows themselves (a product row's own category_title is
// always null - that was the actual bug, not a display glitch); (2) added
// PATCH to edit an existing product's fields. Important Data: the catalog is
// NOT a normal relational category system - "adding a product to a
// category" means inserting a row at the right POSITION in sheet_row order
// (see POST below), not setting a category_id. PATCH intentionally does NOT
// support moving a product to a different category (that would need the same
// shift-and-insert dance as POST) - it only edits name/model/price/
// description/link/image_url on the existing row.

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';

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
  const categories = rows
    .filter((r) => r.row_type === 'category')
    .map((r) => ({ sheet_row: r.sheet_row, title: r.category_title }));

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

  return NextResponse.json({ categories, products: productsResolved });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  try {
    const { categorySheetRow, name, model, price, description, link, image_url } = await req.json();

    if (!categorySheetRow || !name) {
      return NextResponse.json({ error: 'חסרה קטגוריה או שם מוצר.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // כל השורות ממוינות, כדי למצוא את נקודת ההכנסה (סוף הבלוק של הקטגוריה הנבחרת)
    const { data: rows, error: fetchError } = await supabase
      .from('products')
      .select('sheet_row, row_type')
      .order('sheet_row', { ascending: true });

    if (fetchError || !rows) {
      console.error('Admin product insert - fetch rows error:', fetchError?.message);
      return NextResponse.json({ error: 'שגיאה בטעינת מבנה הקטלוג.' }, { status: 500 });
    }

    const catIndex = rows.findIndex((r) => r.sheet_row === categorySheetRow && r.row_type === 'category');
    if (catIndex === -1) {
      return NextResponse.json({ error: 'הקטגוריה לא נמצאה.' }, { status: 400 });
    }

    // מוצא את השורה הבאה שהיא קטגוריה חדשה (או סוף הרשימה) - שם נכניס את המוצר, ממש לפניה
    let nextCategoryRow: number | null = null;
    for (let i = catIndex + 1; i < rows.length; i++) {
      if (rows[i].row_type === 'category') {
        nextCategoryRow = rows[i].sheet_row as number;
        break;
      }
    }
    const maxSheetRow = rows[rows.length - 1].sheet_row as number;
    const insertionPoint = nextCategoryRow ?? maxSheetRow + 1;

    // Supabase-js אין לו "sheet_row = sheet_row + 1" ישיר - מעדכנים כל שורה
    // רלוונטית אחת-אחת, בסדר יורד (מהגדול לקטן), כדי לא ליצור התנגשות unique בדרך
    const toShift = rows
      .filter((r) => (r.sheet_row as number) >= insertionPoint)
      .sort((a, b) => (b.sheet_row as number) - (a.sheet_row as number));
    for (const r of toShift) {
      await supabase.from('products').update({ sheet_row: (r.sheet_row as number) + 1 }).eq('sheet_row', r.sheet_row);
    }

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
    return NextResponse.json({ error: 'שגיאה בשרת.' }, { status: 500 });
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
    const { error } = await supabase.from('products').delete().eq('id', id).eq('row_type', 'product');
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
