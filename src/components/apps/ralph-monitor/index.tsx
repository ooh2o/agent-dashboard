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
  LayoutDashboard,
  FileText,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MissionSection } from './mission-section';
import { RequirementsSection, type Requirement } from './requirements-section';
import { TestsSection, type TestResults } from './tests-section';
import { CurrentActivitySection, type CurrentActivity } from './current-activity-section';
import { FilesChangedSection, type FileChange } from './files-changed-section';

// ============================================================================
// Types
// ============================================================================

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

interface RalphDetails {
  mission: string;
  requirements: Requirement[];
  tests: TestResults;
  currentActivity: CurrentActivity;
  filesChanged: FileChange[];
  promptContent: string;
  fixPlanContent: string;
}

type TabType = 'overview' | 'logs' | 'prompt';

// ============================================================================
// Config
// ============================================================================

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string; dotColor: string }> = {
  idle: { icon: Circle, color: 'text-zinc-400', bgColor: 'bg-zinc-400/10', label: 'Idle', dotColor: 'bg-zinc-400' },
  running: { icon: Loader2, color: 'text-green-400', bgColor: 'bg-green-400/10', label: 'Running', dotColor: 'bg-green-400' },
  complete: { icon: CheckCircle2, color: 'text-blue-400', bgColor: 'bg-blue-400/10', label: 'Complete', dotColor: 'bg-blue-400' },
  failed: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-400/10', label: 'Failed', dotColor: 'bg-red-400' },
  paused: { icon: PauseCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', label: 'Paused', dotColor: 'bg-yellow-400' },
};

const logLevelColors: Record<string, string> = {
  info: 'text-zinc-300',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  debug: 'text-zinc-500',
};

// ============================================================================
// Component
// ============================================================================

export function RalphMonitor() {
  // State
  const [projects, setProjects] = useState<RalphProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<RalphProject | null>(null);
  const [status, setStatus] = useState<RalphStatus | null>(null);
  const [logs, setLogs] = useState<RalphLogEntry[]>([]);
  const [details, setDetails] = useState<RalphDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/ralph/projects');
      const data = await response.json();
      setProjects(data.projects || []);

      if (!selectedProject && data.projects?.length > 0) {
        setSelectedProject(data.projects[0]);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

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

  const fetchDetails = useCallback(async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/ralph/${selectedProject.id}/details`);
      if (response.ok) {
        const data = await response.json();
        setDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch details:', error);
    }
  }, [selectedProject]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (selectedProject) {
      fetchStatus();
      fetchLogs();
      fetchDetails();
    }
  }, [selectedProject, fetchStatus, fetchLogs, fetchDetails]);

  useEffect(() => {
    if (!autoRefresh || !selectedProject) return;

    const interval = setInterval(() => {
      fetchStatus();
      fetchDetails();
      if (status?.status === 'running') {
        fetchLogs();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedProject, status?.status, fetchStatus, fetchLogs, fetchDetails]);

  // ============================================================================
  // Actions
  // ============================================================================

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

      await fetchStatus();
      await fetchLogs();
      await fetchDetails();
    } catch (error) {
      console.error('Failed to start Ralph:', error);
    } finally {
      setActionLoading(false);
    }
  };

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

      await fetchStatus();
      await fetchLogs();
      await fetchDetails();
    } catch (error) {
      console.error('Failed to stop Ralph:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================================
  // Helpers
  // ============================================================================

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  };

  const formatDuration = (startTime?: string) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const currentConfig = status ? statusConfig[status.status] || statusConfig.idle : statusConfig.idle;
  const StatusIcon = currentConfig.icon;
  const isRunning = status?.status === 'running';

  // ============================================================================
  // Render
  // ============================================================================

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
            {/* Header Bar */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  {/* Left: Title + Status */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2.5 w-2.5 rounded-full', currentConfig.dotColor, isRunning && 'animate-pulse')} />
                      <h2 className="text-base font-medium text-zinc-200">
                        🔁 Ralph: {selectedProject.name}
                      </h2>
                    </div>
                    <Badge variant="outline" className={cn('text-xs', currentConfig.color, 'border-current/30')}>
                      {currentConfig.label}
                    </Badge>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex items-center gap-2">
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
                      <RefreshCw className={cn('h-4 w-4', autoRefresh && 'animate-spin')} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-zinc-800 pb-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px]',
                  activeTab === 'overview'
                    ? 'text-amber-400 border-amber-400'
                    : 'text-zinc-400 border-transparent hover:text-zinc-300'
                )}
              >
                <LayoutDashboard className="h-4 w-4 inline-block mr-1.5" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px]',
                  activeTab === 'logs'
                    ? 'text-amber-400 border-amber-400'
                    : 'text-zinc-400 border-transparent hover:text-zinc-300'
                )}
              >
                <Terminal className="h-4 w-4 inline-block mr-1.5" />
                Logs
              </button>
              <button
                onClick={() => setActiveTab('prompt')}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px]',
                  activeTab === 'prompt'
                    ? 'text-amber-400 border-amber-400'
                    : 'text-zinc-400 border-transparent hover:text-zinc-300'
                )}
              >
                <FileText className="h-4 w-4 inline-block mr-1.5" />
                PROMPT.md
              </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 min-h-0"
                >
                  <Card className="h-full border-zinc-800 bg-zinc-900/50">
                    <CardContent className="p-4">
                      <ScrollArea className="h-[calc(100vh-320px)]">
                        <div className="space-y-6 pr-4">
                          {/* Mission Section */}
                          <MissionSection mission={details?.mission || ''} />

                          {/* Requirements Section */}
                          <RequirementsSection requirements={details?.requirements || []} />

                          {/* Tests Section */}
                          <TestsSection tests={details?.tests || { total: 0, passed: 0, failed: 0, groups: [] }} />

                          {/* Current Activity Section */}
                          <CurrentActivitySection
                            activity={details?.currentActivity || { human: '', technical: '' }}
                            isRunning={isRunning}
                          />

                          {/* Files Changed Section */}
                          <FilesChangedSection files={details?.filesChanged || []} />
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Footer Bar */}
                  <div className="mt-4 flex items-center justify-between px-2 text-xs text-zinc-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Loop {status?.iteration || 0}/{status?.maxIterations || 5}
                      </span>
                      {status?.startTime && (
                        <span>{formatDuration(status.startTime)}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        $0.00
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 min-h-0"
                >
                  <Card className="h-full border-zinc-800 bg-zinc-900/50">
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
                      <ScrollArea className="h-[calc(100vh-340px)]">
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
                </motion.div>
              )}

              {activeTab === 'prompt' && (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 min-h-0"
                >
                  <Card className="h-full border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-amber-400" />
                        PROMPT.md
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[calc(100vh-340px)]">
                        <div className="p-4 font-mono text-sm text-zinc-300 whitespace-pre-wrap bg-zinc-950 rounded-b-lg">
                          {details?.promptContent || 'No PROMPT.md found'}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            {status?.error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4" />
                <span>{status.error}</span>
              </div>
            )}
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
