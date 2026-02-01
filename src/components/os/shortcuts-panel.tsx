'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKeyboardShortcuts, formatKeyDisplay } from '@/hooks/use-keyboard-shortcuts';

interface ShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsPanel({ isOpen, onClose }: ShortcutsPanelProps) {
  const { getShortcutsByCategory } = useKeyboardShortcuts();
  const categorizedShortcuts = getShortcutsByCategory();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[10%] z-50 w-full max-w-2xl -translate-x-1/2"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <div className="overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
                    <Keyboard className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
                    <p className="text-sm text-zinc-500">Navigate faster with keyboard commands</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                  aria-label="Close shortcuts panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <ScrollArea className="max-h-[60vh]">
                <div className="p-6 space-y-8">
                  {categorizedShortcuts.size === 0 ? (
                    <div className="text-center py-8">
                      <Command className="h-12 w-12 mx-auto text-zinc-700 mb-3" />
                      <p className="text-zinc-500">No shortcuts registered</p>
                    </div>
                  ) : (
                    Array.from(categorizedShortcuts.entries()).map(([category, shortcuts]) => (
                      <div key={category}>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                          {category}
                        </h3>
                        <div className="space-y-1">
                          {shortcuts.map(shortcut => (
                            <div
                              key={shortcut.id}
                              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-zinc-200">{shortcut.label}</p>
                                {shortcut.description && (
                                  <p className="text-xs text-zinc-500 truncate">{shortcut.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-4 shrink-0">
                                {shortcut.keys.map((key, i) => (
                                  <kbd
                                    key={i}
                                    className="inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-zinc-800 px-2 text-xs font-medium text-zinc-300 border border-zinc-700"
                                  >
                                    {formatKeyDisplay([key])}
                                  </kbd>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="border-t border-zinc-800 px-6 py-3">
                <p className="text-xs text-zinc-600 text-center">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">Esc</kbd> to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
