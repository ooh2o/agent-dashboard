# QA Fix Plan - Priority Order

## Phase 1: Critical (Do First)
1. Fix Cost Dashboard fetchEfficiency error
2. Update middleware to proxy convention
3. Fix any remaining hydration issues

## Phase 2: App Verification (Systematic)
4. Activity Monitor - verify/fix
5. Memory Browser - verify/fix
6. Message Center - verify/fix
7. Agent Spawner - verify/fix
8. File Browser - verify/fix
9. Settings - verify/fix
10. Tools Inspector - verify/fix
11. Calendar & Cron - verify/fix
12. Notification Center - verify/fix
13. Terminal Console - verify/fix
14. Task Queue - verify/fix
15. Workflows - verify/fix
16. Analytics Dashboard - verify/fix
17. Ralph Monitor - verify/fix (already works)

## Phase 3: Integration
18. Gateway connection fallbacks
19. Real data integration where possible
20. Loading states

## Phase 4: Polish
21. Window management (drag/resize/focus)
22. Responsive design
23. Test coverage

## Build Verification
After each major change:
- `npm run build`
- `npm test`
