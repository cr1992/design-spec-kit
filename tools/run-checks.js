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
 * 不在任何层清单里的 tools/check-*.js 视为项目自定义 guard，默认照跑。
 *
 * Extension 感知：extensions/<name>/ 不参与顶层未知 guard 自动发现。只有 kit.layers 点名、
 * 且 name 存在于 KNOWN_EXTENSIONS 的 extension 才会被发现；目录缺失只给 setup 提示。
 *
 * ★层开关单一真源 = 业务仓 docs/design-spec/config.json 的 kit.layers（本文件 / kit-doctor /
 *   各 guard 同读）；没有该配置时才回退本文件的 DEFAULT_INSTALLED_LAYERS。
 *   submodule 模式下 kit 源码保持只读——启用/关闭层一律改业务仓 config，别改这里。
 *
 * 怎么跑：
 *   node tools/run-checks.js              串跑启用层 guard
 *   node tools/run-checks.js --list       只列将跑/跳过/缺失，不执行
 *   node tools/run-checks.js --strict     未知 layer / extension 名也作为失败
 *   node tools/run-checks.js --execute-impl  透传给 extension guard
 *   node tools/run-checks.js --only check-tokens   只跑一个（无视 core 层开关；带不带 .js 都行）
 *   node tools/run-checks.js --all        无视 core 层开关跑全部 tools/ guard
 * ═════════════════════════════════════════════════════════════*/

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { DEFAULT_INSTALLED_LAYERS, KNOWN_EXTENSIONS, LAYER_GUARDS, isKnownExtension, isKnownLayer } from './kit-registry.js';

// ─── 配置 ──────────────────────────────────────────────────────
const args = [];   // 沙箱手改位（本文件 node-only，一般留空，走 process.argv）

async function readProjectConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json', 'utf8')); }
  catch { return {}; }
}
const PROJECT_CONFIG = await readProjectConfig();

// 本实例启用的层 / extension。优先读业务仓 docs/design-spec/config.json 的 kit.layers；
// 没有配置时回退 base。这样 submodule 不需要改源码。
const configuredLayers = PROJECT_CONFIG.kit?.layers;
const INSTALLED_LAYERS = Array.isArray(configuredLayers) && configuredLayers.length > 0 ? configuredLayers : DEFAULT_INSTALLED_LAYERS;
const ENABLED_CORE_LAYERS = INSTALLED_LAYERS.filter(isKnownLayer);
const ENABLED_EXTENSIONS = INSTALLED_LAYERS.filter(isKnownExtension);
const UNKNOWN_LAYER_NAMES = INSTALLED_LAYERS.filter((name) => !isKnownLayer(name) && !isKnownExtension(name));

const GUARD_PATTERN = /^check-.+\.js$/i;          // guard 文件命名约定
const EXCLUDE = new Set([]);                       // 需要排除的具体文件名（留空即可）

const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);

// ─── 定位 guard 目录 = 本脚本自身所在目录 ───────────────────────
const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const KIT_ROOT = path.resolve(SELF_DIR, '..');

async function discoverCoreGuards() {
  let entries;
  try { entries = await readdir(SELF_DIR); } catch { entries = []; }
  return entries
    .filter(name => GUARD_PATTERN.test(name) && !EXCLUDE.has(name))
    .filter(name => !name.endsWith('.baseline.json'))
    .sort();
}

async function discoverEnabledExtensions() {
  const plans = [];
  for (const name of ENABLED_EXTENSIONS) {
    const meta = KNOWN_EXTENSIONS[name];
    const dir = path.join(KIT_ROOT, meta.dir);
    let entries = null;
    try { entries = await readdir(dir); } catch { /* missing dir */ }
    if (entries === null) {
      plans.push({ name, dir, status: 'missing-dir', run: [], missing: [], skipped: meta.guards });
      continue;
    }
    const present = new Set(entries);
    const run = meta.guards
      .filter((file) => present.has(file))
      .map((file) => ({
        kind: 'extension',
        extension: name,
        file,
        label: `${name}/${file}`,
        absPath: path.join(dir, file),
      }));
    const missing = meta.guards.filter((file) => !present.has(file)).sort();
    plans.push({ name, dir, status: 'present', run, missing, skipped: [] });
  }
  return plans;
}

function parseFlags(argv) {
  const flags = { list: false, only: null, all: false, strict: false, executeImpl: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') flags.list = true;
    else if (a === '--all') flags.all = true;
    else if (a === '--strict') flags.strict = true;
    else if (a === '--execute-impl') flags.executeImpl = true;
    else if (a === '--only') flags.only = argv[++i] || null;
    else if (a.startsWith('--only=')) flags.only = a.slice('--only='.length);
  }
  return flags;
}

