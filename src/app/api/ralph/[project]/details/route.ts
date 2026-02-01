import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  decodeAndValidatePath,
  type PathValidationResult,
} from '@/lib/path-security';
import {
  parseMission,
  parseRequirements,
  parseTestResults,
  parseCurrentActivity,
  getFilesChanged,
  type Requirement,
  type TestResults,
  type CurrentActivity,
  type FileChange,
} from '@/lib/ralph-parsers';

interface RalphDetailsResponse {
  mission: string;
  requirements: Requirement[];
  tests: TestResults;
  currentActivity: CurrentActivity;
  filesChanged: FileChange[];
  promptContent: string;
  fixPlanContent: string;
  projectPath: string;
}

/**
 * GET /api/ralph/[project]/details
 * Returns parsed data for all Ralph Monitor sections:
 * - Mission statement from PROMPT.md
 * - Requirements checklist from fix_plan.md
 * - Test results from logs
 * - Current activity from recent logs
 * - Files changed via git diff
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { project } = await params;

    // Validate and decode the project path
    const validation: PathValidationResult = decodeAndValidatePath(project);

    if (!validation.valid || !validation.resolved) {
      return NextResponse.json(
        { error: validation.error || 'Invalid project path' },
        { status: 400 }
      );
    }

    const projectPath = validation.resolved;
    const ralphDir = path.join(projectPath, '.ralph');

    // Check if .ralph directory exists
    try {
      await fs.access(ralphDir);
    } catch {
      return NextResponse.json(
        { error: 'Ralph directory not found' },
        { status: 404 }
      );
    }

    // Read PROMPT.md
    let promptContent = '';
    const promptFiles = ['PROMPT.md', 'prompt.md', 'README.md', 'TASK.md'];
    for (const promptFile of promptFiles) {
      try {
        promptContent = await fs.readFile(
          path.join(ralphDir, promptFile),
          'utf-8'
        );
        break;
      } catch {
        // Try next file
      }
    }

    // Read fix_plan.md or similar
    let fixPlanContent = '';
    const planFiles = [
      'fix_plan.md',
      'plan.md',
      'TODO.md',
      'tasks.md',
      'checklist.md',
    ];
    for (const planFile of planFiles) {
      try {
        fixPlanContent = await fs.readFile(
          path.join(ralphDir, planFile),
          'utf-8'
        );
        break;
      } catch {
        // Try next file
      }
    }

    // If no separate plan file, try to extract checklist from PROMPT.md
    if (!fixPlanContent && promptContent) {
      // Check if PROMPT.md has checkbox items
      if (/- \[[ xX~-]\]/.test(promptContent)) {
        fixPlanContent = promptContent;
      }
    }

    // Read logs for test results and current activity
    let logsContent = '';
    const logsDir = path.join(ralphDir, 'logs');
    try {
      const logFiles = await fs.readdir(logsDir);
      const sortedFiles = logFiles
        .filter((f) => f.endsWith('.log') || f.endsWith('.txt'))
        .sort()
        .reverse();

      // Read most recent log files (up to 3)
      for (const logFile of sortedFiles.slice(0, 3)) {
        try {
          const content = await fs.readFile(path.join(logsDir, logFile), 'utf-8');
          logsContent += content + '\n';
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // Try fallback log files
      const fallbackFiles = ['output.txt', 'ralph.log', 'session.log'];
      for (const fallback of fallbackFiles) {
        try {
          logsContent = await fs.readFile(
            path.join(ralphDir, fallback),
            'utf-8'
          );
          break;
        } catch {
          // Try next file
        }
      }
    }

    // Parse all content
    const mission = parseMission(promptContent);
    const requirements = parseRequirements(fixPlanContent);
    const tests = parseTestResults(logsContent);
    const currentActivity = parseCurrentActivity(logsContent);

    // Get files changed via git
    let filesChanged: FileChange[] = [];
    try {
      filesChanged = await getFilesChanged(projectPath);
    } catch (error) {
      console.error('Failed to get files changed:', error);
    }

    const response: RalphDetailsResponse = {
      mission,
      requirements,
      tests,
      currentActivity,
      filesChanged,
      promptContent,
      fixPlanContent,
      projectPath,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get Ralph details:', error);
    return NextResponse.json(
      { error: 'Failed to get project details' },
      { status: 500 }
    );
  }
}
