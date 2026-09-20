import { exec } from './utils.js';
import { stripUrlCredentials } from './redact.js';

const INCOMING = 'refs/notes/relay-incoming';

export function gitRoot(cwd = process.cwd()) {
  const r = exec('git', ['rev-parse', '--show-toplevel'], { cwd });
  return r.ok ? r.stdout : null;
}

export function git(cwd, args, timeout = 8000, options = {}) {
  return exec('git', args, { ...options, cwd, timeout });
}

export function snapshot(cwd) {
  const root = gitRoot(cwd);
  if (!root) return { isGit: false };

  const branch = git(root, ['branch', '--show-current']).stdout || '(detached)';
  const commitResult = git(root, ['rev-parse', 'HEAD']);
  const commit = commitResult.ok ? commitResult.stdout : null;
  const shortCommit = commit ? commit.slice(0, 8) : null;
  const remote = stripUrlCredentials(git(root, ['remote', 'get-url', 'origin']).stdout || null);
  // -z keeps the status columns of the first entry and never quotes non-ASCII paths.
  const porcelain = git(root, ['status', '--porcelain=v1', '-z'], 8000, { trim: false }).stdout;
  const entries = porcelain.split('\0').filter(Boolean);

  const staged = [];
  const changed = [];
  const untracked = [];
  let count = 0;
  for (let i = 0; i < entries.length; i++) {
    const x = entries[i][0], y = entries[i][1], file = entries[i].slice(3);
    if ('RC'.includes(x) || 'RC'.includes(y)) i++; // the following entry is the path it came from
    count++;
    if (x === '?' && y === '?') untracked.push(file);
    else {
      if (x && x !== ' ') staged.push(file);
      if (y && y !== ' ') changed.push(file);
    }
  }

  const last = git(root, ['log', '-1', '--pretty=%s']).stdout || null;
  return {
    isGit: true, root, branch, commit, shortCommit, remote,
    dirty: count > 0,
    changedFiles: [...new Set(changed)],
    stagedFiles: [...new Set(staged)],
    untrackedFiles: [...new Set(untracked)],
    lastCommitMessage: last,
  };
}

export function remoteHead(root, branch) {
  if (!root || !branch || branch === '(detached)') return null;
  const r = git(root, ['ls-remote', 'origin', 'refs/heads/' + branch], 10000);
  if (!r.ok || !r.stdout) return null;
  return r.stdout.split(/\s+/)[0] || null;
}

// Notes written from other machines are merged in first, so a push stays a fast-forward.
function mergeIncoming(root, strategy) {
  const fetch = git(root, ['fetch', 'origin', '+refs/notes/relay:' + INCOMING], 20000);
  if (!fetch.ok) return fetch;
  const merge = git(root, ['notes', '--ref=relay', 'merge', '-s', strategy, INCOMING], 12000);
  git(root, ['update-ref', '-d', INCOMING]);
  return merge;
}

export function noteWrite(root, json) {
  const add = git(root, ['notes', '--ref=relay', 'add', '-f', '-m', json, 'HEAD'], 12000);
  if (!add.ok) return add;
  // A failed fetch usually means origin has no Relay notes yet; the push reports real problems.
  mergeIncoming(root, 'ours');
  return git(root, ['push', 'origin', 'refs/notes/relay'], 20000);
}

export function notePull(root) {
  const listed = git(root, ['ls-remote', 'origin', 'refs/notes/relay'], 10000);
  if (listed.ok && !listed.stdout) return { ok: false, error: 'No Relay state on origin yet. Run relay sync push on the other machine first.' };
  const merged = mergeIncoming(root, 'theirs');
  if (!merged.ok) return { ok: false, error: merged.stderr || merged.stdout };
  const show = git(root, ['notes', '--ref=relay', 'show', 'HEAD']);
  if (!show.ok) return { ok: false, error: show.stderr || 'No Relay state for current commit.' };
  try { return { ok: true, state: JSON.parse(show.stdout) }; }
  catch { return { ok: false, error: 'Remote Relay note is not valid JSON.' }; }
}
