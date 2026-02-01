import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

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

    // Spawn the Ralph process
    // In a real implementation, this would call the actual ralph command
    // For now, we'll simulate by writing to the status file
    const ralphProcess = spawn('bash', ['-c', `
      cd "${projectPath}" &&
      if command -v ralph &> /dev/null; then
        ralph loop --max-iterations ${maxIterations}
      else
        echo "Ralph command not found, simulating..."
        for i in $(seq 1 ${maxIterations}); do
          echo '{"iteration": '$i', "maxIterations": ${maxIterations}, "status": "running", "lastUpdate": "'$(date -Iseconds)'"}' > "${ralphDir}/status.json"
          sleep 5
        done
        echo '{"iteration": ${maxIterations}, "maxIterations": ${maxIterations}, "status": "complete", "lastUpdate": "'$(date -Iseconds)'"}' > "${ralphDir}/status.json"
      fi
    `], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: projectPath,
    });

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
      projectPath,
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
