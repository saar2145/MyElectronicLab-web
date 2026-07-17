// Version: 1.0
// Title: Catalog Grouping Logic | Important Data: mirrors render() from Index.html -
// walks the flat row list (ordered by sheet_row) and nests products under their
// most recent category/subcategory, exactly like the original Sheets-driven catalog.

import { ProductRow } from './supabase';

export type GroupedProduct = ProductRow & { row_type: 'product' };

export type CategoryGroup = {
  id: string;
  title: string;
  subtitle: string | null;
  subgroups: SubcategoryGroup[];
  looseProducts: GroupedProduct[]; // מוצרים שאינם תחת אף תת-קטגוריה
};

export type SubcategoryGroup = {
  title: string;
  products: GroupedProduct[];
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

    // row_type === 'blank' → placeholder grid cell, handled at render time if needed
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

  const matchesProduct = (p: GroupedProduct) =>
    `${p.name ?? ''} ${p.model ?? ''} ${p.key_names ?? ''}`
      .toLowerCase()
      .includes(q);

  return categories
    .map((cat) => {
      const categoryTitleMatches = `${cat.title} ${cat.subtitle ?? ''}`
        .toLowerCase()
        .includes(q);

      if (categoryTitleMatches) return cat; // הצג את כל הקטגוריה כמו שהיא

      const filteredSubgroups = cat.subgroups
        .map((s) => ({ ...s, products: s.products.filter(matchesProduct) }))
        .filter((s) => s.products.length > 0);

      const filteredLoose = cat.looseProducts.filter(matchesProduct);

      if (filteredSubgroups.length === 0 && filteredLoose.length === 0) {
        return null;
      }

      return { ...cat, subgroups: filteredSubgroups, looseProducts: filteredLoose };
    })
    .filter((c): c is CategoryGroup => c !== null);
}
