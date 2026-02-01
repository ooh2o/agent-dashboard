# Agent Dashboard — Product Requirements Document

## Vision

**"Chief mit Gesicht"** — A founder-friendly dashboard that makes AI agent activity transparent, controllable, and non-scary.

## Problem

Founders using AI assistants (OpenClaw, ChatGPT, Claude) face:
- **Black box** — No idea what the agent is doing
- **No visibility** — What tools did it use? What files did it read?
- **Cost anxiety** — How many tokens am I burning?
- **Trust gap** — Did it access things I didn't expect?
- **No intervention** — Can't redirect or stop mid-task

## Solution

A real-time dashboard that:
1. Shows every tool call, memory access, and action in plain language
2. Tracks token usage and estimated costs
3. Visualizes task chains and sub-agents
4. Allows mid-task intervention ("focus on X" / "stop")
5. Provides audit trail for transparency

## Target User

**Founders/power users who:**
- Use AI agents (OpenClaw, etc.) daily
- Want oversight without reading logs
- Need to manage costs
- Care about security/privacy (what did it access?)

## Core Features

### P0 — Must Have (MVP)

#### 1. Activity Feed (Real-time)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Searched web: "best practices React testing"     2s ago     │
│ 📖 Read file: MEMORY.md (lines 1-50)                5s ago     │
│ 💭 Thinking... (2.3k tokens)                        now        │
│ 🛠️ Called tool: web_fetch (docs.anthropic.com)     12s ago    │
│ ✍️ Wrote file: scripts/test-helper.ts              18s ago    │
│ 🔀 Spawned sub-agent: "Research task"              25s ago    │
└─────────────────────────────────────────────────────────────────┘
```

**Event Types:**
- `tool_call` — Any tool invocation (exec, browser, read, etc.)
- `memory_read` — MEMORY.md or daily notes access
- `memory_write` — Updates to memory files
- `thinking` — Model reasoning (token count)
- `file_read` / `file_write` — File system operations
- `web_search` / `web_fetch` — Internet access
- `message_send` — Outbound messages
- `subagent_spawn` — Background agent started
- `error` — Failures or retries

#### 2. Token/Cost Tracker

```
┌─────────────────────────────────────────────────────────────────┐
│ Session: 45 min                                                 │
│                                                                 │
│ ████████████████████░░░░░░░░ 68%                               │
│                                                                 │
│ Input:  24,500 tokens   ($0.74)                                │
│ Output: 8,200 tokens    ($0.49)                                │
│ Total:  32,700 tokens   ($1.23)                                │
│                                                                 │
│ Model: claude-opus-4-5                                         │
│ Estimated remaining: ~$2.50 at current pace                    │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. Task Tree (Sub-agents)

```
┌─────────────────────────────────────────────────────────────────┐
│ Main Task: "Create agent dashboard PRD"                        │
│ ├── ✅ Search: dashboard examples                              │
│ ├── ✅ Read: vibe-dashboard PRD                                │
│ ├── 🔄 Write: PRD.md (in progress)                             │
│ └── ⏳ Sub-agent: "Research competitor dashboards"             │
│       └── 🔄 Searching... (45s)                                │
└─────────────────────────────────────────────────────────────────┘
```

#### 4. Intervention Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ 📝 Send instruction to agent:                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Focus on the cost tracking feature first                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [🚀 Send Now]  [⏸️ Pause]  [🛑 Stop Task]                       │
└─────────────────────────────────────────────────────────────────┘
```

#### 5. Memory Viewer

```
┌─────────────────────────────────────────────────────────────────┐
│ 🧠 Agent Memory                                                 │
│                                                                 │
│ Recent Accesses:                                                │
│ • MEMORY.md (read) — 30s ago                                   │
│ • memory/2026-02-01.md (write) — 2m ago                        │
│                                                                 │
│ [Preview MEMORY.md ▼]                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ # MEMORY.md - Chief's Long-term Memory                      │ │
│ │ - Name: Nico Steinle                                        │ │
│ │ - Position: Vertrieb bei Börse Stuttgart...                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### P1 — Nice to Have

