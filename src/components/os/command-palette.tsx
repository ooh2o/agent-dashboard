'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  Settings,
  Activity,
  Brain,
  MessageSquare,
  DollarSign,
  Bot,
  Folder,
  Wrench,
  Calendar,
  Bell,
  Terminal,
  ListTodo,
  Moon,
  Sun,
  Plus,
  X,
  Keyboard,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useKeyboardShortcuts,
  useArrowNavigation,
  useFocusTrap,
  formatKeyDisplay,
  MOD_KEY,
} from '@/hooks/use-keyboard-shortcuts';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ElementType;
  category: string;
  keywords?: string[];
  shortcut?: string[];
  action: () => void;
  disabled?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands?: CommandItem[];
  placeholder?: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  Apps: Command,
  Navigation: ExternalLink,
  Actions: Wrench,
  Settings: Settings,
  Help: HelpCircle,
};

const categoryOrder = ['Apps', 'Navigation', 'Actions', 'Settings', 'Help'];

export function CommandPalette({
  isOpen,
  onClose,
  commands = [],
  placeholder = 'Search commands...',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus trap when open
  useFocusTrap(containerRef, isOpen);

  // Filter and group commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands.filter(cmd => !cmd.disabled);

    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => {
      if (cmd.disabled) return false;
      const matchLabel = cmd.label.toLowerCase().includes(lowerQuery);
      const matchDesc = cmd.description?.toLowerCase().includes(lowerQuery);
      const matchCategory = cmd.category.toLowerCase().includes(lowerQuery);
      const matchKeywords = cmd.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery));
      return matchLabel || matchDesc || matchCategory || matchKeywords;
    });
  }, [commands, query]);

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups = new Map<string, CommandItem[]>();
    filteredCommands.forEach(cmd => {
      const existing = groups.get(cmd.category) || [];
      groups.set(cmd.category, [...existing, cmd]);
    });
    // Sort by category order
    return new Map(
      [...groups.entries()].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a[0]);
        const indexB = categoryOrder.indexOf(b[0]);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      })
    );
  }, [filteredCommands]);

  // Flatten for index navigation
  const flatCommands = useMemo(() => {
    const result: CommandItem[] = [];
    groupedCommands.forEach(items => result.push(...items));
    return result;
  }, [groupedCommands]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Small delay to ensure animation started
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current || flatCommands.length === 0) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    selectedEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex, flatCommands.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(i => (i + 1) % Math.max(1, flatCommands.length));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(i => (i - 1 + flatCommands.length) % Math.max(1, flatCommands.length));
        break;
      case 'Enter':
        event.preventDefault();
        if (flatCommands[selectedIndex]) {
          flatCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      case 'Tab':
        event.preventDefault(); // Trap tab within palette
        break;
    }
  }, [flatCommands, selectedIndex, onClose]);

  const executeCommand = useCallback((cmd: CommandItem) => {
    cmd.action();
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Palette */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
              {/* Search Input */}
              <div className="flex items-center gap-3 border-b border-zinc-800 px-4">
                <Search className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="h-14 border-0 bg-transparent text-base text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label="Search commands"
                  aria-controls="command-list"
                  aria-activedescendant={flatCommands[selectedIndex]?.id}
                  role="combobox"
                  aria-expanded="true"
                  aria-haspopup="listbox"
                />
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                  aria-label="Close command palette"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Command List */}
              <div
                ref={listRef}
                id="command-list"
                role="listbox"
                aria-label="Commands"
                className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2"
              >
                {flatCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-zinc-500">No commands found</p>
                    <p className="mt-1 text-xs text-zinc-600">Try a different search term</p>
                  </div>
                ) : (
                  <>
                    {Array.from(groupedCommands.entries()).map(([category, items]) => {
                      const CategoryIcon = categoryIcons[category] || Command;
                      return (
                        <div key={category} className="mb-2 last:mb-0">
                          {/* Category Header */}
                          <div className="flex items-center gap-2 px-2 py-1.5">
                            <CategoryIcon className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />
                            <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                              {category}
                            </span>
                          </div>

                          {/* Category Items */}
                          <div role="group" aria-label={category}>
                            {items.map(cmd => {
                              const globalIndex = flatCommands.indexOf(cmd);
                              const isSelected = globalIndex === selectedIndex;
                              const Icon = cmd.icon || Command;

                              return (
                                <button
                                  key={cmd.id}
                                  id={cmd.id}
                                  data-index={globalIndex}
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => executeCommand(cmd)}
                                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                                  className={`
                                    group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left
                                    transition-colors duration-75
                                    ${isSelected
                                      ? 'bg-blue-600/20 text-white'
                                      : 'text-zinc-300 hover:bg-zinc-800/70'
                                    }
                                  `}
                                >
                                  <div
                                    className={`
                                      flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                                      ${isSelected ? 'bg-blue-600/30' : 'bg-zinc-800'}
                                    `}
                                  >
                                    <Icon
                                      className={`h-4 w-4 ${isSelected ? 'text-blue-400' : 'text-zinc-400'}`}
                                      aria-hidden="true"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{cmd.label}</p>
                                    {cmd.description && (
                                      <p className="text-xs text-zinc-500 truncate">{cmd.description}</p>
                                    )}
                                  </div>
                                  {cmd.shortcut && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      {cmd.shortcut.map((key, i) => (
                                        <kbd
                                          key={i}
                                          className={`
                                            inline-flex h-5 min-w-[20px] items-center justify-center rounded px-1.5
                                            text-[10px] font-medium
                                            ${isSelected
                                              ? 'bg-blue-600/40 text-blue-200'
                                              : 'bg-zinc-800 text-zinc-400'
                                            }
                                          `}
                                        >
                                          {formatKeyDisplay([key])}
                                        </kbd>
                                      ))}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1 text-[10px] font-medium text-zinc-400">
                      ↑
                    </kbd>
                    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1 text-[10px] font-medium text-zinc-400">
                      ↓
                    </kbd>
                    <span className="ml-1">Navigate</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1 text-[10px] font-medium text-zinc-400">
                      ↵
                    </kbd>
                    <span className="ml-1">Select</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1 text-[10px] font-medium text-zinc-400">
                      Esc
                    </kbd>
                    <span className="ml-1">Close</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Keyboard className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />
                  <span className="text-xs text-zinc-600">{flatCommands.length} commands</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Default commands for the OS
export function useDefaultCommands(callbacks: {
  openApp?: (appId: string) => void;
  toggleTheme?: () => void;
  showShortcuts?: () => void;
}): CommandItem[] {
  return useMemo(() => [
    // Apps
    {
      id: 'app-activity',
      label: 'Activity Monitor',
      description: 'View real-time agent activity',
      icon: Activity,
      category: 'Apps',
      keywords: ['logs', 'events', 'monitor'],
      shortcut: [MOD_KEY, '1'],
      action: () => callbacks.openApp?.('activity-monitor'),
    },
    {
      id: 'app-memory',
      label: 'Memory Browser',
      description: 'Explore agent memory files',
      icon: Brain,
      category: 'Apps',
      keywords: ['memory', 'knowledge', 'notes'],
      shortcut: [MOD_KEY, '2'],
      action: () => callbacks.openApp?.('memory-browser'),
    },
    {
      id: 'app-messages',
      label: 'Message Center',
      description: 'Unified inbox for all channels',
      icon: MessageSquare,
      category: 'Apps',
      keywords: ['chat', 'inbox', 'telegram', 'discord'],
      shortcut: [MOD_KEY, '3'],
      action: () => callbacks.openApp?.('message-center'),
    },
    {
      id: 'app-costs',
      label: 'Cost Dashboard',
      description: 'Track token usage and costs',
      icon: DollarSign,
      category: 'Apps',
      keywords: ['tokens', 'money', 'budget', 'billing'],
      shortcut: [MOD_KEY, '4'],
      action: () => callbacks.openApp?.('cost-dashboard'),
    },
    {
      id: 'app-spawner',
      label: 'Agent Spawner',
      description: 'Launch and manage sub-agents',
      icon: Bot,
      category: 'Apps',
      keywords: ['spawn', 'agents', 'create'],
      shortcut: [MOD_KEY, '5'],
      action: () => callbacks.openApp?.('agent-spawner'),
    },
    {
      id: 'app-files',
      label: 'File Browser',
      description: 'Browse workspace files',
      icon: Folder,
      category: 'Apps',
      keywords: ['files', 'folders', 'workspace'],
      shortcut: [MOD_KEY, '6'],
      action: () => callbacks.openApp?.('file-browser'),
    },
    {
      id: 'app-settings',
      label: 'Settings',
      description: 'Configure preferences',
      icon: Settings,
      category: 'Apps',
      keywords: ['preferences', 'config', 'options'],
      shortcut: [MOD_KEY, ','],
      action: () => callbacks.openApp?.('settings'),
    },
    {
      id: 'app-tools',
      label: 'Tools Inspector',
      description: 'View and test available tools',
      icon: Wrench,
      category: 'Apps',
      keywords: ['tools', 'functions', 'capabilities'],
      shortcut: [MOD_KEY, '7'],
      action: () => callbacks.openApp?.('tools-inspector'),
    },
    {
      id: 'app-calendar',
      label: 'Calendar & Cron',
      description: 'Scheduled tasks and reminders',
      icon: Calendar,
      category: 'Apps',
      keywords: ['schedule', 'cron', 'reminders'],
      shortcut: [MOD_KEY, '8'],
      action: () => callbacks.openApp?.('calendar'),
    },
    {
      id: 'app-notifications',
      label: 'Notification Center',
      description: 'View all notifications',
      icon: Bell,
      category: 'Apps',
      keywords: ['alerts', 'notifications'],
      shortcut: [MOD_KEY, '9'],
      action: () => callbacks.openApp?.('notifications'),
    },
    {
      id: 'app-terminal',
      label: 'Terminal Console',
      description: 'Direct command interface',
      icon: Terminal,
      category: 'Apps',
      keywords: ['console', 'cli', 'terminal'],
      shortcut: [MOD_KEY, '`'],
      action: () => callbacks.openApp?.('terminal'),
    },
    {
      id: 'app-tasks',
      label: 'Task Queue',
      description: 'Manage pending work',
      icon: ListTodo,
      category: 'Apps',
      keywords: ['tasks', 'queue', 'todo'],
      shortcut: [MOD_KEY, '0'],
      action: () => callbacks.openApp?.('task-queue'),
    },

    // Actions
    {
      id: 'action-new-agent',
      label: 'New Agent',
      description: 'Spawn a new sub-agent',
      icon: Plus,
      category: 'Actions',
      keywords: ['create', 'spawn', 'new'],
      shortcut: [MOD_KEY, 'n'],
      action: () => callbacks.openApp?.('agent-spawner'),
    },

    // Settings
    {
      id: 'settings-theme',
      label: 'Toggle Theme',
      description: 'Switch between dark and light mode',
      icon: Moon,
      category: 'Settings',
      keywords: ['dark', 'light', 'theme', 'mode'],
      shortcut: [MOD_KEY, 'Shift', 't'],
      action: () => callbacks.toggleTheme?.(),
    },

    // Help
    {
      id: 'help-shortcuts',
      label: 'Keyboard Shortcuts',
      description: 'View all keyboard shortcuts',
      icon: Keyboard,
      category: 'Help',
      keywords: ['keys', 'hotkeys', 'bindings'],
      shortcut: [MOD_KEY, '/'],
      action: () => callbacks.showShortcuts?.(),
    },
    {
      id: 'help-docs',
      label: 'Documentation',
      description: 'Open OpenClaw documentation',
      icon: HelpCircle,
      category: 'Help',
      keywords: ['help', 'docs', 'guide'],
      action: () => window.open('https://docs.openclaw.ai', '_blank'),
    },
  ], [callbacks]);
}

// Shortcut display component
export function ShortcutHint({ keys, className = '' }: { keys: string[]; className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1.5 text-[10px] font-medium text-zinc-400"
        >
          {formatKeyDisplay([key])}
        </kbd>
      ))}
    </div>
  );
}
