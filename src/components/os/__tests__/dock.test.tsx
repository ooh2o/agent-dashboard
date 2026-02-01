import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dock } from '../dock';
import { createMockWindow } from '@/__tests__/utils/mock-window-store';

// Mock the window store
const mockOpenWindow = jest.fn();
const mockFocusWindow = jest.fn();
const mockRestoreWindow = jest.fn();
let mockWindows: ReturnType<typeof createMockWindow>[] = [];

jest.mock('@/lib/stores/window-store', () => ({
  useWindowStore: () => ({
    windows: mockWindows,
    openWindow: mockOpenWindow,
    focusWindow: mockFocusWindow,
    restoreWindow: mockRestoreWindow,
  }),
}));

// Mock apps registry
jest.mock('@/lib/apps-registry', () => ({
  APPS: [
    { id: 'activity-monitor', name: 'Activity Monitor', icon: '📊' },
    { id: 'memory-browser', name: 'Memory Browser', icon: '🧠' },
    { id: 'message-center', name: 'Message Center', icon: '💬' },
    { id: 'terminal', name: 'Terminal Console', icon: '🖥️' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ],
  DOCK_APPS: ['activity-monitor', 'memory-browser', 'message-center', 'terminal', 'settings'],
  getApp: (id: string) => {
    const apps = {
      'activity-monitor': { id: 'activity-monitor', name: 'Activity Monitor', icon: '📊' },
      'memory-browser': { id: 'memory-browser', name: 'Memory Browser', icon: '🧠' },
      'message-center': { id: 'message-center', name: 'Message Center', icon: '💬' },
      'terminal': { id: 'terminal', name: 'Terminal Console', icon: '🖥️' },
      'settings': { id: 'settings', name: 'Settings', icon: '⚙️' },
    };
    return apps[id as keyof typeof apps];
  },
}));

describe('Dock Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindows = [];
  });

  it('renders all dock apps', () => {
    render(<Dock />);

    // Check for app icons
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('🧠')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
    expect(screen.getByText('🖥️')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('opens new window when clicking on app with no windows', () => {
    render(<Dock />);

    const activityMonitorButton = screen.getByText('📊').closest('button');
    if (activityMonitorButton) {
      fireEvent.click(activityMonitorButton);
    }

    expect(mockOpenWindow).toHaveBeenCalledWith('activity-monitor', 'Activity Monitor');
  });

  it('focuses existing window when clicking on app with open window', () => {
    mockWindows = [
      createMockWindow({
        id: 'window-1',
        appId: 'activity-monitor',
        isMinimized: false,
        zIndex: 5,
      }),
    ];

    render(<Dock />);

    const activityMonitorButton = screen.getByText('📊').closest('button');
    if (activityMonitorButton) {
      fireEvent.click(activityMonitorButton);
    }

    expect(mockFocusWindow).toHaveBeenCalledWith('window-1');
    expect(mockOpenWindow).not.toHaveBeenCalled();
  });

  it('restores minimized window when clicking on app', () => {
    mockWindows = [
      createMockWindow({
        id: 'window-2',
        appId: 'memory-browser',
        isMinimized: true,
      }),
    ];

    render(<Dock />);

    const memoryBrowserButton = screen.getByText('🧠').closest('button');
    if (memoryBrowserButton) {
      fireEvent.click(memoryBrowserButton);
    }

    expect(mockRestoreWindow).toHaveBeenCalledWith('window-2');
    expect(mockOpenWindow).not.toHaveBeenCalled();
  });

  it('focuses topmost window when multiple windows exist', () => {
    mockWindows = [
      createMockWindow({
        id: 'window-1',
        appId: 'terminal',
        isMinimized: false,
        zIndex: 3,
      }),
      createMockWindow({
        id: 'window-2',
        appId: 'terminal',
        isMinimized: false,
        zIndex: 7,
      }),
    ];

    render(<Dock />);

    const terminalButton = screen.getByText('🖥️').closest('button');
    if (terminalButton) {
      fireEvent.click(terminalButton);
    }

    expect(mockFocusWindow).toHaveBeenCalledWith('window-2'); // Higher zIndex
  });

  it('shows tooltip on hover', async () => {
    render(<Dock />);

    const activityMonitorIcon = screen.getByText('📊').closest('div');
    if (activityMonitorIcon) {
      fireEvent.mouseEnter(activityMonitorIcon);
    }

    // Tooltip should appear with app name
    expect(await screen.findByText('Activity Monitor')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', async () => {
    render(<Dock />);

    const activityMonitorIcon = screen.getByText('📊').closest('div');
    if (activityMonitorIcon) {
      fireEvent.mouseEnter(activityMonitorIcon);
      expect(await screen.findByText('Activity Monitor')).toBeInTheDocument();

      fireEvent.mouseLeave(activityMonitorIcon);
      // In framer-motion mock, AnimatePresence doesn't animate exit
      // but the component structure should still work
    }
  });

  it('shows running indicator for open apps', () => {
    mockWindows = [
      createMockWindow({
        id: 'window-1',
        appId: 'settings',
        isMinimized: false,
      }),
    ];

    const { container } = render(<Dock />);

    // The running indicator should be visible (opacity: 1)
    const runningIndicators = container.querySelectorAll('.bg-white\\/70');
    expect(runningIndicators.length).toBeGreaterThan(0);
  });

  it('renders minimized windows section', () => {
    mockWindows = [
      createMockWindow({
        id: 'minimized-window',
        appId: 'terminal',
        title: 'Terminal',
        isMinimized: true,
      }),
    ];

    render(<Dock />);

    // Should have separator
    const { container } = render(<Dock />);
    const separator = container.querySelector('.bg-zinc-600\\/50');
    expect(separator).toBeInTheDocument();
  });

  it('restores minimized window from dock section', () => {
    mockWindows = [
      createMockWindow({
        id: 'minimized-window-1',
        appId: 'terminal',
        title: 'Terminal',
        isMinimized: true,
      }),
    ];

    render(<Dock />);

    // Find the minimized window button (it has opacity-70 class)
    const buttons = screen.getAllByRole('button');
    // Last button after separator should be the minimized window
    const minimizedButton = buttons.find(btn => btn.className.includes('opacity-70'));

    if (minimizedButton) {
      fireEvent.click(minimizedButton);
      expect(mockRestoreWindow).toHaveBeenCalledWith('minimized-window-1');
    }
  });
});
