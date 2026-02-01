'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  ActivityEvent,
  Session,
  RunningAgent,
  QueuedTask,
} from '@/lib/types';

/**
 * Cost tracking state
 */
export interface CostState {
  today: number;
  thisWeek: number;
  thisMonth: number;
  currentSession: number;
  byModel: Record<string, number>;
}

/**
 * Connection state for SSE
 */
export interface ConnectionState {
  isConnected: boolean;
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: string | null;
}

/**
 * Main dashboard store
 */
export interface DashboardState {
  // Activities
  activities: ActivityEvent[];
  maxActivities: number;

  // Sessions
  currentSession: Session | null;
  recentSessions: Session[];

  // Costs
  costs: CostState;

  // Running agents
  runningAgents: RunningAgent[];

  // Task queue
  taskQueue: QueuedTask[];

  // Connection
  connection: ConnectionState;

  // Actions
  addActivity: (activity: ActivityEvent) => void;
  clearActivities: () => void;
  setCurrentSession: (session: Session | null) => void;
  addRecentSession: (session: Session) => void;
  updateCosts: (update: Partial<CostState>) => void;
  addCostToSession: (cost: number) => void;
  addRunningAgent: (agent: RunningAgent) => void;
  updateRunningAgent: (id: string, updates: Partial<RunningAgent>) => void;
  removeRunningAgent: (id: string) => void;
  addTask: (task: QueuedTask) => void;
  updateTask: (id: string, updates: Partial<QueuedTask>) => void;
  removeTask: (id: string) => void;
  setConnection: (state: Partial<ConnectionState>) => void;
  reset: () => void;
}

const initialCosts: CostState = {
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
  currentSession: 0,
  byModel: {},
};

const initialConnection: ConnectionState = {
  isConnected: false,
  lastConnected: null,
  reconnectAttempts: 0,
  error: null,
};

/**
 * Main Zustand store for dashboard state
 *
 * Uses subscribeWithSelector middleware for selective subscriptions
 */
export const useDashboardStore = create<DashboardState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    activities: [],
    maxActivities: 100,
    currentSession: null,
    recentSessions: [],
    costs: initialCosts,
    runningAgents: [],
    taskQueue: [],
    connection: initialConnection,

    // Activity actions
    addActivity: (activity) => {
      set((state) => ({
        activities: [activity, ...state.activities].slice(0, state.maxActivities),
      }));
    },

    clearActivities: () => set({ activities: [] }),

    // Session actions
    setCurrentSession: (session) => set({ currentSession: session }),

    addRecentSession: (session) => {
      set((state) => ({
        recentSessions: [session, ...state.recentSessions].slice(0, 10),
      }));
    },

    // Cost actions
    updateCosts: (update) => {
      set((state) => ({
        costs: { ...state.costs, ...update },
      }));
    },

    addCostToSession: (cost) => {
      set((state) => ({
        costs: {
          ...state.costs,
          currentSession: state.costs.currentSession + cost,
          today: state.costs.today + cost,
          thisWeek: state.costs.thisWeek + cost,
          thisMonth: state.costs.thisMonth + cost,
        },
      }));
    },

    // Agent actions
    addRunningAgent: (agent) => {
      set((state) => ({
        runningAgents: [...state.runningAgents, agent],
      }));
    },

    updateRunningAgent: (id, updates) => {
      set((state) => ({
        runningAgents: state.runningAgents.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      }));
    },

    removeRunningAgent: (id) => {
      set((state) => ({
        runningAgents: state.runningAgents.filter((a) => a.id !== id),
      }));
    },

    // Task actions
    addTask: (task) => {
      set((state) => ({
        taskQueue: [...state.taskQueue, task],
      }));
    },

    updateTask: (id, updates) => {
      set((state) => ({
        taskQueue: state.taskQueue.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }));
    },

    removeTask: (id) => {
      set((state) => ({
        taskQueue: state.taskQueue.filter((t) => t.id !== id),
      }));
    },

    // Connection actions
    setConnection: (state) => {
      set((prev) => ({
        connection: { ...prev.connection, ...state },
      }));
    },

    // Reset all state
    reset: () => {
      set({
        activities: [],
        currentSession: null,
        recentSessions: [],
        costs: initialCosts,
        runningAgents: [],
        taskQueue: [],
        connection: initialConnection,
      });
    },
  }))
);

/**
 * Selectors for common state slices
 */
export const selectActivities = (state: DashboardState) => state.activities;
export const selectCurrentSession = (state: DashboardState) => state.currentSession;
export const selectCosts = (state: DashboardState) => state.costs;
export const selectRunningAgents = (state: DashboardState) => state.runningAgents;
export const selectTaskQueue = (state: DashboardState) => state.taskQueue;
export const selectConnection = (state: DashboardState) => state.connection;
export const selectIsConnected = (state: DashboardState) => state.connection.isConnected;

/**
 * Helper hook to get activity count by type
 */
export function useActivityCounts() {
  return useDashboardStore((state) => {
    const counts: Record<string, number> = {};
    for (const activity of state.activities) {
      counts[activity.type] = (counts[activity.type] || 0) + 1;
    }
    return counts;
  });
}

/**
 * Helper hook to get total tokens from current session
 */
export function useSessionTokens() {
  return useDashboardStore((state) => {
    if (!state.currentSession) return { input: 0, output: 0 };
    return state.currentSession.totalTokens;
  });
}

export default useDashboardStore;
