'use client';

import { ListChecks, Check, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface Requirement {
  text: string;
  done: boolean;
  inProgress?: boolean;
}

interface RequirementsSectionProps {
  requirements: Requirement[];
  className?: string;
}

export function RequirementsSection({
  requirements,
  className,
}: RequirementsSectionProps) {
  const completed = requirements.filter((r) => r.done).length;
  const total = requirements.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (requirements.length === 0) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <ListChecks className="h-4 w-4 text-blue-400" />
          <span>REQUIREMENTS</span>
        </div>
        <div className="text-sm text-zinc-500 italic px-2">
          No checklist found in fix_plan.md
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <ListChecks className="h-4 w-4 text-blue-400" />
          <span>REQUIREMENTS</span>
        </div>
        <span className="text-xs text-zinc-400">
          Progress: {completed}/{total} ({percentage}%)
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Requirements list */}
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-2 text-sm py-1',
              req.done && 'text-zinc-500'
            )}
          >
            {/* Status icon */}
            <div className="mt-0.5 shrink-0">
              {req.done ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : req.inProgress ? (
                <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
              ) : (
                <Circle className="h-4 w-4 text-zinc-600" />
              )}
            </div>

            {/* Requirement text */}
            <span
              className={cn(
                req.done && 'line-through',
                req.inProgress && 'text-amber-400'
              )}
            >
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
