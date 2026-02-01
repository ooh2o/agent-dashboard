/**
 * Analytics Data Models
 *
 * Types and interfaces for tracking usage analytics in the OpenClaw Dashboard.
 * Supports aggregation from SSE events, local storage in IndexedDB, and export.
 */

import type { EventType, ActivityEvent } from '@/lib/types';

/**
 * Daily usage metrics
 */
export interface UsageMetrics {
  date: string; // ISO date string (YYYY-MM-DD)
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  toolCalls: number;
  sessions: number;
  errors: number;
}

/**
 * Tool usage breakdown
 */
export interface ToolBreakdown {
  tool: string;
  count: number;
  avgDuration: number;
  totalTokens: number;
  successRate: number;
  lastUsed?: string; // ISO timestamp
}

/**
 * Session metrics
 */
export interface SessionMetrics {
  id: string;
  startTime: string; // ISO timestamp
  endTime?: string; // ISO timestamp
  duration: number; // milliseconds
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  toolsUsed: string[];
  model: string;
  channel: string;
  status: 'active' | 'completed' | 'failed';
  errorCount: number;
}

/**
 * Analytics summary response
 */
export interface AnalyticsSummary {
  today: UsageMetrics;
  yesterday?: UsageMetrics;
  weekTotal: {
    tokens: number;
    cost: number;
    sessions: number;
    toolCalls: number;
  };
  monthTotal: {
    tokens: number;
    cost: number;
    sessions: number;
    toolCalls: number;
  };
  topTools: ToolBreakdown[];
  activeSession?: SessionMetrics;
  percentChange: {
    tokens: number;
    cost: number;
    sessions: number;
  };
}

/**
 * Analytics history response
 */
export interface AnalyticsHistory {
  period: {
    start: string;
    end: string;
    days: number;
  };
  metrics: UsageMetrics[];
  totals: {
    tokens: number;
    cost: number;
    sessions: number;
    toolCalls: number;
    errors: number;
  };
  averages: {
    tokensPerDay: number;
    costPerDay: number;
    sessionsPerDay: number;
  };
}

/**
 * Tool analytics response
 */
export interface ToolAnalytics {
  tools: ToolBreakdown[];
  totalCalls: number;
  categoryBreakdown: Record<string, number>;
  mostUsed: ToolBreakdown;
  longestDuration: ToolBreakdown;
}

/**
 * Session history response
 */
export interface SessionHistory {
  sessions: SessionMetrics[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  filters?: {
    model?: string;
    channel?: string;
    status?: string;
    dateRange?: { start: string; end: string };
  };
}

/**
 * Export options
 */
export interface ExportOptions {
  format: 'csv' | 'json';
  dateRange?: {
    start: string;
    end: string;
  };
  includeMetrics?: boolean;
  includeSessions?: boolean;
  includeTools?: boolean;
}

/**
 * Analytics settings for data retention
 */
export interface AnalyticsSettings {
  retentionDays: number;
  enabled: boolean;
  trackToolUsage: boolean;
  trackSessions: boolean;
}

/**
 * Default analytics settings
 */
export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  retentionDays: 90,
  enabled: true,
  trackToolUsage: true,
  trackSessions: true,
};

/**
 * Cost calculation constants (per 1M tokens)
 */
export const COST_PER_MILLION = {
  input: 3.0, // $3 per million input tokens
  output: 15.0, // $15 per million output tokens
};

/**
 * Calculate cost from token counts
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * COST_PER_MILLION.input;
  const outputCost = (outputTokens / 1_000_000) * COST_PER_MILLION.output;
  return inputCost + outputCost;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date N days ago in ISO format
 */
export function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Create empty usage metrics for a date
 */
export function createEmptyMetrics(date: string): UsageMetrics {
  return {
    date,
    tokens: { input: 0, output: 0, total: 0 },
    cost: 0,
    toolCalls: 0,
    sessions: 0,
    errors: 0,
  };
}

/**
 * Aggregate activities into usage metrics
 */
