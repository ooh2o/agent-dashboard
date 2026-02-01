'use client';

import { ReactNode, useState, useRef, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { X, Maximize2, Minimize2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetSize, WIDGET_SIZES } from './types';

interface WidgetContainerProps {
  id: string;
  title: string;
  children: ReactNode;
  size: WidgetSize;
  position: { x: number; y: number };
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onSizeChange: (id: string, size: WidgetSize) => void;
  onRemove: (id: string) => void;
  className?: string;
}

export function WidgetContainer({
  id,
  title,
  children,
  size,
  position,
  onPositionChange,
  onSizeChange,
  onRemove,
  className,
}: WidgetContainerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const constraintsRef = useRef(null);

  const dimensions = WIDGET_SIZES[size];

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const newX = position.x + info.offset.x;
      const newY = position.y + info.offset.y;
      onPositionChange(id, { x: newX, y: newY });
      setIsDragging(false);
    },
    [id, position, onPositionChange]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const cycleSizes: WidgetSize[] = ['small', 'medium', 'large'];
  const handleCycleSize = useCallback(() => {
    const currentIndex = cycleSizes.indexOf(size);
    const nextIndex = (currentIndex + 1) % cycleSizes.length;
    onSizeChange(id, cycleSizes[nextIndex]);
  }, [id, size, onSizeChange]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: position.x,
        y: position.y,
        width: dimensions.width,
        height: dimensions.height,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        opacity: { duration: 0.2 },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'absolute rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing',
        'bg-zinc-900/40 backdrop-blur-xl',
        'border border-white/10',
        'shadow-lg shadow-black/20',
        isDragging && 'z-50 shadow-2xl shadow-black/40',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      }}
    >
      {/* Glassmorphic inner glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <GripVertical className="h-3 w-3 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            {title}
          </span>
        </div>

        {/* Controls - show on hover */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="flex items-center gap-1"
        >
          <button
            onClick={handleCycleSize}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Resize"
          >
            {size === 'large' ? (
              <Minimize2 className="h-3 w-3 text-zinc-400" />
            ) : (
              <Maximize2 className="h-3 w-3 text-zinc-400" />
            )}
          </button>
          <button
            onClick={() => onRemove(id)}
            className="p-1 rounded hover:bg-red-500/20 transition-colors group"
            title="Remove"
          >
            <X className="h-3 w-3 text-zinc-400 group-hover:text-red-400" />
          </button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-3 h-[calc(100%-36px)] overflow-hidden">{children}</div>
    </motion.div>
  );
}
