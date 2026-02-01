'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Desktop } from './desktop';
import { Dock } from './dock';
import { MenuBar } from './menu-bar';
import { Spotlight } from './spotlight';
import { WidgetManager } from './widgets';

export function OSShell() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  const openSpotlight = useCallback(() => setSpotlightOpen(true), []);
  const closeSpotlight = useCallback(() => setSpotlightOpen(false), []);

  // Global keyboard shortcut for Spotlight (Cmd+K or Cmd+Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Cmd+Space to toggle Spotlight
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === ' ')) {
        e.preventDefault();
        setSpotlightOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
