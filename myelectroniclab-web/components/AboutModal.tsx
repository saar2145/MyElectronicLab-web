// Version: 1.0
// Title: About Modal | Important Data: exact text content matching the original
// "קצת עלינו" welcome popup, including the AliExpress disclosure note.

'use client';

import { Icon } from '@iconify/react';

export default function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-brand-cardbg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-t-2xl px-7 py-6 text-center"
          style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
        >
          <h2 className="text-xl font-bold text-white">📦 קצת עלינו</h2>
        </div>

        <div className="flex flex-col gap-4 px-7 py-6 text-sm leading-relaxed text-brand-text">
          <p>
            בתור מי שמכיר מקרוב את העבודה על פרויקט גמר, אני יודע כמה זמן יקר
            מתבזבז על חיפושי רכיבים ברשת. כשזמן ההגשה מתקרב, הדבר האחרון שאתם
            צריכים זה לשרוף שעות על מציאת הספק הנכון, או להמתין שבועות ארוכים
            למשלוח שמתעכב.
          </p>
          <p>
            המטרה שלי כאן היא פשוטה: לעזור לסטודנטים, ולרכז את כל הציוד,
            החיישנים והרכיבים שצריך לפרויקט – במקום אחד!
          </p>

          <div className="font-bold">מה מיוחד ברכיבים שכאן?</div>

          <div className="flex gap-2.5 rounded-xl bg-brand-bg p-3.5">
            <Icon icon="solar:check-circle-bold" width={22} className="shrink-0 text-green-600" />
            <div>
              <strong className="block">נבחרים בקפידה</strong>
              כל מוצר באתר נבחר בקפידה ועבר סינון איכות. אני דואג להציג אך ורק
              רכיבים טובים שמגיעים מספקים מוכרים, אמינים ומומלצים.
            </div>
          </div>

          <div className="flex gap-2.5 rounded-xl bg-brand-bg p-3.5">
            <Icon icon="solar:rocket-bold" width={22} className="shrink-0 text-brand-link" />
            <div>
              <strong className="block">משלוח מהיר</strong>
              הזמן שלכם בפרויקט הוא קריטי. לכן, כל המוצרים המופיעים באתר הם
              מתוך קטגוריות המשלוח המהיר של AliExpress, כדי שהציוד יגיע
              אליכם כמה שיותר מהר.
            </div>
          </div>

          <div className="flex gap-2 rounded-xl bg-brand-price/60 p-3.5 text-xs leading-relaxed">
            <Icon icon="solar:danger-triangle-bold" width={18} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <strong>חשוב לדעת:</strong> האתר הזה אינו חנות ואינו עוסק במכירה
              ישירה. הקנייה עצמה מתבצעת ישירות ובצורה בטוחה מול AliExpress.
              אני פשוט חוסך לכם את כאב הראש של החיפושים והסינונים, כדי
              שתוכלו להשקיע את הזמן נטו בפיתוח הפרויקט שלכם.
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-1 w-full rounded-xl bg-brand-name py-3 text-sm font-bold text-brand-text hover:brightness-95"
          >
            בואו נתחיל! <Icon icon="solar:cart-large-minimalistic-bold" width={16} className="inline" />
          </button>
        </div>
      </div>
    </div>
  );
}
