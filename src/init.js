import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { ensureDir, writeJson } from './utils.js';
import { relayPaths } from './paths.js';
import { gitRoot, snapshot } from './git.js';

const ignoreLines = ['.relay/state.json', '.relay/HANDOFF.md', '.relay/checkpoints/', '.relay/handoff-*.md'];

export function initProject(root) {
  const p = relayPaths(root);
  ensureDir(p.dir);
  if (!existsSync(p.config)) {
    writeJson(p.config, {
      schemaVersion: 1,
      project: basename(root),
      servers: [],
      security: { redactSecrets: true },
    });
  }

  // Ignore rules only mean something inside a Git repository.
  if (gitRoot(root)) {
    const ignore = join(root, '.gitignore');
    const current = existsSync(ignore) ? readFileSync(ignore, 'utf8') : '';
    const missing = ignoreLines.filter(x => !current.split(/\r?\n/).includes(x));
    if (missing.length) appendFileSync(ignore, (current && !current.endsWith('\n') ? '\n' : '') + missing.join('\n') + '\n');
  }

  const guide = join(p.dir, 'README.md');
  if (!existsSync(guide)) {
    writeFileSync(guide, `# Relay project state

This directory contains safe, portable project metadata.

- \`config.json\` may be committed.
- runtime state, handoffs and checkpoints are ignored.
- secrets, tokens, .env contents and private SSH keys are never read by Relay.

Start with: \`relay save --task "..." --next "..."\`
`);
  }

  return snapshot(root);
}
