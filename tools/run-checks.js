#!/usr/bin/env node
/**
 * run-checks.js · guard 聚合入口（design-spec-kit · 与平台无关）
 *
 * node-only；沙箱用户逐个跑 guard 即可（每个 guard 自带双环境头，本文件不需要）。
 *
 * 守什么：把「跑没跑全部 guard」从人肉记忆变成一条命令——按「已启用层」串跑 guard，
 * 汇总每个 guard 的末行 RESULT 与退出码；任一 FAIL（或启用层缺 guard 文件）→ 总退出码 1。
 *
 * 层感知（防「整目录拷入 → 可选 guard 被误跑」）：tools/ 可以整目录拷入，本文件只跑
 * INSTALLED_LAYERS 启用层的 guard；未启用层的 guard 文件留在目录里会被明确「跳过」，
 * 不在任何层清单里的 check-*.js 视为项目自定义 guard，默认照跑。
 * ★INSTALLED_LAYERS 是全 kit 的单一真源——kit-doctor 也从本文件读取它，别在别处另配。
 *
 * 怎么跑：
 *   node tools/run-checks.js              串跑启用层 guard
 *   node tools/run-checks.js --list       只列将跑/跳过/缺失，不执行
 *   node tools/run-checks.js --only check-tokens   只跑一个（无视层开关；带不带 .js 都行）
 *   node tools/run-checks.js --all        无视层开关跑全部存在的 guard
 * ═════════════════════════════════════════════════════════════*/

import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';

// ─── 配置 ──────────────────────────────────────────────────────
const args = [];   // 沙箱手改位（本文件 node-only，一般留空，走 process.argv）

// ★必改：本实例启用的层（全 kit 单一真源，kit-doctor 从这里读）。
// 'base' 恒装；项目有 i18n 机制加 'i18n'；装了还原交接层（HANDOFF）加 'handoff'。
const INSTALLED_LAYERS = ['base'];

// 各层的 guard 清单（新增层在这里补一行；不在任何层里的 check-*.js = 自定义 guard，默认照跑）
const LAYER_GUARDS = {
  base:    ['check-tokens.js', 'check-icons.js', 'check-changelog.js', 'check-orphan-css.js'],
  i18n:    ['check-i18n.js'],
  handoff: ['check-manifest.js', 'check-deviation.js'],
};

const GUARD_PATTERN = /^check-.+\.js$/i;          // guard 文件命名约定
const EXCLUDE = new Set([]);                       // 需要排除的具体文件名（留空即可）

const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);

// ─── 定位 guard 目录 = 本脚本自身所在目录 ───────────────────────
const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));

async function discoverGuards() {
  let entries;
  try { entries = await readdir(SELF_DIR); } catch { entries = []; }
  return entries
    .filter(name => GUARD_PATTERN.test(name) && !EXCLUDE.has(name))
    .filter(name => !name.endsWith('.baseline.json'))
    .sort();
}

function parseFlags(argv) {
  const flags = { list: false, only: null, all: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') flags.list = true;
    else if (a === '--all') flags.all = true;
    else if (a === '--only') flags.only = argv[++i] || null;
    else if (a.startsWith('--only=')) flags.only = a.slice('--only='.length);
  }
  return flags;
}

// 按层把「存在的 guard」分成三份：将跑 / 跳过（属已知但未启用的层）/ 启用层缺文件。
function planByLayers(present, all) {
  const layerOf = new Map();                                        // 文件名 -> 所属层
  for (const [layer, files] of Object.entries(LAYER_GUARDS)) for (const f of files) layerOf.set(f, layer);
  const enabled = new Set(INSTALLED_LAYERS.flatMap(l => LAYER_GUARDS[l] || []));
  const run = [], skipped = [];
  for (const g of present) {
    if (all || enabled.has(g) || !layerOf.has(g)) run.push(g);      // 启用层 / 自定义 guard 照跑
    else skipped.push({ file: g, layer: layerOf.get(g) });
  }
  const missing = all ? [] : [...enabled].filter(g => !present.includes(g)).sort();
  return { run, skipped, missing };
}

function normalizeGuardName(n) {
  return n.endsWith('.js') ? n.slice(0, -3) : n;
}

