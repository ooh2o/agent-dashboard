# OpenClaw OS — The Operating System for AI Agents

## Vision

**Not a dashboard. An operating system.**

Like macOS or Windows, but for your AI agent ecosystem. A unified interface where you see, control, and orchestrate everything Chief does.

## Core Metaphor: Desktop OS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ◉ ○ ○  OpenClaw OS                                    🔍 Spotlight   12:34 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │ 📊 Activity  │  │ 🧠 Memory    │  │ 💬 Messages  │  │ 💰 Costs     │   │
│   │   Monitor    │  │   Browser    │  │   Center     │  │   Dashboard  │   │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │ 🤖 Agent     │  │ 📁 Files     │  │ ⚙️ Settings  │  │ 🔧 Tools     │   │
│   │   Spawner    │  │   Browser    │  │              │  │   Inspector  │   │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │ 📅 Calendar  │  │ 🔔 Notif.    │  │ 🖥️ Terminal  │  │ 🎯 Tasks     │   │
│   │   & Cron     │  │   Center     │  │   Console    │  │   Queue      │   │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  📊 Activity │ 🧠 Memory │ 💬 Messages │ 🤖 Agents │ ⚙️ Settings          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Apps

### 1. Activity Monitor
Real-time feed of ALL agent activity:
- Tool calls with params & results
- Thinking (token counts)
- File operations
- Web searches/fetches
- Memory access
- Filter by type, search, time range

### 2. Memory Browser
Visual explorer for agent memory:
- MEMORY.md viewer/editor
- Daily notes timeline
- Search across all memory
- Diff view for changes
- "What does Chief know about X?"

### 3. Message Center
Unified inbox across all channels:
- Telegram, Discord, Signal, etc.
- Thread view
- Reply directly from dashboard
- Message history search

### 4. Cost Dashboard
Financial control center:
- Real-time token burn
- Cost by session/day/week
- Model breakdown
- Budget alerts
- Projections

### 5. Agent Spawner
Launch and manage sub-agents:
- One-click spawn with task
- Template library
- Monitor running agents
- Kill/pause controls
- Output viewer

### 6. File Browser
Navigate workspace files:
- Tree view
- Preview files
- Quick edit
- Git status overlay
- Recent files

### 7. Settings
Configure everything:
- Model selection
- Channel toggles
- Memory settings
- Notification prefs
- Theme (dark/light/auto)

### 8. Tools Inspector
See available tools:
- Tool catalog with docs
- Usage stats
- Enable/disable
- Test tools manually

### 9. Calendar & Cron
Schedule and automate:
- View scheduled jobs
- Create reminders
- Cron job manager
- Calendar integration

### 10. Notification Center
All alerts in one place:
- Grouped by type
- Mark read/unread
- Quick actions
- Do Not Disturb

### 11. Terminal Console
Direct command interface:
- Send messages to Chief
- Execute commands
- View raw logs
- Debug mode

### 12. Task Queue
Manage pending work:
- Queue visibility
- Priority adjustment
- Cancel/retry
- Dependencies

## OS Features

### Window Management
- Draggable, resizable windows
- Minimize to dock
- Full-screen mode
- Split view
- Window snapping

### Dock
- Quick access to apps
- Running indicator
- Drag to reorder
- Right-click context menu

### Menu Bar
- App-specific menus
- System status icons
- Clock
- User avatar

### Spotlight Search (⌘K)
- Search everything
- Quick actions
- Calculator
- File launcher

### Command Palette
- Keyboard-first navigation
- All actions searchable
- Shortcuts displayed

### Widgets
- Mini views on desktop
- Customizable layout
- Auto-refresh data

### Notifications
- Toast notifications
- Badge counts
- Sound alerts (optional)

### Themes
- Dark mode (default)
- Light mode
- System auto
- Custom accent colors

## Tech Stack

- **Framework:** Next.js 15 + React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **Window Manager:** Custom React context + Zustand
- **Real-time:** SSE from OpenClaw gateway
- **State:** Zustand + React Query
- **Icons:** Lucide

## Architecture

```
src/
├── app/                    # Next.js app router
├── components/
│   ├── os/                 # OS shell components
│   │   ├── desktop.tsx
│   │   ├── dock.tsx
│   │   ├── menu-bar.tsx
│   │   ├── window.tsx
│   │   ├── spotlight.tsx
│   │   └── notification-toast.tsx
│   ├── apps/               # Individual apps
│   │   ├── activity-monitor/
│   │   ├── memory-browser/
│   │   ├── message-center/
│   │   ├── cost-dashboard/
│   │   ├── agent-spawner/
│   │   ├── file-browser/
│   │   ├── settings/
│   │   ├── tools-inspector/
│   │   ├── calendar/
│   │   ├── notifications/
│   │   ├── terminal/
│   │   └── task-queue/
│   └── ui/                 # shadcn components
├── hooks/
│   ├── use-window-manager.ts
│   ├── use-event-stream.ts
│   └── use-spotlight.ts
├── lib/
│   ├── gateway.ts          # OpenClaw gateway client
│   ├── store.ts            # Zustand stores
│   └── types.ts
└── styles/
```

## Parallel Build Plan (20 Tracks)

### Core Infrastructure (Tracks 1-4)
1. Window Manager + Desktop Shell
2. Dock + Menu Bar
3. Spotlight Search + Command Palette  
4. SSE Gateway Connection + Real-time State

### Apps - Tier 1 (Tracks 5-10)
5. Activity Monitor
6. Memory Browser
7. Message Center
8. Cost Dashboard
9. Agent Spawner
10. Settings

### Apps - Tier 2 (Tracks 11-16)
11. File Browser
12. Tools Inspector
13. Calendar & Cron
14. Notification Center
15. Terminal Console
16. Task Queue

### Polish (Tracks 17-20)
17. Theme System + Dark/Light Mode
18. Keyboard Shortcuts + Accessibility
19. Widgets System
20. Notifications + Toasts + Sounds

---

**This is Chief's home. Make it feel like one.**
