// Version: 1.0
// Title: FAB Group | Important Data: bottom-left floating buttons. On mobile
// (<768px, detected via matchMedia), first tap expands ALL labels together,
// second tap on the SAME button executes the action - exact behavior from the
// original Index.html mobile FAB pattern.

'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';

export default function FabGroup({
  onOpenChat,
  onOpenTicket,
  onOpenAbout,
}: {
  onOpenChat: () => void;
  onOpenTicket: () => void;
  onOpenAbout: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- חייב לרוץ אחרי mount: window.matchMedia לא קיים ב-SSR
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  function handleClick(action: () => void) {
    if (!isMobile) {
      action();
      return;
    }
    if (!expanded) {
      setExpanded(true);
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
      collapseTimer.current = setTimeout(() => setExpanded(false), 3000);
    } else {
      setExpanded(false);
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
      action();
    }
  }

  const buttons: Array<{
    icon: string;
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary' | 'ghost';
  }> = [
    { icon: 'solar:chat-round-dots-bold', label: 'עזרה / שאל את ה-AI', onClick: onOpenChat, variant: 'primary' },
    { icon: 'solar:letter-bold', label: 'צור קשר / דווח', onClick: onOpenTicket, variant: 'secondary' },
    { icon: 'solar:info-circle-bold', label: 'אודות / קצת עלינו', onClick: onOpenAbout, variant: 'ghost' },
  ];

  return (
    <div ref={groupRef} className="fixed bottom-4 left-4 z-50 flex flex-col items-stretch gap-2.5">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={() => handleClick(btn.onClick)}
          className={`flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-bold shadow-lg transition ${
            btn.variant === 'primary'
              ? 'text-white'
              : btn.variant === 'secondary'
                ? 'bg-brand-cardbg text-brand-text'
                : 'border border-brand-category bg-brand-bg text-brand-textsoft'
          }`}
          style={
            btn.variant === 'primary'
              ? { background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }
              : undefined
          }
        >
          <Icon icon={btn.icon} width={19} />
          <span
            className={`overflow-hidden whitespace-nowrap transition-all ${
              isMobile ? (expanded ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0') : 'max-w-[180px] opacity-100'
            }`}
          >
            {btn.label}
          </span>
        </button>
      ))}
    </div>
  );
}
