'use client';

import { FlaskConical, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TestGroup {
  name: string;
  passed: number;
  total: number;
  failed: number;
}

export interface TestResults {
  total: number;
  passed: number;
  failed: number;
  groups: TestGroup[];
}

interface TestsSectionProps {
  tests: TestResults;
  className?: string;
}

export function TestsSection({ tests, className }: TestsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const hasTests = tests.total > 0;
  const allPassing = tests.failed === 0 && tests.passed > 0;

  if (!hasTests) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <FlaskConical className="h-4 w-4 text-purple-400" />
          <span>TESTS</span>
        </div>
        <div className="text-sm text-zinc-500 italic px-2">
          No test results found in logs
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <FlaskConical className="h-4 w-4 text-purple-400" />
          <span>TESTS</span>
        </div>
        <div className="flex items-center gap-2">
          {allPassing ? (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {tests.passed} passing
            </span>
          ) : (
            <>
              <span className="text-xs text-green-400">{tests.passed} passed</span>
              {tests.failed > 0 && (
                <span className="text-xs text-red-400">{tests.failed} failed</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Test groups (collapsible) */}
      {tests.groups.length > 0 && (
        <>
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
            {expanded ? 'Hide details' : 'Show details'}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-1 pl-2 border-l border-zinc-700">
                  {tests.groups.map((group, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs text-zinc-400"
                    >
                      {group.failed === 0 ? (
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-400" />
                      )}
                      <span className="flex-1 truncate">{group.name}</span>
                      <span className="text-zinc-500">
                        {group.passed}/{group.total}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Summary bar */}
      {tests.total > 0 && (
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${(tests.passed / tests.total) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
          {tests.failed > 0 && (
            <motion.div
              className="h-full bg-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${(tests.failed / tests.total) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          )}
        </div>
      )}
    </div>
  );
}
