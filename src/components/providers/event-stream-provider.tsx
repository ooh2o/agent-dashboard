'use client';

import { type ReactNode, useEffect, useCallback } from 'react';
import { useEventStream, type CostUpdate, type AgentEvent } from '@/hooks/use-event-stream';
import { useDashboardStore } from '@/lib/store';
import type { ActivityEvent, Session, RunningAgent } from '@/lib/types';

interface EventStreamProviderProps {
  children: ReactNode;
  /** Whether to auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

/**
 * Provider that connects to the SSE event stream and updates
 * the global Zustand store with real-time events.
 *
 * Wrap your app with this provider to enable real-time updates.
 */
export function EventStreamProvider({
  children,
  autoConnect = true,
}: EventStreamProviderProps) {
  const {
    addActivity,
    setCurrentSession,
    addRecentSession,
    updateCosts,
    addCostToSession,
    addRunningAgent,
    updateRunningAgent,
    removeRunningAgent,
    setConnection,
  } = useDashboardStore();

  // Handle activity events
  const handleActivity = useCallback(
    (activity: ActivityEvent) => {
      addActivity(activity);

      // Update cost if tokens are included
      if (activity.tokens) {
        const cost = calculateCost(activity.tokens);
        addCostToSession(cost);
      }
    },
    [addActivity, addCostToSession]
  );

  // Handle session start
  const handleSessionStart = useCallback(
    (session: Partial<Session>) => {
      setCurrentSession({
        id: session.id || crypto.randomUUID(),
        startTime: session.startTime || new Date(),
        model: session.model || 'unknown',
        channel: session.channel || 'unknown',
        totalTokens: session.totalTokens || { input: 0, output: 0 },
        estimatedCost: session.estimatedCost || 0,
        activities: session.activities || [],
        subagents: session.subagents || [],
      });
    },
    [setCurrentSession]
  );

  // Handle session end
  const handleSessionEnd = useCallback(
    (sessionId: string) => {
      const current = useDashboardStore.getState().currentSession;
      if (current && current.id === sessionId) {
        addRecentSession(current);
        setCurrentSession(null);
      }
    },
    [addRecentSession, setCurrentSession]
  );

  // Handle cost updates
  const handleCostUpdate = useCallback(
    (cost: CostUpdate) => {
      updateCosts({
        currentSession: cost.totalCost,
        byModel: {
          ...useDashboardStore.getState().costs.byModel,
          [cost.model]:
            (useDashboardStore.getState().costs.byModel[cost.model] || 0) +
            cost.totalCost,
        },
      });
    },
    [updateCosts]
  );

  // Handle agent events
  const handleAgentEvent = useCallback(
    (agent: AgentEvent) => {
      if (agent.status === 'started') {
        addRunningAgent({
          id: agent.id,
          name: `Agent ${agent.id.slice(0, 8)}`,
          task: agent.task,
          template: {
            id: 'custom',
            name: 'Custom',
            description: 'Custom agent',
            icon: 'Bot',
          },
          status: 'running',
          startedAt: new Date(),
        });
      } else if (agent.status === 'running') {
        updateRunningAgent(agent.id, { status: 'running' });
      } else if (agent.status === 'completed') {
        updateRunningAgent(agent.id, { status: 'completed' });
        // Remove after a short delay so user can see completion
        setTimeout(() => {
          removeRunningAgent(agent.id);
        }, 5000);
      } else if (agent.status === 'failed') {
        updateRunningAgent(agent.id, { status: 'failed' });
      }
    },
    [addRunningAgent, updateRunningAgent, removeRunningAgent]
  );

  // Handle errors
  const handleError = useCallback((error: string) => {
    console.error('SSE Error:', error);
  }, []);

  // Handle connection state
  const handleConnect = useCallback(() => {
    setConnection({
      isConnected: true,
      lastConnected: new Date(),
      error: null,
    });
  }, [setConnection]);

  const handleDisconnect = useCallback(() => {
    setConnection({
      isConnected: false,
    });
  }, [setConnection]);

  // Connect to event stream
  const { isConnected, connectionError } = useEventStream({
    autoConnect,
    onActivity: handleActivity,
    onSessionStart: handleSessionStart,
    onSessionEnd: handleSessionEnd,
    onCostUpdate: handleCostUpdate,
    onAgentEvent: handleAgentEvent,
    onError: handleError,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
  });

  // Sync connection state to store
  useEffect(() => {
    setConnection({
      isConnected,
      error: connectionError,
    });
  }, [isConnected, connectionError, setConnection]);

  return <>{children}</>;
}

/**
 * Calculate cost from token usage
 * Rough estimates based on Claude pricing
 */
function calculateCost(tokens: { input: number; output: number }): number {
  const inputCostPer1k = 0.003; // $3 per million input
  const outputCostPer1k = 0.015; // $15 per million output

  const inputCost = (tokens.input / 1000) * inputCostPer1k;
  const outputCost = (tokens.output / 1000) * outputCostPer1k;

  return inputCost + outputCost;
}
