#!/usr/bin/env node
/**
 * 兼容 snapshot 对拍（MULTI-MODULE-PROPOSAL 成功标准 1 与 2）
 * ------------------------------------------------------------
 * 一组冻结的消费仓 fixture 场景（见下方 SCENARIOS 表，正向 + 负向），run-checks 输出
 * 与 golden 逐字节比对（绝对路径归一化为 <node>/<kit> 占位）+ exit code 断言 + fixture
 * 防改写检查。覆盖面：v2.1 单模块零漂移、多模块 profile、baseline 迁移防线、--only
 * fail closed、空 modules、customGuards 判定契约、impl-visual matcher 契约
 * （config-only / execute 端到端 / reporter 与 regex 校验负向）。
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
  { name: 'ghost-classes 层正向（存量幽灵类走 baseline，PASS）', dir: 'fixture-ghost-classes', args: ['--only', 'check-ghost-classes'], expectExit: 0, golden: 'golden-run-checks-ghost-pass.txt' },
  { name: 'ghost-classes 新增幽灵类（负向）', dir: 'fixture-ghost-classes-fail', args: ['--only', 'check-ghost-classes'], expectExit: 1, golden: 'golden-run-checks-ghost-fail.txt' },
  { name: 'customGuards 正向（RESULT: PASS）', dir: 'fixture-custom-guards', args: ['--only', 'project-echo'], expectExit: 0, golden: 'golden-run-checks-custom-pass.txt' },
  { name: 'customGuards 否决语义（exit 0 + RESULT: FAIL，负向）', dir: 'fixture-custom-guards', args: ['--only', 'project-veto'], expectExit: 1, golden: 'golden-run-checks-custom-veto.txt' },
  { name: 'customGuards 不可翻案（exit 非零 + RESULT: PASS，负向）', dir: 'fixture-custom-guards', args: ['--only', 'project-liar'], expectExit: 1, golden: 'golden-run-checks-custom-liar.txt' },
  { name: 'customGuards 无 RESULT 行按退出码（正向）', dir: 'fixture-custom-guards', args: ['--only', 'project-noresult'], expectExit: 0, golden: 'golden-run-checks-custom-noresult.txt' },
  { name: 'customGuards 缺 module 两态契约（负向）', dir: 'fixture-custom-no-module', args: [], expectExit: 1, golden: 'golden-run-checks-custom-no-module.txt' },
  { name: 'impl-visual config-only（playwright-list 声明）', dir: 'fixture-impl-visual', args: [], expectExit: 0, golden: 'golden-run-checks-implvisual-config.txt' },
  { name: 'impl-visual --execute-impl（matcher 端到端：ANSI 剥离 + regex 覆盖）', dir: 'fixture-impl-visual', args: ['--execute-impl'], expectExit: 0, golden: 'golden-run-checks-implvisual-exec.txt' },
  { name: 'impl-visual --execute-impl 缺 evidence（负向）', dir: 'fixture-impl-visual-miss', args: ['--execute-impl'], expectExit: 1, golden: 'golden-run-checks-implvisual-miss.txt' },
  { name: 'impl-visual 单条 evidence 覆盖 matcher 的 reporter 要求（负向）', dir: 'fixture-impl-visual-badreporter', args: [], expectExit: 1, golden: 'golden-run-checks-implvisual-badreporter.txt' },
  { name: 'impl-visual config-only 拦非法 regex pattern（负向）', dir: 'fixture-impl-visual-badregex', args: [], expectExit: 1, golden: 'golden-run-checks-implvisual-badregex.txt' },
  { name: 'impl-visual 待登记队列 + staticEvidence:warn 显式降级 + exempt 生效/失效（warning，PASS）', dir: 'fixture-impl-visual-pending', args: [], expectExit: 0, golden: 'golden-run-checks-implvisual-pending.txt' },
  { name: 'impl-visual evidence 静态失配默认 FAIL（v2.7.0，负向）', dir: 'fixture-impl-visual-staticfail', args: [], expectExit: 1, golden: 'golden-run-checks-implvisual-staticfail.txt' },
  { name: 'impl-visual exempt 缺 note fail closed（负向）', dir: 'fixture-impl-visual-badexempt', args: [], expectExit: 1, golden: 'golden-run-checks-implvisual-badexempt.txt' },
  { name: 'impl-visual command 引用文件不存在默认 FAIL（v2.7.0，负向）', dir: 'fixture-impl-visual-gonefile', args: [], expectExit: 1, golden: 'golden-run-checks-implvisual-gonefile.txt' },
  { name: 'impl-visual 显式 manifestDir 不可读 fail closed（负向）', dir: 'fixture-impl-visual-badmanifestdir', args: [], expectExit: 1, golden: 'golden-run-checks-implvisual-badmanifestdir.txt' },
  { name: 'impl-visual 引号包裹的缺失文件同级 FAIL（v2.7.0，负向）', dir: 'fixture-impl-visual-quotedgone', args: [], expectExit: 1, golden: 'golden-run-checks-implvisual-quotedgone.txt' },
  { name: 'check-deviation 契约已入树仍 open 裁决期限到（v2.7.0，负向）', dir: 'fixture-deviation-frozen', args: ['--only', 'web-console/check-deviation'], expectExit: 1, golden: 'golden-run-checks-deviation-frozen.txt' },
  { name: 'impl-visual 缺省 manifestDir ENOTDIR fail closed（负向）', dir: 'fixture-impl-visual-defaultnotdir', args: [], expectExit: 1, golden: 'golden-run-checks-implvisual-defaultnotdir.txt' },
  { name: 'manifest coverage 缺口 + exempt 失效挂 warning（PASS）', dir: 'fixture-manifest-coverage', args: ['--only', 'check-manifest'], expectExit: 0, golden: 'golden-run-checks-coverage.txt' },
  { name: 'manifest coverage exempt 缺 note fail closed（负向）', dir: 'fixture-manifest-coverage-bad', args: ['--only', 'check-manifest'], expectExit: 1, golden: 'golden-run-checks-coverage-badexempt.txt' },
  { name: 'manifest coverage designRoot 不可读 fail closed（负向）', dir: 'fixture-manifest-coverage-badroot', args: ['--only', 'check-manifest'], expectExit: 1, golden: 'golden-run-checks-coverage-badroot.txt' },
  { name: 'manifest coverage glob 零匹配 fail closed（负向）', dir: 'fixture-manifest-coverage-emptyglob', args: ['--only', 'check-manifest'], expectExit: 1, golden: 'golden-run-checks-coverage-emptyglob.txt' },
  { name: 'impl-visual execute 失败带输出尾部（>40 行截尾，负向）', dir: 'fixture-impl-visual-execfail', args: ['--execute-impl'], expectExit: 1, golden: 'golden-run-checks-implvisual-execfail.txt' },
  { name: 'run-checks --json 机读汇总（多模块）', dir: 'fixture-modules', args: ['--json'], expectExit: 0, golden: 'golden-run-checks-modules-json.txt' },
  { name: 'manifest-sync --check 同步校验', dir: 'fixture-manifest-sync', tool: 'tools/manifest-sync.js', args: ['--check'], expectExit: 0, golden: 'golden-manifest-sync-check.txt' },
  { name: 'manifest-sync --check 漂移（负向）', dir: 'fixture-manifest-sync-drift', tool: 'tools/manifest-sync.js', args: ['--check'], expectExit: 1, golden: 'golden-manifest-sync-drift.txt' },
  { name: '--json 全路径：--only 未匹配走 JSON 失败（负向）', dir: 'fixture-modules', args: ['--json', '--only', 'nope/check-tokens'], expectExit: 1, golden: 'golden-run-checks-json-only-fail.txt' },
  { name: '--json 全路径：config 失败走 JSON（负向）', dir: 'fixture-custom-no-module', args: ['--json'], expectExit: 1, golden: 'golden-run-checks-json-config-fail.txt' },
  { name: 'manifest-sync --module 缺值 fail closed（负向）', dir: 'fixture-manifest-sync', tool: 'tools/manifest-sync.js', args: ['--check', '--module'], expectExit: 1, golden: 'golden-manifest-sync-module-missing.txt' },
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
  const r = spawnSync(process.execPath, [path.join(KIT_ROOT, sc.tool ?? 'tools/run-checks.js'), ...sc.args], {
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
