/**
 * API Route: /api/live/files/content
 * Returns content of a file from OpenClaw workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(process.env.HOME || '', '.openclaw');
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, 'workspace');

// Max file size to read (1MB)
const MAX_FILE_SIZE = 1024 * 1024;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { ok: false, error: 'Path parameter required' },
        { status: 400 }
      );
    }

    const targetPath = path.join(WORKSPACE_DIR, filePath);

    // Security: Ensure we don't escape the workspace
    const resolved = path.resolve(targetPath);
    if (!resolved.startsWith(WORKSPACE_DIR)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Check file exists and get stats
    const stats = await fs.stat(targetPath);
    
    if (stats.isDirectory()) {
      return NextResponse.json(
        { ok: false, error: 'Cannot read directory content' },
        { status: 400 }
      );
    }

    if (stats.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        ok: true,
        content: `[File too large: ${Math.round(stats.size / 1024)}KB. Max: ${MAX_FILE_SIZE / 1024}KB]`,
        truncated: true,
        size: stats.size,
      });
    }

    // Determine if file is text-based
    const ext = path.extname(filePath).toLowerCase();
    const textExtensions = [
      '.md', '.txt', '.json', '.js', '.ts', '.tsx', '.jsx',
      '.css', '.scss', '.html', '.xml', '.yaml', '.yml',
      '.sh', '.bash', '.zsh', '.py', '.rb', '.go', '.rs',
      '.env', '.gitignore', '.eslintrc', '.prettierrc'
    ];

    if (!textExtensions.includes(ext) && ext !== '') {
      return NextResponse.json({
        ok: true,
        content: `[Binary file: ${ext || 'unknown type'}]`,
        binary: true,
        size: stats.size,
      });
    }

    const content = await fs.readFile(targetPath, 'utf-8');

    return NextResponse.json({
      ok: true,
      content: content.slice(0, 50000), // Limit to 50KB of text
      truncated: content.length > 50000,
      size: stats.size,
      path: filePath,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { ok: false, error: 'File not found' },
        { status: 404 }
      );
    }
    console.error('Error reading file:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to read file' },
      { status: 500 }
    );
  }
}
