#!/usr/bin/env node
import { access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const KIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hookPath = path.join(KIT_ROOT, '.githooks', 'pre-commit');

try {
  await access(hookPath);
} catch {
  console.error('missing .githooks/pre-commit');
  process.exit(1);
}

const r = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: KIT_ROOT,
  stdio: 'inherit',
});
if (r.error) {
  console.error(r.error.message);
  process.exit(1);
}
if (r.status !== 0) process.exit(r.status ?? 1);
console.log('git hooks installed: core.hooksPath=.githooks');
