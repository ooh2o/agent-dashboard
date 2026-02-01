'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Zap,
  LineChart,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { EfficiencyCard } from './efficiency-card';
import { EfficiencyTrend, generateMockTrendData } from './efficiency-trend';
import { CostBreakdown, generateMockCostBreakdown } from './cost-breakdown';
import {
  calculateEfficiency,
  EfficiencyMetrics,
} from './efficiency-metrics';

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

type TabType = 'costs' | 'efficiency' | 'trends';

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
  const [activeTab, setActiveTab] = useState<TabType>('costs');
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const totalInputTokens = useMemo(
    () => mockModelUsage.reduce((sum, m) => sum + m.inputTokens, 0),
    []
  );

  const totalOutputTokens = useMemo(
    () => mockModelUsage.reduce((sum, m) => sum + m.outputTokens, 0),
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

  // Fetch efficiency data from API or calculate locally
  useEffect(() => {
    async function fetchEfficiency() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/live/stats/efficiency');
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        const data = await response.json();

        if (data.ok && data.efficiency && data.efficiency.ratings) {
          // Convert API response to EfficiencyMetrics format
          const metrics: EfficiencyMetrics = {
            outputInputRatio: data.efficiency.outputInputRatio,
            outputInputRating: {
              level: data.efficiency.ratings.outputInput,
              label: data.efficiency.ratings.outputInput === 'good' ? 'Efficient' :
                     data.efficiency.ratings.outputInput === 'warning' ? 'Moderate' : 'Low Output',
              icon: data.efficiency.ratings.outputInput === 'good' ? '🟢' :
                    data.efficiency.ratings.outputInput === 'warning' ? '🟡' : '🔴',
            },
            tokensPerAction: data.efficiency.tokensPerAction,
            tokensPerActionRating: {
              level: data.efficiency.ratings.tokensPerAction,
              label: data.efficiency.ratings.tokensPerAction === 'good' ? 'Efficient' :
                     data.efficiency.ratings.tokensPerAction === 'warning' ? 'Moderate' : 'High Token Use',
              icon: data.efficiency.ratings.tokensPerAction === 'good' ? '🟢' :
                    data.efficiency.ratings.tokensPerAction === 'warning' ? '🟡' : '🔴',
            },
            tokensPerActionByType: Object.fromEntries(
              Object.entries(data.efficiency.tokensPerActionByType || {}).map(([k, v]: [string, any]) => [
                k,
                { count: v.count, totalTokens: v.count * v.avgTokens, avgTokens: v.avgTokens },
              ])
            ),
            thinkingRatio: data.efficiency.thinkingRatio,
            actionRatio: 1 - data.efficiency.thinkingRatio,
            thinkingRating: {
              level: data.efficiency.ratings.thinking,
              label: data.efficiency.ratings.thinking === 'good' ? 'Balanced' : 'Unbalanced',
              icon: data.efficiency.ratings.thinking === 'good' ? '🟢' : '🟡',
            },
            contextUtilization: data.efficiency.contextUtilization,
            contextUtilizationRating: {
              level: data.efficiency.ratings.context,
              label: data.efficiency.ratings.context === 'good' ? 'Optimal' :
                     data.efficiency.ratings.context === 'warning' ? 'Moderate' : 'High Usage',
              icon: data.efficiency.ratings.context === 'good' ? '🟢' :
                    data.efficiency.ratings.context === 'warning' ? '🟡' : '🔴',
            },
            contextWindow: data.efficiency.contextWindow,
            contextUsed: data.efficiency.contextUsed,
            costPerTask: totalCost / Math.max(mockModelUsage.reduce((sum, m) => sum + m.sessions, 0), 1),
            costByCategory: data.efficiency.costByCategory,
            trend: {
              vsLastSession: data.efficiency.trend.vsLastSession,
              vsLastWeek: 0,
              direction: data.efficiency.trend.direction,
            },
            tips: data.efficiency.tips,
          };
          setEfficiencyData(metrics);
        } else {
          // Fallback to local calculation with mock data
          const mockActivities = Array(50).fill(null).map((_, i) => ({
            id: `mock-${i}`,
            timestamp: new Date(),
            type: (i % 5 === 0 ? 'thinking' : 'tool_call') as 'thinking' | 'tool_call',
            tool: i % 3 === 0 ? 'Read' : i % 3 === 1 ? 'Write' : 'Bash',
            result: 'success' as const,
            explanation: 'Mock activity',
          }));

          const metrics = calculateEfficiency({
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            activities: mockActivities,
          });
          setEfficiencyData(metrics);
        }
      } catch (error) {
        console.error('Error fetching efficiency data:', error);
        // Fallback to local calculation
        const mockActivities = Array(50).fill(null).map((_, i) => ({
          id: `mock-${i}`,
          timestamp: new Date(),
          type: (i % 5 === 0 ? 'thinking' : 'tool_call') as 'thinking' | 'tool_call',
          tool: i % 3 === 0 ? 'Read' : i % 3 === 1 ? 'Write' : 'Bash',
          result: 'success' as const,
          explanation: 'Mock activity',
        }));

        const metrics = calculateEfficiency({
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          activities: mockActivities,
        });
        setEfficiencyData(metrics);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEfficiency();
  }, [totalInputTokens, totalOutputTokens, totalCost]);

  // Mock trend and cost breakdown data
  const trendData = useMemo(() => generateMockTrendData(7), []);
  const costBreakdownData = useMemo(() => generateMockCostBreakdown(totalCost), [totalCost]);

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

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <button
          onClick={() => setActiveTab('costs')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            activeTab === 'costs'
              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
          )}
        >
          <DollarSign className="h-3.5 w-3.5" />
          Costs
        </button>
        <button
          onClick={() => setActiveTab('efficiency')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            activeTab === 'efficiency'
              ? 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          Efficiency
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            activeTab === 'trends'
              ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
          )}
        >
          <LineChart className="h-3.5 w-3.5" />
          Trends
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Costs Tab */}
          {activeTab === 'costs' && (
            <>
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
            </>
          )}

          {/* Efficiency Tab */}
          {activeTab === 'efficiency' && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400" />
                    <span className="text-sm">Loading efficiency metrics...</span>
                  </div>
                </div>
              ) : efficiencyData ? (
                <>
                  <EfficiencyCard metrics={efficiencyData} />
                  <CostBreakdown
                    data={efficiencyData.costByCategory}
                    totalCost={totalCost}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
                  No efficiency data available
                </div>
              )}
            </>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <>
              <EfficiencyTrend data={trendData} />

              {/* Additional trend stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 text-sm text-zinc-300 mb-3">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Best Session
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Output/Input</span>
                      <span className="text-xs text-emerald-400 font-mono">2.8x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Tokens/Action</span>
                      <span className="text-xs text-emerald-400 font-mono">320</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Date</span>
                      <span className="text-xs text-zinc-300">Yesterday</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 text-sm text-zinc-300 mb-3">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    Weekly Average
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Output/Input</span>
                      <span className="text-xs text-blue-400 font-mono">1.9x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Tokens/Action</span>
                      <span className="text-xs text-blue-400 font-mono">485</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Trend</span>
                      <span className="text-xs text-emerald-400">+8% improvement</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
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
