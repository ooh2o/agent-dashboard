# Agent Dashboard QA & Bug Fixes

## Context
This is a macOS-style dashboard for AI agent oversight. Built with Next.js 16, TypeScript, Tailwind CSS, Framer Motion.

## Priority 1: Critical Bugs

### 1.1 Cost Dashboard fetchEfficiency Error
- **File:** `src/components/apps/cost-dashboard/index.tsx`
- **Issue:** Console error at line 256/278 in fetchEfficiency function
- **Fix:** Add proper error handling, check API response before accessing properties

### 1.2 Middleware Deprecation
- **File:** `middleware.ts` or similar
- **Issue:** Next.js warning about middleware convention
- **Fix:** Update to use "proxy" convention per Next.js 16 guidelines

## Priority 2: App Functionality

### 2.1 Verify All 15 Apps Render Without Errors
Apps to check:
- Activity Monitor
- Memory Browser
- Message Center
- Cost Dashboard
- Agent Spawner
- File Browser
- Settings
- Tools Inspector
- Calendar & Cron
- Notification Center
- Terminal Console
- Task Queue
- Workflows
- Analytics Dashboard
- Ralph Monitor

For each app:
1. Ensure it renders without console errors
2. Ensure loading states work
3. Ensure error states are handled gracefully
4. Mock data displays correctly when no real data

### 2.2 Gateway Integration
- Ensure apps gracefully fall back when Gateway is unavailable
- Show "Not connected" states instead of errors
- Add reconnection logic where missing

## Priority 3: UI/UX Polish

### 3.1 Window Management
- Windows should be draggable
- Windows should be resizable
- Window z-index should update on focus
- Close/minimize/maximize buttons should work

### 3.2 Responsive Design
- Dashboard should work at different screen sizes
- Sidebar should collapse on smaller screens
- Widgets should reflow appropriately

### 3.3 Dark Mode
- Ensure all components respect dark mode
- No white flashes on load
- Consistent color scheme

## Priority 4: Testing

### 4.1 Add Missing Tests
- Test all app components render
- Test API routes return expected shapes
- Test error handling paths

### 4.2 Fix Flaky Tests
- Address any timing issues
- Mock external dependencies properly

## Technical Guidelines

- TypeScript strict mode, no `any` types
- All API calls should have try/catch
- Use proper loading/error states
- Follow existing code patterns
- Run `npm run build` to verify no TypeScript errors
- Run `npm test` to verify tests pass

## Completion Criteria

1. `npm run build` passes with no errors
2. `npm test` passes with no failures  
3. No console errors when loading dashboard
4. All 15 apps render without crashing
5. Gateway-dependent features show graceful fallbacks

---RALPH_STATUS---
STATUS: COMPLETE
EXIT_SIGNAL: true
---END_RALPH_STATUS---
