'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChannelTabs } from './channel-tabs';
import { ThreadList } from './thread-list';
import { ThreadView } from './thread-view';
import { ReplyBox } from './reply-box';
import { Thread, Message, Channel } from './types';
import { Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data for demonstration
const mockThreads: Thread[] = [
  {
    id: '1',
    channel: 'telegram',
    participants: [{ id: 'u1', name: 'Alex Chen', avatar: '' }],
    lastMessage: {
      id: 'm1',
      threadId: '1',
      channel: 'telegram',
      sender: { id: 'chief', name: 'Chief', isAgent: true },
      content: 'Task completed successfully. The deployment is live.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      status: 'read',
    },
    unreadCount: 0,
    isPinned: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: '2',
    channel: 'discord',
    participants: [{ id: 'u2', name: 'Sarah Miller' }],
    lastMessage: {
      id: 'm2',
      threadId: '2',
      channel: 'discord',
      sender: { id: 'u2', name: 'Sarah Miller' },
      content: 'Can you check the latest PR? I left some comments.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      status: 'delivered',
    },
    unreadCount: 3,
    updatedAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: '3',
    channel: 'telegram',
    participants: [{ id: 'u3', name: 'DevOps Team' }],
    lastMessage: {
      id: 'm3',
      threadId: '3',
      channel: 'telegram',
      sender: { id: 'u3', name: 'Mike' },
      content: 'Server metrics are back to normal.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      status: 'read',
    },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: '4',
    channel: 'email',
    participants: [{ id: 'u4', name: 'Jennifer Lopez' }],
    lastMessage: {
      id: 'm4',
      threadId: '4',
      channel: 'email',
      sender: { id: 'chief', name: 'Chief', isAgent: true },
      content: 'Here is the weekly report summary you requested.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      status: 'sent',
    },
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: 'm1-1',
      threadId: '1',
      channel: 'telegram',
      sender: { id: 'u1', name: 'Alex Chen' },
      content: 'Hey Chief, can you deploy the latest changes to production?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'read',
    },
    {
      id: 'm1-2',
      threadId: '1',
      channel: 'telegram',
      sender: { id: 'chief', name: 'Chief', isAgent: true },
      content: 'Sure, I\'ll start the deployment pipeline now. This includes the new authentication module and performance optimizations.',
      timestamp: new Date(Date.now() - 1000 * 60 * 28),
      status: 'read',
    },
    {
      id: 'm1-3',
      threadId: '1',
      channel: 'telegram',
      sender: { id: 'chief', name: 'Chief', isAgent: true },
      content: 'Deployment started. I\'ll notify you once it\'s complete.',
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      status: 'read',
    },
    {
      id: 'm1-4',
      threadId: '1',
      channel: 'telegram',
      sender: { id: 'u1', name: 'Alex Chen' },
      content: 'Thanks! Let me know if there are any issues.',
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
      status: 'read',
    },
    {
      id: 'm1-5',
      threadId: '1',
      channel: 'telegram',
      sender: { id: 'chief', name: 'Chief', isAgent: true },
      content: 'Task completed successfully. The deployment is live.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      status: 'read',
    },
  ],
  '2': [
    {
      id: 'm2-1',
      threadId: '2',
      channel: 'discord',
      sender: { id: 'u2', name: 'Sarah Miller' },
      content: 'Can you check the latest PR? I left some comments.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      status: 'delivered',
    },
  ],
};

export function MessageCenter() {
  const [activeChannel, setActiveChannel] = useState<Channel | 'all'>('all');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState(mockThreads);
  const [messages, setMessages] = useState(mockMessages);

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

  const selectedThread = threads.find((t) => t.id === selectedThreadId) || null;
  const selectedMessages = selectedThreadId ? messages[selectedThreadId] || [] : [];

  const handleSendMessage = (content: string) => {
    if (!selectedThreadId) return;

    const newMessage: Message = {
      id: `m-${Date.now()}`,
      threadId: selectedThreadId,
      channel: selectedThread?.channel || 'telegram',
      sender: { id: 'chief', name: 'Chief', isAgent: true },
      content,
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => ({
      ...prev,
      [selectedThreadId]: [...(prev[selectedThreadId] || []), newMessage],
    }));

    // Update thread's last message
    setThreads((prev) =>
      prev.map((t) =>
        t.id === selectedThreadId
          ? { ...t, lastMessage: newMessage, updatedAt: new Date() }
          : t
      )
    );

    // Simulate message being sent
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [selectedThreadId]: prev[selectedThreadId].map((m) =>
          m.id === newMessage.id ? { ...m, status: 'sent' as const } : m
        ),
      }));
    }, 500);
  };

  return (
    <Card className="h-full flex flex-col border-zinc-800 bg-zinc-900/50 backdrop-blur overflow-hidden">
      {/* Channel tabs */}
      <ChannelTabs
        activeChannel={activeChannel}
        onChannelChange={setActiveChannel}
        unreadCounts={unreadCounts}
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
            <ThreadList
              threads={filteredThreads}
              selectedThreadId={selectedThreadId}
              onSelectThread={setSelectedThreadId}
              showChannelBadge={activeChannel === 'all'}
            />
          </div>
        </div>

        {/* Thread view + Reply */}
        <div className="flex-1 flex flex-col min-w-0">
          <ThreadView thread={selectedThread} messages={selectedMessages} />
          <ReplyBox
            thread={selectedThread}
            onSendMessage={handleSendMessage}
            onSendAsChief={handleSendMessage}
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
