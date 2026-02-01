/**
 * Mock Gateway utilities for testing
 * Provides mock responses and SSE simulation
 */

import type {
  GatewaySession,
  GatewayActivity,
  GatewayMessage,
  GatewayCronJob,
  GatewayMemoryEntry,
  GatewayCostSummary,
} from '@/lib/gateway';

// Factory functions for creating mock data
export function createMockSession(overrides: Partial<GatewaySession> = {}): GatewaySession {
  return {
    id: `session-${Date.now()}`,
    startTime: new Date().toISOString(),
    model: 'claude-3-sonnet',
    channel: 'telegram',
    status: 'active',
    totalTokens: { input: 1000, output: 500 },
    estimatedCost: 0.015,
    ...overrides,
  };
}

export function createMockActivity(overrides: Partial<GatewayActivity> = {}): GatewayActivity {
  return {
    id: `activity-${Date.now()}`,
    sessionId: 'session-1',
    timestamp: new Date().toISOString(),
    type: 'tool_call',
    tool: 'Read',
    params: { file_path: '/test/file.txt' },
    result: 'success',
    durationMs: 150,
    tokens: { input: 100, output: 50 },
    explanation: 'Read file /test/file.txt',
    ...overrides,
  };
}

export function createMockMessage(overrides: Partial<GatewayMessage> = {}): GatewayMessage {
  return {
    id: `msg-${Date.now()}`,
    channel: 'telegram',
    sender: 'user',
    content: 'Test message content',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockCronJob(overrides: Partial<GatewayCronJob> = {}): GatewayCronJob {
  return {
    id: `cron-${Date.now()}`,
    name: 'Test Job',
    schedule: '0 9 * * *',
    command: 'echo "test"',
    enabled: true,
    status: 'idle',
    nextRun: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  };
}

export function createMockMemoryEntry(overrides: Partial<GatewayMemoryEntry> = {}): GatewayMemoryEntry {
  return {
    file: 'MEMORY.md',
    content: '# Agent Memory\n\nTest content',
    lastModified: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockCostSummary(overrides: Partial<GatewayCostSummary> = {}): GatewayCostSummary {
  return {
    today: 1.50,
    thisWeek: 8.25,
    thisMonth: 32.10,
    byModel: {
      'claude-3-opus': 15.00,
      'claude-3-sonnet': 10.50,
      'claude-3-haiku': 6.60,
    },
    byChannel: {
      telegram: 12.00,
      discord: 8.50,
      signal: 11.60,
    },
    recentSessions: [
      { id: 'session-1', cost: 0.25, model: 'claude-3-sonnet', timestamp: new Date().toISOString() },
      { id: 'session-2', cost: 0.15, model: 'claude-3-haiku', timestamp: new Date().toISOString() },
    ],
    ...overrides,
  };
}

// Mock fetch for gateway requests
export function mockGatewayFetch(responseData: unknown, status = 200) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => responseData,
    text: async () => JSON.stringify(responseData),
  });
}

// Store for tracking EventSource instances
export const mockEventSourceInstances: MockEventSource[] = [];

// Mock SSE connection for real-time events
export class MockEventSource {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  readyState: number = 0; // CONNECTING

  private eventListeners: Map<string, ((event: MessageEvent) => void)[]> = new Map();

  constructor(url: string) {
    this.url = url;
    // Track this instance
    mockEventSourceInstances.push(this);
    // Simulate connection after a tick
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    const listeners = this.eventListeners.get(type) || [];
    this.eventListeners.set(
      type,
      listeners.filter((l) => l !== listener)
    );
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  // Test helper to emit events
  emit(type: string, data: unknown) {
    const event = new MessageEvent(type, {
      data: typeof data === 'string' ? data : JSON.stringify(data),
    });

    if (type === 'message' && this.onmessage) {
      this.onmessage(event);
    }

    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach((listener) => listener(event));
  }

  // Test helper to simulate error
  emitError() {
    this.readyState = 2; // CLOSED
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Clear instances (call in beforeEach)
export function clearMockEventSourceInstances() {
  mockEventSourceInstances.length = 0;
}

// Get the latest instance
export function getLatestMockEventSource(): MockEventSource | undefined {
  return mockEventSourceInstances[mockEventSourceInstances.length - 1];
}

// Setup mock EventSource globally
export function setupMockEventSource() {
  clearMockEventSourceInstances();
  (global as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;
  return MockEventSource;
}

// Create mock gateway client for testing
export function createMockGateway() {
  return {
    baseUrl: 'http://localhost:3030',
    sessions: {
      list: jest.fn().mockResolvedValue({ sessions: [], total: 0 }),
      get: jest.fn().mockResolvedValue(createMockSession()),
      getActivities: jest.fn().mockResolvedValue({ activities: [] }),
    },
    activities: {
      list: jest.fn().mockResolvedValue({ activities: [] }),
    },
    messages: {
      list: jest.fn().mockResolvedValue({ messages: [] }),
      send: jest.fn().mockResolvedValue({ id: 'msg-1', status: 'sent' }),
      getThreads: jest.fn().mockResolvedValue({ threads: [] }),
    },
    cron: {
      list: jest.fn().mockResolvedValue({ jobs: [] }),
      create: jest.fn().mockResolvedValue(createMockCronJob()),
      update: jest.fn().mockResolvedValue(createMockCronJob()),
      delete: jest.fn().mockResolvedValue({ success: true }),
      trigger: jest.fn().mockResolvedValue({ success: true, jobId: 'job-1' }),
    },
    memory: {
      get: jest.fn().mockResolvedValue(createMockMemoryEntry()),
      list: jest.fn().mockResolvedValue({ files: ['MEMORY.md'] }),
      update: jest.fn().mockResolvedValue({ success: true }),
      search: jest.fn().mockResolvedValue({ results: [] }),
    },
    agents: {
      spawn: jest.fn().mockResolvedValue({ id: 'agent-1', status: 'started', task: 'test' }),
      list: jest.fn().mockResolvedValue({ agents: [] }),
      get: jest.fn().mockResolvedValue({ id: 'agent-1', task: 'test', status: 'running' }),
      stop: jest.fn().mockResolvedValue({ success: true }),
    },
    costs: {
      summary: jest.fn().mockResolvedValue(createMockCostSummary()),
      history: jest.fn().mockResolvedValue({ history: [] }),
    },
    health: jest.fn().mockResolvedValue({ status: 'ok', version: '1.0.0' }),
    wake: jest.fn().mockResolvedValue({ success: true }),
  };
}
