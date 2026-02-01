import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { decodeAndValidatePath } from '@/lib/path-security';

const execFileAsync = promisify(execFile);

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

    // SECURITY: Decode and validate the path before any operations
    const validation = decodeAndValidatePath(project);
    if (!validation.valid || !validation.resolved) {
      return NextResponse.json(
        { ok: false, error: validation.error || 'Invalid project path' },
        { status: 400 }
      );
    }

    const projectPath = validation.resolved;

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
    let killed = false;

    try {
      // SECURITY: Use execFile with array arguments to avoid shell injection
      // pgrep -f searches for pattern in full command line
      const { stdout } = await execFileAsync('pgrep', ['-f', `ralph.*${projectPath}`]);

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
      // pgrep returns non-zero exit code if no processes found, which is OK
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
