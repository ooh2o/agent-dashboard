// Gateway WebSocket RPC Types

export interface CronSchedule {
  kind: 'at' | 'every' | 'cron';
  expr?: string;      // for cron kind
  tz?: string;        // timezone
  atMs?: number;      // for at kind - specific timestamp
  everyMs?: number;   // for every kind - interval in ms
}

export interface CronPayload {
  kind: 'systemEvent' | 'agentTurn';
  message?: string;
  text?: string;
}

export interface CronJobState {
  nextRunAtMs?: number;
  lastRunAtMs?: number;
}

export interface CronJob {
  id: string;
  name?: string;
  enabled: boolean;
  schedule: CronSchedule;
  sessionTarget: 'main' | 'isolated';
  payload: CronPayload;
  state?: CronJobState;
}

export interface CronListResponse {
  jobs: CronJob[];
}

export interface CronStatusResponse {
  running: boolean;
  jobCount: number;
}

export interface Session {
  key: string;
  agentId: string;
  channel: string;
  lastActivityAt: number;
  messageCount: number;
  status?: 'active' | 'idle' | 'disconnected';
}

export interface SessionsListOptions {
  limit?: number;
  offset?: number;
  channel?: string;
  [key: string]: unknown;
}

export interface SessionsListResponse {
  sessions: Session[];
  total: number;
}

export interface SessionHistoryOptions {
  sessionKey: string;
  limit?: number;
  [key: string]: unknown;
}

export interface SessionHistoryResponse {
  messages: SessionMessage[];
}

export interface SessionMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface GatewayConfig {
  version: string;
  features: string[];
}

export interface ConfigGetResponse {
  config: GatewayConfig;
}

// JSON-RPC types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}
