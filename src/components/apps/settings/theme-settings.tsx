'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

type Theme = 'dark' | 'light' | 'system';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red';

interface ThemeOption {
  id: Theme;
  name: string;
  icon: React.ElementType;
}

const themes: ThemeOption[] = [
  { id: 'dark', name: 'Dark', icon: Moon },
  { id: 'light', name: 'Light', icon: Sun },
  { id: 'system', name: 'System', icon: Monitor },
];

const accentColors: { id: AccentColor; name: string; color: string; bg: string }[] = [
  { id: 'blue', name: 'Blue', color: 'bg-blue-500', bg: 'ring-blue-500' },
  { id: 'purple', name: 'Purple', color: 'bg-purple-500', bg: 'ring-purple-500' },
  { id: 'green', name: 'Green', color: 'bg-green-500', bg: 'ring-green-500' },
  { id: 'orange', name: 'Orange', color: 'bg-orange-500', bg: 'ring-orange-500' },
  { id: 'pink', name: 'Pink', color: 'bg-pink-500', bg: 'ring-pink-500' },
  { id: 'red', name: 'Red', color: 'bg-red-500', bg: 'ring-red-500' },
];

export function ThemeSettings() {
  const [selectedTheme, setSelectedTheme] = useState<Theme>('dark');
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState('medium');

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-zinc-300">Theme</Label>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((theme) => {
            const Icon = theme.icon;
            const isSelected = selectedTheme === theme.id;
            return (
              <motion.button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon
                  className={`h-6 w-6 ${isSelected ? 'text-blue-400' : 'text-zinc-400'}`}
                />
                <span
                  className={`text-sm ${isSelected ? 'text-blue-400' : 'text-zinc-400'}`}
                >
                  {theme.name}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="theme-check"
                    className="absolute top-2 right-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className="h-4 w-4 text-blue-400" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="space-y-3">
        <Label className="text-zinc-300">Accent Color</Label>
        <div className="flex flex-wrap gap-3">
          {accentColors.map((color) => {
            const isSelected = accentColor === color.id;
            return (
              <motion.button
                key={color.id}
                onClick={() => setAccentColor(color.id)}
                className={`relative w-10 h-10 rounded-full ${color.color} transition-all ${
                  isSelected ? `ring-2 ring-offset-2 ring-offset-zinc-900 ${color.bg}` : ''
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={color.name}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check className="h-5 w-5 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="space-y-3">
        <Label className="text-zinc-300">Font Size</Label>
        <Select value={fontSize} onValueChange={setFontSize}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium (Default)</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-zinc-300">Reduce Motion</Label>
            <p className="text-xs text-zinc-500 mt-1">
              Minimize animations throughout the interface
            </p>
          </div>
          <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
        <h4 className="text-sm font-medium text-zinc-300 mb-3">Preview</h4>
        <div
          className={`p-4 rounded-lg border ${
            selectedTheme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-zinc-900 border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-8 h-8 rounded-full ${
                accentColors.find((c) => c.id === accentColor)?.color
              }`}
            />
            <div>
              <div
                className={`h-3 w-24 rounded ${
                  selectedTheme === 'light' ? 'bg-gray-800' : 'bg-zinc-200'
                }`}
              />
              <div
                className={`h-2 w-16 rounded mt-1 ${
                  selectedTheme === 'light' ? 'bg-gray-400' : 'bg-zinc-500'
                }`}
              />
            </div>
          </div>
          <div
            className={`h-2 w-full rounded ${
              selectedTheme === 'light' ? 'bg-gray-200' : 'bg-zinc-700'
            }`}
          />
          <div
            className={`h-2 w-3/4 rounded mt-2 ${
              selectedTheme === 'light' ? 'bg-gray-200' : 'bg-zinc-700'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
