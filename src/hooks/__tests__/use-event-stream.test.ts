/**
 * Tests for useEventStream hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEventStream, calculateBackoffDelay } from '../use-event-stream';
import {
  MockEventSource,
  setupMockEventSource,
  clearMockEventSourceInstances,
  getLatestMockEventSource,
} from '@/__tests__/utils/mock-gateway';

// Setup mock EventSource before tests
let OriginalEventSource: typeof EventSource;

beforeAll(() => {
  OriginalEventSource = global.EventSource;
  setupMockEventSource();
});

afterAll(() => {
  global.EventSource = OriginalEventSource;
});

beforeEach(() => {
  jest.clearAllMocks();
  clearMockEventSourceInstances();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('calculateBackoffDelay', () => {
  it('should calculate exponential backoff correctly', () => {
    // Since jitter adds ±10%, we check the range
    const base = 1000;
    const max = 30000;

    // Attempt 0: base * 2^0 = 1000
    const delay0 = calculateBackoffDelay(0, base, max);
    expect(delay0).toBeGreaterThanOrEqual(900);
    expect(delay0).toBeLessThanOrEqual(1100);

    // Attempt 1: base * 2^1 = 2000
    const delay1 = calculateBackoffDelay(1, base, max);
    expect(delay1).toBeGreaterThanOrEqual(1800);
    expect(delay1).toBeLessThanOrEqual(2200);

    // Attempt 2: base * 2^2 = 4000
    const delay2 = calculateBackoffDelay(2, base, max);
    expect(delay2).toBeGreaterThanOrEqual(3600);
    expect(delay2).toBeLessThanOrEqual(4400);

    // Attempt 5: base * 2^5 = 32000, capped at 30000
    const delay5 = calculateBackoffDelay(5, base, max);
    expect(delay5).toBeGreaterThanOrEqual(27000);
    expect(delay5).toBeLessThanOrEqual(33000);
  });

  it('should cap delay at maxDelay', () => {
    const base = 1000;
    const max = 5000;

    // Attempt 10 would be 1024000, but capped at 5000
    const delay = calculateBackoffDelay(10, base, max);
    expect(delay).toBeGreaterThanOrEqual(4500);
    expect(delay).toBeLessThanOrEqual(5500);
  });
});

describe('useEventStream', () => {
  describe('connection', () => {
    it('should auto-connect on mount by default', async () => {
      const { result } = renderHook(() => useEventStream());

      // Wait for connection
      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should not auto-connect when autoConnect is false', () => {
      const { result } = renderHook(() =>
        useEventStream({ autoConnect: false })
      );

      expect(result.current.isConnected).toBe(false);
    });

    it('should connect manually when connect is called', async () => {
      const { result } = renderHook(() =>
        useEventStream({ autoConnect: false })
      );

      expect(result.current.isConnected).toBe(false);

      act(() => {
        result.current.connect();
      });

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should disconnect when disconnect is called', async () => {
      const { result } = renderHook(() => useEventStream());

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
    });

    it('should call onConnect callback when connected', async () => {
      const onConnect = jest.fn();
      renderHook(() => useEventStream({ onConnect }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(onConnect).toHaveBeenCalled();
      });
    });
  });

  describe('event handling', () => {
    it('should call onActivity for activity events', async () => {
      const onActivity = jest.fn();
      renderHook(() => useEventStream({ onActivity }));

      // Wait for connection
      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      // Get the instance created by the hook
      const instance = getLatestMockEventSource();
      expect(instance).toBeDefined();

      const activityData = {
        type: 'activity',
        data: {
          id: 'act-1',
          type: 'tool_call',
          tool: 'Read',
          explanation: 'Read file',
          timestamp: new Date().toISOString(),
        },
      };

      act(() => {
        instance!.emit('message', activityData);
      });

      expect(onActivity).toHaveBeenCalledWith(activityData.data);
    });

    it('should call onSessionStart for session_start events', async () => {
      const onSessionStart = jest.fn();
      renderHook(() => useEventStream({ onSessionStart }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const instance = getLatestMockEventSource();
      expect(instance).toBeDefined();

      const sessionData = {
        type: 'session_start',
        data: {
          id: 'session-1',
          model: 'claude-3-opus',
        },
      };

      act(() => {
        instance!.emit('message', sessionData);
      });

      expect(onSessionStart).toHaveBeenCalledWith(sessionData.data);
    });

    it('should call onCostUpdate for cost_update events', async () => {
      const onCostUpdate = jest.fn();
      renderHook(() => useEventStream({ onCostUpdate }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const instance = getLatestMockEventSource();
      expect(instance).toBeDefined();

      const costData = {
        type: 'cost_update',
        data: {
          sessionId: 'session-1',
          totalCost: 0.05,
          tokens: { input: 1000, output: 500 },
          model: 'claude-3-opus',
        },
      };

      act(() => {
        instance!.emit('message', costData);
      });

      expect(onCostUpdate).toHaveBeenCalledWith(costData.data);
    });

    it('should call onError for error events', async () => {
      const onError = jest.fn();
      renderHook(() => useEventStream({ onError }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const instance = getLatestMockEventSource();
      expect(instance).toBeDefined();

      const errorData = {
        type: 'error',
        data: { message: 'Gateway connection lost' },
      };

      act(() => {
        instance!.emit('message', errorData);
      });

      expect(onError).toHaveBeenCalledWith('Gateway connection lost');
    });

    it('should ignore keepalive events', async () => {
      const onActivity = jest.fn();
      renderHook(() => useEventStream({ onActivity }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const instance = getLatestMockEventSource();
      expect(instance).toBeDefined();

      act(() => {
        instance!.emit('message', { type: 'keepalive' });
      });

      expect(onActivity).not.toHaveBeenCalled();
    });

    it('should handle agent_spawn and agent_complete events', async () => {
      const onAgentEvent = jest.fn();
      renderHook(() => useEventStream({ onAgentEvent }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const instance = getLatestMockEventSource();
      expect(instance).toBeDefined();

      const spawnData = {
        type: 'agent_spawn',
        data: {
          id: 'agent-1',
          task: 'Research task',
          status: 'started',
        },
      };

      act(() => {
        instance!.emit('message', spawnData);
      });

      expect(onAgentEvent).toHaveBeenCalledWith(spawnData.data);

      const completeData = {
        type: 'agent_complete',
        data: {
          id: 'agent-1',
          task: 'Research task',
          status: 'completed',
          output: 'Task completed successfully',
        },
      };

      act(() => {
        instance!.emit('message', completeData);
      });

      expect(onAgentEvent).toHaveBeenCalledWith(completeData.data);
    });
  });

  describe('reconnection with exponential backoff', () => {
    it('should attempt to reconnect on error with exponential backoff', async () => {
      const onDisconnect = jest.fn();
      const onReconnecting = jest.fn();

      const { result } = renderHook(() =>
        useEventStream({
          reconnectDelay: 1000,
          maxReconnectDelay: 30000,
          maxReconnectAttempts: 5,
          onDisconnect,
          onReconnecting,
        })
      );

      // Wait for initial connection
      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Get the instance and simulate error
      const instance = getLatestMockEventSource();
      expect(instance).toBeDefined();

      act(() => {
        instance!.emitError();
      });

      expect(onDisconnect).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionError).toContain('Reconnecting');
      expect(result.current.reconnectAttempt).toBe(1);
    });

    it('should track reconnect attempts and show error when max exceeded', async () => {
      // Test that the reconnect attempt counter increases on errors
      const { result } = renderHook(() =>
        useEventStream({
          reconnectDelay: 100,
          maxReconnectDelay: 200,
          maxReconnectAttempts: 3,
        })
      );

      // Wait for initial connection
      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // First error - triggers attempt 1
      const instance = getLatestMockEventSource();
      act(() => {
        instance!.emitError();
      });

      expect(result.current.reconnectAttempt).toBe(1);
      expect(result.current.connectionError).toContain('1/3');
      expect(result.current.isConnected).toBe(false);
    });

    it('should reset reconnect attempts on successful connection', async () => {
      const { result } = renderHook(() =>
        useEventStream({
          reconnectDelay: 100,
          maxReconnectAttempts: 5,
        })
      );

      // Wait for initial connection
      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Should have no reconnect attempts on success
      expect(result.current.reconnectAttempt).toBe(0);
    });

    it('should allow manual reset of reconnect attempts', async () => {
      const { result } = renderHook(() =>
        useEventStream({ autoConnect: false })
      );

      // Manually reset
      act(() => {
        result.current.resetReconnectAttempts();
      });

      expect(result.current.reconnectAttempt).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useEventStream());

      // Wait for connection
      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Unmount should close connection
      unmount();

      // Verify the EventSource was closed
      const instance = getLatestMockEventSource();
      expect(instance?.readyState).toBe(2); // CLOSED
    });

    it('should clear pending reconnect timeout on disconnect', async () => {
      const { result } = renderHook(() =>
        useEventStream({
          reconnectDelay: 5000,
          maxReconnectAttempts: 5,
        })
      );

      // Wait for initial connection
      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate error (will schedule reconnect)
      const instance = getLatestMockEventSource();
      act(() => {
        instance!.emitError();
      });

      // Disconnect before reconnect happens
      act(() => {
        result.current.disconnect();
      });

      // Advance past reconnect delay - should not reconnect
      await act(async () => {
        jest.advanceTimersByTime(6000);
      });

      expect(result.current.isConnected).toBe(false);
    });
  });
});
