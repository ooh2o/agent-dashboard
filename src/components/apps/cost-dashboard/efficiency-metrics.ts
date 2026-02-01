/**
 * Token Efficiency Metrics Calculation Logic
 *
 * Provides functions to calculate various efficiency metrics
 * for AI token usage and cost optimization.
 */

import { ActivityEvent, Session } from '@/lib/types';

// Rating thresholds
export const THRESHOLDS = {
  outputInputRatio: { good: 1.5, warning: 0.8 },
  tokensPerAction: { good: 500, warning: 1000 },
  contextUtilization: { good: 50, warning: 80 },
  thinkingRatio: { low: 20, goodLow: 30, goodHigh: 50, high: 70 },
} as const;

export type RatingLevel = 'good' | 'warning' | 'poor';

export interface EfficiencyRating {
  level: RatingLevel;
  label: string;
  icon: '🟢' | '🟡' | '🔴';
  tip?: string;
}

export interface TokensByActionType {
  [toolName: string]: {
    count: number;
    totalTokens: number;
    avgTokens: number;
  };
}

export interface EfficiencyMetrics {
  // Output/Input Ratio: output_tokens / input_tokens
  outputInputRatio: number;
  outputInputRating: EfficiencyRating;

  // Tokens per Action: total_tokens / action_count
  tokensPerAction: number;
  tokensPerActionRating: EfficiencyRating;
  tokensPerActionByType: TokensByActionType;

  // Thinking vs Action Ratio: thinking_tokens / total_tokens (estimated from activity types)
  thinkingRatio: number;
  actionRatio: number;
  thinkingRating: EfficiencyRating;

  // Context Utilization: used_context / max_context
  contextUtilization: number;
  contextUtilizationRating: EfficiencyRating;
  contextWindow: number;
  contextUsed: number;

  // Cost per Task (estimated from activity patterns)
  costPerTask: number;
  costByCategory: {
    queries: number;
    codeChanges: number;
    research: number;
    subagents: number;
  };

  // Trends (vs previous session/period)
  trend: {
    vsLastSession: number;
    vsLastWeek: number;
    direction: 'improving' | 'stable' | 'declining';
  };

  // Smart Tips based on metrics
  tips: string[];
}

export interface EfficiencyData {
  inputTokens: number;
  outputTokens: number;
  activities: ActivityEvent[];
  contextWindow?: number;
  previousSessionMetrics?: Partial<EfficiencyMetrics>;
  weekAgoMetrics?: Partial<EfficiencyMetrics>;
}

// Default context windows by model
const CONTEXT_WINDOWS: Record<string, number> = {
  'claude-opus-4-5': 200000,
  'claude-sonnet-4': 200000,
  'claude-sonnet-4-20250514': 200000,
  'claude-haiku-3-5': 200000,
  'claude-haiku-3-5-20241022': 200000,
  default: 200000,
};

/**
 * Get rating for output/input ratio
 */
function rateOutputInputRatio(ratio: number): EfficiencyRating {
  if (ratio >= THRESHOLDS.outputInputRatio.good) {
    return {
      level: 'good',
      label: 'Efficient',
      icon: '🟢',
    };
  } else if (ratio >= THRESHOLDS.outputInputRatio.warning) {
    return {
      level: 'warning',
      label: 'Moderate',
      icon: '🟡',
      tip: 'Consider reducing prompt verbosity',
    };
  } else {
    return {
      level: 'poor',
      label: 'Low Output',
      icon: '🔴',
      tip: 'Prompts may be too verbose for the output generated',
    };
  }
}

/**
 * Get rating for tokens per action
 */
function rateTokensPerAction(avgTokens: number): EfficiencyRating {
  if (avgTokens <= THRESHOLDS.tokensPerAction.good) {
    return {
      level: 'good',
      label: 'Efficient',
      icon: '🟢',
    };
  } else if (avgTokens <= THRESHOLDS.tokensPerAction.warning) {
    return {
      level: 'warning',
      label: 'Moderate',
      icon: '🟡',
      tip: 'Consider batching operations',
    };
  } else {
    return {
      level: 'poor',
      label: 'High Token Use',
      icon: '🔴',
      tip: 'Actions are consuming many tokens - consider smaller, focused requests',
    };
  }
}

/**
 * Get rating for thinking ratio
 */
