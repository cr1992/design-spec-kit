#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
// compat snapshot 是 kit 源仓 CI 资产，不进 bundle（fixture 的稳态 *.baseline.json
// 被 bundle 排除规则挡住，硬纳入会让拆包环境必然 FAIL）。bundle 拆包后无 tests/ → 明确 skip。
if (existsSync(path.join(KIT_ROOT, 'tests/compat-snapshot/run.js'))) {
  run('v2.1 compat snapshot', process.execPath, ['tests/compat-snapshot/run.js']);
} else {
  console.log('\n── v2.1 compat snapshot ─────────────────────────────');
  console.log('· 跳过：tests/ 不随 bundle 分发（source-only 检查，kit 源仓 CI 才跑）');
}
if (existsSync(path.join(KIT_ROOT, 'tests/design-sync/run.js'))) {
  run('design-sync engine unit', process.execPath, ['tests/design-sync/run.js']);
} else {
  console.log('\n── design-sync engine unit ─────────────────────────────');
  console.log('· 跳过：tests/ 不随 bundle 分发（source-only 检查，kit 源仓 CI 才跑）');
}
if (existsSync(path.join(KIT_ROOT, 'tests/glob-semantics/run.js'))) {
  run('coverage glob semantics unit', process.execPath, ['tests/glob-semantics/run.js']);
} else {
  console.log('\n── coverage glob semantics unit ─────────────────────────────');
  console.log('· 跳过：tests/ 不随 bundle 分发（source-only 检查，kit 源仓 CI 才跑）');
}
run('bundle drift check', process.execPath, ['tools/build-bundle.js', '--check']);

console.log('\nRESULT: PASS');
