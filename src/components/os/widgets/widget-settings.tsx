'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Plus,
  Activity,
  Coins,
  Clock,
  Check,
  X,
  Maximize2,
  Minimize2,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetType, WidgetConfig, WidgetSize, WIDGET_CATALOG, WIDGET_SIZES } from './types';

interface WidgetSettingsProps {
  widgets: WidgetConfig[];
  onAddWidget: (type: WidgetType, size: WidgetSize) => void;
  onRemoveWidget: (id: string) => void;
  onResizeWidget: (id: string, size: WidgetSize) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  activity: Activity,
  coins: Coins,
  clock: Clock,
};

const sizeIcons: Record<WidgetSize, React.ElementType> = {
  small: Minimize2,
  medium: Square,
  large: Maximize2,
};

export function WidgetSettings({
  widgets,
  onAddWidget,
  onRemoveWidget,
  onResizeWidget,
  isOpen,
  onToggle,
}: WidgetSettingsProps) {
  const [selectedSize, setSelectedSize] = useState<WidgetSize>('medium');

  const enabledTypes = widgets.filter((w) => w.enabled).map((w) => w.type);
  const availableWidgets = Object.values(WIDGET_CATALOG);

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'w-12 h-12 rounded-xl',
          'bg-zinc-900/80 backdrop-blur-xl',
          'border border-white/10',
          'flex items-center justify-center',
          'shadow-lg shadow-black/20',
          'hover:bg-zinc-800/80 transition-colors',
          isOpen && 'bg-zinc-800/80'
        )}
      >
        <Settings
          className={cn(
            'h-5 w-5 text-zinc-400 transition-transform duration-300',
            isOpen && 'rotate-90'
          )}
        />
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                'fixed right-0 top-0 bottom-0 w-80 z-50',
                'bg-zinc-900/95 backdrop-blur-xl',
                'border-l border-white/10',
                'shadow-2xl shadow-black/50',
                'flex flex-col'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-zinc-400" />
                  <span className="font-medium text-white">Widget Settings</span>
                </div>
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              </div>

              {/* Size Selector */}
              <div className="p-4 border-b border-white/5">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">
                  Default Size
                </span>
                <div className="flex gap-2 mt-2">
                  {(['small', 'medium', 'large'] as WidgetSize[]).map((size) => {
                    const SizeIcon = sizeIcons[size];
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          'flex-1 py-2 rounded-lg border transition-all',
                          'flex items-center justify-center gap-1',
                          selectedSize === size
                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                            : 'border-white/10 hover:border-white/20 text-zinc-400'
                        )}
                      >
                        <SizeIcon className="h-3.5 w-3.5" />
                        <span className="text-xs capitalize">{size}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Widgets */}
              <div className="flex-1 p-4 overflow-y-auto">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">
                  Available Widgets
                </span>
                <div className="space-y-2 mt-3">
                  {availableWidgets.map((widget) => {
                    const Icon = iconMap[widget.icon];
                    const isEnabled = enabledTypes.includes(widget.type);
                    const activeWidget = widgets.find((w) => w.type === widget.type && w.enabled);

                    return (
                      <motion.div
                        key={widget.type}
                        layout
                        className={cn(
                          'p-3 rounded-xl border transition-all',
                          isEnabled
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-white/10 hover:border-white/20'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center',
                              isEnabled ? 'bg-emerald-500/20' : 'bg-white/5'
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-4 w-4',
                                isEnabled ? 'text-emerald-400' : 'text-zinc-400'
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-white">
                                {widget.title}
                              </span>
                              {isEnabled ? (
                                <button
                                  onClick={() =>
                                    activeWidget && onRemoveWidget(activeWidget.id)
                                  }
                                  className="p-1 rounded hover:bg-red-500/20 transition-colors group"
                                >
                                  <X className="h-3.5 w-3.5 text-zinc-400 group-hover:text-red-400" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => onAddWidget(widget.type, selectedSize)}
                                  className="p-1 rounded hover:bg-emerald-500/20 transition-colors group"
                                >
                                  <Plus className="h-3.5 w-3.5 text-zinc-400 group-hover:text-emerald-400" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {widget.description}
                            </p>

                            {/* Resize controls when enabled */}
                            {isEnabled && activeWidget && (
                              <div className="flex gap-1 mt-2">
                                {(['small', 'medium', 'large'] as WidgetSize[]).map(
                                  (size) => {
                                    const SizeIcon = sizeIcons[size];
                                    return (
                                      <button
                                        key={size}
                                        onClick={() =>
                                          onResizeWidget(activeWidget.id, size)
                                        }
                                        className={cn(
                                          'p-1.5 rounded border transition-all',
                                          activeWidget.size === size
                                            ? 'border-blue-500/50 bg-blue-500/10'
                                            : 'border-white/10 hover:border-white/20'
                                        )}
                                        title={`Resize to ${size}`}
                                      >
                                        <SizeIcon
                                          className={cn(
                                            'h-3 w-3',
                                            activeWidget.size === size
                                              ? 'text-blue-400'
                                              : 'text-zinc-500'
                                          )}
                                        />
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10">
                <div className="text-xs text-zinc-500 text-center">
                  Drag widgets to reposition them on the desktop
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