function rateThinkingRatio(ratio: number): EfficiencyRating {
  const percent = ratio * 100;
  if (percent >= THRESHOLDS.thinkingRatio.goodLow && percent <= THRESHOLDS.thinkingRatio.goodHigh) {
    return {
      level: 'good',
      label: 'Balanced',
      icon: '🟢',
    };
  } else if (percent < THRESHOLDS.thinkingRatio.low) {
    return {
      level: 'warning',
      label: 'Action Heavy',
      icon: '🟡',
      tip: 'Low thinking may indicate rushed decisions',
    };
  } else if (percent > THRESHOLDS.thinkingRatio.high) {
    return {
      level: 'warning',
      label: 'Thinking Heavy',
      icon: '🟡',
      tip: 'High thinking ratio - consider breaking task into smaller steps',
    };
  } else {
    return {
      level: 'warning',
      label: 'Unbalanced',
      icon: '🟡',
    };
  }
}

/**
 * Get rating for context utilization
 */
function rateContextUtilization(utilization: number): EfficiencyRating {
  const percent = utilization * 100;
  if (percent <= THRESHOLDS.contextUtilization.good) {
    return {
      level: 'good',
      label: 'Optimal',
      icon: '🟢',
      tip: 'Could potentially use a smaller/cheaper model',
    };
  } else if (percent <= THRESHOLDS.contextUtilization.warning) {
    return {
      level: 'warning',
      label: 'Moderate',
      icon: '🟡',
    };
  } else {
    return {
      level: 'poor',
      label: 'High Usage',
      icon: '🔴',
      tip: 'Risk of truncation - consider summarizing context',
    };
  }
}

/**
 * Calculate tokens per action by type
 */
function calculateTokensByActionType(
  activities: ActivityEvent[],
  totalTokens: number
): TokensByActionType {
  const result: TokensByActionType = {};
  const toolActivities = activities.filter((a) => a.tool);

  if (toolActivities.length === 0) {
    return result;
  }

  // Group by tool name
  const grouped = toolActivities.reduce(
    (acc, activity) => {
      const tool = activity.tool || 'unknown';
      if (!acc[tool]) {
        acc[tool] = [];
      }
      acc[tool].push(activity);
      return acc;
    },
    {} as Record<string, ActivityEvent[]>
  );

  // Estimate tokens per tool type (proportional distribution)
  const totalActivities = toolActivities.length;
  const avgTokensPerActivity = totalTokens / Math.max(totalActivities, 1);

  for (const [tool, acts] of Object.entries(grouped)) {
    // Weight different tools by estimated complexity
    const weight = getToolWeight(tool);
    const estimatedTokens = acts.length * avgTokensPerActivity * weight;

    result[tool] = {
      count: acts.length,
      totalTokens: Math.round(estimatedTokens),
      avgTokens: Math.round(estimatedTokens / acts.length),
    };
  }

  return result;
}

/**
 * Get estimated weight for a tool (how many tokens it typically uses)
 */
function getToolWeight(tool: string): number {
  const weights: Record<string, number> = {
    Read: 0.5,
    read: 0.5,
    Write: 2.5,
    write: 2.5,
    Edit: 2.0,
    edit: 2.0,
    Bash: 1.0,
    bash: 1.0,
    exec: 1.0,
    web_search: 0.8,
    WebSearch: 0.8,
    web_fetch: 1.5,
    WebFetch: 1.5,
    Task: 3.0,
    sessions_spawn: 3.0,
    Grep: 0.4,
    grep: 0.4,
    Glob: 0.3,
    glob: 0.3,
  };
  return weights[tool] || 1.0;
}

/**
 * Estimate thinking ratio from activity patterns
 */
function estimateThinkingRatio(activities: ActivityEvent[]): number {
  if (activities.length === 0) return 0.4; // Default balanced

  const thinkingCount = activities.filter((a) => a.type === 'thinking').length;
  const actionCount = activities.filter(
    (a) => a.type !== 'thinking' && a.type !== 'message_send'
  ).length;

  const total = thinkingCount + actionCount;
  if (total === 0) return 0.4;

  return thinkingCount / total;
}

/**
 * Estimate cost per task category
 */
