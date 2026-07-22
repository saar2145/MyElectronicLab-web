// Version: 1.0
// Title: Admin Catalog Ordering Helpers | Important Data: SERVER-ONLY. Shared
// primitives for every admin operation that touches the order-based
// `products` table (sheet_row + row_type: category/subcategory/product/blank
// - see app/api/admin/products/route.ts's header comment for why this is NOT
// a relational category_id model). sheet_row is UNIQUE, so every shift/swap
// below is written to never transiently collide with another row's current
// value - ascending order when decrementing (closing a gap), descending order
// when incrementing (opening a gap), and a temporary out-of-range sentinel
// value when swapping/moving a single row. This mirrors the shift dance
// already used by the original POST /api/admin/products (v1.1), extracted
// here so /category, /subcategory, /blank, /move and /reorder can all reuse
// it instead of re-implementing slightly-different versions.

import { SupabaseClient } from '@supabase/supabase-js';

export type CatalogRow = {
  id: number;
  sheet_row: number;
  row_type: string;
  category_title: string | null;
};

export async function fetchSortedRows(supabase: SupabaseClient): Promise<CatalogRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, sheet_row, row_type, category_title')
    .order('sheet_row', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CatalogRow[];
}

// נקודת ההכנסה לסוף הבלוק של קטגוריה - השורה שממש לפני הקטגוריה הבאה
// (או אחרי כל השורות אם זו הקטגוריה האחרונה). מחזיר null אם הקטגוריה לא נמצאה.
export function findCategoryEnd(rows: CatalogRow[], categorySheetRow: number): number | null {
  const catIndex = rows.findIndex((r) => r.sheet_row === categorySheetRow && r.row_type === 'category');
  if (catIndex === -1) return null;
  for (let i = catIndex + 1; i < rows.length; i++) {
    if (rows[i].row_type === 'category') return rows[i].sheet_row;
  }
  return (rows[rows.length - 1]?.sheet_row ?? categorySheetRow) + 1;
}

// נקודת ההכנסה לסוף הבלוק של תת-קטגוריה - השורה שממש לפני הקטגוריה/תת-קטגוריה
// הבאה (איזו מהן שקרובה יותר). זה מה שהיה חסר ב-POST המקורי וגרם למוצרים
// חדשים "ליפול" בטעות לתוך תת-הקטגוריה האחרונה של הקטגוריה.
export function findSubcategoryEnd(rows: CatalogRow[], subcategorySheetRow: number): number | null {
  const subIndex = rows.findIndex((r) => r.sheet_row === subcategorySheetRow && r.row_type === 'subcategory');
  if (subIndex === -1) return null;
  for (let i = subIndex + 1; i < rows.length; i++) {
    if (rows[i].row_type === 'category' || rows[i].row_type === 'subcategory') return rows[i].sheet_row;
  }
  return (rows[rows.length - 1]?.sheet_row ?? subcategorySheetRow) + 1;
}

// פותח "חור" ב-insertionPoint: מזיז ימינה (+1) כל שורה עם sheet_row >= insertionPoint.
// חייב לרוץ בסדר יורד כדי לא להתנגש ב-unique constraint על sheet_row.
export async function shiftUpFrom(supabase: SupabaseClient, rows: CatalogRow[], insertionPoint: number): Promise<void> {
  const toShift = rows.filter((r) => r.sheet_row >= insertionPoint).sort((a, b) => b.sheet_row - a.sheet_row);
  for (const r of toShift) {
    const { error } = await supabase.from('products').update({ sheet_row: r.sheet_row + 1 }).eq('id', r.id);
    if (error) throw new Error(error.message);
  }
}

// סוגר "חור" אחרי afterSheetRow: מזיז שמאלה (-1) כל שורה עם sheet_row > afterSheetRow.
// חייב לרוץ בסדר עולה כדי לא להתנגש ב-unique constraint על sheet_row.
export async function shiftDownAfter(supabase: SupabaseClient, rows: CatalogRow[], afterSheetRow: number): Promise<void> {
  const toShift = rows.filter((r) => r.sheet_row > afterSheetRow).sort((a, b) => a.sheet_row - b.sheet_row);
  for (const r of toShift) {
    const { error } = await supabase.from('products').update({ sheet_row: r.sheet_row - 1 }).eq('id', r.id);
    if (error) throw new Error(error.message);
  }
}

// מזיז שורה קיימת (מוצר/תא ריק) למיקום חדש כלשהו בקטלוג - כולל קטגוריה אחרת.
// findDestination מקבל את רשימת השורות בלי השורה המוזזת (אחרי שהחור נסגר) ומחזיר
// את נקודת ההכנסה החדשה - כך שהקורא קובע "לאן", וההזזה עצמה תמיד בטוחה מהתנגשויות.
export async function moveRow(
  supabase: SupabaseClient,
  rowId: number,
  findDestination: (rowsWithoutMoved: CatalogRow[]) => number | null
): Promise<{ error?: string }> {
  const rows = await fetchSortedRows(supabase);
  const moved = rows.find((r) => r.id === rowId);
  if (!moved) return { error: 'השורה לא נמצאה.' };

  const sentinel = Math.min(...rows.map((r) => r.sheet_row)) - 1;

  const { error: sentinelError } = await supabase.from('products').update({ sheet_row: sentinel }).eq('id', moved.id);
  if (sentinelError) return { error: sentinelError.message };

  await shiftDownAfter(supabase, rows, moved.sheet_row); // moved.sheet_row עדיין הערך הישן כאן, לא נשלף מחדש

  const rowsAfterClose = (await fetchSortedRows(supabase)).filter((r) => r.id !== moved.id);
  const destination = findDestination(rowsAfterClose);
  if (destination === null) {
    // מחזירים למקום הישן אם היעד לא נמצא, כדי לא להשאיר שורה "אבודה" בסנטינל
    await supabase.from('products').update({ sheet_row: moved.sheet_row }).eq('id', moved.id);
    return { error: 'היעד לא נמצא.' };
  }

  await shiftUpFrom(supabase, rowsAfterClose, destination);
  const { error: finalError } = await supabase.from('products').update({ sheet_row: destination }).eq('id', moved.id);
  if (finalError) return { error: finalError.message };

  return {};
}

// מחליף sheet_row בין שתי שורות סמוכות (הזזה ↑/↓) דרך ערך זמני (sentinel),
// כדי לא להתנגש ב-unique constraint על sheet_row באמצע ההחלפה.
export async function swapRows(supabase: SupabaseClient, rowAId: number, rowBId: number): Promise<{ error?: string }> {
  const { data, error: fetchError } = await supabase.from('products').select('id, sheet_row').in('id', [rowAId, rowBId]);
  if (fetchError || !data || data.length !== 2) return { error: fetchError?.message ?? 'אחת השורות לא נמצאה.' };

  const rowA = data.find((r) => r.id === rowAId)!;
  const rowB = data.find((r) => r.id === rowBId)!;
  const sentinel = Math.min(rowA.sheet_row, rowB.sheet_row) - 1;

  const { error: e1 } = await supabase.from('products').update({ sheet_row: sentinel }).eq('id', rowA.id);
  if (e1) return { error: e1.message };
  const { error: e2 } = await supabase.from('products').update({ sheet_row: rowA.sheet_row }).eq('id', rowB.id);
  if (e2) return { error: e2.message };
  const { error: e3 } = await supabase.from('products').update({ sheet_row: rowB.sheet_row }).eq('id', rowA.id);
  if (e3) return { error: e3.message };

  return {};
}
