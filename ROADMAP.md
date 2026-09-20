# Roadmap

Relay stays intentionally small. Roadmap items are driven by real continuity problems rather than feature count.

## v0.1 — Continuity core

- [x] Project initialization
- [x] Git state capture
- [x] Task / next-step memory
- [x] Local checkpoints
- [x] Local ↔ remote drift checks
- [x] Agent handoff prompts
- [x] Context sync through Git notes
- [x] Optional SSH server probe
- [x] Secret-safe defaults
- [x] macOS / Linux / Windows CI

## v0.2 — Portable dirty work

- [ ] Safe snapshot of unstaged/staged patches
- [ ] Optional inclusion of selected untracked files
- [ ] Restore preview before applying a snapshot
- [ ] Conflict-safe restore
- [ ] Snapshot size limits and secret scanning

## v0.3 — Native adapters

- [ ] Claude Code adapter
- [ ] OpenAI Codex adapter
- [ ] Cursor adapter
- [ ] Gemini CLI adapter
- [ ] OpenCode adapter
- [ ] GitHub Copilot adapter
- [ ] Adapter SDK for community integrations

## v0.4 — Connected continuity

- [ ] MCP server
- [ ] Encrypted optional state sync
- [ ] Multi-repository workspaces
- [ ] Production revision adapters
- [ ] Team handoff mode
- [ ] Signed state / provenance

Have a use case? Open an issue before building a large feature so we can keep Relay focused.
