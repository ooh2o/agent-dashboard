'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { TerminalEntry } from './types';
import { ChevronRight, AlertCircle, CheckCircle, Loader2, Bot, Terminal } from 'lucide-react';

interface TerminalOutputProps {
  entries: TerminalEntry[];
  isDebugMode: boolean;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

const entryConfig: Record<TerminalEntry['type'], { color: string; icon?: React.ElementType }> = {
  command: { color: 'text-green-400', icon: ChevronRight },
  output: { color: 'text-zinc-300' },
  error: { color: 'text-red-400', icon: AlertCircle },
  system: { color: 'text-yellow-400', icon: Terminal },
  'chief-response': { color: 'text-blue-400', icon: Bot },
};

const statusIcons = {
  pending: Loader2,
  running: Loader2,
  success: CheckCircle,
  error: AlertCircle,
};

const statusColors = {
  pending: 'text-zinc-500',
  running: 'text-yellow-400 animate-spin',
  success: 'text-green-400',
  error: 'text-red-400',
};

export function TerminalOutput({ entries, isDebugMode }: TerminalOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <ScrollArea className="flex-1 font-mono text-sm" ref={scrollRef}>
      <div className="p-4 space-y-1">
        {/* Welcome message */}
        <div className="text-zinc-500 mb-4">
          <pre className="text-xs leading-tight text-cyan-500/70">
{`   ____                   ________
  / __ \\___  ___ ___     / ___/ /__ __    __
 / /_/ / _ \\/ -_) _ \\   / /__/ / _ \`/ |/|/ /
 \\____/ .__/\\__/_//_/   \\___/_/\\_,_/|__,__/
     /_/            Terminal Console v1.0`}
          </pre>
          <p className="mt-2 text-zinc-500">
            Type <span className="text-green-400">help</span> for available commands,
            or send a message directly to Chief.
          </p>
          <p className="text-zinc-600">
            Debug mode: <span className={isDebugMode ? 'text-green-400' : 'text-zinc-500'}>
              {isDebugMode ? 'ON' : 'OFF'}
            </span>
          </p>
          <div className="border-b border-zinc-800 mt-3" />
        </div>

        <AnimatePresence initial={false}>
          {entries.map((entry, index) => {
            const config = entryConfig[entry.type];
            const Icon = config.icon;
            const StatusIcon = entry.status ? statusIcons[entry.status] : null;

            // Filter debug output if not in debug mode
            if (!isDebugMode && entry.type === 'output' && entry.content.startsWith('[DEBUG]')) {
              return null;
            }

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="flex items-start gap-2 group"
              >
                {/* Timestamp (shown on hover or always in debug mode) */}
                <span className={cn(
                  'shrink-0 text-[10px] w-16 text-zinc-600 font-mono tabular-nums',
                  !isDebugMode && 'opacity-0 group-hover:opacity-100 transition-opacity'
                )}>
                  {formatTimestamp(entry.timestamp)}
                </span>

                {/* Icon */}
                <span className={cn('shrink-0 w-4', config.color)}>
                  {Icon && <Icon className="h-4 w-4" />}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {entry.type === 'command' && (
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">$</span>
                      <span className={config.color}>{entry.content}</span>
                      {StatusIcon && entry.status && (
                        <StatusIcon className={cn('h-3 w-3', statusColors[entry.status])} />
                      )}
                      {entry.executionTime !== undefined && entry.status === 'success' && (
                        <span className="text-zinc-600 text-xs">
                          ({entry.executionTime}ms)
                        </span>
                      )}
                    </div>
                  )}

                  {entry.type === 'output' && (
                    <pre className={cn('whitespace-pre-wrap break-words', config.color)}>
                      {entry.content}
                    </pre>
                  )}

                  {entry.type === 'error' && (
                    <pre className={cn('whitespace-pre-wrap break-words', config.color)}>
                      {entry.content}
                    </pre>
                  )}

                  {entry.type === 'system' && (
                    <span className={cn('italic', config.color)}>
                      {entry.content}
                    </span>
                  )}

                  {entry.type === 'chief-response' && (
                    <div className={cn('rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 mt-1', config.color)}>
                      <div className="flex items-center gap-2 mb-1 text-xs text-blue-300">
                        <Bot className="h-3 w-3" />
                        Chief
                      </div>
                      <pre className="whitespace-pre-wrap break-words text-zinc-200">
                        {entry.content}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {entries.length === 0 && (
          <div className="text-zinc-600 py-4">
            No output yet. Try running a command.
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
