/**
 * @jest-environment node
 *
 * Tests for auth utility functions
 */
import {
  getExpectedToken,
  isAuthRequired,
  validateToken,
  createUnauthorizedError,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
} from '../auth';

describe('Auth Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getExpectedToken', () => {
    it('should return null when OPENCLAW_DASHBOARD_TOKEN is not set', () => {
      delete process.env.OPENCLAW_DASHBOARD_TOKEN;

      expect(getExpectedToken()).toBeNull();
    });

    it('should return the token when OPENCLAW_DASHBOARD_TOKEN is set', () => {
      process.env.OPENCLAW_DASHBOARD_TOKEN = 'my-secret-token';

      expect(getExpectedToken()).toBe('my-secret-token');
    });
  });

  describe('isAuthRequired', () => {
    it('should return false when token is not configured', () => {
      delete process.env.OPENCLAW_DASHBOARD_TOKEN;

      expect(isAuthRequired()).toBe(false);
    });

    it('should return true when token is configured', () => {
      process.env.OPENCLAW_DASHBOARD_TOKEN = 'token123';

      expect(isAuthRequired()).toBe(true);
    });
  });

  describe('validateToken', () => {
    it('should return true when no token is configured (auth disabled)', () => {
      delete process.env.OPENCLAW_DASHBOARD_TOKEN;

      expect(validateToken(null)).toBe(true);
      expect(validateToken(undefined)).toBe(true);
      expect(validateToken('anything')).toBe(true);
    });

    it('should return false for null/undefined when token is required', () => {
      process.env.OPENCLAW_DASHBOARD_TOKEN = 'secret123';

      expect(validateToken(null)).toBe(false);
      expect(validateToken(undefined)).toBe(false);
    });

    it('should return false for invalid token', () => {
      process.env.OPENCLAW_DASHBOARD_TOKEN = 'secret123';

      expect(validateToken('wrong-token')).toBe(false);
      expect(validateToken('')).toBe(false);
    });

    it('should return true for valid token', () => {
      process.env.OPENCLAW_DASHBOARD_TOKEN = 'secret123';

      expect(validateToken('secret123')).toBe(true);
    });
  });

  describe('createUnauthorizedError', () => {
    it('should return correct error structure', () => {
      const error = createUnauthorizedError();

      expect(error.error).toBe('Authentication required');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.requiresAuth).toBe(true);
    });
  });

  describe('Constants', () => {
    it('should export correct cookie name', () => {
      expect(AUTH_COOKIE_NAME).toBe('openclaw_dashboard_auth');
    });

    it('should export correct cookie max age (7 days)', () => {
      expect(AUTH_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 7);
    });
  });
});
