import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CostDashboard } from '../index';

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

describe('CostDashboard Component', () => {
  const mockOnClose = jest.fn();
  const mockOnMinimize = jest.fn();
  const mockOnMaximize = jest.fn();

  const defaultProps = {
    onClose: mockOnClose,
    onMinimize: mockOnMinimize,
    onMaximize: mockOnMaximize,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the cost dashboard title', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('Cost Dashboard')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<CostDashboard {...defaultProps} />);
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onMinimize when minimize button is clicked', () => {
    render(<CostDashboard {...defaultProps} />);
    const minimizeButton = screen.getByLabelText('Minimize');
    fireEvent.click(minimizeButton);
    expect(mockOnMinimize).toHaveBeenCalled();
  });

  it('calls onMaximize when maximize button is clicked', () => {
    render(<CostDashboard {...defaultProps} />);
    const maximizeButton = screen.getByLabelText('Maximize');
    fireEvent.click(maximizeButton);
    expect(mockOnMaximize).toHaveBeenCalled();
  });

  it('renders time range selector', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('day')).toBeInTheDocument();
    expect(screen.getByText('week')).toBeInTheDocument();
    expect(screen.getByText('month')).toBeInTheDocument();
  });

  it('defaults to week time range', () => {
    render(<CostDashboard {...defaultProps} />);
    const weekButton = screen.getByText('week');
    expect(weekButton).toHaveClass('text-blue-400');
  });

  it('changes time range when clicked', async () => {
    const user = userEvent.setup();
    render(<CostDashboard {...defaultProps} />);

    const dayButton = screen.getByText('day');
    await user.click(dayButton);

    expect(dayButton).toHaveClass('text-blue-400');
  });

  it('renders total spend card', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('Total Spend')).toBeInTheDocument();
  });

  it('renders total tokens card', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('Total Tokens')).toBeInTheDocument();
  });

  it('renders average daily card', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('Avg. Daily')).toBeInTheDocument();
  });

  it('displays budget alerts', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('Budget Alerts')).toBeInTheDocument();
  });

  it('renders warning and critical alerts', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText(/Daily budget at 87%/)).toBeInTheDocument();
    expect(screen.getByText(/Opus usage spike detected/)).toBeInTheDocument();
  });

  it('renders daily spending chart section', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('Daily Spending')).toBeInTheDocument();
  });

  it('renders day labels in chart', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders cost by model section', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('Cost by Model')).toBeInTheDocument();
  });

  it('displays model names', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText(/opus/i)).toBeInTheDocument();
    expect(screen.getByText(/sonnet/i)).toBeInTheDocument();
    expect(screen.getByText(/haiku/i)).toBeInTheDocument();
  });

  it('displays session counts for models', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('45 sessions')).toBeInTheDocument();
    expect(screen.getByText('128 sessions')).toBeInTheDocument();
    expect(screen.getByText('312 sessions')).toBeInTheDocument();
  });

  it('renders monthly projection section', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('Monthly Projection')).toBeInTheDocument();
    expect(screen.getByText('Estimated Monthly')).toBeInTheDocument();
    expect(screen.getByText('Budget Remaining')).toBeInTheDocument();
  });

  it('renders footer with timestamps', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText('Last updated: Just now')).toBeInTheDocument();
    expect(screen.getByText(/Billing cycle:/)).toBeInTheDocument();
  });

  it('displays percentage change indicator', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getByText(/12.5% from last/)).toBeInTheDocument();
  });

  it('displays input/output breakdown for models', () => {
    render(<CostDashboard {...defaultProps} />);
    expect(screen.getAllByText('Input').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Output').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Total').length).toBeGreaterThan(0);
  });

  it('shows budget progress bar', () => {
    const { container } = render(<CostDashboard {...defaultProps} />);
    // Check for progress indicators
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});
