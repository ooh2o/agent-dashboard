import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentSpawner } from '../index';

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

describe('AgentSpawner Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the agent spawner title', () => {
    render(<AgentSpawner />);
    expect(screen.getByText('Agent Spawner')).toBeInTheDocument();
  });

  it('renders the template selector', () => {
    render(<AgentSpawner />);
    expect(screen.getByText('General Agent')).toBeInTheDocument();
    expect(screen.getByText('Multi-purpose autonomous agent')).toBeInTheDocument();
  });

  it('renders the task input textarea', () => {
    render(<AgentSpawner />);
    expect(screen.getByPlaceholderText('Describe the task for this agent...')).toBeInTheDocument();
  });

  it('renders the launch button', () => {
    render(<AgentSpawner />);
    expect(screen.getByText('Launch Agent')).toBeInTheDocument();
  });

  it('disables launch button when task is empty', () => {
    render(<AgentSpawner />);
    const launchButton = screen.getByRole('button', { name: /launch agent/i });
    expect(launchButton).toBeDisabled();
  });

  it('enables launch button when task is entered', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<AgentSpawner />);

    const textarea = screen.getByPlaceholderText('Describe the task for this agent...');
    await user.type(textarea, 'Test task');

    const launchButton = screen.getByRole('button', { name: /launch agent/i });
    expect(launchButton).not.toBeDisabled();
  });

  it('shows template dropdown when template selector is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<AgentSpawner />);

    const templateSelector = screen.getByText('General Agent').closest('button');
    await user.click(templateSelector!);

    expect(screen.getByText('Code Agent')).toBeInTheDocument();
    expect(screen.getByText('Research Agent')).toBeInTheDocument();
    expect(screen.getByText('Writer Agent')).toBeInTheDocument();
    expect(screen.getByText('DevOps Agent')).toBeInTheDocument();
  });

  it('changes selected template when clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<AgentSpawner />);

    // Open dropdown
    const templateSelector = screen.getByText('General Agent').closest('button');
    await user.click(templateSelector!);

    // Select Code Agent
    const codeAgentOption = screen.getByText('Code Agent');
    await user.click(codeAgentOption);

    // Verify selection changed (the main selector should now show Code Agent)
    expect(screen.getByText('Specialized for coding tasks')).toBeInTheDocument();
  });

  it('renders running agents section', () => {
    render(<AgentSpawner />);
    expect(screen.getByText('Running Agents')).toBeInTheDocument();
  });

  it('shows active agents count badge', () => {
    render(<AgentSpawner />);
    expect(screen.getByText('2 active')).toBeInTheDocument();
  });

  it('displays pre-existing running agents', () => {
    render(<AgentSpawner />);
    expect(screen.getByText('Code Review Agent')).toBeInTheDocument();
    expect(screen.getByText('Research Agent')).toBeInTheDocument();
  });

  it('displays agent tasks', () => {
    render(<AgentSpawner />);
    expect(screen.getByText('Review PR #142 for security issues')).toBeInTheDocument();
    expect(screen.getByText('Find best practices for React 19')).toBeInTheDocument();
  });

  it('displays agent status badges', () => {
    render(<AgentSpawner />);
    expect(screen.getAllByText('Running').length).toBe(2);
  });

  it('displays agent progress', () => {
    render(<AgentSpawner />);
    expect(screen.getByText('65% complete')).toBeInTheDocument();
    expect(screen.getByText('88% complete')).toBeInTheDocument();
  });

  it('displays token usage', () => {
    render(<AgentSpawner />);
    expect(screen.getByText('12,450 tokens')).toBeInTheDocument();
    expect(screen.getByText('8,920 tokens')).toBeInTheDocument();
  });

  it('launches new agent when button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<AgentSpawner />);

    const textarea = screen.getByPlaceholderText('Describe the task for this agent...');
    await user.type(textarea, 'New test task');

    const launchButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(launchButton);

    // Agent should appear with 'Starting' status initially
    await waitFor(() => {
      expect(screen.getByText('New test task')).toBeInTheDocument();
    });
  });

  it('clears task input after launching', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<AgentSpawner />);

    const textarea = screen.getByPlaceholderText('Describe the task for this agent...');
    await user.type(textarea, 'New test task');

    const launchButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(launchButton);

    expect(textarea).toHaveValue('');
  });

  it('toggles agent pause/resume', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<AgentSpawner />);

    // Find pause buttons (they have Pause icon for running agents)
    const pauseButtons = screen.getAllByRole('button');
    const pauseButton = pauseButtons.find(btn =>
      btn.querySelector('svg') && btn.className.includes('hover:bg-zinc-700')
    );

    if (pauseButton) {
      await user.click(pauseButton);
      // Status should change to Paused
      await waitFor(() => {
        expect(screen.getByText('Paused')).toBeInTheDocument();
      });
    }
  });

  it('removes agent when kill button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<AgentSpawner />);

    // Initially should have 2 agents
    expect(screen.getByText('Code Review Agent')).toBeInTheDocument();
    expect(screen.getByText('Research Agent')).toBeInTheDocument();

    // Find and click kill button (has red hover state)
    const killButtons = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('hover:bg-red-500')
    );

    if (killButtons.length > 0) {
      await user.click(killButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Code Review Agent')).not.toBeInTheDocument();
      });
    }
  });

  it('shows empty state when no agents are running', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<AgentSpawner />);

    // Remove all agents
    const killButtons = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('hover:bg-red-500')
    );

    for (const btn of killButtons) {
      await user.click(btn);
    }

    await waitFor(() => {
      expect(screen.getByText('No agents running')).toBeInTheDocument();
      expect(screen.getByText('Launch an agent to get started')).toBeInTheDocument();
    });
  });

  it('displays elapsed time for agents', () => {
    render(<AgentSpawner />);
    // Time format should be visible (e.g., "2:00" or similar)
    const timePatterns = screen.getAllByText(/\d+:\d{2}/);
    expect(timePatterns.length).toBeGreaterThan(0);
  });
});
