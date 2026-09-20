# Architecture

Relay has one job: preserve enough development state for a future session to continue safely.

## State layers

1. **Project config** — `.relay/config.json`, safe to commit.
2. **Runtime state** — `.relay/state.json`, local and ignored.
3. **Human handoff** — `.relay/HANDOFF.md`, generated and ignored.
4. **Checkpoints** — timestamped local state copies.
5. **Remote context** — optional Git note under `refs/notes/relay`.

## Why Git notes?

A Relay state should not dirty the user's working branch just because the task description changed. Git notes provide a separate ref that can be pushed and fetched with the same repository permissions.

v0.1 attaches the latest state to the current HEAD. A receiving machine therefore needs the same commit before pulling context.

Before a state is pushed, Relay merges the notes already on origin, so two machines can push in any order. The pushing machine wins for the current commit; a pull takes the remote version.

## Security boundary

Core state is derived from Git metadata and explicit CLI arguments. Relay does not scan arbitrary file contents to infer context. That constraint is intentional: it minimizes accidental secret collection.

Everything that is saved, rendered for a handoff or synced passes through one sanitizer, `src/redact.js`. The synced copy additionally drops the hostname and the absolute project path.

## Agent handoff

The core schema remains agent-neutral. `relay handoff <agent>` renders the same saved state into a minimal continuation prompt.

Future adapters should remain translation layers, not separate sources of truth.
