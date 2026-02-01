'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWindowStore } from '@/lib/stores/window-store';
import { APPS, getApp } from '@/lib/apps-registry';
import type { SpotlightResult } from './types';

interface SpotlightProps {
  isOpen: boolean;
  onClose: () => void;
}

// Fuzzy search implementation
function fuzzyMatch(text: string, query: string): { match: boolean; score: number } {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match
  if (textLower.includes(queryLower)) {
    return { match: true, score: queryLower.length / textLower.length + 0.5 };
  }

  // Fuzzy match
  let queryIndex = 0;
  let score = 0;
  let consecutiveBonus = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 1 + consecutiveBonus;
      consecutiveBonus += 0.5;
      queryIndex++;
    } else {
      consecutiveBonus = 0;
    }
  }

  const isMatch = queryIndex === queryLower.length;
  return {
    match: isMatch,
    score: isMatch ? score / textLower.length : 0,
  };
}

export function Spotlight({ isOpen, onClose }: SpotlightProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openWindow, windows, focusWindow } = useWindowStore();

  // Build search results
  const results = useMemo((): SpotlightResult[] => {
    const items: SpotlightResult[] = [];

    // Apps
    APPS.forEach(app => {
      const { match, score } = query ? fuzzyMatch(app.name, query) : { match: true, score: 1 };
      if (match) {
        items.push({
          id: `app-${app.id}`,
          type: 'app',
          title: app.name,
          subtitle: app.shortcut,
          icon: app.icon,
          action: () => {
            const existingWindow = windows.find(w => w.appId === app.id);
            if (existingWindow) {
              focusWindow(existingWindow.id);
            } else {
              openWindow(app.id, app.name);
            }
            onClose();
          },
          _score: score,
        } as SpotlightResult & { _score: number });
      }
    });

    // Quick actions
    const actions = [
      {
        id: 'action-new-terminal',
        type: 'action' as const,
        title: 'New Terminal',
        subtitle: 'Open a new terminal window',
        icon: '🖥️',
        action: () => {
          openWindow('terminal', 'Terminal');
          onClose();
        },
      },
      {
        id: 'action-spawn-agent',
        type: 'action' as const,
        title: 'Spawn Agent',
        subtitle: 'Launch a new AI agent',
        icon: '🤖',
        action: () => {
          openWindow('agent-spawner', 'Agent Spawner');
          onClose();
        },
      },
      {
        id: 'action-settings',
        type: 'action' as const,
        title: 'Open Settings',
        subtitle: 'Configure OpenClaw OS',
        icon: '⚙️',
        action: () => {
          openWindow('settings', 'Settings');
          onClose();
        },
      },
    ];

    actions.forEach(action => {
      const { match, score } = query ? fuzzyMatch(action.title, query) : { match: true, score: 0.5 };
      if (match) {
        items.push({ ...action, _score: score } as SpotlightResult & { _score: number });
      }
    });

    // Sort by score
    return (items as (SpotlightResult & { _score: number })[])
      .sort((a, b) => b._score - a._score)
      .slice(0, 8)
      .map(({ _score, ...rest }) => rest);
  }, [query, windows, openWindow, focusWindow, onClose]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, selectedIndex, onClose]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Spotlight Dialog */}
          <motion.div
            className={cn(
              'fixed top-1/4 left-1/2 -translate-x-1/2 z-[10001]',
              'w-full max-w-xl',
              'bg-zinc-900/95 backdrop-blur-xl',
              'border border-zinc-700/50 rounded-2xl',
              'shadow-2xl shadow-black/50',
              'overflow-hidden'
            )}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
              <Search className="w-5 h-5 text-zinc-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search apps, actions, files..."
                className={cn(
                  'flex-1 bg-transparent outline-none',
                  'text-lg text-white placeholder:text-zinc-500'
                )}
              />
              <kbd className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                ESC
              </kbd>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="max-h-80 overflow-y-auto py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={result.action}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5',
                      'text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-blue-500/20 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    )}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="text-2xl">{result.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-zinc-500 truncate">{result.subtitle}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      {result.type === 'app' && (
                        <span className="text-xs px-1.5 py-0.5 bg-zinc-800 rounded">App</span>
                      )}
                      {result.type === 'action' && (
                        <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Action</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {query && results.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                <p>No results found for "{query}"</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 text-xs text-zinc-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  <ArrowDown className="w-3 h-3" />
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" />
                  <span>Open</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Command className="w-3 h-3" />
                <span>K to toggle</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
