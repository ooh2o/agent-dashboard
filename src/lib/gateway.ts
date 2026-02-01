/**
 * OpenClaw Gateway API Client
 *
 * Provides typed access to all gateway endpoints:
 * - Sessions and activities
 * - Messages (send/receive across channels)
 * - Cron/scheduled jobs
 * - Memory operations
 * - Agent spawning
 * - Cost tracking
 */

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3030';

// Types for Gateway API responses
export interface GatewaySession {
  id: string;
  startTime: string;
  model: string;
  channel: string;
  status: 'active' | 'completed' | 'failed';
  totalTokens: { input: number; output: number };
  estimatedCost: number;
}

export interface GatewayActivity {
  id: string;
  sessionId: string;
  timestamp: string;
  type: string;
  tool?: string;
  params?: Record<string, unknown>;
  result?: 'success' | 'error';
  durationMs?: number;
  tokens?: { input: number; output: number };
  explanation: string;
}

export interface GatewayMessage {
  id: string;
  channel: string;
  threadId?: string;
  sender: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface GatewayCronJob {
  id: string;
  name: string;
  schedule: string;
  command: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'idle' | 'running' | 'failed';
}

export interface GatewayMemoryEntry {
  file: string;
  content: string;
  lastModified: string;
}

export interface GatewayCostSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  byModel: Record<string, number>;
  byChannel: Record<string, number>;
  recentSessions: Array<{
    id: string;
    cost: number;
    model: string;
    timestamp: string;
  }>;
}

export interface SpawnAgentRequest {
  task: string;
  model?: string;
  template?: string;
  maxTurns?: number;
}

export interface SpawnAgentResponse {
  id: string;
  status: 'started';
  task: string;
}

// API Error type
export class GatewayError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

// Helper to make requests through our proxy
async function gatewayFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `/api/gateway${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new GatewayError(
      error.message || `Gateway request failed: ${response.statusText}`,
      response.status,
      error.code
    );
  }

  return response.json();
}

// Gateway API Client
export const gateway = {
  // Base URL for direct access (used by SSE)
  baseUrl: GATEWAY_URL,

  // Sessions
  sessions: {
    list: (params?: { limit?: number; offset?: number; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      if (params?.status) searchParams.set('status', params.status);
      const query = searchParams.toString();
      return gatewayFetch<{ sessions: GatewaySession[]; total: number }>(
        `/sessions${query ? `?${query}` : ''}`
      );
    },

    get: (id: string) =>
      gatewayFetch<GatewaySession>(`/sessions/${id}`),

    getActivities: (sessionId: string, params?: { limit?: number }) => {
      const query = params?.limit ? `?limit=${params.limit}` : '';
      return gatewayFetch<{ activities: GatewayActivity[] }>(
        `/sessions/${sessionId}/activities${query}`
      );
    },
  },

  // Activities (global)
  activities: {
    list: (params?: { limit?: number; type?: string; since?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.type) searchParams.set('type', params.type);
      if (params?.since) searchParams.set('since', params.since);
      const query = searchParams.toString();
      return gatewayFetch<{ activities: GatewayActivity[] }>(
        `/activities${query ? `?${query}` : ''}`
      );
    },
  },

  // Messages
  messages: {
    list: (params?: { channel?: string; limit?: number; threadId?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.channel) searchParams.set('channel', params.channel);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.threadId) searchParams.set('threadId', params.threadId);
      const query = searchParams.toString();
      return gatewayFetch<{ messages: GatewayMessage[] }>(
        `/messages${query ? `?${query}` : ''}`
      );
    },

    send: (data: { channel: string; content: string; threadId?: string }) =>
      gatewayFetch<{ id: string; status: 'sent' }>('/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getThreads: (channel: string) =>
      gatewayFetch<{ threads: Array<{ id: string; preview: string; lastActivity: string }> }>(
        `/messages/threads?channel=${channel}`
      ),
  },

  // Cron Jobs
  cron: {
    list: () =>
      gatewayFetch<{ jobs: GatewayCronJob[] }>('/cron'),

    create: (job: Omit<GatewayCronJob, 'id' | 'lastRun' | 'nextRun' | 'status'>) =>
      gatewayFetch<GatewayCronJob>('/cron', {
        method: 'POST',
        body: JSON.stringify(job),
      }),

    update: (id: string, updates: Partial<GatewayCronJob>) =>
      gatewayFetch<GatewayCronJob>(`/cron/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    delete: (id: string) =>
      gatewayFetch<{ success: boolean }>(`/cron/${id}`, {
        method: 'DELETE',
      }),

    trigger: (id: string) =>
      gatewayFetch<{ success: boolean; jobId: string }>(`/cron/${id}/trigger`, {
        method: 'POST',
      }),
  },

  // Memory
  memory: {
    get: (file: string) =>
      gatewayFetch<GatewayMemoryEntry>(`/memory?file=${encodeURIComponent(file)}`),

    list: () =>
      gatewayFetch<{ files: string[] }>('/memory/files'),

    update: (file: string, content: string) =>
      gatewayFetch<{ success: boolean }>('/memory', {
        method: 'PUT',
        body: JSON.stringify({ file, content }),
      }),

    search: (query: string) =>
      gatewayFetch<{ results: Array<{ file: string; matches: string[] }> }>(
        `/memory/search?q=${encodeURIComponent(query)}`
      ),
  },

  // Agents
  agents: {
    spawn: (request: SpawnAgentRequest) =>
      gatewayFetch<SpawnAgentResponse>('/agents/spawn', {
        method: 'POST',
        body: JSON.stringify(request),
      }),

    list: () =>
      gatewayFetch<{ agents: Array<{ id: string; task: string; status: string; startedAt: string }> }>(
        '/agents'
      ),

    get: (id: string) =>
      gatewayFetch<{ id: string; task: string; status: string; output?: string }>(
        `/agents/${id}`
      ),

    stop: (id: string) =>
      gatewayFetch<{ success: boolean }>(`/agents/${id}/stop`, {
        method: 'POST',
      }),
  },

  // Costs
  costs: {
    summary: () =>
      gatewayFetch<GatewayCostSummary>('/costs/summary'),

    history: (params?: { days?: number }) => {
      const query = params?.days ? `?days=${params.days}` : '';
      return gatewayFetch<{ history: Array<{ date: string; cost: number; tokens: number }> }>(
        `/costs/history${query}`
      );
    },
  },

  // Health check
  health: () =>
    gatewayFetch<{ status: 'ok'; version: string }>('/health'),

  // Wake/notify (for openclaw gateway wake command)
  wake: (message: string, mode: 'now' | 'queue' = 'now') =>
    gatewayFetch<{ success: boolean }>('/wake', {
      method: 'POST',
      body: JSON.stringify({ message, mode }),
    }),
};

export default gateway;
