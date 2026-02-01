# Security Audit Report

**Project:** OpenClaw OS Dashboard
**Date:** 2026-02-01
**Auditor:** Claude Code
**Version:** 1.0.0

## Executive Summary

This security audit reviewed the live data API endpoints and file access patterns in the OpenClaw OS Dashboard. The audit identified 1 critical issue, 2 warnings, and several informational findings.

---

## Critical Findings

### 1. Command Injection in Ralph Start API

**Severity:** CRITICAL
**File:** `src/app/api/ralph/[project]/start/route.ts`
**Lines:** 61-77

**Description:**
The Ralph start endpoint decodes a base64url project path and uses it directly in a shell command without proper sanitization. An attacker could craft a malicious path containing shell metacharacters.

**Vulnerable Code:**
```typescript
const projectPath = Buffer.from(project, 'base64url').toString('utf-8');
// ...
const ralphProcess = spawn('bash', ['-c', `
  cd "${projectPath}" &&
  // ... commands using ${projectPath}
`]);
```

**Risk:**
Arbitrary command execution on the server.

**Recommendation:**
1. Validate that the decoded path is within allowed directories
2. Use `path.resolve()` and verify it starts with an allowed prefix
3. Escape or reject paths containing shell metacharacters
4. Consider using `spawn()` with array arguments instead of shell strings

**Example Fix:**
```typescript
const projectPath = Buffer.from(project, 'base64url').toString('utf-8');
const resolved = path.resolve(projectPath);

// Validate path is within home directory
const homeDir = process.env.HOME || '';
if (!resolved.startsWith(homeDir) || resolved.includes('..')) {
  return NextResponse.json({ error: 'Invalid project path' }, { status: 400 });
}

// Use spawn with array args, not shell string
spawn('ralph', ['loop', '--max-iterations', String(maxIterations)], {
  cwd: resolved,
  // ...
});
```

---

## Warning Findings

### 2. Session ID Path Injection

**Severity:** WARNING
**File:** `src/lib/openclaw-data.ts`
**Line:** 84

**Description:**
The `getSessionActivities()` function constructs a file path using a session ID parameter without validation:

```typescript
const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.jsonl`);
```

**Risk:**
If session IDs are user-controllable, an attacker could read arbitrary `.jsonl` files.

**Recommendation:**
- Validate session ID format (e.g., UUID pattern)
- Ensure the resolved path is within SESSIONS_DIR

---

### 3. Potential Information Exposure in Memory API

**Severity:** WARNING
**File:** `src/app/api/live/memory/route.ts`
**Lines:** 67-88

**Description:**
The memory API reads from `~/.claude/memory/` which may contain sensitive Claude Code memory files not intended for dashboard exposure.

**Risk:**
Unintended exposure of system-level memory files.

**Recommendation:**
- Only expose explicitly user-created memory files
- Add a whitelist of allowed memory file patterns
- Or remove the `.claude/memory` directory reading

---

## Informational Findings

### 4. Path Traversal Protection (GOOD)

**File:** `src/app/api/live/files/route.ts`
**Status:** ✅ Properly Protected

The files API correctly validates paths:
```typescript
const resolved = path.resolve(targetDir);
if (!resolved.startsWith(WORKSPACE_DIR)) {
  return NextResponse.json({ ok: false, error: 'Invalid path' }, { status: 400 });
}
```

---

### 5. Hidden File Filtering (GOOD)

**File:** `src/app/api/live/files/route.ts`
**Status:** ✅ Properly Implemented

Hidden files and `node_modules` are correctly filtered:
```typescript
if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
```

---

### 6. Error Messages

**Status:** INFO

Error responses use generic messages which is good for security:
```typescript
{ ok: false, error: 'Failed to fetch tools' }
```

Internal errors are logged to console, not exposed to clients.

---

### 7. No Authentication on API Routes

**Status:** INFO

The live data APIs do not implement authentication. This is acceptable for a local development dashboard but should be considered if deployed to a network.

**Recommendation for production:**
- Add authentication middleware
- Implement rate limiting
- Use HTTPS

---

## Files Reviewed

| File | Status |
|------|--------|
| `src/app/api/live/activities/route.ts` | ✅ OK |
| `src/app/api/live/files/route.ts` | ✅ OK |
| `src/app/api/live/memory/route.ts` | ⚠️ Warning #3 |
| `src/app/api/live/notifications/route.ts` | ✅ OK |
| `src/app/api/live/sessions/route.ts` | ✅ OK |
| `src/app/api/live/stats/route.ts` | ✅ OK |
| `src/app/api/live/tools/route.ts` | ✅ OK |
| `src/app/api/ralph/[project]/start/route.ts` | ❌ Critical #1 |
| `src/app/api/ralph/[project]/stop/route.ts` | ⚠️ Uses same path pattern |
| `src/app/api/ralph/[project]/status/route.ts` | ✅ OK (read-only) |
| `src/app/api/ralph/[project]/logs/route.ts` | ✅ OK (read-only) |
| `src/lib/openclaw-data.ts` | ⚠️ Warning #2 |

---

## Dependency Check

No direct check of `package.json` dependencies was performed. Consider running:
```bash
pnpm audit
```

---

## Recommendations Summary

1. **CRITICAL:** Fix command injection in Ralph start API immediately
2. **HIGH:** Add session ID validation in openclaw-data.ts
3. **MEDIUM:** Review memory API file exposure scope
4. **LOW:** Add authentication for production deployments
5. **LOW:** Run `pnpm audit` to check for vulnerable dependencies

---

## Conclusion

The dashboard has generally good security practices for file access, with proper path traversal protection in the files API. However, the Ralph process spawning functionality requires immediate remediation to prevent command injection attacks.

For a local development tool, the overall security posture is acceptable after addressing the critical finding. For any network-accessible deployment, additional authentication and authorization should be implemented.
