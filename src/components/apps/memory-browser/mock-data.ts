import { MemoryFile, DailyNote, MemoryDiff, SearchResult } from './types';

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

export const mockMemoryContent = `# MEMORY.md - Chief's Long-term Memory

## User Profile
- **Name:** Nico Steinle
- **Position:** Vertrieb bei Börse Stuttgart
- **Location:** Stuttgart, Germany
- **Timezone:** CET (UTC+1)

## Technical Preferences
- Package manager: pnpm (preferred over npm/yarn)
- Editor: VS Code with Vim keybindings
- Theme: Dark mode always
- Documentation: Minimal, code should be self-documenting
- Testing: Jest + Playwright for E2E

## Project Context
### OpenClaw Gateway
- Main project: AI agent orchestration system
- Architecture: TypeScript, Node.js, SSE for real-time
- Key components: Gateway, Dashboard, CLI
- Status: Active development

### Agent Dashboard
- Purpose: Transparency into agent activities
- Stack: Next.js 15, React 18, Tailwind, shadcn/ui
- Features: Activity monitor, memory browser, cost tracking

## Communication Style
- Prefers direct, concise responses
- Technical depth appreciated
- No unnecessary explanations for basic concepts
- Likes code examples over prose

## Recurring Tasks
- Daily standup summaries at 9:00 CET
- Weekly progress reports on Fridays
- Project documentation updates as needed

## Important Contacts
- Team lead: Available via Slack
- Design reviews: Schedule 2 days in advance
- External APIs: Rate limits apply, cache aggressively

## Notes
- User values efficiency and automation
- Appreciates proactive suggestions
- Prefers incremental commits over large PRs
`;

export const mockMemoryFiles: MemoryFile[] = [
  {
    id: 'mem-1',
    name: 'MEMORY.md',
    path: '/MEMORY.md',
    type: 'memory',
    lastModified: daysAgo(0),
    content: mockMemoryContent,
    size: 1420,
  },
  {
    id: 'mem-2',
    name: 'projects.md',
    path: '/memory/projects.md',
    type: 'notes',
    lastModified: daysAgo(2),
    content: `# Active Projects

## OpenClaw
Priority: High
Status: In Development
Next milestone: MVP launch

## Agent Dashboard
Priority: High
Status: Building
Dependencies: OpenClaw Gateway

## CLI Tools
Priority: Medium
Status: Maintenance
`,
    size: 245,
  },
  {
    id: 'mem-3',
    name: 'preferences.md',
    path: '/memory/preferences.md',
    type: 'notes',
    lastModified: daysAgo(5),
    content: `# User Preferences

## Code Style
- Functional components
- TypeScript strict mode
- ESLint + Prettier
- Import sorting

## Git Workflow
- Feature branches
- Squash merges
- Conventional commits
`,
    size: 189,
  },
];

export const mockDailyNotes: DailyNote[] = [
  {
    id: 'daily-1',
    date: daysAgo(0),
    path: '/memory/daily/2026-02-01.md',
    summary: 'Built activity monitor, token tracker, intervention panel',
    entryCount: 12,
    tags: ['dashboard', 'development', 'ui'],
  },
  {
    id: 'daily-2',
    date: daysAgo(1),
    path: '/memory/daily/2026-01-31.md',
    summary: 'Designed OS-style dashboard architecture',
    entryCount: 8,
    tags: ['planning', 'architecture'],
  },
  {
    id: 'daily-3',
    date: daysAgo(2),
    path: '/memory/daily/2026-01-30.md',
    summary: 'Gateway integration, SSE streaming setup',
    entryCount: 15,
    tags: ['gateway', 'backend', 'integration'],
  },
  {
    id: 'daily-4',
    date: daysAgo(3),
    path: '/memory/daily/2026-01-29.md',
    summary: 'Message routing improvements, error handling',
    entryCount: 6,
    tags: ['bugfix', 'messaging'],
  },
  {
    id: 'daily-5',
    date: daysAgo(4),
    path: '/memory/daily/2026-01-28.md',
    summary: 'Initial project setup, PRD drafting',
    entryCount: 10,
    tags: ['setup', 'documentation'],
  },
  {
    id: 'daily-6',
    date: daysAgo(5),
    path: '/memory/daily/2026-01-27.md',
    summary: 'Research competitor dashboards, UX patterns',
    entryCount: 4,
    tags: ['research', 'ux'],
  },
  {
    id: 'daily-7',
    date: daysAgo(7),
    path: '/memory/daily/2026-01-25.md',
    summary: 'Token cost analysis, model comparison',
    entryCount: 7,
    tags: ['costs', 'analysis'],
  },
];

export const mockDiffs: MemoryDiff[] = [
  {
    id: 'diff-1',
    path: '/MEMORY.md',
    timestamp: daysAgo(0),
    type: 'modified',
    oldContent: '- Status: Planning',
    newContent: '- Status: Active development',
    linesAdded: 3,
    linesRemoved: 1,
  },
  {
    id: 'diff-2',
    path: '/memory/projects.md',
    timestamp: daysAgo(1),
    type: 'modified',
    oldContent: 'Status: Planning',
    newContent: 'Status: In Development\nNext milestone: MVP launch',
    linesAdded: 5,
    linesRemoved: 2,
  },
  {
    id: 'diff-3',
    path: '/memory/daily/2026-02-01.md',
    timestamp: daysAgo(0),
    type: 'added',
    newContent: '# 2026-02-01\n\n## Tasks Completed\n- Built activity monitor...',
    linesAdded: 45,
    linesRemoved: 0,
  },
];

export const mockSearchResults: SearchResult[] = [
  {
    id: 'search-1',
    file: 'MEMORY.md',
    path: '/MEMORY.md',
    lineNumber: 5,
    lineContent: '- **Name:** Nico Steinle',
    matchStart: 11,
    matchEnd: 23,
  },
  {
    id: 'search-2',
    file: 'MEMORY.md',
    path: '/MEMORY.md',
    lineNumber: 14,
    lineContent: '- Main project: AI agent orchestration system',
    matchStart: 16,
    matchEnd: 24,
  },
  {
    id: 'search-3',
    file: 'projects.md',
    path: '/memory/projects.md',
    lineNumber: 8,
    lineContent: 'Dependencies: OpenClaw Gateway',
    matchStart: 14,
    matchEnd: 22,
  },
];

export const mockDailyContent = `# 2026-02-01

## Summary
Built the core MVP features for the Agent Dashboard OS.

## Tasks Completed
- [x] Activity Monitor with real-time feed
- [x] Token Tracker with cost breakdown
- [x] Intervention Panel for agent control
- [x] Memory Viewer component
- [x] Task Tree visualization

## Notes
- Using framer-motion for smooth animations
- shadcn/ui provides solid base components
- Zustand works well for window manager state

## Code Changes
- Created 15 new components
- Added mock data layer
- Set up project structure

## Tomorrow
- Build Memory Browser full app
- Add File Browser with git status
- Implement window management
`;
