# Fix Plan — Agent Dashboard

## Priority Tasks

### P0 — Critical
- [ ] Ensure `pnpm build` passes with no errors
- [ ] Verify SSE connection to Gateway works
- [ ] Test token authentication flow

### P1 — High
- [ ] Wire Activity Monitor to real events endpoint
- [ ] Wire Token Tracker to real usage data
- [ ] Connect Memory Browser to memory API
- [ ] Hook up Message Center to messages API
- [ ] **NEW: Ralph Monitor App** — Dashboard app to monitor/control Ralph loops

### P2 — Medium
- [ ] Polish window animations (smooth open/close/minimize)
- [ ] Improve dock interactions
- [ ] Add keyboard shortcuts (Cmd+Space for Spotlight)
- [ ] Responsive design for smaller screens

### P3 — Nice to Have
- [ ] Dark mode support
- [ ] Sound effects for notifications
- [ ] Window snap/tile functionality
- [ ] Custom themes

## Ralph Monitor App Requirements
Create a new app `src/components/apps/ralph-monitor/` with:

### Features
1. **Project List** — Show all Ralph-enabled projects (~/.openclaw/workspace/*/. ralph/)
2. **Live Status** — Read .ralph/status.json for each project
3. **Log Viewer** — Stream .ralph/logs/*.log files
4. **Controls:**
   - Start Ralph (`ralph --monitor` via API)
   - Stop Ralph (kill process)
   - View current loop count, calls used
5. **Task View** — Show fix_plan.md with checkbox progress

### API Endpoints Needed
- `GET /api/ralph/projects` — List Ralph projects
- `GET /api/ralph/[project]/status` — Get status.json
- `GET /api/ralph/[project]/logs` — Stream logs
- `POST /api/ralph/[project]/start` — Start Ralph loop
- `POST /api/ralph/[project]/stop` — Kill Ralph process

### UI Design
- macOS-like window consistent with other apps
- Terminal-style log viewer (dark bg, monospace)
- Progress indicators for loop count
- Color-coded status (running=green, stopped=gray, error=red)

## Notes
- Gateway runs on localhost:4280 (default)
- SSE endpoint: /api/events
- Auth token in localStorage
- Ralph projects in: ~/.openclaw/workspace/*/
