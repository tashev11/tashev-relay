<p align="center">
  <img src="assets/hero.svg" alt="Tashev Relay — Switch AI. Switch machine. Keep working." width="100%">
</p>

<p align="center">
  <a href="https://github.com/tashev11/tashev-relay/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/tashev11/tashev-relay?style=flat-square"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-38bdf8?style=flat-square"></a>
  <img alt="Zero runtime dependencies" src="https://img.shields.io/badge/runtime_dependencies-0-34d399?style=flat-square">
  <img alt="Node.js 18+" src="https://img.shields.io/badge/Node.js-%3E%3D18-84cc16?style=flat-square">
  <a href="https://github.com/tashev11/tashev-relay/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/tashev11/tashev-relay?style=flat-square"></a>
  <a href="https://github.com/tashev11/tashev-relay/issues"><img alt="Issues" src="https://img.shields.io/github/issues/tashev11/tashev-relay?style=flat-square"></a>
</p>

<p align="center">
  <strong>Portable project continuity for AI-assisted development.</strong><br>
  Save where you stopped. Switch agent, account, terminal or machine. Resume with the context that matters.
</p>

<p align="center">
  <a href="#-quick-start"><strong>Quick start</strong></a> ·
  <a href="#-how-it-works"><strong>How it works</strong></a> ·
  <a href="#-relay-doctor"><strong>Relay Doctor</strong></a> ·
  <a href="README_RU.md"><strong>Русская версия</strong></a> ·
  <a href="https://github.com/tashev11/tashev-relay/discussions"><strong>Discussions</strong></a>
</p>

---

## The problem

AI coding sessions are powerful — but continuity is fragile.

| You switch… | What usually gets lost |
| --- | --- |
| Claude Code → Codex | current task, decisions, next step |
| laptop → desktop | local context and what changed |
| one terminal/account → another | why the branch is in its current state |
| local → remote server | whether GitHub and production still match |
| today → tomorrow | what was already tried and what must not be repeated |

**Git remembers the code. It does not remember the work around the code.**

Tashev Relay adds that missing continuity layer.

<p align="center">
  <img src="assets/workflow.svg" alt="Relay workflow: save in one AI session and resume in another" width="100%">
</p>

---

## What Relay remembers

Relay captures a compact, human-readable project state:

| State | Example |
| --- | --- |
| Current task | Fix refresh-token rotation |
| Next step | Run integration tests |
| Git branch | feature/auth |
| Commit | 9fa31b2c |
| Working tree | changed / staged / untracked files |
| Last agent | Claude Code, Codex, Cursor… |
| Notes | decisions and important context |
| Remote state | optional GitHub drift check |
| Server state | optional SSH reachability check |

It intentionally **does not become another cloud workspace or AI account**.

---

## 🤖 Agent-neutral by design

<p align="center">
  <img src="assets/agents.svg" alt="Supported AI coding agents" width="100%">
</p>

Relay can generate focused continuation handoffs for **Claude Code, OpenAI Codex, Cursor, Gemini CLI, OpenCode and GitHub Copilot**.

The core state stays neutral, so one provider never becomes the source of truth.

---

## ⚡ Quick start

### 1. Install

From GitHub:

~~~bash
git clone https://github.com/tashev11/tashev-relay.git
cd tashev-relay
npm install -g .
relay --help
~~~

### 2. Initialize any project

~~~bash
cd your-project
relay init
~~~

### 3. Save where you stopped

~~~bash
relay save \
  --task "Fix refresh-token rotation" \
  --next "Run integration tests" \
  --note "Do not replace the existing auth middleware" \
  --agent claude
~~~

### 4. Switch AI / account / terminal / machine

~~~bash
relay handoff codex --stdout
~~~

or simply:

~~~bash
relay resume
~~~

Example:

~~~text
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
~~~

---

## 🔄 Cross-machine resume

Relay can sync context through the **existing Git remote** without adding state commits to your working branch.

Machine A:

~~~bash
relay save --task "Finish billing webhook" --next "Test idempotency"
relay sync push
~~~

Machine B, at the same commit:

~~~bash
git pull
relay sync pull
relay resume
~~~

Relay uses <code>refs/notes/relay</code>. Your normal branch stays clean.

> Context sync is not source-code sync. Uncommitted code stays on the machine where it was created. Relay warns you instead of pretending everything is portable.

---

## 🧭 How it works

<p align="center">
  <img src="assets/architecture.svg" alt="Tashev Relay architecture" width="100%">
</p>

