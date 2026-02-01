# Agent Dashboard — Final Polish

## Context
- User: Non-technical founder
- Goal: Useful dashboard for full agentic approach
- Gateway: Running on localhost:4280

## Tasks (all equal priority)

### 1. Test with OpenClaw Gateway
- Verify ALL apps connect to real Gateway
- Test SSE events flow to Activity Monitor
- Test error states (Gateway down, auth fail, timeout)
- Ensure token auth works end-to-end

### 2. Polish Animations (macOS exact feel)
- Window open: Scale up + fade (like macOS)
- Window close: Scale down + fade
- Window minimize: Genie effect to dock
- Dock icons: Bounce on launch
- Smooth transitions everywhere
- Use framer-motion for all animations

### 3. Keyboard Shortcuts (standard macOS)
- Cmd+Space: Open Spotlight
- Cmd+W: Close focused window
- Cmd+M: Minimize focused window
- Cmd+Q: Quit/close app
- Cmd+1/2/3: Switch between open windows
- Escape: Close modals/spotlight
- Register globally, handle focus properly

### 4. Dark Mode
- Follow system preference by default
- Toggle in menu bar (sun/moon icon)
- Also in Settings app
- Ensure all components respect theme
- Smooth transition between modes

## Development
```bash
pnpm dev      # Dev server
pnpm build    # Must pass
pnpm test     # Run tests
```

## Verification
- All apps render and connect
- Animations feel native macOS
- All shortcuts work
- Dark/light mode toggles smoothly
- Build passes with no errors

## CRITICAL: Completion
When ALL tasks verified working:

```
---RALPH_STATUS---
STATUS: COMPLETE
EXIT_SIGNAL: true
---END_RALPH_STATUS---
```
