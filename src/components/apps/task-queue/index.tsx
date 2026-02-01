'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  ListTodo,
  Clock,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  X,
  RotateCcw,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Flame,
  ArrowUp,
  Minus,
  ArrowDown,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QueuedTask, TaskPriority, QueuedTaskStatus } from '@/lib/types';

const priorityConfig: Record<
  TaskPriority,
  { color: string; bgColor: string; icon: React.ElementType; label: string }
> = {
  critical: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    icon: Flame,
    label: 'Critical',
  },
  high: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 border-orange-500/30',
    icon: ArrowUp,
    label: 'High',
  },
  normal: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    icon: Minus,
    label: 'Normal',
  },
  low: {
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/20 border-zinc-500/30',
    icon: ArrowDown,
    label: 'Low',
  },
};

const statusConfig: Record<
  QueuedTaskStatus,
  { color: string; icon: React.ElementType; label: string }
> = {
  pending: { color: 'text-zinc-400', icon: Clock, label: 'Pending' },
  running: { color: 'text-green-400', icon: Loader2, label: 'Running' },
  completed: { color: 'text-blue-400', icon: CheckCircle2, label: 'Completed' },
  failed: { color: 'text-red-400', icon: XCircle, label: 'Failed' },
  cancelled: { color: 'text-zinc-500', icon: X, label: 'Cancelled' },
};

// Demo data
const initialTasks: QueuedTask[] = [
  {
    id: 'task-1',
    title: 'Deploy production build',
    description: 'Build and deploy the latest changes to production environment',
    priority: 'critical',
    status: 'running',
    progress: 45,
    createdAt: new Date(Date.now() - 600000),
    startedAt: new Date(Date.now() - 120000),
    assignedAgent: 'DevOps Agent #1',
  },
  {
    id: 'task-2',
    title: 'Generate API documentation',
    description: 'Auto-generate OpenAPI docs from codebase',
    priority: 'high',
    status: 'pending',
    createdAt: new Date(Date.now() - 900000),
  },
  {
    id: 'task-3',
    title: 'Run security audit',
    description: 'Scan dependencies for vulnerabilities',
    priority: 'high',
    status: 'pending',
    createdAt: new Date(Date.now() - 1200000),
  },
  {
    id: 'task-4',
    title: 'Optimize database queries',
    description: 'Analyze and optimize slow queries in the main database',
    priority: 'normal',
    status: 'pending',
    createdAt: new Date(Date.now() - 1800000),
  },
  {
    id: 'task-5',
    title: 'Update README',
    description: 'Update project README with latest changes',
    priority: 'low',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'task-6',
    title: 'Migrate user data',
    description: 'Failed to migrate due to schema mismatch',
    priority: 'critical',
    status: 'failed',
    createdAt: new Date(Date.now() - 7200000),
    retryCount: 2,
    maxRetries: 3,
  },
];

