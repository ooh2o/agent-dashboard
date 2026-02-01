import { create } from 'zustand';
import type { WindowState, WindowManagerState } from '@/components/os/types';

const DEFAULT_WINDOW_WIDTH = 800;
const DEFAULT_WINDOW_HEIGHT = 600;
const DEFAULT_MIN_WIDTH = 400;
const DEFAULT_MIN_HEIGHT = 300;
const WINDOW_OFFSET = 30;

export const useWindowStore = create<WindowManagerState>((set, get) => ({
  windows: [],
  activeWindowId: null,
  nextZIndex: 1,

  openWindow: (appId: string, title: string, options?: Partial<WindowState>) => {
    const state = get();
    const id = `${appId}-${Date.now()}`;

    // Calculate position with cascade offset
    const existingWindows = state.windows.filter(w => !w.isMinimized);
    const offset = (existingWindows.length % 10) * WINDOW_OFFSET;

    const newWindow: WindowState = {
      id,
      appId,
      title,
      x: 100 + offset,
      y: 50 + offset,
      width: DEFAULT_WINDOW_WIDTH,
      height: DEFAULT_WINDOW_HEIGHT,
      minWidth: DEFAULT_MIN_WIDTH,
      minHeight: DEFAULT_MIN_HEIGHT,
      isMinimized: false,
      isMaximized: false,
      isFocused: true,
      zIndex: state.nextZIndex,
      ...options,
    };

    set((state) => ({
      windows: [...state.windows.map(w => ({ ...w, isFocused: false })), newWindow],
      activeWindowId: id,
      nextZIndex: state.nextZIndex + 1,
    }));

    return id;
  },

  closeWindow: (id: string) => {
    set((state) => {
      const remaining = state.windows.filter(w => w.id !== id);
      const newActive = remaining.length > 0
        ? remaining.reduce((a, b) => a.zIndex > b.zIndex ? a : b).id
        : null;

      return {
        windows: remaining.map(w => ({
          ...w,
          isFocused: w.id === newActive,
        })),
        activeWindowId: newActive,
      };
    });
  },

  minimizeWindow: (id: string) => {
    set((state) => {
      const remaining = state.windows.filter(w => w.id !== id && !w.isMinimized);
      const newActive = remaining.length > 0
        ? remaining.reduce((a, b) => a.zIndex > b.zIndex ? a : b).id
        : null;

      return {
        windows: state.windows.map(w =>
          w.id === id
            ? { ...w, isMinimized: true, isFocused: false }
            : { ...w, isFocused: w.id === newActive }
        ),
        activeWindowId: newActive,
      };
    });
  },

  maximizeWindow: (id: string) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id
          ? {
              ...w,
              isMaximized: true,
              previousState: { x: w.x, y: w.y, width: w.width, height: w.height },
              x: 0,
              y: 28, // Below menu bar
              width: typeof window !== 'undefined' ? window.innerWidth : 1920,
              height: typeof window !== 'undefined' ? window.innerHeight - 28 - 70 : 1080, // Minus menu bar and dock
            }
          : w
      ),
    }));
  },

  restoreWindow: (id: string) => {
    set((state) => ({
      windows: state.windows.map(w => {
        if (w.id !== id) return w;

        if (w.isMinimized) {
          return { ...w, isMinimized: false, isFocused: true };
        }

        if (w.isMaximized && w.previousState) {
          return {
            ...w,
            isMaximized: false,
            x: w.previousState.x,
            y: w.previousState.y,
            width: w.previousState.width,
            height: w.previousState.height,
            previousState: undefined,
          };
        }

        return w;
      }),
      activeWindowId: id,
      nextZIndex: state.nextZIndex + 1,
    }));

    // Also focus the window
    get().focusWindow(id);
  },

  focusWindow: (id: string) => {
    set((state) => ({
      windows: state.windows.map(w => ({
        ...w,
        isFocused: w.id === id,
        zIndex: w.id === id ? state.nextZIndex : w.zIndex,
      })),
      activeWindowId: id,
      nextZIndex: state.nextZIndex + 1,
    }));
  },

  updateWindowPosition: (id: string, x: number, y: number) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, x, y, isMaximized: false } : w
      ),
    }));
  },

  updateWindowSize: (id: string, width: number, height: number) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id
          ? {
              ...w,
              width: Math.max(width, w.minWidth),
              height: Math.max(height, w.minHeight),
              isMaximized: false,
            }
          : w
      ),
    }));
  },

  getWindowsByApp: (appId: string) => {
    return get().windows.filter(w => w.appId === appId);
  },

  isAppRunning: (appId: string) => {
    return get().windows.some(w => w.appId === appId);
  },
}));
