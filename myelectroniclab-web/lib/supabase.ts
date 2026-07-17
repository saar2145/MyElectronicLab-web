// Version: 1.0
// Title: Supabase Client (Browser-Safe) | Important Data: uses NEXT_PUBLIC_* env vars only,
// the publishable key - never the secret key. RLS on the "products" table restricts this
// to read-only access, matching the policy defined in supabase_schema_v1.0.sql.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and ' +
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel project settings.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// טיפוס בסיסי התואם לסכימת הטבלה (supabase_schema_v1.0.sql)
export type ProductRow = {
  id: number;
  sheet_row: number | null;
  row_type: 'product' | 'category' | 'subcategory' | 'blank';
  name: string | null;
  model: string | null;
  link: string | null;
  price: number | null;
  description: string | null;
  image_url: string | null;
  related_ids: string | null;
  key_names: string | null;
  ali_product_id: string | null;
  commission_status: string | null;
  last_checked: string | null;
  category_title: string | null;
  category_subtitle: string | null;
};
