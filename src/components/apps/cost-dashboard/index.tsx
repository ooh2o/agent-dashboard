'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Cpu,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

// Types for cost tracking
interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  sessions: number;
}

interface DailyUsage {
  date: string;
  cost: number;
  tokens: number;
}

interface BudgetAlert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  threshold: number;
  current: number;
}

interface CostDashboardProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

// Mock data for the cost dashboard
const mockModelUsage: ModelUsage[] = [
  {
    model: 'claude-opus-4-5',
    inputTokens: 1_250_000,
    outputTokens: 420_000,
    inputCost: 18.75,
    outputCost: 31.5,
    totalCost: 50.25,
    sessions: 45,
  },
  {
    model: 'claude-sonnet-4',
    inputTokens: 3_800_000,
    outputTokens: 1_200_000,
    inputCost: 11.4,
    outputCost: 18.0,
    totalCost: 29.4,
    sessions: 128,
  },
  {
    model: 'claude-haiku-3-5',
    inputTokens: 8_500_000,
    outputTokens: 2_100_000,
    inputCost: 2.125,
    outputCost: 2.625,
    totalCost: 4.75,
    sessions: 312,
  },
];

const mockDailyUsage: DailyUsage[] = [
  { date: 'Mon', cost: 8.50, tokens: 850000 },
  { date: 'Tue', cost: 12.30, tokens: 1230000 },
  { date: 'Wed', cost: 15.80, tokens: 1580000 },
  { date: 'Thu', cost: 9.20, tokens: 920000 },
  { date: 'Fri', cost: 18.50, tokens: 1850000 },
  { date: 'Sat', cost: 11.40, tokens: 1140000 },
  { date: 'Today', cost: 8.70, tokens: 870000 },
];

const mockBudgetAlerts: BudgetAlert[] = [
  {
    id: '1',
    type: 'warning',
    message: 'Daily budget at 87% ($87/$100)',
    threshold: 100,
    current: 87,
  },
  {
    id: '2',
    type: 'critical',
    message: 'Opus usage spike detected',
    threshold: 50,
    current: 75,
  },
];

const MODEL_COLORS: Record<string, string> = {
  'claude-opus-4-5': 'bg-purple-500',
  'claude-sonnet-4': 'bg-blue-500',
  'claude-haiku-3-5': 'bg-emerald-500',
};

