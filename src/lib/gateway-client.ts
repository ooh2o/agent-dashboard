// Gateway WebSocket RPC Client
// Connects to OpenClaw Gateway via WebSocket for real-time data

import WebSocket from 'ws';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  CronJob,
  CronListResponse,
  CronStatusResponse,
  Session,
  SessionsListOptions,
  SessionsListResponse,
  SessionHistoryOptions,
  SessionHistoryResponse,
  ConfigGetResponse,
} from './gateway-types';

const DEFAULT_URL = 'ws://localhost:18789';
const DEFAULT_TOKEN = '60ebdeb19ae1a66eed1ecc86293c9b4e3b603b24229522f8';
const CONNECT_TIMEOUT = 5000;
const REQUEST_TIMEOUT = 10000;
const RECONNECT_DELAY = 3000;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

class GatewayClient {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pending = new Map<number, PendingRequest>();
  private url: string;
  private token: string;
  private connecting = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.url = process.env.OPENCLAW_GATEWAY_URL || DEFAULT_URL;
    this.token = process.env.OPENCLAW_GATEWAY_TOKEN || DEFAULT_TOKEN;
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.connecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve();
          } else if (!this.connecting) {
            clearInterval(checkInterval);
            reject(new Error('Connection failed'));
          }
        }, 100);
      });
    }

    this.connecting = true;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.connecting = false;
        this.ws?.close();
        reject(new Error('Connection timeout'));
      }, CONNECT_TIMEOUT);

      try {
        this.ws = new WebSocket(this.url, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        this.ws.on('open', () => {
          clearTimeout(timeout);
          this.connecting = false;
          console.log('[Gateway] Connected to', this.url);
          resolve();
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', () => {
          console.log('[Gateway] Connection closed');
          this.handleDisconnect();
        });

        this.ws.on('error', (err) => {
          console.error('[Gateway] WebSocket error:', err.message);
          clearTimeout(timeout);
          this.connecting = false;
          reject(err);
        });
      } catch (err) {
        clearTimeout(timeout);
        this.connecting = false;
        reject(err);
      }
    });
  }

  private handleMessage(data: string): void {
    try {
      const response = JSON.parse(data) as JsonRpcResponse;
      const pending = this.pending.get(response.id);

      if (pending) {
        clearTimeout(pending.timeout);
        this.pending.delete(response.id);

        if (response.error) {
          pending.reject(new Error(response.error.message));
        } else {
          pending.resolve(response.result);
        }
      }
    } catch (err) {
      console.error('[Gateway] Failed to parse message:', err);
    }
  }

  private handleDisconnect(): void {
    this.ws = null;

    // Reject all pending requests
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
      this.pending.delete(id);
    }

    // Schedule reconnect
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect().catch(() => {
          // Reconnect failed, will try again on next call
        });
      }, RECONNECT_DELAY);
    }
  }

  async call<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    await this.connect();

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to Gateway');
    }

    const id = ++this.requestId;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params: params || {},
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, REQUEST_TIMEOUT);

      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject, timeout });
      this.ws!.send(JSON.stringify(request));
    });
  }

  // Typed RPC methods

  async cronList(): Promise<CronJob[]> {
    const response = await this.call<CronListResponse>('cron.list');
    return response.jobs || [];
  }

  async cronStatus(): Promise<CronStatusResponse> {
    return this.call<CronStatusResponse>('cron.status');
  }

  async sessionsList(opts?: SessionsListOptions): Promise<Session[]> {
    const response = await this.call<SessionsListResponse>('sessions.list', opts);
    return response.sessions || [];
  }

  async sessionsHistory(opts: SessionHistoryOptions): Promise<SessionHistoryResponse> {
    return this.call<SessionHistoryResponse>('sessions.history', opts);
  }

  async configGet(): Promise<ConfigGetResponse> {
    return this.call<ConfigGetResponse>('config.get');
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
let clientInstance: GatewayClient | null = null;

export function getGatewayClient(): GatewayClient {
  if (!clientInstance) {
    clientInstance = new GatewayClient();
  }
  return clientInstance;
}

export { GatewayClient };
