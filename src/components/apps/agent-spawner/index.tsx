'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Rocket,
  Bot,
  Code2,
  Search,
  FileText,
  Wrench,
  Square,
  ChevronDown,
  Zap,
  Clock,
  Cpu,
  BarChart3,
  Eye,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAgentTemplates,
  useRunningAgents,
  useSpawnFromTemplate,
  useKillAgent,
  useAgentOutput,
  useRemoveAgent,
} from '@/hooks/use-gateway';
import type { GatewayAgentTemplate, GatewayAgentInstance } from '@/lib/gateway';

const templateIcons: Record<string, React.ElementType> = {
  bot: Bot,
  code: Code2,
  search: Search,
  file: FileText,
  wrench: Wrench,
  chart: BarChart3,
};

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  queued: { color: 'text-zinc-400', bgColor: 'bg-zinc-400/10', label: 'Queued' },
  starting: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', label: 'Starting' },
  running: { color: 'text-green-400', bgColor: 'bg-green-400/10', label: 'Running' },
  paused: { color: 'text-orange-400', bgColor: 'bg-orange-400/10', label: 'Paused' },
  completed: { color: 'text-blue-400', bgColor: 'bg-blue-400/10', label: 'Completed' },
  failed: { color: 'text-red-400', bgColor: 'bg-red-400/10', label: 'Failed' },
  killed: { color: 'text-red-400', bgColor: 'bg-red-400/10', label: 'Killed' },
};

interface OutputViewerProps {
  agentId: string;
  onClose: () => void;
}

function OutputViewer({ agentId, onClose }: OutputViewerProps) {
  const { data, isLoading, error } = useAgentOutput(agentId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-medium text-zinc-200">Agent Output</h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[60vh]">
          <div className="p-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>Failed to load output</span>
              </div>
            )}
            {data && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span>Status: {statusConfig[data.status]?.label || data.status}</span>
                  {data.tokensUsed && (
                    <span>
                      Tokens: {data.tokensUsed.input + data.tokensUsed.output}
                    </span>
                  )}
                </div>
                <pre className="p-4 rounded-lg bg-zinc-800/50 text-sm text-zinc-300 whitespace-pre-wrap font-mono overflow-x-auto">
                  {data.output || 'No output yet...'}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
}

