'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Play,
  Pause,
  Settings,
  Trash2,
  Clock,
  Calendar,
  RefreshCw,
  Database,
  MessageSquare,
  FileText,
} from 'lucide-react';

interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  scheduleReadable: string;
  icon: React.ElementType;
  color: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  status: 'idle' | 'running' | 'success' | 'error';
}

interface CronJobListProps {
  onEdit: () => void;
}

const initialJobs: CronJob[] = [
  {
    id: '1',
    name: 'Daily Backup',
    description: 'Backup memory and configuration files',
    schedule: '0 2 * * *',
    scheduleReadable: 'Every day at 2:00 AM',
    icon: Database,
    color: 'text-blue-400',
    enabled: true,
    lastRun: '2 hours ago',
    nextRun: 'Tomorrow at 2:00 AM',
    status: 'success',
  },
  {
    id: '2',
    name: 'Memory Cleanup',
    description: 'Remove old memory entries and optimize storage',
    schedule: '0 */6 * * *',
    scheduleReadable: 'Every 6 hours',
    icon: RefreshCw,
    color: 'text-purple-400',
    enabled: true,
    lastRun: '4 hours ago',
    nextRun: 'In 2 hours',
    status: 'success',
  },
  {
    id: '3',
    name: 'Channel Sync',
    description: 'Sync messages across all channels',
    schedule: '*/30 * * * *',
    scheduleReadable: 'Every 30 minutes',
    icon: MessageSquare,
    color: 'text-green-400',
    enabled: true,
    lastRun: '15 minutes ago',
    nextRun: 'In 15 minutes',
    status: 'idle',
  },
  {
    id: '4',
    name: 'Weekly Report',
    description: 'Generate weekly activity and cost report',
    schedule: '0 9 * * 1',
    scheduleReadable: 'Every Monday at 9:00 AM',
    icon: FileText,
    color: 'text-orange-400',
    enabled: true,
    lastRun: '5 days ago',
    nextRun: 'Monday at 9:00 AM',
    status: 'success',
  },
  {
    id: '5',
    name: 'Health Check',
    description: 'Check system health and report issues',
    schedule: '*/5 * * * *',
    scheduleReadable: 'Every 5 minutes',
    icon: RefreshCw,
    color: 'text-red-400',
    enabled: false,
    lastRun: 'Never',
    nextRun: 'Disabled',
    status: 'idle',
  },
];

const statusConfig = {
  idle: { color: 'bg-zinc-500', label: 'Idle' },
  running: { color: 'bg-blue-500 animate-pulse', label: 'Running' },
  success: { color: 'bg-green-500', label: 'Success' },
  error: { color: 'bg-red-500', label: 'Error' },
};

export function CronJobList({ onEdit }: CronJobListProps) {
  const [jobs, setJobs] = useState<CronJob[]>(initialJobs);

  const toggleJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, enabled: !job.enabled } : job
      )
    );
  };

  const runNow = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: 'running' as const } : job
      )
    );
    // Simulate job completion
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, status: 'success' as const, lastRun: 'Just now' }
            : job
        )
      );
    }, 2000);
  };

  const activeCount = jobs.filter((j) => j.enabled).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Scheduled Jobs</h3>
          <p className="text-xs text-zinc-500 mt-1">
            {activeCount} of {jobs.length} jobs active
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {jobs.map((job, index) => {
          const Icon = job.icon;
          const status = statusConfig[job.status];

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border transition-colors ${
                job.enabled
                  ? 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                  : 'bg-zinc-800/20 border-zinc-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-700/50">
                    <Icon className={`h-5 w-5 ${job.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-zinc-200">{job.name}</h4>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        <span className="text-xs text-zinc-500">{status.label}</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{job.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <Clock className="h-3 w-3" />
                        <span>{job.scheduleReadable}</span>
                      </div>
                      <Badge variant="secondary" className="bg-zinc-700/50 text-zinc-400 font-mono text-xs">
                        {job.schedule}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                      <span>Last: {job.lastRun}</span>
                      <span>Next: {job.nextRun}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => runNow(job.id)}
                    disabled={!job.enabled || job.status === 'running'}
                    className="text-zinc-400"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onEdit}
                    className="text-zinc-400"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Switch
                    checked={job.enabled}
                    onCheckedChange={() => toggleJob(job.id)}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
