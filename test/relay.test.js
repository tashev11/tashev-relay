import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { initProject } from '../src/init.js';
import { capture, loadState, saveState } from '../src/state.js';
import { runDoctor } from '../src/doctor.js';

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'relay-test-'));
  execSync('git init -q', { cwd: dir });
  execSync('git config user.email test@example.com', { cwd: dir });
  execSync('git config user.name Relay Test', { cwd: dir });
  execSync('git commit --allow-empty -qm init', { cwd: dir });
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
