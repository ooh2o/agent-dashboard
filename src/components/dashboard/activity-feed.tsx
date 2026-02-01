'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  Clock,
} from 'lucide-react';
import { ActivityEvent, EventType } from '@/lib/types';
import { formatDistanceToNow } from '@/lib/format';

const eventConfig: Record<
  EventType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  web_search: { icon: Search, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  memory_read: { icon: FileText, color: 'text-green-400', bgColor: 'bg-green-400/10' },
  memory_write: { icon: Edit3, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  thinking: { icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  tool_call: { icon: Wrench, color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  file_read: { icon: FileText, color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
  file_write: { icon: Edit3, color: 'text-teal-400', bgColor: 'bg-teal-400/10' },
  web_fetch: { icon: Globe, color: 'text-indigo-400', bgColor: 'bg-indigo-400/10' },
  subagent_spawn: { icon: GitBranch, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  message_send: { icon: MessageSquare, color: 'text-pink-400', bgColor: 'bg-pink-400/10' },
  error: { icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-400/10' },
};

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Clock className="h-5 w-5 text-zinc-400" />
          Activity Feed
          <Badge variant="secondary" className="ml-auto bg-zinc-800 text-zinc-300">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4 pb-4">
          <AnimatePresence initial={false}>
            {activities.map((activity, index) => {
              const config = eventConfig[activity.type];
              const Icon = config.icon;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="group relative flex items-start gap-3 py-3 border-b border-zinc-800/50 last:border-0"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {activity.explanation}
                    </p>
                    {activity.durationMs && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Duration: {activity.durationMs}ms
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 shrink-0">
                    {formatDistanceToNow(activity.timestamp)}
                  </div>
                  {activity.result === 'error' && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
