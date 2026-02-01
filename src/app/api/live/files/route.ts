/**
 * API Route: /api/live/files
 * Lists files from OpenClaw workspace directory
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(process.env.HOME || '', '.openclaw');
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, 'workspace');

interface FileInfo {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: string;
  extension?: string;
  children?: FileInfo[];
}

async function listDirectory(dirPath: string, depth = 0, maxDepth = 3): Promise<FileInfo[]> {
  if (depth > maxDepth) return [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files: FileInfo[] = [];

    for (const entry of entries) {
      // Skip hidden files and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(WORKSPACE_DIR, fullPath);
      const id = relativePath.replace(/[\/\\]/g, '-') || entry.name;

      try {
        const stats = await fs.stat(fullPath);
        const extension = entry.isFile() ? path.extname(entry.name).slice(1) : undefined;

        const fileInfo: FileInfo = {
          id,
          name: entry.name,
          path: relativePath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: entry.isFile() ? stats.size : undefined,
          modifiedAt: stats.mtime.toISOString(),
          extension,
        };

        if (entry.isDirectory() && depth < maxDepth) {
          fileInfo.children = await listDirectory(fullPath, depth + 1, maxDepth);
        }

        files.push(fileInfo);
      } catch {
        // Skip files we can't stat
      }
    }

    // Sort: directories first, then alphabetically
    return files.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error listing directory:', dirPath, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subPath = searchParams.get('path') || '';
    const depthStr = searchParams.get('depth');
    const depth = depthStr ? parseInt(depthStr, 10) : 2;

    const targetDir = path.join(WORKSPACE_DIR, subPath);

    // Ensure we don't escape the workspace
    const resolved = path.resolve(targetDir);
    if (!resolved.startsWith(WORKSPACE_DIR)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Check if directory exists
    try {
      await fs.access(targetDir);
    } catch {
      return NextResponse.json({
        ok: true,
        files: [],
        path: subPath,
        message: 'Directory not found',
      });
    }

    const files = await listDirectory(targetDir, 0, depth);

    return NextResponse.json({
      ok: true,
      files,
      path: subPath,
      rootPath: WORKSPACE_DIR,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in files API:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
