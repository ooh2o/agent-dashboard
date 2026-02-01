/**
 * Ralph Parsers - Utilities for parsing Ralph project files
 *
 * These utilities extract user-friendly information from:
 * - PROMPT.md (mission statement)
 * - fix_plan.md (requirements/checklist)
 * - Log files (test results, current activity)
 * - Git diff (files changed)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// Types
// ============================================================================

export interface Requirement {
  text: string;
  done: boolean;
  inProgress?: boolean;
}

export interface TestGroup {
  name: string;
  passed: number;
  total: number;
  failed: number;
}

export interface TestResults {
  total: number;
  passed: number;
  failed: number;
  groups: TestGroup[];
}

export interface CurrentActivity {
  human: string;
  technical: string;
}

export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  description: string;
}

export interface RalphDetails {
  mission: string;
  requirements: Requirement[];
  tests: TestResults;
  currentActivity: CurrentActivity;
  filesChanged: FileChange[];
  promptContent: string;
  fixPlanContent: string;
}

// ============================================================================
// Mission Parser
// ============================================================================

/**
 * Parse PROMPT.md to extract the mission statement
 * Looks for:
 * 1. First paragraph after first H1
 * 2. Content under "## Mission" or "## Goal" heading
 * 3. First non-header paragraph
 */
