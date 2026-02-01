'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Volume2, MessageSquare, AlertCircle, DollarSign, Clock } from 'lucide-react';

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  enabled: boolean;
}

export function NotificationSettings() {
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState([70]);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'messages',
      name: 'New Messages',
      description: 'When you receive messages',
      icon: MessageSquare,
      color: 'text-blue-400',
      enabled: true,
    },
    {
      id: 'errors',
      name: 'Errors & Alerts',
      description: 'When something goes wrong',
      icon: AlertCircle,
      color: 'text-red-400',
      enabled: true,
    },
    {
      id: 'costs',
      name: 'Cost Alerts',
      description: 'Budget warnings',
      icon: DollarSign,
      color: 'text-yellow-400',
      enabled: true,
    },
    {
      id: 'tasks',
      name: 'Task Completions',
      description: 'When agents finish tasks',
      icon: Clock,
      color: 'text-green-400',
      enabled: false,
    },
  ]);

  const toggleCategory = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-400/10">
            <Bell className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <Label className="text-zinc-200">Enable Notifications</Label>
            <p className="text-xs text-zinc-500 mt-0.5">Master toggle for all notifications</p>
          </div>
        </div>
        <Switch checked={globalEnabled} onCheckedChange={setGlobalEnabled} />
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-zinc-400" />
            <Label className="text-zinc-300">Sound</Label>
          </div>
          <Switch
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
            disabled={!globalEnabled}
          />
        </div>

        {soundEnabled && globalEnabled && (
          <div className="space-y-2 pl-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Volume</span>
              <span className="text-sm text-zinc-400">{soundVolume[0]}%</span>
            </div>
            <Slider
              value={soundVolume}
              onValueChange={setSoundVolume}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        )}
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-zinc-300">Quiet Hours</Label>
            <p className="text-xs text-zinc-500 mt-1">Silence notifications during set hours</p>
          </div>
          <Switch
            checked={quietHoursEnabled}
            onCheckedChange={setQuietHoursEnabled}
            disabled={!globalEnabled}
          />
        </div>

        {quietHoursEnabled && globalEnabled && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Start</Label>
              <Select value={quietStart} onValueChange={setQuietStart}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['20:00', '21:00', '22:00', '23:00', '00:00'].map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">End</Label>
              <Select value={quietEnd} onValueChange={setQuietEnd}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['06:00', '07:00', '08:00', '09:00', '10:00'].map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="space-y-3">
        <Label className="text-zinc-300">Notification Categories</Label>
        <div className="space-y-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${category.color}`} />
                  <div>
                    <span className="text-sm text-zinc-200">{category.name}</span>
                    <p className="text-xs text-zinc-500">{category.description}</p>
                  </div>
                </div>
                <Switch
                  checked={category.enabled}
                  onCheckedChange={() => toggleCategory(category.id)}
                  disabled={!globalEnabled}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
