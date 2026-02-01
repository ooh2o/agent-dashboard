import { NextRequest, NextResponse } from 'next/server';
import type { AnalyticsSummary, UsageMetrics, ToolBreakdown } from '@/lib/analytics';
import { calculatePercentChange, createEmptyMetrics, getTodayISO, getDateDaysAgo } from '@/lib/analytics';

// In-memory storage for server-side analytics (would be replaced with persistent storage in production)
const analyticsData = {
  dailyMetrics: new Map<string, UsageMetrics>(),
  toolBreakdown: new Map<string, ToolBreakdown>(),
};

/**
 * Initialize with mock data for demonstration
 */
function initializeMockData() {
  if (analyticsData.dailyMetrics.size > 0) return;

  const today = getTodayISO();

  // Generate last 7 days of mock data
  for (let i = 0; i < 7; i++) {
    const date = getDateDaysAgo(i);
    analyticsData.dailyMetrics.set(date, {
      date,
      tokens: {
        input: Math.floor(Math.random() * 500000) + 200000,
        output: Math.floor(Math.random() * 150000) + 50000,
        total: 0,
      },
      cost: 0,
      toolCalls: Math.floor(Math.random() * 100) + 20,
      sessions: Math.floor(Math.random() * 10) + 2,
      errors: Math.floor(Math.random() * 5),
    });

    const metrics = analyticsData.dailyMetrics.get(date)!;
    metrics.tokens.total = metrics.tokens.input + metrics.tokens.output;
    metrics.cost = (metrics.tokens.input / 1_000_000) * 3 + (metrics.tokens.output / 1_000_000) * 15;
  }

  // Mock tool breakdown
  const tools = [
    { tool: 'file_read', count: 450, avgDuration: 85, totalTokens: 125000, successRate: 98.5 },
    { tool: 'file_write', count: 180, avgDuration: 120, totalTokens: 85000, successRate: 97.2 },
    { tool: 'web_fetch', count: 95, avgDuration: 850, totalTokens: 250000, successRate: 94.5 },
    { tool: 'web_search', count: 62, avgDuration: 1200, totalTokens: 180000, successRate: 96.8 },
    { tool: 'memory_read', count: 320, avgDuration: 45, totalTokens: 75000, successRate: 99.1 },
    { tool: 'memory_write', count: 145, avgDuration: 65, totalTokens: 45000, successRate: 98.6 },
    { tool: 'thinking', count: 280, avgDuration: 2500, totalTokens: 450000, successRate: 100 },
    { tool: 'subagent_spawn', count: 28, avgDuration: 15000, totalTokens: 380000, successRate: 89.3 },
  ];

  for (const tool of tools) {
    analyticsData.toolBreakdown.set(tool.tool, {
      ...tool,
      lastUsed: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    });
  }
}

/**
 * GET /api/analytics/summary
 *
 * Returns today's summary stats including:
 * - Today's metrics
 * - Week and month totals
 * - Top tools
 * - Percent change from yesterday
 */
export async function GET(request: NextRequest) {
  try {
    initializeMockData();

    const today = getTodayISO();
    const yesterday = getDateDaysAgo(1);

    // Get today's metrics
    const todayMetrics = analyticsData.dailyMetrics.get(today) || createEmptyMetrics(today);
    const yesterdayMetrics = analyticsData.dailyMetrics.get(yesterday);

    // Calculate week total
    const weekTotal = { tokens: 0, cost: 0, sessions: 0, toolCalls: 0 };
    for (let i = 0; i < 7; i++) {
      const date = getDateDaysAgo(i);
      const metrics = analyticsData.dailyMetrics.get(date);
      if (metrics) {
        weekTotal.tokens += metrics.tokens.total;
        weekTotal.cost += metrics.cost;
        weekTotal.sessions += metrics.sessions;
        weekTotal.toolCalls += metrics.toolCalls;
      }
    }

    // Calculate month total
    const monthTotal = { tokens: 0, cost: 0, sessions: 0, toolCalls: 0 };
    for (let i = 0; i < 30; i++) {
      const date = getDateDaysAgo(i);
      const metrics = analyticsData.dailyMetrics.get(date);
      if (metrics) {
        monthTotal.tokens += metrics.tokens.total;
        monthTotal.cost += metrics.cost;
        monthTotal.sessions += metrics.sessions;
        monthTotal.toolCalls += metrics.toolCalls;
      }
    }

    // Get top 5 tools
    const topTools = Array.from(analyticsData.toolBreakdown.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate percent changes
    const percentChange = {
      tokens: calculatePercentChange(
        todayMetrics.tokens.total,
        yesterdayMetrics?.tokens.total || 0
      ),
      cost: calculatePercentChange(
        todayMetrics.cost,
        yesterdayMetrics?.cost || 0
      ),
      sessions: calculatePercentChange(
        todayMetrics.sessions,
        yesterdayMetrics?.sessions || 0
      ),
    };

    const summary: AnalyticsSummary = {
      today: todayMetrics,
      yesterday: yesterdayMetrics,
      weekTotal,
      monthTotal,
      topTools,
      percentChange,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Analytics summary error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics summary' },
      { status: 500 }
    );
  }
}

// Ensure dynamic behavior
export const dynamic = 'force-dynamic';
