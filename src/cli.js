import { resolve } from 'node:path';
import { initProject } from './init.js';
import { projectRoot } from './paths.js';
import { capture, checkpoint, loadState, redactionEnabled, saveState } from './state.js';
import { createHandoff } from './handoff.js';
import { notePull, noteWrite } from './git.js';
import { portableState, sanitizeState } from './redact.js';
import { runDoctor } from './doctor.js';
import { printDoctor, printHeader, printState } from './render.js';

const VERSION = '0.1.1';
const VALUE_OPTIONS = new Set(['task', 'next', 'note', 'agent']);

function parse(args) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const eq = a.indexOf('=');
    if (eq > 0) { out[a.slice(2, eq)] = a.slice(eq + 1); continue; }
    const key = a.slice(2);
    const next = args[i + 1];
    if (next !== undefined && !next.startsWith('--')) { out[key] = next; i++; }
    else if (VALUE_OPTIONS.has(key)) throw new Error('Option --' + key + ' needs a value.');
    else out[key] = true;
  }
  return out;
}

function pushState(root, state) {
  const safe = portableState(sanitizeState(state, { redactSecrets: redactionEnabled(root) }));
  const r = noteWrite(root, JSON.stringify(safe));
  if (!r.ok) throw new Error(r.stderr || r.stdout || 'Sync failed');
}

function help() {
  console.log(`Tashev Relay ${VERSION}
Portable project continuity for AI coding agents.

Usage:
  relay init
  relay save [--task "..."] [--next "..."] [--note "..."] [--agent claude] [--sync]
  relay resume [--json]
  relay status
  relay doctor
  relay checkpoint
  relay handoff <claude|codex|cursor|gemini|opencode|copilot> [--stdout]
  relay sync <push|pull>

Examples:
  relay save --task "Fix auth refresh" --next "Run integration tests" --agent claude
  relay handoff codex --stdout
  relay sync push
`);
}

export async function run(argv) {
  const opts = parse(argv);
  const cmd = opts._[0] || 'help';
  if (opts.version || cmd === 'version') return console.log(VERSION);
  if (opts.help || cmd === 'help') return help();

  const root = projectRoot(resolve(process.cwd()));

  if (cmd === 'init') {
    const g = initProject(root);
    printHeader();
    console.log('Initialized ' + root);
    console.log(g.isGit ? 'Git detected: ' + g.branch + ' @ ' + g.shortCommit : 'Warning: no Git repository detected.');
    console.log('Next: relay save --task "..." --next "..."');
    return;
  }

  if (cmd === 'save') {
    initProject(root);
    const state = capture(root, { task: opts.task, next: opts.next, note: opts.note, agent: opts.agent });
    saveState(root, state);
    const g = state.project.git;
    console.log('✓ Relay state saved');
    console.log('  ' + (!g?.isGit ? 'No Git repository here: only the task state was saved.' : g.dirty ? 'Working tree has local changes.' : 'Working tree is clean.'));
    if (opts.sync) {
      if (!g?.isGit || !g?.remote) throw new Error('Cannot sync without a Git remote.');
      pushState(root, state);
      console.log('✓ State synced to origin via refs/notes/relay');
    }
    return;
  }

  if (cmd === 'resume' || cmd === 'status') {
    const state = loadState(root);
    if (!state) throw new Error('No saved state. Run relay save first.');
    if (opts.json) console.log(JSON.stringify(state, null, 2));
    else printState(state);
    return;
  }

  if (cmd === 'doctor') {
    const rows = runDoctor(root);
    printDoctor(rows);
    if (rows.some(x => !x.ok && x.level !== 'warn')) process.exitCode = 2;
    return;
  }

  if (cmd === 'checkpoint') {
    const state = capture(root, {});
    saveState(root, state);
    console.log('✓ Checkpoint ' + checkpoint(root, state));
    return;
  }

  if (cmd === 'handoff') {
    const state = loadState(root);
    if (!state) throw new Error('No saved state. Run relay save first.');
    const result = createHandoff(root, state, opts._[1]);
    if (opts.stdout) console.log(result.instructions);
    else console.log('✓ Handoff created: ' + result.file);
    return;
  }

  if (cmd === 'sync') {
    const action = opts._[1];
    if (action === 'push') {
      const state = loadState(root);
      if (!state) throw new Error('No saved state. Run relay save first.');
      pushState(root, state);
      console.log('✓ Relay state pushed to origin');
      if (state.project.git?.dirty) console.log('! Context synced, but uncommitted code is still only on this machine.');
      return;
    }
    if (action === 'pull') {
      const r = notePull(root);
      if (!r.ok) throw new Error(r.error);
      saveState(root, sanitizeState(r.state, { redactSecrets: redactionEnabled(root) }));
      console.log('✓ Relay state pulled from origin');
      return;
    }
    throw new Error('Usage: relay sync <push|pull>');
  }

  help();
}
