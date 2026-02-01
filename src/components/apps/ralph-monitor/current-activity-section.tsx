'use client';

import { Activity, Terminal, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CurrentActivity {
  human: string;
  technical: string;
}

interface CurrentActivitySectionProps {
  activity: CurrentActivity;
  isRunning?: boolean;
  className?: string;
}

export function CurrentActivitySection({
  activity,
  isRunning = false,
  className,
}: CurrentActivitySectionProps) {
  const [showTechnical, setShowTechnical] = useState(false);
  const hasActivity = activity.human || activity.technical;

  if (!hasActivity && !isRunning) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
        <Activity
          className={cn(
            'h-4 w-4 text-emerald-400',
            isRunning && 'animate-pulse'
          )}
        />
        <span>WHAT'S HAPPENING NOW</span>
      </div>

      {/* Activity box */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 overflow-hidden">
        {/* Human-friendly description */}
        <div className="px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">💭</span>
            <p className="text-sm text-zinc-200 flex-1">
              {activity.human || (isRunning ? 'Working on the task...' : 'Idle')}
            </p>
          </div>
        </div>

        {/* Technical details (collapsible) */}
        {activity.technical && (
          <>
            <button
              onClick={() => setShowTechnical(!showTechnical)}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-zinc-500 hover:text-zinc-400 border-t border-zinc-700/50 transition-colors"
            >
              <Terminal className="h-3 w-3" />
              <span>Technical details</span>
              <ChevronDown
                className={cn(
                  'h-3 w-3 ml-auto transition-transform',
                  showTechnical && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {showTechnical && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-2 bg-zinc-900/50 border-t border-zinc-700/50">
                    <code className="text-xs text-zinc-400 font-mono break-all">
                      🔧 {activity.technical}
                    </code>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
