# Agent Dashboard — Wire Real Data & Polish

## Current Status
- ✅ Build passes
- ✅ 16 apps built including Ralph Monitor
- ✅ API routes created
- 🔄 Apps need real Gateway connections

## Your Tasks (in order)

### 1. Wire Apps to Real Data
Connect these apps to actual OpenClaw Gateway (localhost:4280):

- **Activity Monitor** → SSE `/api/events` for real-time tool calls
- **Token Tracker / Cost Dashboard** → Real usage data from Gateway
- **Memory Browser** → `/api/memory/*` endpoints
- **Message Center** → `/api/messages/*` endpoints
- **Tools Inspector** → Real tool usage stats

### 2. Complete Ralph Monitor
Add missing endpoints:
- `POST /api/ralph/[project]/start` — Start Ralph loop (spawn process)
- `POST /api/ralph/[project]/stop` — Kill Ralph process

### 3. Test SSE Connection
Verify SSE events flow from Gateway:
- Check `src/app/api/events/route.ts`
- Ensure proper EventSource handling in components

### 4. Polish UI
- Smooth window animations (open/close/minimize)
- Keyboard shortcuts (Cmd+Space for Spotlight)
- Fix any TypeScript errors

## Development Commands
```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm test     # Run tests
```

## Key Files
- `src/components/apps/` — All app components
- `src/app/api/` — API routes (proxy to Gateway)
- `src/lib/apps-registry.ts` — App registration

## Gateway Info
- URL: `http://localhost:4280`
- SSE: `/api/events`
- Auth: Token in localStorage

## CRITICAL: Completion Format
When ALL tasks complete:

```
---RALPH_STATUS---
STATUS: COMPLETE
EXIT_SIGNAL: true
---END_RALPH_STATUS---
```
