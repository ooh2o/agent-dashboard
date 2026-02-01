import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Desktop } from '../desktop';

// Mock the window store
const mockOpenWindow = jest.fn().mockReturnValue('new-window-id');
let mockWindows: Array<{ id: string; appId: string; title: string }> = [];

jest.mock('@/lib/stores/window-store', () => ({
  useWindowStore: () => ({
    windows: mockWindows,
    openWindow: mockOpenWindow,
  }),
}));

// Mock apps registry
jest.mock('@/lib/apps-registry', () => ({
  APPS: [
    { id: 'activity-monitor', name: 'Activity Monitor', icon: '📊' },
    { id: 'memory-browser', name: 'Memory Browser', icon: '🧠' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ],
  getApp: (id: string) => {
    const apps: Record<string, { id: string; name: string; icon: string; component?: React.ComponentType }> = {
      'activity-monitor': { id: 'activity-monitor', name: 'Activity Monitor', icon: '📊' },
      'memory-browser': { id: 'memory-browser', name: 'Memory Browser', icon: '🧠' },
      'settings': { id: 'settings', name: 'Settings', icon: '⚙️' },
    };
    return apps[id];
  },
}));

// Mock Window component
jest.mock('../window', () => ({
  Window: ({ children, window }: { children: React.ReactNode; window: { title: string } }) => (
    <div data-testid={`window-${window.title}`}>
      {children}
    </div>
  ),
}));

describe('Desktop Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindows = [];
  });

  it('renders desktop with gradient background', () => {
    const { container } = render(<Desktop />);

    const desktop = container.firstChild;
    expect(desktop).toHaveClass('bg-gradient-to-br');
  });

  it('renders all app icons', () => {
    render(<Desktop />);

    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('🧠')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('renders app names under icons', () => {
    render(<Desktop />);

    expect(screen.getByText('Activity Monitor')).toBeInTheDocument();
    expect(screen.getByText('Memory Browser')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('opens window on double-click of app icon', () => {
    render(<Desktop />);

    const activityIcon = screen.getByText('📊').closest('button');
    if (activityIcon) {
      fireEvent.doubleClick(activityIcon);
    }

    expect(mockOpenWindow).toHaveBeenCalledWith('activity-monitor', 'Activity Monitor');
  });

  it('renders open windows', () => {
    mockWindows = [
      { id: 'window-1', appId: 'activity-monitor', title: 'Activity Monitor' },
    ];

    render(<Desktop />);

    expect(screen.getByTestId('window-Activity Monitor')).toBeInTheDocument();
  });

  it('renders multiple windows', () => {
    mockWindows = [
      { id: 'window-1', appId: 'activity-monitor', title: 'Activity Monitor' },
      { id: 'window-2', appId: 'settings', title: 'Settings' },
    ];

    render(<Desktop />);

    expect(screen.getByTestId('window-Activity Monitor')).toBeInTheDocument();
    expect(screen.getByTestId('window-Settings')).toBeInTheDocument();
  });

  it('renders children components', () => {
    render(
      <Desktop>
        <div data-testid="spotlight-child">Spotlight</div>
      </Desktop>
    );

    expect(screen.getByTestId('spotlight-child')).toBeInTheDocument();
  });

  it('shows app coming soon message for apps without component', () => {
    mockWindows = [
      { id: 'window-1', appId: 'activity-monitor', title: 'Activity Monitor' },
    ];

    // Re-render with actual Window mock that shows content
    jest.doMock('../window', () => ({
      Window: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }));

    render(<Desktop />);

    // The default content should show "App content coming soon..."
    expect(screen.getByText('App content coming soon...')).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = render(<Desktop />);

    const desktop = container.firstChild as HTMLElement;

    // Check for proper spacing
    expect(desktop).toHaveClass('pt-7'); // Space for menu bar
    expect(desktop).toHaveClass('pb-20'); // Space for dock
  });

  it('positions icons on the right side', () => {
    const { container } = render(<Desktop />);

    const iconGrid = container.querySelector('.right-4');
    expect(iconGrid).toBeInTheDocument();
  });

  it('does not call openWindow on single click', () => {
    render(<Desktop />);

    const activityIcon = screen.getByText('📊').closest('button');
    if (activityIcon) {
      fireEvent.click(activityIcon);
    }

    expect(mockOpenWindow).not.toHaveBeenCalled();
  });
});
