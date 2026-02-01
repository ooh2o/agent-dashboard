import { ActivityEvent, Session, SubagentSession, TaskNode, MemoryAccess, Tool, Notification } from './types';

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

// Tools Inspector mock data
export const mockTools: Tool[] = [
  {
    id: 'read',
    name: 'Read',
    description: 'Read file contents from the filesystem',
    category: 'file',
    enabled: true,
    usageCount: 1247,
    lastUsed: ago(5),
    successRate: 99.2,
    avgDurationMs: 45,
    icon: 'FileText',
    params: [
      { name: 'file_path', type: 'string', required: true, description: 'Path to file' },
      { name: 'offset', type: 'number', required: false, description: 'Line offset' },
      { name: 'limit', type: 'number', required: false, description: 'Max lines' },
    ],
  },
  {
    id: 'write',
    name: 'Write',
    description: 'Write content to a file',
    category: 'file',
    enabled: true,
    usageCount: 523,
    lastUsed: ago(18),
    successRate: 98.5,
    avgDurationMs: 89,
    icon: 'Edit3',
    params: [
      { name: 'file_path', type: 'string', required: true, description: 'Path to file' },
      { name: 'content', type: 'string', required: true, description: 'File content' },
    ],
  },
  {
    id: 'edit',
    name: 'Edit',
    description: 'Make precise edits to existing files',
    category: 'file',
    enabled: true,
    usageCount: 892,
    lastUsed: ago(120),
    successRate: 97.8,
    avgDurationMs: 67,
    icon: 'Pencil',
    params: [
      { name: 'file_path', type: 'string', required: true, description: 'Path to file' },
      { name: 'old_string', type: 'string', required: true, description: 'Text to replace' },
      { name: 'new_string', type: 'string', required: true, description: 'Replacement text' },
    ],
  },
  {
    id: 'glob',
    name: 'Glob',
    description: 'Find files matching glob patterns',
    category: 'file',
    enabled: true,
    usageCount: 456,
    lastUsed: ago(300),
    successRate: 100,
    avgDurationMs: 34,
    icon: 'FolderSearch',
    params: [
      { name: 'pattern', type: 'string', required: true, description: 'Glob pattern' },
      { name: 'path', type: 'string', required: false, description: 'Base path' },
    ],
  },
  {
    id: 'grep',
    name: 'Grep',
    description: 'Search file contents with regex',
    category: 'file',
    enabled: true,
    usageCount: 678,
    lastUsed: ago(60),
    successRate: 99.8,
    avgDurationMs: 156,
    icon: 'Search',
    params: [
      { name: 'pattern', type: 'string', required: true, description: 'Search pattern' },
      { name: 'path', type: 'string', required: false, description: 'Search path' },
    ],
  },
  {
    id: 'bash',
    name: 'Bash',
    description: 'Execute shell commands',
    category: 'system',
    enabled: true,
    usageCount: 1089,
    lastUsed: ago(58),
    successRate: 94.3,
    avgDurationMs: 520,
    icon: 'Terminal',
    params: [
      { name: 'command', type: 'string', required: true, description: 'Command to execute' },
      { name: 'timeout', type: 'number', required: false, description: 'Timeout in ms' },
    ],
  },
  {
    id: 'web_search',
    name: 'WebSearch',
    description: 'Search the web for information',
    category: 'web',
    enabled: true,
    usageCount: 234,
    lastUsed: ago(32),
    successRate: 98.1,
    avgDurationMs: 850,
    icon: 'Globe',
    params: [
      { name: 'query', type: 'string', required: true, description: 'Search query' },
    ],
  },
  {
    id: 'web_fetch',
    name: 'WebFetch',
    description: 'Fetch and process web page content',
    category: 'web',
    enabled: true,
    usageCount: 167,
    lastUsed: ago(12),
    successRate: 96.4,
    avgDurationMs: 1200,
    icon: 'Download',
    params: [
      { name: 'url', type: 'string', required: true, description: 'URL to fetch' },
      { name: 'prompt', type: 'string', required: true, description: 'Processing prompt' },
    ],
  },
  {
    id: 'task',
    name: 'Task',
    description: 'Spawn sub-agents for complex tasks',
    category: 'ai',
    enabled: true,
    usageCount: 89,
    lastUsed: ago(25),
    successRate: 95.5,
    avgDurationMs: 45000,
    icon: 'GitBranch',
    params: [
      { name: 'prompt', type: 'string', required: true, description: 'Task description' },
      { name: 'subagent_type', type: 'string', required: true, description: 'Agent type' },
    ],
  },
  {
    id: 'mcp_telegram',
    name: 'Telegram',
    description: 'Send messages via Telegram',
    category: 'communication',
    enabled: false,
    usageCount: 0,
    successRate: 0,
    avgDurationMs: 0,
    icon: 'MessageCircle',
    params: [
      { name: 'chat_id', type: 'string', required: true, description: 'Chat ID' },
      { name: 'text', type: 'string', required: true, description: 'Message text' },
    ],
  },
  {
    id: 'mcp_discord',
    name: 'Discord',
    description: 'Send messages via Discord',
    category: 'communication',
    enabled: false,
    usageCount: 0,
    successRate: 0,
    avgDurationMs: 0,
    icon: 'MessageSquare',
    params: [
      { name: 'channel_id', type: 'string', required: true, description: 'Channel ID' },
      { name: 'content', type: 'string', required: true, description: 'Message content' },
    ],
  },
  {
    id: 'memory_read',
    name: 'MemoryRead',
    description: 'Read from agent memory system',
    category: 'memory',
    enabled: true,
    usageCount: 345,
    lastUsed: ago(30),
    successRate: 100,
    avgDurationMs: 23,
    icon: 'Brain',
    params: [
      { name: 'key', type: 'string', required: true, description: 'Memory key' },
    ],
  },
];

