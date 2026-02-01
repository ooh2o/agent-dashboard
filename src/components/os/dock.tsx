'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWindowStore } from '@/lib/stores/window-store';
import { APPS, DOCK_APPS, getApp } from '@/lib/apps-registry';

export function Dock() {
  const { windows, openWindow, focusWindow, restoreWindow } = useWindowStore();
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  const dockApps = DOCK_APPS.map(id => getApp(id)).filter(Boolean);

  const handleAppClick = (appId: string) => {
    const app = getApp(appId);
    if (!app) return;

    const appWindows = windows.filter(w => w.appId === appId);

    if (appWindows.length === 0) {
      // No windows open, create one
      openWindow(appId, app.name);
    } else {
      // Find a minimized window or the topmost window
      const minimized = appWindows.find(w => w.isMinimized);
      if (minimized) {
        restoreWindow(minimized.id);
      } else {
        // Focus the topmost window
        const topWindow = appWindows.reduce((a, b) => a.zIndex > b.zIndex ? a : b);
        focusWindow(topWindow.id);
      }
    }
  };

  const getRunningIndicator = (appId: string) => {
    return windows.some(w => w.appId === appId && !w.isMinimized);
  };

  return (
    <motion.div
      className={cn(
        'fixed bottom-3 left-1/2 -translate-x-1/2 z-50',
        'flex items-end gap-1 px-2 py-1.5',
        'bg-zinc-800/70 backdrop-blur-xl',
        'border border-zinc-700/50 rounded-2xl',
        'shadow-2xl shadow-black/30'
      )}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
    >
      {dockApps.map((app) => {
        if (!app) return null;
        const isHovered = hoveredApp === app.id;
        const isRunning = getRunningIndicator(app.id);

        return (
          <motion.div
            key={app.id}
            className="relative flex flex-col items-center"
            onMouseEnter={() => setHoveredApp(app.id)}
            onMouseLeave={() => setHoveredApp(null)}
          >
            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className={cn(
                    'absolute -top-10 px-3 py-1.5',
                    'bg-zinc-900 border border-zinc-700 rounded-lg',
                    'text-sm text-white font-medium whitespace-nowrap',
                    'shadow-lg'
                  )}
                  initial={{ opacity: 0, y: 5, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                >
                  {app.name}
                  {/* Arrow */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-b border-r border-zinc-700 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Icon */}
            <motion.button
              className={cn(
                'w-12 h-12 flex items-center justify-center',
                'text-3xl rounded-xl',
                'bg-zinc-700/50 hover:bg-zinc-600/50',
                'transition-colors cursor-default'
              )}
              whileHover={{ scale: 1.2, y: -8 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAppClick(app.id)}
            >
              {app.icon}
            </motion.button>

            {/* Running Indicator */}
            <motion.div
              className={cn(
                'absolute -bottom-1 w-1 h-1 rounded-full',
                'bg-white/70'
              )}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: isRunning ? 1 : 0,
                scale: isRunning ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        );
      })}

      {/* Separator */}
      <div className="w-px h-10 bg-zinc-600/50 mx-1" />

      {/* Minimized windows section */}
      {windows.filter(w => w.isMinimized).map(win => {
        const app = getApp(win.appId);
        if (!app) return null;

        return (
          <motion.button
            key={win.id}
            className={cn(
              'w-12 h-12 flex items-center justify-center',
              'text-3xl rounded-xl',
              'bg-zinc-700/30 hover:bg-zinc-600/50',
              'transition-colors cursor-default',
              'opacity-70'
            )}
            whileHover={{ scale: 1.1, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => restoreWindow(win.id)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.7, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            {app.icon}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
