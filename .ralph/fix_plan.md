# Fix Plan: Gateway WebSocket Integration

## Priority 1: Gateway Client
- [ ] Create `src/lib/gateway-client.ts` — WebSocket RPC client
- [ ] Create `src/lib/gateway-types.ts` — TypeScript types
- [ ] Add connection management (connect, reconnect, close)
- [ ] Add request/response correlation

## Priority 2: Cron Integration  
- [ ] Update `/api/live/cron/route.ts` to use Gateway client
- [ ] Call `cron.list` via WebSocket RPC
- [ ] Test cron data shows in Dashboard

## Priority 3: Sessions Integration
- [ ] Update `/api/live/sessions/route.ts` to use Gateway client
- [ ] Call `sessions.list` via WebSocket RPC
- [ ] Test sessions show in Dashboard

## Priority 4: Environment Config
- [ ] Create `.env.local` with Gateway URL and token
- [ ] Update `.env.example` for documentation

## Current Focus
Start with Gateway Client library — foundation for everything else.
