'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Play,
  Pause,
  Square,
  Trash2,
  ChevronDown,
  Zap,
  Clock,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentTemplate, RunningAgent, AgentStatus } from '@/lib/types';

const AGENT_TEMPLATES: AgentTemplate[] = [
  { id: 'general', name: 'General Agent', description: 'Multi-purpose autonomous agent', icon: 'bot' },
  { id: 'coder', name: 'Code Agent', description: 'Specialized for coding tasks', icon: 'code' },
  { id: 'researcher', name: 'Research Agent', description: 'Web search and analysis', icon: 'search' },
  { id: 'writer', name: 'Writer Agent', description: 'Content and documentation', icon: 'file' },
  { id: 'devops', name: 'DevOps Agent', description: 'Infrastructure and deployment', icon: 'wrench' },
];

const templateIcons: Record<string, React.ElementType> = {
  bot: Bot,
  code: Code2,
  search: Search,
  file: FileText,
  wrench: Wrench,
};

const statusConfig: Record<AgentStatus, { color: string; bgColor: string; label: string }> = {
  starting: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', label: 'Starting' },
  running: { color: 'text-green-400', bgColor: 'bg-green-400/10', label: 'Running' },
  paused: { color: 'text-orange-400', bgColor: 'bg-orange-400/10', label: 'Paused' },
  completed: { color: 'text-blue-400', bgColor: 'bg-blue-400/10', label: 'Completed' },
  failed: { color: 'text-red-400', bgColor: 'bg-red-400/10', label: 'Failed' },
};

// Demo data
const initialAgents: RunningAgent[] = [
  {
    id: 'agent-1',
    name: 'Code Review Agent',
    task: 'Review PR #142 for security issues',
    template: AGENT_TEMPLATES[1],
    status: 'running',
    startedAt: new Date(Date.now() - 120000),
    progress: 65,
    tokensUsed: 12450,
  },
  {
    id: 'agent-2',
    name: 'Research Agent',
    task: 'Find best practices for React 19',
    template: AGENT_TEMPLATES[2],
    status: 'running',
    startedAt: new Date(Date.now() - 300000),
    progress: 88,
    tokensUsed: 8920,
  },
];

export function AgentSpawner() {
  const [taskInput, setTaskInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate>(AGENT_TEMPLATES[0]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [runningAgents, setRunningAgents] = useState<RunningAgent[]>(initialAgents);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async () => {
    if (!taskInput.trim()) return;

    setIsLaunching(true);

    // Simulate agent spawn
    const newAgent: RunningAgent = {
      id: `agent-${Date.now()}`,
      name: `${selectedTemplate.name} #${runningAgents.length + 1}`,
      task: taskInput,
      template: selectedTemplate,
      status: 'starting',
      startedAt: new Date(),
      progress: 0,
    };

    setRunningAgents((prev) => [newAgent, ...prev]);

    // Simulate starting delay
    setTimeout(() => {
      setRunningAgents((prev) =>
        prev.map((a) => (a.id === newAgent.id ? { ...a, status: 'running' as AgentStatus } : a))
      );
      setIsLaunching(false);
    }, 1000);

    setTaskInput('');
  };

  const handlePause = (agentId: string) => {
    setRunningAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, status: a.status === 'paused' ? 'running' : 'paused' }
          : a
      )
    );
  };

  const handleKill = (agentId: string) => {
    setRunningAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  const SelectedIcon = templateIcons[selectedTemplate.icon];

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
                  <p className="text-sm font-medium text-zinc-200">{selectedTemplate.name}</p>
                  <p className="text-xs text-zinc-500">{selectedTemplate.description}</p>
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
                  className="absolute z-10 top-full left-0 right-0 mt-2 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl overflow-hidden"
                >
                  {AGENT_TEMPLATES.map((template) => {
                    const Icon = templateIcons[template.icon];
                    return (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTemplateDropdown(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 hover:bg-zinc-700/50 transition-colors',
                          selectedTemplate.id === template.id && 'bg-zinc-700/50'
                        )}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-500/20">
                          <Icon className="h-4 w-4 text-violet-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-zinc-200">{template.name}</p>
                          <p className="text-xs text-zinc-500">{template.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
              disabled={!taskInput.trim() || isLaunching}
              className={cn(
                'w-full h-14 text-lg font-semibold transition-all',
                'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
                'shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
              )}
            >
              {isLaunching ? (
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
        </CardContent>
      </Card>

      {/* Running Agents */}
      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur flex-1 min-h-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Bot className="h-5 w-5 text-zinc-400" />
            Running Agents
            <Badge variant="secondary" className="ml-auto bg-zinc-800 text-zinc-300">
              {runningAgents.filter((a) => a.status === 'running').length} active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="px-4 pb-4 space-y-3">
              <AnimatePresence initial={false}>
                {runningAgents.map((agent) => {
                  const config = statusConfig[agent.status];
                  const Icon = templateIcons[agent.template.icon];
                  const elapsed = Math.floor((Date.now() - agent.startedAt.getTime()) / 1000);
                  const minutes = Math.floor(elapsed / 60);
                  const seconds = elapsed % 60;

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
                                {agent.name}
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
                                {minutes}:{seconds.toString().padStart(2, '0')}
                              </span>
                              {agent.tokensUsed && (
                                <span>{agent.tokensUsed.toLocaleString()} tokens</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1">
                          {(agent.status === 'running' || agent.status === 'paused') && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handlePause(agent.id)}
                              className="hover:bg-zinc-700"
                            >
                              {agent.status === 'paused' ? (
                                <Play className="h-4 w-4 text-green-400" />
                              ) : (
                                <Pause className="h-4 w-4 text-orange-400" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleKill(agent.id)}
                            className="hover:bg-red-500/20 hover:text-red-400"
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {agent.progress !== undefined && agent.status !== 'completed' && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                            <motion.div
                              className={cn(
                                'h-full rounded-full',
                                agent.status === 'paused'
                                  ? 'bg-orange-500'
                                  : 'bg-gradient-to-r from-violet-500 to-purple-500'
                              )}
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {runningAgents.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No agents running</p>
                  <p className="text-xs mt-1">Launch an agent to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