// Notification Center mock data
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'success',
    priority: 'medium',
    title: 'Task Completed',
    message: 'Agent dashboard PRD has been created successfully',
    timestamp: ago(60),
    read: false,
    source: 'Task Queue',
    groupId: 'tasks',
  },
  {
    id: 'n2',
    type: 'warning',
    priority: 'high',
    title: 'Budget Alert',
    message: 'You have used 80% of your daily token budget',
    timestamp: ago(300),
    read: false,
    source: 'Cost Dashboard',
    actionLabel: 'View Details',
    groupId: 'costs',
  },
  {
    id: 'n3',
    type: 'message',
    priority: 'medium',
    title: 'New Message from Telegram',
    message: 'User requested status update on project X',
    timestamp: ago(600),
    read: false,
    source: 'Telegram',
    actionLabel: 'Reply',
    groupId: 'messages',
  },
  {
    id: 'n4',
    type: 'error',
    priority: 'urgent',
    title: 'Sub-agent Failed',
    message: 'Research sub-agent encountered an error and stopped',
    timestamp: ago(900),
    read: false,
    source: 'Agent Spawner',
    actionLabel: 'Retry',
    groupId: 'agents',
  },
  {
    id: 'n5',
    type: 'info',
    priority: 'low',
    title: 'Memory Updated',
    message: 'MEMORY.md was automatically updated with new context',
    timestamp: ago(1800),
    read: true,
    source: 'Memory Browser',
    groupId: 'memory',
  },
  {
    id: 'n6',
    type: 'task',
    priority: 'medium',
    title: 'Scheduled Task Starting',
    message: 'Daily backup cron job is now running',
    timestamp: ago(3600),
    read: true,
    source: 'Calendar & Cron',
    groupId: 'tasks',
  },
  {
    id: 'n7',
    type: 'message',
    priority: 'medium',
    title: 'New Message from Discord',
    message: 'Team channel: deployment question',
    timestamp: ago(4200),
    read: true,
    source: 'Discord',
    actionLabel: 'Reply',
    groupId: 'messages',
  },
  {
    id: 'n8',
    type: 'success',
    priority: 'low',
    title: 'Tests Passed',
    message: 'All 47 tests passed successfully',
    timestamp: ago(7200),
    read: true,
    source: 'Terminal',
    groupId: 'tasks',
  },
  {
    id: 'n9',
    type: 'warning',
    priority: 'medium',
    title: 'Rate Limit Warning',
    message: 'Approaching API rate limit for web_search tool',
    timestamp: ago(10800),
    read: true,
    source: 'Tools Inspector',
    groupId: 'tools',
  },
  {
    id: 'n10',
    type: 'info',
    priority: 'low',
    title: 'New Tool Available',
    message: 'MCP server "notion" has been connected',
    timestamp: ago(14400),
    read: true,
    source: 'Tools Inspector',
    groupId: 'tools',
  },
];
