'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ActivityEvent } from '@/lib/types';
import {
  generateExplanation,
  getRiskEmoji,
  RiskLevel,
} from '@/lib/activity-explanations';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface ExplanationViewProps {
  activity: ActivityEvent;
  className?: string;
}

// Icon components for each risk level
const RiskIcons = {
  safe: CheckCircle2,
  review: AlertTriangle,
  sensitive: AlertCircle,
  default: Info,
} as const;

function getRiskColors(level: RiskLevel): { text: string; bg: string; border: string } {
  switch (level) {
    case 'safe':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
      };
    case 'review':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
      };
    case 'sensitive':
      return {
        text: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
      };
    default:
      return {
        text: 'text-zinc-400',
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/30',
      };
  }
}

export function ExplanationView({ activity, className }: ExplanationViewProps) {
  const explanation = useMemo(
    () => generateExplanation(activity),
    [activity]
  );

  const RiskIcon = RiskIcons[explanation.riskLevel] || RiskIcons.default;
  const riskColors = getRiskColors(explanation.riskLevel);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/50 bg-zinc-800/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="text-sm font-medium text-zinc-300">What This Means</span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] px-1.5 py-0 flex items-center gap-1',
            riskColors.text,
            riskColors.border
          )}
        >
          <span>{getRiskEmoji(explanation.riskLevel)}</span>
          <span className="capitalize">{explanation.riskLevel}</span>
        </Badge>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Summary */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Summary
            </h4>
            <p className="text-sm text-zinc-200 leading-relaxed">
              {explanation.summary}
            </p>
          </div>

          {/* Details */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Details
            </h4>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {explanation.details}
            </p>
          </div>

          {/* Why It Matters */}
          <div
            className={cn(
              'rounded-lg p-3 border',
              riskColors.bg,
              riskColors.border
            )}
          >
            <div className="flex items-start gap-2">
              <RiskIcon className={cn('h-4 w-4 mt-0.5 shrink-0', riskColors.text)} />
              <div>
                <h4 className={cn('text-xs font-semibold mb-1', riskColors.text)}>
                  Why It Matters
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {explanation.whyItMatters}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Level Explanation */}
          <div className="pt-2 border-t border-zinc-700/30">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Risk Assessment
            </h4>
            <div className="space-y-2">
              <RiskIndicator
                level="safe"
                description="Normal operations (read, search, write to workspace)"
                active={explanation.riskLevel === 'safe'}
              />
              <RiskIndicator
                level="review"
                description="Worth checking (API changes, config edits)"
                active={explanation.riskLevel === 'review'}
              />
              <RiskIndicator
                level="sensitive"
                description="Requires attention (exec with rm, external sends)"
                active={explanation.riskLevel === 'sensitive'}
              />
            </div>
          </div>

          {/* Additional Context */}
          {activity.durationMs && (
            <div className="pt-2 border-t border-zinc-700/30">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Performance
              </h4>
              <p className="text-sm text-zinc-400">
                Completed in{' '}
                <span className="text-zinc-200 font-mono">
                  {activity.durationMs < 1000
                    ? `${activity.durationMs}ms`
                    : `${(activity.durationMs / 1000).toFixed(2)}s`}
                </span>
              </p>
            </div>
          )}

          {activity.tokens && (
            <div className="pt-2 border-t border-zinc-700/30">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Token Usage
              </h4>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">In: </span>
                  <span className="text-zinc-200 font-mono">
                    {activity.tokens.input.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Out: </span>
                  <span className="text-zinc-200 font-mono">
                    {activity.tokens.output.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Total: </span>
                  <span className="text-zinc-200 font-mono">
                    {(activity.tokens.input + activity.tokens.output).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface RiskIndicatorProps {
  level: RiskLevel;
  description: string;
  active: boolean;
}

function RiskIndicator({ level, description, active }: RiskIndicatorProps) {
  const colors = getRiskColors(level);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md transition-all',
        active ? `${colors.bg} ${colors.border} border` : 'opacity-40'
      )}
    >
      <span className="text-sm">{getRiskEmoji(level)}</span>
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-xs font-medium capitalize',
            active ? colors.text : 'text-zinc-500'
          )}
        >
          {level}
        </span>
        <span className="text-xs text-zinc-500 ml-2">{description}</span>
      </div>
      {active && (
        <CheckCircle2 className={cn('h-3.5 w-3.5 shrink-0', colors.text)} />
      )}
    </div>
  );
}
