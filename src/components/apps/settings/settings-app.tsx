'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings,
  Cpu,
  MessageSquare,
  Brain,
  Bell,
  Palette,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelSettings } from './model-settings';
import { ChannelSettings } from './channel-settings';
import { MemorySettings } from './memory-settings';
import { NotificationSettings } from './notification-settings';
import { ThemeSettings } from './theme-settings';

type SettingsCategory = 'model' | 'channels' | 'memory' | 'notifications' | 'theme';

interface SettingsItem {
  id: SettingsCategory;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const settingsCategories: SettingsItem[] = [
  {
    id: 'model',
    name: 'Model',
    description: 'AI model selection and parameters',
    icon: Cpu,
    color: 'text-blue-400',
  },
  {
    id: 'channels',
    name: 'Channels',
    description: 'Messaging integrations',
    icon: MessageSquare,
    color: 'text-green-400',
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Agent memory and context',
    icon: Brain,
    color: 'text-purple-400',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Alerts and sounds',
    icon: Bell,
    color: 'text-yellow-400',
  },
  {
    id: 'theme',
    name: 'Appearance',
    description: 'Theme and display',
    icon: Palette,
    color: 'text-pink-400',
  },
];

export function SettingsApp() {
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory | null>(null);

  const selectedItem = settingsCategories.find((c) => c.id === selectedCategory);

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur h-full">
      <CardHeader className="pb-3 border-b border-zinc-800">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          {selectedCategory ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedCategory(null)}
                className="mr-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {selectedItem && (
                <>
                  <selectedItem.icon className={`h-5 w-5 ${selectedItem.color}`} />
                  {selectedItem.name}
                </>
              )}
            </>
          ) : (
            <>
              <Settings className="h-5 w-5 text-zinc-400" />
              System Preferences
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-60px)]">
        <AnimatePresence mode="wait">
          {selectedCategory === null ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ScrollArea className="h-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6">
                  {settingsCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <motion.button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 transition-all text-center group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="p-3 rounded-xl bg-zinc-700/50 group-hover:bg-zinc-700 transition-colors">
                          <Icon className={`h-8 w-8 ${category.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-200">{category.name}</p>
                          <p className="text-xs text-zinc-500 mt-1">{category.description}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ScrollArea className="h-full">
                <div className="p-6">
                  {selectedCategory === 'model' && <ModelSettings />}
                  {selectedCategory === 'channels' && <ChannelSettings />}
                  {selectedCategory === 'memory' && <MemorySettings />}
                  {selectedCategory === 'notifications' && <NotificationSettings />}
                  {selectedCategory === 'theme' && <ThemeSettings />}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
