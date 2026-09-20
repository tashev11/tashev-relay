import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { initProject } from '../src/init.js';
import { capture, loadState, saveState } from '../src/state.js';
import { runDoctor } from '../src/doctor.js';
import { portableState, redactText, stripUrlCredentials } from '../src/redact.js';

const bin = fileURLToPath(new URL('../bin/relay.js', import.meta.url));
const relay = (cwd, ...args) => execFileSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8', stdio: 'pipe' });
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' });
// Assembled at runtime so secret scanners do not flag this file.
const fakeToken = 'ghp_' + 'a1B2c3D4'.repeat(5);

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'relay-test-'));
  execSync('git init -q', { cwd: dir });
  execSync('git config user.email test@example.com', { cwd: dir });
  execSync('git config user.name Relay Test', { cwd: dir });
  execSync('git commit --allow-empty -qm init', { cwd: dir });
  return dir;
}

function clone(base, name) {
  git(base, 'clone', '-q', join(base, 'origin.git'), name);
  const dir = join(base, name);
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'user.name', 'Relay Test');
  return dir;
}

test('init creates safe config and ignore rules', () => {
  const dir = repo();
  initProject(dir);
  const config = JSON.parse(readFileSync(join(dir, '.relay/config.json'), 'utf8'));
  assert.equal(config.schemaVersion, 1);
  assert.match(readFileSync(join(dir, '.gitignore'), 'utf8'), /\.relay\/state\.json/);
});

test('save and load preserve task state', () => {
  const dir = repo();
  initProject(dir);
  const state = capture(dir, { task: 'Test task', next: 'Next step', agent: 'codex' });
  saveState(dir, state);
  const loaded = loadState(dir);
  assert.equal(loaded.task.current, 'Test task');
  assert.equal(loaded.task.next, 'Next step');
  assert.equal(loaded.session.agent, 'codex');
});

test('doctor returns structured checks', () => {
  const dir = repo();
  initProject(dir);
  saveState(dir, capture(dir, { task: 'Doctor' }));
  const rows = runDoctor(dir);
  assert.ok(rows.some(x => x.name === 'Git repository' && x.ok));
  assert.ok(rows.some(x => x.name === 'Relay state' && x.ok));
});


test('snapshot does not invent a commit in an unborn repository', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'relay-unborn-'));
  execSync('git init -q', { cwd: dir });
  const { snapshot } = await import('../src/git.js');
  const state = snapshot(dir);
  assert.equal(state.commit, null);
});

test('snapshot keeps the status and name of the first entry', async () => {
  const dir = repo();
  writeFileSync(join(dir, 'README.md'), 'one\n');
  git(dir, 'add', 'README.md');
  git(dir, 'commit', '-qm', 'readme');
  writeFileSync(join(dir, 'README.md'), 'two\n');
  const { snapshot } = await import('../src/git.js');
  const state = snapshot(dir);
  assert.deepEqual(state.changedFiles, ['README.md']);
  assert.deepEqual(state.stagedFiles, []);
});

test('snapshot reports non-ASCII and renamed paths verbatim', async () => {
  const dir = repo();
  writeFileSync(join(dir, 'old.txt'), 'same content\n');
  git(dir, 'add', 'old.txt');
  git(dir, 'commit', '-qm', 'add');
  git(dir, 'mv', 'old.txt', 'new.txt');
  writeFileSync(join(dir, 'заметки проекта.txt'), 'x\n');
  const { snapshot } = await import('../src/git.js');
  const state = snapshot(dir);
  assert.deepEqual(state.untrackedFiles, ['заметки проекта.txt']);
  assert.ok(state.stagedFiles.includes('new.txt'));
  assert.deepEqual([...state.stagedFiles, ...state.changedFiles].filter(f => f !== 'new.txt' && f !== 'old.txt'), []);
});

test('credentials in the origin URL never reach saved state', () => {
  const dir = repo();
  git(dir, 'remote', 'add', 'origin', 'https://oauth2:' + fakeToken + '@github.com/example/repo.git');
  initProject(dir);
  const state = capture(dir, { task: 'Rotate keys', note: 'old token=' + fakeToken });
  saveState(dir, state);
  assert.equal(state.project.git.remote, 'https://github.com/example/repo.git');
  assert.doesNotMatch(readFileSync(join(dir, '.relay/state.json'), 'utf8'), /ghp_/);
  assert.doesNotMatch(readFileSync(join(dir, '.relay/HANDOFF.md'), 'utf8'), /ghp_/);
});

