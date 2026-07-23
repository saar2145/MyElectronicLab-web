// Version: 1.0
// Title: Email Domain Autocomplete | Important Data: shared by every email
// input on the auth pages (login/register/forgot-password) - as soon as the
// local part (before "@") is non-empty, shows a dropdown of
// "{local}@{domain}" completions for common providers, filtered by whatever
// is typed after "@" if any. Gmail is first in DOMAINS on purpose (most
// requested). Keyboard: Up/Down to move, Enter to pick, Escape to close.
// autoComplete="off" on the <input> is intentional - without it the
// browser's own native autofill dropdown fights this one for the same
// space, which looks broken; this custom list replaces that role.

'use client';

import { useEffect, useRef, useState } from 'react';

const DOMAINS = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'walla.co.il'];

export default function EmailAutocomplete({
  value,
  onChange,
  onEnter,
  className,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const atIndex = value.indexOf('@');
  const localPart = atIndex === -1 ? value : value.slice(0, atIndex);
  const domainTyped = atIndex === -1 ? '' : value.slice(atIndex + 1);

  const suggestions = localPart
    ? DOMAINS.filter((d) => d.startsWith(domainTyped) && d !== domainTyped)
    : [];

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  function select(domain: string) {
    onChange(`${localPart}@${domain}`);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (open && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        select(suggestions[activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
    }
    if (e.key === 'Enter') onEnter?.();
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="email"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className={className}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-brand-category bg-brand-cardbg shadow-lg">
          {suggestions.map((domain, i) => (
            <li key={domain}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(domain)}
                className={`flex w-full items-center gap-1 px-3 py-2 text-right text-sm transition ${
                  i === activeIndex ? 'bg-brand-bg text-brand-text' : 'text-brand-text hover:bg-brand-bg'
                }`}
              >
                <span className="text-brand-textsoft">{localPart}@</span>
                <span className="font-bold">{domain}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
