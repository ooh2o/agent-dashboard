'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Coins, Clock, TrendingUp, Cpu } from 'lucide-react';
import { Session } from '@/lib/types';
import { formatDuration, formatNumber, formatCurrency } from '@/lib/format';
import { calculateCostBreakdown, TOKEN_PRICING } from '@/lib/openclaw-data';

interface TokenTrackerProps {
  session: Session;
}

export function TokenTracker({ session }: TokenTrackerProps) {
  const sessionDuration = Math.floor(
    (Date.now() - session.startTime.getTime()) / 1000
  );

  const totalTokens = session.totalTokens.input + session.totalTokens.output;
  const budgetLimit = 50000; // Arbitrary budget limit for progress bar
  const usagePercentage = Math.min((totalTokens / budgetLimit) * 100, 100);

  const costs = calculateCostBreakdown(
    session.model,
    session.totalTokens.input,
    session.totalTokens.output
  );

  // Estimate remaining based on current pace
  const tokensPerMinute = totalTokens / (sessionDuration / 60);
  const estimatedRemainingCost = (tokensPerMinute * 60 / 1_000_000) * 15; // Rough estimate

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Coins className="h-5 w-5 text-zinc-400" />
          Token Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Duration */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-zinc-400">
            <Clock className="h-4 w-4" />
            Session
          </div>
          <span className="font-mono text-zinc-200">
            {formatDuration(sessionDuration)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Usage</span>
            <span className="text-zinc-400">{Math.round(usagePercentage)}%</span>
          </div>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ originX: 0 }}
          >
            <Progress
              value={usagePercentage}
              className="h-3 bg-zinc-800"
            />
          </motion.div>
        </div>

        {/* Token Breakdown */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Input</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-zinc-200">
                {formatNumber(session.totalTokens.input)} tokens
              </span>
              <span className="text-zinc-500 font-mono text-xs">
                ({formatCurrency(costs.inputCost)})
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Output</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-zinc-200">
                {formatNumber(session.totalTokens.output)} tokens
              </span>
              <span className="text-zinc-500 font-mono text-xs">
                ({formatCurrency(costs.outputCost)})
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm font-medium pt-2 border-t border-zinc-800/50">
            <span className="text-zinc-300">Total</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-white">
                {formatNumber(totalTokens)} tokens
              </span>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 font-mono">
                {formatCurrency(costs.totalCost)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Model & Estimate */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <Cpu className="h-4 w-4" />
              Model
            </div>
            <Badge variant="outline" className="border-zinc-700 text-zinc-300 font-mono text-xs">
              {session.model}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <TrendingUp className="h-4 w-4" />
              Estimated remaining
            </div>
            <span className="text-zinc-500 font-mono text-xs">
              ~{formatCurrency(estimatedRemainingCost * 60)} at current pace
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
