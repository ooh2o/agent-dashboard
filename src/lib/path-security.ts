/**
 * Path Security Module
 *
 * Provides validation functions to prevent command injection and path traversal attacks.
 * All user-supplied paths MUST be validated through these functions before use.
 */

import * as path from 'path';

/**
 * Characters that can be used for shell injection attacks
 */
const DANGEROUS_CHARS = /[;&|`$(){}[\]<>\\'"!#*?~\x00-\x1f]/;

/**
 * Allowed base directories for project paths
 */
const ALLOWED_PREFIXES = [
  process.env.HOME || '/home',
  '/home/enovo/.openclaw/workspace',
];

export interface PathValidationResult {
  valid: boolean;
  resolved?: string;
  error?: string;
}

/**
 * Validates that a path is safe to use:
 * 1. Does not contain shell metacharacters
 * 2. Resolves to an allowed directory
 * 3. Does not contain path traversal sequences after resolution
 *
 * @param inputPath - The raw path to validate
 * @returns Validation result with resolved path or error message
 */
export function validatePath(inputPath: string): PathValidationResult {
  // Check for null bytes and control characters
  if (DANGEROUS_CHARS.test(inputPath)) {
    return {
      valid: false,
      error: 'Path contains invalid characters',
    };
  }

  // Resolve to absolute path
  const resolved = path.resolve(inputPath);

  // Check that resolved path is within allowed directories
  const isAllowed = ALLOWED_PREFIXES.some(
    (prefix) => prefix && resolved.startsWith(prefix)
  );

  if (!isAllowed) {
    return {
      valid: false,
      error: 'Path is outside allowed directories',
    };
  }

  // Double-check no path traversal remains after resolution
  if (resolved.includes('..')) {
    return {
      valid: false,
      error: 'Path traversal detected',
    };
  }

  return {
    valid: true,
    resolved,
  };
}

/**
 * Checks if a path contains dangerous shell metacharacters
 *
 * @param inputPath - The path to check
 * @returns true if path contains dangerous characters
 */
export function hasDangerousChars(inputPath: string): boolean {
  return DANGEROUS_CHARS.test(inputPath);
}

/**
 * Checks if a resolved path is within allowed directories
 *
 * @param resolvedPath - The already-resolved absolute path
 * @returns true if path is in an allowed directory
 */
export function isInAllowedDirectory(resolvedPath: string): boolean {
  return ALLOWED_PREFIXES.some(
    (prefix) => prefix && resolvedPath.startsWith(prefix)
  );
}

/**
 * Decodes a base64url-encoded project path and validates it
 *
 * @param encoded - The base64url-encoded path
 * @returns Validation result with decoded and resolved path
 */
export function decodeAndValidatePath(encoded: string): PathValidationResult {
  let decoded: string;

  try {
    decoded = Buffer.from(encoded, 'base64url').toString('utf-8');
  } catch {
    return {
      valid: false,
      error: 'Invalid base64url encoding',
    };
  }

  return validatePath(decoded);
}

/**
 * Escapes a path for safe use in regex patterns (for pgrep etc.)
 * NOTE: Prefer using spawn with array arguments over shell commands
 *
 * @param inputPath - The path to escape
 * @returns Regex-safe version of the path
 */
export function escapeForRegex(inputPath: string): string {
  return inputPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
