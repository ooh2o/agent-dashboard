'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Battery, Volume2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWindowStore } from '@/lib/stores/window-store';
import { getApp } from '@/lib/apps-registry';

interface MenuBarProps {
  onSpotlightOpen: () => void;
}

export function MenuBar({ onSpotlightOpen }: MenuBarProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const { activeWindowId, windows } = useWindowStore();

  // Get active app name
  const activeWindow = windows.find(w => w.id === activeWindowId);
  const activeApp = activeWindow ? getApp(activeWindow.appId) : null;
  const appName = activeApp?.name || 'OpenClaw OS';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className={cn(
        'fixed top-0 left-0 right-0 h-7 z-[9999]',
        'flex items-center justify-between px-4',
        'bg-zinc-900/80 backdrop-blur-xl',
        'border-b border-zinc-800/50',
        'text-sm font-medium text-zinc-200'
      )}
      initial={{ y: -28 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Left: Logo + App Menu */}
      <div className="flex items-center gap-4">
        {/* OpenClaw Logo */}
        <button
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 -ml-2',
            'hover:bg-white/10 rounded transition-colors'
          )}
        >
          <span className="text-base">🦞</span>
          <span className="font-semibold">OpenClaw</span>
        </button>

        {/* Active App Name */}
        <span className="font-semibold">{appName}</span>

        {/* App Menu Items */}
        <div className="flex items-center gap-3 text-zinc-400">
          <button className="hover:text-white transition-colors">File</button>
          <button className="hover:text-white transition-colors">Edit</button>
          <button className="hover:text-white transition-colors">View</button>
          <button className="hover:text-white transition-colors">Window</button>
          <button className="hover:text-white transition-colors">Help</button>
        </div>
      </div>

      {/* Right: Status Icons */}
      <div className="flex items-center gap-3">
        {/* Spotlight Search */}
        <button
          onClick={onSpotlightOpen}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5',
            'hover:bg-white/10 rounded transition-colors',
            'text-zinc-400 hover:text-white'
          )}
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs">⌘K</span>
        </button>

        {/* Status Icons */}
        <div className="flex items-center gap-2 text-zinc-400">
          <Volume2 className="w-4 h-4" />
          <Wifi className="w-4 h-4" />
          <div className="flex items-center gap-1">
            <Battery className="w-4 h-4" />
            <span className="text-xs">100%</span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-zinc-300">
          <span>{currentDate}</span>
          <span>{currentTime}</span>
        </div>
      </div>
    </motion.div>
  );
}
