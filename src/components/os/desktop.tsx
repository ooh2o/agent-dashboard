'use client';

import React, { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWindowStore } from '@/lib/stores/window-store';
import { useDashboardStore, selectActivities } from '@/lib/store';
import { APPS, getApp } from '@/lib/apps-registry';
import { Window } from './window';
import type { AppDefinition, WindowState } from './types';

// Lazy load app components for better performance
const ActivityMonitorBase = lazy(() => import('@/components/apps/activity-monitor').then(m => ({ default: m.ActivityMonitor })));
const CostDashboard = lazy(() => import('@/components/apps/cost-dashboard').then(m => ({ default: m.CostDashboard })));
const MessageCenter = lazy(() => import('@/components/apps/message-center').then(m => ({ default: m.MessageCenter })));
const TerminalConsole = lazy(() => import('@/components/apps/terminal').then(m => ({ default: m.TerminalConsole })));
const Workflows = lazy(() => import('@/components/apps/workflows').then(m => ({ default: m.Workflows })));
const AnalyticsDashboard = lazy(() => import('@/components/apps/analytics').then(m => ({ default: m.AnalyticsDashboard })));
const RalphMonitor = lazy(() => import('@/components/apps/ralph-monitor').then(m => ({ default: m.RalphMonitor })));

// Wrapper for ActivityMonitor to inject activities from store
function ActivityMonitor({ onClose, onMinimize, onMaximize }: {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}) {
  const activities = useDashboardStore(selectActivities);
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full text-zinc-500"><div className="animate-pulse">Loading...</div></div>}>
      <ActivityMonitorBase
        activities={activities}
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
      />
    </Suspense>
  );
}

// Map app IDs to their components
const APP_COMPONENTS: Record<string, React.ComponentType<{
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}>> = {
  'activity-monitor': ActivityMonitor,
  'cost-dashboard': CostDashboard,
  'message-center': MessageCenter,
  'terminal': TerminalConsole,
  'workflows': Workflows,
  'analytics': AnalyticsDashboard,
  'ralph-monitor': RalphMonitor,
};

function AppContent({ win }: { win: WindowState }) {
  const { closeWindow, minimizeWindow, maximizeWindow } = useWindowStore();
  const app = getApp(win.appId);
  const AppComponent = APP_COMPONENTS[win.appId];

  if (AppComponent) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-full text-zinc-500">
          <div className="animate-pulse">Loading...</div>
        </div>
      }>
        <AppComponent
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
        />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-400">
      <span className="text-6xl">{app?.icon || '📱'}</span>
      <span className="text-lg font-medium">{win.title}</span>
      <span className="text-sm text-zinc-500">App content coming soon...</span>
    </div>
  );
}

interface DesktopProps {
  children?: React.ReactNode;
}

function AppIcon({ app, onDoubleClick }: { app: AppDefinition; onDoubleClick: () => void }) {
  return (
    <motion.button
      className={cn(
        'flex flex-col items-center gap-1 p-3 rounded-xl',
        'hover:bg-white/10 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-white/20',
        'cursor-default select-none'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onDoubleClick={onDoubleClick}
    >
      <span className="text-4xl drop-shadow-lg">{app.icon}</span>
      <span className="text-xs text-white font-medium drop-shadow-md max-w-16 truncate">
        {app.name}
      </span>
    </motion.button>
  );
}

export function Desktop({ children }: DesktopProps) {
  const { windows, openWindow } = useWindowStore();

  const handleOpenApp = (app: AppDefinition) => {
    openWindow(app.id, app.name);
  };

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden',
        'bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900',
        'pt-7 pb-20' // Space for menu bar and dock
      )}
      style={{
        backgroundImage: `
          radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(236, 72, 153, 0.1), transparent 50%),
          radial-gradient(ellipse at bottom left, rgba(34, 197, 94, 0.1), transparent 50%)
        `,
      }}
    >
      {/* Desktop Icons Grid */}
      <div className="absolute top-10 right-4 flex flex-col gap-1 items-end">
        {APPS.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <AppIcon app={app} onDoubleClick={() => handleOpenApp(app)} />
          </motion.div>
        ))}
      </div>

      {/* Windows */}
      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.id} window={win}>
            <AppContent win={win} />
          </Window>
        ))}
      </AnimatePresence>

      {/* Additional children (e.g., Spotlight) */}
      {children}
    </div>
  );
}
