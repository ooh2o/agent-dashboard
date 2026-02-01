import { NextRequest, NextResponse } from 'next/server';
import type { UsageMetrics, SessionMetrics } from '@/lib/analytics';
import { formatAsCSV, formatSessionsAsCSV, createEmptyMetrics, getDateDaysAgo, getTodayISO } from '@/lib/analytics';

// Mock data storage (would be shared with other routes in production)
const metricsData = new Map<string, UsageMetrics>();
const sessionsData = new Map<string, SessionMetrics>();

/**
 * Initialize mock data
 */
function initializeMockData() {
  if (metricsData.size > 0) return;

  // Generate 30 days of metrics
  for (let i = 0; i < 30; i++) {
    const date = getDateDaysAgo(i);
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseMultiplier = isWeekend ? 0.3 : 1;

    metricsData.set(date, {
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

    const metrics = metricsData.get(date)!;
    metrics.tokens.total = metrics.tokens.input + metrics.tokens.output;
    metrics.cost = (metrics.tokens.input / 1_000_000) * 3 + (metrics.tokens.output / 1_000_000) * 15;
  }

  // Generate 30 sessions
  const models = ['claude-opus-4-5', 'claude-sonnet-4', 'claude-haiku-3-5'];
  const channels = ['main', 'research', 'coding'];
  const statuses: SessionMetrics['status'][] = ['completed', 'completed', 'failed'];
  const toolOptions = ['file_read', 'file_write', 'web_fetch', 'memory_read', 'thinking'];

  for (let i = 0; i < 30; i++) {
    const startTime = new Date(Date.now() - Math.random() * 30 * 86400000);
    const duration = Math.floor(Math.random() * 3600000) + 60000;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const inputTokens = Math.floor(Math.random() * 200000) + 10000;
    const outputTokens = Math.floor(Math.random() * 80000) + 5000;

    const numTools = Math.floor(Math.random() * 4) + 1;
    const toolsUsed: string[] = [];
    for (let j = 0; j < numTools; j++) {
      const tool = toolOptions[Math.floor(Math.random() * toolOptions.length)];
      if (!toolsUsed.includes(tool)) toolsUsed.push(tool);
    }

    const id = `sess_${i}_${Date.now().toString(36)}`;
    sessionsData.set(id, {
      id,
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + duration).toISOString(),
      duration,
      tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
      cost: (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15,
      toolsUsed,
      model: models[Math.floor(Math.random() * models.length)],
      channel: channels[Math.floor(Math.random() * channels.length)],
      status,
      errorCount: status === 'failed' ? Math.floor(Math.random() * 3) + 1 : 0,
    });
  }
}

/**
 * GET /api/analytics/export
 *
 * Export analytics data as CSV or JSON.
 *
 * Query parameters:
 * - format: Export format (csv, json) - default: json
 * - start: Start date (YYYY-MM-DD)
 * - end: End date (YYYY-MM-DD)
 * - includeMetrics: Include daily metrics (default: true)
 * - includeSessions: Include session data (default: true)
 * - includeTools: Include tool breakdown (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    initializeMockData();

    const { searchParams } = new URL(request.url);

    const format = (searchParams.get('format') || 'json') as 'csv' | 'json';
    const startDate = searchParams.get('start') || getDateDaysAgo(30);
    const endDate = searchParams.get('end') || getTodayISO();
    const includeMetrics = searchParams.get('includeMetrics') !== 'false';
    const includeSessions = searchParams.get('includeSessions') !== 'false';

    // Collect metrics in date range
    const metrics: UsageMetrics[] = [];
    if (includeMetrics) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (const [date, m] of metricsData.entries()) {
        const d = new Date(date);
        if (d >= start && d <= end) {
          metrics.push(m);
        }
      }
      metrics.sort((a, b) => a.date.localeCompare(b.date));
    }

    // Collect sessions in date range
    const sessions: SessionMetrics[] = [];
    if (includeSessions) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (const session of sessionsData.values()) {
        const d = new Date(session.startTime);
        if (d >= start && d <= end) {
          sessions.push(session);
        }
      }
      sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }

    if (format === 'csv') {
      // Generate CSV
      const parts: string[] = [];

      if (includeMetrics && metrics.length > 0) {
        parts.push('=== Daily Metrics ===');
        parts.push(formatAsCSV(metrics));
      }

      if (includeSessions && sessions.length > 0) {
        if (parts.length > 0) parts.push('');
        parts.push('=== Sessions ===');
        parts.push(formatSessionsAsCSV(sessions));
      }

      const csv = parts.join('\n');
      const filename = `openclaw-analytics-${startDate}-to-${endDate}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // JSON format
    const exportData = {
      exportedAt: new Date().toISOString(),
      dateRange: { start: startDate, end: endDate },
      ...(includeMetrics && { metrics }),
      ...(includeSessions && { sessions }),
      summary: {
        totalDays: metrics.length,
        totalSessions: sessions.length,
        totalTokens: metrics.reduce((sum, m) => sum + m.tokens.total, 0),
        totalCost: metrics.reduce((sum, m) => sum + m.cost, 0),
      },
    };

    const filename = `openclaw-analytics-${startDate}-to-${endDate}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}

// Ensure dynamic behavior
export const dynamic = 'force-dynamic';
