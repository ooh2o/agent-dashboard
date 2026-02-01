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

// Agent Spawner Types
export type AgentTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultTask?: string;
};

export type AgentStatus = 'starting' | 'running' | 'paused' | 'completed' | 'failed';

export interface RunningAgent {
  id: string;
  name: string;
  task: string;
  template: AgentTemplate;
  status: AgentStatus;
  startedAt: Date;
  progress?: number;
  tokensUsed?: number;
}

// Task Queue Types
export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';

export type QueuedTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface QueuedTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: QueuedTaskStatus;
  progress?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount?: number;
  maxRetries?: number;
  assignedAgent?: string;
}

// Tools Inspector types
export type ToolCategory = 'file' | 'web' | 'system' | 'ai' | 'memory' | 'communication';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  enabled: boolean;
  usageCount: number;
  lastUsed?: Date;
  successRate: number;
  avgDurationMs: number;
  icon: string;
  params?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
}

export interface ToolTestResult {
  success: boolean;
  output?: string;
  error?: string;
  durationMs: number;
  timestamp: Date;
}

// Notification Center types
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'task' | 'message';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  source: string;
  actionLabel?: string;
  actionUrl?: string;
  groupId?: string;
}

export interface NotificationGroup {
  id: string;
  source: string;
  notifications: Notification[];
  unreadCount: number;
}
