'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Activity,
} from 'lucide-react';
import { ActivityEvent, EventType } from '@/lib/types';
import { mockActivities } from '@/lib/mock-data';
import { formatDistanceToNow } from '@/lib/format';

const eventConfig: Record<
  EventType,
  { icon: React.ElementType; color: string }
> = {
  web_search: { icon: Search, color: 'text-blue-400' },
  memory_read: { icon: FileText, color: 'text-green-400' },
  memory_write: { icon: Edit3, color: 'text-emerald-400' },
  memory_access: { icon: FileText, color: 'text-lime-400' },
  thinking: { icon: Brain, color: 'text-purple-400' },
  tool_call: { icon: Wrench, color: 'text-orange-400' },
  file_read: { icon: FileText, color: 'text-cyan-400' },
  file_write: { icon: Edit3, color: 'text-teal-400' },
  web_fetch: { icon: Globe, color: 'text-indigo-400' },
  subagent_spawn: { icon: GitBranch, color: 'text-yellow-400' },
  message_send: { icon: MessageSquare, color: 'text-pink-400' },
  error: { icon: AlertCircle, color: 'text-red-400' },
};

export function MiniActivityWidget() {
  const [events, setEvents] = useState<ActivityEvent[]>(mockActivities.slice(0, 3));

  // Auto-refresh every 5 seconds (simulated)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate receiving new events by cycling through mock data
      setEvents((prev) => {
        const newEvents = [...mockActivities];
        // Update timestamps to simulate real-time
        return newEvents.slice(0, 3).map((e, i) => ({
          ...e,
          timestamp: new Date(Date.now() - i * 8000),
        }));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Activity className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-xs text-zinc-300 font-medium">Live Feed</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 space-y-1.5 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {events.map((event, index) => {
            const config = eventConfig[event.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={`${event.id}-${index}`}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Icon className={`h-3 w-3 shrink-0 ${config.color}`} />
                <span className="text-xs text-zinc-300 truncate flex-1">
                  {event.explanation.length > 30
                    ? event.explanation.slice(0, 30) + '...'
                    : event.explanation}
                </span>
                <span className="text-[10px] text-zinc-500 shrink-0">
                  {formatDistanceToNow(event.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
