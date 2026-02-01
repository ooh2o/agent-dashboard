'use client';

import { useCallback, useRef, useState, useEffect, createContext, useContext, useMemo } from 'react';

interface FocusableWindow {
  id: string;
  ref: React.RefObject<HTMLElement | null>;
  priority?: number;
}

interface FocusManagerContextValue {
  focusedWindowId: string | null;
  registerWindow: (window: FocusableWindow) => void;
  unregisterWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  focusNextWindow: () => void;
  focusPrevWindow: () => void;
  getZIndex: (id: string) => number;
}

const FocusManagerContext = createContext<FocusManagerContextValue | null>(null);

export function FocusManagerProvider({ children }: { children: React.ReactNode }) {
  const [windows, setWindows] = useState<Map<string, FocusableWindow>>(new Map());
  const [focusStack, setFocusStack] = useState<string[]>([]);
  const focusedWindowId = focusStack[focusStack.length - 1] ?? null;

  const registerWindow = useCallback((window: FocusableWindow) => {
    setWindows(prev => {
      const next = new Map(prev);
      next.set(window.id, window);
      return next;
    });
    setFocusStack(prev => {
      // Add to top of stack if not already present
      if (!prev.includes(window.id)) {
        return [...prev, window.id];
      }
      return prev;
    });
  }, []);

  const unregisterWindow = useCallback((id: string) => {
    setWindows(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setFocusStack(prev => prev.filter(wid => wid !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setFocusStack(prev => {
      // Move to top of stack
      const filtered = prev.filter(wid => wid !== id);
      return [...filtered, id];
    });

    // Focus the first focusable element in the window
    const window = windows.get(id);
    if (window?.ref.current) {
      const focusable = window.ref.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [windows]);

  const focusNextWindow = useCallback(() => {
    if (focusStack.length < 2) return;
    const nextIndex = 0; // Go to bottom of stack (oldest)
    const nextId = focusStack[nextIndex];
    focusWindow(nextId);
  }, [focusStack, focusWindow]);

  const focusPrevWindow = useCallback(() => {
    if (focusStack.length < 2) return;
    const currentIndex = focusStack.length - 1;
    const prevIndex = currentIndex - 1;
    const prevId = focusStack[prevIndex];
    focusWindow(prevId);
  }, [focusStack, focusWindow]);

  const getZIndex = useCallback((id: string) => {
    const index = focusStack.indexOf(id);
    return index === -1 ? 0 : 100 + index;
  }, [focusStack]);

  const value = useMemo(() => ({
    focusedWindowId,
    registerWindow,
    unregisterWindow,
    focusWindow,
    focusNextWindow,
    focusPrevWindow,
    getZIndex,
  }), [
    focusedWindowId,
    registerWindow,
    unregisterWindow,
    focusWindow,
    focusNextWindow,
    focusPrevWindow,
    getZIndex,
  ]);

  return (
    <FocusManagerContext.Provider value={value}>
      {children}
    </FocusManagerContext.Provider>
  );
}

export function useFocusManager() {
  const context = useContext(FocusManagerContext);
  if (!context) {
    throw new Error('useFocusManager must be used within a FocusManagerProvider');
  }
  return context;
}

// Hook for individual windows to register themselves
export function useWindowFocus(id: string, ref: React.RefObject<HTMLElement | null>) {
  const { registerWindow, unregisterWindow, focusedWindowId, focusWindow, getZIndex } = useFocusManager();
  const isFocused = focusedWindowId === id;
  const zIndex = getZIndex(id);

  useEffect(() => {
    registerWindow({ id, ref });
    return () => unregisterWindow(id);
  }, [id, ref, registerWindow, unregisterWindow]);

  const focus = useCallback(() => focusWindow(id), [focusWindow, id]);

  return { isFocused, zIndex, focus };
}

// Hook for live region announcements (screen reader support)
export function useLiveRegion() {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback((text: string) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the message
    setMessage(''); // Clear first to ensure re-announcement
    requestAnimationFrame(() => {
      setMessage(text);
    });

    // Clear after a delay
    timeoutRef.current = setTimeout(() => {
      setMessage('');
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const LiveRegion = useCallback(() => (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  ), [message]);

  return { announce, LiveRegion };
}

// Skip link component for keyboard users
export function SkipLink({ targetId, children }: { targetId: string; children: React.ReactNode }) {
  const handleClick = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView();
    }
  }, [targetId]);

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:outline-none"
    >
      {children}
    </a>
  );
}
