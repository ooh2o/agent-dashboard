import type { AppDefinition } from '@/components/os/types';

export const APPS: AppDefinition[] = [
  {
    id: 'activity-monitor',
    name: 'Activity Monitor',
    icon: '📊',
    shortcut: '⌘1',
  },
  {
    id: 'memory-browser',
    name: 'Memory Browser',
    icon: '🧠',
    shortcut: '⌘2',
  },
  {
    id: 'message-center',
    name: 'Message Center',
    icon: '💬',
    shortcut: '⌘3',
  },
  {
    id: 'cost-dashboard',
    name: 'Cost Dashboard',
    icon: '💰',
    shortcut: '⌘4',
  },
  {
    id: 'agent-spawner',
    name: 'Agent Spawner',
    icon: '🤖',
    shortcut: '⌘5',
  },
  {
    id: 'file-browser',
    name: 'File Browser',
    icon: '📁',
    shortcut: '⌘6',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    shortcut: '⌘,',
  },
  {
    id: 'tools-inspector',
    name: 'Tools Inspector',
    icon: '🔧',
  },
  {
    id: 'calendar',
    name: 'Calendar & Cron',
    icon: '📅',
  },
  {
    id: 'notifications',
    name: 'Notification Center',
    icon: '🔔',
  },
  {
    id: 'terminal',
    name: 'Terminal Console',
    icon: '🖥️',
    shortcut: '⌘T',
  },
  {
    id: 'task-queue',
    name: 'Task Queue',
    icon: '🎯',
  },
  {
    id: 'workflows',
    name: 'Workflows',
    icon: '⚡',
    shortcut: '⌘W',
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    icon: '📈',
    shortcut: '⌘A',
  },
];

export const getApp = (id: string): AppDefinition | undefined => {
  return APPS.find(app => app.id === id);
};

export const DOCK_APPS = [
  'activity-monitor',
  'memory-browser',
  'message-center',
  'agent-spawner',
  'terminal',
  'settings',
];
