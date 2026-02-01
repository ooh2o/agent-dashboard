/**
 * Agent Templates & Orchestration
 *
 * Data models, preset templates, and utilities for agent spawning and management.
 */

// ============ Types ============

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  task: string; // Default task prompt
  model: 'claude-sonnet-4-20250514' | 'claude-opus-4-5-20251101' | 'claude-haiku-35-20250623';
  thinking: boolean; // Enable extended thinking
  timeout: number; // Max runtime in seconds
  icon: string;
  maxTurns?: number;
  isBuiltIn: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AgentInstanceStatus =
  | 'queued'
  | 'starting'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'killed';

export interface AgentInstance {
  id: string;
  templateId: string;
  templateName: string;
  task: string;
  status: AgentInstanceStatus;
  startTime: Date;
  endTime?: Date;
  sessionKey?: string;
  output: string;
  progress?: number;
  tokensUsed?: { input: number; output: number };
  error?: string;
}

export interface SpawnAgentRequest {
  templateId: string;
  task?: string; // Override default task
  model?: string;
  maxTurns?: number;
}

export interface AgentOutputChunk {
  id: string;
  agentId: string;
  type: 'text' | 'tool_call' | 'thinking' | 'error' | 'complete';
  content: string;
  timestamp: Date;
}

// ============ Preset Templates ============

export const PRESET_TEMPLATES: AgentTemplate[] = [
  {
    id: 'research',
    name: 'Research Agent',
    description: 'Performs web research and synthesizes information',
    task: 'Research the following topic and provide a comprehensive summary with sources:',
    model: 'claude-sonnet-4-20250514',
    thinking: true,
    timeout: 600,
    icon: 'search',
    maxTurns: 20,
    isBuiltIn: true,
  },
  {
    id: 'code-review',
    name: 'Code Review Agent',
    description: 'Reviews code for bugs, security issues, and best practices',
    task: 'Review the following code for bugs, security vulnerabilities, and suggest improvements:',
    model: 'claude-sonnet-4-20250514',
    thinking: true,
    timeout: 300,
    icon: 'code',
    maxTurns: 15,
    isBuiltIn: true,
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analyzes data and generates insights with visualizations',
    task: 'Analyze the following data and provide insights, trends, and recommendations:',
    model: 'claude-sonnet-4-20250514',
    thinking: true,
    timeout: 450,
    icon: 'chart',
    maxTurns: 25,
    isBuiltIn: true,
  },
  {
    id: 'writer',
    name: 'Writer Agent',
    description: 'Creates documentation, articles, and written content',
    task: 'Write the following content with clear structure and engaging prose:',
    model: 'claude-sonnet-4-20250514',
    thinking: false,
    timeout: 300,
    icon: 'file',
    maxTurns: 10,
    isBuiltIn: true,
  },
  {
    id: 'general',
    name: 'General Agent',
    description: 'Multi-purpose autonomous agent for any task',
    task: '',
    model: 'claude-sonnet-4-20250514',
    thinking: true,
    timeout: 600,
    icon: 'bot',
    maxTurns: 30,
    isBuiltIn: true,
  },
  {
    id: 'devops',
    name: 'DevOps Agent',
    description: 'Handles infrastructure, CI/CD, and deployment tasks',
    task: 'Help with the following infrastructure or deployment task:',
    model: 'claude-sonnet-4-20250514',
    thinking: true,
    timeout: 450,
    icon: 'wrench',
    maxTurns: 20,
    isBuiltIn: true,
  },
];

// ============ Template Store (Server-side) ============

// In-memory store for custom templates (in production, use a database)
let customTemplates: AgentTemplate[] = [];

export function getTemplates(): AgentTemplate[] {
  return [...PRESET_TEMPLATES, ...customTemplates];
}

export function getTemplate(id: string): AgentTemplate | undefined {
  return getTemplates().find((t) => t.id === id);
}

