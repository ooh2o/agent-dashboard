/**
 * Tests for rate limiter utility
 */

import {
  checkRateLimit,
  getClientIdentifier,
  type RateLimitConfig,
} from '../rate-limiter';

describe('checkRateLimit', () => {
  const config: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 5,
  };

  it('should allow first request', () => {
    const key = `test-${Date.now()}`;
    const result = checkRateLimit(key, config);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should track request count', () => {
    const key = `test-${Date.now()}`;

    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, config);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }

    // 6th request should be blocked
    const result = checkRateLimit(key, config);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should reset after window expires', async () => {
    const shortConfig: RateLimitConfig = {
      windowMs: 100, // 100ms window
      maxRequests: 2,
    };

    const key = `test-${Date.now()}`;

    // Use up the limit
    checkRateLimit(key, shortConfig);
    checkRateLimit(key, shortConfig);
    expect(checkRateLimit(key, shortConfig).success).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should be allowed again
    const result = checkRateLimit(key, shortConfig);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('should track different keys separately', () => {
    const key1 = `user1-${Date.now()}`;
    const key2 = `user2-${Date.now()}`;

    // Use up key1's limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key1, config);
    }
    expect(checkRateLimit(key1, config).success).toBe(false);

    // key2 should still have requests available
    expect(checkRateLimit(key2, config).success).toBe(true);
  });
});

describe('getClientIdentifier', () => {
  // Create a mock request with headers
  function createMockRequest(headers: Record<string, string> = {}) {
    return {
      headers: {
        get: (name: string) => headers[name.toLowerCase()] || null,
      },
    } as Request;
  }

  it('should use X-Forwarded-For header', () => {
    const request = createMockRequest({
      'x-forwarded-for': '1.2.3.4, 5.6.7.8',
    });

    expect(getClientIdentifier(request)).toBe('1.2.3.4');
  });

  it('should use X-Real-IP as fallback', () => {
    const request = createMockRequest({
      'x-real-ip': '1.2.3.4',
    });

    expect(getClientIdentifier(request)).toBe('1.2.3.4');
  });

  it('should return default when no headers', () => {
    const request = createMockRequest();

    expect(getClientIdentifier(request)).toBe('default-client');
  });
});
