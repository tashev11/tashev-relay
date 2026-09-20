import { join } from 'node:path';
import { gitRoot } from './git.js';

export function projectRoot(cwd = process.cwd()) {
  return gitRoot(cwd) || cwd;
}

export function relayPaths(root) {
  const dir = join(root, '.relay');
  return {
    dir,
    config: join(dir, 'config.json'),
    state: join(dir, 'state.json'),
    handoff: join(dir, 'HANDOFF.md'),
    checkpoints: join(dir, 'checkpoints'),
  };
}
