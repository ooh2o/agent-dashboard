/**
 * API Route: /api/live/notifications
 * Generates notifications from OpenClaw session activities
 */

import { NextResponse } from 'next/server';
import { getRecentActivities } from '@/lib/openclaw-data';
import type { Notification, NotificationType, NotificationPriority } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getNotificationType(activityType: string, result?: string): NotificationType {
  if (result === 'error') return 'error';

  switch (activityType) {
    case 'error':
      return 'error';
    case 'subagent_spawn':
      return 'task';
    case 'message_send':
      return 'message';
    case 'thinking':
      return 'info';
    default:
      return 'success';
  }
}

function getPriority(activityType: string, result?: string): NotificationPriority {
  if (result === 'error') return 'high';
  if (activityType === 'subagent_spawn') return 'medium';
  return 'low';
}

function getSource(tool?: string, activityType?: string): string {
  if (tool) {
    // Group by tool category
    const fileTools = ['Read', 'Write', 'Edit', 'Glob', 'Grep'];
    const webTools = ['WebSearch', 'WebFetch', 'web_search', 'web_fetch'];
    const systemTools = ['Bash', 'exec', 'Task', 'TodoWrite'];

    if (fileTools.includes(tool)) return 'File Operations';
    if (webTools.includes(tool)) return 'Web Operations';
    if (systemTools.includes(tool)) return 'System Operations';
    return 'Agent Activity';
  }

  if (activityType === 'thinking') return 'AI Thinking';
  if (activityType === 'message_send') return 'Messages';
  if (activityType === 'subagent_spawn') return 'Sub-agents';

  return 'Agent Activity';
}

export async function GET() {
  try {
    // Get recent activities
    const activities = await getRecentActivities(50);

    // Convert activities to notifications
    const notifications: Notification[] = activities
      .filter(activity => {
        // Include errors, subagent spawns, messages, and significant events
        return (
          activity.result === 'error' ||
          activity.type === 'subagent_spawn' ||
          activity.type === 'message_send' ||
          activity.type === 'error' ||
          (activity.tool && ['Write', 'Edit', 'Bash', 'Task'].includes(activity.tool))
        );
      })
      .map((activity, index) => {
        const timestamp = typeof activity.timestamp === 'string'
          ? new Date(activity.timestamp)
          : activity.timestamp;

        const type = getNotificationType(activity.type, activity.result);
        const priority = getPriority(activity.type, activity.result);
        const source = getSource(activity.tool, activity.type);

        // Generate title based on activity
        let title = 'Activity';
        if (activity.result === 'error') {
          title = 'Error occurred';
        } else if (activity.type === 'subagent_spawn') {
          title = 'Sub-agent spawned';
        } else if (activity.type === 'message_send') {
          title = 'Message sent';
        } else if (activity.tool === 'Write') {
          title = 'File written';
        } else if (activity.tool === 'Edit') {
          title = 'File edited';
        } else if (activity.tool === 'Bash') {
          title = 'Command executed';
        } else if (activity.tool === 'Task') {
          title = 'Task completed';
        }

        return {
          id: activity.id || `notif-${index}`,
          type,
          priority,
          title,
          message: activity.explanation || 'Activity completed',
          timestamp,
          source,
          read: false,
          actionLabel: activity.result === 'error' ? 'View Details' : undefined,
        };
      });

    // If no notifications, return some defaults
    if (notifications.length === 0) {
      return NextResponse.json({
        ok: true,
        notifications: [
          {
            id: 'notif-welcome',
            type: 'info',
            priority: 'low',
            title: 'Welcome to OpenClaw',
            message: 'Notifications from agent activity will appear here',
            timestamp: new Date(),
            source: 'System',
            read: false,
          }
        ],
      });
    }

    return NextResponse.json({
      ok: true,
      notifications,
      count: notifications.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating notifications:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
