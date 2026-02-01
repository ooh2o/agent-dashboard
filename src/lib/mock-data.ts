import { ActivityEvent, Session, SubagentSession, TaskNode, MemoryAccess } from './types';

const now = new Date();
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

export const mockActivities: ActivityEvent[] = [
  {
    id: '1',
    timestamp: ago(2),
    type: 'thinking',
    tokens: { input: 2300, output: 0 },
    explanation: 'Thinking... (2.3k tokens)',
  },
  {
    id: '2',
    timestamp: ago(5),
    type: 'memory_read',
    tool: 'read',
    params: { file: 'MEMORY.md', lines: '1-50' },
    result: 'success',
    durationMs: 45,
    explanation: 'Read file: MEMORY.md (lines 1-50)',
  },
  {
    id: '3',
    timestamp: ago(12),
    type: 'web_fetch',
    tool: 'web_fetch',
    params: { url: 'docs.anthropic.com' },
    result: 'success',
    durationMs: 1200,
    tokens: { input: 150, output: 0 },
    explanation: 'Called tool: web_fetch (docs.anthropic.com)',
  },
  {
    id: '4',
    timestamp: ago(18),
    type: 'file_write',
    tool: 'write',
    params: { file: 'scripts/test-helper.ts' },
    result: 'success',
    durationMs: 89,
    explanation: 'Wrote file: scripts/test-helper.ts',
  },
  {
    id: '5',
    timestamp: ago(25),
    type: 'subagent_spawn',
    tool: 'Task',
    params: { type: 'research' },
    result: 'success',
    explanation: 'Spawned sub-agent: "Research task"',
  },
  {
    id: '6',
    timestamp: ago(32),
    type: 'web_search',
    tool: 'web_search',
    params: { query: 'best practices React testing' },
    result: 'success',
    durationMs: 850,
    tokens: { input: 50, output: 200 },
    explanation: 'Searched web: "best practices React testing"',
  },
  {
    id: '7',
    timestamp: ago(45),
    type: 'file_read',
    tool: 'read',
    params: { file: 'package.json' },
    result: 'success',
    durationMs: 23,
    explanation: 'Read file: package.json',
  },
  {
    id: '8',
    timestamp: ago(58),
    type: 'tool_call',
    tool: 'Bash',
    params: { command: 'ls -la' },
    result: 'success',
    durationMs: 156,
    explanation: 'Listed files in current directory',
  },
  {
    id: '9',
    timestamp: ago(72),
    type: 'memory_write',
    tool: 'write',
    params: { file: 'memory/2026-02-01.md' },
    result: 'success',
    durationMs: 67,
    explanation: 'Updated daily notes: memory/2026-02-01.md',
  },
  {
    id: '10',
    timestamp: ago(85),
    type: 'error',
    tool: 'Bash',
    params: { command: 'npm test' },
    result: 'error',
    durationMs: 3200,
    explanation: 'Command failed: npm test (exit code 1)',
  },
];

export const mockSubagentSession: SubagentSession = {
  id: 'sub-1',
  task: 'Research competitor dashboards',
  status: 'running',
  parentSessionId: 'main',
  activities: [
    {
      id: 's1',
      timestamp: ago(15),
      type: 'web_search',
      tool: 'web_search',
      params: { query: 'AI agent dashboard examples' },
      result: 'success',
      durationMs: 920,
      explanation: 'Searching...',
    },
  ],
};

export const mockSession: Session = {
  id: 'main',
  startTime: ago(2700), // 45 minutes ago
  model: 'claude-opus-4-5',
  channel: 'terminal',
  totalTokens: { input: 24500, output: 8200 },
  estimatedCost: 1.23,
  activities: mockActivities,
  subagents: [mockSubagentSession],
};

export const mockTaskTree: TaskNode = {
  id: 'root',
  name: 'Create agent dashboard PRD',
  status: 'running',
  children: [
    {
      id: 't1',
      name: 'Search: dashboard examples',
      status: 'complete',
      durationSeconds: 12,
    },
    {
      id: 't2',
      name: 'Read: vibe-dashboard PRD',
      status: 'complete',
      durationSeconds: 3,
    },
    {
      id: 't3',
      name: 'Write: PRD.md',
      status: 'running',
    },
    {
      id: 't4',
      name: 'Sub-agent: "Research competitor dashboards"',
      status: 'pending',
      children: [
        {
          id: 't4-1',
          name: 'Searching...',
          status: 'running',
          durationSeconds: 45,
        },
      ],
    },
  ],
};

export const mockMemoryAccesses: MemoryAccess[] = [
  {
    id: 'm1',
    file: 'MEMORY.md',
    type: 'read',
    timestamp: ago(30),
    preview: `# MEMORY.md - Chief's Long-term Memory

## User Profile
- Name: Nico Steinle
- Position: Vertrieb bei Börse Stuttgart
- Interests: AI agents, productivity tools

## Preferences
- Prefers dark mode
- Uses pnpm over npm
- Likes minimal documentation

## Project Context
- Working on OpenClaw gateway
- Building agent dashboard for transparency`,
  },
  {
    id: 'm2',
    file: 'memory/2026-02-01.md',
    type: 'write',
    timestamp: ago(120),
  },
];

// Token pricing (per 1M tokens)
export const TOKEN_PRICING = {
  'claude-opus-4-5': { input: 15, output: 75 },
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-haiku-3-5-20241022': { input: 0.25, output: 1.25 },
};

export const calculateCost = (
  model: keyof typeof TOKEN_PRICING,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } => {
  const pricing = TOKEN_PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
};
