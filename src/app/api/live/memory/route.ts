/**
 * API Route: /api/live/memory
 * Reads memory files from OpenClaw workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(process.env.HOME || '', '.openclaw');
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, 'workspace');

interface MemoryFile {
  id: string;
  name: string;
  path: string;
  content?: string;
  size: number;
  modifiedAt: string;
}

async function findMemoryFiles(): Promise<MemoryFile[]> {
  const memoryFiles: MemoryFile[] = [];

  // Check for MEMORY.md at workspace root
  const mainMemoryPath = path.join(WORKSPACE_DIR, 'MEMORY.md');
  try {
    const stats = await fs.stat(mainMemoryPath);
    const content = await fs.readFile(mainMemoryPath, 'utf-8');
    memoryFiles.push({
      id: 'main-memory',
      name: 'MEMORY.md',
      path: 'MEMORY.md',
      content,
      size: stats.size,
      modifiedAt: stats.mtime.toISOString(),
    });
  } catch {
    // File doesn't exist
  }

  // Check for memory/ directory
  const memoryDirPath = path.join(WORKSPACE_DIR, 'memory');
  try {
    const entries = await fs.readdir(memoryDirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const filePath = path.join(memoryDirPath, entry.name);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        memoryFiles.push({
          id: `memory-${entry.name}`,
          name: entry.name,
          path: `memory/${entry.name}`,
          content,
          size: stats.size,
          modifiedAt: stats.mtime.toISOString(),
        });
      }
    }
  } catch {
    // Directory doesn't exist
  }

  // Check for .claude/memory directory (Claude Code's memory location)
  const claudeMemoryPath = path.join(process.env.HOME || '', '.claude', 'memory');
  try {
    const entries = await fs.readdir(claudeMemoryPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
        const filePath = path.join(claudeMemoryPath, entry.name);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        memoryFiles.push({
          id: `claude-memory-${entry.name}`,
          name: entry.name,
          path: `.claude/memory/${entry.name}`,
          content,
          size: stats.size,
          modifiedAt: stats.mtime.toISOString(),
        });
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return memoryFiles.sort((a, b) =>
    new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
  );
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('file');

    const memoryFiles = await findMemoryFiles();

    // If a specific file is requested
    if (fileId) {
      const file = memoryFiles.find(f => f.id === fileId);
      if (!file) {
        return NextResponse.json(
          { ok: false, error: 'File not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        ok: true,
        file,
      });
    }

    // Return all memory files (without full content for list view)
    const filesWithPreview = memoryFiles.map(f => ({
      ...f,
      content: f.content?.slice(0, 500) + (f.content && f.content.length > 500 ? '...' : ''),
    }));

    return NextResponse.json({
      ok: true,
      files: filesWithPreview,
      count: memoryFiles.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error reading memory files:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to read memory files' },
      { status: 500 }
    );
  }
}
