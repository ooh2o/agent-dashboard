'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';

export interface EfficiencyTrendPoint {
  date: string;
  label: string;
  outputInputRatio: number;
  tokensPerAction: number;
  thinkingRatio: number;
  contextUtilization: number;
}

interface EfficiencyTrendProps {
  data: EfficiencyTrendPoint[];
  className?: string;
}

const CHART_COLORS = {
  outputInputRatio: '#10b981', // emerald
  tokensPerAction: '#3b82f6', // blue
  thinkingRatio: '#a855f7', // purple
  contextUtilization: '#f59e0b', // amber
};

const METRIC_LABELS: Record<string, string> = {
  outputInputRatio: 'Output/Input',
  tokensPerAction: 'Tokens/Action',
  thinkingRatio: 'Thinking %',
  contextUtilization: 'Context %',
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-zinc-400 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-zinc-300">
              {METRIC_LABELS[entry.name] || entry.name}:
            </span>
            <span className="text-xs text-white font-mono">
              {entry.name === 'tokensPerAction'
                ? formatNumber(entry.value)
                : entry.name.includes('Ratio') || entry.name.includes('Utilization')
                ? `${(entry.value * 100).toFixed(0)}%`
                : entry.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EfficiencyTrend({ data, className }: EfficiencyTrendProps) {
  // Normalize data for dual-axis chart
  const normalizedData = useMemo(() => {
    if (data.length === 0) return [];

    const maxTokensPerAction = Math.max(...data.map((d) => d.tokensPerAction));

    return data.map((point) => ({
      ...point,
      // Normalize tokensPerAction to 0-1 scale for display alongside ratios
      tokensPerActionNormalized: point.tokensPerAction / Math.max(maxTokensPerAction, 1),
    }));
  }, [data]);

  // Calculate overall trend
  const overallTrend = useMemo(() => {
    if (data.length < 2) return { direction: 'stable', change: 0 };

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const avgFirst =
      firstHalf.reduce((sum, d) => sum + d.outputInputRatio, 0) / firstHalf.length;
    const avgSecond =
      secondHalf.reduce((sum, d) => sum + d.outputInputRatio, 0) / secondHalf.length;

    const change = ((avgSecond - avgFirst) / Math.max(avgFirst, 0.01)) * 100;

    return {
      direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
      change,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50',
          className
        )}
      >
        <div className="flex items-center gap-2 text-sm text-zinc-300 mb-4">
          <TrendingUp className="h-4 w-4 text-zinc-400" />
          Efficiency Trend
        </div>
        <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
          No trend data available yet
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(
        'bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <TrendingUp className="h-4 w-4 text-zinc-400" />
          Efficiency Trend
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-500">
            Last {data.length} sessions
          </span>
          <div
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              overallTrend.direction === 'improving' &&
                'bg-emerald-500/10 text-emerald-400',
              overallTrend.direction === 'declining' &&
                'bg-red-500/10 text-red-400',
              overallTrend.direction === 'stable' &&
                'bg-zinc-700 text-zinc-400'
            )}
          >
            {overallTrend.direction === 'improving' && '↑ '}
            {overallTrend.direction === 'declining' && '↓ '}
            {overallTrend.direction.charAt(0).toUpperCase() +
              overallTrend.direction.slice(1)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={normalizedData}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              domain={[0, 'auto']}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => (
                <span className="text-xs text-zinc-400">
                  {METRIC_LABELS[value] || value}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="outputInputRatio"
              stroke={CHART_COLORS.outputInputRatio}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.outputInputRatio, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="thinkingRatio"
              stroke={CHART_COLORS.thinkingRatio}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.thinkingRatio, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="contextUtilization"
              stroke={CHART_COLORS.contextUtilization}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.contextUtilization, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with descriptions */}
      <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-zinc-700/50">
        {Object.entries(CHART_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-zinc-500 truncate">
              {METRIC_LABELS[key]}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Generate mock trend data for demo purposes
export function generateMockTrendData(days: number = 7): EfficiencyTrendPoint[] {
  const data: EfficiencyTrendPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Generate somewhat realistic fluctuating data with a slight improving trend
    const baseRatio = 1.2 + (days - i) * 0.05;
    const variance = () => (Math.random() - 0.5) * 0.3;

    data.push({
      date: date.toISOString(),
      label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      outputInputRatio: Math.max(0.5, baseRatio + variance()),
      tokensPerAction: Math.max(100, 600 - (days - i) * 20 + Math.random() * 100),
      thinkingRatio: Math.max(0.2, Math.min(0.6, 0.4 + variance() * 0.2)),
      contextUtilization: Math.max(0.1, Math.min(0.9, 0.35 + variance() * 0.15)),
    });
  }

  return data;
}

export default EfficiencyTrend;
