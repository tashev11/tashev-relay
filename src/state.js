import os from 'node:os';
import { join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { ensureDir, nowIso, readJson, writeJson } from './utils.js';
import { snapshot } from './git.js';
import { relayPaths } from './paths.js';

export function loadState(root) {
  return readJson(relayPaths(root).state, null);
}

export function loadConfig(root) {
  return readJson(relayPaths(root).config, {
    schemaVersion: 1,
    project: root.split('/').pop(),
    servers: [],
  });
}

export function capture(root, updates = {}) {
  const prev = loadState(root) || {};
  const git = snapshot(root);
  return {
    schemaVersion: 1,
    savedAt: nowIso(),
    project: {
      name: loadConfig(root).project || root.split('/').pop(),
      git,
    },
    task: {
      current: updates.task ?? prev.task?.current ?? '',
      next: updates.next ?? prev.task?.next ?? '',
      notes: updates.note ? [...(prev.task?.notes || []), updates.note].slice(-20) : (prev.task?.notes || []),
    },
    session: {
      agent: updates.agent ?? prev.session?.agent ?? process.env.RELAY_AGENT ?? 'unknown',
      host: os.hostname(),
      platform: process.platform,
      node: process.version,
    },
  };
}

export function saveState(root, state) {
  const p = relayPaths(root);
  ensureDir(p.dir);
  writeJson(p.state, state);
  writeFileSync(p.handoff, renderHandoff(state), 'utf8');
}

export function checkpoint(root, state) {
  const p = relayPaths(root);
  ensureDir(p.checkpoints);
  const id = state.savedAt.replace(/[:.]/g, '-');
  writeJson(join(p.checkpoints, id + '.json'), state);
  return id;
}

export function renderHandoff(state) {
  const g = state.project?.git || {};
  const list = (items) => items?.length ? items.map(x => '- ' + x).join('\n') : '- none';
  return `# Relay Handoff

Saved: ${state.savedAt}
Agent: ${state.session?.agent || 'unknown'}
Host: ${state.session?.host || 'unknown'}

## Current task
${state.task?.current || 'Not set.'}

## Next step
${state.task?.next || 'Not set.'}

## Git
- Branch: ${g.branch || 'n/a'}
- Commit: ${g.shortCommit || 'n/a'}
- Dirty: ${g.dirty ? 'yes' : 'no'}
- Remote: ${g.remote || 'n/a'}

## Changed files
${list(g.changedFiles)}

## Staged files
${list(g.stagedFiles)}

## Untracked files
${list(g.untrackedFiles)}

## Notes
${list(state.task?.notes)}
`;
}

export function readHandoff(root) {
  try { return readFileSync(relayPaths(root).handoff, 'utf8'); }
  catch { return null; }
}
