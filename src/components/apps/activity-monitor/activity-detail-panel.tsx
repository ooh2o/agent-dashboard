'use client';

import { motion } from 'framer-motion';
import { ActivityEvent } from '@/lib/types';
import { TechnicalView } from './technical-view';
import { ExplanationView } from './explanation-view';
import { cn } from '@/lib/utils';

interface ActivityDetailPanelProps {
  activity: ActivityEvent;
  expanded: boolean;
  className?: string;
}

export function ActivityDetailPanel({
  activity,
  expanded,
  className,
}: ActivityDetailPanelProps) {
  if (!expanded) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn('overflow-hidden', className)}
    >
      <div className="pt-3 pb-1">
        {/* Dual-pane container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-lg border border-zinc-700/50 overflow-hidden bg-zinc-800/20">
          {/* Left Pane: Technical Details */}
          <div className="min-h-[200px] max-h-[400px] border-b md:border-b-0 md:border-r border-zinc-700/50">
            <TechnicalView activity={activity} />
          </div>

          {/* Right Pane: Human Explanation */}
          <div className="min-h-[200px] max-h-[400px]">
            <ExplanationView activity={activity} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
