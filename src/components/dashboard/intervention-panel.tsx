'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquarePlus,
  Send,
  Pause,
  Square,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

/**
 * Intervention action types
 */
export type InterventionAction = 'inject' | 'pause' | 'stop';

/**
 * Feedback state for showing success/error messages
 */
interface FeedbackState {
  type: 'success' | 'error' | 'warning';
  message: string;
}

interface InterventionPanelProps {
  /** Callback when instruction is sent successfully */
  onSendInstruction?: (instruction: string) => void;
  /** Callback when pause is triggered */
  onPause?: () => void;
  /** Callback when stop is triggered */
  onStop?: () => void;
  /** Whether an agent is currently running */
  isAgentRunning?: boolean;
  /** Session key to target (defaults to 'main') */
  sessionKey?: string;
}

/**
 * Send an intervention request to the API
 */
async function sendIntervention(
  action: InterventionAction,
  sessionKey: string,
  instruction?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const response = await fetch('/api/intervene', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        sessionKey,
        ...(action === 'inject' && { instruction }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Unknown error',
        error: data.details,
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export function InterventionPanel({
  onSendInstruction,
  onPause,
  onStop,
  isAgentRunning = true,
  sessionKey = 'main',
}: InterventionPanelProps) {
  const [instruction, setInstruction] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  // Clear feedback after a delay
  const showFeedback = useCallback((newFeedback: FeedbackState) => {
    setFeedback(newFeedback);
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const handleSend = useCallback(async () => {
    if (!instruction.trim()) return;

    setIsSending(true);
    setFeedback(null);

    const result = await sendIntervention('inject', sessionKey, instruction);

    if (result.success) {
      showFeedback({ type: 'success', message: result.message });
      onSendInstruction?.(instruction);
      setInstruction('');
    } else {
      showFeedback({ type: 'error', message: result.message });
    }

    setIsSending(false);
  }, [instruction, sessionKey, onSendInstruction, showFeedback]);

  const handlePause = useCallback(async () => {
    setIsPausing(true);
    setFeedback(null);

    const result = await sendIntervention('pause', sessionKey);

    if (result.success) {
      showFeedback({ type: 'success', message: result.message });
      onPause?.();
    } else {
      showFeedback({ type: 'error', message: result.message });
    }

    setIsPausing(false);
  }, [sessionKey, onPause, showFeedback]);

  const handleStop = useCallback(async () => {
    setIsStopping(true);
    setFeedback(null);

    const result = await sendIntervention('stop', sessionKey);

    if (result.success) {
      showFeedback({ type: 'warning', message: result.message });
      onStop?.();
    } else {
      showFeedback({ type: 'error', message: result.message });
    }

    setIsStopping(false);
  }, [sessionKey, onStop, showFeedback]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const isAnyActionInProgress = isSending || isPausing || isStopping;

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
        {/* Feedback message */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : feedback.type === 'error'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
              {feedback.type === 'error' && <XCircle className="h-4 w-4" />}
              {feedback.type === 'warning' && <AlertCircle className="h-4 w-4" />}
              {feedback.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">
            Send instruction to agent:
          </label>
          <Textarea
            placeholder="Focus on the cost tracking feature first..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAnyActionInProgress}
            className="min-h-[80px] bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 resize-none focus:border-zinc-600 focus:ring-zinc-600 disabled:opacity-50"
          />
          <p className="text-xs text-zinc-500">
            Press{' '}
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">
              Cmd
            </kbd>{' '}
            +{' '}
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">
              Enter
            </kbd>{' '}
            to send
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
              disabled={!instruction.trim() || isAnyActionInProgress}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
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
              onClick={handlePause}
              disabled={!isAgentRunning || isAnyActionInProgress}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              {isPausing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              Pause
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={handleStop}
              disabled={!isAgentRunning || isAnyActionInProgress}
              className="border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300 disabled:opacity-50"
            >
              {isStopping ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              Stop
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
