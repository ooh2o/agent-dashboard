'use client';

import { motion } from 'framer-motion';
import {
  ActivityFeed,
  TokenTracker,
  TaskTree,
  InterventionPanel,
  MemoryViewer,
} from '@/components/dashboard';
import {
  mockActivities,
  mockSession,
  mockTaskTree,
  mockMemoryAccesses,
} from '@/lib/mock-data';
import { Bot, Zap } from 'lucide-react';

export default function Dashboard() {
  const handleSendInstruction = (instruction: string) => {
    console.log('Sending instruction:', instruction);
  };

  const handlePause = () => {
    console.log('Pausing agent');
  };

  const handleStop = () => {
    console.log('Stopping agent');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20"
              >
                <Bot className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-semibold text-white">Agent Dashboard</h1>
                <p className="text-xs text-zinc-500">Real-time monitoring & control</p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
            >
              <Zap className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Connected</span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <ActivityFeed activities={mockActivities} />
          </motion.div>

          {/* Right Column - Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-6"
          >
            <TokenTracker session={mockSession} />
          </motion.div>

          {/* Bottom Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <TaskTree root={mockTaskTree} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <InterventionPanel
              onSendInstruction={handleSendInstruction}
              onPause={handlePause}
              onStop={handleStop}
              isAgentRunning={true}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <MemoryViewer accesses={mockMemoryAccesses} />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-xs text-zinc-600 text-center">
            Agent Dashboard MVP - Built for founders who want to trust their AI
          </p>
        </div>
      </footer>
    </div>
  );
}