function estimateCostByCategory(
  activities: ActivityEvent[],
  totalCost: number
): { queries: number; codeChanges: number; research: number; subagents: number } {
  const counts = {
    queries: 0,
    codeChanges: 0,
    research: 0,
    subagents: 0,
  };

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

  // Weighted cost distribution
  const weights = {
    queries: 0.15,
    codeChanges: 0.35,
    research: 0.25,
    subagents: 0.45,
  };

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

/**
 * Calculate trend direction
 */
function calculateTrend(
  currentRatio: number,
  previousRatio?: number,
  weekAgoRatio?: number
): { vsLastSession: number; vsLastWeek: number; direction: 'improving' | 'stable' | 'declining' } {
  const vsLastSession = previousRatio
    ? ((currentRatio - previousRatio) / Math.max(previousRatio, 0.01)) * 100
    : 0;

  const vsLastWeek = weekAgoRatio
    ? ((currentRatio - weekAgoRatio) / Math.max(weekAgoRatio, 0.01)) * 100
    : 0;

  let direction: 'improving' | 'stable' | 'declining' = 'stable';
  if (vsLastSession > 5 || vsLastWeek > 5) {
    direction = 'improving';
  } else if (vsLastSession < -5 || vsLastWeek < -5) {
    direction = 'declining';
  }

  return { vsLastSession, vsLastWeek, direction };
}

/**
 * Generate smart tips based on metrics
 */
function generateTips(metrics: Partial<EfficiencyMetrics>): string[] {
  const tips: string[] = [];

  if (metrics.thinkingRating?.tip) {
    tips.push(metrics.thinkingRating.tip);
  }

  if (metrics.outputInputRating?.tip) {
    tips.push(metrics.outputInputRating.tip);
  }

  if (metrics.contextUtilizationRating?.tip) {
    tips.push(metrics.contextUtilizationRating.tip);
  }

  if (metrics.tokensPerActionRating?.tip) {
    tips.push(metrics.tokensPerActionRating.tip);
  }

  return tips.slice(0, 3); // Max 3 tips
}

/**
 * Calculate all efficiency metrics
 */
export function calculateEfficiency(data: EfficiencyData): EfficiencyMetrics {
  const { inputTokens, outputTokens, activities, contextWindow: customContextWindow } = data;

  // Output/Input Ratio
  const outputInputRatio = inputTokens > 0 ? outputTokens / inputTokens : 0;
  const outputInputRating = rateOutputInputRatio(outputInputRatio);

  // Tokens per Action
  const totalTokens = inputTokens + outputTokens;
  const actionCount = activities.filter((a) => a.tool).length;
  const tokensPerAction = actionCount > 0 ? totalTokens / actionCount : 0;
  const tokensPerActionRating = rateTokensPerAction(tokensPerAction);
  const tokensPerActionByType = calculateTokensByActionType(activities, totalTokens);

  // Thinking vs Action Ratio
  const thinkingRatio = estimateThinkingRatio(activities);
  const actionRatio = 1 - thinkingRatio;
  const thinkingRating = rateThinkingRatio(thinkingRatio);

  // Context Utilization
  const contextWindow = customContextWindow || CONTEXT_WINDOWS.default;
  const contextUsed = totalTokens;
  const contextUtilization = contextUsed / contextWindow;
  const contextUtilizationRating = rateContextUtilization(contextUtilization);

  // Cost calculations (assuming cost is proportional to tokens)
  const estimatedCost = totalTokens * 0.00001; // Rough estimate
  const completedTasks = Math.max(activities.filter((a) => a.result === 'success').length, 1);
  const costPerTask = estimatedCost / completedTasks;
  const costByCategory = estimateCostByCategory(activities, estimatedCost);

  // Trends
  const trend = calculateTrend(
    outputInputRatio,
    data.previousSessionMetrics?.outputInputRatio,
    data.weekAgoMetrics?.outputInputRatio
  );

  // Build metrics object
  const metrics: Partial<EfficiencyMetrics> = {
    outputInputRatio,
    outputInputRating,
    tokensPerAction,
    tokensPerActionRating,
    tokensPerActionByType,
    thinkingRatio,
    actionRatio,
    thinkingRating,
    contextUtilization,
    contextUtilizationRating,
    contextWindow,
    contextUsed,
    costPerTask,
    costByCategory,
    trend,
  };

  // Generate tips last
  const tips = generateTips(metrics);

  return {
    ...metrics,
    tips,
  } as EfficiencyMetrics;
}

/**
 * Calculate efficiency from session data
 */
export function calculateSessionEfficiency(session: Session): EfficiencyMetrics {
  return calculateEfficiency({
    inputTokens: session.totalTokens.input,
    outputTokens: session.totalTokens.output,
    activities: session.activities,
  });
}

/**
 * Format ratio as percentage string
 */
export function formatRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(0)}%`;
}

/**
 * Format ratio as multiplier string
 */
export function formatMultiplier(ratio: number): string {
  return `${ratio.toFixed(1)}x`;
}

/**
 * Format trend as percentage change string
 */
export function formatTrend(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(0)}%`;
}

/**
 * Get trend arrow
 */
export function getTrendArrow(change: number): string {
  if (change > 2) return '↑';
  if (change < -2) return '↓';
  return '→';
}
