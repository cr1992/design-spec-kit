#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const KIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(label, cmd, args) {
  console.log(`\n── ${label} ─────────────────────────────`);
  const r = spawnSync(cmd, args, { cwd: KIT_ROOT, stdio: 'inherit' });
  if (r.error) {
    console.error(`${label}: ${r.error.message}`);
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const toolFiles = (await readdir(path.join(KIT_ROOT, 'tools')))
  .filter((name) => name.endsWith('.js'))
  .sort();

for (const file of toolFiles) {
  run(`node --check tools/${file}`, process.execPath, ['--check', path.join('tools', file)]);
}

run('kit-doctor source mode', process.execPath, ['tools/kit-doctor.js', '--source']);
run('run-checks plan', process.execPath, ['tools/run-checks.js', '--list']);
run('bundle drift check', process.execPath, ['tools/build-bundle.js', '--check']);

console.log('\nRESULT: PASS');
