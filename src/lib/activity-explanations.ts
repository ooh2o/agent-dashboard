import { ActivityEvent } from './types';

export type RiskLevel = 'safe' | 'review' | 'sensitive';

export interface ActivityExplanation {
  summary: string;
  details: string;
  whyItMatters: string;
  riskLevel: RiskLevel;
}

export interface TechnicalContent {
  type: 'diff' | 'output' | 'content' | 'query' | 'tokens';
  content: string;
  language?: string;
}

// Risk assessment helpers
function assessPathRisk(path: string): RiskLevel {
  const sensitivePatterns = [
    /\.env/i,
    /secret/i,
    /credential/i,
    /password/i,
    /\.pem$/i,
    /\.key$/i,
    /auth/i,
    /token/i,
  ];
  const reviewPatterns = [
    /api/i,
    /config/i,
    /\.json$/i,
    /\.yaml$/i,
    /\.yml$/i,
    /package\.json/i,
  ];

  if (sensitivePatterns.some((p) => p.test(path))) return 'sensitive';
  if (reviewPatterns.some((p) => p.test(path))) return 'review';
  return 'safe';
}

function assessCommandRisk(command: string): RiskLevel {
  const sensitivePatterns = [
    /\brm\s+-rf?\b/i,
    /\bsudo\b/i,
    /\bchmod\b/i,
    /\bchown\b/i,
    /\bcurl\b.*\|\s*sh/i,
    /\bwget\b.*\|\s*sh/i,
    /\beval\b/i,
    /\bexec\b/i,
    />/,  // Redirects
    /\bkill\b/i,
    /\bpkill\b/i,
  ];
  const reviewPatterns = [
    /\bnpm\s+(install|i)\b/i,
    /\byarn\s+add\b/i,
    /\bgit\s+(push|force|reset)\b/i,
    /\bdocker\b/i,
  ];

  if (sensitivePatterns.some((p) => p.test(command))) return 'sensitive';
  if (reviewPatterns.some((p) => p.test(command))) return 'review';
  return 'safe';
}

// Extract filename from path
function getFilename(path: string): string {
  return path.split('/').pop() || path;
}

// Get file extension
function getFileExtension(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

// Map extension to language for syntax highlighting
export function getLanguageFromPath(path: string): string {
  const ext = getFileExtension(path).toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    dockerfile: 'dockerfile',
    xml: 'xml',
    toml: 'toml',
  };
  return languageMap[ext] || 'plaintext';
}

