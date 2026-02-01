import { gateway, GatewayError } from '../gateway';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Gateway API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const mockResponse = (data: unknown, ok = true, status = 200) => {
    return Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    });
  };

  describe('sessions', () => {
    it('lists sessions', async () => {
      const mockSessions = { sessions: [{ id: 'session-1' }], total: 1 };
      mockFetch.mockReturnValue(mockResponse(mockSessions));

      const result = await gateway.sessions.list();

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/sessions', expect.any(Object));
      expect(result).toEqual(mockSessions);
    });

    it('lists sessions with params', async () => {
      const mockSessions = { sessions: [], total: 0 };
      mockFetch.mockReturnValue(mockResponse(mockSessions));

      await gateway.sessions.list({ limit: 10, offset: 5, status: 'active' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/gateway/sessions?limit=10&offset=5&status=active',
        expect.any(Object)
      );
    });

    it('gets session by id', async () => {
      const mockSession = { id: 'session-1' };
      mockFetch.mockReturnValue(mockResponse(mockSession));

      const result = await gateway.sessions.get('session-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/sessions/session-1', expect.any(Object));
      expect(result).toEqual(mockSession);
    });

    it('gets session activities', async () => {
      const mockActivities = { activities: [{ id: 'activity-1' }] };
      mockFetch.mockReturnValue(mockResponse(mockActivities));

      const result = await gateway.sessions.getActivities('session-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/gateway/sessions/session-1/activities',
        expect.any(Object)
      );
      expect(result).toEqual(mockActivities);
    });
  });

  describe('activities', () => {
    it('lists activities', async () => {
      const mockActivities = { activities: [{ id: 'activity-1' }] };
      mockFetch.mockReturnValue(mockResponse(mockActivities));

      const result = await gateway.activities.list();

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/activities', expect.any(Object));
      expect(result).toEqual(mockActivities);
    });

    it('lists activities with filters', async () => {
      const mockActivities = { activities: [] };
      mockFetch.mockReturnValue(mockResponse(mockActivities));

      await gateway.activities.list({ type: 'tool_call', limit: 50 });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/gateway/activities?limit=50&type=tool_call',
        expect.any(Object)
      );
    });
  });

  describe('messages', () => {
    it('lists messages', async () => {
      const mockMessages = { messages: [{ id: 'msg-1' }] };
      mockFetch.mockReturnValue(mockResponse(mockMessages));

      const result = await gateway.messages.list();

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/messages', expect.any(Object));
      expect(result).toEqual(mockMessages);
    });

    it('sends message', async () => {
      const response = { id: 'msg-1', status: 'sent' };
      mockFetch.mockReturnValue(mockResponse(response));

      const result = await gateway.messages.send({
        channel: 'telegram',
        content: 'Hello!',
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'telegram', content: 'Hello!' }),
      });
      expect(result).toEqual(response);
    });

    it('gets threads', async () => {
      const mockThreads = { threads: [] };
      mockFetch.mockReturnValue(mockResponse(mockThreads));

      const result = await gateway.messages.getThreads('telegram');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/gateway/messages/threads?channel=telegram',
        expect.any(Object)
      );
      expect(result).toEqual(mockThreads);
    });
  });

  describe('cron', () => {
    it('lists cron jobs', async () => {
      const mockJobs = { jobs: [{ id: 'cron-1' }] };
      mockFetch.mockReturnValue(mockResponse(mockJobs));

      const result = await gateway.cron.list();

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/cron', expect.any(Object));
      expect(result).toEqual(mockJobs);
    });

    it('creates cron job', async () => {
      const newJob = { id: 'cron-1', name: 'Test', schedule: '0 9 * * *', command: 'test', enabled: true };
      mockFetch.mockReturnValue(mockResponse(newJob));

      const result = await gateway.cron.create({
        name: 'Test',
        schedule: '0 9 * * *',
        command: 'test',
        enabled: true,
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      });
      expect(result).toEqual(newJob);
    });

    it('updates cron job', async () => {
      const updatedJob = { id: 'cron-1', enabled: false };
      mockFetch.mockReturnValue(mockResponse(updatedJob));

      await gateway.cron.update('cron-1', { enabled: false });

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/cron/cron-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      });
    });

    it('deletes cron job', async () => {
      mockFetch.mockReturnValue(mockResponse({ success: true }));

      await gateway.cron.delete('cron-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/cron/cron-1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('triggers cron job', async () => {
      mockFetch.mockReturnValue(mockResponse({ success: true, jobId: 'job-1' }));

      const result = await gateway.cron.trigger('cron-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/cron/cron-1/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('memory', () => {
    it('gets memory file', async () => {
      const mockEntry = { file: 'MEMORY.md', content: 'test' };
      mockFetch.mockReturnValue(mockResponse(mockEntry));

      const result = await gateway.memory.get('MEMORY.md');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/gateway/memory?file=MEMORY.md',
        expect.any(Object)
      );
      expect(result).toEqual(mockEntry);
    });

    it('lists memory files', async () => {
      const mockFiles = { files: ['MEMORY.md'] };
      mockFetch.mockReturnValue(mockResponse(mockFiles));

      const result = await gateway.memory.list();

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/memory/files', expect.any(Object));
      expect(result).toEqual(mockFiles);
    });

    it('updates memory file', async () => {
      mockFetch.mockReturnValue(mockResponse({ success: true }));

      await gateway.memory.update('MEMORY.md', 'new content');

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/memory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: 'MEMORY.md', content: 'new content' }),
      });
    });

    it('searches memory', async () => {
      const mockResults = { results: [] };
      mockFetch.mockReturnValue(mockResponse(mockResults));

      const result = await gateway.memory.search('test query');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/gateway/memory/search?q=test%20query',
        expect.any(Object)
      );
      expect(result).toEqual(mockResults);
    });
  });

  describe('agents', () => {
    it('spawns agent', async () => {
      const response = { id: 'agent-1', status: 'started', task: 'test task' };
      mockFetch.mockReturnValue(mockResponse(response));

      const result = await gateway.agents.spawn({ task: 'test task' });

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/agents/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'test task' }),
      });
      expect(result).toEqual(response);
    });

    it('lists agents', async () => {
      const mockAgents = { agents: [{ id: 'agent-1' }] };
      mockFetch.mockReturnValue(mockResponse(mockAgents));

      const result = await gateway.agents.list();

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/agents', expect.any(Object));
      expect(result).toEqual(mockAgents);
    });

    it('gets agent by id', async () => {
      const mockAgent = { id: 'agent-1', task: 'test', status: 'running' };
      mockFetch.mockReturnValue(mockResponse(mockAgent));

      const result = await gateway.agents.get('agent-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/agents/agent-1', expect.any(Object));
      expect(result).toEqual(mockAgent);
    });

    it('stops agent', async () => {
      mockFetch.mockReturnValue(mockResponse({ success: true }));

      const result = await gateway.agents.stop('agent-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/agents/agent-1/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('costs', () => {
    it('gets cost summary', async () => {
      const mockSummary = { today: 1.5, thisWeek: 10, thisMonth: 50 };
      mockFetch.mockReturnValue(mockResponse(mockSummary));

      const result = await gateway.costs.summary();

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/costs/summary', expect.any(Object));
      expect(result).toEqual(mockSummary);
    });

    it('gets cost history', async () => {
      const mockHistory = { history: [{ date: '2024-01-01', cost: 1.0 }] };
      mockFetch.mockReturnValue(mockResponse(mockHistory));

      const result = await gateway.costs.history({ days: 7 });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/gateway/costs/history?days=7',
        expect.any(Object)
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe('health', () => {
    it('checks health', async () => {
      const mockHealth = { status: 'ok', version: '1.0.0' };
      mockFetch.mockReturnValue(mockResponse(mockHealth));

      const result = await gateway.health();

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/health', expect.any(Object));
      expect(result).toEqual(mockHealth);
    });
  });

  describe('wake', () => {
    it('sends wake notification', async () => {
      mockFetch.mockReturnValue(mockResponse({ success: true }));

      const result = await gateway.wake('Test message');

      expect(mockFetch).toHaveBeenCalledWith('/api/gateway/wake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test message', mode: 'now' }),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('throws GatewayError on failure', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal error', code: 'INTERNAL_ERROR' }),
        })
      );

      await expect(gateway.health()).rejects.toThrow(GatewayError);
    });

    it('includes status and code in error', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ message: 'Not found', code: 'NOT_FOUND' }),
        })
      );

      try {
        await gateway.health();
      } catch (error) {
        expect(error).toBeInstanceOf(GatewayError);
        expect((error as GatewayError).status).toBe(404);
        expect((error as GatewayError).code).toBe('NOT_FOUND');
      }
    });
  });
});
