// Version: 1.0
// Title: Theme Context | Important Data: sets html[data-theme] attribute which
// globals.css reads to swap CSS custom properties - identical mechanism to the
// original Index.html theme system. Persisted via localStorage "myl_theme".

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextType = { theme: Theme; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextType | null>(null);
const STORAGE_KEY = 'myl_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial =
      saved ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינה חד-פעמית מ-localStorage, ראה הערה ב-cart-context.tsx
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
