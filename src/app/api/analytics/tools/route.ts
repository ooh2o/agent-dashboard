import { NextRequest, NextResponse } from 'next/server';
import type { ToolAnalytics, ToolBreakdown } from '@/lib/analytics';
import { getToolCategory } from '@/lib/analytics';

// In-memory storage (shared with other routes)
const toolBreakdownData = new Map<string, ToolBreakdown>();

/**
 * Initialize with mock data for demonstration
 */
function initializeMockData() {
  if (toolBreakdownData.size > 0) return;

  const tools: ToolBreakdown[] = [
    { tool: 'file_read', count: 1450, avgDuration: 85, totalTokens: 425000, successRate: 98.5 },
    { tool: 'file_write', count: 580, avgDuration: 120, totalTokens: 285000, successRate: 97.2 },
    { tool: 'web_fetch', count: 295, avgDuration: 850, totalTokens: 750000, successRate: 94.5 },
    { tool: 'web_search', count: 162, avgDuration: 1200, totalTokens: 480000, successRate: 96.8 },
    { tool: 'memory_read', count: 920, avgDuration: 45, totalTokens: 175000, successRate: 99.1 },
    { tool: 'memory_write', count: 445, avgDuration: 65, totalTokens: 145000, successRate: 98.6 },
    { tool: 'memory_access', count: 215, avgDuration: 55, totalTokens: 95000, successRate: 99.5 },
    { tool: 'thinking', count: 780, avgDuration: 2500, totalTokens: 1250000, successRate: 100 },
    { tool: 'subagent_spawn', count: 78, avgDuration: 15000, totalTokens: 980000, successRate: 89.3 },
    { tool: 'message_send', count: 245, avgDuration: 150, totalTokens: 185000, successRate: 99.8 },
    { tool: 'tool_call', count: 1850, avgDuration: 350, totalTokens: 625000, successRate: 96.2 },
  ];

  for (const tool of tools) {
    toolBreakdownData.set(tool.tool, {
      ...tool,
      lastUsed: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    });
  }
}

/**
 * GET /api/analytics/tools
 *
 * Returns tool usage breakdown including:
 * - Per-tool statistics (count, duration, tokens, success rate)
 * - Category breakdown
 * - Most used and longest duration tools
 */
export async function GET(request: NextRequest) {
  try {
    initializeMockData();

    const tools = Array.from(toolBreakdownData.values());

    // Calculate total calls
    const totalCalls = tools.reduce((sum, t) => sum + t.count, 0);

    // Calculate category breakdown
    const categoryBreakdown: Record<string, number> = {};
    for (const tool of tools) {
      const category = getToolCategory(tool.tool);
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + tool.count;
    }

    // Sort tools by count for display
    const sortedTools = [...tools].sort((a, b) => b.count - a.count);

    // Find most used and longest duration
    const mostUsed = sortedTools[0];
    const longestDuration = [...tools].sort((a, b) => b.avgDuration - a.avgDuration)[0];

    const response: ToolAnalytics = {
      tools: sortedTools,
      totalCalls,
      categoryBreakdown,
      mostUsed,
      longestDuration,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics tools error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tool analytics' },
      { status: 500 }
    );
  }
}

// Ensure dynamic behavior
export const dynamic = 'force-dynamic';
