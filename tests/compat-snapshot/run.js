#!/usr/bin/env node
/**
 * v2.1 兼容 snapshot 对拍（MULTI-MODULE-PROPOSAL 成功标准 1）
 * ------------------------------------------------------------
 * 用一个冻结的单模块消费仓 fixture（无 modules 分节的 v2.1 config +
 * 已入账 baseline）跑 run-checks.js，stdout+stderr 与 golden 逐字节比对，
 * exit code 必须为 0。多模块 / customGuards / impl-visual 改造落地后，
 * 本对拍保证旧 config 的输出与 exit 语义零漂移。
 *
 * 用法：
 *   node tests/compat-snapshot/run.js            比对（CI 用）
 *   node tests/compat-snapshot/run.js --update   deliberate 更新 golden
 *     （guard 输出的合法演进走这里：更新 golden 与实现同 commit，review 对照）
 *
 * 注意：fixture 的 baseline 是稳态资产（已提交），本对拍绝不重新播种；
 * 若 guard 在比对中生成/改写了 fixture 内文件，视为 FAIL（行为变化的信号）。
 */
import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const KIT_ROOT = path.resolve(SELF_DIR, '..', '..');
const FIXTURE = path.join(SELF_DIR, 'fixture');
const GOLDEN = path.join(SELF_DIR, 'golden-run-checks.txt');
const UPDATE = process.argv.includes('--update');

function fixtureDirty() {
  try {
    return execFileSync('git', ['status', '--porcelain', '--', FIXTURE], {
      cwd: KIT_ROOT, encoding: 'utf8',
    }).trim();
  } catch {
    return ''; // 非 git 环境（bundle 拆包等）跳过脏检查
  }
}

const before = fixtureDirty();

const r = spawnSync(process.execPath, [path.join(KIT_ROOT, 'tools', 'run-checks.js')], {
  cwd: FIXTURE, encoding: 'utf8',
});
const actual = (r.stdout ?? '') + (r.stderr ?? '');

if (UPDATE) {
  writeFileSync(GOLDEN, actual);
  console.log(`[compat-snapshot] golden 已更新（exit=${r.status}）——与触发它的实现变更放同一 commit`);
  process.exit(r.status === 0 ? 0 : 1);
}

let fail = false;

if (r.status !== 0) {
  console.log(`[compat-snapshot] ✗ run-checks exit=${r.status}（期望 0）`);
  fail = true;
}

let golden;
try { golden = readFileSync(GOLDEN, 'utf8'); }
catch {
  console.log(`[compat-snapshot] ✗ 缺 golden：${path.relative(KIT_ROOT, GOLDEN)} —— 先跑 --update 生成`);
  process.exit(1);
}

if (actual !== golden) {
  const aLines = actual.split('\n');
  const gLines = golden.split('\n');
  const n = Math.max(aLines.length, gLines.length);
  let shown = 0;
  console.log('[compat-snapshot] ✗ 输出与 golden 不一致（v2.1 兼容面漂移）。首批差异行：');
  for (let i = 0; i < n && shown < 8; i++) {
    if (aLines[i] !== gLines[i]) {
      console.log(`  L${i + 1} golden: ${gLines[i] ?? '<无此行>'}`);
      console.log(`  L${i + 1} actual: ${aLines[i] ?? '<无此行>'}`);
      shown++;
    }
  }
  console.log('  确认是 deliberate 输出演进时：node tests/compat-snapshot/run.js --update，golden 与实现同 commit。');
  fail = true;
}

const after = fixtureDirty();
if (after !== before) {
  console.log('[compat-snapshot] ✗ 比对运行改写了 fixture 文件（baseline 静默重置/重播种？）：');
  console.log(after);
  fail = true;
}

if (fail) {
  console.log('[compat-snapshot] RESULT: FAIL');
  process.exit(1);
}
console.log('[compat-snapshot] ✓ v2.1 单模块 config：输出逐字节一致 · exit=0 · fixture 未被改写');
console.log('[compat-snapshot] RESULT: PASS');
