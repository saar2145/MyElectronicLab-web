# MyElectronicLab — Web (Next.js)

שלב 0 בתוכנית ה-Scale-Up: Frontend חדש שקורא ישירות מ-Supabase,
כתחליף עתידי ל-`Index.html` הקיים ב-Google Apps Script.

כרגע זה עמוד בדיקה בסיסי בלבד ("Hello World") — מציג את הקטלוג
האמיתי שנשלף מ-Supabase, כדי לוודא שכל השרשרת עובדת מקצה לקצה
לפני שבונים את שאר הפיצ'רים (עגלה, חיפוש, מודל מוצר, AI Agent וכו').

---

## פריסה ל-Vercel (שלב-אחר-שלב)

### 1. Push ל-GitHub
```bash
git init
git add .
git commit -m "Initial Next.js scaffold - Step 0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/myelectroniclab-web.git
git push -u origin main
```

### 2. חיבור ל-Vercel
1. גש ל-[vercel.com](https://vercel.com) → **Add New** → **Project**
2. בחר את ה-repo `myelectroniclab-web`
3. Framework Preset: **Next.js** (מזוהה אוטומטית)
4. **לפני שלוחצים Deploy** — לחץ **Environment Variables** והוסף:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://viqmlpipgzrfulbauotv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | (מפתח ה-Publishable שלך, `sb_publishable_...`) |

⚠️ **חשוב:** להשתמש רק במפתח **Publishable** — לעולם לא ה-Secret key כאן (זה קוד שרץ בדפדפן).

5. לחץ **Deploy**

### 3. בדיקה
אחרי כ-דקה, Vercel ייתן לך כתובת כמו `myelectroniclab-web.vercel.app`.
תיכנס ותראה את המוצרים האמיתיים מהקטלוג שלך — זו ההוכחה ש-Next.js → Supabase עובד.

---

## פיתוח מקומי (אופציונלי)

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
  layout.tsx       — Root layout (RTL, פונטים)
  page.tsx         — עמוד הקטלוג (Server Component, קורא מ-Supabase)
  globals.css       — Tailwind + עיצוב בסיסי
lib/
  supabase.ts       — Supabase client (Publishable key בלבד, בטוח לדפדפן)
```

## מה הלאה (שלב 1)
- בניית כרטיסי מוצר מלאים (תמונה, מודל, קישור לרכישה)
- עגלת קניות
- חיפוש וסינון קטגוריות
- מודל מוצר מורחב + מוצרים קשורים
- Subpages אמיתיים (`/product/[id]`, `/category/[slug]`)
