'use client';

import { type ReactNode, useEffect, useCallback, useRef } from 'react';
import { useDashboardStore } from '@/lib/store';
import type { ActivityEvent, Session } from '@/lib/types';

interface LiveDataProviderProps {
  children: ReactNode;
  /** Polling interval in ms (default: 5000) */
  pollInterval?: number;
  /** Whether to auto-start polling (default: true) */
  autoStart?: boolean;
}

/**
 * Provider that fetches live data from OpenClaw via API endpoints
 * and updates the global Zustand store.
 *
 * This is a polling-based approach that works without WebSocket/SSE.
 */
export function LiveDataProvider({
  children,
  pollInterval = 5000,
  autoStart = true,
}: LiveDataProviderProps) {
  const {
    addActivity,
    setCurrentSession,
    updateCosts,
    setConnection,
    activities,
  } = useDashboardStore();

  const seenActivityIds = useRef(new Set<string>());
  const isInitialized = useRef(false);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/live/activities?limit=50');
      if (!res.ok) throw new Error('Failed to fetch activities');
      
      const data = await res.json();
      if (!data.ok || !data.activities) return;

      // Add only new activities (that we haven't seen)
      for (const activity of data.activities.reverse()) {
        if (!seenActivityIds.current.has(activity.id)) {
          seenActivityIds.current.add(activity.id);
          // Convert timestamp string to Date if needed
          const activityWithDate: ActivityEvent = {
            ...activity,
            timestamp: typeof activity.timestamp === 'string' 
              ? new Date(activity.timestamp) 
              : activity.timestamp,
          };
          addActivity(activityWithDate);
        }
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  }, [addActivity]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/live/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      
      const data = await res.json();
      if (!data.ok) return;

      // Update costs
      updateCosts({
        today: data.today?.cost || 0,
        currentSession: data.current?.estimatedCost || 0,
      });

      // Update current session if we have data
      if (data.current) {
        setCurrentSession({
          id: 'current',
          startTime: new Date(),
          model: data.current.model || 'unknown',
          channel: data.current.channel || 'unknown',
          totalTokens: {
            input: data.current.inputTokens || 0,
            output: data.current.outputTokens || 0,
          },
          estimatedCost: data.current.estimatedCost || 0,
          activities: [],
          subagents: [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [updateCosts, setCurrentSession]);

  const fetchAll = useCallback(async () => {
    try {
      setConnection({ isConnected: true, error: null });
      await Promise.all([fetchActivities(), fetchStats()]);
    } catch (error) {
      setConnection({ 
        isConnected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, [fetchActivities, fetchStats, setConnection]);

  // Initial fetch and polling
  useEffect(() => {
    if (!autoStart) return;

    // Initial fetch
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchAll();
    }

    // Set up polling
    const interval = setInterval(fetchAll, pollInterval);

    return () => clearInterval(interval);
  }, [autoStart, pollInterval, fetchAll]);

  return <>{children}</>;
}
