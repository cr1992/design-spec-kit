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
  .map((name) => path.join('tools', name))
  .sort();

for (const file of toolFiles) {
  run(`node --check ${file}`, process.execPath, ['--check', file]);
}

async function collectExtensionJs(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(path.join(KIT_ROOT, dir), { withFileTypes: true }); }
  catch { return out; }
  for (const entry of entries) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectExtensionJs(rel));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(rel);
  }
  return out.sort();
}

for (const file of await collectExtensionJs('extensions')) {
  run(`node --check ${file}`, process.execPath, ['--check', file]);
}

run('kit-doctor source mode', process.execPath, ['tools/kit-doctor.js', '--source']);
run('run-checks plan', process.execPath, ['tools/run-checks.js', '--list']);
run('bundle drift check', process.execPath, ['tools/build-bundle.js', '--check']);

console.log('\nRESULT: PASS');
