/**
 * @jest-environment node
 *
 * Tests for Memory API Route - List and Search
 */

import { sanitizePath } from '../route';

// Mock fetch before importing the route
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock fs/promises
const mockReaddir = jest.fn();
const mockReadFile = jest.fn();
const mockStat = jest.fn();
const mockAccess = jest.fn();
const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();

jest.mock('fs/promises', () => ({
  readdir: (...args: unknown[]) => mockReaddir(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  stat: (...args: unknown[]) => mockStat(...args),
  access: (...args: unknown[]) => mockAccess(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
}));

// Mock child_process exec
const mockExec = jest.fn();
jest.mock('child_process', () => ({
  exec: (...args: unknown[]) => mockExec(...args),
}));

jest.mock('util', () => ({
  promisify: (fn: unknown) => fn,
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

describe('/api/memory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizePath', () => {
    it('should accept MEMORY.md', () => {
      expect(sanitizePath('MEMORY.md')).toBe('MEMORY.md');
    });

    it('should accept files in memory/ directory', () => {
      expect(sanitizePath('memory/projects.md')).toBe('memory/projects.md');
      expect(sanitizePath('memory/daily/2026-02-01.md')).toBe('memory/daily/2026-02-01.md');
    });

    it('should reject directory traversal attempts', () => {
      expect(sanitizePath('../../../etc/passwd')).toBeNull();
      expect(sanitizePath('memory/../../../etc/passwd')).toBeNull();
      expect(sanitizePath('..\\..\\etc\\passwd')).toBeNull();
    });

    it('should reject paths with null bytes', () => {
      expect(sanitizePath('MEMORY.md\0.txt')).toBeNull();
    });

    it('should reject non-.md files', () => {
      expect(sanitizePath('MEMORY.txt')).toBeNull();
      expect(sanitizePath('memory/script.js')).toBeNull();
      expect(sanitizePath('memory/data.json')).toBeNull();
    });

    it('should reject files outside allowed paths', () => {
      expect(sanitizePath('other/file.md')).toBeNull();
      expect(sanitizePath('secrets.md')).toBeNull();
    });

    it('should handle URI encoded paths', () => {
      expect(sanitizePath('memory%2Fprojects.md')).toBe('memory/projects.md');
    });

    it('should normalize Windows-style paths', () => {
      expect(sanitizePath('memory\\projects.md')).toBe('memory/projects.md');
    });

    it('should strip leading slashes', () => {
      expect(sanitizePath('/MEMORY.md')).toBe('MEMORY.md');
      expect(sanitizePath('//memory/file.md')).toBe('memory/file.md');
    });

    it('should reject special characters', () => {
      expect(sanitizePath('memory/file<script>.md')).toBeNull();
      expect(sanitizePath('memory/file"quotes".md')).toBeNull();
    });
  });

  describe('GET - List files', () => {
    it('should return list of memory files', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockStat.mockResolvedValue({
        size: 1024,
        mtime: new Date('2026-02-01'),
        isFile: () => true,
      });
      mockReaddir.mockResolvedValue([
        { name: 'projects.md', isFile: () => true },
        { name: 'notes.md', isFile: () => true },
      ]);

      const request = createMockRequest('http://localhost:3000/api/memory');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.files).toBeDefined();
    });

    it('should handle missing MEMORY.md gracefully', async () => {
      mockAccess.mockRejectedValueOnce(new Error('ENOENT')); // MEMORY.md not found
      mockAccess.mockResolvedValueOnce(undefined); // memory/ exists
      mockReaddir.mockResolvedValue([]);

      const request = createMockRequest('http://localhost:3000/api/memory');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.files).toEqual([]);
    });

    it('should require authentication', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValueOnce(false);

      const request = createMockRequest('http://localhost:3000/api/memory');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET - Search', () => {
    it('should search across memory files', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockStat.mockResolvedValue({
        size: 100,
        mtime: new Date('2026-02-01'),
        isFile: () => true,
      });
      mockReaddir.mockResolvedValue([
        { name: 'test.md', isFile: () => true },
      ]);
      mockReadFile.mockResolvedValue('Line 1\nSearchTerm here\nLine 3');

      const request = createMockRequest('http://localhost:3000/api/memory?q=SearchTerm');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(data.query).toBe('SearchTerm');
    });

    it('should return empty results for no matches', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockStat.mockResolvedValue({
        size: 100,
        mtime: new Date('2026-02-01'),
        isFile: () => true,
      });
      mockReaddir.mockResolvedValue([]);

      const request = createMockRequest('http://localhost:3000/api/memory?q=NonExistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toEqual([]);
    });
  });
});

describe('/api/memory Configuration', () => {
  it('should export force-dynamic', async () => {
    const routeModule = await import('../route');
    expect(routeModule.dynamic).toBe('force-dynamic');
  });
});
