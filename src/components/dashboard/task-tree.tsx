'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  ListTree,
  ChevronRight,
} from 'lucide-react';
import { TaskNode } from '@/lib/types';

const statusConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string; animate?: boolean }
> = {
  pending: {
    icon: Circle,
    color: 'text-zinc-500',
    label: 'Pending',
  },
  running: {
    icon: Loader2,
    color: 'text-blue-400',
    label: 'In Progress',
    animate: true,
  },
  complete: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    label: 'Complete',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-400',
    label: 'Failed',
  },
};

interface TaskNodeItemProps {
  node: TaskNode;
  depth: number;
}

function TaskNodeItem({ node, depth }: TaskNodeItemProps) {
  const config = statusConfig[node.status];
  const Icon = config.icon;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: depth * 0.05 }}
    >
      <div
        className="flex items-center gap-2 py-2"
        style={{ paddingLeft: `${depth * 20}px` }}
      >
        {depth > 0 && (
          <div className="flex items-center">
            <div className="w-4 h-px bg-zinc-700" />
            <ChevronRight className="h-3 w-3 text-zinc-600" />
          </div>
        )}
        <Icon
          className={`h-4 w-4 ${config.color} ${
            config.animate ? 'animate-spin' : ''
          }`}
        />
        <span
          className={`text-sm ${
            node.status === 'complete' ? 'text-zinc-400' : 'text-zinc-200'
          }`}
        >
          {node.name}
        </span>
        {node.durationSeconds !== undefined && node.status === 'running' && (
          <Badge
            variant="secondary"
            className="ml-auto bg-blue-500/10 text-blue-400 text-xs font-mono"
          >
            {node.durationSeconds}s
          </Badge>
        )}
      </div>
      {hasChildren && (
        <div className="border-l border-zinc-800 ml-2">
          {node.children!.map((child) => (
            <TaskNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface TaskTreeProps {
  root: TaskNode;
}

export function TaskTree({ root }: TaskTreeProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <ListTree className="h-5 w-5 text-zinc-400" />
          Task Tree
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 mb-2">
            <Badge
              variant="secondary"
              className="bg-blue-500/10 text-blue-400 text-xs"
            >
              Main Task
            </Badge>
            <span className="text-sm font-medium text-white">{root.name}</span>
          </div>
          {root.children?.map((child) => (
            <TaskNodeItem key={child.id} node={child} depth={0} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
