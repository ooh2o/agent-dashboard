'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Calendar, Clock, Repeat, MessageSquare } from 'lucide-react';

interface ReminderCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReminderCreator({ open, onOpenChange }: ReminderCreatorProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState('daily');
  const [notifyChannel, setNotifyChannel] = useState(false);
  const [channel, setChannel] = useState('telegram');

  const handleSave = () => {
    // Save logic here
    onOpenChange(false);
    setTitle('');
    setNotes('');
    setDate('');
    setTime('');
    setRecurring(false);
    setNotifyChannel(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-400" />
            Create Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Reminder Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Review daily logs"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-zinc-400" />
                Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-zinc-400" />
                Time
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="h-px bg-zinc-800" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-zinc-400" />
                <Label>Recurring</Label>
              </div>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>

            {recurring && (
              <div className="pl-6">
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekdays">Weekdays only</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-800" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-zinc-400" />
                <div>
                  <Label>Send to Channel</Label>
                  <p className="text-xs text-zinc-500">Also notify via messaging</p>
                </div>
              </div>
              <Switch checked={notifyChannel} onCheckedChange={setNotifyChannel} />
            </div>

            {notifyChannel && (
              <div className="pl-6">
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="all">All Channels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Bell className="h-4 w-4 mr-1" />
            Create Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
