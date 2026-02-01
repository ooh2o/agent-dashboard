'use client';

import { motion } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Brain,
  Activity,
  Database,
  ArrowRightCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';
import {
  EfficiencyMetrics,
  RatingLevel,
  formatMultiplier,
  formatRatio,
  formatTrend,
  getTrendArrow,
} from './efficiency-metrics';

interface EfficiencyCardProps {
  metrics: EfficiencyMetrics;
  className?: string;
}

const RATING_COLORS: Record<RatingLevel, { bg: string; text: string; border: string }> = {
  good: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/20',
  },
  poor: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
};

function MetricBox({
  label,
  value,
  subValue,
  rating,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: string;
  subValue?: string;
  rating: { level: RatingLevel; label: string; icon: string };
  icon: React.ElementType;
  delay?: number;
}) {
  const colors = RATING_COLORS[rating.level];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.2 }}
      className={cn(
        'bg-zinc-800/50 rounded-lg p-3 border',
        colors.border
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500">{label}</span>
        <Icon className={cn('h-3.5 w-3.5', colors.text)} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-white">{value}</span>
        {subValue && (
          <span className="text-xs text-zinc-400">{subValue}</span>
        )}
      </div>
      <div className={cn('flex items-center gap-1 mt-1', colors.text)}>
        <span className="text-xs">{rating.icon}</span>
        <span className="text-xs font-medium">{rating.label}</span>
      </div>
    </motion.div>
  );
}

function ProgressBar({
  value,
  max,
  label,
  colorClass = 'bg-blue-500',
}: {
  value: number;
  max: number;
  label?: string;
  colorClass?: string;
}) {
  const percent = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{label}</span>
          <span>{percent.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', colorClass)}
        />
      </div>
    </div>
  );
}

function ThinkingActionBar({
  thinkingRatio,
  actionRatio,
  rating,
}: {
  thinkingRatio: number;
  actionRatio: number;
  rating: { level: RatingLevel; label: string };
}) {
  const thinkingPercent = thinkingRatio * 100;
  const actionPercent = actionRatio * 100;
  const colors = RATING_COLORS[rating.level];

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs text-zinc-400">Thinking</span>
          <span className="text-xs text-zinc-300 font-mono">
            {thinkingPercent.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-300 font-mono">
            {actionPercent.toFixed(0)}%
          </span>
          <span className="text-xs text-zinc-400">Action</span>
          <Activity className="h-3.5 w-3.5 text-blue-400" />
        </div>
      </div>
      <div className="h-3 bg-zinc-700 rounded-full overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${thinkingPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-purple-500"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${actionPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="h-full bg-blue-500"
        />
      </div>
      <div className={cn('flex items-center justify-center gap-1', colors.text)}>
        <span className="text-xs">{rating.level === 'good' ? '🟢' : '🟡'}</span>
        <span className="text-xs font-medium">{rating.label}</span>
      </div>
    </div>
  );
}

function TrendIndicator({
  change,
  label,
}: {
  change: number;
  label: string;
}) {
  const isPositive = change > 2;
  const isNegative = change < -2;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">{label}:</span>
      <div
        className={cn(
          'flex items-center gap-1 text-xs font-medium',
          isPositive && 'text-emerald-400',
          isNegative && 'text-red-400',
          !isPositive && !isNegative && 'text-zinc-400'
        )}
      >
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {isNegative && <TrendingDown className="h-3 w-3" />}
        {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
        <span>{formatTrend(change)}</span>
      </div>
    </div>
  );
}

export function EfficiencyCard({ metrics, className }: EfficiencyCardProps) {
  const contextColors =
    metrics.contextUtilization < 0.5
      ? 'bg-emerald-500'
      : metrics.contextUtilization < 0.8
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className={cn(
        'bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Zap className="h-4 w-4 text-yellow-400" />
          Token Efficiency
        </div>
        <div className="flex items-center gap-3">
          <TrendIndicator
            change={metrics.trend.vsLastSession}
            label="vs Last"
          />
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MetricBox
          label="Output/Input Ratio"
          value={formatMultiplier(metrics.outputInputRatio)}
          rating={metrics.outputInputRating}
          icon={ArrowRightCircle}
          delay={0.1}
        />
        <MetricBox
          label="Tokens/Action"
          value={formatNumber(Math.round(metrics.tokensPerAction))}
          subValue="avg"
          rating={metrics.tokensPerActionRating}
          icon={Activity}
          delay={0.15}
        />
      </div>

      {/* Thinking vs Action Bar */}
      <div className="mb-4 p-3 bg-zinc-900/50 rounded-lg">
        <ThinkingActionBar
          thinkingRatio={metrics.thinkingRatio}
          actionRatio={metrics.actionRatio}
          rating={metrics.thinkingRating}
        />
      </div>

      {/* Context Utilization */}
      <div className="mb-4 p-3 bg-zinc-900/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Context Usage</span>
          </div>
          <span
            className={cn(
              'text-xs font-medium',
              RATING_COLORS[metrics.contextUtilizationRating.level].text
            )}
          >
            {metrics.contextUtilizationRating.icon}{' '}
            {metrics.contextUtilizationRating.label}
          </span>
        </div>
        <ProgressBar
          value={metrics.contextUsed}
          max={metrics.contextWindow}
          colorClass={contextColors}
        />
        <div className="flex justify-between mt-1 text-xs text-zinc-500">
          <span>{formatNumber(metrics.contextUsed)} used</span>
          <span>{formatNumber(metrics.contextWindow)} max</span>
        </div>
      </div>

      {/* Smart Tips */}
      {metrics.tips.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
            Optimization Tips
          </div>
          {metrics.tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-start gap-2 p-2 bg-yellow-500/5 rounded border border-yellow-500/10"
            >
              <span className="text-yellow-400 text-xs">💡</span>
              <span className="text-xs text-yellow-300/80">{tip}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default EfficiencyCard;
