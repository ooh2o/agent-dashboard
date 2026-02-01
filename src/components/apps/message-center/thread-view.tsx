'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Message, Thread } from './types';
import { Check, CheckCheck, Clock, AlertCircle, Bot } from 'lucide-react';

interface ThreadViewProps {
  thread: Thread | null;
  messages: Message[];
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatMessageDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
}

const statusIcons = {
  sending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: AlertCircle,
};

const statusColors = {
  sending: 'text-zinc-500',
  sent: 'text-zinc-500',
  delivered: 'text-zinc-400',
  read: 'text-blue-400',
  failed: 'text-red-400',
};

export function ThreadView({ thread, messages }: ThreadViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!thread) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900/50 text-zinc-500">
        <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <Bot className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium text-zinc-400">Select a conversation</p>
        <p className="text-sm mt-1">Choose a thread from the sidebar to start messaging</p>
      </div>
    );
  }

  // Group messages by date
  const messagesByDate = messages.reduce<Record<string, Message[]>>((acc, message) => {
    const dateKey = message.timestamp.toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(message);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col bg-zinc-900/30">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <div className="h-9 w-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-300">
          {thread.participants[0]?.avatar ? (
            <img
              src={thread.participants[0].avatar}
              alt={thread.participants[0].name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            thread.participants[0]?.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">
            {thread.participants[0]?.name || 'Unknown'}
          </h3>
          <p className="text-xs text-zinc-500">
            {thread.participants.length > 1
              ? `${thread.participants.length} participants`
              : 'Direct message'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-4">
          <AnimatePresence initial={false}>
            {Object.entries(messagesByDate).map(([dateKey, dateMessages]) => (
              <div key={dateKey}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-xs text-zinc-500 font-medium">
                    {formatMessageDate(new Date(dateKey))}
                  </span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Messages for this date */}
                {dateMessages.map((message, index) => {
                  const isFromAgent = message.sender.isAgent;
                  const showAvatar = index === 0 ||
                    dateMessages[index - 1]?.sender.id !== message.sender.id;
                  const StatusIcon = statusIcons[message.status];

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'flex gap-2 mb-1',
                        isFromAgent ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {/* Incoming message avatar */}
                      {!isFromAgent && (
                        <div className="w-8 shrink-0">
                          {showAvatar && (
                            <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
                              {message.sender.avatar ? (
                                <img
                                  src={message.sender.avatar}
                                  alt={message.sender.name}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                message.sender.name.charAt(0).toUpperCase()
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2',
                          isFromAgent
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                        )}
                      >
                        {showAvatar && !isFromAgent && (
                          <p className="text-xs font-medium text-zinc-400 mb-1">
                            {message.sender.name}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className={cn(
                          'flex items-center gap-1.5 mt-1',
                          isFromAgent ? 'justify-end' : 'justify-start'
                        )}>
                          <span className={cn(
                            'text-[10px]',
                            isFromAgent ? 'text-blue-200' : 'text-zinc-500'
                          )}>
                            {formatMessageTime(message.timestamp)}
                          </span>
                          {isFromAgent && (
                            <StatusIcon className={cn('h-3 w-3', statusColors[message.status])} />
                          )}
                        </div>
                      </div>

                      {/* Outgoing message spacer */}
                      {isFromAgent && <div className="w-8 shrink-0" />}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <p className="text-sm">No messages in this conversation</p>
              <p className="text-xs mt-1">Send a message to start the conversation</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
