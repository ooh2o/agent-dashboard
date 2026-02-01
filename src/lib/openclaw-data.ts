/**
 * OpenClaw Live Data Integration
 * 
 * Reads real session data from OpenClaw's file system.
 * This replaces mock-data.ts for production use.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { ActivityEvent, Session, EventType } from './types';

// OpenClaw data paths
const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(process.env.HOME || '', '.openclaw');
const SESSIONS_DIR = path.join(OPENCLAW_DIR, 'agents', 'main', 'sessions');
const SESSIONS_INDEX = path.join(SESSIONS_DIR, 'sessions.json');

interface OpenClawSessionMeta {
  sessionId: string;
  updatedAt: number;
  model: string;
  channel: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  sessionFile: string;
  chatType?: string;
}

interface JsonlEntry {
  type: string;
  id: string;
  timestamp: string;
  message?: {
    role: string;
    content: Array<{
      type: string;
      text?: string;
      toolCallId?: string;
      toolName?: string;
      name?: string;
      arguments?: Record<string, unknown>;
    }>;
  };
}

/**
 * Get the list of active sessions from OpenClaw
 */
export async function getSessions(): Promise<Session[]> {
  try {
    const indexContent = await fs.readFile(SESSIONS_INDEX, 'utf-8');
    const sessionsIndex = JSON.parse(indexContent) as Record<string, OpenClawSessionMeta>;
    
    const sessions: Session[] = [];
    
    for (const [key, meta] of Object.entries(sessionsIndex)) {
      sessions.push({
        id: meta.sessionId,
        startTime: new Date(meta.updatedAt),
        model: meta.model || 'claude-opus-4-5',
        channel: meta.channel || 'webchat',
        totalTokens: {
          input: meta.inputTokens || 0,
          output: meta.outputTokens || 0,
        },
        estimatedCost: calculateCost(meta.inputTokens || 0, meta.outputTokens || 0, meta.model),
        activities: [],
        subagents: [],
      });
    }
    
    return sessions;
  } catch (error) {
    console.error('Error reading sessions:', error);
    return [];
  }
}

/**
 * Get activities from a session's JSONL file
 */
