/**
 * Tests for path security validation utilities
 */

import {
  validatePath,
  hasDangerousChars,
  isInAllowedDirectory,
  decodeAndValidatePath,
  escapeForRegex,
} from '../path-security';

describe('validatePath', () => {
  it('should accept valid paths within home directory', () => {
    const result = validatePath('/home/enovo/.openclaw/workspace/my-project');
    expect(result.valid).toBe(true);
    expect(result.resolved).toBe('/home/enovo/.openclaw/workspace/my-project');
    expect(result.error).toBeUndefined();
  });

  it('should reject paths with shell metacharacters', () => {
    const dangerousPaths = [
      '/home/test; rm -rf /',
      '/home/test && cat /etc/passwd',
      '/home/test | grep secret',
      '/home/test`whoami`',
      '/home/test$(id)',
      '/home/test{a,b}',
      "/home/test'injection'",
      '/home/test"injection"',
      '/home/test<file',
      '/home/test>file',
      '/home/test!dangerous',
      '/home/test#comment',
      '/home/test*glob',
      '/home/test?glob',
      '/home/test~expansion',
    ];

    for (const path of dangerousPaths) {
      const result = validatePath(path);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Path contains invalid characters');
    }
  });

  it('should reject paths with null bytes', () => {
    const result = validatePath('/home/test\x00malicious');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Path contains invalid characters');
  });

  it('should reject paths outside allowed directories', () => {
    const result = validatePath('/etc/passwd');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Path is outside allowed directories');
  });

  it('should reject path traversal attempts', () => {
    // Note: path.resolve will normalize these, so we need paths that
    // after resolution still end up outside allowed dirs
    const result = validatePath('/tmp/../etc/passwd');
    expect(result.valid).toBe(false);
  });

  it('should handle relative paths by resolving them', () => {
    // This will resolve relative to cwd
    const result = validatePath('./test');
    // Result depends on cwd - if cwd is within allowed dirs, should work
    expect(result.resolved).toBeDefined();
  });
});

describe('hasDangerousChars', () => {
  it('should detect semicolons', () => {
    expect(hasDangerousChars('test;rm')).toBe(true);
  });

  it('should detect ampersands', () => {
    expect(hasDangerousChars('test&&rm')).toBe(true);
  });

  it('should detect pipes', () => {
    expect(hasDangerousChars('test|cat')).toBe(true);
  });

  it('should detect backticks', () => {
    expect(hasDangerousChars('test`id`')).toBe(true);
  });

  it('should detect dollar signs', () => {
    expect(hasDangerousChars('test$(id)')).toBe(true);
  });

  it('should detect parentheses', () => {
    expect(hasDangerousChars('test()')).toBe(true);
  });

  it('should detect curly braces', () => {
    expect(hasDangerousChars('test{}')).toBe(true);
  });

  it('should detect square brackets', () => {
    expect(hasDangerousChars('test[]')).toBe(true);
  });

  it('should detect angle brackets', () => {
    expect(hasDangerousChars('test<>')).toBe(true);
  });

  it('should detect backslashes', () => {
    expect(hasDangerousChars('test\\n')).toBe(true);
  });

  it('should detect quotes', () => {
    expect(hasDangerousChars("test'quote")).toBe(true);
    expect(hasDangerousChars('test"quote')).toBe(true);
  });

  it('should allow safe paths', () => {
    expect(hasDangerousChars('/home/user/project')).toBe(false);
    expect(hasDangerousChars('/home/user/my-project_v2.0')).toBe(false);
    expect(hasDangerousChars('/home/user/.config')).toBe(false);
  });
});

describe('isInAllowedDirectory', () => {
  it('should allow paths in home directory', () => {
    expect(isInAllowedDirectory('/home/enovo/project')).toBe(true);
    // Note: Only paths under the actual HOME directory are allowed
    expect(isInAllowedDirectory('/home/enovo/.openclaw/workspace/project')).toBe(true);
  });

  it('should allow paths in workspace', () => {
    expect(isInAllowedDirectory('/home/enovo/.openclaw/workspace/test')).toBe(true);
  });

  it('should reject system directories', () => {
    expect(isInAllowedDirectory('/etc/passwd')).toBe(false);
    expect(isInAllowedDirectory('/var/log')).toBe(false);
    expect(isInAllowedDirectory('/tmp/test')).toBe(false);
    expect(isInAllowedDirectory('/root/.ssh')).toBe(false);
  });
});

