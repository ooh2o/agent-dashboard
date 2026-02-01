'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Thread } from './types';
import { Send, Paperclip, Smile, Bot, Sparkles } from 'lucide-react';

interface ReplyBoxProps {
  thread: Thread | null;
  onSendMessage: (content: string) => void;
  onSendAsChief?: (content: string) => void;
  disabled?: boolean;
}

export function ReplyBox({ thread, onSendMessage, onSendAsChief, disabled = false }: ReplyBoxProps) {
  const [message, setMessage] = useState('');
  const [sendAsChief, setSendAsChief] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || disabled || !thread) return;

    if (sendAsChief && onSendAsChief) {
      onSendAsChief(message.trim());
    } else {
      onSendMessage(message.trim());
    }
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!thread) {
    return (
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center justify-center text-sm text-zinc-500 py-2">
          Select a conversation to reply
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur">
      {/* Send as Chief toggle */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setSendAsChief(!sendAsChief)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all',
            sendAsChief
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
          )}
        >
          <Bot className="h-3 w-3" />
          {sendAsChief ? 'Sending as Chief' : 'Send as Chief'}
        </button>
        {sendAsChief && (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Sparkles className="h-3 w-3" />
            AI-powered response
          </span>
        )}
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={sendAsChief ? "Type a message for Chief to send..." : "Type a message..."}
            disabled={disabled}
            rows={1}
            className={cn(
              'min-h-[44px] max-h-[150px] resize-none pr-20',
              'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500',
              'focus:border-zinc-600 focus:ring-zinc-600/20'
            )}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-zinc-500 hover:text-zinc-300"
              disabled={disabled}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-zinc-500 hover:text-zinc-300"
              disabled={disabled}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className={cn(
            'h-11 w-11 shrink-0 transition-all',
            message.trim()
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-500'
          )}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-[10px] text-zinc-600 mt-2 text-center">
        Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-500">Enter</kbd> to send,
        <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 ml-1">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}
