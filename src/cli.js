import { resolve } from 'node:path';
import { initProject } from './init.js';
import { projectRoot } from './paths.js';
import { capture, checkpoint, loadState, saveState } from './state.js';
import { createHandoff } from './handoff.js';
import { notePull, noteWrite } from './git.js';
import { runDoctor } from './doctor.js';
import { printDoctor, printHeader, printState } from './render.js';

const VERSION = '0.1.0';

function parse(args) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) out._.push(a);
    else {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = true;
    }
  }
  return out;
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
    console.log('✓ Relay state saved');
    console.log('  ' + (state.project.git?.dirty ? 'Working tree has local changes.' : 'Working tree is clean.'));
    if (opts.sync) {
      if (!state.project.git?.isGit || !state.project.git?.remote) throw new Error('Cannot sync without a Git remote.');
      const r = noteWrite(root, JSON.stringify(state));
      if (!r.ok) throw new Error(r.stderr || r.stdout || 'Sync failed');
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
    if (rows.some(x => !x.ok)) process.exitCode = 2;
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
      const r = noteWrite(root, JSON.stringify(state));
      if (!r.ok) throw new Error(r.stderr || r.stdout || 'Sync failed');
      console.log('✓ Relay state pushed to origin');
      if (state.project.git?.dirty) console.log('! Context synced, but uncommitted code is still only on this machine.');
      return;
    }
    if (action === 'pull') {
      const r = notePull(root);
      if (!r.ok) throw new Error(r.error);
      saveState(root, r.state);
      console.log('✓ Relay state pulled from origin');
      return;
    }
    throw new Error('Usage: relay sync <push|pull>');
  }

  help();
}
