'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface TerminalInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
  prompt?: string;
  history: string[];
}

export function TerminalInput({ onSubmit, disabled, prompt = '$', history }: TerminalInputProps) {
  const [value, setValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit(value.trim());
      setValue('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        setValue(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setValue(history[history.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setValue('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Basic tab completion could be added here
    } else if (e.key === 'c' && e.ctrlKey) {
      setValue('');
      setHistoryIndex(-1);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      // Could trigger clear here
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-3 bg-black/40 border-t border-zinc-800',
        disabled && 'opacity-50'
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-green-400 font-mono text-sm flex items-center gap-1 shrink-0">
        <ChevronRight className="h-4 w-4" />
        {prompt}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'flex-1 bg-transparent border-0 outline-none text-zinc-100 font-mono text-sm',
          'placeholder:text-zinc-600 focus:ring-0',
          'caret-green-400'
        )}
        placeholder="Type a command or message for Chief..."
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}
