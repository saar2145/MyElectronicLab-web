// Version: 1.1
// Title: Catalog Grouping Logic | Change from v1.0: actually implements
// row_type==='blank' (was a no-op comment before) - pushes a BlankSlot
// placeholder into the same looseProducts/subgroup.products list a product
// would land in, at the same walk-order position. This is what lets an admin
// insert an empty grid cell to control where the public catalog's responsive
// grid wraps to a new row (see components/CategorySection.tsx for the render
// side, and app/api/admin/products/blank/route.ts for how admins create
// these). Important Data: mirrors render() from Index.html - walks the flat
// row list (ordered by sheet_row) and nests products under their most recent
// category/subcategory, exactly like the original Sheets-driven catalog.

import { ProductRow } from './supabase';

export type GroupedProduct = ProductRow & { row_type: 'product' };
export type BlankSlot = { kind: 'blank'; key: string };
export type GridItem = GroupedProduct | BlankSlot;

export type CategoryGroup = {
  id: string;
  title: string;
  subtitle: string | null;
  subgroups: SubcategoryGroup[];
  looseProducts: GridItem[]; // מוצרים (ותאים ריקים) שאינם תחת אף תת-קטגוריה
};

export type SubcategoryGroup = {
  title: string;
  products: GridItem[];
};

export function groupCatalog(rows: ProductRow[]): CategoryGroup[] {
  const sorted = [...rows].sort(
    (a, b) => (a.sheet_row ?? 0) - (b.sheet_row ?? 0)
  );

  const categories: CategoryGroup[] = [];
  let currentCategory: CategoryGroup | null = null;
  let currentSubcategory: SubcategoryGroup | null = null;
  let catIndex = 0;

  for (const row of sorted) {
    if (row.row_type === 'category') {
      currentCategory = {
        id: `cat-${catIndex++}`,
        title: row.category_title ?? '',
        subtitle: row.category_subtitle || null,
        subgroups: [],
        looseProducts: [],
      };
      currentSubcategory = null;
      categories.push(currentCategory);
      continue;
    }

    if (row.row_type === 'subcategory') {
      if (!currentCategory) continue;
      currentSubcategory = { title: row.category_title ?? '', products: [] };
      currentCategory.subgroups.push(currentSubcategory);
      continue;
    }

    if (row.row_type === 'product') {
      if (!currentCategory) continue;
      const product = row as GroupedProduct;
      if (currentSubcategory) {
        currentSubcategory.products.push(product);
      } else {
        currentCategory.looseProducts.push(product);
      }
      continue;
    }

    if (row.row_type === 'blank') {
      if (!currentCategory) continue;
      const slot: BlankSlot = { kind: 'blank', key: `blank-${row.id}` };
      if (currentSubcategory) {
        currentSubcategory.products.push(slot);
      } else {
        currentCategory.looseProducts.push(slot);
      }
    }
  }

  // מסננים קטגוריות ריקות לגמרי (אין מוצרים תחתן בשום מקום)
  return categories.filter(
    (c) =>
      c.looseProducts.length > 0 ||
      c.subgroups.some((s) => s.products.length > 0)
  );
}

export function searchCatalog(
  categories: CategoryGroup[],
  query: string
): CategoryGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return categories;

  // בזמן חיפוש פעיל, תאים ריקים מוסרים מה-scope - אין להם מה "להתאים" לחיפוש,
  // והשארתם הייתה יוצרת רווחים מוזרים בתוצאות המסוננות
  const matchesItem = (item: GridItem): item is GroupedProduct =>
    !('kind' in item) &&
    `${item.name ?? ''} ${item.model ?? ''} ${item.key_names ?? ''}`.toLowerCase().includes(q);

  return categories
    .map((cat) => {
      const categoryTitleMatches = `${cat.title} ${cat.subtitle ?? ''}`
        .toLowerCase()
        .includes(q);

      if (categoryTitleMatches) return cat; // הצג את כל הקטגוריה כמו שהיא

      const filteredSubgroups = cat.subgroups
        .map((s) => ({ ...s, products: s.products.filter(matchesItem) }))
        .filter((s) => s.products.length > 0);

      const filteredLoose = cat.looseProducts.filter(matchesItem);

      if (filteredSubgroups.length === 0 && filteredLoose.length === 0) {
        return null;
      }

      return { ...cat, subgroups: filteredSubgroups, looseProducts: filteredLoose };
    })
    .filter((c): c is CategoryGroup => c !== null);
}
