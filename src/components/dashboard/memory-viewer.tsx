'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Brain, FileText, Edit3, ChevronDown, Eye } from 'lucide-react';
import { MemoryAccess } from '@/lib/types';
import { formatDistanceToNow } from '@/lib/format';

interface MemoryViewerProps {
  accesses: MemoryAccess[];
}

export function MemoryViewer({ accesses }: MemoryViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Brain className="h-5 w-5 text-zinc-400" />
          Agent Memory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-zinc-300">Recent Accesses</h4>
          <div className="space-y-2">
            {accesses.map((access) => (
              <Collapsible
                key={access.id}
                open={expandedId === access.id}
                onOpenChange={(open) =>
                  setExpandedId(open ? access.id : null)
                }
              >
                <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors">
                  {access.type === 'read' ? (
                    <FileText className="h-4 w-4 text-green-400" />
                  ) : (
                    <Edit3 className="h-4 w-4 text-emerald-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">
                      {access.file}
                    </p>
                    <p className="text-xs text-zinc-500">
                      ({access.type}) - {formatDistanceToNow(access.timestamp)}
                    </p>
                  </div>
                  {access.preview && (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-zinc-400 hover:text-zinc-200"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Preview
                        <motion.div
                          animate={{ rotate: expandedId === access.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-3.5 w-3.5 ml-1" />
                        </motion.div>
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
                <AnimatePresence>
                  {expandedId === access.id && access.preview && (
                    <CollapsibleContent forceMount>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="mt-2 p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                          <ScrollArea className="h-[150px]">
                            <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap">
                              {access.preview}
                            </pre>
                          </ScrollArea>
                        </div>
                      </motion.div>
                    </CollapsibleContent>
                  )}
                </AnimatePresence>
              </Collapsible>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Memory files tracked</span>
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
              {accesses.length} recent
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