// 按层把「存在的 core guard」分成三份：将跑 / 跳过（属已知但未启用的层）/ 启用层缺文件。
function planCoreByLayers(present, all) {
  const layerOf = new Map();                                        // 文件名 -> 所属层
  for (const [layer, files] of Object.entries(LAYER_GUARDS)) for (const f of files) layerOf.set(f, layer);
  const enabled = new Set(ENABLED_CORE_LAYERS.flatMap(l => LAYER_GUARDS[l] || []));
  const run = [], skipped = [];
  for (const g of present) {
    if (all || enabled.has(g) || !layerOf.has(g)) {
      run.push({ kind: 'core', file: g, label: g, absPath: path.join(SELF_DIR, g) }); // 启用层 / 自定义 guard 照跑
    } else {
      skipped.push({ file: g, layer: layerOf.get(g) });
    }
  }
  const missing = all ? [] : [...enabled].filter(g => !present.includes(g)).sort();
  return { run, skipped, missing };
}

function normalizeGuardName(n) {
  const base = n.includes('/') ? n.split('/').pop() : n;
  return base.endsWith('.js') ? base.slice(0, -3) : base;
}

function matchesOnly(check, want) {
  const normalized = normalizeGuardName(want);
  return normalizeGuardName(check.label) === normalized ||
    normalizeGuardName(check.file) === normalized ||
    check.label.replace(/\.js$/, '') === normalized;
}

// 子进程跑一个 guard，cwd 继承调用方 cwd（不是 SELF_DIR）——guard 的相对路径配置
// （SCAN_ROOTS 等）都是相对项目 cwd 写的。
function runOne(check, flags) {
  return new Promise(resolve => {
    const passArgs = check.kind === 'extension' && flags.executeImpl ? ['--execute-impl'] : [];
    const child = spawn(process.execPath, [check.absPath, ...passArgs], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { out += d.toString(); });
    child.on('close', code => resolve({ check, code, out }));
    child.on('error', err => resolve({ check, code: 1, out: `spawn error: ${err.message}` }));
  });
}

function lastResultLine(out) {
  const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^RESULT:\s*(PASS|FAIL)/.test(lines[i])) return lines[i];
  }
  return null;
}

function enabledLabel() {
  return INSTALLED_LAYERS.join(', ');
}

// ─── Main ────────────────────────────────────────────────────

const flags = parseFlags(EFFECTIVE_ARGS);
const presentCore = await discoverCoreGuards();
const corePlan = planCoreByLayers(presentCore, flags.all);
const extensionPlans = await discoverEnabledExtensions();
let checks = [...corePlan.run, ...extensionPlans.flatMap((p) => p.run)];

const extensionMissingGuards = extensionPlans
  .filter((p) => p.status === 'present')
  .flatMap((p) => p.missing.map((file) => ({ extension: p.name, file })));

