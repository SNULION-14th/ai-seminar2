import { useEffect } from 'react';

interface UseKeyboardShortcutsOptions {
  onSearchFocus?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({ onSearchFocus, onEscape }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onSearchFocus?.();
      } else if (e.key === 'Escape') {
        onEscape?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchFocus, onEscape]);
}
