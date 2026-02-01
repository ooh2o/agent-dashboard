# Agent Dashboard — Ralph Monitor App

## Current Task: Build Ralph Monitor App
Focus on ONE feature: Create the Ralph Monitor app for the dashboard.

## What Already Works
- Build passes ✅
- OS shell (windows, dock, menu bar) ✅
- Other apps exist as examples in `src/components/apps/`

## Your Task
Create `src/components/apps/ralph-monitor/` with:

### 1. RalphMonitor Component
- List Ralph-enabled projects (scan for `.ralph/` folders)
- Show status from `.ralph/status.json`
- Terminal-style log viewer
- Start/Stop controls

### 2. API Routes
Create in `src/app/api/ralph/`:
- `GET /api/ralph/projects` — List projects with `.ralph/` folder
- `GET /api/ralph/[project]/status` — Read status.json
- `GET /api/ralph/[project]/logs` — Read latest log file

### 3. Register in App Registry
Add to the app registry so it appears in dock/spotlight.

## Reference
Look at existing apps for patterns:
- `src/components/apps/activity-monitor/`
- `src/components/apps/agent-spawner/`

## Verification
1. `pnpm build` passes
2. App appears in dock
3. Can view Ralph project status

## CRITICAL: Completion Format
When the Ralph Monitor app is complete and working:

```
---RALPH_STATUS---
STATUS: COMPLETE
EXIT_SIGNAL: true
---END_RALPH_STATUS---
```
