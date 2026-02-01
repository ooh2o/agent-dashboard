/**
 * Tests for message send API route
 */

import { NextRequest } from 'next/server';

// Mock fetch for gateway calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock rate limiter
jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockReturnValue({
    success: true,
    remaining: 9,
    resetAt: Date.now() + 60000,
  }),
  rateLimits: {
    messageSend: { windowMs: 60000, maxRequests: 10 },
  },
  getClientIdentifier: jest.fn().mockReturnValue('test-client'),
}));

import { POST } from '../send/route';
import { checkRateLimit } from '@/lib/rate-limiter';

describe('POST /api/messages/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: true,
      remaining: 9,
      resetAt: Date.now() + 60000,
    });
  });

  it('should send a message successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'msg-123', status: 'sent' }),
    });

    const request = new NextRequest('http://localhost:3000/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        channel: 'telegram',
        content: 'Hello world',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.id).toBe('msg-123');
  });

  it('should reject rate-limited requests', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      success: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
      retryAfter: 30,
    });

    const request = new NextRequest('http://localhost:3000/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        channel: 'telegram',
        content: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Rate limit exceeded');
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('should reject invalid channels', async () => {
    const request = new NextRequest('http://localhost:3000/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        channel: 'invalid-channel',
        content: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid channel');
  });

  it('should reject empty content', async () => {
    const request = new NextRequest('http://localhost:3000/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        channel: 'telegram',
        content: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required field: content');
  });

  it('should reject content exceeding max length', async () => {
    const longContent = 'x'.repeat(5000);

    const request = new NextRequest('http://localhost:3000/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        channel: 'telegram',
        content: longContent,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Content too long');
  });

  it('should sanitize content before sending', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'msg-123', status: 'sent' }),
    });

    const request = new NextRequest('http://localhost:3000/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        channel: 'telegram',
        content: '<script>alert("xss")</script>',
      }),
    });

    await POST(request);

    // Check that the content sent to gateway is sanitized
    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.content).not.toContain('<script>');
    expect(sentBody.content).toContain('&lt;script&gt;');
  });

  it('should include rate limit headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'msg-123', status: 'sent' }),
    });

    const request = new NextRequest('http://localhost:3000/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        channel: 'telegram',
        content: 'Hello',
      }),
    });

    const response = await POST(request);

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
    expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });
});