Relay is deliberately small. It reads Git metadata plus the task, next step and notes you explicitly provide. Optional SSH checks use aliases already configured on your machine.

It does **not** replace Git, SSH, your IDE or your coding agent. It connects the state between them.

---

## 🩺 Relay Doctor

Before continuing work:

~~~bash
relay doctor
~~~

<p align="center">
  <img src="assets/doctor.svg" alt="relay doctor terminal output" width="100%">
</p>

Relay Doctor checks:

- Node.js and Git;
- origin remote;
- Relay state freshness;
- local ↔ remote commit drift;
- working-tree status;
- optional SSH aliases.

This catches a costly AI-coding mistake: **continuing from the wrong state while assuming everything was already pushed or deployed.**

---

## 📦 Commands

| Command | What it does |
| --- | --- |
| relay init | initialize safe project metadata |
| relay save | capture task + Git state |
| relay resume | show the last saved state |
| relay status | inspect current Relay state |
| relay doctor | detect drift and broken continuity |
| relay checkpoint | save a timestamped local checkpoint |
| relay handoff &lt;agent&gt; | generate continuation context for another AI |
| relay sync push | push portable context to refs/notes/relay |
| relay sync pull | restore portable context on another machine |

---

## 🔐 Security-first defaults

> **Project continuity should not require copying credentials.**

Relay deliberately does not read or copy:

- .env contents;
- passwords;
- private SSH keys;
- browser cookies;
- AI-provider credential files;
- authentication sessions.

Additional protections:

- credentials embedded in Git remote URLs are stripped;
- common token formats in task / note text are masked when redaction is enabled;
- runtime state and generated handoffs are ignored by Git;
- SSH checks use your existing aliases and a non-interactive true probe;
- synced state omits local-only information.

Default configuration:

~~~json
{
  "schemaVersion": 1,
  "project": "my-app",
  "servers": [],
  "security": {
    "redactSecrets": true
  }
}
~~~

See [SECURITY.md](SECURITY.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 📁 Project state

~~~text
.relay/
├── config.json          # safe project config; may be committed
├── state.json           # local runtime state; ignored
├── HANDOFF.md           # generated local handoff; ignored
└── checkpoints/         # local checkpoints; ignored
~~~

> **.git remembers your code history. .relay remembers your working continuity.**

---

## 🌱 Roadmap

**v0.1 — done:** task memory, Git-aware state, checkpoints, handoffs, drift detection, cross-machine context sync, SSH checks and secret redaction.

**Next:** portable dirty-work snapshots, native Claude/Codex adapters, richer Cursor/Gemini/OpenCode support, Homebrew/Windows distribution, MCP integration, encrypted optional sync and multi-repository workspaces.

See [ROADMAP.md](ROADMAP.md).

---

## 🧩 Build with us

Good first places to contribute:

- [Claude Code adapter](https://github.com/tashev11/tashev-relay/issues/1)
- [OpenAI Codex adapter](https://github.com/tashev11/tashev-relay/issues/2)
- [Portable dirty-work snapshots](https://github.com/tashev11/tashev-relay/issues/3)
- [Homebrew / Windows installation](https://github.com/tashev11/tashev-relay/issues/4)

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 💬 Why the project exists

The same codebase may be touched by several AI tools in one day. Each can be excellent at coding while starting with incomplete knowledge of what another tool already changed.

Relay turns:

~~~text
Please inspect the whole repo and guess what we were doing.
~~~

into:

~~~text
Current task: Fix refresh-token rotation
Branch: feature/auth
Changed files: 4
Last agent: Claude Code
Important note: keep existing middleware
Next: Run integration tests
~~~

That saves context, avoids repeated exploration and reduces accidental rework.

---

## ⭐ If Relay is useful

If this solves a problem you have, **star the repository** — it helps other AI-assisted developers discover it.

<p align="center">
  <a href="https://github.com/tashev11/tashev-relay"><strong>⭐ Star Tashev Relay</strong></a>
  &nbsp; · &nbsp;
  <a href="https://github.com/tashev11/tashev-relay/discussions"><strong>💬 Join Discussions</strong></a>
  &nbsp; · &nbsp;
  <a href="https://github.com/tashev11/tashev-relay/issues/new/choose"><strong>🧩 Contribute</strong></a>
</p>

---

## License

MIT © 2026 Rinat Tashev.

<p align="center">
  Built by <a href="https://github.com/tashev11"><strong>@tashev11</strong></a><br>
  <em>Stop restarting. Start resuming.</em>
</p>
