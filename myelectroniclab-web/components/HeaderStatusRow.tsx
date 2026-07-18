// Version: 1.0
// Title: Header Status Row | Important Data: refresh button + theme toggle
// (Iconify icons matching original solar:restart-bold / solar:moon-bold /
// solar:sun-2-bold) + "עודכן לאחרונה" timestamp.

'use client';

import { Icon } from '@iconify/react';
import { useTheme } from '@/lib/theme-context';

export default function HeaderStatusRow({
  lastUpdated,
  onRefresh,
  refreshing,
}: {
  lastUpdated: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center justify-between text-xs text-white/70">
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-bold text-white transition hover:bg-white/25 disabled:opacity-50"
        >
          <Icon
            icon="solar:restart-bold"
            width={13}
            className={refreshing ? 'animate-spin' : ''}
          />
          רענון
        </button>
        <button
          onClick={toggleTheme}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          aria-label="החלף מצב תצוגה"
        >
          <Icon icon={theme === 'dark' ? 'solar:sun-2-bold' : 'solar:moon-bold'} width={15} />
        </button>
      </div>
      <span>עודכן לאחרונה: {lastUpdated}</span>
    </div>
  );
}
