'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Activity,
  Coins,
  Clock,
  Download,
  TrendingUp,
  TrendingDown,
  Wrench,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { formatCurrency, formatNumber, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
  AnalyticsSummary,
  AnalyticsHistory,
  ToolAnalytics,
  SessionHistory,
  SessionMetrics,
} from '@/lib/analytics';

// Props interface
interface AnalyticsDashboardProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

// Time range options
type TimeRange = '7d' | '14d' | '30d' | '90d';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string; days: number }[] = [
  { value: '7d', label: '7 Days', days: 7 },
  { value: '14d', label: '14 Days', days: 14 },
  { value: '30d', label: '30 Days', days: 30 },
  { value: '90d', label: '90 Days', days: 90 },
];

// Chart colors
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
};

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f43f5e'];

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-zinc-300 text-sm font-medium mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.name.includes('Cost') ? formatCurrency(entry.value) : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function AnalyticsDashboard({
  onClose,
  onMinimize,
  onMaximize,
}: AnalyticsDashboardProps) {
  // State
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [history, setHistory] = useState<AnalyticsHistory | null>(null);
  const [toolAnalytics, setToolAnalytics] = useState<ToolAnalytics | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'sessions'>('overview');
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionSort, setSessionSort] = useState<{ field: string; order: 'asc' | 'desc' }>({
    field: 'startTime',
    order: 'desc',
  });
  const [exporting, setExporting] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const days = TIME_RANGE_OPTIONS.find(o => o.value === timeRange)?.days || 30;

      const [summaryRes, historyRes, toolsRes, sessionsRes] = await Promise.all([
        fetch('/api/analytics/summary'),
        fetch(`/api/analytics/history?days=${days}`),
        fetch('/api/analytics/tools'),
        fetch(`/api/analytics/sessions?page=${sessionPage}&pageSize=10&sort=${sessionSort.field}&order=${sessionSort.order}`),
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (historyRes.ok) setHistory(await historyRes.json());
      if (toolsRes.ok) setToolAnalytics(await toolsRes.json());
      if (sessionsRes.ok) setSessionHistory(await sessionsRes.json());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, sessionPage, sessionSort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export handler
  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const days = TIME_RANGE_OPTIONS.find(o => o.value === timeRange)?.days || 30;
      const startDate = format === 'csv'
        ? subDays(new Date(), days).toISOString().split('T')[0]
        : subDays(new Date(), days).toISOString().split('T')[0];

      const response = await fetch(
        `/api/analytics/export?format=${format}&start=${startDate}&includeMetrics=true&includeSessions=true`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  // Chart data transformations
  const chartData = useMemo(() => {
    if (!history?.metrics) return [];
    return history.metrics.map(m => ({
      date: format(parseISO(m.date), 'MMM d'),
      tokens: m.tokens.total,
      cost: m.cost,
      sessions: m.sessions,
      toolCalls: m.toolCalls,
      errors: m.errors,
    }));
  }, [history]);

  const toolPieData = useMemo(() => {
    if (!toolAnalytics?.tools) return [];
    return toolAnalytics.tools.slice(0, 7).map(t => ({
      name: t.tool.replace('_', ' '),
      value: t.count,
    }));
  }, [toolAnalytics]);

  const categoryData = useMemo(() => {
    if (!toolAnalytics?.categoryBreakdown) return [];
    return Object.entries(toolAnalytics.categoryBreakdown).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [toolAnalytics]);

  // Render summary cards
  const renderSummaryCards = () => {
    if (!summary) return null;

    const cards = [
      {
        title: "Today's Tokens",
        value: formatNumber(summary.today.tokens.total),
        change: summary.percentChange.tokens,
        icon: Activity,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
      },
      {
        title: "Today's Cost",
        value: formatCurrency(summary.today.cost),
        change: summary.percentChange.cost,
        icon: Coins,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
      },
      {
        title: "Sessions",
        value: summary.today.sessions.toString(),
        change: summary.percentChange.sessions,
        icon: Clock,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
      },
      {
        title: "Tool Calls",
        value: formatNumber(summary.today.toolCalls),
        icon: Wrench,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
      },
    ];

    return (
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'rounded-lg p-3 border border-zinc-700/50',
              card.bgColor
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">{card.title}</span>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
            {card.change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {card.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={cn(
                  'text-xs',
                  card.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {Math.abs(card.change).toFixed(1)}% from yesterday
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  // Render usage over time chart
  const renderUsageChart = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-300">Usage Over Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-zinc-400">Tokens</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-400">Cost</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              yAxisId="tokens"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="cost"
              orientation="right"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              yAxisId="tokens"
              type="monotone"
              dataKey="tokens"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={false}
              name="Tokens"
            />
            <Line
              yAxisId="cost"
              type="monotone"
              dataKey="cost"
              stroke={CHART_COLORS.success}
              strokeWidth={2}
              dot={false}
              name="Cost"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );

  // Render daily costs bar chart
  const renderDailyCostsChart = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50"
    >
      <div className="flex items-center gap-2 mb-4">
        <Coins className="h-4 w-4 text-zinc-400" />
        <span className="text-sm text-zinc-300">Daily Costs</span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.slice(-14)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} name="Cost" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );

  // Render tool usage pie chart
  const renderToolPieChart = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50"
    >
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="h-4 w-4 text-zinc-400" />
        <span className="text-sm text-zinc-300">Tool Usage Distribution</span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={toolPieData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {toolPieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatNumber(value as number)}
              contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px' }}
            />
            <Legend
              formatter={(value) => <span className="text-xs text-zinc-300">{value}</span>}
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );

  // Render tools tab
  const renderToolsTab = () => {
    if (!toolAnalytics) return null;

    return (
      <div className="space-y-4">
        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">Category Breakdown</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} name="Calls" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tool details table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 overflow-hidden"
        >
          <div className="p-3 border-b border-zinc-700/50">
            <span className="text-sm text-zinc-300">Tool Details</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/50">
                <tr>
                  <th className="text-left p-3 text-zinc-400 font-medium">Tool</th>
                  <th className="text-right p-3 text-zinc-400 font-medium">Calls</th>
                  <th className="text-right p-3 text-zinc-400 font-medium">Avg Duration</th>
                  <th className="text-right p-3 text-zinc-400 font-medium">Tokens</th>
                  <th className="text-right p-3 text-zinc-400 font-medium">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {toolAnalytics.tools.map((tool, index) => (
                  <tr
                    key={tool.tool}
                    className={cn(
                      'border-b border-zinc-700/30',
                      index % 2 === 0 ? 'bg-zinc-800/30' : 'bg-zinc-800/50'
                    )}
                  >
                    <td className="p-3 text-zinc-200 font-mono text-xs">{tool.tool}</td>
                    <td className="p-3 text-right text-zinc-300">{formatNumber(tool.count)}</td>
                    <td className="p-3 text-right text-zinc-300">{formatDuration(tool.avgDuration)}</td>
                    <td className="p-3 text-right text-zinc-300">{formatNumber(tool.totalTokens)}</td>
                    <td className="p-3 text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          tool.successRate >= 95
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : tool.successRate >= 80
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        )}
                      >
                        {tool.successRate.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    );
  };

  // Render sessions tab
  const renderSessionsTab = () => {
    if (!sessionHistory) return null;

    const toggleSort = (field: string) => {
      setSessionSort(prev => ({
        field,
        order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc',
      }));
    };

    const SortIcon = ({ field }: { field: string }) => {
      if (sessionSort.field !== field) return null;
      return sessionSort.order === 'desc' ? (
        <ChevronDown className="h-3 w-3 inline ml-1" />
      ) : (
        <ChevronUp className="h-3 w-3 inline ml-1" />
      );
    };

    const StatusIcon = ({ status }: { status: SessionMetrics['status'] }) => {
      switch (status) {
        case 'completed':
          return <CheckCircle className="h-4 w-4 text-emerald-400" />;
        case 'failed':
          return <XCircle className="h-4 w-4 text-red-400" />;
        case 'active':
          return <AlertCircle className="h-4 w-4 text-blue-400" />;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 overflow-hidden"
      >
        <div className="p-3 border-b border-zinc-700/50 flex items-center justify-between">
          <span className="text-sm text-zinc-300">Session History</span>
          <span className="text-xs text-zinc-500">
            {sessionHistory.pagination.total} total sessions
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/50">
              <tr>
                <th
                  className="text-left p-3 text-zinc-400 font-medium cursor-pointer hover:text-zinc-200"
                  onClick={() => toggleSort('startTime')}
                >
                  Time <SortIcon field="startTime" />
                </th>
                <th className="text-left p-3 text-zinc-400 font-medium">Model</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Status</th>
                <th
                  className="text-right p-3 text-zinc-400 font-medium cursor-pointer hover:text-zinc-200"
                  onClick={() => toggleSort('duration')}
                >
                  Duration <SortIcon field="duration" />
                </th>
                <th
                  className="text-right p-3 text-zinc-400 font-medium cursor-pointer hover:text-zinc-200"
                  onClick={() => toggleSort('tokens')}
                >
                  Tokens <SortIcon field="tokens" />
                </th>
                <th
                  className="text-right p-3 text-zinc-400 font-medium cursor-pointer hover:text-zinc-200"
                  onClick={() => toggleSort('cost')}
                >
                  Cost <SortIcon field="cost" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sessionHistory.sessions.map((session, index) => (
                <tr
                  key={session.id}
                  className={cn(
                    'border-b border-zinc-700/30',
                    index % 2 === 0 ? 'bg-zinc-800/30' : 'bg-zinc-800/50'
                  )}
                >
                  <td className="p-3 text-zinc-300 text-xs">
                    {format(parseISO(session.startTime), 'MMM d, HH:mm')}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className="bg-zinc-700 text-zinc-300 text-xs">
                      {session.model.replace('claude-', '')}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <StatusIcon status={session.status} />
                      <span className="text-xs text-zinc-300 capitalize">{session.status}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right text-zinc-300 text-xs">
                    {formatDuration(session.duration)}
                  </td>
                  <td className="p-3 text-right text-zinc-300 font-mono text-xs">
                    {formatNumber(session.tokens.total)}
                  </td>
                  <td className="p-3 text-right text-emerald-400 font-mono text-xs">
                    {formatCurrency(session.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-zinc-700/50 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Page {sessionHistory.pagination.page} of{' '}
            {Math.ceil(sessionHistory.pagination.total / sessionHistory.pagination.pageSize)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSessionPage(p => Math.max(1, p - 1))}
              disabled={sessionHistory.pagination.page <= 1}
              className="px-2 py-1 text-xs bg-zinc-700 rounded hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setSessionPage(p => p + 1)}
              disabled={!sessionHistory.pagination.hasMore}
              className="px-2 py-1 text-xs bg-zinc-700 rounded hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

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
          Analytics Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-400" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {(['overview', 'tools', 'sessions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize',
                activeTab === tab
                  ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-zinc-800 text-zinc-300 text-xs rounded px-2 py-1 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {TIME_RANGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-zinc-400', loading && 'animate-spin')} />
          </button>

          {/* Export buttons */}
          <div className="flex items-center gap-1 border-l border-zinc-700 pl-2 ml-1">
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="px-2 py-1 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="px-2 py-1 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-6 w-6 text-zinc-500 animate-spin" />
            </div>
          ) : activeTab === 'overview' ? (
            <>
              {renderSummaryCards()}
              {renderUsageChart()}
              <div className="grid grid-cols-2 gap-4">
                {renderDailyCostsChart()}
                {renderToolPieChart()}
              </div>

              {/* Period summary */}
              {history && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-zinc-300">Period Summary ({history.period.days} days)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Total Tokens</p>
                      <p className="text-lg font-bold text-white">{formatNumber(history.totals.tokens)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Total Cost</p>
                      <p className="text-lg font-bold text-emerald-400">{formatCurrency(history.totals.cost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Avg/Day</p>
                      <p className="text-lg font-bold text-white">{formatCurrency(history.averages.costPerDay)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Sessions</p>
                      <p className="text-lg font-bold text-white">{history.totals.sessions}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          ) : activeTab === 'tools' ? (
            renderToolsTab()
          ) : (
            renderSessionsTab()
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
        <span>Last updated: {loading ? 'Loading...' : 'Just now'}</span>
        <span>Data retention: 90 days</span>
      </div>
    </div>
  );
}
