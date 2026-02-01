/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { AnalyticsDashboard } from '../index';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock URL methods
const mockCreateObjectURL = jest.fn(() => 'mock-url');
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock recharts to avoid canvas issues
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Line: () => null,
    Bar: () => null,
    Pie: () => null,
    Cell: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock data
const mockSummary = {
  today: {
    date: '2026-02-01',
    tokens: { input: 100000, output: 50000, total: 150000 },
    cost: 1.5,
    toolCalls: 50,
    sessions: 5,
    errors: 2,
  },
  yesterday: {
    date: '2026-01-31',
    tokens: { input: 80000, output: 40000, total: 120000 },
    cost: 1.2,
    toolCalls: 40,
    sessions: 4,
    errors: 1,
  },
  weekTotal: { tokens: 500000, cost: 10, sessions: 25, toolCalls: 200 },
  monthTotal: { tokens: 2000000, cost: 40, sessions: 100, toolCalls: 800 },
  topTools: [
    { tool: 'file_read', count: 100, avgDuration: 50, totalTokens: 10000, successRate: 98 },
    { tool: 'web_fetch', count: 50, avgDuration: 500, totalTokens: 50000, successRate: 95 },
  ],
  percentChange: { tokens: 25, cost: 25, sessions: 25 },
};

const mockHistory = {
  period: { start: '2026-01-03', end: '2026-02-01', days: 30 },
  metrics: Array(30).fill(null).map((_, i) => {
    const date = new Date(2026, 0, 3 + i); // January 3rd + i days
    return {
      date: date.toISOString().split('T')[0],
      tokens: { input: 10000, output: 5000, total: 15000 },
      cost: 0.15,
      toolCalls: 10,
      sessions: 1,
      errors: 0,
    };
  }),
  totals: { tokens: 450000, cost: 4.5, sessions: 30, toolCalls: 300, errors: 5 },
  averages: { tokensPerDay: 15000, costPerDay: 0.15, sessionsPerDay: 1 },
};

const mockToolAnalytics = {
  tools: [
    { tool: 'file_read', count: 100, avgDuration: 50, totalTokens: 10000, successRate: 98 },
    { tool: 'web_fetch', count: 50, avgDuration: 500, totalTokens: 50000, successRate: 95 },
    { tool: 'memory_write', count: 30, avgDuration: 30, totalTokens: 5000, successRate: 99 },
  ],
  totalCalls: 180,
  categoryBreakdown: { file: 100, web: 50, memory: 30 },
  mostUsed: { tool: 'file_read', count: 100, avgDuration: 50, totalTokens: 10000, successRate: 98 },
  longestDuration: { tool: 'web_fetch', count: 50, avgDuration: 500, totalTokens: 50000, successRate: 95 },
};

const mockSessionHistory = {
  sessions: [
    {
      id: 'sess_1',
      startTime: '2026-02-01T10:00:00Z',
      endTime: '2026-02-01T11:00:00Z',
      duration: 3600000,
      tokens: { input: 10000, output: 5000, total: 15000 },
      cost: 0.15,
      toolsUsed: ['file_read', 'web_fetch'],
      model: 'claude-opus-4-5',
      channel: 'main',
      status: 'completed',
      errorCount: 0,
    },
  ],
  pagination: { page: 1, pageSize: 10, total: 1, hasMore: false },
};

function setupMocks() {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/api/analytics/summary')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSummary) });
    }
    if (url.includes('/api/analytics/history')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHistory) });
    }
    if (url.includes('/api/analytics/tools')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockToolAnalytics) });
    }
    if (url.includes('/api/analytics/sessions')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSessionHistory) });
    }
    if (url.includes('/api/analytics/export')) {
      return Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'])),
      });
    }
    return Promise.resolve({ ok: false });
  });
}

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it('should render the dashboard title', async () => {
    await act(async () => {
      render(<AnalyticsDashboard />);
    });

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });

  it('should render window controls that call callbacks', async () => {
    const onClose = jest.fn();
    const onMinimize = jest.fn();
    const onMaximize = jest.fn();

    await act(async () => {
      render(
        <AnalyticsDashboard
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
        />
      );
    });

    const closeButton = screen.getByLabelText('Close');
    const minimizeButton = screen.getByLabelText('Minimize');
    const maximizeButton = screen.getByLabelText('Maximize');

    fireEvent.click(closeButton);
    fireEvent.click(minimizeButton);
    fireEvent.click(maximizeButton);

    expect(onClose).toHaveBeenCalled();
    expect(onMinimize).toHaveBeenCalled();
    expect(onMaximize).toHaveBeenCalled();
  });

  it('should render tab navigation buttons', async () => {
    await act(async () => {
      render(<AnalyticsDashboard />);
    });

    expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tools/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sessions/i })).toBeInTheDocument();
  });

  it('should render time range selector', async () => {
    await act(async () => {
      render(<AnalyticsDashboard />);
    });

    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
  });

  it('should render export buttons', async () => {
    await act(async () => {
      render(<AnalyticsDashboard />);
    });

    expect(screen.getByRole('button', { name: /JSON/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CSV/i })).toBeInTheDocument();
  });

  it('should fetch data on mount', async () => {
    await act(async () => {
      render(<AnalyticsDashboard />);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/analytics/summary'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/analytics/history'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/analytics/tools'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/analytics/sessions'));
    });
  });

  it('should display summary cards after loading', async () => {
    await act(async () => {
      render(<AnalyticsDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Today's Tokens/i)).toBeInTheDocument();
    });
  });

  it('should render charts container after loading', async () => {
    await act(async () => {
      render(<AnalyticsDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Usage Over Time/i)).toBeInTheDocument();
    });
  });

  it('should render footer', async () => {
    await act(async () => {
      render(<AnalyticsDashboard />);
    });

    expect(screen.getByText(/Data retention/i)).toBeInTheDocument();
  });

  it('should switch tabs when clicked', async () => {
    await act(async () => {
      render(<AnalyticsDashboard />);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const toolsTab = screen.getByRole('button', { name: /tools/i });

    await act(async () => {
      fireEvent.click(toolsTab);
    });

    // After clicking, tools tab should be active (has blue styling)
    expect(toolsTab.className).toContain('blue');
  });

  it('should handle export button click', async () => {
    await act(async () => {
      render(<AnalyticsDashboard />);
    });

    const jsonButton = screen.getByRole('button', { name: /JSON/i });

    await act(async () => {
      fireEvent.click(jsonButton);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/analytics/export'));
    });
  });
});
