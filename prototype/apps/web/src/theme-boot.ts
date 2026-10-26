import { THEME_STORAGE_KEY } from './app/theme/theme-key';

try {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  const theme: unknown = raw ? JSON.parse(raw)?.state?.theme : null;
  const dark =
    theme === 'dark' ||
    ((theme === 'system' || theme == null) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
} catch {}
