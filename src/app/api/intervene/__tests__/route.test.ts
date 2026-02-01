/**
 * @jest-environment node
 *
 * Tests for Intervention API Route
 */

// Mock fetch before importing the route
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Dynamic import to ensure mocks are set up first
let POST: typeof import('../route').POST;
let dynamic: string;

beforeAll(async () => {
  const routeModule = await import('../route');
  POST = routeModule.POST;
  dynamic = routeModule.dynamic;
});

// Helper to create a mock NextRequest
function createMockRequest(body: object) {
  const { NextRequest } = require('next/server');
  return new NextRequest('http://localhost:3000/api/intervene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/intervene POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GATEWAY_URL;
  });

  describe('Request Validation', () => {
    it('should require action field', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required field: action');
    });

    it('should validate action type', async () => {
      const request = createMockRequest({ action: 'invalid' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid action');
    });

    it('should accept valid actions: inject, pause, stop', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      for (const action of ['inject', 'pause', 'stop']) {
        const body = action === 'inject'
          ? { action, instruction: 'test' }
          : { action };
        const request = createMockRequest(body);
        const response = await POST(request);

        expect(response.status).toBe(200);
      }
    });

    it('should require instruction for inject action', async () => {
      const request = createMockRequest({ action: 'inject' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Instruction is required');
    });

    it('should not require instruction for pause action', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest({ action: 'pause' });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should not require instruction for stop action', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest({ action: 'stop' });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Gateway Communication', () => {
    it('should use default gateway URL when env not set', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest({ action: 'pause' });
      await POST(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4280/intervene',
        expect.any(Object)
      );
    });

    it('should use custom gateway URL from environment', async () => {
      process.env.GATEWAY_URL = 'http://custom-gateway:9000';

      // Re-import to pick up new env
      jest.resetModules();
      const routeModule = await import('../route');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest({ action: 'pause' });
      await routeModule.POST(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://custom-gateway:9000/intervene',
        expect.any(Object)
      );
    });

    it('should forward action and sessionKey to gateway', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest({
        action: 'pause',
        sessionKey: 'my-session',
      });
      await POST(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'pause',
            sessionKey: 'my-session',
          }),
        })
      );
    });

    it('should forward instruction for inject action', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest({
        action: 'inject',
        sessionKey: 'main',
        instruction: 'Focus on testing',
      });
      await POST(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            action: 'inject',
            sessionKey: 'main',
            instruction: 'Focus on testing',
          }),
        })
      );
    });

    it('should default sessionKey to main', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest({ action: 'pause' });
      await POST(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"sessionKey":"main"'),
        })
      );
    });
  });

  describe('Success Responses', () => {
    it('should return success response for inject action', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest({
        action: 'inject',
        instruction: 'Test instruction',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Instruction sent to agent');
      expect(data.action).toBe('inject');
      expect(data.timestamp).toBeDefined();
    });

    it('should return success response for pause action', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest({ action: 'pause' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Agent paused');
      expect(data.action).toBe('pause');
    });

    it('should return success response for stop action', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = createMockRequest({ action: 'stop' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Agent stopped');
      expect(data.action).toBe('stop');
    });
  });

  describe('Error Handling', () => {
    it('should handle gateway error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const request = createMockRequest({ action: 'pause' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Gateway error');
    });

    it('should handle connection refused error', async () => {
      mockFetch.mockRejectedValue(new Error('fetch failed: ECONNREFUSED'));

      const request = createMockRequest({ action: 'pause' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unable to connect to gateway');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('network timeout'));

      const request = createMockRequest({ action: 'pause' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValue('unknown error');

      const request = createMockRequest({ action: 'pause' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});

describe('/api/intervene Configuration', () => {
  it('should export force-dynamic', () => {
    expect(dynamic).toBe('force-dynamic');
  });
});
