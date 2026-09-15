import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('studio-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('studio-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return [theme, setTheme] as const;
}
