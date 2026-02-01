'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TerminalInput } from './terminal-input';
import { TerminalOutput } from './terminal-output';
import { TerminalEntry } from './types';
import { cn } from '@/lib/utils';
import {
  Terminal as TerminalIcon,
  Bug,
  Trash2,
  Download,
  Wifi,
  WifiOff,
  Circle,
  Maximize2,
  Minus,
  X,
} from 'lucide-react';

// Built-in commands
const BUILTIN_COMMANDS: Record<string, { description: string; handler: (args: string[]) => string }> = {
  help: {
    description: 'Show available commands',
    handler: () => `Available commands:
  help          - Show this help message
  clear         - Clear the terminal
  debug [on|off] - Toggle debug mode
  status        - Show connection status
  history       - Show command history
  chief <msg>   - Send a message to Chief
  gateway <cmd> - Run a gateway command

Type any other text to send directly to Chief.`,
  },
  status: {
    description: 'Show connection status',
    handler: () => 'Connected to OpenClaw Gateway at localhost:4280',
  },
};

export function TerminalConsole() {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  const addEntry = useCallback((entry: Omit<TerminalEntry, 'id' | 'timestamp'>) => {
    const newEntry: TerminalEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setEntries((prev) => [...prev, newEntry]);
    return newEntry.id;
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<TerminalEntry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  }, []);

  const clearTerminal = useCallback(() => {
    setEntries([]);
    addEntry({ type: 'system', content: 'Terminal cleared.' });
  }, [addEntry]);

  const handleCommand = useCallback(
    async (input: string) => {
      // Add to history
      setCommandHistory((prev) => [...prev, input]);

      // Parse command
      const parts = input.trim().split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      // Add command entry
      const commandId = addEntry({
        type: 'command',
        content: input,
        status: 'running',
      });

      // Handle built-in commands
      if (command === 'clear') {
        clearTerminal();
        return;
      }

      if (command === 'debug') {
        const mode = args[0]?.toLowerCase();
        if (mode === 'on') {
          setIsDebugMode(true);
          addEntry({ type: 'system', content: 'Debug mode enabled.' });
        } else if (mode === 'off') {
          setIsDebugMode(false);
          addEntry({ type: 'system', content: 'Debug mode disabled.' });
        } else {
          setIsDebugMode((prev) => !prev);
          addEntry({
            type: 'system',
            content: `Debug mode ${!isDebugMode ? 'enabled' : 'disabled'}.`,
          });
        }
        updateEntry(commandId, { status: 'success', executionTime: 0 });
        return;
      }

      if (command === 'history') {
        const historyOutput = commandHistory
          .map((cmd, i) => `  ${i + 1}  ${cmd}`)
          .join('\n');
        addEntry({
          type: 'output',
          content: historyOutput || '  No commands in history.',
        });
        updateEntry(commandId, { status: 'success', executionTime: 0 });
        return;
      }

      if (BUILTIN_COMMANDS[command]) {
        const output = BUILTIN_COMMANDS[command].handler(args);
        addEntry({ type: 'output', content: output });
        updateEntry(commandId, { status: 'success', executionTime: 0 });
        return;
      }

      // Handle chief command or direct message
      const isChiefCommand = command === 'chief';
      const message = isChiefCommand ? args.join(' ') : input;

      if (!message.trim()) {
        addEntry({ type: 'error', content: 'Usage: chief <message>' });
        updateEntry(commandId, { status: 'error', executionTime: 0 });
        return;
      }

      // Simulate sending to Chief
      const startTime = Date.now();

      if (isDebugMode) {
        addEntry({
          type: 'output',
          content: `[DEBUG] Sending to Chief: "${message}"`,
        });
      }

      // Simulate async response
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));

      const executionTime = Date.now() - startTime;

      // Simulate Chief response
      const responses = [
        `I've processed your request: "${message}". How can I help further?`,
        `Understood. Working on "${message}" now. I'll update you when complete.`,
        `Got it! "${message}" has been queued for processing.`,
        `Analyzing your request... Done! Here's what I found regarding "${message}": All systems operational.`,
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];

      addEntry({
        type: 'chief-response',
        content: response,
      });

      updateEntry(commandId, { status: 'success', executionTime });
    },
    [addEntry, updateEntry, clearTerminal, isDebugMode, commandHistory]
  );

  const exportLogs = useCallback(() => {
    const logContent = entries
      .map((e) => `[${e.timestamp.toISOString()}] [${e.type.toUpperCase()}] ${e.content}`)
      .join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-log-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addEntry({ type: 'system', content: 'Logs exported successfully.' });
  }, [entries, addEntry]);

  return (
    <Card className="h-full flex flex-col border-zinc-800 bg-[#1a1a1a] overflow-hidden">
      {/* Window chrome - iTerm style */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-b from-zinc-800 to-zinc-800/90 border-b border-zinc-700">
        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button className="group h-3 w-3 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center">
              <X className="h-2 w-2 text-red-900 opacity-0 group-hover:opacity-100" />
            </button>
            <button className="group h-3 w-3 rounded-full bg-yellow-500 hover:bg-yellow-400 flex items-center justify-center">
              <Minus className="h-2 w-2 text-yellow-900 opacity-0 group-hover:opacity-100" />
            </button>
            <button className="group h-3 w-3 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center">
              <Maximize2 className="h-1.5 w-1.5 text-green-900 opacity-0 group-hover:opacity-100" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 text-zinc-400">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Terminal — openclaw@chief</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsDebugMode(!isDebugMode)}
            className={cn(
              'text-zinc-500 hover:text-zinc-300',
              isDebugMode && 'text-yellow-400 hover:text-yellow-300'
            )}
            title={isDebugMode ? 'Disable debug mode' : 'Enable debug mode'}
          >
            <Bug className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={exportLogs}
            className="text-zinc-500 hover:text-zinc-300"
            title="Export logs"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={clearTerminal}
            className="text-zinc-500 hover:text-zinc-300"
            title="Clear terminal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/80 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <>
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                <span className="text-green-400">Connected</span>
              </>
            ) : (
              <>
                <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                <span className="text-red-400">Disconnected</span>
              </>
            )}
          </div>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-500">gateway: localhost:4280</span>
        </div>
        <div className="flex items-center gap-2">
          {isDebugMode && (
            <Badge variant="outline" className="text-[10px] py-0 h-4 border-yellow-500/50 text-yellow-400">
              DEBUG
            </Badge>
          )}
          <span className="text-zinc-600">{entries.length} entries</span>
        </div>
      </div>

      {/* Output area */}
      <TerminalOutput entries={entries} isDebugMode={isDebugMode} />

      {/* Input */}
      <TerminalInput
        onSubmit={handleCommand}
        disabled={!isConnected}
        history={commandHistory}
      />
    </Card>
  );
}

export { TerminalInput } from './terminal-input';
export { TerminalOutput } from './terminal-output';
export * from './types';
