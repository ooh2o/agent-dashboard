'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Wrench,
  Search,
  FileText,
  Edit3,
  Pencil,
  FolderSearch,
  Terminal,
  Globe,
  Download,
  GitBranch,
  MessageCircle,
  MessageSquare,
  Brain,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Filter,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Tool, ToolCategory, ToolTestResult } from '@/lib/types';
import { mockTools } from '@/lib/mock-data';
import { formatDistanceToNow, formatNumber } from '@/lib/format';

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Edit3,
  Pencil,
  FolderSearch,
  Search,
  Terminal,
  Globe,
  Download,
  GitBranch,
  MessageCircle,
  MessageSquare,
  Brain,
  Wrench,
};

const categoryConfig: Record<ToolCategory, { label: string; color: string; bgColor: string }> = {
  file: { label: 'File', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
  web: { label: 'Web', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  system: { label: 'System', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  ai: { label: 'AI', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  memory: { label: 'Memory', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  communication: { label: 'Comms', color: 'text-pink-400', bgColor: 'bg-pink-400/10' },
};

export function ToolsInspector() {
  const [tools, setTools] = useState<Tool[]>(mockTools);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<ToolTestResult | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const categories: (ToolCategory | 'all')[] = ['all', 'file', 'web', 'system', 'ai', 'memory', 'communication'];

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tools, searchQuery, selectedCategory]);

  const stats = useMemo(() => {
    const enabled = tools.filter((t) => t.enabled).length;
    const totalUsage = tools.reduce((sum, t) => sum + t.usageCount, 0);
    const avgSuccess = tools.filter((t) => t.usageCount > 0).reduce((sum, t) => sum + t.successRate, 0) / tools.filter((t) => t.usageCount > 0).length;
    return { enabled, total: tools.length, totalUsage, avgSuccess };
  }, [tools]);

  const handleToggleTool = (toolId: string) => {
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleSelectTool = (tool: Tool) => {
    setSelectedTool(tool);
    setTestParams({});
    setTestResult(null);
  };

  const handleRunTest = async () => {
    if (!selectedTool) return;

    setIsTestRunning(true);
    setTestResult(null);

    // Simulate test execution
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const success = Math.random() > 0.2;
    setTestResult({
      success,
      output: success
        ? `Tool "${selectedTool.name}" executed successfully.\n\nOutput:\n${JSON.stringify(testParams, null, 2)}`
        : undefined,
      error: success ? undefined : 'Simulated error: Missing required parameter or invalid input',
      durationMs: Math.floor(100 + Math.random() * 500),
      timestamp: new Date(),
    });

    setIsTestRunning(false);
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Wrench;
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <Wrench className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">Tools Inspector</h1>
              <p className="text-sm text-zinc-500">Manage and test available tools</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-zinc-400">{stats.enabled}/{stats.total} enabled</span>
            </div>
            <div className="text-zinc-500">|</div>
            <div className="text-zinc-400">{formatNumber(stats.totalUsage)} total calls</div>
            <div className="text-zinc-500">|</div>
            <div className="text-zinc-400">{stats.avgSuccess.toFixed(1)}% avg success</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-zinc-500 mr-1" />
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs ${
                  selectedCategory === cat
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat === 'all' ? 'All' : categoryConfig[cat].label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tool Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredTools.map((tool) => {
                const Icon = getIcon(tool.icon);
                const config = categoryConfig[tool.category];
                const isSelected = selectedTool?.id === tool.id;

                return (
                  <motion.div
                    key={tool.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 ${
                        isSelected ? 'ring-2 ring-orange-500/50 border-orange-500/30' : ''
                      } ${!tool.enabled ? 'opacity-50' : ''}`}
                      onClick={() => handleSelectTool(tool)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor}`}>
                              <Icon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <div>
                              <h3 className="font-medium text-zinc-100">{tool.name}</h3>
                              <Badge variant="outline" className={`text-[10px] ${config.color} border-current/30`}>
                                {config.label}
                              </Badge>
                            </div>
                          </div>
                          <Switch
                            checked={tool.enabled}
                            onCheckedChange={() => handleToggleTool(tool.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                          {tool.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {formatNumber(tool.usageCount)}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {tool.successRate}%
                          </div>
                          {tool.lastUsed && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(tool.lastUsed)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredTools.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p>No tools found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Test Panel */}
        <AnimatePresence>
          {selectedTool && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-zinc-800 bg-zinc-900/30 flex-shrink-0 overflow-hidden"
            >
              <div className="w-[380px] h-full flex flex-col">
                <div className="flex-shrink-0 p-4 border-b border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-zinc-100">Test Panel</h2>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setSelectedTool(null)}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getIcon(selectedTool.icon);
                      const config = categoryConfig[selectedTool.category];
                      return (
                        <>
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor}`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-200">{selectedTool.name}</p>
                            <p className="text-xs text-zinc-500">{selectedTool.description}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {/* Parameters */}
                  {selectedTool.params && selectedTool.params.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-zinc-300 mb-3">Parameters</h3>
                      <div className="space-y-3">
                        {selectedTool.params.map((param) => (
                          <div key={param.name}>
                            <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5">
                              <span className="font-mono">{param.name}</span>
                              {param.required && (
                                <Badge variant="outline" className="text-[9px] text-orange-400 border-orange-400/30">
                                  required
                                </Badge>
                              )}
                              <span className="text-zinc-600">({param.type})</span>
                            </label>
                            <Input
                              placeholder={param.description}
                              value={testParams[param.name] || ''}
                              onChange={(e) =>
                                setTestParams((prev) => ({
                                  ...prev,
                                  [param.name]: e.target.value,
                                }))
                              }
                              className="bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 text-sm font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Run Button */}
                  <Button
                    onClick={handleRunTest}
                    disabled={isTestRunning || !selectedTool.enabled}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-4"
                  >
                    {isTestRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Test
                      </>
                    )}
                  </Button>

                  {/* Test Result */}
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          testResult.success
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-red-500/10 border border-red-500/20'
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        )}
                        <div>
                          <p className={`font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                            {testResult.success ? 'Success' : 'Failed'}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {testResult.durationMs}ms | {formatDistanceToNow(testResult.timestamp)}
                          </p>
                        </div>
                      </div>

                      {(testResult.output || testResult.error) && (
                        <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                          <p className="text-xs font-medium text-zinc-400 mb-2">
                            {testResult.success ? 'Output' : 'Error'}
                          </p>
                          <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap break-all">
                            {testResult.output || testResult.error}
                          </pre>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Tool Stats */}
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">Statistics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-800/30 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 mb-1">Total Calls</p>
                        <p className="text-lg font-semibold text-zinc-100">
                          {formatNumber(selectedTool.usageCount)}
                        </p>
                      </div>
                      <div className="bg-zinc-800/30 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 mb-1">Success Rate</p>
                        <p className="text-lg font-semibold text-green-400">
                          {selectedTool.successRate}%
                        </p>
                      </div>
                      <div className="bg-zinc-800/30 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 mb-1">Avg Duration</p>
                        <p className="text-lg font-semibold text-zinc-100">
                          {selectedTool.avgDurationMs}ms
                        </p>
                      </div>
                      <div className="bg-zinc-800/30 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 mb-1">Last Used</p>
                        <p className="text-sm font-medium text-zinc-300">
                          {selectedTool.lastUsed
                            ? formatDistanceToNow(selectedTool.lastUsed)
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ToolsInspector;
