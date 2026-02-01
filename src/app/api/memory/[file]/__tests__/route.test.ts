/**
 * @jest-environment node
 *
 * Tests for Memory File API Route - Read and Update
 */

// Mock fs/promises
const mockReadFile = jest.fn();
const mockStat = jest.fn();
const mockAccess = jest.fn();
const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();

jest.mock('fs/promises', () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
  stat: (...args: unknown[]) => mockStat(...args),
  access: (...args: unknown[]) => mockAccess(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
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

// Mock the parent route for sanitizePath
jest.mock('../../route', () => ({
  sanitizePath: jest.fn((path: string) => {
    // Simple mock implementation
    if (path.includes('..')) return null;
    if (!path.endsWith('.md')) return null;
    if (path === 'MEMORY.md' || path.startsWith('memory/')) return path;
    return null;
  }),
}));

// Dynamic import to ensure mocks are set up first
let GET: typeof import('../route').GET;
let PUT: typeof import('../route').PUT;

beforeAll(async () => {
  const routeModule = await import('../route');
  GET = routeModule.GET;
  PUT = routeModule.PUT;
});

// Helper to create a mock NextRequest
function createMockRequest(url: string, options: { method?: string; body?: object } = {}) {
  const { NextRequest } = require('next/server');
  const requestInit: RequestInit = {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  if (options.body) {
    requestInit.body = JSON.stringify(options.body);
  }
  return new NextRequest(url, requestInit);
}

// Helper to create route context
function createRouteContext(file: string): { params: Promise<{ file: string }> } {
  return {
    params: Promise.resolve({ file }),
  };
}

describe('/api/memory/[file]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
  });

  describe('GET - Read file', () => {
    it('should return file content for valid path', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue('# Test Content\n\nHello World');
      mockStat.mockResolvedValue({
        size: 28,
        mtime: new Date('2026-02-01T10:00:00Z'),
      });

      const request = createMockRequest('http://localhost:3000/api/memory/MEMORY.md');
      const context = createRouteContext('MEMORY.md');
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.file.name).toBe('MEMORY.md');
      expect(data.file.content).toBe('# Test Content\n\nHello World');
      expect(data.file.size).toBe(28);
    });

    it('should return 404 for non-existent file', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const request = createMockRequest('http://localhost:3000/api/memory/memory/nonexistent.md');
      const context = createRouteContext('memory/nonexistent.md');
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should reject invalid file paths', async () => {
      const request = createMockRequest('http://localhost:3000/api/memory/../../../etc/passwd');
      const context = createRouteContext('../../../etc/passwd');
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_PATH');
    });

    it('should reject non-.md files', async () => {
      const request = createMockRequest('http://localhost:3000/api/memory/script.js');
      const context = createRouteContext('script.js');
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_PATH');
    });

    it('should require authentication', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValueOnce(false);

      const request = createMockRequest('http://localhost:3000/api/memory/MEMORY.md');
      const context = createRouteContext('MEMORY.md');
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT - Update file', () => {
    it('should update file content', async () => {
      mockWriteFile.mockResolvedValue(undefined);
      mockStat.mockResolvedValue({
        size: 15,
        mtime: new Date('2026-02-01T12:00:00Z'),
      });

      const request = createMockRequest(
        'http://localhost:3000/api/memory/MEMORY.md',
        { method: 'PUT', body: { content: '# Updated Content' } }
      );
      const context = createRouteContext('MEMORY.md');
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should create directory if needed', async () => {
      mockWriteFile.mockResolvedValue(undefined);
      mockStat.mockResolvedValue({
        size: 15,
        mtime: new Date('2026-02-01T12:00:00Z'),
      });

      const request = createMockRequest(
        'http://localhost:3000/api/memory/memory/new-file.md',
        { method: 'PUT', body: { content: '# New File' } }
      );
      const context = createRouteContext('memory/new-file.md');
      const response = await PUT(request, context);

      expect(response.status).toBe(200);
      expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('should reject invalid content type', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/memory/MEMORY.md',
        { method: 'PUT', body: { content: 123 } }
      );
      const context = createRouteContext('MEMORY.md');
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_CONTENT');
    });

    it('should reject directory traversal in PUT', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/memory/../../../etc/passwd',
        { method: 'PUT', body: { content: 'malicious content' } }
      );
      const context = createRouteContext('../../../etc/passwd');
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_PATH');
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('should require authentication for PUT', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValueOnce(false);

      const request = createMockRequest(
        'http://localhost:3000/api/memory/MEMORY.md',
        { method: 'PUT', body: { content: 'test' } }
      );
      const context = createRouteContext('MEMORY.md');
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('UNAUTHORIZED');
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });
});

describe('/api/memory/[file] Configuration', () => {
  it('should export force-dynamic', async () => {
    const routeModule = await import('../route');
    expect(routeModule.dynamic).toBe('force-dynamic');
  });
});