export function aggregateActivities(
  activities: ActivityEvent[],
  existingMetrics?: UsageMetrics
): UsageMetrics {
  const metrics = existingMetrics || createEmptyMetrics(getTodayISO());

  for (const activity of activities) {
    // Count tool calls
    if (activity.type === 'tool_call') {
      metrics.toolCalls++;
    }

    // Count errors
    if (activity.result === 'error' || activity.type === 'error') {
      metrics.errors++;
    }

    // Aggregate tokens
    if (activity.tokens) {
      metrics.tokens.input += activity.tokens.input;
      metrics.tokens.output += activity.tokens.output;
      metrics.tokens.total += activity.tokens.input + activity.tokens.output;
    }
  }

  // Recalculate cost
  metrics.cost = calculateCost(metrics.tokens.input, metrics.tokens.output);

  return metrics;
}

/**
 * Aggregate tool breakdown from activities
 */
export function aggregateToolBreakdown(activities: ActivityEvent[]): ToolBreakdown[] {
  const toolMap = new Map<string, {
    count: number;
    totalDuration: number;
    totalTokens: number;
    successCount: number;
    lastUsed?: string;
  }>();

  for (const activity of activities) {
    const tool = activity.tool || activity.type;
    if (!tool) continue;

    const existing = toolMap.get(tool) || {
      count: 0,
      totalDuration: 0,
      totalTokens: 0,
      successCount: 0,
    };

    existing.count++;
    existing.totalDuration += activity.durationMs || 0;
    existing.totalTokens += (activity.tokens?.input || 0) + (activity.tokens?.output || 0);

    if (activity.result !== 'error') {
      existing.successCount++;
    }

    existing.lastUsed = activity.timestamp instanceof Date
      ? activity.timestamp.toISOString()
      : activity.timestamp as string;

    toolMap.set(tool, existing);
  }

  return Array.from(toolMap.entries()).map(([tool, stats]) => ({
    tool,
    count: stats.count,
    avgDuration: stats.count > 0 ? stats.totalDuration / stats.count : 0,
    totalTokens: stats.totalTokens,
    successRate: stats.count > 0 ? (stats.successCount / stats.count) * 100 : 0,
    lastUsed: stats.lastUsed,
  })).sort((a, b) => b.count - a.count);
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format analytics data as CSV
 */
export function formatAsCSV(data: UsageMetrics[]): string {
  const headers = ['Date', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost', 'Tool Calls', 'Sessions', 'Errors'];
  const rows = data.map(m => [
    m.date,
    m.tokens.input,
    m.tokens.output,
    m.tokens.total,
    m.cost.toFixed(4),
    m.toolCalls,
    m.sessions,
    m.errors,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Format sessions as CSV
 */
export function formatSessionsAsCSV(sessions: SessionMetrics[]): string {
  const headers = ['ID', 'Start Time', 'End Time', 'Duration (ms)', 'Input Tokens', 'Output Tokens', 'Cost', 'Model', 'Channel', 'Status', 'Errors', 'Tools Used'];
  const rows = sessions.map(s => [
    s.id,
    s.startTime,
    s.endTime || '',
    s.duration,
    s.tokens.input,
    s.tokens.output,
    s.cost.toFixed(4),
    s.model,
    s.channel,
    s.status,
    s.errorCount,
    s.toolsUsed.join(';'),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Tool categories for grouping
 */
export const TOOL_CATEGORIES: Record<string, string[]> = {
  file: ['file_read', 'file_write'],
  web: ['web_search', 'web_fetch'],
  memory: ['memory_read', 'memory_write', 'memory_access'],
  communication: ['message_send'],
  agent: ['subagent_spawn', 'tool_call'],
  system: ['thinking', 'error'],
};

/**
 * Get category for a tool
 */
export function getToolCategory(tool: string): string {
  for (const [category, tools] of Object.entries(TOOL_CATEGORIES)) {
    if (tools.includes(tool)) {
      return category;
    }
  }
  return 'other';
}
