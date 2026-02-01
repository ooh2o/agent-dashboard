/**
 * Tests for InterventionPanel component
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InterventionPanel } from '../intervention-panel';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('InterventionPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the intervention panel', () => {
      render(<InterventionPanel />);

      expect(screen.getByText('Intervention')).toBeInTheDocument();
      expect(screen.getByText('Send instruction to agent:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send now/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });

    it('should show Agent Active badge when agent is running', () => {
      render(<InterventionPanel isAgentRunning={true} />);

      expect(screen.getByText('Agent Active')).toBeInTheDocument();
    });

    it('should not show Agent Active badge when agent is not running', () => {
      render(<InterventionPanel isAgentRunning={false} />);

      expect(screen.queryByText('Agent Active')).not.toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should update instruction when typing', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<InterventionPanel />);

      const textarea = screen.getByPlaceholderText(/focus on the cost tracking/i);
      await user.type(textarea, 'Test instruction');

      expect(textarea).toHaveValue('Test instruction');
    });

    it('should disable send button when instruction is empty', () => {
      render(<InterventionPanel />);

      const sendButton = screen.getByRole('button', { name: /send now/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when instruction has content', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<InterventionPanel />);

      const textarea = screen.getByPlaceholderText(/focus on the cost tracking/i);
      await user.type(textarea, 'Test');

      const sendButton = screen.getByRole('button', { name: /send now/i });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Send Instruction', () => {
    it('should send instruction and show success feedback', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onSendInstruction = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Instruction sent to agent',
        }),
      });

      render(<InterventionPanel onSendInstruction={onSendInstruction} />);

      const textarea = screen.getByPlaceholderText(/focus on the cost tracking/i);
      await user.type(textarea, 'Focus on tests');

      const sendButton = screen.getByRole('button', { name: /send now/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Instruction sent to agent')).toBeInTheDocument();
      });

      expect(onSendInstruction).toHaveBeenCalledWith('Focus on tests');
      expect(textarea).toHaveValue('');
    });

    it('should show error feedback on send failure', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Gateway unavailable',
        }),
      });

      render(<InterventionPanel />);

      const textarea = screen.getByPlaceholderText(/focus on the cost tracking/i);
      await user.type(textarea, 'Test');

      const sendButton = screen.getByRole('button', { name: /send now/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Gateway unavailable')).toBeInTheDocument();
      });
    });

    it('should call API with correct payload', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Done' }),
      });

      render(<InterventionPanel sessionKey="test-session" />);

      const textarea = screen.getByPlaceholderText(/focus on the cost tracking/i);
      await user.type(textarea, 'My instruction');

      const sendButton = screen.getByRole('button', { name: /send now/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/intervene', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'inject',
            sessionKey: 'test-session',
            instruction: 'My instruction',
          }),
        });
      });
    });
  });

  describe('Pause Action', () => {
    it('should pause agent and show success feedback', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onPause = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Agent paused',
        }),
      });

      render(<InterventionPanel onPause={onPause} isAgentRunning={true} />);

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);

      await waitFor(() => {
        expect(screen.getByText('Agent paused')).toBeInTheDocument();
      });

      expect(onPause).toHaveBeenCalled();
    });

    it('should disable pause button when agent is not running', () => {
      render(<InterventionPanel isAgentRunning={false} />);

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      expect(pauseButton).toBeDisabled();
    });
  });

  describe('Stop Action', () => {
    it('should stop agent and show warning feedback', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onStop = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Agent stopped',
        }),
      });

      render(<InterventionPanel onStop={onStop} isAgentRunning={true} />);

      const stopButton = screen.getByRole('button', { name: /stop/i });
      await user.click(stopButton);

      await waitFor(() => {
        expect(screen.getByText('Agent stopped')).toBeInTheDocument();
      });

      expect(onStop).toHaveBeenCalled();
    });

    it('should disable stop button when agent is not running', () => {
      render(<InterventionPanel isAgentRunning={false} />);

      const stopButton = screen.getByRole('button', { name: /stop/i });
      expect(stopButton).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state while sending', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      // Create a promise that we can resolve later
      let resolvePromise: (value: unknown) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(<InterventionPanel />);

      const textarea = screen.getByPlaceholderText(/focus on the cost tracking/i);
      await user.type(textarea, 'Test');

      const sendButton = screen.getByRole('button', { name: /send now/i });
      await user.click(sendButton);

      // All buttons should be disabled during loading
      expect(screen.getByRole('button', { name: /send now/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /pause/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /stop/i })).toBeDisabled();

      // Resolve the promise to clean up
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true, message: 'Done' }),
      });
    });

    it('should disable textarea while action is in progress', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      let resolvePromise: (value: unknown) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(<InterventionPanel />);

      const textarea = screen.getByPlaceholderText(/focus on the cost tracking/i);
      await user.type(textarea, 'Test');

      const sendButton = screen.getByRole('button', { name: /send now/i });
      await user.click(sendButton);

      expect(textarea).toBeDisabled();

      // Resolve to clean up
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true, message: 'Done' }),
      });
    });
  });

  describe('Network Errors', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<InterventionPanel />);

      const textarea = screen.getByPlaceholderText(/focus on the cost tracking/i);
      await user.type(textarea, 'Test');

      const sendButton = screen.getByRole('button', { name: /send now/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });
});
