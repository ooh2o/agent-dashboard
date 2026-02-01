/**
 * API Route: /api/live/tools
 * Returns tool usage statistics from OpenClaw session data
 */

import { NextResponse } from 'next/server';
import { getRecentActivities } from '@/lib/openclaw-data';
import type { Tool, ToolCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Map tool names to categories
const toolCategoryMap: Record<string, ToolCategory> = {
  Read: 'file',
  Write: 'file',
  Edit: 'file',
  Glob: 'file',
  Grep: 'file',
  Bash: 'system',
  exec: 'system',
  Task: 'ai',
  TodoWrite: 'system',
  WebSearch: 'web',
  WebFetch: 'web',
  web_search: 'web',
  web_fetch: 'web',
  memory_search: 'memory',
  memory_get: 'memory',
  memory_write: 'memory',
  message: 'communication',
  AskUserQuestion: 'communication',
};

// Map tool names to icons
const toolIconMap: Record<string, string> = {
  Read: 'FileText',
  Write: 'Edit3',
  Edit: 'Pencil',
  Glob: 'FolderSearch',
  Grep: 'Search',
  Bash: 'Terminal',
  exec: 'Terminal',
  Task: 'Brain',
  TodoWrite: 'ListTodo',
  WebSearch: 'Search',
  WebFetch: 'Globe',
  web_search: 'Search',
  web_fetch: 'Globe',
  memory_search: 'Search',
  memory_get: 'FileText',
  memory_write: 'Edit3',
  message: 'MessageCircle',
  AskUserQuestion: 'MessageSquare',
};

// Tool descriptions
const toolDescriptions: Record<string, string> = {
  Read: 'Read files from the filesystem',
  Write: 'Write content to files',
  Edit: 'Edit existing files with replacements',
  Glob: 'Search for files by pattern',
  Grep: 'Search file contents with regex',
  Bash: 'Execute shell commands',
  exec: 'Execute system commands',
  Task: 'Spawn sub-agent tasks',
  TodoWrite: 'Manage task lists',
  WebSearch: 'Search the web',
  WebFetch: 'Fetch web page content',
  web_search: 'Search the web',
  web_fetch: 'Fetch URL content',
  memory_search: 'Search memory files',
  memory_get: 'Read from memory',
  memory_write: 'Write to memory',
  message: 'Send messages to channels',
  AskUserQuestion: 'Ask user for input',
};

interface ToolStats {
  count: number;
  successCount: number;
  totalDuration: number;
  lastUsed: Date | null;
}

export async function GET() {
  try {
    // Get recent activities to calculate tool stats
    const activities = await getRecentActivities(200);

    // Aggregate tool usage
    const toolStats = new Map<string, ToolStats>();

    for (const activity of activities) {
      if (activity.tool) {
        const toolName = activity.tool;
        const existing = toolStats.get(toolName) || {
          count: 0,
          successCount: 0,
          totalDuration: 0,
          lastUsed: null,
        };

        existing.count++;
        if (activity.result !== 'error') {
          existing.successCount++;
        }
        if (activity.durationMs) {
          existing.totalDuration += activity.durationMs;
        }

        const timestamp = typeof activity.timestamp === 'string'
          ? new Date(activity.timestamp)
          : activity.timestamp;
        if (!existing.lastUsed || timestamp > existing.lastUsed) {
          existing.lastUsed = timestamp;
        }

        toolStats.set(toolName, existing);
      }
    }

    // Convert to Tool format
    const tools: Tool[] = [];
    let idCounter = 1;

    for (const [toolName, stats] of toolStats) {
      const category = toolCategoryMap[toolName] || 'system';
      const icon = toolIconMap[toolName] || 'Wrench';
      const description = toolDescriptions[toolName] || `Tool: ${toolName}`;

      tools.push({
        id: `tool-${idCounter++}`,
        name: toolName,
        description,
        category,
        icon,
        enabled: true,
        usageCount: stats.count,
        successRate: stats.count > 0
          ? Math.round((stats.successCount / stats.count) * 100)
          : 100,
        avgDurationMs: stats.count > 0
          ? Math.round(stats.totalDuration / stats.count)
          : 0,
        lastUsed: stats.lastUsed || undefined,
        params: [], // Would need tool schema to populate
      });
    }

    // Sort by usage count
    tools.sort((a, b) => b.usageCount - a.usageCount);

    // If no tools found, return default tools list
    if (tools.length === 0) {
      const defaultTools: Tool[] = [
        { id: 'tool-1', name: 'Read', description: 'Read files from the filesystem', category: 'file', icon: 'FileText', enabled: true, usageCount: 0, successRate: 100, avgDurationMs: 0 },
        { id: 'tool-2', name: 'Write', description: 'Write content to files', category: 'file', icon: 'Edit3', enabled: true, usageCount: 0, successRate: 100, avgDurationMs: 0 },
        { id: 'tool-3', name: 'Edit', description: 'Edit existing files', category: 'file', icon: 'Pencil', enabled: true, usageCount: 0, successRate: 100, avgDurationMs: 0 },
        { id: 'tool-4', name: 'Bash', description: 'Execute shell commands', category: 'system', icon: 'Terminal', enabled: true, usageCount: 0, successRate: 100, avgDurationMs: 0 },
        { id: 'tool-5', name: 'Glob', description: 'Search for files by pattern', category: 'file', icon: 'FolderSearch', enabled: true, usageCount: 0, successRate: 100, avgDurationMs: 0 },
        { id: 'tool-6', name: 'Grep', description: 'Search file contents', category: 'file', icon: 'Search', enabled: true, usageCount: 0, successRate: 100, avgDurationMs: 0 },
        { id: 'tool-7', name: 'Task', description: 'Spawn sub-agent tasks', category: 'ai', icon: 'Brain', enabled: true, usageCount: 0, successRate: 100, avgDurationMs: 0 },
        { id: 'tool-8', name: 'WebSearch', description: 'Search the web', category: 'web', icon: 'Search', enabled: true, usageCount: 0, successRate: 100, avgDurationMs: 0 },
      ];
      return NextResponse.json({ ok: true, tools: defaultTools });
    }

    return NextResponse.json({
      ok: true,
      tools,
      count: tools.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}
