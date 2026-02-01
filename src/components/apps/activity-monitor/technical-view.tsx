'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ActivityEvent } from '@/lib/types';
import {
  generateTechnicalContent,
  TechnicalContent,
} from '@/lib/activity-explanations';
import { cn } from '@/lib/utils';

interface TechnicalViewProps {
  activity: ActivityEvent;
  className?: string;
}

// Simple syntax highlighting for common patterns
function highlightCode(content: string, language: string): React.ReactNode {
  if (language === 'plaintext' || !content) {
    return <span className="text-zinc-300">{content}</span>;
  }

  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, i) => (
        <div key={i} className="leading-relaxed">
          {highlightLine(line, language)}
        </div>
      ))}
    </>
  );
}

function highlightLine(line: string, language: string): React.ReactNode {
  // Diff highlighting
  if (line.startsWith('+ ')) {
    return (
      <span className="bg-green-500/20 text-green-400 block px-1 -mx-1">
        {line}
      </span>
    );
  }
  if (line.startsWith('- ')) {
    return (
      <span className="bg-red-500/20 text-red-400 block px-1 -mx-1">
        {line}
      </span>
    );
  }

  // Command prompt
  if (line.startsWith('$ ')) {
    return (
      <>
        <span className="text-emerald-400">$ </span>
        <span className="text-zinc-200">{line.slice(2)}</span>
      </>
    );
  }

  // URL highlighting
  if (line.startsWith('URL:') || line.startsWith('Query:')) {
    const [label, ...rest] = line.split(':');
    return (
      <>
        <span className="text-purple-400">{label}:</span>
        <span className="text-blue-300">{rest.join(':')}</span>
      </>
    );
  }

  // Error highlighting
  if (line.toLowerCase().includes('error')) {
    return <span className="text-red-400">{line}</span>;
  }

  // Basic keyword highlighting for code
  if (['typescript', 'javascript', 'json'].includes(language)) {
    return highlightJSLine(line);
  }

  if (language === 'bash') {
    return highlightBashLine(line);
  }

  return <span className="text-zinc-300">{line}</span>;
}

function highlightJSLine(line: string): React.ReactNode {
  // Simple regex-based highlighting
  const keywords = /\b(const|let|var|function|class|export|import|from|return|if|else|for|while|async|await|new|this|true|false|null|undefined)\b/g;
  const strings = /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/g;

  const segments: { start: number; end: number; type: string; content: string }[] = [];

  // Find all matches
  let match;

  // Comments first (highest priority)
  while ((match = comments.exec(line)) !== null) {
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'comment',
      content: match[0],
    });
  }

  // Strings
  while ((match = strings.exec(line)) !== null) {
    const overlaps = segments.some(
      (s) => match!.index >= s.start && match!.index < s.end
    );
    if (!overlaps) {
      segments.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'string',
        content: match[0],
      });
    }
  }

  // Keywords
  while ((match = keywords.exec(line)) !== null) {
    const overlaps = segments.some(
      (s) => match!.index >= s.start && match!.index < s.end
    );
    if (!overlaps) {
      segments.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'keyword',
        content: match[0],
      });
    }
  }

  // Numbers
  while ((match = numbers.exec(line)) !== null) {
    const overlaps = segments.some(
      (s) => match!.index >= s.start && match!.index < s.end
    );
    if (!overlaps) {
      segments.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'number',
        content: match[0],
      });
    }
  }

  // Sort by position
  segments.sort((a, b) => a.start - b.start);

  // Build result
  if (segments.length === 0) {
    return <span className="text-zinc-300">{line}</span>;
  }

  const elements: React.ReactNode[] = [];
  let lastEnd = 0;

  segments.forEach((seg, i) => {
    // Add text before this segment
    if (seg.start > lastEnd) {
      elements.push(
        <span key={`text-${i}`} className="text-zinc-300">
          {line.slice(lastEnd, seg.start)}
        </span>
      );
    }

    // Add highlighted segment
    const colorClass =
      seg.type === 'keyword'
        ? 'text-purple-400'
        : seg.type === 'string'
        ? 'text-amber-300'
        : seg.type === 'number'
        ? 'text-cyan-400'
        : seg.type === 'comment'
        ? 'text-zinc-500 italic'
        : 'text-zinc-300';

    elements.push(
      <span key={`seg-${i}`} className={colorClass}>
        {seg.content}
      </span>
    );

    lastEnd = seg.end;
  });

  // Add remaining text
  if (lastEnd < line.length) {
    elements.push(
      <span key="text-end" className="text-zinc-300">
        {line.slice(lastEnd)}
      </span>
    );
  }

  return <>{elements}</>;
}

function highlightBashLine(line: string): React.ReactNode {
  // Highlight common bash patterns
  const commands = /^(\w+)/;
  const flags = /(\s-{1,2}[\w-]+)/g;
  const paths = /(\/[\w./-]+)/g;

  const match = commands.exec(line);
  if (match) {
    const cmd = match[1];
    const rest = line.slice(cmd.length);

    return (
      <>
        <span className="text-emerald-400">{cmd}</span>
        <span className="text-zinc-300">
          {rest.replace(flags, (m) => `\x00flag${m}\x00`).replace(paths, (m) => `\x00path${m}\x00`).split('\x00').map((part, i) => {
            if (part.startsWith('flag')) {
              return <span key={i} className="text-cyan-400">{part.slice(4)}</span>;
            }
            if (part.startsWith('path')) {
              return <span key={i} className="text-yellow-300">{part.slice(4)}</span>;
            }
            return part;
          })}
        </span>
      </>
    );
  }

  return <span className="text-zinc-300">{line}</span>;
}

function getTypeLabel(type: TechnicalContent['type']): string {
  switch (type) {
    case 'diff':
      return 'Changes';
    case 'output':
      return 'Output';
    case 'content':
      return 'Content';
    case 'query':
      return 'Query';
    case 'tokens':
      return 'Usage';
    default:
      return 'Details';
  }
}

export function TechnicalView({ activity, className }: TechnicalViewProps) {
  const technicalContent = useMemo(
    () => generateTechnicalContent(activity),
    [activity]
  );

  const path =
    (activity.params?.file_path as string) ||
    (activity.params?.path as string) ||
    '';

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/50 bg-zinc-800/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔧</span>
          <span className="text-sm font-medium text-zinc-300">Technical</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-zinc-600 text-zinc-400"
          >
            {getTypeLabel(technicalContent.type)}
          </Badge>
          {technicalContent.language && technicalContent.language !== 'plaintext' && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-zinc-600 text-zinc-400"
            >
              {technicalContent.language}
            </Badge>
          )}
        </div>
      </div>

      {/* File path if available */}
      {path && (
        <div className="px-3 py-1.5 border-b border-zinc-700/30 bg-zinc-800/20">
          <span className="text-xs text-zinc-500 font-mono">{path}</span>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          <pre className="text-xs font-mono whitespace-pre-wrap break-all">
            {highlightCode(technicalContent.content, technicalContent.language || 'plaintext')}
          </pre>
        </div>
      </ScrollArea>
    </div>
  );
}
