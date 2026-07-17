# MyElectronicLab — Web (Next.js)

Frontend חדש שקורא ישירות מ-Supabase, כתחליף עתידי ל-`Index.html`
הקיים ב-Google Apps Script. חלק מתוכנית ה-Scale-Up (שלב 1).

---

## מה כבר עובד

- ✅ קטלוג מלא — כרטיסי מוצר, קטגוריות, תת-קטגוריות
- ✅ סרגל ניווט צדדי (קפיצה חלקה לקטגוריה)
- ✅ חיפוש חי (שם / דגם / מילות מפתח / התאמת קטגוריה שלמה)
- ✅ מודל מוצר מורחב — תיאור, מוצרים קשורים, מזהה לדיבאגינג
- ✅ עגלת קניות (localStorage, נשמרת בין ביקורים)
- ✅ הוספה לעגלה עם אנימציית ✓ ירוקה
- ✅ "רכישת כל המוצרים בעגלה" — פותח כל קישור בכרטיסייה נפרדת
- ✅ עיצוב מותג (כחול-ציאן, גרדיאנט header, RTL מלא)
- ✅ טעינה מותאמת (loading.tsx), favicon תואם לאתר המקורי

## מה עדיין חסר (שלבים הבאים)
- AI Agent, טופס פנייה, פאנל אדמין — דורשים Backend (API Routes)
- Subpages אמיתיים (`/product/[id]`, `/category/[slug]`)
- מדריכים/הסברים, צ'אט קהילתי

---

## פריסה ל-Vercel

### 1. Push ל-GitHub
```bash
git add .
git commit -m "Step 1: cart, product modal, related products, design polish"
git push
```

### 2. Environment Variables (אם עוד לא הוגדרו)
ב-Vercel → Project Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://viqmlpipgzrfulbauotv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | מפתח ה-Publishable שלך |

Vercel יפרוס אוטומטית בכל push.

---

## פיתוח מקומי

```bash
npm install
cp .env.local.example .env.local
# ערוך את .env.local עם המפתחות האמיתיים
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000)

---

## מבנה הפרויקט

```
app/
  layout.tsx        — Root layout (RTL, favicon, metadata)
  loading.tsx        — מסך טעינה ממותג
  page.tsx           — Server Component - שולף נתונים מ-Supabase
components/
  AppShell.tsx        — ה-state הראשי: view switching, חיפוש, מודל
  ProductCard.tsx      — כרטיס מוצר + הוספה מהירה לעגלה
  ProductModal.tsx     — תצוגה מורחבת + מוצרים קשורים
  CategorySection.tsx  — קטגוריה + תת-קטגוריות + גריד
  Sidebar.tsx          — ניווט צדדי
  SearchBar.tsx         — שדה חיפוש
  CartView.tsx          — עמוד עגלה
lib/
  supabase.ts           — Supabase client (Publishable key בלבד)
  cloudinary.ts          — טרנספורמציית תמונות
  catalog.ts             — קיבוץ שורות שטוחות לקטגוריות/תת-קטגוריות + חיפוש
  cart-context.tsx        — React Context לעגלה (localStorage)
```
