#!/usr/bin/env node
/**
 * 兼容 snapshot 对拍（MULTI-MODULE-PROPOSAL 成功标准 1 与 2）
 * ------------------------------------------------------------
 * 三个冻结的消费仓 fixture 场景，run-checks 输出与 golden 逐字节比对（绝对路径
 * 归一化为 <node>/<kit> 占位）+ exit code 断言 + fixture 防改写检查：
 *
 *   1. fixture/           v2.1 单模块 config（无 modules 分节）——旧行为零漂移
 *   2. fixture-modules/   双模块 profile（模块 layers 子集 / 前缀输出 / 分账 baseline / 公共缺省继承）
 *   3. fixture-migration/ baseline 迁移防线——模块 baseline 缺失且旧全局 baseline 仍在 → 必须 FAIL，
 *                         禁静默重建空债 baseline
 *
 * 用法：
 *   node tests/compat-snapshot/run.js            比对（CI 用）
 *   node tests/compat-snapshot/run.js --update   deliberate 更新全部 golden
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
const UPDATE = process.argv.includes('--update');

const SCENARIOS = [
  { name: 'v2.1 单模块 config', dir: 'fixture', args: [], expectExit: 0, golden: 'golden-run-checks.txt' },
  { name: '多模块 profile', dir: 'fixture-modules', args: [], expectExit: 0, golden: 'golden-run-checks-modules.txt' },
  { name: 'baseline 迁移防线（负向）', dir: 'fixture-migration', args: ['--only', 'check-tokens'], expectExit: 1, golden: 'golden-run-checks-migration.txt' },
  { name: '--only 未知模块 fail closed（负向）', dir: 'fixture-modules', args: ['--only', 'nope/check-tokens'], expectExit: 1, golden: 'golden-run-checks-only-unknown-module.txt' },
  { name: '空 modules 分节（负向）', dir: 'fixture-modules-empty', args: [], expectExit: 1, golden: 'golden-run-checks-modules-empty.txt' },
];

function fixturesDirty() {
  try {
    return execFileSync('git', ['status', '--porcelain', '--', SELF_DIR], {
      cwd: KIT_ROOT, encoding: 'utf8',
    }).trim();
  } catch {
    return ''; // 非 git 环境（bundle 拆包等）跳过脏检查
  }
}

// 机器特定绝对路径归一化（FAIL 修法行会打 node 与 guard 的绝对路径）
const normalize = (s) => s.replaceAll(process.execPath, '<node>').replaceAll(KIT_ROOT, '<kit>');

const before = fixturesDirty();
let fail = false;

for (const sc of SCENARIOS) {
  const goldenPath = path.join(SELF_DIR, sc.golden);
  const r = spawnSync(process.execPath, [path.join(KIT_ROOT, 'tools', 'run-checks.js'), ...sc.args], {
    cwd: path.join(SELF_DIR, sc.dir), encoding: 'utf8',
  });
  const actual = normalize((r.stdout ?? '') + (r.stderr ?? ''));

  if (UPDATE) {
    writeFileSync(goldenPath, actual);
    const exitOk = r.status === sc.expectExit;
    console.log(`[compat-snapshot] golden 已更新：${sc.golden}（exit=${r.status}${exitOk ? '' : `，期望 ${sc.expectExit}——请先修实现`}）`);
    if (!exitOk) fail = true;
    continue;
  }

  if (r.status !== sc.expectExit) {
    console.log(`[compat-snapshot] ✗ ${sc.name}：exit=${r.status}（期望 ${sc.expectExit}）`);
    fail = true;
  }

  let golden;
  try { golden = readFileSync(goldenPath, 'utf8'); }
  catch {
    console.log(`[compat-snapshot] ✗ ${sc.name}：缺 golden ${sc.golden} —— 先跑 --update 生成`);
    fail = true;
    continue;
  }

  if (actual !== golden) {
    const aLines = actual.split('\n');
    const gLines = golden.split('\n');
    const n = Math.max(aLines.length, gLines.length);
    let shown = 0;
    console.log(`[compat-snapshot] ✗ ${sc.name}：输出与 ${sc.golden} 不一致。首批差异行：`);
    for (let i = 0; i < n && shown < 8; i++) {
      if (aLines[i] !== gLines[i]) {
        console.log(`  L${i + 1} golden: ${gLines[i] ?? '<无此行>'}`);
        console.log(`  L${i + 1} actual: ${aLines[i] ?? '<无此行>'}`);
        shown++;
      }
    }
    console.log('  确认是 deliberate 输出演进时：node tests/compat-snapshot/run.js --update，golden 与实现同 commit。');
    fail = true;
  } else {
    console.log(`[compat-snapshot] ✓ ${sc.name}：输出逐字节一致 · exit=${r.status}`);
  }
}

const after = fixturesDirty();
if (!UPDATE && after !== before) {
  console.log('[compat-snapshot] ✗ 比对运行改写了 fixture 文件（baseline 静默重置/重播种？）：');
  console.log(after);
  fail = true;
}

if (fail) {
  console.log('[compat-snapshot] RESULT: FAIL');
  process.exit(1);
}
console.log(`[compat-snapshot] ✓ ${SCENARIOS.length} 个场景全部一致 · fixture 未被改写`);
console.log('[compat-snapshot] RESULT: PASS');