if (presentCore.length === 0) {
  console.log(`✗ ${SELF_DIR} 下没找到任何 check-*.js —— 至少应装 guard①（check-tokens.js）`);
  console.log(`修法：确认已把 tools/ 下的 guard 文件从 kit 拷入本项目`);
  console.log('RESULT: FAIL');
  process.exitCode = 1;
} else {
  if (flags.only) {
    const matched = checks.filter((check) => matchesOnly(check, flags.only));   // --only 无视 core 层开关；extension 仍须 opt-in
    if (matched.length === 0) {
      console.log(`✗ --only ${flags.only} 未匹配到任何已发现 guard（core 存在：${presentCore.map(normalizeGuardName).join(', ')}；enabled extensions：${ENABLED_EXTENSIONS.join(', ') || '无'}）`);
      console.log('RESULT: FAIL');
      process.exitCode = 1;
      checks = [];
    } else {
      checks = matched;
      corePlan.skipped = []; corePlan.missing = [];
      extensionMissingGuards.length = 0;
    }
  }

  const unknownIsFail = flags.strict && UNKNOWN_LAYER_NAMES.length > 0;
  const missingIsFail = corePlan.missing.length > 0 || extensionMissingGuards.length > 0;

  if (flags.list) {
    console.log(`启用层/扩展 [${enabledLabel()}]${flags.all ? '（--all 无视 core 层开关）' : ''} · 将跑 ${checks.length} 个 guard（tools：${SELF_DIR}）：`);
    for (const check of checks) console.log(`  - ${check.label}`);
    for (const s of corePlan.skipped) console.log(`  · 跳过 ${s.file}（属未启用层 '${s.layer}'——启用在 docs/design-spec/config.json 配 kit.layers；无 config 的独立项目才改本文件 DEFAULT_INSTALLED_LAYERS）`);
    for (const plan of extensionPlans) {
      if (plan.status === 'missing-dir') {
        console.log(`  · 跳过 extension '${plan.name}'（${plan.dir} 不存在；如需启用请安装该 extension，或从 kit.layers 移除 '${plan.name}'）`);
      }
    }
    for (const m of corePlan.missing) console.log(`  ✗ 缺失 ${m}（启用层期望但文件不在——从 kit 拷入或关掉该层）`);
    for (const m of extensionMissingGuards) console.log(`  ✗ 缺失 ${m.extension}/${m.file}（已安装 extension 目录但 guard 文件不完整）`);
    for (const name of UNKNOWN_LAYER_NAMES) console.log(`  ⚠ 未知 layer / extension '${name}'（已知层：${Object.keys(LAYER_GUARDS).join(', ')}；已知 extension：${Object.keys(KNOWN_EXTENSIONS).join(', ')}）`);
    console.log(missingIsFail || unknownIsFail ? 'RESULT: FAIL' : 'RESULT: PASS');
    if (missingIsFail || unknownIsFail) process.exitCode = 1;
  } else if (checks.length > 0) {
    console.log(`聚合入口：启用层/扩展 [${enabledLabel()}]${flags.all ? '（--all）' : ''}${flags.executeImpl ? '（--execute-impl）' : ''} · 串跑 ${checks.length} 个 guard`);
    for (const s of corePlan.skipped) console.log(`  · 跳过 ${s.file}（未启用层 '${s.layer}'）`);
    for (const plan of extensionPlans) {
      if (plan.status === 'missing-dir') {
        console.log(`  · 跳过 extension '${plan.name}'（${plan.dir} 不存在；安装 extension 或从 kit.layers 移除）`);
      }
    }
    for (const name of UNKNOWN_LAYER_NAMES) console.log(`  ⚠ 未知 layer / extension '${name}'（kit-doctor 会提示拼写；run-checks --strict 会失败）`);
    console.log('');
    const results = [];
    for (const check of checks) {
      console.log(`── ${check.label} ──────────────────────────────`);
      const r = await runOne(check, flags);
      const prefix = `[${normalizeGuardName(check.label)}] `;
      const prefixed = r.out.split('\n').map(l => l ? `${prefix}${l}` : l).join('\n');
      process.stdout.write(prefixed.endsWith('\n') ? prefixed : prefixed + '\n');
      results.push({ ...r, resultLine: lastResultLine(r.out) });
    }

    console.log('\n════════ 汇总 ════════');
    let anyFail = false;
    for (const r of results) {
      const verdict = r.resultLine || `(未打印 RESULT，退出码 ${r.code})`;
      const failed = r.code !== 0 || (r.resultLine && r.resultLine.includes('FAIL')) || !r.resultLine;
      if (failed) anyFail = true;
      console.log(`  ${failed ? '✗' : '✓'} ${normalizeGuardName(r.check.label)}  exit=${r.code}  ${verdict}`);
    }
    for (const m of corePlan.missing) {
      anyFail = true;
      console.log(`  ✗ ${normalizeGuardName(m)}  缺失（启用层期望但文件不在 tools/——从 kit 拷入，或在 config 里关掉该层）`);
    }
    for (const m of extensionMissingGuards) {
      anyFail = true;
      console.log(`  ✗ ${m.extension}/${normalizeGuardName(m.file)}  缺失（extension 目录不完整）`);
    }
    if (unknownIsFail) {
      anyFail = true;
      for (const name of UNKNOWN_LAYER_NAMES) console.log(`  ✗ ${name}  未知 layer / extension`);
    }

    if (anyFail) {
      const firstFailed = results.find(r => r.code !== 0 || !r.resultLine || (r.resultLine || '').includes('FAIL'));
      const hint = firstFailed ? `\`${process.execPath} ${firstFailed.check.absPath}\`` : '`node tools/run-checks.js --list`';
      console.log(`\n修法：上面标 ✗ 的逐个单跑 ${hint} 看详细违规再修`);
      console.log('\nRESULT: FAIL');
      process.exitCode = 1;
    } else {
      console.log('\nRESULT: PASS');
    }
  } else {
    for (const plan of extensionPlans) {
      if (plan.status === 'missing-dir') {
        console.log(`  · 跳过 extension '${plan.name}'（${plan.dir} 不存在；安装 extension 或从 kit.layers 移除）`);
      }
    }
    for (const name of UNKNOWN_LAYER_NAMES) console.log(`  ⚠ 未知 layer / extension '${name}'（kit-doctor 会提示拼写；run-checks --strict 会失败）`);
    console.log(corePlan.missing.length || extensionMissingGuards.length || unknownIsFail ? 'RESULT: FAIL' : 'RESULT: PASS');
    if (corePlan.missing.length || extensionMissingGuards.length || unknownIsFail) process.exitCode = 1;
  }
}
