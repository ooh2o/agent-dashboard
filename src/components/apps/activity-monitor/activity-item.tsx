'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ActivityEvent } from '@/lib/types';
import { formatDistanceToNow } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ActivityDetailPanel } from './activity-detail-panel';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface EventConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}

interface ActivityItemProps {
  activity: ActivityEvent;
  config: EventConfig;
  index: number;
  initialExpanded?: boolean;
}

export function ActivityItem({
  activity,
  config,
  index,
  initialExpanded = false,
}: ActivityItemProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const Icon = config.icon;

  return (
    <motion.div
      key={activity.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className={cn(
        'group relative border-b border-zinc-800/50 last:border-0',
        activity.result === 'error' && 'bg-red-500/5'
      )}
    >
      {/* Error indicator bar */}
      {activity.result === 'error' && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500" />
      )}

      {/* Main row (clickable to expand) */}
      <div
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-start gap-3 py-3 px-1 cursor-pointer transition-colors',
          'hover:bg-zinc-800/30',
          expanded && 'bg-zinc-800/20'
        )}
      >
        {/* Expand/Collapse indicator */}
        <div className="flex items-center justify-center w-4 h-8 shrink-0">
          <motion.div
            initial={false}
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
          </motion.div>
        </div>

        {/* Icon */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}
        >
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0 border-current',
                config.color
              )}
            >
              {config.label}
            </Badge>
            {activity.tool && (
              <span className="text-xs text-zinc-500 font-mono">
                {activity.tool}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed mt-1 line-clamp-2">
            {activity.explanation}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {activity.durationMs && (
              <span className="text-xs text-zinc-500">
                {activity.durationMs}ms
              </span>
            )}
            {activity.tokens && (
              <span className="text-xs text-zinc-500">
                {activity.tokens.input + activity.tokens.output} tokens
              </span>
            )}
          </div>
        </div>

        {/* Timestamp & Expand button */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-500">
            {formatDistanceToNow(activity.timestamp)}
          </span>
          <div
            className={cn(
              'flex items-center justify-center px-2 py-1 rounded text-xs transition-colors',
              expanded
                ? 'bg-blue-500/10 text-blue-400'
                : 'bg-zinc-700/50 text-zinc-400 opacity-0 group-hover:opacity-100'
            )}
          >
            {expanded ? (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3 mr-1" />
                <span>Expand</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {expanded && (
          <div className="px-1 pl-12">
            <ActivityDetailPanel activity={activity} expanded={expanded} />
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
