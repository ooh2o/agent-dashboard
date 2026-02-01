import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MenuBar } from '../menu-bar';

// Mock the window store
let mockActiveWindowId: string | null = null;
let mockWindows: Array<{ id: string; appId: string }> = [];

jest.mock('@/lib/stores/window-store', () => ({
  useWindowStore: () => ({
    activeWindowId: mockActiveWindowId,
    windows: mockWindows,
  }),
}));

// Mock apps registry
jest.mock('@/lib/apps-registry', () => ({
  getApp: (id: string) => {
    const apps: Record<string, { id: string; name: string; icon: string }> = {
      'activity-monitor': { id: 'activity-monitor', name: 'Activity Monitor', icon: '📊' },
      'settings': { id: 'settings', name: 'Settings', icon: '⚙️' },
    };
    return apps[id];
  },
}));

describe('MenuBar Component', () => {
  const mockOnSpotlightOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveWindowId = null;
    mockWindows = [];
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the OpenClaw logo and name', () => {
    render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);

    expect(screen.getByText('🦞')).toBeInTheDocument();
    expect(screen.getByText('OpenClaw')).toBeInTheDocument();
  });

  it('shows OpenClaw OS when no active window', () => {
    render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);

    expect(screen.getByText('OpenClaw OS')).toBeInTheDocument();
  });

  it('shows active app name when window is focused', () => {
    mockWindows = [{ id: 'window-1', appId: 'activity-monitor' }];
    mockActiveWindowId = 'window-1';

    render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);

    expect(screen.getByText('Activity Monitor')).toBeInTheDocument();
  });

  it('renders menu items', () => {
    render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);

    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Window')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('renders status icons', () => {
    render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);

    // Battery percentage
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calls onSpotlightOpen when search button is clicked', () => {
    render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);

    const searchButton = screen.getByText('⌘K').closest('button');
    if (searchButton) {
      fireEvent.click(searchButton);
    }

    expect(mockOnSpotlightOpen).toHaveBeenCalled();
  });

  it('shows keyboard shortcut for spotlight', () => {
    render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);

    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('displays current time', () => {
    const mockDate = new Date('2024-01-15T14:30:00');
    jest.setSystemTime(mockDate);

    render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);

    // Run timers to trigger time update
    act(() => {
      jest.runOnlyPendingTimers();
    });

    // Time format: "2:30 PM"
    expect(screen.getByText(/2:30/)).toBeInTheDocument();
  });

  it('displays current date', () => {
    const mockDate = new Date('2024-01-15T14:30:00');
    jest.setSystemTime(mockDate);

    render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);

    // Run timers to trigger date update
    act(() => {
      jest.runOnlyPendingTimers();
    });

    // Date format: "Mon, Jan 15"
    expect(screen.getByText(/Mon/)).toBeInTheDocument();
    expect(screen.getByText(/Jan/)).toBeInTheDocument();
  });

  it('updates time every second', () => {
    const mockDate = new Date('2024-01-15T14:30:00');
    jest.setSystemTime(mockDate);

    render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);

    // Initial time
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText(/2:30/)).toBeInTheDocument();

    // Advance time by 1 minute
    const newDate = new Date('2024-01-15T14:31:00');
    jest.setSystemTime(newDate);

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(screen.getByText(/2:31/)).toBeInTheDocument();
  });

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('has correct styling for menu bar', () => {
    const { container } = render(<MenuBar onSpotlightOpen={mockOnSpotlightOpen} />);

    const menuBar = container.firstChild;
    expect(menuBar).toHaveClass('fixed', 'top-0', 'left-0', 'right-0');
  });
});
