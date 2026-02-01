'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, Database, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

export function MemorySettings() {
  const [autoMemory, setAutoMemory] = useState(true);
  const [memoryRetention, setMemoryRetention] = useState([30]);
  const [contextStrategy, setContextStrategy] = useState('sliding');
  const [maxMemorySize, setMaxMemorySize] = useState([100]);

  const usedMemory = 47;
  const memoryFiles = 23;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-zinc-200">Memory Usage</span>
          </div>
          <span className="text-sm text-zinc-400">{usedMemory} MB / {maxMemorySize[0]} MB</span>
        </div>
        <Progress value={(usedMemory / maxMemorySize[0]) * 100} className="h-2" />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-500">{memoryFiles} memory files</span>
          <Badge variant="secondary" className="bg-purple-400/10 text-purple-400">
            {((usedMemory / maxMemorySize[0]) * 100).toFixed(0)}% used
          </Badge>
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-zinc-300">Automatic Memory</Label>
            <p className="text-xs text-zinc-500 mt-1">
              Automatically save important context
            </p>
          </div>
          <Switch checked={autoMemory} onCheckedChange={setAutoMemory} />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-zinc-300">Context Strategy</Label>
        <Select value={contextStrategy} onValueChange={setContextStrategy}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sliding">
              <div className="flex items-center gap-2">
                <span>Sliding Window</span>
              </div>
            </SelectItem>
            <SelectItem value="summarization">
              <div className="flex items-center gap-2">
                <span>Auto Summarization</span>
              </div>
            </SelectItem>
            <SelectItem value="hierarchical">
              <div className="flex items-center gap-2">
                <span>Hierarchical</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-zinc-500">
          {contextStrategy === 'sliding' && 'Keep recent messages, drop oldest when limit reached'}
          {contextStrategy === 'summarization' && 'Summarize old context to save space'}
          {contextStrategy === 'hierarchical' && 'Organize memory into topic clusters'}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-zinc-300">Memory Retention</Label>
          <span className="text-sm text-zinc-400">{memoryRetention[0]} days</span>
        </div>
        <Slider
          value={memoryRetention}
          onValueChange={setMemoryRetention}
          min={1}
          max={90}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-zinc-500">
          How long to keep memory entries before auto-cleanup
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-zinc-300">Max Memory Size</Label>
          <span className="text-sm text-zinc-400">{maxMemorySize[0]} MB</span>
        </div>
        <Slider
          value={maxMemorySize}
          onValueChange={setMaxMemorySize}
          min={50}
          max={500}
          step={10}
          className="w-full"
        />
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="space-y-3">
        <Label className="text-zinc-300">Memory Actions</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="border-zinc-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Optimize
          </Button>
          <Button variant="outline" className="border-zinc-700 text-red-400 hover:text-red-300">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
          <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-200/80">
            Clearing memory will remove all stored context and learned preferences.
          </p>
        </div>
      </div>
    </div>
  );
}
