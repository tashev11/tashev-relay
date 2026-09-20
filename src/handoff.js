import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { relayPaths } from './paths.js';
import { renderHandoff } from './state.js';

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
  const instructions = `You are continuing an existing software-development session.

1. Read the project state below before changing files.
2. Inspect the current Git status and verify it still matches the saved state.
3. Do not overwrite unrelated local changes.
4. Never read or print .env values, tokens, private keys, cookies, or credentials.
5. Continue from the documented next step. If the state has drifted, report the drift first.

Target agent: ${agents[key]}

${renderHandoff(state)}
`;
  const file = join(relayPaths(root).dir, 'handoff-' + key + '.md');
  writeFileSync(file, instructions, 'utf8');
  return { file, instructions };
}
