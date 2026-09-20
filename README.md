# Tashev Relay

<p align="center">
  <img src="assets/logo.svg" width="120" alt="Tashev Relay logo">
</p>

<p align="center"><strong>Git remembers your code. Relay remembers your work.</strong></p>

<p align="center">
  Switch AI. Switch machine. Keep working.
</p>

<p align="center">
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="zero dependencies" src="https://img.shields.io/badge/dependencies-0-brightgreen">
  <img alt="Node 18+" src="https://img.shields.io/badge/node-%3E%3D18-brightgreen">
</p>

Tashev Relay is a local-first continuity layer for AI-assisted development. It captures the task you are working on, Git state, changed files, next step and optional server checks so another coding agent or another machine can continue without rebuilding context from scratch.

## 15-second demo

```bash
# Claude Code session
relay save \
  --task "Fix refresh-token rotation" \
  --next "Run integration tests" \
  --agent claude

# Switch to Codex, Cursor, Gemini CLI, another account or another terminal
relay handoff codex --stdout
relay resume
```

```text
TASHEV RELAY
Switch AI. Switch machine. Keep working.

Project      my-app
Agent        claude
Branch       feature/auth
Commit       9fa31b2c
Dirty        yes

Current task
Fix refresh-token rotation

Next
Run integration tests
```

## Why Relay?

Your Git repository remembers commits. It does not remember why you changed a file, what is still unfinished, what not to touch, which AI worked last, or whether your local branch drifted from GitHub.

Relay keeps that operational context in a small, human-readable state.

- **Local-first** — no Relay account or cloud service.
- **Zero runtime dependencies** — only Node.js 18+ and Git.
- **Agent-neutral** — handoffs for Claude Code, Codex, Cursor, Gemini CLI, OpenCode and GitHub Copilot.
- **Git-aware** — branch, commit, staged, modified and untracked files.
- **Cross-machine state sync** — optional Git notes ref, separate from your working branch.
- **Drift detection** — compare local HEAD with the remote branch.
- **Server probes** — optional SSH reachability checks by alias.
- **Secret-safe by design** — Relay never reads `.env` values, private SSH keys, cookies or AI credentials. Credentials in remote URLs are stripped and token-like strings in your notes are masked.

## Install

From GitHub today:

```bash
git clone https://github.com/tashev11/tashev-relay.git
cd tashev-relay
npm install -g .
relay --help
```

When the npm package is published:

```bash
npm install -g tashev-relay
```

## Quick start

Inside any Git repository:

```bash
relay init

relay save \
  --task "Implement billing webhook" \
  --next "Test duplicate event handling" \
  --agent claude

relay status
relay doctor
```

Generate a handoff for another agent:

```bash
relay handoff codex --stdout
```

Create a local checkpoint:

```bash
relay checkpoint
```

Sync context through the existing Git remote without touching your branch:

```bash
relay sync push

# On another machine at the same commit:
relay sync pull
relay resume
```

> Relay sync transfers **context state**, not uncommitted source code. If your working tree is dirty, `relay doctor` and `relay sync push` warn you. Commit/push your code or keep working on the same machine.

> Anyone who can read the repository can fetch `refs/notes/relay`. Synced state carries your task text, notes, branch and file names. It leaves out the hostname and local paths, and token-like strings are masked. Two machines can push in any order: Relay merges the notes already on origin first.

## Commands

| Command | Purpose |
| --- | --- |
| `relay init` | Initialize safe project metadata |
| `relay save` | Capture current task + Git state |
| `relay resume` | Show the last saved state |
| `relay status` | Alias for current Relay state |
| `relay doctor` | Check Git, GitHub drift, state and optional servers |
| `relay checkpoint` | Save a timestamped local checkpoint |
| `relay handoff <agent>` | Create an agent-specific continuation prompt |
| `relay sync push/pull` | Transfer context via `refs/notes/relay` |

`relay doctor` exits with code 2 only when a check fails. A dirty working tree and a missing GitHub CLI are warnings.

## Optional server checks

Edit `.relay/config.json`:

```json
{
  "schemaVersion": 1,
  "project": "my-app",
  "servers": [
    { "alias": "my-prod" }
  ],
  "security": { "redactSecrets": true }
}
```

Relay runs only a non-interactive reachability probe:

```text
ssh -o BatchMode=yes -o ConnectTimeout=3 my-prod true
```

Private keys remain in your normal SSH configuration.

## What Relay does not store

Relay deliberately does **not** read or copy:

- passwords
- `.env` values
- API tokens
- private SSH keys
- browser cookies
- AI-provider credentials

Runtime state and generated handoffs are ignored by Git by default. Only safe `.relay/config.json` metadata is intended to be committed.

The text you pass to `--task`, `--next` and `--note` is yours, so Relay cannot know what is in it. With `security.redactSecrets` on (the default) it masks common token formats and `password=...` style pairs before the state is saved, handed off or synced. Credentials embedded in the `origin` URL are always removed.

## Project layout

```text
.relay/
├── config.json          # safe project config; may be committed
├── state.json           # local runtime state; ignored
├── HANDOFF.md           # generated local handoff; ignored
└── checkpoints/         # local checkpoints; ignored
```

Cross-machine state uses the dedicated `refs/notes/relay` Git ref.

## Philosophy

**Stop restarting. Start resuming.**

Relay is intentionally small. It does not try to replace Git, your IDE, your AI agent, SSH, or deployment tooling. It connects the state between them.

## Roadmap

See [ROADMAP.md](ROADMAP.md). Near-term priorities include richer dirty-worktree snapshots, automatic agent adapters, encrypted optional sync and MCP integration.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

Want your favorite coding agent supported? Open an issue or contribute an adapter.

## Security

Please read [SECURITY.md](SECURITY.md) before reporting a security issue.

## License

MIT © 2026 Rinat Tashev.

---

<p align="center">
  Built by <a href="https://github.com/tashev11">@tashev11</a>.
</p>
