/**
 * API Route: /api/live/stats
 * Returns current session statistics
 */

import { NextResponse } from 'next/server';
import { getCurrentSessionStats, getSessions, calculateCost } from '@/lib/openclaw-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [stats, sessions] = await Promise.all([
      getCurrentSessionStats(),
      getSessions(),
    ]);
    
    // Calculate today's totals across all sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = sessions.filter(
      s => new Date(s.startTime) >= today
    );
    
    const todayTotals = todaySessions.reduce(
      (acc, s) => ({
        tokens: acc.tokens + s.totalTokens.input + s.totalTokens.output,
        cost: acc.cost + s.estimatedCost,
      }),
      { tokens: 0, cost: 0 }
    );
    
    return NextResponse.json({
      ok: true,
      current: stats,
      today: {
        tokens: todayTotals.tokens,
        cost: todayTotals.cost,
        sessions: todaySessions.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
