/**
 * API Route: /api/live/stats/efficiency
 * Returns token efficiency metrics for sessions
 */

import { NextResponse } from 'next/server';
import { getSessions, getSessionActivities } from '@/lib/openclaw-data';
import { ActivityEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface EfficiencyData {
  // Core metrics
  outputInputRatio: number;
  tokensPerAction: number;
  thinkingRatio: number;
  contextUtilization: number;

  // Ratings
  ratings: {
    outputInput: 'good' | 'warning' | 'poor';
    tokensPerAction: 'good' | 'warning' | 'poor';
    thinking: 'good' | 'warning' | 'poor';
    context: 'good' | 'warning' | 'poor';
  };

  // Breakdown
  tokensPerActionByType: Record<string, { count: number; avgTokens: number }>;
  costByCategory: {
    queries: number;
    codeChanges: number;
    research: number;
    subagents: number;
  };

  // Trend data
  trend: {
    vsLastSession: number;
    direction: 'improving' | 'stable' | 'declining';
  };
  trendHistory: Array<{
    date: string;
    label: string;
    outputInputRatio: number;
    tokensPerAction: number;
    thinkingRatio: number;
    contextUtilization: number;
  }>;

  // Tips
  tips: string[];

  // Raw data
  totalInputTokens: number;
  totalOutputTokens: number;
  totalActions: number;
  contextWindow: number;
  contextUsed: number;
}

// Rating thresholds
const THRESHOLDS = {
  outputInputRatio: { good: 1.5, warning: 0.8 },
  tokensPerAction: { good: 500, warning: 1000 },
  contextUtilization: { good: 50, warning: 80 },
  thinkingRatio: { low: 20, goodLow: 30, goodHigh: 50, high: 70 },
};

function rateOutputInputRatio(ratio: number): 'good' | 'warning' | 'poor' {
  if (ratio >= THRESHOLDS.outputInputRatio.good) return 'good';
  if (ratio >= THRESHOLDS.outputInputRatio.warning) return 'warning';
  return 'poor';
}

function rateTokensPerAction(avg: number): 'good' | 'warning' | 'poor' {
  if (avg <= THRESHOLDS.tokensPerAction.good) return 'good';
  if (avg <= THRESHOLDS.tokensPerAction.warning) return 'warning';
  return 'poor';
}

function rateThinkingRatio(ratio: number): 'good' | 'warning' | 'poor' {
  const percent = ratio * 100;
  if (percent >= THRESHOLDS.thinkingRatio.goodLow && percent <= THRESHOLDS.thinkingRatio.goodHigh) {
    return 'good';
  }
  return 'warning';
}

function rateContextUtilization(ratio: number): 'good' | 'warning' | 'poor' {
  const percent = ratio * 100;
  if (percent <= THRESHOLDS.contextUtilization.good) return 'good';
  if (percent <= THRESHOLDS.contextUtilization.warning) return 'warning';
  return 'poor';
}

function calculateTokensByType(
  activities: ActivityEvent[],
  totalTokens: number
): Record<string, { count: number; avgTokens: number }> {
  const result: Record<string, { count: number; avgTokens: number }> = {};
  const toolActivities = activities.filter((a) => a.tool);

  if (toolActivities.length === 0) return result;

  const grouped = toolActivities.reduce(
    (acc, activity) => {
      const tool = activity.tool || 'unknown';
      if (!acc[tool]) acc[tool] = [];
      acc[tool].push(activity);
      return acc;
    },
    {} as Record<string, ActivityEvent[]>
  );

  const avgTokensPerActivity = totalTokens / Math.max(toolActivities.length, 1);

  for (const [tool, acts] of Object.entries(grouped)) {
    result[tool] = {
      count: acts.length,
      avgTokens: Math.round(avgTokensPerActivity),
    };
  }

  return result;
}

function estimateCostByCategory(
  activities: ActivityEvent[],
  totalCost: number
): { queries: number; codeChanges: number; research: number; subagents: number } {
  const counts = { queries: 0, codeChanges: 0, research: 0, subagents: 0 };

  for (const activity of activities) {
    const tool = activity.tool?.toLowerCase() || '';

    if (tool.includes('write') || tool.includes('edit')) {
      counts.codeChanges++;
    } else if (tool.includes('search') || tool.includes('fetch') || tool.includes('read')) {
      counts.research++;
    } else if (tool.includes('spawn') || tool.includes('task') || activity.type === 'subagent_spawn') {
      counts.subagents++;
    } else {
      counts.queries++;
    }
  }

  const total = counts.queries + counts.codeChanges + counts.research + counts.subagents;
  if (total === 0) {
    return { queries: 0, codeChanges: 0, research: 0, subagents: 0 };
  }

  const weights = { queries: 0.15, codeChanges: 0.35, research: 0.25, subagents: 0.45 };
  const weightedTotal =
    counts.queries * weights.queries +
    counts.codeChanges * weights.codeChanges +
    counts.research * weights.research +
    counts.subagents * weights.subagents;

  return {
    queries: (counts.queries * weights.queries / Math.max(weightedTotal, 1)) * totalCost,
    codeChanges: (counts.codeChanges * weights.codeChanges / Math.max(weightedTotal, 1)) * totalCost,
    research: (counts.research * weights.research / Math.max(weightedTotal, 1)) * totalCost,
    subagents: (counts.subagents * weights.subagents / Math.max(weightedTotal, 1)) * totalCost,
  };
}

function generateTips(
  outputInputRating: string,
  tokensPerActionRating: string,
  thinkingRating: string,
  contextRating: string,
  thinkingRatio: number
): string[] {
  const tips: string[] = [];

  if (thinkingRatio > 0.7) {
    tips.push('High thinking ratio — consider breaking task into smaller steps');
  } else if (thinkingRatio < 0.2) {
    tips.push('Low thinking may indicate rushed decisions');
  }

  if (outputInputRating === 'poor') {
    tips.push('Prompts may be too verbose for the output generated');
  }

  if (contextRating === 'poor') {
    tips.push('Risk of truncation — consider summarizing context');
  } else if (contextRating === 'good') {
    tips.push('Could potentially use a smaller/cheaper model');
  }

  if (tokensPerActionRating === 'poor') {
    tips.push('Actions consuming many tokens — consider smaller, focused requests');
  }

  return tips.slice(0, 3);
}

export async function GET() {
  try {
    const sessions = await getSessions();

    if (sessions.length === 0) {
      return NextResponse.json({
        ok: true,
        efficiency: null,
        message: 'No sessions available',
        timestamp: new Date().toISOString(),
      });
    }

    // Sort sessions by start time (most recent first)
    const sortedSessions = sessions.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    // Get the most recent session for current metrics
    const currentSession = sortedSessions[0];

    // Get activities for the current session
    const activities = await getSessionActivities(currentSession.id, 100);

    // Calculate metrics
    const inputTokens = currentSession.totalTokens.input;
    const outputTokens = currentSession.totalTokens.output;
    const totalTokens = inputTokens + outputTokens;
    const contextWindow = 200000; // Default for Claude models

    const outputInputRatio = inputTokens > 0 ? outputTokens / inputTokens : 0;
    const actionCount = activities.filter((a) => a.tool).length;
    const tokensPerAction = actionCount > 0 ? totalTokens / actionCount : 0;

    const thinkingCount = activities.filter((a) => a.type === 'thinking').length;
    const nonThinkingCount = activities.filter(
      (a) => a.type !== 'thinking' && a.type !== 'message_send'
    ).length;
    const thinkingRatio =
      thinkingCount + nonThinkingCount > 0
        ? thinkingCount / (thinkingCount + nonThinkingCount)
        : 0.4;

    const contextUtilization = totalTokens / contextWindow;

    // Ratings
    const outputInputRating = rateOutputInputRatio(outputInputRatio);
    const tokensPerActionRating = rateTokensPerAction(tokensPerAction);
    const thinkingRatingValue = rateThinkingRatio(thinkingRatio);
    const contextRating = rateContextUtilization(contextUtilization);

    // Breakdown
    const tokensPerActionByType = calculateTokensByType(activities, totalTokens);
    const costByCategory = estimateCostByCategory(activities, currentSession.estimatedCost);

    // Calculate trend from previous session
    let trendVsLastSession = 0;
    let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';

    if (sortedSessions.length >= 2) {
      const prevSession = sortedSessions[1];
      const prevRatio =
        prevSession.totalTokens.input > 0
          ? prevSession.totalTokens.output / prevSession.totalTokens.input
          : 0;

      if (prevRatio > 0) {
        trendVsLastSession = ((outputInputRatio - prevRatio) / prevRatio) * 100;
        if (trendVsLastSession > 5) trendDirection = 'improving';
        else if (trendVsLastSession < -5) trendDirection = 'declining';
      }
    }

    // Generate trend history (last 7 sessions)
    const trendHistory = await Promise.all(
      sortedSessions.slice(0, 7).map(async (session, index) => {
        const sessionActivities = await getSessionActivities(session.id, 50);
        const sessionInputTokens = session.totalTokens.input;
        const sessionOutputTokens = session.totalTokens.output;
        const sessionTotalTokens = sessionInputTokens + sessionOutputTokens;
        const sessionActionCount = sessionActivities.filter((a) => a.tool).length;

        const thinkingCount = sessionActivities.filter((a) => a.type === 'thinking').length;
        const nonThinkingCount = sessionActivities.filter(
          (a) => a.type !== 'thinking' && a.type !== 'message_send'
        ).length;

        const date = new Date(session.startTime);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        let label = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (index === 0) label = 'Current';
        else if (diffDays === 0) label = 'Today';
        else if (diffDays === 1) label = 'Yesterday';

        return {
          date: session.startTime.toString(),
          label,
          outputInputRatio: sessionInputTokens > 0 ? sessionOutputTokens / sessionInputTokens : 0,
          tokensPerAction: sessionActionCount > 0 ? sessionTotalTokens / sessionActionCount : 0,
          thinkingRatio:
            thinkingCount + nonThinkingCount > 0
              ? thinkingCount / (thinkingCount + nonThinkingCount)
              : 0.4,
          contextUtilization: sessionTotalTokens / contextWindow,
        };
      })
    );

    // Generate tips
    const tips = generateTips(
      outputInputRating,
      tokensPerActionRating,
      thinkingRatingValue,
      contextRating,
      thinkingRatio
    );

    const efficiency: EfficiencyData = {
      outputInputRatio,
      tokensPerAction,
      thinkingRatio,
      contextUtilization,
      ratings: {
        outputInput: outputInputRating,
        tokensPerAction: tokensPerActionRating,
        thinking: thinkingRatingValue,
        context: contextRating,
      },
      tokensPerActionByType,
      costByCategory,
      trend: {
        vsLastSession: trendVsLastSession,
        direction: trendDirection,
      },
      trendHistory: trendHistory.reverse(), // Oldest first for chart
      tips,
      totalInputTokens: inputTokens,
      totalOutputTokens: outputTokens,
      totalActions: actionCount,
      contextWindow,
      contextUsed: totalTokens,
    };

    return NextResponse.json({
      ok: true,
      efficiency,
      sessionId: currentSession.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating efficiency:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to calculate efficiency metrics' },
      { status: 500 }
    );
  }
}
