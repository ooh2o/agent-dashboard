'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  FileText,
  Brain,
  Wrench,
  Edit3,
  GitBranch,
  Globe,
  MessageSquare,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react';
import { ActivityEvent, EventType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ActivityItem } from './activity-item';

export const eventConfig: Record<
  EventType,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  web_search: { icon: Search, color: 'text-blue-400', bgColor: 'bg-blue-400/10', label: 'Search' },
  memory_read: { icon: FileText, color: 'text-green-400', bgColor: 'bg-green-400/10', label: 'Mem Read' },
  memory_write: { icon: Edit3, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', label: 'Mem Write' },
  memory_access: { icon: FileText, color: 'text-lime-400', bgColor: 'bg-lime-400/10', label: 'Mem Access' },
  thinking: { icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-400/10', label: 'Thinking' },
  tool_call: { icon: Wrench, color: 'text-orange-400', bgColor: 'bg-orange-400/10', label: 'Tool' },
  file_read: { icon: FileText, color: 'text-cyan-400', bgColor: 'bg-cyan-400/10', label: 'File Read' },
  file_write: { icon: Edit3, color: 'text-teal-400', bgColor: 'bg-teal-400/10', label: 'File Write' },
  web_fetch: { icon: Globe, color: 'text-indigo-400', bgColor: 'bg-indigo-400/10', label: 'Web Fetch' },
  subagent_spawn: { icon: GitBranch, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', label: 'Subagent' },
  message_send: { icon: MessageSquare, color: 'text-pink-400', bgColor: 'bg-pink-400/10', label: 'Message' },
  error: { icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-400/10', label: 'Error' },
};

interface ActivityMonitorProps {
  activities: ActivityEvent[];
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export function ActivityMonitor({
  activities,
  onClose,
  onMinimize,
  onMaximize,
}: ActivityMonitorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<EventType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch =
        searchQuery === '' ||
        activity.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.tool?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilters.length === 0 || activeFilters.includes(activity.type);

      return matchesSearch && matchesFilter;
    });
  }, [activities, searchQuery, activeFilters]);

  const toggleFilter = (type: EventType) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
      {/* macOS Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/95 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            aria-label="Close"
          />
          <button
            onClick={onMinimize}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
            aria-label="Minimize"
          />
          <button
            onClick={onMaximize}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
            aria-label="Maximize"
          />
        </div>
        <h1 className="text-sm font-medium text-zinc-300 absolute left-1/2 -translate-x-1/2">
          Activity Monitor
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-xs">
            Live
          </Badge>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="px-4 py-3 border-b border-zinc-800 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
              showFilters || activeFilters.length > 0
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            )}
          >
            <Filter className="h-4 w-4" />
            {activeFilters.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Pills */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {Object.entries(eventConfig).map(([type, config]) => {
                  const isActive = activeFilters.includes(type as EventType);
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => toggleFilter(type as EventType)}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all',
                        isActive
                          ? `${config.bgColor} ${config.color} ring-1 ring-current`
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </button>
                  );
                })}
                {activeFilters.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Activity Count */}
      <div className="px-4 py-2 border-b border-zinc-800/50 text-xs text-zinc-500">
        Showing {filteredActivities.length} of {activities.length} activities
      </div>

      {/* Activity List */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-2">
          <AnimatePresence initial={false}>
            {filteredActivities.map((activity, index) => {
              const config = eventConfig[activity.type];

              return (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  config={config}
                  index={index}
                />
              );
            })}
          </AnimatePresence>

          {filteredActivities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Search className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No activities match your filters</p>
              <button
                onClick={clearFilters}
                className="mt-2 text-xs text-blue-400 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
        <span>
          {activities.filter((a) => a.result === 'error').length} errors
        </span>
        <span>
          Total tokens:{' '}
          {activities
            .filter((a) => a.tokens)
            .reduce((sum, a) => sum + (a.tokens?.input || 0) + (a.tokens?.output || 0), 0)
            .toLocaleString()}
        </span>
      </div>
    </div>
  );
}
