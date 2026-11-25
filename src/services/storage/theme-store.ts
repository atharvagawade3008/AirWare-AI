export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'airaware_theme';

/** Stored choice wins; otherwise follow the OS preference. */
export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage can be blocked (private mode); fall through to the OS preference.
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  const isDark = theme === 'dark';

  // Briefly mark the page so background/color/border transitions run once,
  // then clear it so data-driven fills (AQI bars, donut slices) stay instant.
  root.classList.add('transitioning');
  root.classList.toggle('dark', isDark);
  root.style.colorScheme = theme;

  if (typeof window !== 'undefined') {
    // Wait for the CSS transition to start, then remove the helper class so
    // the page stops transitioning after the fade completes.
    requestAnimationFrame(() => {
      try {
        window.setTimeout(() => root.classList.remove('transitioning'), 220);
      } catch {}
    });
  }
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Persisting is best-effort; the theme still applies for this session.
  }
}
