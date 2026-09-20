import { exec } from './utils.js';

export function gitRoot(cwd = process.cwd()) {
  const r = exec('git', ['rev-parse', '--show-toplevel'], { cwd });
  return r.ok ? r.stdout : null;
}

export function git(cwd, args, timeout = 8000) {
  return exec('git', args, { cwd, timeout });
}

export function snapshot(cwd) {
  const root = gitRoot(cwd);
  if (!root) return { isGit: false };

  const branch = git(root, ['branch', '--show-current']).stdout || '(detached)';
  const commitResult = git(root, ['rev-parse', 'HEAD']);
  const commit = commitResult.ok ? commitResult.stdout : null;
  const shortCommit = commit ? commit.slice(0, 8) : null;
  const remote = git(root, ['remote', 'get-url', 'origin']).stdout || null;
  const porcelain = git(root, ['status', '--porcelain=v1']).stdout;
  const lines = porcelain ? porcelain.split('\n').filter(Boolean) : [];

  const staged = [];
  const changed = [];
  const untracked = [];
  for (const line of lines) {
    const x = line[0], y = line[1], file = line.slice(3).trim();
    if (x === '?' && y === '?') untracked.push(file);
    else {
      if (x && x !== ' ') staged.push(file);
      if (y && y !== ' ') changed.push(file);
    }
  }

  const last = git(root, ['log', '-1', '--pretty=%s']).stdout || null;
  return {
    isGit: true, root, branch, commit, shortCommit, remote,
    dirty: lines.length > 0,
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

export function noteWrite(root, json) {
  const add = git(root, ['notes', '--ref=relay', 'add', '-f', '-m', json, 'HEAD'], 12000);
  if (!add.ok) return add;
  return git(root, ['push', 'origin', 'refs/notes/relay'], 20000);
}

export function notePull(root) {
  const fetch = git(root, ['fetch', 'origin', 'refs/notes/relay:refs/notes/relay'], 20000);
  if (!fetch.ok) return { ok: false, error: fetch.stderr || fetch.stdout };
  const show = git(root, ['notes', '--ref=relay', 'show', 'HEAD']);
  if (!show.ok) return { ok: false, error: show.stderr || 'No Relay state for current commit.' };
  try { return { ok: true, state: JSON.parse(show.stdout) }; }
  catch { return { ok: false, error: 'Remote Relay note is not valid JSON.' }; }
}
