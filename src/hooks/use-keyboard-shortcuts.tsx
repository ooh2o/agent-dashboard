'use client';

import { useEffect, useCallback, useRef, createContext, useContext, useState, useMemo } from 'react';

// Platform detection for displaying correct modifier symbols
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export const MOD_KEY = isMac ? 'Meta' : 'Control';
export const MOD_SYMBOL = isMac ? '⌘' : 'Ctrl';

export interface KeyboardShortcut {
  id: string;
  keys: string[]; // e.g., ['Meta', 'k'] or ['Control', 'Shift', 'p']
  label: string;
  description?: string;
  category?: string;
  action: () => void;
  global?: boolean; // Works even when inputs are focused
  disabled?: boolean;
}

interface KeyboardShortcutContextValue {
  shortcuts: Map<string, KeyboardShortcut>;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  getShortcutsByCategory: () => Map<string, KeyboardShortcut[]>;
  formatShortcut: (keys: string[]) => string;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextValue | null>(null);

// Format keys for display
export function formatKeyDisplay(keys: string[]): string {
  return keys.map(key => {
    switch (key) {
      case 'Meta': return MOD_SYMBOL;
      case 'Control': return isMac ? '⌃' : 'Ctrl';
      case 'Alt': return isMac ? '⌥' : 'Alt';
      case 'Shift': return isMac ? '⇧' : 'Shift';
      case 'Enter': return '↵';
      case 'Escape': return 'Esc';
      case 'ArrowUp': return '↑';
      case 'ArrowDown': return '↓';
      case 'ArrowLeft': return '←';
      case 'ArrowRight': return '→';
      case 'Backspace': return '⌫';
      case 'Delete': return '⌦';
      case 'Tab': return '⇥';
      case ' ': return 'Space';
      default: return key.length === 1 ? key.toUpperCase() : key;
    }
  }).join(isMac ? '' : '+');
}

// Normalize key names for comparison
function normalizeKey(key: string): string {
  const normalized = key.toLowerCase();
  // Handle common aliases
  switch (normalized) {
    case 'cmd':
    case 'command':
    case 'meta':
      return 'meta';
    case 'ctrl':
    case 'control':
      return 'control';
    case 'opt':
    case 'option':
    case 'alt':
      return 'alt';
    case 'esc':
      return 'escape';
    default:
      return normalized;
  }
}

// Build a unique key string from keys array
function buildShortcutKey(keys: string[]): string {
  const normalized = keys.map(normalizeKey).sort();
  return normalized.join('+');
}

// Check if an element is an input that should block shortcuts
function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable
  );
}

export function KeyboardShortcutProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Map<string, KeyboardShortcut>>(new Map());
  const [isEnabled, setEnabled] = useState(true);
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => {
      const next = new Map(prev);
      next.set(shortcut.id, shortcut);
      return next;
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const getShortcutsByCategory = useCallback(() => {
    const categories = new Map<string, KeyboardShortcut[]>();
    shortcuts.forEach(shortcut => {
      const category = shortcut.category || 'General';
      const existing = categories.get(category) || [];
      categories.set(category, [...existing, shortcut]);
    });
    return categories;
  }, [shortcuts]);

  const formatShortcut = useCallback((keys: string[]) => formatKeyDisplay(keys), []);

  // Global keyboard event handler
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Build current key combination
      const currentKeys: string[] = [];
      if (event.metaKey) currentKeys.push('meta');
      if (event.ctrlKey) currentKeys.push('control');
      if (event.altKey) currentKeys.push('alt');
      if (event.shiftKey) currentKeys.push('shift');
      currentKeys.push(event.key.toLowerCase());

      const currentShortcutKey = currentKeys.sort().join('+');
      const isInput = isInputElement(event.target);

      // Find matching shortcut
      for (const shortcut of shortcutsRef.current.values()) {
        if (shortcut.disabled) continue;

        const shortcutKey = buildShortcutKey(shortcut.keys);
        if (shortcutKey === currentShortcutKey) {
          // Block non-global shortcuts when in input
          if (isInput && !shortcut.global) continue;

          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isEnabled]);

  const value = useMemo(() => ({
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    isEnabled,
    setEnabled,
    getShortcutsByCategory,
    formatShortcut,
  }), [shortcuts, registerShortcut, unregisterShortcut, isEnabled, getShortcutsByCategory, formatShortcut]);

  return (
    <KeyboardShortcutContext.Provider value={value}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutProvider');
  }
  return context;
}

// Hook to register a single shortcut
export function useShortcut(
  shortcut: Omit<KeyboardShortcut, 'action'> & { action: () => void },
  deps: React.DependencyList = []
) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    registerShortcut(shortcut);
    return () => unregisterShortcut(shortcut.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcut.id, ...deps]);
}

// Hook for focus management
export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [containerRef, isActive]);
}

// Hook for arrow key navigation within a list
export function useArrowNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  options: {
    selector?: string;
    loop?: boolean;
    orientation?: 'vertical' | 'horizontal' | 'both';
    onSelect?: (element: HTMLElement, index: number) => void;
  } = {}
) {
  const {
    selector = '[role="option"], [role="menuitem"], button',
    loop = true,
    orientation = 'vertical',
    onSelect,
  } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const getItems = () => Array.from(container.querySelectorAll<HTMLElement>(selector));

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = getItems();
      if (items.length === 0) return;

      const currentIndex = items.findIndex(item => item === document.activeElement);
      let nextIndex = currentIndex;

      const isVerticalKey = event.key === 'ArrowUp' || event.key === 'ArrowDown';
      const isHorizontalKey = event.key === 'ArrowLeft' || event.key === 'ArrowRight';

      if (orientation === 'vertical' && !isVerticalKey) return;
      if (orientation === 'horizontal' && !isHorizontalKey) return;

      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          nextIndex = currentIndex <= 0
            ? (loop ? items.length - 1 : 0)
            : currentIndex - 1;
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          nextIndex = currentIndex >= items.length - 1
            ? (loop ? 0 : items.length - 1)
            : currentIndex + 1;
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = items.length - 1;
          break;
        case 'Enter':
        case ' ':
          if (currentIndex >= 0) {
            event.preventDefault();
            onSelect?.(items[currentIndex], currentIndex);
          }
          return;
        default:
          return;
      }

      items[nextIndex]?.focus();
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, selector, loop, orientation, onSelect]);
}
