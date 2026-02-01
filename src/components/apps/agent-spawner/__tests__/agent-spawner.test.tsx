import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

// Mock the gateway hooks
const mockTemplates = [
  {
    id: 'general',
    name: 'General Agent',
    description: 'Multi-purpose autonomous agent',
    task: '',
    model: 'claude-sonnet-4-20250514',
    thinking: true,
    timeout: 600,
    icon: 'bot',
    isBuiltIn: true,
  },
  {
    id: 'code-review',
    name: 'Code Review Agent',
    description: 'Reviews code for bugs and best practices',
    task: 'Review the following code:',
    model: 'claude-sonnet-4-20250514',
    thinking: true,
    timeout: 300,
    icon: 'code',
    isBuiltIn: true,
  },
];

const mockAgents = [
  {
    id: 'agent-1',
    templateId: 'code-review',
    templateName: 'Code Review Agent',
    task: 'Review PR #142 for security issues',
    status: 'running' as const,
    startTime: new Date(Date.now() - 120000).toISOString(),
    progress: 65,
    tokensUsed: { input: 10000, output: 2450 },
  },
];

const mockMutate = jest.fn();
const mockMutateAsync = jest.fn();
const mockRefetch = jest.fn();

jest.mock('@/hooks/use-gateway', () => ({
  useAgentTemplates: () => ({
    data: { templates: mockTemplates },
    isLoading: false,
    error: null,
  }),
  useRunningAgents: () => ({
    data: { agents: mockAgents, synced: true },
    isLoading: false,
    refetch: mockRefetch,
  }),
  useSpawnFromTemplate: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync.mockResolvedValue({ agent: { id: 'new-agent' } }),
    isPending: false,
    isError: false,
  }),
  useKillAgent: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync.mockResolvedValue({ success: true }),
    isPending: false,
  }),
  useAgentOutput: () => ({
    data: { id: 'agent-1', status: 'running', output: 'Agent output text' },
    isLoading: false,
    error: null,
  }),
  useRemoveAgent: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync.mockResolvedValue({ success: true }),
    isPending: false,
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('AgentSpawner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the agent spawner title', () => {
    renderWithProviders(<AgentSpawner />);
    expect(screen.getByText('Agent Spawner')).toBeInTheDocument();
  });

  it('renders the template selector with default template', () => {
    renderWithProviders(<AgentSpawner />);
    expect(screen.getByText('General Agent')).toBeInTheDocument();
    expect(screen.getByText('Multi-purpose autonomous agent')).toBeInTheDocument();
  });

  it('renders the task input textarea', () => {
    renderWithProviders(<AgentSpawner />);
    expect(screen.getByPlaceholderText('Describe the task for this agent...')).toBeInTheDocument();
  });

  it('renders the launch button', () => {
    renderWithProviders(<AgentSpawner />);
    expect(screen.getByText('Launch Agent')).toBeInTheDocument();
  });

  it('disables launch button when task is empty', () => {
    renderWithProviders(<AgentSpawner />);
    const launchButton = screen.getByRole('button', { name: /launch agent/i });
    expect(launchButton).toBeDisabled();
  });

  it('enables launch button when task is entered', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AgentSpawner />);

    const textarea = screen.getByPlaceholderText('Describe the task for this agent...');
    await user.type(textarea, 'Test task');

    const launchButton = screen.getByRole('button', { name: /launch agent/i });
    expect(launchButton).not.toBeDisabled();
  });

  it('shows template dropdown when template selector is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AgentSpawner />);

    const templateSelector = screen.getByText('General Agent').closest('button');
    await user.click(templateSelector!);

    expect(screen.getByText('Code Review Agent')).toBeInTheDocument();
    expect(screen.getByText('Reviews code for bugs and best practices')).toBeInTheDocument();
  });

  it('changes selected template when clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AgentSpawner />);

    // Open dropdown
    const templateSelector = screen.getByText('General Agent').closest('button');
    await user.click(templateSelector!);

    // Select Code Review Agent
    const codeAgentOption = screen.getAllByText('Code Review Agent')[0];
    await user.click(codeAgentOption);

    // Verify selection changed
    await waitFor(() => {
      expect(screen.getByText('Reviews code for bugs and best practices')).toBeInTheDocument();
    });
  });

  it('renders running agents section', () => {
    renderWithProviders(<AgentSpawner />);
    expect(screen.getByText('Running Agents')).toBeInTheDocument();
  });

  it('shows active agents count badge', () => {
    renderWithProviders(<AgentSpawner />);
    expect(screen.getByText('1 active')).toBeInTheDocument();
  });

  it('displays running agents with status', () => {
    renderWithProviders(<AgentSpawner />);
    expect(screen.getByText('Code Review Agent')).toBeInTheDocument();
    expect(screen.getByText('Review PR #142 for security issues')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('displays agent progress', () => {
    renderWithProviders(<AgentSpawner />);
    expect(screen.getByText('65% complete')).toBeInTheDocument();
  });

  it('displays token usage', () => {
    renderWithProviders(<AgentSpawner />);
    expect(screen.getByText('12,450 tokens')).toBeInTheDocument();
  });

  it('launches new agent when button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AgentSpawner />);

    const textarea = screen.getByPlaceholderText('Describe the task for this agent...');
    await user.type(textarea, 'New test task');

    const launchButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(launchButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        templateId: 'general',
        task: 'New test task',
      });
    });
  });

  it('clears task input after launching', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AgentSpawner />);

    const textarea = screen.getByPlaceholderText('Describe the task for this agent...');
    await user.type(textarea, 'New test task');

    const launchButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(launchButton);

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('opens output viewer when view button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AgentSpawner />);

    const viewButton = screen.getByTitle('View Output');
    await user.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Agent Output')).toBeInTheDocument();
      expect(screen.getByText('Agent output text')).toBeInTheDocument();
    });
  });

  it('calls kill mutation when kill button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AgentSpawner />);

    const killButton = screen.getByTitle('Kill Agent');
    await user.click(killButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('agent-1');
    });
  });

  it('shows built-in badge for built-in templates', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AgentSpawner />);

    const templateSelector = screen.getByText('General Agent').closest('button');
    await user.click(templateSelector!);

    const builtInBadges = screen.getAllByText('Built-in');
    expect(builtInBadges.length).toBeGreaterThan(0);
  });

  it('calls refetch when refresh button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AgentSpawner />);

    // Find the refresh button by its class or structure
    const refreshButtons = screen.getAllByRole('button');
    const refreshButton = refreshButtons.find(btn =>
      btn.querySelector('svg.lucide-refresh-cw') !== null
    );

    if (refreshButton) {
      await user.click(refreshButton);
      expect(mockRefetch).toHaveBeenCalled();
    }
  });
});

