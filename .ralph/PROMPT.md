# Task: Connect Dashboard to OpenClaw Gateway WebSocket

## Context
The Dashboard currently reads OpenClaw data from files, but the Gateway exposes a WebSocket RPC API that provides real-time access to:
- Cron jobs (`cron.list`, `cron.status`)
- Sessions (`sessions.list`, `sessions.history`)
- Config (`config.get`)
- And more

**Goal:** Connect the Dashboard directly to Gateway WebSocket for live data instead of file parsing.

## Gateway Connection Details
- **WebSocket URL:** `ws://localhost:18789`
- **Auth Token:** Read from env `OPENCLAW_GATEWAY_TOKEN` or use: `60ebdeb19ae1a66eed1ecc86293c9b4e3b603b24229522f8`
- **Protocol:** JSON-RPC over WebSocket

## RPC Call Format
```javascript
// Send:
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "cron.list",
  "params": {}
}

// Receive:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { "jobs": [...] }
}
```

## Implementation Steps

### 1. Create Gateway Client Library
Create `src/lib/gateway-client.ts`:
- WebSocket connection manager (singleton)
- Auto-reconnect on disconnect
- Request/response correlation (by id)
- Auth header: `Authorization: Bearer <token>`
- Typed RPC methods

```typescript
// Example structure
class GatewayClient {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pending = new Map<number, { resolve, reject }>();
  
  async connect(): Promise<void>;
  async call<T>(method: string, params?: object): Promise<T>;
  
  // Typed methods
  async cronList(): Promise<CronJob[]>;
  async cronStatus(): Promise<CronStatus>;
  async sessionsList(opts?: SessionsListOpts): Promise<Session[]>;
  async configGet(): Promise<Config>;
}
```

### 2. Update Cron API Route
Update `src/app/api/live/cron/route.ts`:
- Use GatewayClient instead of file reading
- Call `cron.list` via WebSocket RPC
- Return formatted cron jobs

```typescript
import { getGatewayClient } from '@/lib/gateway-client';

export async function GET() {
  try {
    const client = await getGatewayClient();
    const { jobs } = await client.cronList();
    return Response.json({ ok: true, jobs });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

### 3. Add Environment Variable
Create/update `.env.local`:
```
OPENCLAW_GATEWAY_URL=ws://localhost:18789
OPENCLAW_GATEWAY_TOKEN=60ebdeb19ae1a66eed1ecc86293c9b4e3b603b24229522f8
```

### 4. Update Sessions API
Update `src/app/api/live/sessions/route.ts`:
- Use `sessions.list` RPC call
- Get real session data from Gateway

### 5. Add SSE Stream for Real-time Updates (Optional Enhancement)
Create `src/app/api/live/stream/route.ts`:
- Connect to Gateway SSE if available
- Forward events to Dashboard clients

## Type Definitions

```typescript
interface CronJob {
  id: string;
  name?: string;
  enabled: boolean;
  schedule: {
    kind: 'at' | 'every' | 'cron';
    expr?: string;  // for cron kind
    tz?: string;
    atMs?: number;  // for at kind
    everyMs?: number; // for every kind
  };
  sessionTarget: 'main' | 'isolated';
  payload: {
    kind: 'systemEvent' | 'agentTurn';
    message?: string;
    text?: string;
  };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
  };
}

interface Session {
  key: string;
  agentId: string;
  channel: string;
  lastActivityAt: number;
  messageCount: number;
}
```

## Files to Create/Modify

1. **CREATE** `src/lib/gateway-client.ts` — WebSocket RPC client
2. **CREATE** `src/lib/gateway-types.ts` — TypeScript types for Gateway data
3. **UPDATE** `src/app/api/live/cron/route.ts` — Use Gateway client
4. **UPDATE** `src/app/api/live/sessions/route.ts` — Use Gateway client  
5. **CREATE** `.env.local` — Gateway connection config
6. **UPDATE** `.env.example` — Document required env vars

## Testing

After implementation:
1. Run `pnpm dev`
2. Open Dashboard
3. Check Cron app shows real cron job: "DACH Sales Intelligence Briefing"
4. Check Sessions show real session data

## Error Handling

- If Gateway not reachable: show "Gateway offline" in UI
- If auth fails: log error, return empty data
- Auto-reconnect on WebSocket close

## CRITICAL: Exit Signal
When Gateway WebSocket integration is working for cron and sessions, output:

```
---RALPH_STATUS---
STATUS: COMPLETE  
EXIT_SIGNAL: true
---END_RALPH_STATUS---
```
