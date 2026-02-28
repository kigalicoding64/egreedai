import { useEffect } from 'react';

interface ShortcutHandlers {
  onNewChat?: () => void;
  onSearch?: () => void;
  onToggleVoice?: () => void;
  onToggleSidebar?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      // Don't trigger in inputs/textareas unless it's our shortcuts
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      switch (e.key.toLowerCase()) {
        case 'n': // Ctrl/Cmd + N → New chat
          if (e.shiftKey) {
            e.preventDefault();
            handlers.onNewChat?.();
          }
          break;
        case 'k': // Ctrl/Cmd + K → Search
          e.preventDefault();
          handlers.onSearch?.();
          break;
        case 'm': // Ctrl/Cmd + M → Toggle voice
          if (!isInput) {
            e.preventDefault();
            handlers.onToggleVoice?.();
          }
          break;
        case 'b': // Ctrl/Cmd + B → Toggle sidebar
          if (!isInput) {
            e.preventDefault();
            handlers.onToggleSidebar?.();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
