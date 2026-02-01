import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, createUnauthorizedError } from '@/lib/auth';
import * as fs from 'fs/promises';
import * as path from 'path';
import { sanitizePath } from '../route';

/**
 * Memory workspace path
 */
const MEMORY_BASE_PATH = process.env.OPENCLAW_WORKSPACE_PATH ||
  path.join(process.env.HOME || '/home/user', '.openclaw', 'workspace');

type RouteContext = {
  params: Promise<{ file: string }>;
};

/**
 * GET /api/memory/[file]
 * Read a specific memory file's content
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  // Check authentication
  if (!(await isAuthenticated())) {
    return NextResponse.json(createUnauthorizedError(), { status: 401 });
  }

  const { file } = await context.params;

  // Sanitize the file path
  const sanitizedPath = sanitizePath(file);
  if (!sanitizedPath) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid file path',
        code: 'INVALID_PATH',
      },
      { status: 400 }
    );
  }

  try {
    const fullPath = path.join(MEMORY_BASE_PATH, sanitizedPath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Read file
    const content = await fs.readFile(fullPath, 'utf-8');
    const stat = await fs.stat(fullPath);

    return NextResponse.json({
      success: true,
      file: {
        name: path.basename(sanitizedPath),
        path: sanitizedPath,
        content,
        size: stat.size,
        lastModified: stat.mtime.toISOString(),
      },
    });
  } catch (error) {
    console.error('Memory read error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/memory/[file]
 * Update a memory file's content
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  // Check authentication
  if (!(await isAuthenticated())) {
    return NextResponse.json(createUnauthorizedError(), { status: 401 });
  }

  const { file } = await context.params;

  // Sanitize the file path
  const sanitizedPath = sanitizePath(file);
  if (!sanitizedPath) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid file path',
        code: 'INVALID_PATH',
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { content } = body;

    if (typeof content !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Content must be a string',
          code: 'INVALID_CONTENT',
        },
        { status: 400 }
      );
    }

    const fullPath = path.join(MEMORY_BASE_PATH, sanitizedPath);

    // Ensure directory exists (for new files in memory/)
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');

    // Get updated stat
    const stat = await fs.stat(fullPath);

    return NextResponse.json({
      success: true,
      file: {
        name: path.basename(sanitizedPath),
        path: sanitizedPath,
        size: stat.size,
        lastModified: stat.mtime.toISOString(),
      },
    });
  } catch (error) {
    console.error('Memory write error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
