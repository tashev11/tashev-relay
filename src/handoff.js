import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { relayPaths } from './paths.js';
import { redactionEnabled, renderHandoff } from './state.js';
import { sanitizeState } from './redact.js';

const agents = {
  claude: 'Claude Code',
  codex: 'OpenAI Codex',
  cursor: 'Cursor',
  gemini: 'Gemini CLI',
  opencode: 'OpenCode',
  copilot: 'GitHub Copilot',
};

export function createHandoff(root, state, agent) {
  const key = String(agent || '').toLowerCase();
  if (!agents[key]) throw new Error('Unknown agent. Try: ' + Object.keys(agents).join(', '));
  // A state file written by an older Relay may still hold unmasked text.
  const safe = sanitizeState(state, { redactSecrets: redactionEnabled(root) });
  const instructions = `You are continuing an existing software-development session.

1. Read the project state below before changing files.
2. Inspect the current Git status and verify it still matches the saved state.
3. Do not overwrite unrelated local changes.
4. Never read or print .env values, tokens, private keys, cookies, or credentials.
5. Continue from the documented next step. If the state has drifted, report the drift first.

Target agent: ${agents[key]}

${renderHandoff(safe)}
`;
  const file = join(relayPaths(root).dir, 'handoff-' + key + '.md');
  writeFileSync(file, instructions, 'utf8');
  return { file, instructions };
}