export function CostDashboard({
  onClose,
  onMinimize,
  onMaximize,
}: CostDashboardProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  const totalCost = useMemo(
    () => mockModelUsage.reduce((sum, m) => sum + m.totalCost, 0),
    []
  );

  const totalTokens = useMemo(
    () =>
      mockModelUsage.reduce(
        (sum, m) => sum + m.inputTokens + m.outputTokens,
        0
      ),
    []
  );

  const weeklyTotal = useMemo(
    () => mockDailyUsage.reduce((sum, d) => sum + d.cost, 0),
    []
  );

  const maxDailyCost = Math.max(...mockDailyUsage.map((d) => d.cost));
  const avgDailyCost = weeklyTotal / mockDailyUsage.length;

  // Calculate percentage change (mock)
  const percentChange = 12.5;
  const isIncreasing = percentChange > 0;

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
      {/* macOS Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/95 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            aria-label="Close"
          />
          <button
            onClick={onMinimize}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
            aria-label="Minimize"
          />
          <button
            onClick={onMaximize}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
            aria-label="Maximize"
          />
        </div>
        <h1 className="text-sm font-medium text-zinc-300 absolute left-1/2 -translate-x-1/2">
          Cost Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize',
                  timeRange === range
                    ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                )}
              >
                {range}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              Jan 26 - Feb 1, 2026
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">Total Spend</span>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalCost)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {isIncreasing ? (
                  <ArrowUpRight className="h-3 w-3 text-red-400" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-emerald-400" />
                )}
                <span
                  className={cn(
                    'text-xs',
                    isIncreasing ? 'text-red-400' : 'text-emerald-400'
                  )}
                >
                  {percentChange}% from last {timeRange}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">Total Tokens</span>
                <BarChart3 className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {formatNumber(totalTokens)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {mockModelUsage.reduce((sum, m) => sum + m.sessions, 0)} sessions
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">Avg. Daily</span>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(avgDailyCost)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Peak: {formatCurrency(maxDailyCost)}
              </p>
            </motion.div>
          </div>

          {/* Budget Alerts */}
          {mockBudgetAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Bell className="h-4 w-4" />
                Budget Alerts
              </div>
              {mockBudgetAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border',
                    alert.type === 'critical'
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      'h-4 w-4 shrink-0',
                      alert.type === 'critical'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm',
                        alert.type === 'critical'
                          ? 'text-red-300'
                          : 'text-yellow-300'
                      )}
                    >
                      {alert.message}
                    </p>
                  </div>
                  <Progress
                    value={(alert.current / alert.threshold) * 100}
                    className={cn(
                      'w-16 h-2',
                      alert.type === 'critical' ? 'bg-red-900' : 'bg-yellow-900'
                    )}
                  />
                </div>
              ))}
            </motion.div>
          )}

          {/* Daily Usage Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <BarChart3 className="h-4 w-4 text-zinc-400" />
                Daily Spending
              </div>
              <span className="text-xs text-zinc-500">
                Total: {formatCurrency(weeklyTotal)}
              </span>
            </div>
            <div className="flex items-end gap-2 h-32">
              {mockDailyUsage.map((day, index) => {
                const heightPercent = (day.cost / maxDailyCost) * 100;
                const isToday = day.date === 'Today';

                return (
                  <motion.div
                    key={day.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className={cn(
                        'w-full rounded-t-sm transition-colors relative group',
                        isToday
                          ? 'bg-blue-500'
                          : 'bg-zinc-600 hover:bg-zinc-500'
                      )}
                      style={{ height: '100%' }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {formatCurrency(day.cost)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              {mockDailyUsage.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    'flex-1 text-center text-xs',
                    day.date === 'Today' ? 'text-blue-400' : 'text-zinc-500'
                  )}
                >
                  {day.date}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Model Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <PieChart className="h-4 w-4 text-zinc-400" />
                Cost by Model
              </div>
            </div>

            {/* Pie Chart Visualization */}
            <div className="flex items-center gap-6 mb-4">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {mockModelUsage.reduce(
                    (acc, model, index) => {
                      const percentage = (model.totalCost / totalCost) * 100;
                      const strokeDasharray = `${percentage} ${100 - percentage}`;
                      const strokeDashoffset = -acc.offset;
                      const colorClass = MODEL_COLORS[model.model] || 'bg-zinc-500';
                      const strokeColor = colorClass
                        .replace('bg-', '')
                        .replace('-500', '');

                      acc.elements.push(
                        <circle
                          key={model.model}
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="transparent"
                          stroke={
                            model.model === 'claude-opus-4-5'
                              ? '#a855f7'
                              : model.model === 'claude-sonnet-4'
                              ? '#3b82f6'
                              : '#10b981'
                          }
                          strokeWidth="3"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                      acc.offset += percentage;
                      return acc;
                    },
                    { elements: [] as React.ReactNode[], offset: 0 }
                  ).elements}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-zinc-400 font-medium">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {mockModelUsage.map((model) => {
                  const percentage = (model.totalCost / totalCost) * 100;
                  return (
                    <div key={model.model} className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-sm',
                          MODEL_COLORS[model.model] || 'bg-zinc-500'
                        )}
                      />
                      <span className="text-xs text-zinc-400 flex-1 truncate">
                        {model.model.replace('claude-', '')}
                      </span>
                      <span className="text-xs text-zinc-300 font-mono">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Model Stats */}
            <div className="space-y-3 pt-3 border-t border-zinc-700/50">
              {mockModelUsage.map((model) => (
                <div
                  key={model.model}
                  className="bg-zinc-900/50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm text-zinc-200 font-medium">
                        {model.model}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-zinc-700 text-zinc-300 text-xs"
                    >
                      {model.sessions} sessions
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-zinc-500">Input</p>
                      <p className="text-zinc-300 font-mono">
                        {formatNumber(model.inputTokens)} tokens
                      </p>
                      <p className="text-zinc-500">
                        {formatCurrency(model.inputCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Output</p>
                      <p className="text-zinc-300 font-mono">
                        {formatNumber(model.outputTokens)} tokens
                      </p>
                      <p className="text-zinc-500">
                        {formatCurrency(model.outputCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Total</p>
                      <p className="text-emerald-400 font-mono font-medium">
                        {formatCurrency(model.totalCost)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Cost Projections */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-zinc-300">Monthly Projection</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Estimated Monthly</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(avgDailyCost * 30)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Budget Remaining</p>
                <p className="text-xl font-bold text-emerald-400">
                  {formatCurrency(500 - totalCost)}
                </p>
                <Progress
                  value={(totalCost / 500) * 100}
                  className="h-1.5 mt-2 bg-zinc-700"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {formatCurrency(totalCost)} / $500.00 budget
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
        <span>Last updated: Just now</span>
        <span>Billing cycle: Feb 1 - Feb 28</span>
      </div>
    </div>
  );
}
