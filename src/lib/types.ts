export type EventType =
  | 'tool_call'
  | 'thinking'
  | 'memory_read'
  | 'memory_write'
  | 'file_read'
  | 'file_write'
  | 'web_search'
  | 'web_fetch'
  | 'message_send'
  | 'subagent_spawn'
  | 'error';

export interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: EventType;
  tool?: string;
  params?: Record<string, unknown>;
  result?: 'success' | 'error';
  durationMs?: number;
  tokens?: { input: number; output: number };
  explanation: string;
}

export interface Session {
  id: string;
  startTime: Date;
  model: string;
  channel: string;
  totalTokens: { input: number; output: number };
  estimatedCost: number;
  activities: ActivityEvent[];
  subagents: SubagentSession[];
}

export interface SubagentSession {
  id: string;
  task: string;
  status: 'running' | 'complete' | 'failed';
  parentSessionId: string;
  activities: ActivityEvent[];
}

export interface TaskNode {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  durationSeconds?: number;
  children?: TaskNode[];
}

export interface MemoryAccess {
  id: string;
  file: string;
  type: 'read' | 'write';
  timestamp: Date;
  preview?: string;
}