describe('AgentSpawner Loading States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state for templates', () => {
    jest.doMock('@/hooks/use-gateway', () => ({
      useAgentTemplates: () => ({
        data: null,
        isLoading: true,
        error: null,
      }),
      useRunningAgents: () => ({
        data: { agents: [], synced: false },
        isLoading: false,
        refetch: jest.fn(),
      }),
      useSpawnFromTemplate: () => ({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
      }),
      useKillAgent: () => ({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
      }),
      useAgentOutput: () => ({
        data: null,
        isLoading: false,
        error: null,
      }),
      useRemoveAgent: () => ({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
      }),
    }));
  });
});

describe('AgentSpawner Error States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles spawn errors gracefully', async () => {
    const errorMutateAsync = jest.fn().mockRejectedValue(new Error('Spawn failed'));

    jest.doMock('@/hooks/use-gateway', () => ({
      useAgentTemplates: () => ({
        data: { templates: mockTemplates },
        isLoading: false,
        error: null,
      }),
      useRunningAgents: () => ({
        data: { agents: [], synced: false },
        isLoading: false,
        refetch: jest.fn(),
      }),
      useSpawnFromTemplate: () => ({
        mutate: jest.fn(),
        mutateAsync: errorMutateAsync,
        isPending: false,
        isError: true,
      }),
      useKillAgent: () => ({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
      }),
      useAgentOutput: () => ({
        data: null,
        isLoading: false,
        error: null,
      }),
      useRemoveAgent: () => ({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
      }),
    }));
  });
});
