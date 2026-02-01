/**
 * Mock Window Store for testing
 * Provides a testable version of the Zustand store
 */

import { create } from 'zustand';
import type { WindowState, WindowManagerState } from '@/components/os/types';

const DEFAULT_WINDOW_WIDTH = 800;
const DEFAULT_WINDOW_HEIGHT = 600;
const DEFAULT_MIN_WIDTH = 400;
const DEFAULT_MIN_HEIGHT = 300;
const WINDOW_OFFSET = 30;

export function createMockWindow(overrides: Partial<WindowState> = {}): WindowState {
  const id = overrides.id || `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
    appId: 'test-app',
    title: 'Test Window',
    x: 100,
    y: 50,
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    minWidth: DEFAULT_MIN_WIDTH,
    minHeight: DEFAULT_MIN_HEIGHT,
    isMinimized: false,
    isMaximized: false,
    isFocused: true,
    zIndex: 1,
    ...overrides,
  };
}

// Create a fresh store for each test
export function createTestWindowStore(initialState?: Partial<WindowManagerState>) {
  return create<WindowManagerState>((set, get) => ({
    windows: initialState?.windows || [],
    activeWindowId: initialState?.activeWindowId || null,
    nextZIndex: initialState?.nextZIndex || 1,

    openWindow: (appId: string, title: string, options?: Partial<WindowState>) => {
      const state = get();
      const id = `${appId}-${Date.now()}`;

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
                y: 28,
                width: 1920,
                height: 1080 - 28 - 70,
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
}

// Reset the actual store state between tests
export function resetWindowStore() {
  const { useWindowStore } = require('@/lib/stores/window-store');
  useWindowStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
  });
}
