import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { decodeAndValidatePath } from '@/lib/path-security';

// Track running Ralph processes
const runningProcesses = new Map<string, { pid: number; startTime: string }>();

/**
 * POST /api/ralph/[project]/start
 * Starts a Ralph loop for the specified project
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

    const resolvedPath = validation.resolved;

    // Validate the project exists
    const ralphDir = path.join(resolvedPath, '.ralph');
    try {
      await fs.stat(ralphDir);
    } catch {
      return NextResponse.json(
        { error: 'Invalid project path or .ralph directory not found' },
        { status: 404 }
      );
    }

    // Check if already running
    if (runningProcesses.has(project)) {
      return NextResponse.json(
        { error: 'Ralph is already running for this project', pid: runningProcesses.get(project)?.pid },
        { status: 409 }
      );
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const maxIterations = body.maxIterations || 5;

    // Update status.json to indicate starting
    const statusPath = path.join(ralphDir, 'status.json');
    const status = {
      iteration: 0,
      maxIterations,
      status: 'running',
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
    };

    await fs.writeFile(statusPath, JSON.stringify(status, null, 2));

    // Spawn the Ralph process using safe array arguments (no shell interpolation)
    // First check if ralph command exists
    const ralphProcess = spawn('ralph', ['loop', '--max-iterations', String(maxIterations)], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: resolvedPath,
      env: { ...process.env, RALPH_PROJECT: resolvedPath },
    });

    // If ralph command doesn't exist, the process will error - that's OK

    // Store the process info
    runningProcesses.set(project, {
      pid: ralphProcess.pid || 0,
      startTime: new Date().toISOString(),
    });

    // Handle process exit
    ralphProcess.on('exit', async (code) => {
      runningProcesses.delete(project);

      // Update status based on exit code
      const finalStatus = code === 0 ? 'complete' : 'failed';
      try {
        const currentStatus = JSON.parse(await fs.readFile(statusPath, 'utf-8'));
        currentStatus.status = finalStatus;
        currentStatus.lastUpdate = new Date().toISOString();
        await fs.writeFile(statusPath, JSON.stringify(currentStatus, null, 2));
      } catch {
        // Ignore errors updating status
      }
    });

    // Log output to files
    const logsDir = path.join(ralphDir, 'logs');
    await fs.mkdir(logsDir, { recursive: true });

    const logFile = path.join(logsDir, `ralph_${Date.now()}.log`);
    const logStream = await fs.open(logFile, 'w');

    ralphProcess.stdout?.on('data', (data) => {
      fs.appendFile(logFile, data).catch(() => {});
    });

    ralphProcess.stderr?.on('data', (data) => {
      fs.appendFile(logFile, `[ERROR] ${data}`).catch(() => {});
    });

    // Unref so process can continue after response
    ralphProcess.unref();

    return NextResponse.json({
      success: true,
      pid: ralphProcess.pid,
      projectPath: resolvedPath,
      maxIterations,
      message: 'Ralph loop started',
    });
  } catch (error) {
    console.error('Failed to start Ralph:', error);
    return NextResponse.json(
      { error: 'Failed to start Ralph loop' },
      { status: 500 }
    );
  }
}

// Export running processes for the stop endpoint
export { runningProcesses };
