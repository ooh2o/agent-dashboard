'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayName = dayNames[time.getDay()];
  const monthName = monthNames[time.getMonth()];
  const date = time.getDate();

  return (
    <div className="h-full flex flex-col items-center justify-center">
      {/* Time display */}
      <div className="flex items-baseline gap-1 font-mono">
        <motion.span
          key={hours}
          initial={{ opacity: 0.5, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-white"
        >
          {hours}
        </motion.span>
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-3xl font-bold text-zinc-400"
        >
          :
        </motion.span>
        <motion.span
          key={minutes}
          initial={{ opacity: 0.5, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-white"
        >
          {minutes}
        </motion.span>
        <span className="text-lg text-zinc-500 ml-1">{seconds}</span>
      </div>

      {/* Date display */}
      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
        <Clock className="h-3 w-3" />
        <span>{dayName}, {monthName} {date}</span>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-2xl" />
      </div>
    </div>
  );
}
