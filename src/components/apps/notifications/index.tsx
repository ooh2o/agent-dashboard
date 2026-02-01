'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ListTodo,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Trash2,
  Settings2,
  Moon,
  Filter,
  MoreHorizontal,
} from 'lucide-react';
import { Notification, NotificationType, NotificationPriority } from '@/lib/types';
import { mockNotifications } from '@/lib/mock-data';
import { formatDistanceToNow } from '@/lib/format';

const typeConfig: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  info: { icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-400/10', label: 'Info' },
  success: { icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-400/10', label: 'Success' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', label: 'Warning' },
  error: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-400/10', label: 'Error' },
  task: { icon: ListTodo, color: 'text-purple-400', bgColor: 'bg-purple-400/10', label: 'Task' },
  message: { icon: MessageSquare, color: 'text-pink-400', bgColor: 'bg-pink-400/10', label: 'Message' },
};

const priorityConfig: Record<NotificationPriority, { color: string; label: string }> = {
  low: { color: 'text-zinc-500', label: 'Low' },
  medium: { color: 'text-zinc-300', label: 'Medium' },
  high: { color: 'text-orange-400', label: 'High' },
  urgent: { color: 'text-red-400', label: 'Urgent' },
};

interface NotificationGroup {
  source: string;
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showGrouped, setShowGrouped] = useState(true);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const groupedNotifications = useMemo((): NotificationGroup[] => {
    const groups: Record<string, Notification[]> = {};
    filteredNotifications.forEach((n) => {
      const source = n.source;
      if (!groups[source]) {
        groups[source] = [];
      }
      groups[source].push(n);
    });

    return Object.entries(groups)
      .map(([source, notifs]) => ({
        source,
        notifications: notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        unreadCount: notifs.filter((n) => !n.read).length,
      }))
      .sort((a, b) => {
        // Sort by most recent notification in group
        const aLatest = a.notifications[0]?.timestamp.getTime() || 0;
        const bLatest = b.notifications[0]?.timestamp.getTime() || 0;
        return bLatest - aLatest;
      });
  }, [filteredNotifications]);

  const toggleGroup = (source: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markGroupAsRead = (source: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.source === source ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const renderNotification = (notification: Notification, isInGroup = false) => {
    const config = typeConfig[notification.type];
    const priority = priorityConfig[notification.priority];
    const Icon = config.icon;

    return (
      <motion.div
        key={notification.id}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className={`group relative flex items-start gap-3 p-3 rounded-lg transition-colors ${
          notification.read
            ? 'bg-zinc-900/30 hover:bg-zinc-800/30'
            : 'bg-zinc-800/50 hover:bg-zinc-800/70'
        } ${isInGroup ? 'ml-6' : ''}`}
      >
        {/* Unread indicator */}
        {!notification.read && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-l-lg" />
        )}

        {/* Icon */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={`font-medium text-sm ${notification.read ? 'text-zinc-400' : 'text-zinc-100'}`}>
                  {notification.title}
                </p>
                {notification.priority === 'urgent' && (
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                    URGENT
                  </Badge>
                )}
                {notification.priority === 'high' && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-orange-400 border-orange-400/30">
                    HIGH
                  </Badge>
                )}
              </div>
              <p className={`text-sm ${notification.read ? 'text-zinc-500' : 'text-zinc-300'}`}>
                {notification.message}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-zinc-500">
                  {formatDistanceToNow(notification.timestamp)}
                </span>
                {!isInGroup && (
                  <span className="text-xs text-zinc-600">
                    {notification.source}
                  </span>
                )}
                {notification.actionLabel && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-blue-400 hover:text-blue-300"
                  >
                    {notification.actionLabel}
                  </Button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => markAsRead(notification.id)}
                  className="text-zinc-400 hover:text-zinc-200"
                  title="Mark as read"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => deleteNotification(notification.id)}
                className="text-zinc-400 hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              doNotDisturb ? 'bg-zinc-700' : 'bg-blue-500/10'
            }`}>
              {doNotDisturb ? (
                <BellOff className="h-5 w-5 text-zinc-400" />
              ) : (
                <Bell className="h-5 w-5 text-blue-400" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">Notification Center</h1>
              <p className="text-sm text-zinc-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* DND Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50">
              <Moon className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">DND</span>
              <Switch
                checked={doNotDisturb}
                onCheckedChange={setDoNotDisturb}
              />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className={`text-xs ${filter === 'all' ? 'bg-zinc-700' : ''}`}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
              className={`text-xs ${filter === 'unread' ? 'bg-zinc-700' : ''}`}
            >
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-1.5 bg-blue-500 text-white text-[10px] px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <div className="w-px h-4 bg-zinc-700 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGrouped(!showGrouped)}
              className="text-xs text-zinc-400"
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {showGrouped ? 'Grouped' : 'Timeline'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs text-zinc-400 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {doNotDisturb && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 mb-4"
            >
              <BellOff className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-300">Do Not Disturb is on</p>
                <p className="text-xs text-zinc-500">New notifications are silenced</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {showGrouped ? (
              // Grouped view
              groupedNotifications.map((group) => {
                const isExpanded = expandedGroups.has(group.source);

                return (
                  <motion.div
                    key={group.source}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-2"
                  >
                    {/* Group Header */}
                    <div
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/30 cursor-pointer"
                      onClick={() => toggleGroup(group.source)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-zinc-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-zinc-500" />
                        )}
                        <span className="text-sm font-medium text-zinc-300">{group.source}</span>
                        {group.unreadCount > 0 && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">
                            {group.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-zinc-600">
                          ({group.notifications.length})
                        </span>
                      </div>
                      {group.unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            markGroupAsRead(group.source);
                          }}
                          className="text-xs text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark read
                        </Button>
                      )}
                    </div>

                    {/* Group Notifications */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-1.5 mt-1"
                        >
                          {group.notifications.map((notification) =>
                            renderNotification(notification, true)
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              // Timeline view
              filteredNotifications
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((notification) => renderNotification(notification))
            )}
          </AnimatePresence>

          {/* Empty State */}
          {filteredNotifications.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-zinc-500"
            >
              <Bell className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium text-zinc-400">No notifications</p>
              <p className="text-sm">
                {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here'}
              </p>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with stats */}
      <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span>{notifications.length} total</span>
            <span>{unreadCount} unread</span>
            <span>{groupedNotifications.length} sources</span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            className="text-zinc-500 hover:text-zinc-300"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotificationCenter;