export function parseMission(content: string): string {
  if (!content || content.trim() === '') {
    return 'No mission defined';
  }

  const lines = content.split('\n');
  const paragraphs: string[] = [];
  let currentParagraph = '';
  let afterFirstH1 = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for Mission/Goal/Objective section headers
    if (/^##?\s*(Mission|Goal|Objective|Task|Purpose)/i.test(trimmed)) {
      // Return the content following this header
      const idx = lines.indexOf(line);
      const afterHeader = lines.slice(idx + 1);
      const sectionContent: string[] = [];

      for (const afterLine of afterHeader) {
        const afterTrimmed = afterLine.trim();
        // Stop at next header
        if (/^#/.test(afterTrimmed)) break;
        if (afterTrimmed) {
          sectionContent.push(afterTrimmed);
        }
      }

      if (sectionContent.length > 0) {
        return sectionContent.slice(0, 3).join(' ').slice(0, 300);
      }
    }

    // Track if we've passed the first H1
    if (/^#\s/.test(trimmed) && !afterFirstH1) {
      afterFirstH1 = true;
      continue;
    }

    // Skip headers
    if (/^#/.test(trimmed)) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
      continue;
    }

    // Skip empty lines (end paragraph)
    if (!trimmed) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
      continue;
    }

    // Skip code blocks, lists, and metadata
    if (
      /^```/.test(trimmed) ||
      /^[-*]\s/.test(trimmed) ||
      /^\d+\.\s/.test(trimmed) ||
      /^>/.test(trimmed)
    ) {
      continue;
    }

    // Accumulate paragraph text
    currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
  }

  // Don't forget last paragraph
  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim());
  }

  // Return first meaningful paragraph (at least 20 chars)
  for (const p of paragraphs) {
    if (p.length >= 20 && !/^(Note:|Warning:|TODO:)/i.test(p)) {
      return p.slice(0, 300);
    }
  }

  // Fallback: return first paragraph even if short
  return paragraphs[0]?.slice(0, 300) || 'No mission defined';
}

// ============================================================================
// Requirements Parser
// ============================================================================

/**
 * Parse fix_plan.md or similar files for checkbox items
 * Looks for:
 * - [ ] unchecked items
 * - [x] checked items
 * - [~] or [-] in-progress items
 */
export function parseRequirements(content: string): Requirement[] {
  if (!content || content.trim() === '') {
    return [];
  }

  const requirements: Requirement[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Match checkbox patterns: - [ ], * [ ], - [x], - [~], etc.
    const checkboxMatch = trimmed.match(/^[-*]\s*\[([ xX~-])\]\s+(.+)$/);

    if (checkboxMatch) {
      const checkChar = checkboxMatch[1].toLowerCase();
      const text = checkboxMatch[2].trim();

      requirements.push({
        text,
        done: checkChar === 'x',
        inProgress: checkChar === '~' || checkChar === '-',
      });
    }
  }

  return requirements;
}

// ============================================================================
// Test Results Parser
// ============================================================================

/**
 * Parse log output for test results
 * Supports patterns from:
 * - Jest: "Tests: X passed, Y failed, Z total"
 * - Vitest: "✓ passed", "✗ failed"
 * - Generic: "X tests passed"
 */
export function parseTestResults(logs: string): TestResults {
  const result: TestResults = {
    total: 0,
    passed: 0,
    failed: 0,
    groups: [],
  };

  if (!logs) return result;

  // Jest summary pattern: "Tests: X passed, Y total"
  const jestSummary = logs.match(
    /Tests?:\s*(\d+)\s*passed(?:,\s*(\d+)\s*failed)?(?:,\s*(\d+)\s*total)?/i
  );
  if (jestSummary) {
    result.passed = parseInt(jestSummary[1]) || 0;
    result.failed = parseInt(jestSummary[2]) || 0;
    result.total = parseInt(jestSummary[3]) || result.passed + result.failed;
  }

  // Alternative: "X passing", "Y failing"
  const mochaPass = logs.match(/(\d+)\s+passing/i);
  const mochaFail = logs.match(/(\d+)\s+failing/i);
  if (mochaPass) {
    result.passed = Math.max(result.passed, parseInt(mochaPass[1]));
  }
  if (mochaFail) {
    result.failed = Math.max(result.failed, parseInt(mochaFail[1]));
  }

  // Count individual test markers
  const passMarkers = (logs.match(/[✓✔√]\s+/g) || []).length;
  const failMarkers = (logs.match(/[✗✘×]\s+/g) || []).length;

  if (result.passed === 0 && passMarkers > 0) {
    result.passed = passMarkers;
  }
  if (result.failed === 0 && failMarkers > 0) {
    result.failed = failMarkers;
  }

  // Update total
  if (result.total === 0) {
    result.total = result.passed + result.failed;
  }

  // Try to extract test groups from describe blocks
  // Pattern: "PASS src/file.test.ts" or "describe('GroupName'"
  const groupMatches = logs.matchAll(
    /(?:PASS|FAIL)\s+([^\n]+\.(?:test|spec)\.[jt]sx?)/gi
  );
  const seenGroups = new Set<string>();

  for (const match of groupMatches) {
    const fileName = match[1].split('/').pop() || match[1];
    if (!seenGroups.has(fileName)) {
      seenGroups.add(fileName);
      // Count tests in this file section (simplified)
      result.groups.push({
        name: fileName.replace(/\.(test|spec)\.[jt]sx?$/, ''),
        passed: 0,
        total: 0,
        failed: 0,
      });
    }
  }

  // If we found groups but no individual counts, distribute evenly
  if (result.groups.length > 0 && result.total > 0) {
    const perGroup = Math.floor(result.total / result.groups.length);
    const perGroupFailed = Math.floor(result.failed / result.groups.length);
    for (const group of result.groups) {
      group.total = perGroup;
      group.failed = perGroupFailed;
      group.passed = perGroup - perGroupFailed;
    }
  }

  return result;
}

// ============================================================================
// Current Activity Parser
// ============================================================================

/**
 * Activity patterns and their human-readable descriptions
 */
const activityPatterns: Array<{
  pattern: RegExp;
  humanize: (match: RegExpMatchArray) => string;
}> = [
  // Test running
  {
    pattern: /(?:running|executing)\s+(?:jest|vitest|npm\s+test)/i,
    humanize: () => 'Running tests to verify the implementation...',
  },
  {
    pattern: /npm\s+(?:run\s+)?test/i,
    humanize: () => 'Running the test suite...',
  },

  // File operations
  {
    pattern: /(?:reading|loading)\s+(?:file\s+)?["']?([^"'\n]+)["']?/i,
    humanize: (m) => `Reading ${m[1].split('/').pop()}...`,
  },
  {
    pattern: /(?:writing|saving|creating)\s+(?:file\s+)?["']?([^"'\n]+)["']?/i,
    humanize: (m) => `Writing changes to ${m[1].split('/').pop()}...`,
  },
  {
    pattern: /(?:editing|modifying)\s+(?:file\s+)?["']?([^"'\n]+)["']?/i,
    humanize: (m) => `Editing ${m[1].split('/').pop()}...`,
  },

  // Git operations
  {
    pattern: /git\s+diff/i,
    humanize: () => 'Checking file changes...',
  },
  {
    pattern: /git\s+status/i,
    humanize: () => 'Checking git status...',
  },
  {
    pattern: /git\s+commit/i,
    humanize: () => 'Committing changes...',
  },

  // Build operations
  {
    pattern: /(?:npm|yarn|pnpm)\s+(?:run\s+)?build/i,
    humanize: () => 'Building the project...',
  },
  {
    pattern: /(?:npm|yarn|pnpm)\s+install/i,
    humanize: () => 'Installing dependencies...',
  },
  {
    pattern: /(?:compiling|transpiling|bundling)/i,
    humanize: () => 'Compiling code...',
  },

  // Analysis
  {
    pattern: /(?:analyzing|checking|validating|verifying)/i,
    humanize: () => 'Analyzing the code...',
  },
  {
    pattern: /(?:searching|looking\s+for|finding)/i,
    humanize: () => 'Searching through the codebase...',
  },

  // Generic Claude activity
  {
    pattern: /thinking/i,
    humanize: () => 'Thinking about the next step...',
  },
  {
    pattern: /planning/i,
    humanize: () => 'Planning the implementation approach...',
  },
];

/**
 * Parse logs to extract current activity
 * Returns both human-friendly and technical descriptions
 */
export function parseCurrentActivity(logs: string): CurrentActivity {
  const result: CurrentActivity = {
    human: 'Working on the task...',
    technical: '',
  };

  if (!logs) return result;

  // Get the last few meaningful log lines
  const lines = logs
    .split('\n')
    .filter((l) => l.trim())
    .slice(-20);

  if (lines.length === 0) return result;

  // Find the most recent meaningful activity
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];

    // Skip empty or noise lines
    if (line.length < 5) continue;
    if (/^\s*[\[\]{}]?\s*$/.test(line)) continue;

    // Try to match activity patterns
    for (const { pattern, humanize } of activityPatterns) {
      const match = line.match(pattern);
      if (match) {
        result.human = humanize(match);
        result.technical = line.trim().slice(0, 200);
        return result;
      }
    }

    // Use last non-trivial line as technical
    if (!result.technical && line.length > 10) {
      result.technical = line.trim().slice(0, 200);
    }
  }

  // If no pattern matched, use the last line
  if (!result.technical) {
    result.technical = lines[lines.length - 1]?.trim().slice(0, 200) || '';
  }

  return result;
}

// ============================================================================
// Files Changed Parser
// ============================================================================

/**
 * File extension to description mapping
 */
const fileDescriptions: Record<string, string> = {
  '.ts': 'TypeScript module',
  '.tsx': 'React component',
  '.js': 'JavaScript module',
  '.jsx': 'React component',
  '.css': 'Stylesheet',
  '.scss': 'Sass stylesheet',
  '.json': 'Configuration',
  '.md': 'Documentation',
  '.test.ts': 'Test file',
  '.test.tsx': 'Component tests',
  '.spec.ts': 'Test file',
  '.spec.tsx': 'Component tests',
};

/**
 * Generate a human-friendly description for a file change
 */
function describeFileChange(
  filePath: string,
  status: 'added' | 'modified' | 'deleted'
): string {
  const fileName = filePath.split('/').pop() || filePath;
  const dir = filePath.split('/').slice(-2, -1)[0] || '';

  // Check for test files
  if (/\.(test|spec)\.[jt]sx?$/.test(fileName)) {
    const baseName = fileName.replace(/\.(test|spec)\.[jt]sx?$/, '');
    return status === 'added'
      ? `Tests for ${baseName}`
      : `Updated tests for ${baseName}`;
  }

  // Check for specific file types
  for (const [ext, desc] of Object.entries(fileDescriptions)) {
    if (fileName.endsWith(ext)) {
      const verb =
        status === 'added' ? 'New' : status === 'deleted' ? 'Removed' : 'Updated';
      return `${verb} ${desc.toLowerCase()}`;
    }
  }

  // Route files
  if (filePath.includes('/api/') && fileName === 'route.ts') {
    return status === 'added' ? 'New API endpoint' : 'Updated API endpoint';
  }

  // Component files
  if (dir === 'components' || filePath.includes('/components/')) {
    return status === 'added' ? 'New component' : 'Updated component';
  }

  // Default
  const verb =
    status === 'added' ? 'Added' : status === 'deleted' ? 'Removed' : 'Modified';
  return `${verb} file`;
}

/**
 * Get files changed in the project using git diff
 * Compares working directory against HEAD
 */
export async function getFilesChanged(projectPath: string): Promise<FileChange[]> {
  const changes: FileChange[] = [];

  try {
    // Get both staged and unstaged changes
    const { stdout } = await execAsync(
      'git diff --name-status HEAD 2>/dev/null || git diff --name-status 2>/dev/null || echo ""',
      { cwd: projectPath }
    );

    if (!stdout.trim()) {
      // Try to get untracked files too
      const { stdout: untrackedOut } = await execAsync(
        'git ls-files --others --exclude-standard 2>/dev/null || echo ""',
        { cwd: projectPath }
      );

      for (const line of untrackedOut.split('\n')) {
        const trimmed = line.trim();
        if (trimmed) {
          changes.push({
            path: trimmed,
            status: 'added',
            description: describeFileChange(trimmed, 'added'),
          });
        }
      }
      return changes;
    }

    for (const line of stdout.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Format: "A\tfilename" or "M\tfilename" or "D\tfilename"
      const [statusChar, ...pathParts] = trimmed.split('\t');
      const filePath = pathParts.join('\t').trim();

      if (!filePath) continue;

      let status: 'added' | 'modified' | 'deleted';
      switch (statusChar.charAt(0).toUpperCase()) {
        case 'A':
          status = 'added';
          break;
        case 'D':
          status = 'deleted';
          break;
        default:
          status = 'modified';
      }

      changes.push({
        path: filePath,
        status,
        description: describeFileChange(filePath, status),
      });
    }
  } catch (error) {
    console.error('Failed to get git diff:', error);
  }

  return changes;
}

/**
 * Parse git diff output from logs (when git command output is in logs)
 */
export function parseFilesChangedFromLogs(logs: string): FileChange[] {
  const changes: FileChange[] = [];
  const seenFiles = new Set<string>();

  // Look for diff header patterns: "diff --git a/file b/file"
  const diffMatches = logs.matchAll(/diff --git a\/([^\s]+)/g);
  for (const match of diffMatches) {
    const filePath = match[1];
    if (!seenFiles.has(filePath)) {
      seenFiles.add(filePath);
      changes.push({
        path: filePath,
        status: 'modified',
        description: describeFileChange(filePath, 'modified'),
      });
    }
  }

  // Look for "new file:" patterns
  const newFileMatches = logs.matchAll(/new file(?:\s+mode)?[^\n]*\n[^\n]*([^\s]+)/gi);
  for (const match of newFileMatches) {
    const filePath = match[1];
    if (!seenFiles.has(filePath)) {
      seenFiles.add(filePath);
      const existing = changes.find((c) => c.path === filePath);
      if (existing) {
        existing.status = 'added';
        existing.description = describeFileChange(filePath, 'added');
      } else {
        changes.push({
          path: filePath,
          status: 'added',
          description: describeFileChange(filePath, 'added'),
        });
      }
    }
  }

  return changes;
}

// ============================================================================
// Aggregate Function
// ============================================================================

/**
 * Parse all Ralph project files and return complete details
 */
export function parseRalphDetails(
  promptContent: string,
  fixPlanContent: string,
  logs: string
): Omit<RalphDetails, 'filesChanged'> {
  return {
    mission: parseMission(promptContent),
    requirements: parseRequirements(fixPlanContent),
    tests: parseTestResults(logs),
    currentActivity: parseCurrentActivity(logs),
    promptContent,
    fixPlanContent,
  };
}