export function AgentSpawner() {
  const [taskInput, setTaskInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<GatewayAgentTemplate | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [viewingAgentId, setViewingAgentId] = useState<string | null>(null);
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});

  // API hooks
  const { data: templatesData, isLoading: templatesLoading, error: templatesError } = useAgentTemplates();
  const { data: agentsData, isLoading: agentsLoading, refetch: refetchAgents } = useRunningAgents();
  const spawnMutation = useSpawnFromTemplate();
  const killMutation = useKillAgent();
  const removeMutation = useRemoveAgent();

  const templates = templatesData?.templates || [];
  const agents = agentsData?.agents || [];

  // Set default template when loaded
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templates.find((t) => t.id === 'general') || templates[0]);
    }
  }, [templates, selectedTemplate]);

  // Update elapsed times for running agents
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newTimes: Record<string, number> = {};

      for (const agent of agents) {
        if (['running', 'starting', 'queued'].includes(agent.status)) {
          const start = new Date(agent.startTime).getTime();
          newTimes[agent.id] = Math.floor((now - start) / 1000);
        }
      }

      setElapsedTimes(newTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [agents]);

  const handleLaunch = async () => {
    if (!taskInput.trim() || !selectedTemplate) return;

    try {
      await spawnMutation.mutateAsync({
        templateId: selectedTemplate.id,
        task: taskInput,
      });
      setTaskInput('');
    } catch (error) {
      console.error('Failed to spawn agent:', error);
    }
  };

  const handleKill = async (agentId: string) => {
    try {
      await killMutation.mutateAsync(agentId);
    } catch (error) {
      console.error('Failed to kill agent:', error);
    }
  };

  const handleRemove = async (agentId: string) => {
    try {
      await removeMutation.mutateAsync(agentId);
    } catch (error) {
      console.error('Failed to remove agent:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeCount = agents.filter((a) =>
    ['running', 'starting', 'queued'].includes(a.status)
  ).length;

  const SelectedIcon = selectedTemplate
    ? templateIcons[selectedTemplate.icon] || Bot
    : Bot;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Spawn Panel */}
      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Rocket className="h-5 w-5 text-violet-400" />
            Agent Spawner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selector */}
          {templatesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : templatesError ? (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to load templates</span>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
                    <SelectedIcon className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-zinc-200">
                      {selectedTemplate?.name || 'Select Template'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {selectedTemplate?.description || 'Choose an agent template'}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-zinc-400 transition-transform',
                    showTemplateDropdown && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence>
                {showTemplateDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute z-10 top-full left-0 right-0 mt-2 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl overflow-hidden max-h-64 overflow-y-auto"
                  >
                    {templates.map((template) => {
                      const Icon = templateIcons[template.icon] || Bot;
                      return (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowTemplateDropdown(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 hover:bg-zinc-700/50 transition-colors',
                            selectedTemplate?.id === template.id && 'bg-zinc-700/50'
                          )}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-500/20">
                            <Icon className="h-4 w-4 text-violet-400" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-zinc-200">{template.name}</p>
                              {template.isBuiltIn && (
                                <Badge variant="outline" className="text-xs">Built-in</Badge>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500">{template.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Task Input */}
          <Textarea
            placeholder="Describe the task for this agent..."
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            className="min-h-[100px] bg-zinc-800/50 border-zinc-700 resize-none"
          />

          {/* Launch Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleLaunch}
              disabled={!taskInput.trim() || !selectedTemplate || spawnMutation.isPending}
              className={cn(
                'w-full h-14 text-lg font-semibold transition-all',
                'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
                'shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
              )}
            >
              {spawnMutation.isPending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Cpu className="h-6 w-6" />
                </motion.div>
              ) : (
                <>
                  <Zap className="h-6 w-6" />
                  Launch Agent
                </>
              )}
            </Button>
          </motion.div>

          {spawnMutation.isError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to spawn agent. Check gateway connection.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Running Agents */}
      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur flex-1 min-h-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Bot className="h-5 w-5 text-zinc-400" />
            Running Agents
            <Badge variant="secondary" className="ml-auto bg-zinc-800 text-zinc-300">
              {activeCount} active
            </Badge>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => refetchAgents()}
              className="ml-2"
            >
              <RefreshCw className={cn('h-4 w-4', agentsLoading && 'animate-spin')} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="px-4 pb-4 space-y-3">
              <AnimatePresence initial={false}>
                {agents.map((agent) => {
                  const config = statusConfig[agent.status] || statusConfig.running;
                  const Icon = templateIcons[templates.find((t) => t.id === agent.templateId)?.icon || 'bot'] || Bot;
                  const elapsed = elapsedTimes[agent.id] || 0;
                  const isActive = ['running', 'starting', 'queued'].includes(agent.status);
                  const canRemove = ['completed', 'failed', 'killed'].includes(agent.status);

                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                              config.bgColor
                            )}
                          >
                            <Icon className={cn('h-5 w-5', config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-zinc-200 truncate">
                                {agent.templateName}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn('text-xs', config.color, 'border-current/30')}
                              >
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{agent.task}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {isActive ? formatTime(elapsed) : formatTime(
                                  agent.endTime
                                    ? Math.floor((new Date(agent.endTime).getTime() - new Date(agent.startTime).getTime()) / 1000)
                                    : 0
                                )}
                              </span>
                              {agent.tokensUsed && (
                                <span>
                                  {(agent.tokensUsed.input + agent.tokensUsed.output).toLocaleString()} tokens
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setViewingAgentId(agent.id)}
                            className="hover:bg-zinc-700"
                            title="View Output"
                          >
                            <Eye className="h-4 w-4 text-zinc-400" />
                          </Button>
                          {isActive && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleKill(agent.id)}
                              disabled={killMutation.isPending}
                              className="hover:bg-red-500/20 hover:text-red-400"
                              title="Kill Agent"
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          )}
                          {canRemove && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleRemove(agent.id)}
                              disabled={removeMutation.isPending}
                              className="hover:bg-zinc-700"
                              title="Remove from list"
                            >
                              <X className="h-4 w-4 text-zinc-400" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {agent.progress !== undefined && isActive && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${agent.progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-xs text-zinc-500 mt-1 text-right">
                            {agent.progress}% complete
                          </p>
                        </div>
                      )}

                      {/* Error message */}
                      {agent.error && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          <span className="truncate">{agent.error}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {agents.length === 0 && !agentsLoading && (
                <div className="text-center py-8 text-zinc-500">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No agents running</p>
                  <p className="text-xs mt-1">Launch an agent to get started</p>
                </div>
              )}

              {agentsLoading && agents.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Output Viewer Modal */}
      <AnimatePresence>
        {viewingAgentId && (
          <OutputViewer
            agentId={viewingAgentId}
            onClose={() => setViewingAgentId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
