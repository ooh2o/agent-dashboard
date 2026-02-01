/**
 * Tests for message API routes
 */

import { NextRequest } from 'next/server';

// Mock fetch for gateway calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import route handlers after mocking
import { GET } from '../route';

describe('GET /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch messages from gateway', async () => {
    const mockMessages = {
      messages: [
        {
          id: 'msg-1',
          channel: 'telegram',
          sender: 'user1',
          content: 'Hello world',
          timestamp: '2024-01-15T10:00:00Z',
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    });

    const request = new NextRequest('http://localhost:3000/api/messages');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.messages).toHaveLength(1);
    expect(data.messages[0].content).toBe('Hello world');
  });

  it('should filter by channel', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/messages?channel=discord'
    );
    await GET(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('channel=discord'),
      expect.any(Object)
    );
  });

  it('should limit results with bounds checking', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    // Request 200 messages, should be capped at 100
    const request = new NextRequest(
      'http://localhost:3000/api/messages?limit=200'
    );
    await GET(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=100'),
      expect.any(Object)
    );
  });

  it('should sanitize message content', async () => {
    const mockMessages = {
      messages: [
        {
          id: 'msg-1',
          channel: 'telegram',
          sender: 'user1',
          content: '<script>alert("xss")</script>',
          timestamp: '2024-01-15T10:00:00Z',
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    });

    const request = new NextRequest('http://localhost:3000/api/messages');
    const response = await GET(request);
    const data = await response.json();

    // Content should be escaped
    expect(data.messages[0].content).not.toContain('<script>');
    expect(data.messages[0].content).toContain('&lt;script&gt;');
  });

  it('should handle gateway connection errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

    const request = new NextRequest('http://localhost:3000/api/messages');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Unable to connect to gateway');
  });

  it('should handle gateway errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    });

    const request = new NextRequest('http://localhost:3000/api/messages');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
