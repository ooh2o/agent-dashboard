import { NextRequest, NextResponse } from 'next/server';
import type { SessionHistory, SessionMetrics } from '@/lib/analytics';

// In-memory storage for sessions
const sessionsData = new Map<string, SessionMetrics>();

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Initialize with mock data for demonstration
 */
function initializeMockData() {
  if (sessionsData.size > 0) return;

  const models = ['claude-opus-4-5', 'claude-sonnet-4', 'claude-haiku-3-5'];
  const channels = ['main', 'research', 'coding', 'analysis'];
  const statuses: SessionMetrics['status'][] = ['completed', 'completed', 'completed', 'failed', 'active'];
  const toolOptions = [
    'file_read', 'file_write', 'web_fetch', 'web_search',
    'memory_read', 'memory_write', 'thinking', 'subagent_spawn',
  ];

  // Generate 50 mock sessions over the last 7 days
  for (let i = 0; i < 50; i++) {
    const startTime = new Date(Date.now() - Math.random() * 7 * 86400000);
    const duration = Math.floor(Math.random() * 3600000) + 60000; // 1 min to 1 hour
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const inputTokens = Math.floor(Math.random() * 200000) + 10000;
    const outputTokens = Math.floor(Math.random() * 80000) + 5000;

    // Random selection of tools used
    const numTools = Math.floor(Math.random() * 5) + 2;
    const toolsUsed: string[] = [];
    for (let j = 0; j < numTools; j++) {
      const tool = toolOptions[Math.floor(Math.random() * toolOptions.length)];
      if (!toolsUsed.includes(tool)) {
        toolsUsed.push(tool);
      }
    }

    const session: SessionMetrics = {
      id: generateSessionId(),
      startTime: startTime.toISOString(),
      endTime: status !== 'active' ? new Date(startTime.getTime() + duration).toISOString() : undefined,
      duration,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
      cost: (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15,
      toolsUsed,
      model: models[Math.floor(Math.random() * models.length)],
      channel: channels[Math.floor(Math.random() * channels.length)],
      status,
      errorCount: status === 'failed' ? Math.floor(Math.random() * 5) + 1 : 0,
    };

    sessionsData.set(session.id, session);
  }
}

/**
 * GET /api/analytics/sessions
 *
 * Returns session history with metrics.
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 10, max: 100)
 * - model: Filter by model
 * - channel: Filter by channel
 * - status: Filter by status (active, completed, failed)
 * - sort: Sort field (startTime, duration, cost, tokens)
 * - order: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    initializeMockData();

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);

    // Filters
    const modelFilter = searchParams.get('model');
    const channelFilter = searchParams.get('channel');
    const statusFilter = searchParams.get('status') as SessionMetrics['status'] | null;

    // Sorting
    const sortField = searchParams.get('sort') || 'startTime';
    const sortOrder = searchParams.get('order') || 'desc';

    // Get all sessions and apply filters
    let sessions = Array.from(sessionsData.values());

    if (modelFilter) {
      sessions = sessions.filter(s => s.model === modelFilter);
    }
    if (channelFilter) {
      sessions = sessions.filter(s => s.channel === channelFilter);
    }
    if (statusFilter) {
      sessions = sessions.filter(s => s.status === statusFilter);
    }

    // Sort sessions
    sessions.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'cost':
          comparison = a.cost - b.cost;
          break;
        case 'tokens':
          comparison = a.tokens.total - b.tokens.total;
          break;
        case 'startTime':
        default:
          comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Paginate
    const total = sessions.length;
    const start = (page - 1) * pageSize;
    const paginatedSessions = sessions.slice(start, start + pageSize);

    const response: SessionHistory = {
      sessions: paginatedSessions,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: start + pageSize < total,
      },
      filters: {
        model: modelFilter || undefined,
        channel: channelFilter || undefined,
        status: statusFilter || undefined,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session analytics' },
      { status: 500 }
    );
  }
}

// Ensure dynamic behavior
export const dynamic = 'force-dynamic';
