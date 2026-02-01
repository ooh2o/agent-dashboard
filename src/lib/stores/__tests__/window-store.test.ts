import { useWindowStore } from '../window-store';

describe('Window Store', () => {
  beforeEach(() => {
    // Reset store state between tests
    useWindowStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
    });
  });

  describe('openWindow', () => {
    it('creates a new window', () => {
      const { openWindow } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');

      const { windows } = useWindowStore.getState();
      expect(windows).toHaveLength(1);
      expect(windows[0].appId).toBe('test-app');
      expect(windows[0].title).toBe('Test Window');
      expect(id).toBeDefined();
    });

    it('sets new window as focused', () => {
      const { openWindow } = useWindowStore.getState();

      openWindow('test-app', 'Test Window');

      const { windows, activeWindowId } = useWindowStore.getState();
      expect(windows[0].isFocused).toBe(true);
      expect(activeWindowId).toBe(windows[0].id);
    });

    it('unfocuses other windows when opening new window', () => {
      const { openWindow } = useWindowStore.getState();

      openWindow('app-1', 'Window 1');
      openWindow('app-2', 'Window 2');

      const { windows } = useWindowStore.getState();
      const window1 = windows.find(w => w.title === 'Window 1');
      const window2 = windows.find(w => w.title === 'Window 2');

      expect(window1?.isFocused).toBe(false);
      expect(window2?.isFocused).toBe(true);
    });

    it('increments zIndex for each new window', () => {
      const { openWindow } = useWindowStore.getState();

      openWindow('app-1', 'Window 1');
      openWindow('app-2', 'Window 2');
      openWindow('app-3', 'Window 3');

      const { windows } = useWindowStore.getState();
      expect(windows[2].zIndex).toBeGreaterThan(windows[1].zIndex);
      expect(windows[1].zIndex).toBeGreaterThan(windows[0].zIndex);
    });

    it('applies cascade offset for multiple windows', () => {
      const { openWindow } = useWindowStore.getState();

      openWindow('app-1', 'Window 1');
      openWindow('app-2', 'Window 2');

      const { windows } = useWindowStore.getState();
      expect(windows[1].x).toBeGreaterThan(windows[0].x);
      expect(windows[1].y).toBeGreaterThan(windows[0].y);
    });

    it('accepts custom options', () => {
      const { openWindow } = useWindowStore.getState();

      openWindow('test-app', 'Test Window', {
        width: 1000,
        height: 800,
        x: 200,
        y: 200,
      });

      const { windows } = useWindowStore.getState();
      expect(windows[0].width).toBe(1000);
      expect(windows[0].height).toBe(800);
      expect(windows[0].x).toBe(200);
      expect(windows[0].y).toBe(200);
    });
  });

  describe('closeWindow', () => {
    it('removes window from store', () => {
      const { openWindow, closeWindow } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      closeWindow(id);

      const { windows } = useWindowStore.getState();
      expect(windows).toHaveLength(0);
    });

    it('focuses next window after closing', () => {
      const { openWindow, closeWindow } = useWindowStore.getState();

      const id1 = openWindow('app-1', 'Window 1');
      const id2 = openWindow('app-2', 'Window 2');
      closeWindow(id2);

      const { activeWindowId, windows } = useWindowStore.getState();
      expect(activeWindowId).toBe(id1);
      expect(windows[0].isFocused).toBe(true);
    });

    it('sets activeWindowId to null when closing last window', () => {
      const { openWindow, closeWindow } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      closeWindow(id);

      const { activeWindowId } = useWindowStore.getState();
      expect(activeWindowId).toBeNull();
    });
  });

  describe('minimizeWindow', () => {
    it('sets window as minimized', () => {
      const { openWindow, minimizeWindow } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      minimizeWindow(id);

      const { windows } = useWindowStore.getState();
      expect(windows[0].isMinimized).toBe(true);
      expect(windows[0].isFocused).toBe(false);
    });

    it('focuses next window after minimizing', () => {
      const { openWindow, minimizeWindow } = useWindowStore.getState();

      const id1 = openWindow('app-1', 'Window 1');
      const id2 = openWindow('app-2', 'Window 2');
      minimizeWindow(id2);

      const { activeWindowId } = useWindowStore.getState();
      expect(activeWindowId).toBe(id1);
    });
  });

  describe('maximizeWindow', () => {
    it('sets window as maximized', () => {
      const { openWindow, maximizeWindow } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      maximizeWindow(id);

      const { windows } = useWindowStore.getState();
      expect(windows[0].isMaximized).toBe(true);
    });

    it('stores previous state', () => {
      const { openWindow, maximizeWindow } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window', {
        x: 150,
        y: 100,
        width: 600,
        height: 400,
      });
      maximizeWindow(id);

      const { windows } = useWindowStore.getState();
      expect(windows[0].previousState).toEqual({
        x: 150,
        y: 100,
        width: 600,
        height: 400,
      });
    });

    it('sets position to fill screen', () => {
      const { openWindow, maximizeWindow } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      maximizeWindow(id);

      const { windows } = useWindowStore.getState();
      expect(windows[0].x).toBe(0);
      expect(windows[0].y).toBe(28); // Below menu bar
    });
  });

  describe('restoreWindow', () => {
    it('restores minimized window', () => {
      const { openWindow, minimizeWindow, restoreWindow } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      minimizeWindow(id);
      restoreWindow(id);

      const { windows } = useWindowStore.getState();
      expect(windows[0].isMinimized).toBe(false);
      expect(windows[0].isFocused).toBe(true);
    });

    it('restores maximized window to previous size', () => {
      const { openWindow, maximizeWindow, restoreWindow } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window', {
        x: 150,
        y: 100,
        width: 600,
        height: 400,
      });
      maximizeWindow(id);
      restoreWindow(id);

      const { windows } = useWindowStore.getState();
      expect(windows[0].isMaximized).toBe(false);
      expect(windows[0].x).toBe(150);
      expect(windows[0].y).toBe(100);
      expect(windows[0].width).toBe(600);
      expect(windows[0].height).toBe(400);
    });
  });

  describe('focusWindow', () => {
    it('sets window as focused', () => {
      const { openWindow, focusWindow } = useWindowStore.getState();

      const id1 = openWindow('app-1', 'Window 1');
      openWindow('app-2', 'Window 2');
      focusWindow(id1);

      const { windows, activeWindowId } = useWindowStore.getState();
      const window1 = windows.find(w => w.id === id1);
      expect(window1?.isFocused).toBe(true);
      expect(activeWindowId).toBe(id1);
    });

    it('unfocuses other windows', () => {
      const { openWindow, focusWindow } = useWindowStore.getState();

      const id1 = openWindow('app-1', 'Window 1');
      const id2 = openWindow('app-2', 'Window 2');
      focusWindow(id1);

      const { windows } = useWindowStore.getState();
      const window2 = windows.find(w => w.id === id2);
      expect(window2?.isFocused).toBe(false);
    });

    it('updates zIndex to bring window to front', () => {
      const { openWindow, focusWindow } = useWindowStore.getState();

      const id1 = openWindow('app-1', 'Window 1');
      openWindow('app-2', 'Window 2');
      const stateBeforeFocus = useWindowStore.getState();
      const zIndexBefore = stateBeforeFocus.windows.find(w => w.id === id1)?.zIndex;

      focusWindow(id1);

      const { windows } = useWindowStore.getState();
      const window1 = windows.find(w => w.id === id1);
      expect(window1?.zIndex).toBeGreaterThan(zIndexBefore!);
    });
  });

  describe('updateWindowPosition', () => {
    it('updates window position', () => {
      const { openWindow, updateWindowPosition } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      updateWindowPosition(id, 300, 400);

      const { windows } = useWindowStore.getState();
      expect(windows[0].x).toBe(300);
      expect(windows[0].y).toBe(400);
    });

    it('unsets maximized state when position changes', () => {
      const { openWindow, maximizeWindow, updateWindowPosition } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      maximizeWindow(id);
      updateWindowPosition(id, 100, 100);

      const { windows } = useWindowStore.getState();
      expect(windows[0].isMaximized).toBe(false);
    });
  });

  describe('updateWindowSize', () => {
    it('updates window size', () => {
      const { openWindow, updateWindowSize } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      updateWindowSize(id, 1000, 800);

      const { windows } = useWindowStore.getState();
      expect(windows[0].width).toBe(1000);
      expect(windows[0].height).toBe(800);
    });

    it('respects minimum width', () => {
      const { openWindow, updateWindowSize } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      updateWindowSize(id, 100, 800); // Below minWidth (400)

      const { windows } = useWindowStore.getState();
      expect(windows[0].width).toBe(400); // minWidth
    });

    it('respects minimum height', () => {
      const { openWindow, updateWindowSize } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      updateWindowSize(id, 800, 100); // Below minHeight (300)

      const { windows } = useWindowStore.getState();
      expect(windows[0].height).toBe(300); // minHeight
    });

    it('unsets maximized state when size changes', () => {
      const { openWindow, maximizeWindow, updateWindowSize } = useWindowStore.getState();

      const id = openWindow('test-app', 'Test Window');
      maximizeWindow(id);
      updateWindowSize(id, 800, 600);

      const { windows } = useWindowStore.getState();
      expect(windows[0].isMaximized).toBe(false);
    });
  });

  describe('getWindowsByApp', () => {
    it('returns windows for specific app', () => {
      const { openWindow, getWindowsByApp } = useWindowStore.getState();

      openWindow('app-1', 'Window 1a');
      openWindow('app-1', 'Window 1b');
      openWindow('app-2', 'Window 2');

      const app1Windows = getWindowsByApp('app-1');
      expect(app1Windows).toHaveLength(2);
    });

    it('returns empty array when no windows for app', () => {
      const { getWindowsByApp } = useWindowStore.getState();

      const windows = getWindowsByApp('nonexistent-app');
      expect(windows).toHaveLength(0);
    });
  });

  describe('isAppRunning', () => {
    it('returns true when app has open window', () => {
      const { openWindow, isAppRunning } = useWindowStore.getState();

      openWindow('test-app', 'Test Window');

      expect(isAppRunning('test-app')).toBe(true);
    });

    it('returns false when app has no windows', () => {
      const { isAppRunning } = useWindowStore.getState();

      expect(isAppRunning('test-app')).toBe(false);
    });
  });
});