- **Tool Breakdown Chart** — Pie chart of tool usage
- **Session History** — Past sessions with replay
- **Alerts** — Notify on sensitive operations (send email, exec)
- **Multi-agent View** — Track multiple agents/sessions
- **Export Audit Log** — Download activity as JSON/CSV

### P2 — Future

- **Budget Limits** — Stop when cost exceeds $X
- **Permission Toggles** — Enable/disable tools per session
- **Voice Preview** — Hear TTS before sending
- **Mobile App** — iOS/Android companion

## Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Animations:** Framer Motion
- **Real-time:** Server-Sent Events (SSE)
- **Integration:** OpenClaw gateway API

## Integration with OpenClaw

The dashboard connects to OpenClaw's existing infrastructure:

```typescript
// SSE endpoint for real-time events
GET /api/gateway/events?sessionKey=main

// Events emitted:
{
  type: "tool_call",
  tool: "web_search",
  params: { query: "..." },
  timestamp: "2026-02-01T00:15:00Z",
  durationMs: 1200,
  tokensUsed: { input: 150, output: 0 }
}
```

**Required OpenClaw features:**
- Event stream from gateway (may need new endpoint)
- Token counting per turn
- Sub-agent status tracking

## Design Principles

### Calm & Beautiful
- **Dark mode** by default
- **Minimal UI** — Show what matters, hide complexity
- **Generous whitespace**
- **Smooth animations** — Activity feels alive, not jarring

### Plain Language
Every action translated to human-readable:
- `exec: ls -la` → "Listed files in current directory"
- `web_fetch: docs.anthropic.com` → "Read Anthropic documentation"
- `memory_search: project history` → "Searched memory for project history"

### Non-Intrusive
- Dashboard is read-only by default
- Intervention requires explicit action
- No auto-refresh that breaks focus

## Data Model

```typescript
interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: 'tool_call' | 'thinking' | 'memory' | 'file' | 'message' | 'subagent' | 'error';
  tool?: string;
  params?: Record<string, unknown>;
  result?: 'success' | 'error';
  durationMs?: number;
  tokens?: { input: number; output: number };
  explanation: string; // Human-readable
}

interface Session {
  id: string;
  startTime: Date;
  model: string;
  channel: string;
  totalTokens: { input: number; output: number };
  estimatedCost: number;
  activities: ActivityEvent[];
  subagents: SubagentSession[];
}

interface SubagentSession {
  id: string;
  task: string;
  status: 'running' | 'complete' | 'failed';
  parentSessionId: string;
  activities: ActivityEvent[];
}
```

## API Routes

### `GET /api/events`
SSE stream of real-time events for a session

### `POST /api/intervene`
Send instruction to active session
```json
{
  "sessionKey": "main",
  "instruction": "Focus on X",
  "action": "inject" | "pause" | "stop"
}
```

### `GET /api/session/:key`
Get session stats and history

### `GET /api/memory`
Preview memory file contents (with masking for sensitive data)

## Success Metrics

- **Visibility:** User can answer "what is my agent doing?" within 5 seconds
- **Cost awareness:** User knows session cost at any moment
- **Trust:** User feels confident agent isn't accessing unexpected data
- **Control:** User can redirect agent mid-task successfully

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Performance overhead from logging | Buffer events, batch updates |
| Security of exposed events | Require auth, mask sensitive params |
| Gateway API not exposing enough | Contribute upstream to OpenClaw |
| Real-time complexity | Start with polling, upgrade to SSE |

## Timeline

- **Week 1:** UI prototype (all phases, mock data)
- **Week 2:** SSE integration with OpenClaw gateway
- **Week 3:** Token tracking, cost estimation
- **Week 4:** Intervention panel, memory viewer
- **Week 5:** Polish, dark mode, animations

---

**Built for founders who want to trust their AI, not just use it.**
