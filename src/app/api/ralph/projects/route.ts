import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface RalphProject {
  id: string;
  name: string;
  path: string;
  hasStatus: boolean;
  hasLogs: boolean;
  lastModified?: string;
}

/**
 * GET /api/ralph/projects
 * Scans for directories containing .ralph/ folders
 */
export async function GET() {
  try {
    const projects: RalphProject[] = [];

    // Common directories to scan for Ralph projects
    const homedir = os.homedir();
    const scanDirs = [
      path.join(homedir, '.openclaw', 'workspace'),
      path.join(homedir, 'projects'),
      path.join(homedir, 'code'),
      path.join(homedir, 'dev'),
      process.cwd(),
    ];

    for (const scanDir of scanDirs) {
      try {
        const stat = await fs.stat(scanDir);
        if (!stat.isDirectory()) continue;

        const entries = await fs.readdir(scanDir, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isDirectory()) continue;

          const projectPath = path.join(scanDir, entry.name);
          const ralphDir = path.join(projectPath, '.ralph');

          try {
            const ralphStat = await fs.stat(ralphDir);
            if (ralphStat.isDirectory()) {
              // Check for status.json and logs
              const statusPath = path.join(ralphDir, 'status.json');
              const logsDir = path.join(ralphDir, 'logs');

              let hasStatus = false;
              let hasLogs = false;
              let lastModified: string | undefined;

              try {
                const statusStat = await fs.stat(statusPath);
                hasStatus = true;
                lastModified = statusStat.mtime.toISOString();
              } catch {
                // status.json doesn't exist
              }

              try {
                await fs.stat(logsDir);
                hasLogs = true;
              } catch {
                // logs dir doesn't exist
              }

              projects.push({
                id: Buffer.from(projectPath).toString('base64url'),
                name: entry.name,
                path: projectPath,
                hasStatus,
                hasLogs,
                lastModified,
              });
            }
          } catch {
            // .ralph doesn't exist in this directory
          }
        }
      } catch {
        // Scan directory doesn't exist or isn't accessible
      }
    }

    // Remove duplicates by path
    const uniqueProjects = projects.filter(
      (project, index, self) =>
        index === self.findIndex((p) => p.path === project.path)
    );

    return NextResponse.json({ projects: uniqueProjects });
  } catch (error) {
    console.error('Failed to scan for Ralph projects:', error);
    return NextResponse.json(
      { error: 'Failed to scan for projects' },
      { status: 500 }
    );
  }
}