export function TaskQueue() {
  const [tasks, setTasks] = useState<QueuedTask[]>(initialTasks);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const runningTasks = tasks.filter((t) => t.status === 'running');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const failedTasks = tasks.filter((t) => t.status === 'failed');

  const handleCancel = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'cancelled' as QueuedTaskStatus } : t))
    );
  };

  const handleRetry = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'pending' as QueuedTaskStatus,
              retryCount: (t.retryCount || 0) + 1,
            }
          : t
      )
    );
  };

  const handlePriorityChange = (taskId: string, direction: 'up' | 'down') => {
    const priorityOrder: TaskPriority[] = ['low', 'normal', 'high', 'critical'];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentIndex = priorityOrder.indexOf(t.priority);
        const newIndex =
          direction === 'up'
            ? Math.min(currentIndex + 1, priorityOrder.length - 1)
            : Math.max(currentIndex - 1, 0);
        return { ...t, priority: priorityOrder[newIndex] };
      })
    );
  };

  const handleRemove = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Pending', count: pendingTasks.length, color: 'text-zinc-400' },
          { label: 'Running', count: runningTasks.length, color: 'text-green-400' },
          { label: 'Completed', count: completedTasks.length, color: 'text-blue-400' },
          { label: 'Failed', count: failedTasks.length, color: 'text-red-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-center"
          >
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.count}</p>
            <p className="text-xs text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Task List */}
      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur flex-1 min-h-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <ListTodo className="h-5 w-5 text-cyan-400" />
            Task Queue
            <Badge variant="secondary" className="ml-auto bg-zinc-800 text-zinc-300">
              {pendingTasks.length + runningTasks.length} queued
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px]">
            <div className="px-4 pb-4 space-y-2">
              <AnimatePresence initial={false}>
                {tasks
                  .filter((t) => t.status !== 'cancelled' && t.status !== 'completed')
                  .sort((a, b) => {
                    // Sort by status (running first), then priority, then creation time
                    if (a.status === 'running' && b.status !== 'running') return -1;
                    if (a.status !== 'running' && b.status === 'running') return 1;
                    const priorityOrder: TaskPriority[] = ['critical', 'high', 'normal', 'low'];
                    const aPrio = priorityOrder.indexOf(a.priority);
                    const bPrio = priorityOrder.indexOf(b.priority);
                    if (aPrio !== bPrio) return aPrio - bPrio;
                    return a.createdAt.getTime() - b.createdAt.getTime();
                  })
                  .map((task, index) => {
                    const priority = priorityConfig[task.priority];
                    const status = statusConfig[task.status];
                    const PriorityIcon = priority.icon;
                    const StatusIcon = status.icon;

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className={cn(
                          'rounded-lg border p-4',
                          task.status === 'running'
                            ? 'border-green-500/30 bg-green-500/5'
                            : task.status === 'failed'
                            ? 'border-red-500/30 bg-red-500/5'
                            : 'border-zinc-800 bg-zinc-800/30'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Priority Badge */}
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                              priority.bgColor
                            )}
                          >
                            <PriorityIcon className={cn('h-4 w-4', priority.color)} />
                          </div>

                          {/* Task Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-zinc-200">{task.title}</p>
                              <Badge
                                variant="outline"
                                className={cn('text-xs', priority.color, 'border-current/30')}
                              >
                                {priority.label}
                              </Badge>
                              <div className={cn('flex items-center gap-1 text-xs', status.color)}>
                                <StatusIcon
                                  className={cn(
                                    'h-3 w-3',
                                    task.status === 'running' && 'animate-spin'
                                  )}
                                />
                                {status.label}
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(task.createdAt)}
                              </span>
                              {task.assignedAgent && (
                                <span className="flex items-center gap-1 text-green-400/70">
                                  <Bot className="h-3 w-3" />
                                  {task.assignedAgent}
                                </span>
                              )}
                              {task.retryCount !== undefined && task.retryCount > 0 && (
                                <span className="text-orange-400/70">
                                  Retry {task.retryCount}/{task.maxRetries || 3}
                                </span>
                              )}
                            </div>

                            {/* Progress bar for running tasks */}
                            {task.status === 'running' && task.progress !== undefined && (
                              <div className="mt-3">
                                <Progress value={task.progress} className="h-1.5" />
                                <p className="text-xs text-zinc-500 mt-1 text-right">
                                  {task.progress}%
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Controls */}
                          <div className="flex flex-col gap-1">
                            {task.status === 'pending' && (
                              <>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handlePriorityChange(task.id, 'up')}
                                    disabled={task.priority === 'critical'}
                                    className="hover:bg-zinc-700"
                                    title="Increase priority"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handlePriorityChange(task.id, 'down')}
                                    disabled={task.priority === 'low'}
                                    className="hover:bg-zinc-700"
                                    title="Decrease priority"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => handleCancel(task.id)}
                                  className="hover:bg-red-500/20 hover:text-red-400"
                                  title="Cancel task"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}

                            {task.status === 'running' && (
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleCancel(task.id)}
                                className="hover:bg-red-500/20 hover:text-red-400"
                                title="Cancel task"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}

                            {task.status === 'failed' && (
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => handleRetry(task.id)}
                                  className="hover:bg-green-500/20 hover:text-green-400"
                                  title="Retry task"
                                  disabled={
                                    task.retryCount !== undefined &&
                                    task.maxRetries !== undefined &&
                                    task.retryCount >= task.maxRetries
                                  }
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => handleRemove(task.id)}
                                  className="hover:bg-red-500/20 hover:text-red-400"
                                  title="Remove task"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>

              {tasks.filter((t) => t.status !== 'cancelled' && t.status !== 'completed')
                .length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Queue is empty</p>
                  <p className="text-xs mt-1">Tasks will appear here when spawned</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
