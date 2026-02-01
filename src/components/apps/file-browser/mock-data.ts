import { FileNode, FilePreview } from './types';

const now = new Date();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);

export const mockFileTree: FileNode = {
  id: 'root',
  name: 'agent-dashboard',
  path: '/',
  type: 'directory',
  children: [
    {
      id: 'src',
      name: 'src',
      path: '/src',
      type: 'directory',
      children: [
        {
          id: 'app',
          name: 'app',
          path: '/src/app',
          type: 'directory',
          children: [
            {
              id: 'page',
              name: 'page.tsx',
              path: '/src/app/page.tsx',
              type: 'file',
              extension: 'tsx',
              size: 2340,
              gitStatus: 'modified',
              lastModified: hoursAgo(1),
            },
            {
              id: 'layout',
              name: 'layout.tsx',
              path: '/src/app/layout.tsx',
              type: 'file',
              extension: 'tsx',
              size: 890,
              gitStatus: 'clean',
              lastModified: hoursAgo(24),
            },
            {
              id: 'globals',
              name: 'globals.css',
              path: '/src/app/globals.css',
              type: 'file',
              extension: 'css',
              size: 1250,
              gitStatus: 'clean',
              lastModified: hoursAgo(48),
            },
          ],
        },
        {
          id: 'components',
          name: 'components',
          path: '/src/components',
          type: 'directory',
          children: [
            {
              id: 'ui',
              name: 'ui',
              path: '/src/components/ui',
              type: 'directory',
              children: [
                {
                  id: 'button',
                  name: 'button.tsx',
                  path: '/src/components/ui/button.tsx',
                  type: 'file',
                  extension: 'tsx',
                  size: 1890,
                  gitStatus: 'clean',
                  lastModified: hoursAgo(72),
                },
                {
                  id: 'card',
                  name: 'card.tsx',
                  path: '/src/components/ui/card.tsx',
                  type: 'file',
                  extension: 'tsx',
                  size: 1420,
                  gitStatus: 'clean',
                  lastModified: hoursAgo(72),
                },
                {
                  id: 'input',
                  name: 'input.tsx',
                  path: '/src/components/ui/input.tsx',
                  type: 'file',
                  extension: 'tsx',
                  size: 780,
                  gitStatus: 'clean',
                  lastModified: hoursAgo(72),
                },
              ],
            },
            {
              id: 'dashboard',
              name: 'dashboard',
              path: '/src/components/dashboard',
              type: 'directory',
              children: [
                {
                  id: 'activity-feed',
                  name: 'activity-feed.tsx',
                  path: '/src/components/dashboard/activity-feed.tsx',
                  type: 'file',
                  extension: 'tsx',
                  size: 4560,
                  gitStatus: 'added',
                  lastModified: hoursAgo(2),
                },
                {
                  id: 'token-tracker',
                  name: 'token-tracker.tsx',
                  path: '/src/components/dashboard/token-tracker.tsx',
                  type: 'file',
                  extension: 'tsx',
                  size: 3210,
                  gitStatus: 'added',
                  lastModified: hoursAgo(3),
                },
                {
                  id: 'memory-viewer',
                  name: 'memory-viewer.tsx',
                  path: '/src/components/dashboard/memory-viewer.tsx',
                  type: 'file',
                  extension: 'tsx',
                  size: 2890,
                  gitStatus: 'added',
                  lastModified: hoursAgo(4),
                },
              ],
            },
            {
              id: 'apps',
              name: 'apps',
              path: '/src/components/apps',
              type: 'directory',
              children: [
                {
                  id: 'memory-browser',
                  name: 'memory-browser',
                  path: '/src/components/apps/memory-browser',
                  type: 'directory',
                  children: [
                    {
                      id: 'memory-browser-tsx',
                      name: 'memory-browser.tsx',
                      path: '/src/components/apps/memory-browser/memory-browser.tsx',
                      type: 'file',
                      extension: 'tsx',
                      size: 8920,
                      gitStatus: 'untracked',
                      lastModified: hoursAgo(0.5),
                    },
                    {
                      id: 'memory-browser-types',
                      name: 'types.ts',
                      path: '/src/components/apps/memory-browser/types.ts',
                      type: 'file',
                      extension: 'ts',
                      size: 650,
                      gitStatus: 'untracked',
                      lastModified: hoursAgo(0.5),
                    },
                  ],
                },
                {
                  id: 'file-browser',
                  name: 'file-browser',
                  path: '/src/components/apps/file-browser',
                  type: 'directory',
                  children: [
                    {
                      id: 'file-browser-tsx',
                      name: 'file-browser.tsx',
                      path: '/src/components/apps/file-browser/file-browser.tsx',
                      type: 'file',
                      extension: 'tsx',
                      size: 7450,
                      gitStatus: 'untracked',
                      lastModified: hoursAgo(0.2),
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'lib',
          name: 'lib',
          path: '/src/lib',
          type: 'directory',
          children: [
            {
              id: 'utils',
              name: 'utils.ts',
              path: '/src/lib/utils.ts',
              type: 'file',
              extension: 'ts',
              size: 245,
              gitStatus: 'clean',
              lastModified: hoursAgo(72),
            },
            {
              id: 'types',
              name: 'types.ts',
              path: '/src/lib/types.ts',
              type: 'file',
              extension: 'ts',
              size: 1120,
              gitStatus: 'modified',
              lastModified: hoursAgo(5),
            },
            {
              id: 'mock-data',
              name: 'mock-data.ts',
              path: '/src/lib/mock-data.ts',
              type: 'file',
              extension: 'ts',
              size: 4890,
              gitStatus: 'modified',
              lastModified: hoursAgo(2),
            },
          ],
        },
      ],
    },
    {
      id: 'public',
      name: 'public',
      path: '/public',
      type: 'directory',
      children: [
        {
          id: 'favicon',
          name: 'favicon.ico',
          path: '/public/favicon.ico',
          type: 'file',
          extension: 'ico',
          size: 4286,
          gitStatus: 'clean',
          lastModified: hoursAgo(168),
        },
      ],
    },
    {
      id: 'package',
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      extension: 'json',
      size: 1890,
      gitStatus: 'modified',
      lastModified: hoursAgo(6),
    },
    {
      id: 'tsconfig',
      name: 'tsconfig.json',
      path: '/tsconfig.json',
      type: 'file',
      extension: 'json',
      size: 560,
      gitStatus: 'clean',
      lastModified: hoursAgo(168),
    },
    {
      id: 'tailwind',
      name: 'tailwind.config.ts',
      path: '/tailwind.config.ts',
      type: 'file',
      extension: 'ts',
      size: 920,
      gitStatus: 'clean',
      lastModified: hoursAgo(72),
    },
    {
      id: 'readme',
      name: 'README.md',
      path: '/README.md',
      type: 'file',
      extension: 'md',
      size: 2340,
      gitStatus: 'clean',
      lastModified: hoursAgo(168),
    },
    {
      id: 'vision',
      name: 'VISION.md',
      path: '/VISION.md',
      type: 'file',
      extension: 'md',
      size: 5670,
      gitStatus: 'untracked',
      lastModified: hoursAgo(24),
    },
  ],
};

export const mockFilePreviews: Record<string, FilePreview> = {
  '/src/app/page.tsx': {
    path: '/src/app/page.tsx',
    language: 'typescript',
    lineCount: 85,
    content: `'use client';

import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { TokenTracker } from '@/components/dashboard/token-tracker';
import { InterventionPanel } from '@/components/dashboard/intervention-panel';
import { MemoryViewer } from '@/components/dashboard/memory-viewer';
import { TaskTree } from '@/components/dashboard/task-tree';
import {
  mockActivities,
  mockSession,
  mockTaskTree,
  mockMemoryAccesses,
} from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">OpenClaw Dashboard</h1>
            <p className="text-zinc-500">
              Agent activity monitor
            </p>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Activity Feed - Left Column */}
          <div className="col-span-8">
            <ActivityFeed activities={mockActivities} />
          </div>

          {/* Right Sidebar */}
          <div className="col-span-4 space-y-6">
            <TokenTracker session={mockSession} />
            <InterventionPanel />
            <MemoryViewer accesses={mockMemoryAccesses} />
          </div>
        </div>

        {/* Task Tree */}
        <TaskTree root={mockTaskTree} />
      </div>
    </main>
  );
}`,
  },
  '/src/lib/types.ts': {
    path: '/src/lib/types.ts',
    language: 'typescript',
    lineCount: 60,
    content: `export type EventType =
  | 'tool_call'
  | 'thinking'
  | 'memory_read'
  | 'memory_write'
  | 'file_read'
  | 'file_write'
  | 'web_search'
  | 'web_fetch'
  | 'message_send'
  | 'subagent_spawn'
  | 'error';

export interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: EventType;
  tool?: string;
  params?: Record<string, unknown>;
  result?: 'success' | 'error';
  durationMs?: number;
  tokens?: { input: number; output: number };
  explanation: string;
}

export interface Session {
  id: string;
  startTime: Date;
  model: string;
  channel: string;
  totalTokens: { input: number; output: number };
  estimatedCost: number;
  activities: ActivityEvent[];
  subagents: SubagentSession[];
}`,
  },
  '/package.json': {
    path: '/package.json',
    language: 'json',
    lineCount: 42,
    content: `{
  "name": "agent-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.300.0",
    "zustand": "^4.4.0",
    "@radix-ui/react-scroll-area": "^1.0.0",
    "@radix-ui/react-collapsible": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}`,
  },
  '/README.md': {
    path: '/README.md',
    language: 'markdown',
    lineCount: 45,
    content: `# Agent Dashboard

An OS-style dashboard for monitoring and controlling AI agents.

## Features

- Activity Monitor - Real-time agent activity feed
- Memory Browser - Visual explorer for agent memory
- Token Tracker - Cost monitoring and estimation
- File Browser - Navigate workspace files

## Tech Stack

- Next.js 15 + React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Zustand

## Getting Started

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Open http://localhost:3000
`,
  },
};

export function getFilePreview(path: string): FilePreview | null {
  return mockFilePreviews[path] || null;
}