// Generate explanation for each activity type
export function generateExplanation(activity: ActivityEvent): ActivityExplanation {
  const { type, tool, params, explanation } = activity;

  switch (type) {
    case 'file_write': {
      const path = (params?.file_path as string) || (params?.path as string) || 'unknown file';
      const filename = getFilename(path);
      const content = params?.content as string;
      const linesAdded = content ? content.split('\n').length : 0;

      return {
        summary: `Created/modified file: ${filename}`,
        details: `Writing ${linesAdded} lines to ${filename}. ${
          content?.includes('function') || content?.includes('class')
            ? 'Contains code definitions.'
            : 'Contains data or configuration.'
        }`,
        whyItMatters: 'File changes persist to disk and affect the codebase.',
        riskLevel: assessPathRisk(path),
      };
    }

    case 'file_read': {
      const path = (params?.file_path as string) || (params?.path as string) || 'unknown file';
      const filename = getFilename(path);
      const limit = params?.limit as number;

      return {
        summary: `Read file: ${filename}`,
        details: `Accessed ${filename}${limit ? ` (${limit} lines)` : ''} to understand context.`,
        whyItMatters: 'Reading files helps understand the codebase before making changes.',
        riskLevel: assessPathRisk(path),
      };
    }

    case 'tool_call': {
      const toolName = tool || 'unknown tool';
      const command = (params?.command as string) || '';

      if (toolName === 'Bash' || command) {
        const cmdPreview = command.length > 50 ? command.slice(0, 50) + '...' : command;
        return {
          summary: `Ran command: ${cmdPreview || toolName}`,
          details: `Executed shell command. ${
            command.includes('npm') ? 'Managing dependencies.' :
            command.includes('git') ? 'Version control operation.' :
            command.includes('test') ? 'Running tests.' :
            'System operation.'
          }`,
          whyItMatters: 'Shell commands can modify files, install packages, or execute programs.',
          riskLevel: command ? assessCommandRisk(command) : 'review',
        };
      }

      return {
        summary: `Used tool: ${toolName}`,
        details: explanation || `Invoked ${toolName} to perform an operation.`,
        whyItMatters: 'Tools extend agent capabilities beyond basic operations.',
        riskLevel: 'safe',
      };
    }

    case 'web_search': {
      const query = (params?.query as string) || 'unknown query';

      return {
        summary: `Searched web for: "${query.slice(0, 40)}${query.length > 40 ? '...' : ''}"`,
        details: `Research query to find information. Looking for relevant documentation or solutions.`,
        whyItMatters: 'Web searches gather external information to inform decisions.',
        riskLevel: 'safe',
      };
    }

    case 'web_fetch': {
      const url = (params?.url as string) || 'unknown URL';
      const hostname = url.includes('://') ? new URL(url).hostname : url.slice(0, 30);

      return {
        summary: `Fetched from: ${hostname}`,
        details: `Retrieved content from ${hostname}. Reading external documentation or API data.`,
        whyItMatters: 'Fetching web content provides detailed information from external sources.',
        riskLevel: url.includes('localhost') ? 'safe' : 'review',
      };
    }

    case 'memory_read': {
      const file = (params?.file as string) || (params?.path as string) || 'memory';

      return {
        summary: `Read from memory: ${getFilename(file)}`,
        details: `Accessed stored information for context. Using previous knowledge.`,
        whyItMatters: 'Memory access helps maintain context across sessions.',
        riskLevel: 'safe',
      };
    }

    case 'memory_write': {
      const file = (params?.file as string) || (params?.path as string) || 'memory';

      return {
        summary: `Updated memory: ${getFilename(file)}`,
        details: `Stored information for future reference. Building persistent knowledge.`,
        whyItMatters: 'Memory writes persist information across sessions.',
        riskLevel: 'safe',
      };
    }

    case 'memory_access': {
      return {
        summary: 'Accessed memory system',
        details: explanation || 'Interacted with the memory storage system.',
        whyItMatters: 'Memory operations maintain persistent context.',
        riskLevel: 'safe',
      };
    }

    case 'thinking': {
      const tokens = activity.tokens;
      const tokenCount = tokens ? tokens.input + tokens.output : 0;

      return {
        summary: 'Processing and reasoning',
        details: `Analyzed the situation${tokenCount ? ` using ${tokenCount.toLocaleString()} tokens` : ''}. Planning next steps.`,
        whyItMatters: 'Thinking time helps ensure quality responses and decisions.',
        riskLevel: 'safe',
      };
    }

    case 'subagent_spawn': {
      const task = (params?.task as string) || (params?.description as string) || 'subtask';

      return {
        summary: `Spawned subagent for: ${task.slice(0, 30)}${task.length > 30 ? '...' : ''}`,
        details: `Delegated a subtask to a specialized agent. Parallelizing work for efficiency.`,
        whyItMatters: 'Subagents can perform complex tasks autonomously.',
        riskLevel: 'review',
      };
    }

    case 'message_send': {
      const channel = (params?.channel as string) || 'unknown';

      return {
        summary: `Sent message to: ${channel}`,
        details: explanation || `Communicated through the ${channel} channel.`,
        whyItMatters: 'Messages may be sent to external systems or users.',
        riskLevel: channel.includes('external') ? 'review' : 'safe',
      };
    }

    case 'error': {
      const errorMsg = (params?.message as string) || explanation || 'Unknown error';

      return {
        summary: 'Error occurred',
        details: errorMsg.slice(0, 100) + (errorMsg.length > 100 ? '...' : ''),
        whyItMatters: 'Errors may indicate problems that need attention.',
        riskLevel: 'review',
      };
    }

    default:
      return {
        summary: explanation?.slice(0, 50) || `Activity: ${type}`,
        details: explanation || `Performed ${type} operation.`,
        whyItMatters: 'This action is part of the current workflow.',
        riskLevel: 'safe',
      };
  }
}

