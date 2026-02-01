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

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:4280';

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

// Agent Template types
export interface GatewayAgentTemplate {
  id: string;
  name: string;
  description: string;
  task: string;
  model: string;
  thinking: boolean;
  timeout: number;
  icon: string;
  maxTurns?: number;
  isBuiltIn: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GatewayAgentInstance {
  id: string;
  templateId: string;
  templateName: string;
  task: string;
  status: 'queued' | 'starting' | 'running' | 'paused' | 'completed' | 'failed' | 'killed';
  startTime: string;
  endTime?: string;
  sessionKey?: string;
  progress?: number;
  tokensUsed?: { input: number; output: number };
  error?: string;
}

export interface TemplateSpawnRequest {
  templateId: string;
  task?: string;
  model?: string;
  maxTurns?: number;
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
    list: (params?: {
      channel?: string;
      limit?: number;
      threadId?: string;
      before?: string;
      search?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.channel) searchParams.set('channel', params.channel);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.threadId) searchParams.set('threadId', params.threadId);
      if (params?.before) searchParams.set('before', params.before);
      if (params?.search) searchParams.set('search', params.search);
      const query = searchParams.toString();
      return gatewayFetch<{ messages: GatewayMessage[] }>(
        `/messages${query ? `?${query}` : ''}`
      );
    },

    listByChannel: (
      channel: string,
      params?: { threadId?: string; limit?: number; before?: string }
    ) => {
      const searchParams = new URLSearchParams();
      if (params?.threadId) searchParams.set('threadId', params.threadId);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.before) searchParams.set('before', params.before);
      const query = searchParams.toString();
      return gatewayFetch<{ messages: GatewayMessage[] }>(
        `/messages/${channel}${query ? `?${query}` : ''}`
      );
    },

    send: (data: { channel: string; content: string; threadId?: string }) =>
      gatewayFetch<{ id: string; status: 'sent'; success: boolean }>(
        '/messages/send',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),

    getThreads: (channel: string) =>
      gatewayFetch<{
        threads: Array<{ id: string; preview: string; lastActivity: string }>;
      }>(`/messages/threads?channel=${channel}`),
  },

  // Channels
  channels: {
    list: () =>
      gatewayFetch<{
        channels: Array<{
          id: string;
          name: string;
          connected: boolean;
          icon: string;
          color: string;
          bgColor: string;
          lastActivity?: string;
          unreadCount?: number;
        }>;
        warning?: string;
      }>('/channels'),
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

    // Template-based spawning (through dashboard API)
    spawnFromTemplate: (request: TemplateSpawnRequest) =>
      fetch('/api/agents/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to spawn agent');
        return res.json() as Promise<{ agent: GatewayAgentInstance }>;
      }),

    // Running agents from dashboard
    listRunning: () =>
      fetch('/api/agents/running').then((res) => {
        if (!res.ok) throw new Error('Failed to list agents');
        return res.json() as Promise<{ agents: GatewayAgentInstance[]; synced: boolean }>;
      }),

    // Kill agent
    kill: (id: string) =>
      fetch(`/api/agents/${id}/kill`, { method: 'POST' }).then((res) => {
        if (!res.ok) throw new Error('Failed to kill agent');
        return res.json() as Promise<{ success: boolean; agent: { id: string; status: string } }>;
      }),

    // Get agent output
    getOutput: (id: string) =>
      fetch(`/api/agents/${id}/output`).then((res) => {
        if (!res.ok) throw new Error('Failed to get output');
        return res.json() as Promise<{
          id: string;
          status: string;
          output: string;
          startTime: string;
          endTime?: string;
          tokensUsed?: { input: number; output: number };
        }>;
      }),

    // Remove completed agent from list
    remove: (id: string) =>
      fetch(`/api/agents/${id}`, { method: 'DELETE' }).then((res) => {
        if (!res.ok) throw new Error('Failed to remove agent');
        return res.json() as Promise<{ success: boolean }>;
      }),
  },

  // Agent Templates
  templates: {
    list: () =>
      fetch('/api/agents/templates').then((res) => {
        if (!res.ok) throw new Error('Failed to list templates');
        return res.json() as Promise<{ templates: GatewayAgentTemplate[] }>;
      }),

    get: (id: string) =>
      fetch(`/api/agents/templates/${id}`).then((res) => {
        if (!res.ok) throw new Error('Failed to get template');
        return res.json() as Promise<{ template: GatewayAgentTemplate }>;
      }),

    create: (template: Omit<GatewayAgentTemplate, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'>) =>
      fetch('/api/agents/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to create template');
        return res.json() as Promise<{ template: GatewayAgentTemplate }>;
      }),

    update: (id: string, updates: Partial<GatewayAgentTemplate>) =>
      fetch(`/api/agents/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to update template');
        return res.json() as Promise<{ template: GatewayAgentTemplate }>;
      }),

    delete: (id: string) =>
      fetch(`/api/agents/templates/${id}`, { method: 'DELETE' }).then((res) => {
        if (!res.ok) throw new Error('Failed to delete template');
        return res.json() as Promise<{ success: boolean }>;
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
