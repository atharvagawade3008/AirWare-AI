import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { ThemeMode } from '../../services/storage/theme-store.ts';

interface Props {
  theme: ThemeMode;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<Props> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex items-center p-1 rounded-full bg-slate-200/80 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 border border-slate-300/80 dark:border-slate-700 transition-all duration-300 shadow-inner group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {/* Sliding pill indicator */}
      <span
        className={`absolute top-1 bottom-1 w-6 h-6 rounded-full transition-all duration-300 transform shadow-sm ${
          isDark
            ? 'left-[calc(100%-1.75rem)] bg-slate-900 border border-slate-600/60 shadow-slate-950/50'
            : 'left-1 bg-white border border-amber-200 shadow-amber-500/20'
        }`}
      />

      {/* Sun icon (Light mode side) */}
      <span
        className={`relative z-10 flex items-center justify-center w-6 h-6 transition-colors duration-200 ${
          !isDark ? 'text-amber-500 font-bold scale-105' : 'text-slate-400 group-hover:text-slate-300'
        }`}
      >
        <Sun className="w-3.5 h-3.5 transition-transform duration-300 rotate-0 dark:-rotate-90" />
      </span>

      {/* Moon icon (Dark mode side) */}
      <span
        className={`relative z-10 flex items-center justify-center w-6 h-6 transition-colors duration-200 ${
          isDark ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 group-hover:text-slate-600'
        }`}
      >
        <Moon className="w-3.5 h-3.5 transition-transform duration-300 rotate-0 dark:-rotate-12" />
      </span>
    </button>
  );
};
