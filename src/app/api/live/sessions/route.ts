/**
 * API Route: /api/live/sessions
 * Returns live session data from OpenClaw Gateway WebSocket RPC
 * Falls back to file-based reading if Gateway is unavailable
 */

import { NextResponse } from 'next/server';
import { getSessions, getCurrentSessionStats } from '@/lib/openclaw-data';
import { getGatewayClient } from '@/lib/gateway-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try Gateway WebSocket RPC first
    try {
      const client = getGatewayClient();
      const sessions = await client.sessionsList({ limit: 50 });

      // Transform Gateway sessions to match expected format
      const transformedSessions = sessions.map((session) => ({
        id: session.key,
        agentId: session.agentId,
        channel: session.channel,
        lastActivity: new Date(session.lastActivityAt).toISOString(),
        messageCount: session.messageCount,
        status: session.status || 'active',
      }));

      // Calculate stats from sessions
      const stats = {
        totalSessions: sessions.length,
        activeSessions: sessions.filter((s) => s.status === 'active' || !s.status).length,
        totalMessages: sessions.reduce((sum, s) => sum + (s.messageCount || 0), 0),
      };

      return NextResponse.json({
        ok: true,
        sessions: transformedSessions,
        stats,
        source: 'gateway',
        connected: true,
        timestamp: new Date().toISOString(),
      });
    } catch (gatewayError) {
      console.log('[sessions] Gateway unavailable, falling back to file:', (gatewayError as Error).message);
    }

    // Fallback: Read from file system
    const [sessions, stats] = await Promise.all([
      getSessions(),
      getCurrentSessionStats(),
    ]);

    return NextResponse.json({
      ok: true,
      sessions,
      stats,
      source: 'file',
      connected: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