export function createTemplate(
  template: Omit<AgentTemplate, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'>
): AgentTemplate {
  const newTemplate: AgentTemplate = {
    ...template,
    id: `custom-${Date.now()}`,
    isBuiltIn: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  customTemplates.push(newTemplate);
  return newTemplate;
}

export function updateTemplate(
  id: string,
  updates: Partial<Omit<AgentTemplate, 'id' | 'isBuiltIn' | 'createdAt'>>
): AgentTemplate | null {
  const index = customTemplates.findIndex((t) => t.id === id);
  if (index === -1) return null;

  customTemplates[index] = {
    ...customTemplates[index],
    ...updates,
    updatedAt: new Date(),
  };
  return customTemplates[index];
}

export function deleteTemplate(id: string): boolean {
  // Cannot delete built-in templates
  const template = getTemplate(id);
  if (!template || template.isBuiltIn) return false;

  const initialLength = customTemplates.length;
  customTemplates = customTemplates.filter((t) => t.id !== id);
  return customTemplates.length < initialLength;
}

// ============ Agent Instance Store (Server-side) ============

let runningAgents: AgentInstance[] = [];
const MAX_CONCURRENT_AGENTS = 5;

export function getRunningAgents(): AgentInstance[] {
  return [...runningAgents];
}

export function getAgent(id: string): AgentInstance | undefined {
  return runningAgents.find((a) => a.id === id);
}

export function canSpawnAgent(): { allowed: boolean; reason?: string } {
  const activeCount = runningAgents.filter(
    (a) => a.status === 'running' || a.status === 'starting' || a.status === 'queued'
  ).length;

  if (activeCount >= MAX_CONCURRENT_AGENTS) {
    return {
      allowed: false,
      reason: `Maximum concurrent agents (${MAX_CONCURRENT_AGENTS}) reached`,
    };
  }
  return { allowed: true };
}

export function addAgent(agent: AgentInstance): void {
  runningAgents.push(agent);
}

export function updateAgent(
  id: string,
  updates: Partial<AgentInstance>
): AgentInstance | null {
  const index = runningAgents.findIndex((a) => a.id === id);
  if (index === -1) return null;

  runningAgents[index] = {
    ...runningAgents[index],
    ...updates,
  };
  return runningAgents[index];
}

export function removeAgent(id: string): boolean {
  const initialLength = runningAgents.length;
  runningAgents = runningAgents.filter((a) => a.id !== id);
  return runningAgents.length < initialLength;
}

// ============ Template Validation ============

const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//i,
  /rm\s+-rf\s+~/i,
  /mkfs/i,
  /dd\s+if=/i,
  />\s*\/dev\/(sd|hd|nvme)/i,
  /chmod\s+-R\s+777\s+\//i,
  /:(){:|:&};:/i, // Fork bomb
];

export function validateTemplate(template: Partial<AgentTemplate>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (template.name && template.name.length > 50) {
    errors.push('Template name must be 50 characters or less');
  }

  if (template.description && template.description.length > 200) {
    errors.push('Description must be 200 characters or less');
  }

  if (template.task) {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(template.task)) {
        errors.push('Task contains potentially dangerous command patterns');
        break;
      }
    }
  }

  if (template.timeout !== undefined && (template.timeout < 30 || template.timeout > 3600)) {
    errors.push('Timeout must be between 30 and 3600 seconds');
  }

  if (template.maxTurns !== undefined && (template.maxTurns < 1 || template.maxTurns > 100)) {
    errors.push('Max turns must be between 1 and 100');
  }

  return { valid: errors.length === 0, errors };
}

// ============ Utility Functions ============

export function formatAgentDuration(startTime: Date, endTime?: Date): string {
  const end = endTime || new Date();
  const seconds = Math.floor((end.getTime() - startTime.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function getAgentStatusColor(status: AgentInstanceStatus): {
  text: string;
  bg: string;
} {
  const colors: Record<AgentInstanceStatus, { text: string; bg: string }> = {
    queued: { text: 'text-zinc-400', bg: 'bg-zinc-400/10' },
    starting: { text: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    running: { text: 'text-green-400', bg: 'bg-green-400/10' },
    paused: { text: 'text-orange-400', bg: 'bg-orange-400/10' },
    completed: { text: 'text-blue-400', bg: 'bg-blue-400/10' },
    failed: { text: 'text-red-400', bg: 'bg-red-400/10' },
    killed: { text: 'text-red-400', bg: 'bg-red-400/10' },
  };
  return colors[status];
}
