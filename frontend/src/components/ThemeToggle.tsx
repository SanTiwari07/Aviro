import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border transition-all duration-200 hover:bg-surface-elevated text-content-secondary hover:text-content-primary focus:outline-none focus:ring-1 focus:ring-brand shadow-subtle ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-status-amber transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-brand-prussian transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
