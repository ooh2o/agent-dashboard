import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Window } from '../window';
import { createMockWindow } from '@/__tests__/utils/mock-window-store';

// Mock the window store
const mockCloseWindow = jest.fn();
const mockMinimizeWindow = jest.fn();
const mockMaximizeWindow = jest.fn();
const mockRestoreWindow = jest.fn();
const mockFocusWindow = jest.fn();
const mockUpdateWindowPosition = jest.fn();
const mockUpdateWindowSize = jest.fn();

jest.mock('@/lib/stores/window-store', () => ({
  useWindowStore: () => ({
    closeWindow: mockCloseWindow,
    minimizeWindow: mockMinimizeWindow,
    maximizeWindow: mockMaximizeWindow,
    restoreWindow: mockRestoreWindow,
    focusWindow: mockFocusWindow,
    updateWindowPosition: mockUpdateWindowPosition,
    updateWindowSize: mockUpdateWindowSize,
  }),
}));

describe('Window Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders window with title', () => {
    const mockWindow = createMockWindow({ title: 'Test Window Title' });
    render(<Window window={mockWindow} />);

    expect(screen.getByText('Test Window Title')).toBeInTheDocument();
  });

  it('renders children content', () => {
    const mockWindow = createMockWindow();
    render(
      <Window window={mockWindow}>
        <div data-testid="custom-content">Custom Content</div>
      </Window>
    );

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('renders default content when no children provided', () => {
    const mockWindow = createMockWindow();
    render(<Window window={mockWindow} />);

    expect(screen.getByText('App content goes here')).toBeInTheDocument();
  });

  it('does not render when minimized (after animation)', async () => {
    const mockWindow = createMockWindow({ isMinimized: true, title: 'Minimized Window' });
    render(<Window window={mockWindow} />);

    // Window animates out, then hides after 300ms
    await waitFor(() => {
      expect(screen.queryByText('Minimized Window')).not.toBeInTheDocument();
    }, { timeout: 400 });
  });

  it('calls closeWindow when close button is clicked', () => {
    const mockWindow = createMockWindow({ id: 'test-window-1' });
    render(<Window window={mockWindow} />);

    const closeButton = screen.getAllByRole('button')[0];
    fireEvent.click(closeButton);

    expect(mockCloseWindow).toHaveBeenCalledWith('test-window-1');
  });

  it('calls minimizeWindow when minimize button is clicked', () => {
    const mockWindow = createMockWindow({ id: 'test-window-2' });
    render(<Window window={mockWindow} />);

    const minimizeButton = screen.getAllByRole('button')[1];
    fireEvent.click(minimizeButton);

    expect(mockMinimizeWindow).toHaveBeenCalledWith('test-window-2');
  });

  it('calls maximizeWindow when maximize button is clicked', () => {
    const mockWindow = createMockWindow({ id: 'test-window-3', isMaximized: false });
    render(<Window window={mockWindow} />);

    const maximizeButton = screen.getAllByRole('button')[2];
    fireEvent.click(maximizeButton);

    expect(mockMaximizeWindow).toHaveBeenCalledWith('test-window-3');
  });

  it('calls restoreWindow when maximize button is clicked on maximized window', () => {
    const mockWindow = createMockWindow({ id: 'test-window-4', isMaximized: true });
    render(<Window window={mockWindow} />);

    const maximizeButton = screen.getAllByRole('button')[2];
    fireEvent.click(maximizeButton);

    expect(mockRestoreWindow).toHaveBeenCalledWith('test-window-4');
  });

  it('calls focusWindow when window is clicked', () => {
    const mockWindow = createMockWindow({ id: 'test-window-5', isFocused: false });
    render(<Window window={mockWindow} />);

    const windowElement = screen.getByText('Test Window').closest('div');
    if (windowElement) {
      fireEvent.mouseDown(windowElement);
      expect(mockFocusWindow).toHaveBeenCalledWith('test-window-5');
    }
  });

  it('does not call focusWindow when already focused', () => {
    const mockWindow = createMockWindow({ id: 'test-window-6', isFocused: true });
    render(<Window window={mockWindow} />);

    // Click on title
    fireEvent.mouseDown(screen.getByText('Test Window'));

    expect(mockFocusWindow).not.toHaveBeenCalled();
  });

  it('shows focused styling when isFocused is true', () => {
    const mockWindow = createMockWindow({ isFocused: true });
    render(<Window window={mockWindow} />);

    const windowElement = screen.getByText('Test Window').closest('div')?.parentElement;
    expect(windowElement).toHaveClass('ring-1');
  });

  it('toggles maximize on title double-click', () => {
    const mockWindow = createMockWindow({ id: 'test-window-7', isMaximized: false });
    render(<Window window={mockWindow} />);

    const titleBar = screen.getByText('Test Window').closest('div');
    if (titleBar) {
      fireEvent.doubleClick(titleBar);
      expect(mockMaximizeWindow).toHaveBeenCalledWith('test-window-7');
    }
  });

  it('restores on title double-click when maximized', () => {
    const mockWindow = createMockWindow({ id: 'test-window-8', isMaximized: true });
    render(<Window window={mockWindow} />);

    const titleBar = screen.getByText('Test Window').closest('div');
    if (titleBar) {
      fireEvent.doubleClick(titleBar);
      expect(mockRestoreWindow).toHaveBeenCalledWith('test-window-8');
    }
  });

  it('does not render resize handles when maximized', () => {
    const mockWindow = createMockWindow({ isMaximized: true });
    const { container } = render(<Window window={mockWindow} />);

    // Check for resize handle cursor classes - they shouldn't exist when maximized
    const resizeHandles = container.querySelectorAll('[class*="cursor-"][class*="-resize"]');
    expect(resizeHandles.length).toBe(0);
  });

  it('renders resize handles when not maximized', () => {
    const mockWindow = createMockWindow({ isMaximized: false });
    const { container } = render(<Window window={mockWindow} />);

    // Should have 8 resize handles (4 edges + 4 corners)
    const resizeHandles = container.querySelectorAll('[class*="cursor-"][class*="-resize"]');
    expect(resizeHandles.length).toBe(8);
  });
});
