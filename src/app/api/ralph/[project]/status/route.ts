import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export interface RalphStatus {
  iteration: number;
  maxIterations: number;
  status: 'idle' | 'running' | 'complete' | 'failed' | 'paused';
  startTime?: string;
  lastUpdate?: string;
  currentTask?: string;
  completedTasks?: number;
  totalTasks?: number;
  error?: string;
}

/**
 * GET /api/ralph/[project]/status
 * Reads the status.json from a Ralph project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { project } = await params;

    // Decode the project path from base64url
    const projectPath = Buffer.from(project, 'base64url').toString('utf-8');

    // Validate the path exists
    const ralphDir = path.join(projectPath, '.ralph');
    const statusPath = path.join(ralphDir, 'status.json');

    try {
      const statusContent = await fs.readFile(statusPath, 'utf-8');
      const status = JSON.parse(statusContent) as RalphStatus;

      // Get last modified time
      const stat = await fs.stat(statusPath);

      return NextResponse.json({
        ...status,
        lastUpdate: stat.mtime.toISOString(),
        projectPath,
      });
    } catch (err) {
      // If status.json doesn't exist, return default idle status
      return NextResponse.json({
        iteration: 0,
        maxIterations: 5,
        status: 'idle',
        projectPath,
      });
    }
  } catch (error) {
    console.error('Failed to read Ralph status:', error);
    return NextResponse.json(
      { error: 'Failed to read status' },
      { status: 500 }
    );
  }
}
