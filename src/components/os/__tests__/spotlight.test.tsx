import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Spotlight } from '../spotlight';

// Mock the window store
const mockOpenWindow = jest.fn().mockReturnValue('new-window-id');
const mockFocusWindow = jest.fn();
let mockWindows: Array<{ id: string; appId: string }> = [];

jest.mock('@/lib/stores/window-store', () => ({
  useWindowStore: () => ({
    openWindow: mockOpenWindow,
    focusWindow: mockFocusWindow,
    windows: mockWindows,
  }),
}));

// Mock apps registry
jest.mock('@/lib/apps-registry', () => ({
  APPS: [
    { id: 'activity-monitor', name: 'Activity Monitor', icon: '📊', shortcut: '⌘1' },
    { id: 'memory-browser', name: 'Memory Browser', icon: '🧠', shortcut: '⌘2' },
    { id: 'terminal', name: 'Terminal Console', icon: '🖥️', shortcut: '⌘T' },
    { id: 'settings', name: 'Settings', icon: '⚙️', shortcut: '⌘,' },
  ],
  getApp: (id: string) => {
    const apps: Record<string, { id: string; name: string; icon: string; shortcut?: string }> = {
      'activity-monitor': { id: 'activity-monitor', name: 'Activity Monitor', icon: '📊', shortcut: '⌘1' },
      'memory-browser': { id: 'memory-browser', name: 'Memory Browser', icon: '🧠', shortcut: '⌘2' },
      'terminal': { id: 'terminal', name: 'Terminal Console', icon: '🖥️', shortcut: '⌘T' },
      'settings': { id: 'settings', name: 'Settings', icon: '⚙️', shortcut: '⌘,' },
    };
    return apps[id];
  },
}));

describe('Spotlight Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindows = [];
  });

  it('does not render when isOpen is false', () => {
    render(<Spotlight isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByPlaceholderText('Search apps, actions, files...')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByPlaceholderText('Search apps, actions, files...')).toBeInTheDocument();
  });

  it('shows all apps when no search query', async () => {
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Activity Monitor')).toBeInTheDocument();
      expect(screen.getByText('Memory Browser')).toBeInTheDocument();
      expect(screen.getByText('Terminal Console')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it('filters results based on search query', async () => {
    const user = userEvent.setup();
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search apps, actions, files...');
    await user.type(input, 'term');

    await waitFor(() => {
      expect(screen.getByText('Terminal Console')).toBeInTheDocument();
    });

    // Other apps should not be visible or at least ranked lower
  });

  it('closes on backdrop click', () => {
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    // Click on backdrop (first div with bg-black)
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search apps, actions, files...');
    await user.type(input, '{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('navigates with arrow keys', async () => {
    const user = userEvent.setup();
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search apps, actions, files...');

    // Press down arrow
    await user.type(input, '{ArrowDown}');

    // The second item should now be selected (visible through bg-blue-500)
    const buttons = screen.getAllByRole('button');
    expect(buttons.some(btn => btn.className.includes('bg-blue-500'))).toBe(true);
  });

  it('selects item with Enter key', async () => {
    const user = userEvent.setup();
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search apps, actions, files...');

    // Search for terminal to narrow results
    await user.type(input, 'terminal{Enter}');

    // Should either open new window or focus existing
    expect(mockOpenWindow).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('opens new window for app without existing window', async () => {
    const user = userEvent.setup();
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    // Click on Activity Monitor
    const activityMonitor = await screen.findByText('Activity Monitor');
    await user.click(activityMonitor.closest('button')!);

    expect(mockOpenWindow).toHaveBeenCalledWith('activity-monitor', 'Activity Monitor');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('focuses existing window for app that is already open', async () => {
    mockWindows = [{ id: 'existing-window', appId: 'settings' }];

    const user = userEvent.setup();
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    // Click on Settings
    const settings = await screen.findByText('Settings');
    await user.click(settings.closest('button')!);

    expect(mockFocusWindow).toHaveBeenCalledWith('existing-window');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows app type badge', async () => {
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getAllByText('App').length).toBeGreaterThan(0);
    });
  });

  it('shows action type badge for quick actions', async () => {
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getAllByText('Action').length).toBeGreaterThan(0);
    });
  });

  it('shows keyboard shortcuts in results', async () => {
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('⌘1')).toBeInTheDocument();
      expect(screen.getByText('⌘T')).toBeInTheDocument();
    });
  });

  it('shows ESC key hint', () => {
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('ESC')).toBeInTheDocument();
  });

  it('shows navigation hints in footer', () => {
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Navigate')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('K or Space to toggle')).toBeInTheDocument();
  });

  it('shows empty state when no results match', async () => {
    const user = userEvent.setup();
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search apps, actions, files...');
    await user.type(input, 'xyznonexistent');

    await waitFor(() => {
      expect(screen.getByText(/No results found for/)).toBeInTheDocument();
    });
  });

  it('clears query when reopened', async () => {
    const { rerender } = render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search apps, actions, files...');
    fireEvent.change(input, { target: { value: 'test query' } });

    // Close and reopen
    rerender(<Spotlight isOpen={false} onClose={mockOnClose} />);
    rerender(<Spotlight isOpen={true} onClose={mockOnClose} />);

    const newInput = screen.getByPlaceholderText('Search apps, actions, files...');
    expect(newInput).toHaveValue('');
  });

  it('highlights selected item on mouse hover', async () => {
    const user = userEvent.setup();
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    const memoryBrowser = await screen.findByText('Memory Browser');
    await user.hover(memoryBrowser.closest('button')!);

    // The hovered item should have selection styling
    expect(memoryBrowser.closest('button')).toHaveClass('bg-blue-500/20');
  });

  it('includes quick actions in results', async () => {
    render(<Spotlight isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('New Terminal')).toBeInTheDocument();
      expect(screen.getByText('Spawn Agent')).toBeInTheDocument();
      expect(screen.getByText('Open Settings')).toBeInTheDocument();
    });
  });
});
