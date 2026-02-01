import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export interface RalphLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  iteration?: number;
}

/**
 * GET /api/ralph/[project]/logs
 * Reads log files from a Ralph project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { project } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const tail = searchParams.get('tail') === 'true';

    // Decode the project path from base64url
    const projectPath = Buffer.from(project, 'base64url').toString('utf-8');

    // Look for log files
    const ralphDir = path.join(projectPath, '.ralph');
    const logsDir = path.join(ralphDir, 'logs');

    const logs: RalphLogEntry[] = [];

    // Try to read from logs directory
    try {
      const logFiles = await fs.readdir(logsDir);
      const sortedFiles = logFiles
        .filter((f) => f.endsWith('.log') || f.endsWith('.txt'))
        .sort()
        .reverse();

      for (const logFile of sortedFiles.slice(0, 5)) {
        const content = await fs.readFile(path.join(logsDir, logFile), 'utf-8');
        const lines = content.split('\n').filter((l) => l.trim());

        for (const line of lines) {
          // Try to parse structured log lines
          const match = line.match(
            /^\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^\]]*)\]\s*\[?(\w+)\]?\s*(.+)$/
          );

          if (match) {
            logs.push({
              timestamp: match[1],
              level: (match[2].toLowerCase() as RalphLogEntry['level']) || 'info',
              message: match[3],
            });
          } else {
            // Plain text line
            logs.push({
              timestamp: new Date().toISOString(),
              level: 'info',
              message: line,
            });
          }
        }
      }
    } catch {
      // No logs directory, try reading output.txt or similar
      const fallbackFiles = ['output.txt', 'ralph.log', 'session.log'];

      for (const fallback of fallbackFiles) {
        try {
          const content = await fs.readFile(
            path.join(ralphDir, fallback),
            'utf-8'
          );
          const lines = content.split('\n').filter((l) => l.trim());

          for (const line of lines) {
            logs.push({
              timestamp: new Date().toISOString(),
              level: 'info',
              message: line,
            });
          }
          break;
        } catch {
          // File doesn't exist
        }
      }
    }

    // Apply limit and tail
    let resultLogs = logs;
    if (tail) {
      resultLogs = logs.slice(-limit);
    } else {
      resultLogs = logs.slice(0, limit);
    }

    return NextResponse.json({
      logs: resultLogs,
      total: logs.length,
      projectPath,
    });
  } catch (error) {
    console.error('Failed to read Ralph logs:', error);
    return NextResponse.json(
      { error: 'Failed to read logs', logs: [] },
      { status: 500 }
    );
  }
}
