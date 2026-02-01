/**
 * @jest-environment node
 *
 * Tests for Login API Route
 */

// Mock cookies before importing
const mockCookieGet = jest.fn();
const mockCookieSet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: mockCookieGet,
    set: mockCookieSet,
  }),
}));

// Dynamic import to ensure mocks are set up first
let POST: typeof import('../route').POST;
let GET: typeof import('../route').GET;

beforeAll(async () => {
  const routeModule = await import('../route');
  POST = routeModule.POST;
  GET = routeModule.GET;
});

// Helper to create a mock NextRequest
function createMockRequest(body?: object) {
  const { NextRequest } = require('next/server');
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: body ? 'POST' : 'GET',
    ...(body && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
}

describe('/api/auth/login', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('POST - Login', () => {
    describe('When auth is not required', () => {
      beforeEach(() => {
        delete process.env.OPENCLAW_DASHBOARD_TOKEN;
      });

      it('should return success without requiring token', async () => {
        const routeModule = await import('../route');
        const request = createMockRequest({ token: 'anything' });
        const response = await routeModule.POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.authRequired).toBe(false);
      });
    });

    describe('When auth is required', () => {
      beforeEach(() => {
        process.env.OPENCLAW_DASHBOARD_TOKEN = 'secret-token-123';
      });

      it('should require token in request body', async () => {
        jest.resetModules();
        const routeModule = await import('../route');
        const request = createMockRequest({});
        const response = await routeModule.POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Token is required');
      });

      it('should reject invalid token', async () => {
        jest.resetModules();
        const routeModule = await import('../route');
        const request = createMockRequest({ token: 'wrong-token' });
        const response = await routeModule.POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Invalid token');
      });

      it('should accept valid token and set cookie', async () => {
        jest.resetModules();
        const routeModule = await import('../route');
        const request = createMockRequest({ token: 'secret-token-123' });
        const response = await routeModule.POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('Logged in');
        expect(mockCookieSet).toHaveBeenCalledWith(
          'openclaw_dashboard_auth',
          'secret-token-123',
          expect.objectContaining({
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
          })
        );
      });
    });
  });

  describe('GET - Check Auth Status', () => {
    describe('When auth is not required', () => {
      beforeEach(() => {
        delete process.env.OPENCLAW_DASHBOARD_TOKEN;
      });

      it('should return authenticated without auth cookie', async () => {
        jest.resetModules();
        const routeModule = await import('../route');
        const response = await routeModule.GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.authenticated).toBe(true);
        expect(data.authRequired).toBe(false);
      });
    });

    describe('When auth is required', () => {
      beforeEach(() => {
        process.env.OPENCLAW_DASHBOARD_TOKEN = 'secret-token-123';
      });

      it('should return not authenticated without cookie', async () => {
        mockCookieGet.mockReturnValue(undefined);

        jest.resetModules();
        const routeModule = await import('../route');
        const response = await routeModule.GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.authenticated).toBe(false);
        expect(data.authRequired).toBe(true);
      });

      it('should return not authenticated with invalid cookie', async () => {
        mockCookieGet.mockReturnValue({ value: 'wrong-token' });

        jest.resetModules();
        const routeModule = await import('../route');
        const response = await routeModule.GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.authenticated).toBe(false);
        expect(data.authRequired).toBe(true);
      });

      it('should return authenticated with valid cookie', async () => {
        mockCookieGet.mockReturnValue({ value: 'secret-token-123' });

        jest.resetModules();
        const routeModule = await import('../route');
        const response = await routeModule.GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.authenticated).toBe(true);
        expect(data.authRequired).toBe(true);
      });
    });
  });
});
