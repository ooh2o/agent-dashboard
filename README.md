# Agent Dashboard

**"Chief mit Gesicht"** — A founder-friendly dashboard for AI agent oversight.

![Status](https://img.shields.io/badge/Status-Planning-yellow)

## What is this?

Like [Vibe Dashboard](https://github.com/ooh2o/vibe-dashboard) but for AI agents instead of AI coding.

See what your AI assistant is doing in real-time:
- 🔍 Tool calls (search, browse, exec)
- 📖 Memory access (reads/writes)
- 💰 Token usage & costs
- 🔀 Sub-agent activity
- ⏸️ Intervention controls

## Why?

AI agents are black boxes. You give them a task and hope for the best. This dashboard opens the box:

- **What's it doing?** See every action in plain language
- **What's it costing?** Token counter with $$$ estimates
- **What's it accessing?** Memory viewer shows what it read
- **Can I stop it?** Intervention panel for redirects/stops

## Status

📋 **Planning** — PRD written, implementation not started.

See [PRD.md](./PRD.md) for full specification.

## Tech Stack (Planned)

- Next.js 15 + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)
- SSE (real-time events)
- OpenClaw gateway integration

## Integration

Designed to work with [OpenClaw](https://github.com/openclaw/openclaw):

```
OpenClaw Gateway → SSE Events → Agent Dashboard
```

## Contributing

This is early stage. Star/watch to follow progress.

## License

MIT

---

*Built for founders who want to trust their AI, not just use it.*