// Generate technical content for display
export function generateTechnicalContent(activity: ActivityEvent): TechnicalContent {
  const { type, params, tool } = activity;

  switch (type) {
    case 'file_write': {
      const path = (params?.file_path as string) || (params?.path as string) || '';
      const content = (params?.content as string) || '';
      const oldString = params?.old_string as string;
      const newString = params?.new_string as string;

      // If it's an edit (has old_string/new_string), show diff
      if (oldString !== undefined && newString !== undefined) {
        const diffContent = formatDiff(oldString, newString);
        return {
          type: 'diff',
          content: diffContent,
          language: getLanguageFromPath(path),
        };
      }

      // Otherwise show the full content
      return {
        type: 'content',
        content: content.slice(0, 2000) + (content.length > 2000 ? '\n... (truncated)' : ''),
        language: getLanguageFromPath(path),
      };
    }

    case 'file_read': {
      const path = (params?.file_path as string) || (params?.path as string) || '';
      const content = (params?.content as string) || (params?.result as string) || '';

      return {
        type: 'content',
        content: content.slice(0, 1000) + (content.length > 1000 ? '\n... (truncated)' : '') || `Reading: ${path}`,
        language: getLanguageFromPath(path),
      };
    }

    case 'tool_call': {
      const command = (params?.command as string) || '';
      const output = (params?.output as string) || (params?.result as string) || '';

      if (tool === 'Bash' || command) {
        return {
          type: 'output',
          content: `$ ${command}\n\n${output || '(no output)'}`.slice(0, 2000),
          language: 'bash',
        };
      }

      return {
        type: 'content',
        content: JSON.stringify(params, null, 2).slice(0, 1000),
        language: 'json',
      };
    }

    case 'web_search': {
      const query = (params?.query as string) || '';
      const results = (params?.results as unknown[]) || [];

      let content = `Query: "${query}"\n\n`;
      if (results.length > 0) {
        content += 'Results:\n';
        results.slice(0, 5).forEach((r: unknown, i: number) => {
          const result = r as { title?: string; url?: string };
          content += `${i + 1}. ${result.title || 'Untitled'}\n   ${result.url || ''}\n`;
        });
      }

      return {
        type: 'query',
        content,
        language: 'plaintext',
      };
    }

    case 'web_fetch': {
      const url = (params?.url as string) || '';
      const content = (params?.content as string) || (params?.result as string) || '';

      return {
        type: 'content',
        content: `URL: ${url}\n\n${content.slice(0, 1000)}${content.length > 1000 ? '\n... (truncated)' : ''}`,
        language: 'plaintext',
      };
    }

    case 'thinking': {
      const tokens = activity.tokens;

      return {
        type: 'tokens',
        content: tokens
          ? `Input tokens: ${tokens.input.toLocaleString()}\nOutput tokens: ${tokens.output.toLocaleString()}\nTotal: ${(tokens.input + tokens.output).toLocaleString()}`
          : 'Processing...',
        language: 'plaintext',
      };
    }

    case 'memory_write':
    case 'memory_read':
    case 'memory_access': {
      const file = (params?.file as string) || (params?.path as string) || '';
      const content = (params?.content as string) || (params?.preview as string) || '';

      return {
        type: 'content',
        content: content || `Accessing: ${file}`,
        language: file.endsWith('.json') ? 'json' : 'plaintext',
      };
    }

    case 'subagent_spawn': {
      const task = (params?.task as string) || (params?.description as string) || '';
      const agentType = (params?.subagent_type as string) || (params?.type as string) || 'general';

      return {
        type: 'content',
        content: `Agent Type: ${agentType}\n\nTask:\n${task}`,
        language: 'plaintext',
      };
    }

    case 'message_send': {
      const channel = (params?.channel as string) || '';
      const message = (params?.message as string) || (params?.content as string) || '';

      return {
        type: 'content',
        content: `Channel: ${channel}\n\n${message}`,
        language: 'plaintext',
      };
    }

    case 'error': {
      const message = (params?.message as string) || (params?.error as string) || activity.explanation;
      const stack = (params?.stack as string) || '';

      return {
        type: 'output',
        content: `Error: ${message}${stack ? `\n\nStack trace:\n${stack}` : ''}`,
        language: 'plaintext',
      };
    }

    default:
      return {
        type: 'content',
        content: params ? JSON.stringify(params, null, 2) : 'No additional details',
        language: 'json',
      };
  }
}

// Simple diff formatter
function formatDiff(oldStr: string, newStr: string): string {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');

  let diff = '';

  // Show removed lines
  oldLines.forEach((line) => {
    diff += `- ${line}\n`;
  });

  // Show added lines
  newLines.forEach((line) => {
    diff += `+ ${line}\n`;
  });

  return diff;
}

// Risk level to emoji mapping
export function getRiskEmoji(level: RiskLevel): string {
  switch (level) {
    case 'safe':
      return '🟢';
    case 'review':
      return '🟡';
    case 'sensitive':
      return '🔴';
    default:
      return '⚪';
  }
}

// Risk level to description
export function getRiskDescription(level: RiskLevel): string {
  switch (level) {
    case 'safe':
      return 'Normal operation';
    case 'review':
      return 'Worth checking';
    case 'sensitive':
      return 'Requires attention';
    default:
      return 'Unknown';
  }
}
