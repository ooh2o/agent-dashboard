'use client';

import { cn } from '@/lib/utils';
import { Channel, ChannelConfig } from './types';
import { MessageCircle, Hash, Shield, Mail, Inbox } from 'lucide-react';

const channels: ChannelConfig[] = [
  { id: 'telegram', name: 'Telegram', icon: 'telegram', color: 'text-sky-400', bgColor: 'bg-sky-400/10', connected: true },
  { id: 'discord', name: 'Discord', icon: 'discord', color: 'text-indigo-400', bgColor: 'bg-indigo-400/10', connected: true },
  { id: 'signal', name: 'Signal', icon: 'signal', color: 'text-blue-400', bgColor: 'bg-blue-400/10', connected: false },
  { id: 'email', name: 'Email', icon: 'email', color: 'text-amber-400', bgColor: 'bg-amber-400/10', connected: true },
];

const channelIcons: Record<Channel | 'all', React.ElementType> = {
  all: Inbox,
  telegram: MessageCircle,
  discord: Hash,
  signal: Shield,
  email: Mail,
};

interface ChannelTabsProps {
  activeChannel: Channel | 'all';
  onChannelChange: (channel: Channel | 'all') => void;
  unreadCounts: Record<Channel | 'all', number>;
}

export function ChannelTabs({ activeChannel, onChannelChange, unreadCounts }: ChannelTabsProps) {
  const AllIcon = channelIcons.all;

  return (
    <div className="flex items-center gap-1 p-2 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
      <button
        onClick={() => onChannelChange('all')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
          activeChannel === 'all'
            ? 'bg-zinc-700 text-white'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        )}
      >
        <AllIcon className="h-4 w-4" />
        <span>All</span>
        {unreadCounts.all > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-bold text-white">
            {unreadCounts.all > 99 ? '99+' : unreadCounts.all}
          </span>
        )}
      </button>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      {channels.map((channel) => {
        const Icon = channelIcons[channel.id];
        const count = unreadCounts[channel.id] || 0;
        const isActive = activeChannel === channel.id;

        return (
          <button
            key={channel.id}
            onClick={() => onChannelChange(channel.id)}
            disabled={!channel.connected}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              isActive
                ? `${channel.bgColor} ${channel.color}`
                : channel.connected
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  : 'text-zinc-600 cursor-not-allowed'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{channel.name}</span>
            {count > 0 && (
              <span className={cn(
                'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-zinc-700 text-zinc-300'
              )}>
                {count > 99 ? '99+' : count}
              </span>
            )}
            {!channel.connected && (
              <span className="text-[10px] text-zinc-600 uppercase tracking-wide">off</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
