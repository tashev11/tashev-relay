const MASK = '[REDACTED]';

// Word boundaries and the digit check keep ordinary words such as "task-management-..." intact.
const TOKEN_PATTERNS = [
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\bsk-(?=[A-Za-z0-9_-]*[0-9])[A-Za-z0-9_-]{20,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/g,
  /\bAIza[0-9A-Za-z_-]{35}/g,
  /\b[0-9]{8,10}:AA[A-Za-z0-9_-]{30,}/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];

// Only the tight key=value form: "token: refresh rotation" is ordinary task text.
const ASSIGNMENT = /\b(password|passwd|secret|token|api[_-]?key)=(?!\[REDACTED\])[^\s&]+/gi;
const URL_USERINFO = /\b([a-z][a-z0-9+.-]*:\/\/)([^\s/@]+)@/gi;

function dropUserinfo(match, scheme, userinfo) {
  if (/^https?:\/\//i.test(scheme)) return scheme;
  const user = userinfo.split(':')[0];
  return userinfo.includes(':') ? scheme + user + '@' : match;
}

// A credential inside a remote URL is never useful to the next session, so this is unconditional.
export function stripUrlCredentials(url) {
  return typeof url === 'string' ? url.replace(URL_USERINFO, dropUserinfo) : url;
}

export function redactText(text) {
  if (typeof text !== 'string') return text;
  let out = stripUrlCredentials(text);
  for (const pattern of TOKEN_PATTERNS) out = out.replace(pattern, MASK);
  return out.replace(ASSIGNMENT, (match, key) => key + '=' + MASK);
}

export function sanitizeState(state, { redactSecrets = true } = {}) {
  if (!state || typeof state !== 'object') return state;
  const text = (value) => redactSecrets ? redactText(value) : value;
  const git = state.project?.git;
  const task = state.task || {};
  return {
    ...state,
    project: {
      ...state.project,
      git: git ? { ...git, remote: stripUrlCredentials(git.remote), lastCommitMessage: text(git.lastCommitMessage) } : git,
    },
    task: {
      ...task,
      current: text(task.current),
      next: text(task.next),
      notes: Array.isArray(task.notes) ? task.notes.map(text) : [],
    },
  };
}

// What leaves the machine through sync: no hostname and no absolute local path.
export function portableState(state) {
  const { host, ...session } = state.session || {};
  const { root, ...git } = state.project?.git || {};
  return { ...state, project: { ...state.project, git }, session };
}
