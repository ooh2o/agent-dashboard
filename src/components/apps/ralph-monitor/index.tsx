'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FolderGit2,
  Play,
  Square,
  RefreshCw,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  AlertCircle,
  PauseCircle,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RalphProject {
  id: string;
  name: string;
  path: string;
  hasStatus: boolean;
  hasLogs: boolean;
  lastModified?: string;
}

interface RalphStatus {
  iteration: number;
  maxIterations: number;
  status: 'idle' | 'running' | 'complete' | 'failed' | 'paused';
  startTime?: string;
  lastUpdate?: string;
  currentTask?: string;
  completedTasks?: number;
  totalTasks?: number;
  error?: string;
  projectPath?: string;
}

interface RalphLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  iteration?: number;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  idle: { icon: Circle, color: 'text-zinc-400', bgColor: 'bg-zinc-400/10', label: 'Idle' },
  running: { icon: Loader2, color: 'text-green-400', bgColor: 'bg-green-400/10', label: 'Running' },
  complete: { icon: CheckCircle2, color: 'text-blue-400', bgColor: 'bg-blue-400/10', label: 'Complete' },
  failed: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-400/10', label: 'Failed' },
  paused: { icon: PauseCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', label: 'Paused' },
};

const logLevelColors: Record<string, string> = {
  info: 'text-zinc-300',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  debug: 'text-zinc-500',
};

export function RalphMonitor() {
  const [projects, setProjects] = useState<RalphProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<RalphProject | null>(null);
  const [status, setStatus] = useState<RalphStatus | null>(null);
  const [logs, setLogs] = useState<RalphLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/ralph/projects');
      const data = await response.json();
      setProjects(data.projects || []);

      // Auto-select first project if none selected
      if (!selectedProject && data.projects?.length > 0) {
        setSelectedProject(data.projects[0]);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  // Fetch status for selected project
  const fetchStatus = useCallback(async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/ralph/${selectedProject.id}/status`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  }, [selectedProject]);

  // Fetch logs for selected project
  const fetchLogs = useCallback(async () => {
    if (!selectedProject) return;

    setLogsLoading(true);
    try {
      const response = await fetch(`/api/ralph/${selectedProject.id}/logs?limit=100&tail=true`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }, [selectedProject]);

  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch status and logs when project changes
  useEffect(() => {
    if (selectedProject) {
      fetchStatus();
      fetchLogs();
    }
  }, [selectedProject, fetchStatus, fetchLogs]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !selectedProject) return;

    const interval = setInterval(() => {
      fetchStatus();
      if (status?.status === 'running') {
        fetchLogs();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedProject, status?.status, fetchStatus, fetchLogs]);

  // Start Ralph loop
  const handleStart = async () => {
    if (!selectedProject) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/ralph/${selectedProject.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxIterations: 5 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start');
      }

      // Refresh status immediately
      await fetchStatus();
      await fetchLogs();
    } catch (error) {
      console.error('Failed to start Ralph:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Stop Ralph loop
  const handleStop = async () => {
    if (!selectedProject) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/ralph/${selectedProject.id}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to stop');
      }

      // Refresh status immediately
      await fetchStatus();
      await fetchLogs();
    } catch (error) {
      console.error('Failed to stop Ralph:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  };

  const currentConfig = status ? statusConfig[status.status] || statusConfig.idle : statusConfig.idle;
  const StatusIcon = currentConfig.icon;
  const isRunning = status?.status === 'running';

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Project List */}
      <Card className="w-64 shrink-0 border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <FolderGit2 className="h-4 w-4 text-amber-400" />
            Ralph Projects
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => fetchProjects()}
              className="ml-auto"
            >
              <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                <FolderGit2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No Ralph projects found</p>
                <p className="text-xs mt-1">Create a .ralph/ folder in your project</p>
              </div>
            ) : (
              <div className="space-y-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors',
                      selectedProject?.id === project.id
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'hover:bg-zinc-800 text-zinc-400'
                    )}
                  >
                    <FolderGit2 className="h-4 w-4 shrink-0" />
                    <span className="truncate text-sm">{project.name}</span>
                    <ChevronRight className="h-3 w-3 ml-auto shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {selectedProject ? (
          <>
            {/* Status Header */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', currentConfig.bgColor)}>
                      <StatusIcon className={cn('h-6 w-6', currentConfig.color, status?.status === 'running' && 'animate-spin')} />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-zinc-200">{selectedProject.name}</h2>
                      <p className="text-sm text-zinc-500 truncate max-w-md">{selectedProject.path}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn('text-sm', currentConfig.color, 'border-current/30')}>
                      {currentConfig.label}
                    </Badge>

                    {status && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Clock className="h-4 w-4" />
                        <span>
                          Iteration {status.iteration}/{status.maxIterations}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 ml-4">
                      {/* Start/Stop Controls */}
                      {isRunning ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStop}
                          disabled={actionLoading}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Square className="h-4 w-4 mr-1" />
                          )}
                          Stop
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStart}
                          disabled={actionLoading}
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          Start
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={cn(autoRefresh && 'text-green-400')}
                      >
                        <RefreshCw className={cn('h-4 w-4 mr-1', autoRefresh && 'animate-spin')} />
                        Auto
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {status && status.maxIterations > 0 && (
                  <div className="mt-4">
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(status.iteration / status.maxIterations) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {status?.error && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-md px-3 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{status.error}</span>
                  </div>
                )}

                {/* Current Task */}
                {status?.currentTask && (
                  <div className="mt-3 text-sm text-zinc-400">
                    <span className="text-zinc-500">Current: </span>
                    {status.currentTask}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terminal Log Viewer */}
            <Card className="flex-1 border-zinc-800 bg-zinc-900/50 min-h-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Terminal className="h-4 w-4 text-green-400" />
                  Output Log
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => fetchLogs()}
                    className="ml-auto"
                    disabled={logsLoading}
                  >
                    <RefreshCw className={cn('h-3 w-3', logsLoading && 'animate-spin')} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="p-4 font-mono text-xs bg-zinc-950 rounded-b-lg">
                    <AnimatePresence initial={false}>
                      {logs.length === 0 ? (
                        <div className="text-zinc-600 text-center py-4">
                          No logs available
                        </div>
                      ) : (
                        logs.map((log, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              'py-0.5 leading-relaxed',
                              logLevelColors[log.level] || logLevelColors.info
                            )}
                          >
                            <span className="text-zinc-600">[{formatTime(log.timestamp)}]</span>{' '}
                            {log.level !== 'info' && (
                              <span className={cn('uppercase', logLevelColors[log.level])}>
                                [{log.level}]{' '}
                              </span>
                            )}
                            <span>{log.message}</span>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <FolderGit2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Select a Ralph project to view status</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
