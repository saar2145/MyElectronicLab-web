# MyElectronicLab — Web (Next.js)

Frontend חדש שקורא ישירות מ-Supabase. חלק מתוכנית ה-Scale-Up.
זוהי גרסת **פריטי עיצוב מלא** - עיצוב ופיצ'רים תואמים 1:1 לאתר המקורי.

---

## מה כבר עובד (זהה לאתר המקורי)

- ✅ קטלוג מלא — כרטיסים, קטגוריות, תת-קטגוריות, חיפוש חי
- ✅ סרגל ניווט צדדי + מודל מוצר מורחב + מוצרים קשורים
- ✅ עגלת קניות (localStorage) + "רכישת הכל"
- ✅ **מצב כהה/בהיר** — כפתור החלפה, פלטת צבעים זהה למקור, ללא הבהוב בטעינה
- ✅ **באנר** — אותה תמונה בדיוק, גדלים רספונסיביים
- ✅ **אייקוני Iconify** — solar:*, majesticons:open-line, mdi:robot — לא אימוג'ים
- ✅ **כפתורי FAB** — צ'אט / פנייה / אודות, עם התנהגות מובייל דו-לחיצה זהה למקור
- ✅ **מודל "קצת עלינו"** — טקסט מדויק מהאתר המקורי
- ✅ **טופס פנייה** — UI מלא (שלח = placeholder, ממתין לחיבור Backend)
- ✅ **פאנל צ'אט AI** — UI מלא (תשובות = placeholder, ממתין לחיבור Backend)
- ✅ כפתור רענון + חותמת "עודכן לאחרונה"
- ✅ פוטר מדויק ("כל הזכויות שמורות. © 2026 MyElectronicLab" + "By Saar Cohen")

## מה עדיין דורש Backend (שלב 2)
- חיבור אמיתי של טופס הפנייה ל-Supabase (כרגע UI בלבד)
- חיבור אמיתי של הצ'אט ל-OpenAI + Tool Calling (כרגע UI בלבד)
- פאנל אדמין

## מה עדיין לא קיים (שלבים מאוחרים יותר)
- Subpages אמיתיים (`/product/[id]`, `/category/[slug]`)
- מדריכים/הסברים, צ'אט קהילתי

---

## פריסה ל-Vercel

```bash
git add .
git commit -m "Full design parity: theme, icons, FAB, banner, modals"
git push
```

Environment Variables (אם עוד לא הוגדרו) ב-Vercel → Settings:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://viqmlpipgzrfulbauotv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | מפתח ה-Publishable שלך |

---

## פיתוח מקומי

```bash
npm install
cp .env.local.example .env.local
# ערוך את .env.local עם המפתחות האמיתיים
npm run dev
```

---

## מבנה הפרויקט

```
app/
  layout.tsx          — RTL, favicon, סקריפט מניעת הבהוב theme
  loading.tsx          — מסך טעינה ממותג
  page.tsx              — Server Component - שולף מ-Supabase
components/
  AppShell.tsx           — state מרכזי: view, חיפוש, מודלים, theme+cart providers
  Banner.tsx              — תמונת הבאנר
  HeaderStatusRow.tsx      — רענון + theme toggle + עודכן לאחרונה
  FabGroup.tsx              — צ'אט / פנייה / אודות (עם לוגיקת מובייל)
  AboutModal.tsx             — "קצת עלינו"
  TicketModal.tsx             — טופס פנייה (UI, ממתין ל-Backend)
  ChatPanel.tsx                — צ'אט AI (UI, ממתין ל-Backend)
  ProductCard.tsx / ProductModal.tsx / CategorySection.tsx / Sidebar.tsx / SearchBar.tsx / CartView.tsx
lib/
  supabase.ts             — Supabase client (Publishable key)
  cloudinary.ts             — טרנספורמציית תמונות
  catalog.ts                 — קיבוץ + חיפוש
  cart-context.tsx             — עגלה (React Context + localStorage)
  theme-context.tsx             — מצב כהה/בהיר (React Context + localStorage)
```
