'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Bell, Repeat, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  time: string;
  type: 'reminder' | 'cron' | 'event';
  color: string;
  recurring?: boolean;
}

interface EventListProps {
  selectedDate: Date | null;
}

const mockEvents: Event[] = [
  { id: '1', title: 'Daily standup reminder', time: '09:00', type: 'reminder', color: 'bg-blue-400', recurring: true },
  { id: '2', title: 'Memory cleanup job', time: '12:00', type: 'cron', color: 'bg-purple-400', recurring: true },
  { id: '3', title: 'Review agent logs', time: '14:00', type: 'reminder', color: 'bg-green-400' },
  { id: '4', title: 'Cost report generation', time: '18:00', type: 'cron', color: 'bg-orange-400', recurring: true },
];

export function EventList({ selectedDate }: EventListProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'No date selected';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const typeConfig = {
    reminder: { icon: Bell, label: 'Reminder' },
    cron: { icon: Repeat, label: 'Scheduled' },
    event: { icon: Calendar, label: 'Event' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-300">
          {formatDate(selectedDate)}
        </h4>
        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
          {mockEvents.length} events
        </Badge>
      </div>

      <div className="space-y-2">
        {mockEvents.map((event, index) => {
          const TypeIcon = typeConfig[event.type].icon;
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-1 h-full absolute left-0 top-0 rounded-l-lg ${event.color}`} />
                <div className="flex-1 pl-1">
                  <div className="flex items-center gap-2 mb-1">
                    <TypeIcon className="h-3 w-3 text-zinc-400" />
                    <span className="text-xs text-zinc-500">
                      {typeConfig[event.type].label}
                    </span>
                    {event.recurring && (
                      <Repeat className="h-3 w-3 text-zinc-500" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-200">{event.title}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {event.time}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {mockEvents.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No events for this day</p>
        </div>
      )}
    </div>
  );
}
