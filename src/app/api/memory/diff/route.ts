import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, createUnauthorizedError } from '@/lib/auth';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Memory workspace path
 */
const MEMORY_BASE_PATH = process.env.OPENCLAW_WORKSPACE_PATH ||
  path.join(process.env.HOME || '/home/user', '.openclaw', 'workspace');

interface DiffEntry {
  id: string;
  commitHash: string;
  path: string;
  timestamp: string;
  message: string;
  type: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
  diff?: string;
}

/**
 * Parse git numstat output for lines added/removed
 */
function parseNumstat(numstat: string): Map<string, { added: number; removed: number }> {
  const result = new Map<string, { added: number; removed: number }>();
  const lines = numstat.trim().split('\n').filter(Boolean);

  for (const line of lines) {
    const [added, removed, file] = line.split('\t');
    if (file && (file.endsWith('.md'))) {
      result.set(file, {
        added: parseInt(added, 10) || 0,
        removed: parseInt(removed, 10) || 0,
      });
    }
  }

  return result;
}

/**
 * GET /api/memory/diff
 * Get recent git diffs for memory files
 */
export async function GET(request: NextRequest) {
  // Check authentication
  if (!(await isAuthenticated())) {
    return NextResponse.json(createUnauthorizedError(), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const commitHash = searchParams.get('commit');

  try {
    // If specific commit requested, get detailed diff
    if (commitHash) {
      // Validate commit hash format (7-40 hex characters)
      if (!/^[a-f0-9]{7,40}$/i.test(commitHash) || commitHash.length > 40) {
        return NextResponse.json(
          { success: false, error: 'Invalid commit hash' },
          { status: 400 }
        );
      }

      const { stdout: diffOutput } = await execAsync(
        `git show --format="" ${commitHash} -- "MEMORY.md" "memory/*.md"`,
        { cwd: MEMORY_BASE_PATH, maxBuffer: 1024 * 1024 }
      );

      return NextResponse.json({
        success: true,
        commit: commitHash,
        diff: diffOutput,
      });
    }

    // Get recent commits with memory file changes
    const { stdout: logOutput } = await execAsync(
      `git log --oneline --numstat -${limit} -- "MEMORY.md" "memory/*.md"`,
      { cwd: MEMORY_BASE_PATH }
    );

    const entries: DiffEntry[] = [];
    const lines = logOutput.trim().split('\n');

    let currentCommit: { hash: string; message: string } | null = null;
    let currentStats: Map<string, { added: number; removed: number }> = new Map();

    for (const line of lines) {
      // Check if this is a commit line (starts with hash)
      const commitMatch = line.match(/^([a-f0-9]{7,}) (.+)$/);
      if (commitMatch) {
        // Process previous commit
        if (currentCommit) {
          for (const [filePath, stats] of currentStats) {
            let type: 'added' | 'modified' | 'deleted' = 'modified';
            if (stats.added > 0 && stats.removed === 0) type = 'added';
            else if (stats.removed > 0 && stats.added === 0) type = 'deleted';

            entries.push({
              id: `${currentCommit.hash}-${filePath}`,
              commitHash: currentCommit.hash,
              path: filePath,
              timestamp: '', // Will be filled later
              message: currentCommit.message,
              type,
              linesAdded: stats.added,
              linesRemoved: stats.removed,
            });
          }
        }

        currentCommit = { hash: commitMatch[1], message: commitMatch[2] };
        currentStats = new Map();
      } else {
        // Parse numstat line
        const statMatch = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
        if (statMatch && currentCommit) {
          const [, added, removed, filePath] = statMatch;
          if (filePath.endsWith('.md')) {
            currentStats.set(filePath, {
              added: added === '-' ? 0 : parseInt(added, 10),
              removed: removed === '-' ? 0 : parseInt(removed, 10),
            });
          }
        }
      }
    }

    // Process last commit
    if (currentCommit) {
      for (const [filePath, stats] of currentStats) {
        let type: 'added' | 'modified' | 'deleted' = 'modified';
        if (stats.added > 0 && stats.removed === 0) type = 'added';
        else if (stats.removed > 0 && stats.added === 0) type = 'deleted';

        entries.push({
          id: `${currentCommit.hash}-${filePath}`,
          commitHash: currentCommit.hash,
          path: filePath,
          timestamp: '',
          message: currentCommit.message,
          type,
          linesAdded: stats.added,
          linesRemoved: stats.removed,
        });
      }
    }

    // Get timestamps for commits
    if (entries.length > 0) {
      const uniqueCommits = [...new Set(entries.map(e => e.commitHash))];
      const commitHashes = uniqueCommits.join(' ');

      try {
        const { stdout: dateOutput } = await execAsync(
          `git show -s --format="%H %aI" ${commitHashes}`,
          { cwd: MEMORY_BASE_PATH }
        );

        const dateMap = new Map<string, string>();
        for (const line of dateOutput.trim().split('\n')) {
          const [hash, date] = line.split(' ');
          if (hash && date) {
            dateMap.set(hash.slice(0, 7), date);
            dateMap.set(hash, date);
          }
        }

        for (const entry of entries) {
          entry.timestamp = dateMap.get(entry.commitHash) ||
                           dateMap.get(entry.commitHash.slice(0, 7)) ||
                           new Date().toISOString();
        }
      } catch {
        // If date fetch fails, use current date
        const now = new Date().toISOString();
        for (const entry of entries) {
          entry.timestamp = now;
        }
      }
    }

    return NextResponse.json({
      success: true,
      diffs: entries,
    });
  } catch (error) {
    // Check if it's a git error (not a repo)
    if (error instanceof Error && error.message.includes('not a git repository')) {
      return NextResponse.json({
        success: true,
        diffs: [],
        warning: 'Not a git repository',
      });
    }

    console.error('Diff API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get diffs',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
