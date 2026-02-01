import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * POST /api/ralph/[project]/stop
 * Stops a running Ralph loop for the specified project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { project } = await params;

    // Decode the project path from base64url
    const projectPath = Buffer.from(project, 'base64url').toString('utf-8');

    // Validate the project exists
    const ralphDir = path.join(projectPath, '.ralph');
    try {
      await fs.stat(ralphDir);
    } catch {
      return NextResponse.json(
        { error: 'Invalid project path or .ralph directory not found' },
        { status: 404 }
      );
    }

    // Read current status
    const statusPath = path.join(ralphDir, 'status.json');
    let currentStatus: Record<string, unknown> = {};

    try {
      currentStatus = JSON.parse(await fs.readFile(statusPath, 'utf-8'));
    } catch {
      return NextResponse.json(
        { error: 'No status file found - Ralph may not be running' },
        { status: 404 }
      );
    }

    // Check if Ralph is actually running
    if (currentStatus.status !== 'running') {
      return NextResponse.json(
        { error: 'Ralph is not currently running', status: currentStatus.status },
        { status: 400 }
      );
    }

    // Try to find and kill the Ralph process
    // Look for ralph processes in the project directory
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    let killed = false;

    try {
      // Find processes running in the project directory
      const { stdout } = await execAsync(
        `pgrep -f "ralph.*${projectPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" || true`
      );

      const pids = stdout.trim().split('\n').filter(Boolean);

      for (const pid of pids) {
        try {
          process.kill(parseInt(pid, 10), 'SIGTERM');
          killed = true;
        } catch {
          // Process might already be dead
        }
      }
    } catch {
      // pgrep might fail if no processes found
    }

    // Update status to stopped/failed
    currentStatus.status = 'failed';
    currentStatus.lastUpdate = new Date().toISOString();
    currentStatus.error = 'Stopped by user';

    await fs.writeFile(statusPath, JSON.stringify(currentStatus, null, 2));

    // Log the stop event
    const logsDir = path.join(ralphDir, 'logs');
    try {
      await fs.mkdir(logsDir, { recursive: true });
      const logEntry = `[${new Date().toISOString()}] [INFO] Ralph loop stopped by user\n`;
      const logFiles = await fs.readdir(logsDir);
      const latestLog = logFiles
        .filter((f) => f.endsWith('.log'))
        .sort()
        .reverse()[0];

      if (latestLog) {
        await fs.appendFile(path.join(logsDir, latestLog), logEntry);
      }
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json({
      success: true,
      killed,
      projectPath,
      message: 'Ralph loop stopped',
    });
  } catch (error) {
    console.error('Failed to stop Ralph:', error);
    return NextResponse.json(
      { error: 'Failed to stop Ralph loop' },
      { status: 500 }
    );
  }
}
