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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Code, Calendar } from 'lucide-react';

interface CronJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const presets = [
  { label: 'Every minute', cron: '* * * * *' },
  { label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Daily at midnight', cron: '0 0 * * *' },
  { label: 'Daily at 9 AM', cron: '0 9 * * *' },
  { label: 'Weekly (Mondays)', cron: '0 9 * * 1' },
  { label: 'Monthly (1st)', cron: '0 0 1 * *' },
];

export function CronJobModal({ open, onOpenChange }: CronJobModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cronExpression, setCronExpression] = useState('0 * * * *');
  const [command, setCommand] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const applyPreset = (cron: string) => {
    setCronExpression(cron);
    setSelectedPreset(cron);
  };

  const parseCronExpression = (cron: string) => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return 'Invalid expression';

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (cron === '* * * * *') return 'Every minute';
    if (cron === '0 * * * *') return 'Every hour';
    if (cron.match(/^\*\/\d+ \* \* \* \*$/)) {
      return `Every ${minute.split('/')[1]} minutes`;
    }
    if (cron.match(/^0 \*\/\d+ \* \* \*$/)) {
      return `Every ${hour.split('/')[1]} hours`;
    }
    if (cron.match(/^0 \d+ \* \* \*$/)) {
      return `Daily at ${hour}:00`;
    }
    if (cron.match(/^0 \d+ \* \* \d$/)) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Every ${days[parseInt(dayOfWeek)]} at ${hour}:00`;
    }

    return 'Custom schedule';
  };

  const handleSave = () => {
    // Save logic here
    onOpenChange(false);
    setName('');
    setDescription('');
    setCronExpression('0 * * * *');
    setCommand('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-400" />
            Create Cron Job
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Job Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Backup"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this job do?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Schedule</Label>
            <Tabs defaultValue="preset">
              <TabsList className="w-full">
                <TabsTrigger value="preset" className="flex-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  Preset
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex-1">
                  <Code className="h-4 w-4 mr-1" />
                  Custom
                </TabsTrigger>
              </TabsList>
              <TabsContent value="preset" className="mt-3">
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.cron}
                      onClick={() => applyPreset(preset.cron)}
                      className={`p-2 text-left rounded-lg border text-sm transition-colors ${
                        selectedPreset === preset.cron
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-xs text-zinc-500 font-mono mt-1">
                        {preset.cron}
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="custom" className="mt-3 space-y-3">
                <div className="space-y-2">
                  <Input
                    value={cronExpression}
                    onChange={(e) => {
                      setCronExpression(e.target.value);
                      setSelectedPreset(null);
                    }}
                    placeholder="* * * * *"
                    className="font-mono"
                  />
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>Format:</span>
                    <code className="bg-zinc-800 px-1 rounded">minute</code>
                    <code className="bg-zinc-800 px-1 rounded">hour</code>
                    <code className="bg-zinc-800 px-1 rounded">day</code>
                    <code className="bg-zinc-800 px-1 rounded">month</code>
                    <code className="bg-zinc-800 px-1 rounded">weekday</code>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-400">
                {parseCronExpression(cronExpression)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Command / Action</Label>
            <Select value={command} onValueChange={setCommand}>
              <SelectTrigger>
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backup">Run Backup</SelectItem>
                <SelectItem value="cleanup">Memory Cleanup</SelectItem>
                <SelectItem value="sync">Channel Sync</SelectItem>
                <SelectItem value="report">Generate Report</SelectItem>
                <SelectItem value="health">Health Check</SelectItem>
                <SelectItem value="custom">Custom Command</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {command === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Command</Label>
              <Input placeholder="Enter command to execute" className="font-mono" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Create Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
