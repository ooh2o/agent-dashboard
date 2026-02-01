/**
 * @jest-environment node
 *
 * Tests for SSE Events API Route
 *
 * These tests verify the SSE streaming behavior of the events endpoint.
 * We test the route by simulating requests and validating responses.
 */

// Mock fetch before importing the route
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Dynamic import to ensure mocks are set up first
let GET: typeof import('../route').GET;
let dynamic: string;

beforeAll(async () => {
  const routeModule = await import('../route');
  GET = routeModule.GET;
  dynamic = routeModule.dynamic;
});

// Helper to create a mock NextRequest
function createMockRequest(url: string, options: RequestInit = {}) {
  const { NextRequest } = require('next/server');
  return new NextRequest(url, options);
}

// Helper to read stream content
async function readStreamContent(response: Response): Promise<string[]> {
  const reader = response.body?.getReader();
  if (!reader) return [];

  const chunks: string[] = [];
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(decoder.decode(value, { stream: true }));
      }
    }
  } catch {
    // Stream ended
  }

  return chunks;
}

describe('/api/events SSE Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    delete process.env.GATEWAY_URL;
  });

  describe('Response Headers', () => {
    it('should return correct SSE headers', async () => {
      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        cancel: jest.fn().mockResolvedValue(undefined),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const request = createMockRequest('http://localhost:3000/api/events');
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform');
      expect(response.headers.get('Connection')).toBe('keep-alive');
      expect(response.headers.get('X-Accel-Buffering')).toBe('no');
    });
  });

  describe('Initial Connection', () => {
    it('should send connected event on startup', async () => {
      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        cancel: jest.fn().mockResolvedValue(undefined),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const request = createMockRequest('http://localhost:3000/api/events');
      const response = await GET(request);

      const chunks = await readStreamContent(response);
      const firstChunk = chunks[0] || '';

      expect(firstChunk).toContain('data:');
      expect(firstChunk).toContain('"type":"connected"');
    });
  });

  describe('Gateway Connection', () => {
    it('should use default gateway URL when env not set', async () => {
      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        cancel: jest.fn().mockResolvedValue(undefined),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const request = createMockRequest('http://localhost:3000/api/events');
      await GET(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3030/events',
        expect.any(Object)
      );
    });

    it('should use custom gateway URL from environment', async () => {
      process.env.GATEWAY_URL = 'http://custom-gateway:9000';

      // Re-import to pick up new env
      jest.resetModules();
      const routeModule = await import('../route');

      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        cancel: jest.fn().mockResolvedValue(undefined),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const request = createMockRequest('http://localhost:3000/api/events');
      await routeModule.GET(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://custom-gateway:9000/events',
        expect.any(Object)
      );
    });

    it('should include correct headers when connecting to gateway', async () => {
      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        cancel: jest.fn().mockResolvedValue(undefined),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const request = createMockRequest('http://localhost:3000/api/events');
      await GET(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should send error event when gateway connection fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const request = createMockRequest('http://localhost:3000/api/events');
      const response = await GET(request);

      const chunks = await readStreamContent(response);
      const allContent = chunks.join('');

      expect(allContent).toContain('"type":"error"');
      expect(allContent).toContain('Failed to connect to gateway');
    });

    it('should send error event when gateway has no response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      const request = createMockRequest('http://localhost:3000/api/events');
      const response = await GET(request);

      const chunks = await readStreamContent(response);
      const allContent = chunks.join('');

      expect(allContent).toContain('"type":"error"');
      expect(allContent).toContain('No response body from gateway');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request = createMockRequest('http://localhost:3000/api/events');
      const response = await GET(request);

      const chunks = await readStreamContent(response);
      const allContent = chunks.join('');

      expect(allContent).toContain('"type":"error"');
      expect(allContent).toContain('Network error');
    });
  });

  describe('Event Forwarding', () => {
    it('should forward events from gateway to client', async () => {
      const gatewayEvent = 'data: {"type":"activity","data":{"id":"test-123"}}\n\n';

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(gatewayEvent),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        cancel: jest.fn().mockResolvedValue(undefined),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const request = createMockRequest('http://localhost:3000/api/events');
      const response = await GET(request);

      const chunks = await readStreamContent(response);
      const allContent = chunks.join('');

      expect(allContent).toContain('"type":"activity"');
      expect(allContent).toContain('"id":"test-123"');
    });

    it('should forward multiple events in order', async () => {
      const event1 = 'data: {"type":"activity","data":{"seq":1}}\n\n';
      const event2 = 'data: {"type":"activity","data":{"seq":2}}\n\n';

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(event1),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(event2),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        cancel: jest.fn().mockResolvedValue(undefined),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const request = createMockRequest('http://localhost:3000/api/events');
      const response = await GET(request);

      const chunks = await readStreamContent(response);
      const allContent = chunks.join('');

      expect(allContent).toContain('"seq":1');
      expect(allContent).toContain('"seq":2');
    });
  });
});

describe('/api/events Configuration', () => {
  it('should export force-dynamic', () => {
    expect(dynamic).toBe('force-dynamic');
  });
});
