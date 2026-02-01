'use client';

import { GitCompareArrows, FilePlus, FileEdit, FileX, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  description: string;
}

interface FilesChangedSectionProps {
  files: FileChange[];
  maxVisible?: number;
  className?: string;
}

const statusConfig = {
  added: {
    icon: FilePlus,
    color: 'text-green-400',
    prefix: '+',
  },
  modified: {
    icon: FileEdit,
    color: 'text-amber-400',
    prefix: '~',
  },
  deleted: {
    icon: FileX,
    color: 'text-red-400',
    prefix: '-',
  },
};

export function FilesChangedSection({
  files,
  maxVisible = 6,
  className,
}: FilesChangedSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (files.length === 0) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <GitCompareArrows className="h-4 w-4 text-cyan-400" />
          <span>FILES CHANGED</span>
        </div>
        <div className="text-sm text-zinc-500 italic px-2">
          No file changes detected
        </div>
      </div>
    );
  }

  const visibleFiles = expanded ? files : files.slice(0, maxVisible);
  const hiddenCount = files.length - maxVisible;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <GitCompareArrows className="h-4 w-4 text-cyan-400" />
          <span>FILES CHANGED</span>
        </div>
        <span className="text-xs text-zinc-400">({files.length})</span>
      </div>

      {/* Files list */}
      <div className="space-y-1">
        {visibleFiles.map((file, index) => {
          const config = statusConfig[file.status];
          const StatusIcon = config.icon;
          const fileName = file.path.split('/').pop() || file.path;

          return (
            <motion.div
              key={file.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-sm group"
            >
              {/* Status prefix */}
              <span className={cn('font-mono text-xs w-4', config.color)}>
                {config.prefix}
              </span>

              {/* File name */}
              <StatusIcon className={cn('h-3.5 w-3.5 shrink-0', config.color)} />
              <span className="text-zinc-200 truncate max-w-[180px]" title={file.path}>
                {fileName}
              </span>

              {/* Description */}
              <span className="text-xs text-zinc-500 truncate flex-1 hidden sm:block">
                "{file.description}"
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Show more/less button */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-transform',
              expanded && 'rotate-180'
            )}
          />
          {expanded ? 'Show less' : `Show ${hiddenCount} more`}
        </button>
      )}

      {/* Summary by type */}
      <div className="flex gap-3 text-xs text-zinc-500 pt-1">
        {files.filter((f) => f.status === 'added').length > 0 && (
          <span className="text-green-400/70">
            +{files.filter((f) => f.status === 'added').length} added
          </span>
        )}
        {files.filter((f) => f.status === 'modified').length > 0 && (
          <span className="text-amber-400/70">
            ~{files.filter((f) => f.status === 'modified').length} modified
          </span>
        )}
        {files.filter((f) => f.status === 'deleted').length > 0 && (
          <span className="text-red-400/70">
            -{files.filter((f) => f.status === 'deleted').length} deleted
          </span>
        )}
      </div>
    </div>
  );
}
