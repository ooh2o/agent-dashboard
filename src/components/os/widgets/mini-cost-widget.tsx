'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';

export function MiniCostWidget() {
  const [todaysCost, setTodaysCost] = useState(0);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const prevCost = useRef(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/live/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.today) {
          const newCost = data.today.cost || 0;
          const newTokens = data.today.tokens || 0;
          
          // Determine trend
          if (newCost > prevCost.current + 0.01) {
            setTrend('up');
          } else if (newCost < prevCost.current) {
            setTrend('down');
          } else {
            setTrend('stable');
          }
          prevCost.current = newCost;
          
          setTodaysCost(newCost);
          setTokensUsed(newTokens);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Initial fetch and auto-refresh every 10 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const budgetLimit = 10; // $10 daily budget
  const percentUsed = (todaysCost / budgetLimit) * 100;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Coins className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs text-zinc-300 font-medium">Today&apos;s Spend</span>
      </div>

      {/* Main cost display */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-end gap-2">
          <motion.span
            key={todaysCost.toFixed(2)}
            initial={{ scale: 1.1, color: '#34d399' }}
            animate={{ scale: 1, color: '#ffffff' }}
            className="text-2xl font-bold text-white font-mono"
          >
            {formatCurrency(todaysCost)}
          </motion.span>
          {trend !== 'stable' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-0.5 ${
                trend === 'up' ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
            </motion.div>
          )}
        </div>

        {/* Token count */}
        <div className="text-xs text-zinc-500 mt-1">
          {formatNumber(tokensUsed)} tokens
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
            <span>Budget</span>
            <span>{Math.min(percentUsed, 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentUsed, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                percentUsed > 80
                  ? 'bg-gradient-to-r from-amber-500 to-red-500'
                  : percentUsed > 50
                  ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
