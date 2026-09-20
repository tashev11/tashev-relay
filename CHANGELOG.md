# Changelog

All notable changes to Tashev Relay are documented here.

## [Unreleased]

### Security
- Credentials embedded in the `origin` URL are stripped before the URL is saved, printed, handed off or synced.
- `security.redactSecrets` is now honoured: token-like strings in the task, next step, notes and last commit message are masked.
- Synced state no longer contains the machine hostname or the absolute project path.

### Fixed
- The first `git status` entry lost its status column, so a modified file was recorded as staged with a truncated name.
- Non-ASCII file names were recorded as octal escapes, and the source path of a rename was parsed as a separate entry.
- `relay sync push` no longer fails when another machine pushed first: notes already on origin are merged before pushing.
- `relay sync pull` explains when origin has no Relay state yet.
- `--task`, `--next`, `--note` and `--agent` without a value are rejected instead of saving `true`; `--key=value` is accepted.
- `relay doctor` treats a dirty working tree and a missing GitHub CLI as warnings and exits 0 when nothing fails.
- Outside a Git repository Relay no longer creates a `.gitignore`, and `relay save` says that only the task state was saved.
- The project name fallback works with Windows paths.

## [0.1.0] - 2026-09-20

### Added
- `relay init`
- `relay save`
- `relay resume` and `relay status`
- `relay doctor`
- `relay checkpoint`
- agent handoffs for Claude Code, Codex, Cursor, Gemini CLI, OpenCode and GitHub Copilot
- optional state sync via `refs/notes/relay`
- optional SSH alias reachability probes
- secret-safe local state defaults
- zero-dependency Node.js CLI
