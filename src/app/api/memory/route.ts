import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, createUnauthorizedError } from '@/lib/auth';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Memory workspace path - defaults to ~/.openclaw/workspace
 * In production, this should be configurable via environment variable
 */
const MEMORY_BASE_PATH = process.env.OPENCLAW_WORKSPACE_PATH ||
  path.join(process.env.HOME || '/home/user', '.openclaw', 'workspace');

/**
 * Allowed memory file patterns
 */
const MEMORY_PATTERNS = {
  root: 'MEMORY.md',
  memoryDir: 'memory',
};

/**
 * Sanitize and validate a file path to prevent directory traversal
 */
export function sanitizePath(filePath: string): string | null {
  // Remove any leading slashes
  let cleaned = filePath.replace(/^\/+/, '');

  // Decode URI components
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    return null;
  }

  // Check for directory traversal patterns
  if (cleaned.includes('..') ||
      cleaned.includes('\0') ||
      /[<>:"|?*]/.test(cleaned)) {
    return null;
  }

  // Only allow .md files
  if (!cleaned.endsWith('.md')) {
    return null;
  }

  // Validate the path is within allowed locations
  const isRootMemory = cleaned === MEMORY_PATTERNS.root;
  const isInMemoryDir = cleaned.startsWith(`${MEMORY_PATTERNS.memoryDir}/`) ||
                         cleaned.startsWith(`${MEMORY_PATTERNS.memoryDir}\\`);

  if (!isRootMemory && !isInMemoryDir) {
    return null;
  }

  // Normalize path separators
  cleaned = cleaned.replace(/\\/g, '/');

  return cleaned;
}

/**
 * Get full path for a memory file
 */
function getFullPath(sanitizedPath: string): string {
  return path.join(MEMORY_BASE_PATH, sanitizedPath);
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all memory files
 */
async function listMemoryFiles(): Promise<Array<{
  name: string;
  path: string;
  size: number;
  lastModified: string;
  type: 'memory' | 'daily' | 'notes';
}>> {
  const files: Array<{
    name: string;
    path: string;
    size: number;
    lastModified: string;
    type: 'memory' | 'daily' | 'notes';
  }> = [];

  // Check for root MEMORY.md
  const rootMemoryPath = getFullPath(MEMORY_PATTERNS.root);
  if (await fileExists(rootMemoryPath)) {
    const stat = await fs.stat(rootMemoryPath);
    files.push({
      name: 'MEMORY.md',
      path: 'MEMORY.md',
      size: stat.size,
      lastModified: stat.mtime.toISOString(),
      type: 'memory',
    });
  }

  // List files in memory/ directory
  const memoryDirPath = path.join(MEMORY_BASE_PATH, MEMORY_PATTERNS.memoryDir);
  if (await fileExists(memoryDirPath)) {
    const entries = await fs.readdir(memoryDirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const filePath = path.join(memoryDirPath, entry.name);
        const stat = await fs.stat(filePath);
        const relativePath = `${MEMORY_PATTERNS.memoryDir}/${entry.name}`;

        // Determine type based on filename
        let type: 'memory' | 'daily' | 'notes' = 'notes';
        if (/^\d{4}-\d{2}-\d{2}\.md$/.test(entry.name)) {
          type = 'daily';
        }

        files.push({
          name: entry.name,
          path: relativePath,
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
          type,
        });
      }
    }
  }

  // Sort by lastModified descending
  files.sort((a, b) =>
    new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  return files;
}

/**
 * Search across all memory files
 */
async function searchMemory(query: string): Promise<Array<{
  file: string;
  path: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}>> {
  const results: Array<{
    file: string;
    path: string;
    lineNumber: number;
    lineContent: string;
    matchStart: number;
    matchEnd: number;
  }> = [];

  const files = await listMemoryFiles();
  const queryLower = query.toLowerCase();

  for (const file of files) {
    try {
      const fullPath = getFullPath(file.path);
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const lineLower = line.toLowerCase();
        const matchIndex = lineLower.indexOf(queryLower);

        if (matchIndex !== -1) {
          results.push({
            file: file.name,
            path: file.path,
            lineNumber: index + 1,
            lineContent: line,
            matchStart: matchIndex,
            matchEnd: matchIndex + query.length,
          });
        }
      });
    } catch {
      // Skip files that can't be read
    }
  }

  // Limit results
  return results.slice(0, 100);
}

/**
 * Get recent diffs for memory files using git
 */
async function getMemoryDiffs(): Promise<Array<{
  id: string;
  path: string;
  timestamp: string;
  type: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
  diff: string;
}>> {
  const diffs: Array<{
    id: string;
    path: string;
    timestamp: string;
    type: 'added' | 'modified' | 'deleted';
    linesAdded: number;
    linesRemoved: number;
    diff: string;
  }> = [];

  try {
    // Get recent git log for memory files
    const { stdout: logOutput } = await execAsync(
      `git log --oneline -20 --diff-filter=ADM -- "MEMORY.md" "memory/*.md"`,
      { cwd: MEMORY_BASE_PATH }
    );

    const commits = logOutput.trim().split('\n').filter(Boolean);

    for (const commit of commits.slice(0, 10)) {
      const [hash] = commit.split(' ');
      if (!hash) continue;

      try {
        // Get diff for this commit
        const { stdout: diffOutput } = await execAsync(
          `git show --stat --format="%aI" ${hash} -- "MEMORY.md" "memory/*.md"`,
          { cwd: MEMORY_BASE_PATH }
        );

        const lines = diffOutput.trim().split('\n');
        const timestamp = lines[0] || new Date().toISOString();

        // Parse stat lines for each file
        for (const line of lines.slice(1)) {
          const statMatch = line.match(/^\s*([^\s|]+)\s*\|\s*(\d+)\s*([+-]*)/);
          if (statMatch) {
            const [, filePath, , changes] = statMatch;
            const addCount = (changes?.match(/\+/g) || []).length;
            const removeCount = (changes?.match(/-/g) || []).length;

            // Determine type
            let type: 'added' | 'modified' | 'deleted' = 'modified';
            if (addCount > 0 && removeCount === 0) type = 'added';
            else if (removeCount > 0 && addCount === 0) type = 'deleted';

            diffs.push({
              id: `${hash}-${filePath}`,
              path: filePath,
              timestamp,
              type,
              linesAdded: addCount || parseInt(statMatch[2] || '0', 10),
              linesRemoved: removeCount,
              diff: line,
            });
          }
        }
      } catch {
        // Skip commits that can't be parsed
      }
    }
  } catch {
    // Git not available or not a git repo - return empty
  }

  return diffs;
}

/**
 * GET /api/memory
 * List all memory files or search with ?q=query
 * Also supports ?diff=true for getting recent diffs
 */
export async function GET(request: NextRequest) {
  // Check authentication
  if (!(await isAuthenticated())) {
    return NextResponse.json(createUnauthorizedError(), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const getDiffs = searchParams.get('diff') === 'true';

  try {
    if (query) {
      // Search mode
      const results = await searchMemory(query);
      return NextResponse.json({
        success: true,
        results,
        query,
      });
    }

    if (getDiffs) {
      // Diff mode
      const diffs = await getMemoryDiffs();
      return NextResponse.json({
        success: true,
        diffs,
      });
    }

    // List mode
    const files = await listMemoryFiles();
    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to access memory files',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
