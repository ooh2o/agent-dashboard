'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { PieChart as PieChartIcon, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

export interface CostCategory {
  name: string;
  value: number;
  color: string;
  icon: string;
  description: string;
}

interface CostBreakdownProps {
  data: {
    queries: number;
    codeChanges: number;
    research: number;
    subagents: number;
  };
  totalCost: number;
  className?: string;
}

const CATEGORY_CONFIG: Record<string, { color: string; icon: string; description: string }> = {
  queries: {
    color: '#3b82f6', // blue
    icon: '💬',
    description: 'Simple questions & answers',
  },
  codeChanges: {
    color: '#10b981', // emerald
    icon: '💻',
    description: 'File edits & code generation',
  },
  research: {
    color: '#f59e0b', // amber
    icon: '🔍',
    description: 'Web search & file reading',
  },
  subagents: {
    color: '#a855f7', // purple
    icon: '🤖',
    description: 'Sub-agent task delegation',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  queries: 'Simple Queries',
  codeChanges: 'Code Changes',
  research: 'Research',
  subagents: 'Sub-agents',
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: CostCategory }>;
}) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{data.icon}</span>
        <span className="text-sm text-white font-medium">{data.name}</span>
      </div>
      <p className="text-xs text-zinc-400 mb-2">{data.description}</p>
      <p className="text-lg font-bold text-white">{formatCurrency(data.value)}</p>
    </div>
  );
}

function CustomLegend({
  payload,
}: {
  payload?: Array<{ color: string; value: string; payload: CostCategory }>;
}) {
  if (!payload) return null;

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-zinc-400 truncate">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function CostBreakdown({ data, totalCost, className }: CostBreakdownProps) {
  const chartData: CostCategory[] = useMemo(() => {
    return Object.entries(data)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        name: CATEGORY_LABELS[key] || key,
        value,
        ...CATEGORY_CONFIG[key],
      }));
  }, [data]);

  const hasData = chartData.some((d) => d.value > 0);

  if (!hasData) {
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
          <PieChartIcon className="h-4 w-4 text-zinc-400" />
          Cost by Category
        </div>
        <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
          No cost data available yet
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className={cn(
        'bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <PieChartIcon className="h-4 w-4 text-zinc-400" />
          Cost by Category
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <DollarSign className="h-3.5 w-3.5" />
          <span className="font-medium text-zinc-300">
            {formatCurrency(totalCost)}
          </span>
          <span>total</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-center gap-4">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Details */}
        <div className="flex-1 space-y-2">
          {chartData.map((category, index) => {
            const percentage = (category.value / totalCost) * 100;

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="flex items-center gap-2"
              >
                <span className="text-base">{category.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300 truncate">
                      {category.name}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono ml-2">
                      {formatCurrency(category.value)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden mt-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono w-10 text-right">
                  {percentage.toFixed(0)}%
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Average Cost per Category */}
      <div className="mt-4 pt-3 border-t border-zinc-700/50">
        <p className="text-xs text-zinc-500 mb-2">Average Cost per Task Type</p>
        <div className="grid grid-cols-2 gap-2">
          {chartData.map((category) => {
            // Estimate average cost (mock calculation)
            const avgCost =
              category.name === 'Simple Queries'
                ? 0.08
                : category.name === 'Code Changes'
                ? 0.35
                : category.name === 'Research'
                ? 0.25
                : 1.2;

            return (
              <div
                key={category.name}
                className="flex items-center justify-between bg-zinc-900/50 rounded px-2 py-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{category.icon}</span>
                  <span className="text-[10px] text-zinc-400 truncate max-w-[60px]">
                    {category.name.split(' ')[0]}
                  </span>
                </div>
                <span className="text-xs text-zinc-300 font-mono">
                  ~{formatCurrency(avgCost)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Generate mock cost breakdown data for demo purposes
export function generateMockCostBreakdown(totalCost: number): {
  queries: number;
  codeChanges: number;
  research: number;
  subagents: number;
} {
  // Random distribution that adds up to totalCost
  const weights = {
    queries: 0.1 + Math.random() * 0.1,
    codeChanges: 0.35 + Math.random() * 0.15,
    research: 0.2 + Math.random() * 0.1,
    subagents: 0.15 + Math.random() * 0.15,
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return {
    queries: (weights.queries / totalWeight) * totalCost,
    codeChanges: (weights.codeChanges / totalWeight) * totalCost,
    research: (weights.research / totalWeight) * totalCost,
    subagents: (weights.subagents / totalWeight) * totalCost,
  };
}

export default CostBreakdown;
