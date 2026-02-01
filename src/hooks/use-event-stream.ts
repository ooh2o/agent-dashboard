'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ActivityEvent, Session } from '@/lib/types';

/**
 * SSE Event Types from OpenClaw Gateway
 */
export type SSEEventType =
  | 'connected'
  | 'activity'
  | 'session_start'
  | 'session_end'
  | 'cost_update'
  | 'message'
  | 'agent_spawn'
  | 'agent_complete'
  | 'error'
  | 'keepalive';

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: string;
}

export interface CostUpdate {
  sessionId: string;
  totalCost: number;
  tokens: { input: number; output: number };
  model: string;
}

export interface MessageEvent {
  id: string;
  channel: string;
  sender: string;
  content: string;
  timestamp: string;
}

export interface AgentEvent {
  id: string;
  task: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  output?: string;
}

/**
 * Options for the useEventStream hook
 */
export interface EventStreamOptions {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Initial reconnect delay in ms (default: 1000) */
  reconnectDelay?: number;
  /** Max reconnect delay in ms for exponential backoff (default: 30000) */
  maxReconnectDelay?: number;
  /** Max reconnect attempts (default: 10) */
  maxReconnectAttempts?: number;

  // Event callbacks
  onActivity?: (activity: ActivityEvent) => void;
  onSessionStart?: (session: Partial<Session>) => void;
  onSessionEnd?: (sessionId: string) => void;
  onCostUpdate?: (cost: CostUpdate) => void;
  onMessage?: (message: MessageEvent) => void;
  onAgentEvent?: (agent: AgentEvent) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnecting?: (attempt: number, maxAttempts: number) => void;
}

/**
 * Calculate exponential backoff delay
 * Uses formula: min(maxDelay, baseDelay * 2^attempt) with jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  // Add jitter (±10%) to prevent thundering herd
  const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);
  return Math.round(cappedDelay + jitter);
}

/**
 * Hook to connect to the OpenClaw gateway SSE stream
 *
 * Provides real-time updates for:
 * - Agent activities (tool calls, thinking, etc.)
 * - Session lifecycle events
 * - Cost updates
 * - Messages from channels
 * - Spawned agent events
 *
 * Features exponential backoff for reconnection with configurable
 * base delay and maximum delay.
 */
export function useEventStream(options: EventStreamOptions = {}) {
  const {
    autoConnect = true,
    reconnectDelay = 1000,
    maxReconnectDelay = 30000,
    maxReconnectAttempts = 10,
  } = options;

  const optionsRef = useRef(options);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Create new EventSource connection through our API proxy
    const eventSource = new EventSource('/api/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
      setReconnectAttempt(0);
      optionsRef.current.onConnect?.();
    };

    eventSource.onmessage = (event) => {
      try {
        // Handle keepalive pings (comment lines)
        if (event.data.startsWith(':') || !event.data.trim()) {
          return;
        }

        const data = JSON.parse(event.data) as SSEEvent;

        // Route event to appropriate callback
        switch (data.type) {
          case 'connected':
            setIsConnected(true);
            break;

          case 'activity':
            optionsRef.current.onActivity?.(data.data as ActivityEvent);
            break;

          case 'session_start':
            optionsRef.current.onSessionStart?.(data.data as Partial<Session>);
            break;

          case 'session_end':
            optionsRef.current.onSessionEnd?.(
              (data.data as { sessionId: string }).sessionId
            );
            break;

          case 'cost_update':
            optionsRef.current.onCostUpdate?.(data.data as CostUpdate);
            break;

          case 'message':
            optionsRef.current.onMessage?.(data.data as MessageEvent);
            break;

          case 'agent_spawn':
          case 'agent_complete':
            optionsRef.current.onAgentEvent?.(data.data as AgentEvent);
            break;

          case 'error':
            optionsRef.current.onError?.(
              (data.data as { message: string }).message
            );
            break;

          case 'keepalive':
            // Ignore keepalive events
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      optionsRef.current.onDisconnect?.();

      // Only reconnect if this is still the active event source
      if (eventSourceRef.current === eventSource) {
        reconnectAttemptsRef.current += 1;
        const currentAttempt = reconnectAttemptsRef.current;
        setReconnectAttempt(currentAttempt);

        if (currentAttempt <= maxReconnectAttempts) {
          // Calculate exponential backoff delay
          const delay = calculateBackoffDelay(
            currentAttempt - 1,
            reconnectDelay,
            maxReconnectDelay
          );

          setConnectionError(
            `Connection lost. Reconnecting in ${Math.round(delay / 1000)}s (${currentAttempt}/${maxReconnectAttempts})...`
          );

          // Notify about reconnection attempt
          optionsRef.current.onReconnecting?.(currentAttempt, maxReconnectAttempts);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setConnectionError(
            'Connection failed. Max reconnect attempts reached.'
          );
        }
      }
    };
  }, [reconnectDelay, maxReconnectDelay, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    connectionError,
    reconnectAttempt,
    connect,
    disconnect,
    /** Manually reset reconnect attempts counter */
    resetReconnectAttempts: useCallback(() => {
      reconnectAttemptsRef.current = 0;
      setReconnectAttempt(0);
    }, []),
  };
}

export default useEventStream;
