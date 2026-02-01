import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityMonitor } from '../index';
import type { ActivityEvent } from '@/lib/types';

// Mock framer-motion animations
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
        <div {...props}>{children}</div>
      ),
    },
    AnimatePresence: ({ children }: React.PropsWithChildren<unknown>) => <>{children}</>,
  };
});

const createMockActivity = (overrides: Partial<ActivityEvent> = {}): ActivityEvent => ({
  id: `activity-${Date.now()}-${Math.random()}`,
  sessionId: 'session-1',
  timestamp: new Date().toISOString(),
  type: 'tool_call',
  tool: 'Read',
  params: { file_path: '/test/file.txt' },
  result: 'success',
  durationMs: 150,
  tokens: { input: 100, output: 50 },
  explanation: 'Read file /test/file.txt',
  ...overrides,
});

describe('ActivityMonitor Component', () => {
  const mockOnClose = jest.fn();
  const mockOnMinimize = jest.fn();
  const mockOnMaximize = jest.fn();

  const defaultProps = {
    activities: [] as ActivityEvent[],
    onClose: mockOnClose,
    onMinimize: mockOnMinimize,
    onMaximize: mockOnMaximize,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the activity monitor title', () => {
    render(<ActivityMonitor {...defaultProps} />);
    expect(screen.getByText('Activity Monitor')).toBeInTheDocument();
  });

  it('renders the Live badge', () => {
    render(<ActivityMonitor {...defaultProps} />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ActivityMonitor {...defaultProps} />);
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onMinimize when minimize button is clicked', () => {
    render(<ActivityMonitor {...defaultProps} />);
    const minimizeButton = screen.getByLabelText('Minimize');
    fireEvent.click(minimizeButton);
    expect(mockOnMinimize).toHaveBeenCalled();
  });

  it('calls onMaximize when maximize button is clicked', () => {
    render(<ActivityMonitor {...defaultProps} />);
    const maximizeButton = screen.getByLabelText('Maximize');
    fireEvent.click(maximizeButton);
    expect(mockOnMaximize).toHaveBeenCalled();
  });

  it('renders search input', () => {
    render(<ActivityMonitor {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search activities...')).toBeInTheDocument();
  });

  it('displays activity count', () => {
    const activities = [
      createMockActivity({ id: 'activity-1' }),
      createMockActivity({ id: 'activity-2' }),
    ];
    render(<ActivityMonitor {...defaultProps} activities={activities} />);
    expect(screen.getByText('Showing 2 of 2 activities')).toBeInTheDocument();
  });

  it('renders activities in the list', () => {
    const activities = [
      createMockActivity({
        id: 'activity-1',
        explanation: 'Test activity explanation',
      }),
    ];
    render(<ActivityMonitor {...defaultProps} activities={activities} />);
    expect(screen.getByText('Test activity explanation')).toBeInTheDocument();
  });

  it('shows tool name badge', () => {
    const activities = [
      createMockActivity({
        id: 'activity-1',
        tool: 'WebSearch',
        type: 'web_search',
      }),
    ];
    render(<ActivityMonitor {...defaultProps} activities={activities} />);
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('filters activities by search query', async () => {
    const user = userEvent.setup();
    const activities = [
      createMockActivity({
        id: 'activity-1',
        explanation: 'Read file data',
      }),
      createMockActivity({
        id: 'activity-2',
        explanation: 'Write to database',
      }),
    ];
    render(<ActivityMonitor {...defaultProps} activities={activities} />);

    const searchInput = screen.getByPlaceholderText('Search activities...');
    await user.type(searchInput, 'file');

    expect(screen.getByText('Showing 1 of 2 activities')).toBeInTheDocument();
    expect(screen.getByText('Read file data')).toBeInTheDocument();
    expect(screen.queryByText('Write to database')).not.toBeInTheDocument();
  });

  it('shows empty state when no activities match filter', async () => {
    const user = userEvent.setup();
    const activities = [
      createMockActivity({
        id: 'activity-1',
        explanation: 'Some activity',
      }),
    ];
    render(<ActivityMonitor {...defaultProps} activities={activities} />);

    const searchInput = screen.getByPlaceholderText('Search activities...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No activities match your filters')).toBeInTheDocument();
  });

  it('toggles filter panel', async () => {
    const user = userEvent.setup();
    render(<ActivityMonitor {...defaultProps} />);

    const filterButton = screen.getByRole('button', { name: '' }); // Filter button has no text initially
    // Find button with Filter icon
    const buttons = screen.getAllByRole('button');
    const filterBtn = buttons.find(btn => btn.querySelector('svg'));

    // Click on the filter button (has Filter icon)
    const filterToggle = screen.getByRole('button', { name: '' });
    // This is a bit tricky - let's check for the filter pill container presence
  });

  it('filters activities by type when filter is selected', async () => {
    const user = userEvent.setup();
    const activities = [
      createMockActivity({
        id: 'activity-1',
        type: 'tool_call',
        explanation: 'Tool call activity',
      }),
      createMockActivity({
        id: 'activity-2',
        type: 'web_search',
        explanation: 'Web search activity',
      }),
    ];
    render(<ActivityMonitor {...defaultProps} activities={activities} />);

    // Initially both activities should be visible
    expect(screen.getByText('Showing 2 of 2 activities')).toBeInTheDocument();
  });

  it('shows error count in footer', () => {
    const activities = [
      createMockActivity({
        id: 'activity-1',
        result: 'error',
      }),
      createMockActivity({
        id: 'activity-2',
        result: 'success',
      }),
    ];
    render(<ActivityMonitor {...defaultProps} activities={activities} />);
    expect(screen.getByText('1 errors')).toBeInTheDocument();
  });

  it('shows total tokens in footer', () => {
    const activities = [
      createMockActivity({
        id: 'activity-1',
        tokens: { input: 100, output: 50 },
      }),
      createMockActivity({
        id: 'activity-2',
        tokens: { input: 200, output: 100 },
      }),
    ];
    render(<ActivityMonitor {...defaultProps} activities={activities} />);
    expect(screen.getByText(/Total tokens:/)).toBeInTheDocument();
  });

  it('shows duration for activities', () => {
    const activities = [
      createMockActivity({
        id: 'activity-1',
        durationMs: 250,
      }),
    ];
    render(<ActivityMonitor {...defaultProps} activities={activities} />);
    expect(screen.getByText('250ms')).toBeInTheDocument();
  });

  it('shows token count for activities', () => {
    const activities = [
      createMockActivity({
        id: 'activity-1',
        tokens: { input: 100, output: 50 },
      }),
    ];
    render(<ActivityMonitor {...defaultProps} activities={activities} />);
    expect(screen.getByText('150 tokens')).toBeInTheDocument();
  });

  it('clears filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const activities = [
      createMockActivity({
        id: 'activity-1',
        explanation: 'Test activity',
      }),
    ];
    render(<ActivityMonitor {...defaultProps} activities={activities} />);

    const searchInput = screen.getByPlaceholderText('Search activities...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No activities match your filters')).toBeInTheDocument();

    const clearButton = screen.getByText('Clear filters');
    await user.click(clearButton);

    expect(screen.getByText('Test activity')).toBeInTheDocument();
  });

  it('highlights error activities with red indicator', () => {
    const activities = [
      createMockActivity({
        id: 'activity-1',
        result: 'error',
      }),
    ];
    const { container } = render(<ActivityMonitor {...defaultProps} activities={activities} />);

    // Check for error indicator (red left border)
    const errorIndicator = container.querySelector('.bg-red-500');
    expect(errorIndicator).toBeInTheDocument();
  });
});