// 子进程跑一个 guard，cwd 继承调用方 cwd（不是 SELF_DIR）——guard 的相对路径配置
// （SCAN_ROOTS 等）都是相对项目 cwd 写的。
function runOne(guardFile) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(SELF_DIR, guardFile)], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { out += d.toString(); });
    child.on('close', code => resolve({ guardFile, code, out }));
    child.on('error', err => resolve({ guardFile, code: 1, out: `spawn error: ${err.message}` }));
  });
}

function lastResultLine(out) {
  const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^RESULT:\s*(PASS|FAIL)/.test(lines[i])) return lines[i];
  }
  return null;
}

// ─── Main ────────────────────────────────────────────────────

const flags = parseFlags(EFFECTIVE_ARGS);
const present = await discoverGuards();
const plan = planByLayers(present, flags.all);
let guards = plan.run;

if (present.length === 0) {
  console.log(`✗ ${SELF_DIR} 下没找到任何 check-*.js —— 至少应装 guard①（check-tokens.js）`);
  console.log(`修法：确认已把 tools/ 下的 guard 文件从 kit 拷入本项目`);
  console.log('RESULT: FAIL');
  process.exitCode = 1;
} else {
  if (flags.only) {
    const want = normalizeGuardName(flags.only);
    const matched = present.filter(g => normalizeGuardName(g) === want);   // --only 无视层开关
    if (matched.length === 0) {
      console.log(`✗ --only ${flags.only} 未匹配到任何 guard（存在：${present.map(normalizeGuardName).join(', ')}）`);
      console.log('RESULT: FAIL');
      process.exitCode = 1;
      guards = [];
    } else {
      guards = matched;
      plan.skipped = []; plan.missing = [];
    }
  }

  if (flags.list) {
    console.log(`启用层 [${INSTALLED_LAYERS.join(', ')}]${flags.all ? '（--all 无视层开关）' : ''} · 将跑 ${guards.length} 个 guard（目录：${SELF_DIR}）：`);
    for (const g of guards) console.log(`  - ${g}`);
    for (const s of plan.skipped) console.log(`  · 跳过 ${s.file}（属未启用层 '${s.layer}'——启用改本文件顶部 INSTALLED_LAYERS）`);
    for (const m of plan.missing) console.log(`  ✗ 缺失 ${m}（启用层期望但文件不在——从 kit 拷入或关掉该层）`);
    console.log(plan.missing.length ? 'RESULT: FAIL' : 'RESULT: PASS');
    if (plan.missing.length) process.exitCode = 1;
  } else if (guards.length > 0) {
    console.log(`聚合入口：启用层 [${INSTALLED_LAYERS.join(', ')}]${flags.all ? '（--all）' : ''} · 串跑 ${guards.length} 个 guard`);
    for (const s of plan.skipped) console.log(`  · 跳过 ${s.file}（未启用层 '${s.layer}'）`);
    console.log('');
    const results = [];
    for (const g of guards) {
      console.log(`── ${g} ──────────────────────────────`);
      const r = await runOne(g);
      const prefixed = r.out.split('\n').map(l => l ? `[${normalizeGuardName(g)}] ${l}` : l).join('\n');
      process.stdout.write(prefixed.endsWith('\n') ? prefixed : prefixed + '\n');
      results.push({ ...r, resultLine: lastResultLine(r.out) });
    }

    console.log('\n════════ 汇总 ════════');
    let anyFail = false;
    for (const r of results) {
      const verdict = r.resultLine || `(未打印 RESULT，退出码 ${r.code})`;
      const failed = r.code !== 0 || (r.resultLine && r.resultLine.includes('FAIL')) || !r.resultLine;
      if (failed) anyFail = true;
      console.log(`  ${failed ? '✗' : '✓'} ${normalizeGuardName(r.guardFile)}  exit=${r.code}  ${verdict}`);
    }
    for (const m of plan.missing) {
      anyFail = true;
      console.log(`  ✗ ${normalizeGuardName(m)}  缺失（启用层期望但文件不在 tools/——从 kit 拷入，或在本文件顶部关掉该层）`);
    }

    if (anyFail) {
      console.log(`\n修法：上面标 ✗ 的逐个单跑 \`node tools/${results.find(r => r.code !== 0 || !r.resultLine || (r.resultLine||'').includes('FAIL'))?.guardFile}\` 看详细违规再修`);
      console.log('\nRESULT: FAIL');
      process.exitCode = 1;
    } else {
      console.log('\nRESULT: PASS');
    }
  }
}
