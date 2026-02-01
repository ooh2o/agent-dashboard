'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Thread, Channel } from './types';
import { formatDistanceToNow } from '@/lib/format';
import { Pin, VolumeX, MessageCircle, Hash, Shield, Mail } from 'lucide-react';

const channelIcons: Record<Channel, React.ElementType> = {
  telegram: MessageCircle,
  discord: Hash,
  signal: Shield,
  email: Mail,
};

const channelColors: Record<Channel, string> = {
  telegram: 'text-sky-400',
  discord: 'text-indigo-400',
  signal: 'text-blue-400',
  email: 'text-amber-400',
};

interface ThreadListProps {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  showChannelBadge?: boolean;
}

export function ThreadList({ threads, selectedThreadId, onSelectThread, showChannelBadge = false }: ThreadListProps) {
  const sortedThreads = [...threads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return (
    <ScrollArea className="h-full">
      <AnimatePresence initial={false}>
        {sortedThreads.map((thread, index) => {
          const isSelected = selectedThreadId === thread.id;
          const ChannelIcon = channelIcons[thread.channel];
          const primaryParticipant = thread.participants[0];

          return (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15, delay: index * 0.02 }}
            >
              <button
                onClick={() => onSelectThread(thread.id)}
                className={cn(
                  'w-full px-3 py-3 text-left transition-all border-b border-zinc-800/50',
                  isSelected
                    ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                    : 'hover:bg-zinc-800/50 border-l-2 border-l-transparent'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold',
                      isSelected ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-300'
                    )}>
                      {primaryParticipant?.avatar ? (
                        <img
                          src={primaryParticipant.avatar}
                          alt={primaryParticipant.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        primaryParticipant?.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {showChannelBadge && (
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-zinc-900 flex items-center justify-center',
                        channelColors[thread.channel]
                      )}>
                        <ChannelIcon className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-medium truncate',
                        thread.unreadCount > 0 ? 'text-white' : 'text-zinc-300'
                      )}>
                        {primaryParticipant?.name || 'Unknown'}
                      </span>
                      {thread.isPinned && (
                        <Pin className="h-3 w-3 text-zinc-500 shrink-0" />
                      )}
                      {thread.isMuted && (
                        <VolumeX className="h-3 w-3 text-zinc-500 shrink-0" />
                      )}
                    </div>
                    {thread.lastMessage && (
                      <p className={cn(
                        'text-sm truncate mt-0.5',
                        thread.unreadCount > 0 ? 'text-zinc-300' : 'text-zinc-500'
                      )}>
                        {thread.lastMessage.sender.isAgent && (
                          <span className="text-blue-400">Chief: </span>
                        )}
                        {thread.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-zinc-500">
                      {formatDistanceToNow(thread.updatedAt)}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-bold text-white">
                        {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {threads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">No conversations yet</p>
        </div>
      )}
    </ScrollArea>
  );
}
