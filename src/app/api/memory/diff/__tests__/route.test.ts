/**
 * @jest-environment node
 *
 * Tests for Memory Diff API Route
 */

// Mock child_process
const mockExecAsync = jest.fn();

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('util', () => ({
  promisify: () => mockExecAsync,
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  isAuthenticated: jest.fn().mockResolvedValue(true),
  createUnauthorizedError: jest.fn().mockReturnValue({
    error: 'Authentication required',
    code: 'UNAUTHORIZED',
    requiresAuth: true,
  }),
}));

// Dynamic import to ensure mocks are set up first
let GET: typeof import('../route').GET;

beforeAll(async () => {
  const routeModule = await import('../route');
  GET = routeModule.GET;
});

// Helper to create a mock NextRequest
function createMockRequest(url: string) {
  const { NextRequest } = require('next/server');
  return new NextRequest(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/memory/diff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET - List diffs', () => {
    it('should return recent diffs from git log', async () => {
      // Mock git log output
      mockExecAsync
        .mockResolvedValueOnce({
          stdout: `abc1234 feat: Update memory file
5\t2\tMEMORY.md
def5678 feat: Add new daily note
10\t0\tmemory/2026-02-01.md`,
        })
        .mockResolvedValueOnce({
          stdout: `abc1234567890abcdef 2026-02-01T10:00:00Z
def5678901234567890 2026-02-01T09:00:00Z`,
        });

      const request = createMockRequest('http://localhost:3000/api/memory/diff');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.diffs).toBeDefined();
    });

    it('should handle git not available gracefully', async () => {
      mockExecAsync.mockRejectedValue(new Error('git command not found'));

      const request = createMockRequest('http://localhost:3000/api/memory/diff');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle not a git repository', async () => {
      mockExecAsync.mockRejectedValue(new Error('fatal: not a git repository'));

      const request = createMockRequest('http://localhost:3000/api/memory/diff');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.diffs).toEqual([]);
      expect(data.warning).toBe('Not a git repository');
    });

    it('should support limit parameter', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '' });

      const request = createMockRequest('http://localhost:3000/api/memory/diff?limit=5');
      await GET(request);

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('-5'),
        expect.any(Object)
      );
    });

    it('should require authentication', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValueOnce(false);

      const request = createMockRequest('http://localhost:3000/api/memory/diff');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET - Specific commit diff', () => {
    it('should return diff for specific commit', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: `diff --git a/MEMORY.md b/MEMORY.md
--- a/MEMORY.md
+++ b/MEMORY.md
@@ -1,3 +1,4 @@
 # Memory
+New line`,
      });

      const request = createMockRequest('http://localhost:3000/api/memory/diff?commit=abc1234');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.commit).toBe('abc1234');
      expect(data.diff).toBeDefined();
    });

    it('should reject invalid commit hash', async () => {
      const request = createMockRequest('http://localhost:3000/api/memory/diff?commit=invalid!hash');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid commit hash');
    });

    it('should accept short commit hash', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'diff output' });

      const request = createMockRequest('http://localhost:3000/api/memory/diff?commit=abc1234');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should accept full commit hash (40 chars)', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'diff output' });

      // Valid 40-character hex commit hash
      const request = createMockRequest(
        'http://localhost:3000/api/memory/diff?commit=abc1234567890abcdef1234567890abcdef1234'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});

describe('/api/memory/diff Configuration', () => {
  it('should export force-dynamic', async () => {
    const routeModule = await import('../route');
    expect(routeModule.dynamic).toBe('force-dynamic');
  });
});
