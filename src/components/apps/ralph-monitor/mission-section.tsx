'use client';

import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionSectionProps {
  mission: string;
  className?: string;
}

export function MissionSection({ mission, className }: MissionSectionProps) {
  const hasMission = mission && mission !== 'No mission defined';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
        <Target className="h-4 w-4 text-amber-400" />
        <span>MISSION</span>
      </div>
      <div
        className={cn(
          'rounded-lg border px-4 py-3 text-sm',
          hasMission
            ? 'border-amber-500/30 bg-amber-500/5 text-zinc-200'
            : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-500 italic'
        )}
      >
        {mission || 'No mission defined'}
      </div>
    </div>
  );
}
