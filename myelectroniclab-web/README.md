# MyElectronicLab — Web (Next.js)

Frontend + Backend מלאים, קוראים/כותבים ישירות ל-Supabase.
זוהי הגרסה עם **Backend אמיתי** - טופס הפנייה, הצ'אט, ופאנל האדמין פונקציונליים.

---

## מה עובד (זהה פונקציונלית לאתר המקורי)

- ✅ קטלוג, קטגוריות, חיפוש, עגלה, מודל מוצר, מוצרים קשורים
- ✅ מצב כהה/בהיר, באנר, אייקוני Iconify, FAB group (גדלים אחידים, נפתח בצד שמאל)
- ✅ **טופס פנייה אמיתי** — כותב ל-Supabase (`/api/tickets`)
- ✅ **צ'אט AI אמיתי** — OpenAI + Tool Calling מול הקטלוג ורעיונות פרויקטים (`/api/chat`), כולל לוג שיחות
- ✅ **פאנל אדמין** — `/admin`, מוגן בסיסמה (SHA-256 hash + session חתום), ניהול פניות

## מה עדיין לא כלול (בכוונה, לפי החלטה)
- Subpages, מדריכים, צ'אט קהילתי — שלבים עתידיים
- Rate limiting אמיתי (Upstash) — כרגע רק הגבלת אורך קלט
- נעילת אדמין אחרי ניסיונות כושלים — לא מיושם עדיין

---

## הגדרת Environment Variables ב-Vercel (חובה!)

לך ל-Vercel → Project → Settings → Environment Variables והוסף:

| Key | איך משיגים |
|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API (כבר קיים מהשלב הקודם) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API Keys (כבר קיים) |
| `SUPABASE_SECRET_KEY` | Supabase → Settings → API Keys → **`sb_secret_...`** (החדש, לא ה-Legacy!) |
| `OPENAI_API_KEY` | platform.openai.com/api-keys |
| `ADMIN_PASSWORD_HASH` | הרץ מקומית: `node -e "console.log(require('crypto').createHash('sha256').update('הסיסמה שלך').digest('hex'))"` והדבק את הפלט |
| `ADMIN_SESSION_SECRET` | כל מחרוזת אקראית ארוכה (למשל תיצור עם `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |

⚠️ **חשוב:** `SUPABASE_SECRET_KEY` הוא ה-Secret **החדש** (`sb_secret_...`), **לא** ה-Legacy `service_role` ששימש את Google Apps Script. ב-Vercel אין את המגבלה שהייתה ב-GAS (User-Agent), אז המפתח החדש עובד ישירות.

**כל המשתנים האלה חייבים להיות ללא `NEXT_PUBLIC_` (מלבד השניים הראשונים)** - כך שהם לעולם לא ייחשפו לדפדפן.

אחרי הוספת המשתנים - **חובה Redeploy** (Vercel לא מיישם משתני סביבה חדשים על deployment קיים).

---

## Push ל-GitHub

```bash
git add .
git commit -m "Real backend: tickets API, chat AI, admin panel"
git push
```

---

## פיתוח מקומי

```bash
npm install
cp .env.local.example .env.local
# ערוך את .env.local עם כל המפתחות האמיתיים
npm run dev
```

---

## מבנה הפרויקט (עדכני)

```
app/
  admin/page.tsx               — פאנל אדמין (login + ניהול פניות)
  api/tickets/route.ts           — POST - כתיבת פנייה חדשה
  api/chat/route.ts               — POST - צ'אט AI (OpenAI + Tool Calling)
  api/admin/login/route.ts         — POST - כניסת אדמין
  api/admin/tickets/route.ts        — GET/PATCH - ניהול פניות (מוגן)
lib/
  supabase-server.ts              — Supabase client עם Secret key (שרת בלבד!)
  admin-auth.ts                    — אימות אדמין (hash + session חתום)
  chat-tools-products.ts            — כלי חיפוש מוצרים לצ'אט
  chat-tools-project-examples.ts     — כלי רעיונות פרויקטים + מניעת חזרות
  (כל שאר lib/ ו-components/ מהשלב הקודם - ללא שינוי)
```
