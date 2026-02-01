'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Desktop } from './desktop';
import { Dock } from './dock';
import { MenuBar } from './menu-bar';
import { Spotlight } from './spotlight';
import { WidgetManager } from './widgets';
import { useWindowStore } from '@/lib/stores/window-store';

export function OSShell() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const { windows, closeWindow, minimizeWindow, focusWindow, activeWindowId } = useWindowStore();

  const openSpotlight = useCallback(() => setSpotlightOpen(true), []);
  const closeSpotlight = useCallback(() => setSpotlightOpen(false), []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Still allow Escape to close spotlight
        if (e.key === 'Escape' && spotlightOpen) {
          e.preventDefault();
          setSpotlightOpen(false);
        }
        return;
      }

      // Cmd+K or Cmd+Space to toggle Spotlight
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === ' ')) {
        e.preventDefault();
        setSpotlightOpen(prev => !prev);
        return;
      }

      // Escape to close spotlight
      if (e.key === 'Escape' && spotlightOpen) {
        e.preventDefault();
        setSpotlightOpen(false);
        return;
      }

      // Window management shortcuts (only when we have windows)
      if ((e.metaKey || e.ctrlKey) && activeWindowId) {
        const activeWindow = windows.find(w => w.id === activeWindowId);

        // Cmd+W - Close focused window
        if (e.key === 'w') {
          e.preventDefault();
          closeWindow(activeWindowId);
          return;
        }

        // Cmd+M - Minimize focused window
        if (e.key === 'm') {
          e.preventDefault();
          minimizeWindow(activeWindowId);
          return;
        }

        // Cmd+Q - Close all windows of the focused app
        if (e.key === 'q' && activeWindow) {
          e.preventDefault();
          const appWindows = windows.filter(w => w.appId === activeWindow.appId);
          appWindows.forEach(w => closeWindow(w.id));
          return;
        }
      }

      // Cmd+1/2/3... - Switch between open windows
      if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        const visibleWindows = windows.filter(w => !w.isMinimized);
        if (visibleWindows[index]) {
          focusWindow(visibleWindows[index].id);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spotlightOpen, windows, activeWindowId, closeWindow, minimizeWindow, focusWindow]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-zinc-950">
      <MenuBar onSpotlightOpen={openSpotlight} />
      <Desktop>
        <Spotlight isOpen={spotlightOpen} onClose={closeSpotlight} />
        <WidgetManager />
      </Desktop>
      <Dock />
    </div>
  );
}
