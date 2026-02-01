'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Send,
  Hash,
  Mail,
  Globe,
  Smartphone,
  Settings,
  Check,
  AlertCircle,
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  enabled: boolean;
  connected: boolean;
  status: 'connected' | 'disconnected' | 'error';
}

const initialChannels: Channel[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    icon: Send,
    color: 'text-blue-400',
    enabled: true,
    connected: true,
    status: 'connected',
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: Hash,
    color: 'text-indigo-400',
    enabled: true,
    connected: true,
    status: 'connected',
  },
  {
    id: 'signal',
    name: 'Signal',
    icon: MessageSquare,
    color: 'text-blue-500',
    enabled: false,
    connected: false,
    status: 'disconnected',
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    color: 'text-red-400',
    enabled: true,
    connected: true,
    status: 'connected',
  },
  {
    id: 'web',
    name: 'Web Chat',
    icon: Globe,
    color: 'text-green-400',
    enabled: true,
    connected: true,
    status: 'connected',
  },
  {
    id: 'sms',
    name: 'SMS',
    icon: Smartphone,
    color: 'text-orange-400',
    enabled: false,
    connected: false,
    status: 'disconnected',
  },
];

const statusConfig = {
  connected: { color: 'text-green-400', bg: 'bg-green-400/10', icon: Check },
  disconnected: { color: 'text-zinc-500', bg: 'bg-zinc-500/10', icon: AlertCircle },
  error: { color: 'text-red-400', bg: 'bg-red-400/10', icon: AlertCircle },
};

export function ChannelSettings() {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);

  const toggleChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((channel) =>
        channel.id === channelId ? { ...channel, enabled: !channel.enabled } : channel
      )
    );
  };

  const activeCount = channels.filter((c) => c.enabled && c.connected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Connected Channels</h3>
          <p className="text-xs text-zinc-500 mt-1">
            {activeCount} active channel{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-400/10 text-green-400">
          {activeCount} Active
        </Badge>
      </div>

      <div className="space-y-3">
        {channels.map((channel, index) => {
          const Icon = channel.icon;
          const StatusIcon = statusConfig[channel.status].icon;

          return (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-700/50">
                  <Icon className={`h-5 w-5 ${channel.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-zinc-200">{channel.name}</Label>
                    <div
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${statusConfig[channel.status].bg} ${statusConfig[channel.status].color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {channel.status}
                    </div>
                  </div>
                  {channel.enabled && channel.connected && (
                    <p className="text-xs text-zinc-500 mt-0.5">Receiving messages</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {channel.connected && (
                  <Button variant="ghost" size="icon-sm" className="text-zinc-400">
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
                <Switch
                  checked={channel.enabled}
                  onCheckedChange={() => toggleChannel(channel.id)}
                  disabled={!channel.connected}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="pt-2">
        <Button variant="outline" className="w-full border-dashed border-zinc-700">
          + Add New Channel
        </Button>
      </div>
    </div>
  );
}
