'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Cpu, Zap, DollarSign } from 'lucide-react';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  contextWindow: string;
  speed: 'fast' | 'medium' | 'slow';
  cost: 'low' | 'medium' | 'high';
}

const models: ModelOption[] = [
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    contextWindow: '200K',
    speed: 'medium',
    cost: 'high',
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    contextWindow: '200K',
    speed: 'fast',
    cost: 'medium',
  },
  {
    id: 'claude-haiku-3.5',
    name: 'Claude Haiku 3.5',
    provider: 'Anthropic',
    contextWindow: '200K',
    speed: 'fast',
    cost: 'low',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    contextWindow: '128K',
    speed: 'fast',
    cost: 'medium',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    contextWindow: '1M',
    speed: 'fast',
    cost: 'low',
  },
];

const speedColors = {
  fast: 'text-green-400',
  medium: 'text-yellow-400',
  slow: 'text-red-400',
};

const costColors = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

export function ModelSettings() {
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([4096]);
  const [streamEnabled, setStreamEnabled] = useState(true);
  const [thinkingEnabled, setThinkingEnabled] = useState(true);

  const currentModel = models.find((m) => m.id === selectedModel);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-zinc-300">Primary Model</Label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-zinc-400" />
                  <span>{model.name}</span>
                  <span className="text-xs text-zinc-500">({model.provider})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentModel && (
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
              {currentModel.contextWindow} context
            </Badge>
            <Badge variant="secondary" className="bg-zinc-800">
              <Zap className={`h-3 w-3 mr-1 ${speedColors[currentModel.speed]}`} />
              <span className={speedColors[currentModel.speed]}>{currentModel.speed}</span>
            </Badge>
            <Badge variant="secondary" className="bg-zinc-800">
              <DollarSign className={`h-3 w-3 mr-1 ${costColors[currentModel.cost]}`} />
              <span className={costColors[currentModel.cost]}>{currentModel.cost} cost</span>
            </Badge>
          </div>
        )}
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-zinc-300">Temperature</Label>
          <span className="text-sm text-zinc-400">{temperature[0].toFixed(2)}</span>
        </div>
        <Slider
          value={temperature}
          onValueChange={setTemperature}
          min={0}
          max={1}
          step={0.01}
          className="w-full"
        />
        <p className="text-xs text-zinc-500">
          Lower values make output more focused, higher values more creative
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-zinc-300">Max Output Tokens</Label>
          <span className="text-sm text-zinc-400">{maxTokens[0].toLocaleString()}</span>
        </div>
        <Slider
          value={maxTokens}
          onValueChange={setMaxTokens}
          min={256}
          max={16384}
          step={256}
          className="w-full"
        />
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-zinc-300">Streaming</Label>
            <p className="text-xs text-zinc-500 mt-1">Show responses as they generate</p>
          </div>
          <Switch checked={streamEnabled} onCheckedChange={setStreamEnabled} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-zinc-300">Extended Thinking</Label>
            <p className="text-xs text-zinc-500 mt-1">Enable chain-of-thought reasoning</p>
          </div>
          <Switch checked={thinkingEnabled} onCheckedChange={setThinkingEnabled} />
        </div>
      </div>
    </div>
  );
}
