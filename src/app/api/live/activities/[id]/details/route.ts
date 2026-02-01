/**
 * API Route: /api/live/activities/[id]/details
 * Returns detailed information for a single activity including
 * technical content and human-readable explanation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecentActivities } from '@/lib/openclaw-data';
import {
  generateExplanation,
  generateTechnicalContent,
  ActivityExplanation,
  TechnicalContent,
} from '@/lib/activity-explanations';
import { ActivityEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface ActivityDetailsResponse {
  ok: boolean;
  activity?: ActivityEvent;
  technical?: TechnicalContent;
  explanation?: ActivityExplanation;
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ActivityDetailsResponse>> {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    // Fetch all recent activities to find the one we need
    // In a real implementation, this would be a direct DB lookup
    const activities = await getRecentActivities(100);
    const activity = activities.find((a) => a.id === id);

    if (!activity) {
      return NextResponse.json(
        { ok: false, error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Generate technical content and explanation
    const technical = generateTechnicalContent(activity);
    const explanation = generateExplanation(activity);

    return NextResponse.json({
      ok: true,
      activity,
      technical,
      explanation,
    });
  } catch (error) {
    console.error('Error fetching activity details:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch activity details' },
      { status: 500 }
    );
  }
}
