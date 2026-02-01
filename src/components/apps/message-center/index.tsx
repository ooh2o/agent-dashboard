'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChannelTabs } from './channel-tabs';
import { ThreadList } from './thread-list';
import { ThreadView } from './thread-view';
import { ReplyBox } from './reply-box';
import { Thread, Message, Channel, ChannelConfig } from './types';
import { Search, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import { useChannels, useMessages, useSendMessage } from '@/hooks/use-gateway';
import { useEventStream, type MessageEvent as SSEMessageEvent } from '@/hooks/use-event-stream';

/**
 * Convert gateway message format to local Message type
 */
function convertGatewayMessage(
  gatewayMsg: {
    id: string;
    channel: string;
    threadId?: string;
    sender: string;
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  },
  threadId: string
): Message {
  const isAgent = gatewayMsg.sender === 'chief' || gatewayMsg.sender === 'Chief';
  return {
    id: gatewayMsg.id,
    threadId: gatewayMsg.threadId || threadId,
    channel: gatewayMsg.channel as Channel,
    sender: {
      id: isAgent ? 'chief' : gatewayMsg.sender,
      name: isAgent ? 'Chief' : gatewayMsg.sender,
      isAgent,
    },
    content: gatewayMsg.content,
    timestamp: new Date(gatewayMsg.timestamp),
    status: 'read',
  };
}

/**
 * Group messages into threads based on sender/channel
 */
function groupMessagesIntoThreads(
  messages: Array<{
    id: string;
    channel: string;
    threadId?: string;
    sender: string;
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>
): Thread[] {
  const threadMap = new Map<string, Thread>();

  for (const msg of messages) {
    const threadId = msg.threadId || `${msg.channel}-${msg.sender}`;
    const isAgent = msg.sender === 'chief' || msg.sender === 'Chief';

    if (!threadMap.has(threadId)) {
      threadMap.set(threadId, {
        id: threadId,
        channel: msg.channel as Channel,
        participants: isAgent
          ? [{ id: 'chief', name: 'Chief' }]
          : [{ id: msg.sender, name: msg.sender }],
        unreadCount: 0,
        updatedAt: new Date(msg.timestamp),
      });
    }

    const thread = threadMap.get(threadId)!;
    const convertedMsg = convertGatewayMessage(msg, threadId);

    // Update last message if this is newer
    if (!thread.lastMessage || convertedMsg.timestamp > thread.lastMessage.timestamp) {
      thread.lastMessage = convertedMsg;
      thread.updatedAt = convertedMsg.timestamp;
    }
  }

  // Sort threads by last activity
  return Array.from(threadMap.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

export function MessageCenter() {
  const [activeChannel, setActiveChannel] = useState<Channel | 'all'>('all');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [sseMessages, setSseMessages] = useState<Message[]>([]);

  // Fetch channels
  const {
    data: channelsData,
    isLoading: channelsLoading,
    error: channelsError,
  } = useChannels();

  // Fetch messages
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useMessages({
    channel: activeChannel === 'all' ? undefined : activeChannel,
    search: searchQuery || undefined,
    limit: 100,
  });

  // Send message mutation
  const sendMessage = useSendMessage();

  // SSE for real-time updates
  const handleSSEMessage = useCallback((msg: SSEMessageEvent) => {
    const message: Message = {
      id: msg.id,
      threadId: msg.channel,
      channel: msg.channel as Channel,
      sender: {
        id: msg.sender,
        name: msg.sender,
        isAgent: msg.sender === 'chief' || msg.sender === 'Chief',
      },
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      status: 'delivered',
    };

    setSseMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });

    // Refetch messages to get full context
    refetchMessages();
  }, [refetchMessages]);

  const { isConnected, connectionError } = useEventStream({
    onMessage: handleSSEMessage,
  });

  // Convert channels data to ChannelConfig format
  const channels: ChannelConfig[] = useMemo(() => {
    if (!channelsData?.channels) {
      return [
        { id: 'telegram', name: 'Telegram', icon: 'telegram', color: 'text-sky-400', bgColor: 'bg-sky-400/10', connected: false },
        { id: 'discord', name: 'Discord', icon: 'discord', color: 'text-indigo-400', bgColor: 'bg-indigo-400/10', connected: false },
        { id: 'signal', name: 'Signal', icon: 'signal', color: 'text-blue-400', bgColor: 'bg-blue-400/10', connected: false },
        { id: 'email', name: 'Email', icon: 'email', color: 'text-amber-400', bgColor: 'bg-amber-400/10', connected: false },
      ];
    }

    return channelsData.channels.map((ch) => ({
      id: ch.id as Channel,
      name: ch.name,
      icon: ch.icon,
      color: ch.color,
      bgColor: ch.bgColor,
      connected: ch.connected,
    }));
  }, [channelsData]);

  // Convert messages to threads
  const threads = useMemo(() => {
    const gatewayMessages = messagesData?.messages || [];
    return groupMessagesIntoThreads(gatewayMessages);
  }, [messagesData]);

  // Build messages map for thread view
  const messagesMap = useMemo(() => {
    const map: Record<string, Message[]> = {};
    const gatewayMessages = messagesData?.messages || [];

    for (const msg of gatewayMessages) {
      const threadId = msg.threadId || `${msg.channel}-${msg.sender}`;
      if (!map[threadId]) {
        map[threadId] = [];
      }
      map[threadId].push(convertGatewayMessage(msg, threadId));
    }

    // Add SSE messages
    for (const msg of sseMessages) {
      const threadId = msg.threadId;
      if (!map[threadId]) {
        map[threadId] = [];
      }
      // Avoid duplicates
      if (!map[threadId].some((m) => m.id === msg.id)) {
        map[threadId].push(msg);
      }
    }

    // Add optimistic messages
    for (const msg of optimisticMessages) {
      const threadId = msg.threadId;
      if (!map[threadId]) {
        map[threadId] = [];
      }
      map[threadId].push(msg);
    }

    // Sort messages by timestamp within each thread
    for (const threadId of Object.keys(map)) {
      map[threadId].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    return map;
  }, [messagesData, sseMessages, optimisticMessages]);

  // Filter threads by channel and search
  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const matchesChannel = activeChannel === 'all' || thread.channel === activeChannel;
      const matchesSearch =
        !searchQuery ||
        thread.participants.some((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        thread.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesChannel && matchesSearch;
    });
  }, [threads, activeChannel, searchQuery]);

  // Calculate unread counts by channel
  const unreadCounts = useMemo(() => {
    const counts: Record<Channel | 'all', number> = {
      all: 0,
      telegram: 0,
      discord: 0,
      signal: 0,
      email: 0,
    };
    threads.forEach((thread) => {
      counts[thread.channel] += thread.unreadCount;
      counts.all += thread.unreadCount;
    });
    return counts;
  }, [threads]);

  // Auto-select first thread when threads change
  useEffect(() => {
    if (!selectedThreadId && filteredThreads.length > 0) {
      setSelectedThreadId(filteredThreads[0].id);
    }
  }, [filteredThreads, selectedThreadId]);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) || null;
  const selectedMessages = selectedThreadId ? messagesMap[selectedThreadId] || [] : [];

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedThread) return;

      // Create optimistic message
      const optimisticMsg: Message = {
        id: `optimistic-${Date.now()}`,
        threadId: selectedThread.id,
        channel: selectedThread.channel,
        sender: { id: 'chief', name: 'Chief', isAgent: true },
        content,
        timestamp: new Date(),
        status: 'sending',
      };

      setOptimisticMessages((prev) => [...prev, optimisticMsg]);

      try {
        await sendMessage.mutateAsync({
          channel: selectedThread.channel,
          content,
          threadId: selectedThread.id,
        });

        // Update optimistic message to sent
        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMsg.id ? { ...m, status: 'sent' as const } : m
          )
        );

        // Remove optimistic message after refetch
        setTimeout(() => {
          setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        }, 2000);
      } catch {
        // Mark as failed
        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMsg.id ? { ...m, status: 'failed' as const } : m
          )
        );
      }
    },
    [selectedThread, sendMessage]
  );

  const isLoading = messagesLoading && !messagesData;
  const hasError = messagesError || channelsError;

  return (
    <Card className="h-full flex flex-col border-zinc-800 bg-zinc-900/50 backdrop-blur overflow-hidden">
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs">
          <WifiOff className="h-3 w-3" />
          <span>{connectionError || 'Connecting to real-time updates...'}</span>
        </div>
      )}

      {/* Channel tabs */}
      <ChannelTabs
        activeChannel={activeChannel}
        onChannelChange={setActiveChannel}
        unreadCounts={unreadCounts}
        channels={channels}
        isLoading={channelsLoading}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Thread list sidebar */}
        <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
          {/* Search */}
          <div className="p-3 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <span className="text-sm">Loading messages...</span>
              </div>
            ) : hasError ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 px-4">
                <AlertCircle className="h-6 w-6 mb-2 text-red-400" />
                <span className="text-sm text-center">
                  Failed to load messages. Check gateway connection.
                </span>
              </div>
            ) : (
              <ThreadList
                threads={filteredThreads}
                selectedThreadId={selectedThreadId}
                onSelectThread={setSelectedThreadId}
                showChannelBadge={activeChannel === 'all'}
              />
            )}
          </div>
        </div>

        {/* Thread view + Reply */}
        <div className="flex-1 flex flex-col min-w-0">
          <ThreadView thread={selectedThread} messages={selectedMessages} />
          <ReplyBox
            thread={selectedThread}
            onSendMessage={handleSendMessage}
            onSendAsChief={handleSendMessage}
            disabled={sendMessage.isPending}
          />
        </div>
      </div>
    </Card>
  );
}

export { ChannelTabs } from './channel-tabs';
export { ThreadList } from './thread-list';
export { ThreadView } from './thread-view';
export { ReplyBox } from './reply-box';
export * from './types';
