import { existsSync } from 'node:fs';
import { exec, relativeAge } from './utils.js';
import { snapshot, remoteHead } from './git.js';
import { loadConfig, loadState } from './state.js';
import { relayPaths } from './paths.js';

export function runDoctor(root) {
  const rows = [];
  const add = (name, ok, detail = '') => rows.push({ name, ok, detail });

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  add('Node.js', nodeMajor >= 18, process.version);

  const g = snapshot(root);
  add('Git repository', g.isGit, g.isGit ? g.branch + ' @ ' + g.shortCommit : 'not detected');
  add('Origin remote', Boolean(g.remote), g.remote || 'missing');

  const gh = exec('gh', ['auth', 'status'], { timeout: 5000 });
  add('GitHub CLI', gh.ok, gh.ok ? 'authenticated' : 'not authenticated / unavailable');

  const p = relayPaths(root);
  add('Relay config', existsSync(p.config), existsSync(p.config) ? 'present' : 'run relay init');

  const state = loadState(root);
  add('Relay state', Boolean(state), state ? 'saved ' + relativeAge(state.savedAt) + ' ago' : 'run relay save');

  if (g.isGit && g.remote && g.branch !== '(detached)') {
    const remote = remoteHead(root, g.branch);
    if (!remote) add('GitHub drift', false, 'remote branch not found or unreachable');
    else if (remote === g.commit) add('GitHub drift', true, 'local matches origin');
    else add('GitHub drift', false, 'local ' + g.shortCommit + ' != origin ' + remote.slice(0, 8));
  }

  if (g.isGit) add('Working tree', !g.dirty, g.dirty ? 'uncommitted changes detected' : 'clean');

  const config = loadConfig(root);
  for (const server of config.servers || []) {
    const alias = String(server.alias || '');
    if (!/^(?!-)[A-Za-z0-9_.@:-]+$/.test(alias)) {
      add('Server ' + (alias || '?'), false, 'invalid alias');
      continue;
    }
    const probe = exec('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=3', alias, 'true'], { timeout: 5000 });
    add('Server ' + alias, probe.ok, probe.ok ? 'reachable' : 'unreachable');
  }
  return rows;
}
