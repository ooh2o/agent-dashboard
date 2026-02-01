/**
 * API Route: /api/live/activities
 * Returns recent activity feed from OpenClaw
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecentActivities, getSessionActivities } from '@/lib/openclaw-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    const activities = sessionId 
      ? await getSessionActivities(sessionId, limit)
      : await getRecentActivities(limit);
    
    return NextResponse.json({
      ok: true,
      activities,
      count: activities.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
