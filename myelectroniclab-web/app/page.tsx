// Version: 3.0
// Title: Catalog Home Page | Important Data: Server Component - fetches all rows
// from Supabase once per request, hands off to AppShell (Client Component) which
// manages view switching (catalog/cart), search, and the product modal.

import { supabase, ProductRow } from '@/lib/supabase';
import AppShell from '@/components/AppShell';

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

  if (rows.length === 0) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-800">
          <p className="font-semibold">⚠️ לא נמצאו נתונים</p>
          <ul className="mt-2 list-disc pr-5 text-sm">
            <li>ודא ש-Environment Variables מוגדרים נכון ב-Vercel</li>
            <li>ודא שהרצת סנכרון מלא לפחות פעם אחת מהגיליון (Code.gs)</li>
          </ul>
        </div>
      </main>
    );
  }

  return <AppShell rows={rows} />;
}

// רענון הנתונים בכל בקשה (מתאים לשלב הבדיקה; נשדרג ל-ISR/cache בהמשך)
export const revalidate = 0;
