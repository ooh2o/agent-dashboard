'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion, useDragControls, PanInfo, AnimatePresence } from 'framer-motion';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWindowStore } from '@/lib/stores/window-store';
import type { WindowState } from './types';

interface WindowProps {
  window: WindowState;
  children?: React.ReactNode;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export function Window({ window: win, children }: WindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useWindowStore();

  const dragControls = useDragControls();
  const windowRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, winX: 0, winY: 0 });

  // Track minimize state changes for animation
  useEffect(() => {
    if (win.isMinimized) {
      setIsAnimatingOut(true);
      // Hide after animation completes
      const timer = setTimeout(() => setIsAnimatingOut(false), 300);
      return () => clearTimeout(timer);
    }
  }, [win.isMinimized]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeWindow(win.id);
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    minimizeWindow(win.id);
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (win.isMaximized) {
      restoreWindow(win.id);
    } else {
      maximizeWindow(win.id);
    }
  };

  const handleDoubleClickTitle = () => {
    if (win.isMaximized) {
      restoreWindow(win.id);
    } else {
      maximizeWindow(win.id);
    }
  };

  const handleFocus = () => {
    if (!win.isFocused) {
      focusWindow(win.id);
    }
  };

  const handleDragEnd = (_: never, info: PanInfo) => {
    const newX = win.x + info.offset.x;
    const newY = Math.max(28, win.y + info.offset.y); // Keep below menu bar
    updateWindowPosition(win.id, newX, newY);
  };

  const startResize = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: win.width,
      height: win.height,
      winX: win.x,
      winY: win.y,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;
      let newX = resizeStartRef.current.winX;
      let newY = resizeStartRef.current.winY;

      if (direction.includes('e')) {
        newWidth = Math.max(win.minWidth, resizeStartRef.current.width + deltaX);
      }
      if (direction.includes('w')) {
        const possibleWidth = resizeStartRef.current.width - deltaX;
        if (possibleWidth >= win.minWidth) {
          newWidth = possibleWidth;
          newX = resizeStartRef.current.winX + deltaX;
        }
      }
      if (direction.includes('s')) {
        newHeight = Math.max(win.minHeight, resizeStartRef.current.height + deltaY);
      }
      if (direction.includes('n')) {
        const possibleHeight = resizeStartRef.current.height - deltaY;
        if (possibleHeight >= win.minHeight) {
          newHeight = possibleHeight;
          newY = Math.max(28, resizeStartRef.current.winY + deltaY);
        }
      }

      updateWindowSize(win.id, newWidth, newHeight);
      if (newX !== win.x || newY !== win.y) {
        updateWindowPosition(win.id, newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [win, updateWindowPosition, updateWindowSize]);

  // Calculate dock position for minimize animation (center-bottom of screen)
  const getDockPosition = () => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    return {
      x: window.innerWidth / 2 - win.width / 2,
      y: window.innerHeight - 80,
    };
  };

  // Hide window after minimize animation completes
  if (win.isMinimized && !isAnimatingOut) {
    return null;
  }

  return (
    <motion.div
      ref={windowRef}
      className={cn(
        'absolute flex flex-col rounded-xl overflow-hidden shadow-2xl',
        'bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50',
        win.isFocused ? 'ring-1 ring-zinc-600/50' : 'opacity-95',
        isResizing && 'select-none'
      )}
      style={{
        zIndex: win.zIndex,
        width: win.width,
        height: win.height,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={win.isMinimized ? {
        opacity: 0,
        scale: 0.3,
        x: getDockPosition().x,
        y: getDockPosition().y,
      } : {
        opacity: 1,
        scale: 1,
        x: win.x,
        y: win.y,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: win.isMinimized ? 300 : 400,
        damping: win.isMinimized ? 25 : 30
      }}
      onMouseDown={handleFocus}
      drag={!win.isMaximized}
      dragControls={dragControls}
      dragMomentum={false}
      dragListener={false}
      onDragEnd={handleDragEnd}
    >
      {/* Title Bar */}
      <div
        className={cn(
          'flex items-center h-10 px-3 gap-3 cursor-default select-none shrink-0',
          'bg-zinc-800/80 border-b border-zinc-700/50'
        )}
        onPointerDown={(e) => {
          if (!win.isMaximized) {
            dragControls.start(e);
          }
        }}
        onDoubleClick={handleDoubleClickTitle}
      >
        {/* Traffic Lights */}
        <div className="flex items-center gap-2 group">
          <button
            onClick={handleClose}
            className={cn(
              'w-3 h-3 rounded-full transition-all',
              'bg-red-500 hover:bg-red-400',
              'flex items-center justify-center'
            )}
          >
            <X className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={handleMinimize}
            className={cn(
              'w-3 h-3 rounded-full transition-all',
              'bg-yellow-500 hover:bg-yellow-400',
              'flex items-center justify-center'
            )}
          >
            <Minus className="w-2 h-2 text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={handleMaximize}
            className={cn(
              'w-3 h-3 rounded-full transition-all',
              'bg-green-500 hover:bg-green-400',
              'flex items-center justify-center'
            )}
          >
            {win.isMaximized ? (
              <Maximize2 className="w-2 h-2 text-green-900 opacity-0 group-hover:opacity-100 transition-opacity" />
            ) : (
              <Square className="w-1.5 h-1.5 text-green-900 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        </div>

        {/* Title */}
        <span className="flex-1 text-center text-sm font-medium text-zinc-300 truncate">
          {win.title}
        </span>

        {/* Spacer for symmetry */}
        <div className="w-14" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-zinc-900">
        {children || (
          <div className="flex items-center justify-center h-full text-zinc-500">
            App content goes here
          </div>
        )}
      </div>

      {/* Resize Handles */}
      {!win.isMaximized && (
        <>
          {/* Edges */}
          <div
            className="absolute top-0 left-4 right-4 h-1 cursor-n-resize"
            onMouseDown={(e) => startResize(e, 'n')}
          />
          <div
            className="absolute bottom-0 left-4 right-4 h-1 cursor-s-resize"
            onMouseDown={(e) => startResize(e, 's')}
          />
          <div
            className="absolute left-0 top-4 bottom-4 w-1 cursor-w-resize"
            onMouseDown={(e) => startResize(e, 'w')}
          />
          <div
            className="absolute right-0 top-4 bottom-4 w-1 cursor-e-resize"
            onMouseDown={(e) => startResize(e, 'e')}
          />

          {/* Corners */}
          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
            onMouseDown={(e) => startResize(e, 'nw')}
          />
          <div
            className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
            onMouseDown={(e) => startResize(e, 'ne')}
          />
          <div
            className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
            onMouseDown={(e) => startResize(e, 'sw')}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={(e) => startResize(e, 'se')}
          />
        </>
      )}
    </motion.div>
  );
}
