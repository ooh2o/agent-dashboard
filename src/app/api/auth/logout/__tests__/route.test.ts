/**
 * @jest-environment node
 *
 * Tests for Logout API Route
 */

// Mock cookies before importing
const mockCookieSet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    set: mockCookieSet,
  }),
}));

describe('/api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - Logout', () => {
    it('should clear auth cookie and return success', async () => {
      // Dynamic import to ensure mocks are set up
      const { POST } = await import('../route');

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Logged out');

      expect(mockCookieSet).toHaveBeenCalledWith(
        'openclaw_dashboard_auth',
        '',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 0,
          path: '/',
        })
      );
    });
  });
});
