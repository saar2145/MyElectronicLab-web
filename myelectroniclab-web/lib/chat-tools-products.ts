// Version: 1.0
// Title: Chat Tool - Product Search | Important Data: queries the "products" table
// (row_type='product') for name/model/key_names matches - server-side only, ports
// agentSearchProducts_() from Code.gs.

import { getSupabaseServerClient } from './supabase-server';

export async function searchProductsTool(keywords: string[], maxPrice?: number) {
  const supabase = getSupabaseServerClient();
  const lowerKw = keywords.map((k) => k.toLowerCase().trim()).filter(Boolean);
  if (lowerKw.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select('name, model, price, link, description, key_names')
    .eq('row_type', 'product')
    .limit(200); // נשלוף מבחר סביר ונסנן בזיכרון (טבלה קטנה - קטלוג רכיבים)

  if (error || !data) return [];

  const results = data.filter((p) => {
    const haystack = `${p.name ?? ''} ${p.model ?? ''} ${p.description ?? ''} ${p.key_names ?? ''}`.toLowerCase();
    const matches = lowerKw.some((kw) => haystack.includes(kw));
    if (!matches) return false;
    if (maxPrice && p.price != null && p.price > maxPrice) return false;
    return true;
  });

  return results.slice(0, 5).map((p) => ({
    name: p.name,
    model: p.model,
    price: p.price ? `₪${p.price}` : '',
    link: p.link,
    description: p.description,
  }));
}