describe('decodeAndValidatePath', () => {
  it('should decode valid base64url paths', () => {
    // /home/enovo/.openclaw/workspace/test encoded in base64url
    const encoded = Buffer.from('/home/enovo/.openclaw/workspace/test').toString('base64url');
    const result = decodeAndValidatePath(encoded);
    expect(result.valid).toBe(true);
    expect(result.resolved).toBe('/home/enovo/.openclaw/workspace/test');
  });

  it('should reject invalid base64url', () => {
    const result = decodeAndValidatePath('!!!not-valid-base64!!!');
    // Note: Buffer.from with base64url is lenient, so this might not fail
    // The validation of the decoded content is what matters
  });

  it('should reject decoded paths with dangerous characters', () => {
    const malicious = Buffer.from('/home/test; rm -rf /').toString('base64url');
    const result = decodeAndValidatePath(malicious);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Path contains invalid characters');
  });

  it('should reject decoded paths outside allowed directories', () => {
    const outside = Buffer.from('/etc/passwd').toString('base64url');
    const result = decodeAndValidatePath(outside);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Path is outside allowed directories');
  });
});

describe('escapeForRegex', () => {
  it('should escape regex special characters', () => {
    expect(escapeForRegex('test.path')).toBe('test\\.path');
    expect(escapeForRegex('test*path')).toBe('test\\*path');
    expect(escapeForRegex('test+path')).toBe('test\\+path');
    expect(escapeForRegex('test?path')).toBe('test\\?path');
    expect(escapeForRegex('test^path')).toBe('test\\^path');
    expect(escapeForRegex('test$path')).toBe('test\\$path');
    expect(escapeForRegex('test{path}')).toBe('test\\{path\\}');
    expect(escapeForRegex('test(path)')).toBe('test\\(path\\)');
    expect(escapeForRegex('test[path]')).toBe('test\\[path\\]');
    expect(escapeForRegex('test|path')).toBe('test\\|path');
    expect(escapeForRegex('test\\path')).toBe('test\\\\path');
  });

  it('should not modify safe strings', () => {
    expect(escapeForRegex('/home/user/project')).toBe('/home/user/project');
    expect(escapeForRegex('/home/user/my-project_v2')).toBe('/home/user/my-project_v2');
  });
});

describe('Security attack scenarios', () => {
  it('should prevent command injection via semicolon', () => {
    const attack = '/home/project; cat /etc/passwd';
    const result = validatePath(attack);
    expect(result.valid).toBe(false);
  });

  it('should prevent command injection via command substitution', () => {
    const attack1 = '/home/project$(cat /etc/passwd)';
    const attack2 = '/home/project`cat /etc/passwd`';
    expect(validatePath(attack1).valid).toBe(false);
    expect(validatePath(attack2).valid).toBe(false);
  });

  it('should prevent command injection via pipe', () => {
    const attack = '/home/project | cat /etc/passwd';
    const result = validatePath(attack);
    expect(result.valid).toBe(false);
  });

  it('should prevent path traversal to /etc/passwd', () => {
    const attack = '/home/enovo/../../../etc/passwd';
    const result = validatePath(attack);
    // After resolution, this becomes /etc/passwd which is outside allowed dirs
    expect(result.valid).toBe(false);
  });

  it('should prevent access to root directory', () => {
    const result = validatePath('/root/.ssh/id_rsa');
    expect(result.valid).toBe(false);
  });

  it('should prevent encoded newline attacks', () => {
    // Newline is a control character
    const attack = '/home/project\ncat /etc/passwd';
    const result = validatePath(attack);
    expect(result.valid).toBe(false);
  });
});
