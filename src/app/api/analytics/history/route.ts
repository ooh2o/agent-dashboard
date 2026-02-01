import { NextRequest, NextResponse } from 'next/server';
import type { AnalyticsHistory, UsageMetrics } from '@/lib/analytics';
import { createEmptyMetrics, getTodayISO, getDateDaysAgo } from '@/lib/analytics';

// In-memory storage (shared with summary route in production this would be a database)
const analyticsData = {
  dailyMetrics: new Map<string, UsageMetrics>(),
};

/**
 * Initialize with mock data for demonstration
 */
function initializeMockData() {
  if (analyticsData.dailyMetrics.size > 0) return;

  // Generate last 30 days of mock data
  for (let i = 0; i < 30; i++) {
    const date = getDateDaysAgo(i);
    // Create varying patterns - weekends have less usage
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseMultiplier = isWeekend ? 0.3 : 1;

    analyticsData.dailyMetrics.set(date, {
      date,
      tokens: {
        input: Math.floor((Math.random() * 400000 + 150000) * baseMultiplier),
        output: Math.floor((Math.random() * 120000 + 40000) * baseMultiplier),
        total: 0,
      },
      cost: 0,
      toolCalls: Math.floor((Math.random() * 80 + 15) * baseMultiplier),
      sessions: Math.floor((Math.random() * 8 + 2) * baseMultiplier),
      errors: Math.floor(Math.random() * 4),
    });

    const metrics = analyticsData.dailyMetrics.get(date)!;
    metrics.tokens.total = metrics.tokens.input + metrics.tokens.output;
    metrics.cost = (metrics.tokens.input / 1_000_000) * 3 + (metrics.tokens.output / 1_000_000) * 15;
  }
}

/**
 * GET /api/analytics/history?days=30
 *
 * Returns historical analytics data for the specified number of days.
 *
 * Query parameters:
 * - days: Number of days of history (default: 30, max: 365)
 */
export async function GET(request: NextRequest) {
  try {
    initializeMockData();

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = Math.min(Math.max(parseInt(daysParam || '30', 10), 1), 365);

    const endDate = getTodayISO();
    const startDate = getDateDaysAgo(days - 1);

    // Collect metrics for the date range
    const metrics: UsageMetrics[] = [];
    const totals = { tokens: 0, cost: 0, sessions: 0, toolCalls: 0, errors: 0 };

    for (let i = days - 1; i >= 0; i--) {
      const date = getDateDaysAgo(i);
      const dayMetrics = analyticsData.dailyMetrics.get(date) || createEmptyMetrics(date);
      metrics.push(dayMetrics);

      totals.tokens += dayMetrics.tokens.total;
      totals.cost += dayMetrics.cost;
      totals.sessions += dayMetrics.sessions;
      totals.toolCalls += dayMetrics.toolCalls;
      totals.errors += dayMetrics.errors;
    }

    const response: AnalyticsHistory = {
      period: {
        start: startDate,
        end: endDate,
        days,
      },
      metrics,
      totals,
      averages: {
        tokensPerDay: Math.round(totals.tokens / days),
        costPerDay: totals.cost / days,
        sessionsPerDay: totals.sessions / days,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics history error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics history' },
      { status: 500 }
    );
  }
}

// Ensure dynamic behavior
export const dynamic = 'force-dynamic';