test('remote URLs keep their user but lose their secret', () => {
  assert.equal(stripUrlCredentials('git@github.com:user/repo.git'), 'git@github.com:user/repo.git');
  assert.equal(stripUrlCredentials('ssh://git@github.com/user/repo.git'), 'ssh://git@github.com/user/repo.git');
  assert.equal(stripUrlCredentials('ssh://deploy:pw@host/repo.git'), 'ssh://deploy@host/repo.git');
  assert.equal(stripUrlCredentials('https://' + fakeToken + '@github.com/a/b.git'), 'https://github.com/a/b.git');
});

test('redactSecrets masks tokens in text and can be switched off', () => {
  assert.equal(redactText('use ' + fakeToken + ' now'), 'use [REDACTED] now');
  assert.equal(redactText('password=hunter2 for db'), 'password=[REDACTED] for db');
  assert.equal(redactText('Fix token: refresh rotation in task-management-improvements'), 'Fix token: refresh rotation in task-management-improvements');

  const dir = repo();
  initProject(dir);
  const file = join(dir, '.relay/config.json');
  const config = JSON.parse(readFileSync(file, 'utf8'));
  writeFileSync(file, JSON.stringify({ ...config, security: { redactSecrets: false } }));
  assert.equal(capture(dir, { task: 'keep ' + fakeToken }).task.current, 'keep ' + fakeToken);
});

test('synced state leaves hostname and local path behind', () => {
  const dir = repo();
  initProject(dir);
  const state = capture(dir, { task: 'Sync me' });
  assert.ok(state.session.host);
  assert.ok(state.project.git.root);
  const sent = portableState(state);
  assert.equal(sent.session.host, undefined);
  assert.equal(sent.project.git.root, undefined);
  assert.equal(sent.task.current, 'Sync me');
  assert.equal(sent.project.git.branch, state.project.git.branch);
});

test('value options reject a missing value', () => {
  const dir = repo();
  assert.throws(() => relay(dir, 'save', '--task'), (error) => /--task needs a value/.test(String(error.stderr)));
  relay(dir, 'save', '--task=Inline value');
  assert.equal(loadState(dir).task.current, 'Inline value');
});

test('outside Git no ignore file is created', () => {
  const dir = mkdtempSync(join(tmpdir(), 'relay-plain-'));
  initProject(dir);
  assert.ok(existsSync(join(dir, '.relay/config.json')));
  assert.equal(existsSync(join(dir, '.gitignore')), false);
});

test('doctor only warns about files Relay created itself', () => {
  const dir = repo();
  initProject(dir);
  saveState(dir, capture(dir, { task: 'Doctor' }));
  const tree = runDoctor(dir).find(x => x.name === 'Working tree');
  assert.equal(tree.ok, false);
  assert.equal(tree.level, 'warn');
  assert.match(tree.detail, /only Relay files/);
});

test('two machines can sync in any order', () => {
  const base = mkdtempSync(join(tmpdir(), 'relay-sync-'));
  git(base, 'init', '-q', '--bare', '--initial-branch=main', 'origin.git');
  const a = clone(base, 'a');
  git(a, 'checkout', '-q', '-B', 'main');
  git(a, 'commit', '--allow-empty', '-qm', 'init');
  git(a, 'push', '-q', 'origin', 'main');
  const b = clone(base, 'b');

  relay(a, 'save', '--task', 'From A', '--next', 'Continue on B');
  relay(a, 'sync', 'push');
  relay(b, 'sync', 'pull');
  assert.equal(loadState(b).task.current, 'From A');

  relay(a, 'save', '--task', 'A again');
  relay(a, 'sync', 'push');
  relay(b, 'save', '--task', 'B without pulling');
  relay(b, 'sync', 'push');
  relay(a, 'sync', 'pull');
  assert.equal(loadState(a).task.current, 'B without pulling');
  assert.doesNotMatch(git(a, 'notes', '--ref=relay', 'show', 'HEAD'), /"host"|"root"/);
});
