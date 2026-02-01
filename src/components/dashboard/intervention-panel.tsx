'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquarePlus, Send, Pause, Square, Loader2 } from 'lucide-react';

interface InterventionPanelProps {
  onSendInstruction?: (instruction: string) => void;
  onPause?: () => void;
  onStop?: () => void;
  isAgentRunning?: boolean;
}

export function InterventionPanel({
  onSendInstruction,
  onPause,
  onStop,
  isAgentRunning = true,
}: InterventionPanelProps) {
  const [instruction, setInstruction] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!instruction.trim()) return;

    setIsSending(true);
    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 500));
    onSendInstruction?.(instruction);
    setInstruction('');
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <MessageSquarePlus className="h-5 w-5 text-zinc-400" />
          Intervention
          {isAgentRunning && (
            <Badge
              variant="secondary"
              className="ml-auto bg-emerald-500/10 text-emerald-400 text-xs animate-pulse"
            >
              Agent Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">
            Send instruction to agent:
          </label>
          <Textarea
            placeholder="Focus on the cost tracking feature first..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 resize-none focus:border-zinc-600 focus:ring-zinc-600"
          />
          <p className="text-xs text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Cmd</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Enter</kbd> to send
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button
              onClick={handleSend}
              disabled={!instruction.trim() || isSending}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Now
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={onPause}
              disabled={!isAgentRunning}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={onStop}
              disabled={!isAgentRunning}
              className="border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