export async function getSessionActivities(sessionId: string, limit = 50): Promise<ActivityEvent[]> {
  try {
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.jsonl`);
    const content = await fs.readFile(sessionFile, 'utf-8');
    const lines = content.trim().split('\n');
    
    const activities: ActivityEvent[] = [];
    
    // Process last N lines for recent activity
    const recentLines = lines.slice(-limit * 3); // Get more lines since not all are activities
    
    for (const line of recentLines) {
      try {
        const entry = JSON.parse(line) as JsonlEntry;
        const activity = parseJsonlEntryToActivity(entry);
        if (activity) {
          activities.push(activity);
        }
      } catch {
        // Skip malformed lines
      }
    }
    
    return activities.slice(-limit).reverse(); // Most recent first
  } catch (error) {
    console.error('Error reading session activities:', error);
    return [];
  }
}

/**
 * Get recent activities across all sessions
 */
export async function getRecentActivities(limit = 20): Promise<ActivityEvent[]> {
  try {
    const sessions = await getSessions();
    if (sessions.length === 0) return [];
    
    // Get the most recent session
    const latestSession = sessions.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )[0];
    
    return getSessionActivities(latestSession.id, limit);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
}

/**
 * Convert a JSONL entry to an ActivityEvent
 */
function parseJsonlEntryToActivity(entry: JsonlEntry): ActivityEvent | null {
  const timestamp = new Date(entry.timestamp);
  
  switch (entry.type) {
    case 'message':
      if (entry.message?.role === 'assistant') {
        const content = entry.message.content || [];
        
        // Check for thinking
        const thinking = content.find(c => c.type === 'thinking');
        if (thinking) {
          return {
            id: entry.id,
            timestamp,
            type: 'thinking',
            explanation: 'Thinking...',
          };
        }
        
        // Check for tool calls
        const toolCall = content.find(c => c.type === 'toolCall');
        if (toolCall && toolCall.name) {
          const toolType = mapToolToEventType(toolCall.name);
          return {
            id: entry.id,
            timestamp,
            type: toolType,
            tool: toolCall.name,
            params: toolCall.arguments,
            explanation: formatToolExplanation(toolCall.name, toolCall.arguments),
          };
        }
        
        // Regular assistant message
        const textContent = content.find(c => c.type === 'text');
        if (textContent?.text) {
          return {
            id: entry.id,
            timestamp,
            type: 'message_send',
            explanation: `Response: ${textContent.text.slice(0, 100)}...`,
          };
        }
      } else if (entry.message?.role === 'toolResult') {
        // Extract tool name from the message - it might be in toolName or we infer from content
        const toolName = (entry.message as { toolName?: string }).toolName || 
                        entry.message.content?.[0]?.toolName || 
                        'tool';
        const isError = (entry.message as { isError?: boolean }).isError || false;
        const resultText = entry.message.content?.[0]?.text || '';
        
        // Create a short summary of the result
        let explanation = `${toolName}: `;
        if (isError) {
          explanation += 'Error';
        } else if (resultText.length > 50) {
          explanation += resultText.slice(0, 47) + '...';
        } else {
          explanation += resultText || 'completed';
        }
        
        return {
          id: entry.id,
          timestamp,
          type: 'tool_call',
          tool: toolName,
          result: isError ? 'error' : 'success',
          explanation,
        };
      } else if (entry.message?.role === 'user') {
        const textContent = entry.message.content?.find(c => c.type === 'text');
        if (textContent?.text) {
          return {
            id: entry.id,
            timestamp,
            type: 'message_send',
            explanation: `User: ${textContent.text.slice(0, 80)}...`,
          };
        }
      }
      break;
      
    case 'thinking':
      return {
        id: entry.id,
        timestamp,
        type: 'thinking',
        explanation: 'Thinking...',
      };
  }
  
  return null;
}

/**
 * Map tool names to event types
 */
function mapToolToEventType(toolName: string): EventType {
  const toolTypeMap: Record<string, EventType> = {
    'read': 'file_read',
    'Read': 'file_read',
    'write': 'file_write',
    'Write': 'file_write',
    'edit': 'file_write',
    'Edit': 'file_write',
    'web_search': 'web_search',
    'web_fetch': 'web_fetch',
    'memory_search': 'memory_read',
    'memory_get': 'memory_read',
    'exec': 'tool_call',
    'sessions_spawn': 'subagent_spawn',
    'message': 'message_send',
  };
  
  return toolTypeMap[toolName] || 'tool_call';
}

/**
 * Format a human-readable explanation for a tool call
 */
function formatToolExplanation(toolName: string, args?: Record<string, unknown>): string {
  switch (toolName) {
    case 'read':
    case 'Read':
      return `Read file: ${args?.path || args?.file_path || 'unknown'}`;
    case 'write':
    case 'Write':
      return `Wrote file: ${args?.path || args?.file_path || 'unknown'}`;
    case 'edit':
    case 'Edit':
      return `Edited file: ${args?.path || args?.file_path || 'unknown'}`;
    case 'exec':
      const cmd = String(args?.command || '').slice(0, 50);
      return `Executed: ${cmd}${cmd.length >= 50 ? '...' : ''}`;
    case 'web_search':
      return `Searched web: "${args?.query || 'unknown'}"`;
    case 'web_fetch':
      return `Fetched URL: ${args?.url || 'unknown'}`;
    case 'memory_search':
      return `Memory search: "${args?.query || 'unknown'}"`;
    case 'sessions_spawn':
      return `Spawned sub-agent: "${args?.task || 'unknown'}"`;
    case 'message':
      return `Sent message to ${args?.channel || args?.target || 'unknown'}`;
    default:
      return `Called tool: ${toolName}`;
  }
}

/**
 * Token pricing per 1M tokens
 */
export const TOKEN_PRICING = {
  'claude-opus-4-5': { input: 15, output: 75 },
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-sonnet-4-0': { input: 3, output: 15 },
  'claude-haiku-3-5-20241022': { input: 0.25, output: 1.25 },
  'gemini-2.0-pro': { input: 0.7, output: 2.8 },
} as const;

export type ModelName = keyof typeof TOKEN_PRICING;

/**
 * Calculate estimated cost based on tokens
 */
export function calculateCost(inputTokens: number, outputTokens: number, model?: string): number {
  const rates = TOKEN_PRICING[model as ModelName] || TOKEN_PRICING['claude-opus-4-5'];
  
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  
  return inputCost + outputCost;
}

/**
 * Calculate cost with breakdown (for token-tracker component)
 */
export function calculateCostBreakdown(
  model: string,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const pricing = TOKEN_PRICING[model as ModelName] || TOKEN_PRICING['claude-opus-4-5'];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

/**
 * Get current session stats
 */
export async function getCurrentSessionStats(): Promise<{
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  model: string;
  channel: string;
}> {
  try {
    const sessions = await getSessions();
    if (sessions.length === 0) {
      return {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: 0,
        model: 'unknown',
        channel: 'unknown',
      };
    }
    
    // Get the most recent/active session
    const latestSession = sessions.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )[0];
    
    return {
      totalTokens: latestSession.totalTokens.input + latestSession.totalTokens.output,
      inputTokens: latestSession.totalTokens.input,
      outputTokens: latestSession.totalTokens.output,
      estimatedCost: latestSession.estimatedCost,
      model: latestSession.model,
      channel: latestSession.channel,
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      model: 'unknown',
      channel: 'unknown',
    };
  }
}

/**
 * Watch for session updates (returns cleanup function)
 */
export function watchSessions(callback: (sessions: Session[]) => void, intervalMs = 5000): () => void {
  const interval = setInterval(async () => {
    const sessions = await getSessions();
    callback(sessions);
  }, intervalMs);
  
  return () => clearInterval(interval);
}
