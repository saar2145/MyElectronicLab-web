// Version: 1.0
// Title: Catalog Parity Page | Important Data: Server Component, reads directly from
// Supabase "products" table via publishable key (read-only, RLS-protected). This is
// Step 0's "hello world" - proves the Next.js -> Supabase data path works end-to-end
// before building the full catalog UI (cart, search, product modal, etc).

import { supabase, ProductRow } from '@/lib/supabase';

async function getProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sheet_row', { ascending: true });

  if (error) {
    console.error('Supabase fetch error:', error.message);
    return [];
  }
  return data ?? [];
}

export default async function Home() {
  const rows = await getProducts();

  const products = rows.filter((r) => r.row_type === 'product');
  const categories = rows.filter((r) => r.row_type === 'category');

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 font-sans">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            📦 MyElectronicLab — בדיקת סנכרון (Next.js + Supabase)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {rows.length === 0
              ? '⚠️ לא התקבלו נתונים - בדוק את משתני הסביבה ב-Vercel'
              : `נטענו ${products.length} מוצרים ו-${categories.length} קטגוריות ישירות מ-Supabase`}
          </p>
        </header>

        {rows.length === 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
            <p className="font-semibold">לא נמצאו נתונים.</p>
            <ul className="mt-2 list-disc pr-5 text-sm">
              <li>ודא ש-<code>NEXT_PUBLIC_SUPABASE_URL</code> ו-<code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> מוגדרים ב-Vercel → Settings → Environment Variables</li>
              <li>ודא שהרצת סנכרון מלא לפחות פעם אחת מהגיליון (Code.gs)</li>
              <li>בדוק ב-Supabase Table Editor שיש שורות בטבלת <code>products</code></li>
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
            >
              <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name ?? ''}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-3xl">📦</span>
                )}
              </div>
              <div className="line-clamp-2 text-sm font-semibold text-slate-800">
                {p.name}
              </div>
              {p.model && (
                <div className="mt-1 line-clamp-1 text-xs text-slate-500">{p.model}</div>
              )}
              {p.price !== null && (
                <div className="mt-2 inline-block w-fit rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                  ₪{p.price}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// רענון הנתונים בכל בקשה (מתאים לשלב הבדיקה; נשדרג ל-ISR/cache בהמשך)
export const revalidate = 0;
