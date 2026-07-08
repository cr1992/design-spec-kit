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
 *   node tools/run-checks.js --strict     未知 layer / extension 名、已启用但未安装的 extension 作为失败
 *   node tools/run-checks.js --execute-impl  透传给 extension guard
 *   node tools/run-checks.js --only check-tokens   只跑一个（无视 core 层开关；带不带 .js 都行）
 *   node tools/run-checks.js --all        无视 core 层开关跑全部 tools/ guard
 *   node tools/run-checks.js --json       抑制文本，输出单行稳定 JSON 汇总（jsonVersion 承诺字段稳定；
 *                                         文本汇总不作为解析面）；exit 语义与文本模式一致
 * ═════════════════════════════════════════════════════════════*/

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { DEFAULT_INSTALLED_LAYERS, KNOWN_EXTENSIONS, LAYER_GUARDS, isKnownExtension, isKnownLayer } from './kit-registry.js';

// ─── 配置 ──────────────────────────────────────────────────────
const args = [];   // 沙箱手改位（本文件 node-only，一般留空，走 process.argv）
const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);
// --json 是全路径契约：planning / config 失败的早退分支也必须输出 JSON，不能漏文本
const JSON_MODE = EFFECTIVE_ARGS.includes('--json');

// 统一失败出口：文本模式打原有行 + RESULT: FAIL；JSON 模式输出稳定单行 JSON（errors[] 承载原因）
function emitFailureAndExit(errorLines, { modules = null } = {}) {
  if (JSON_MODE) {
    console.log(JSON.stringify({
      jsonVersion: 1, modules, guards: [], missing: [], unknownLayers: [],
      errors: errorLines.map((l) => l.replace(/^[✗\s]+/, '')),
      result: 'FAIL',
    }));
  } else {
    for (const line of errorLines) console.log(line);
    console.log('RESULT: FAIL');
  }
  process.exit(1);
}

async function readProjectConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json', 'utf8')); }
  catch { return {}; }
}
const PROJECT_CONFIG = await readProjectConfig();

// 本实例启用的层 / extension。优先读业务仓 docs/design-spec/config.json 的 kit.layers；
// 没有配置时回退 base。这样 submodule 不需要改源码。
const configuredLayers = PROJECT_CONFIG.kit?.layers;
const INSTALLED_LAYERS = Array.isArray(configuredLayers) && configuredLayers.length > 0 ? configuredLayers : DEFAULT_INSTALLED_LAYERS;

// ─── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）─────────────────
// modules 分节存在 → 每个模块按自己的 effective layers（modules.<m>.layers ?? kit.layers）
// 重复执行 guard，输出一律带 `<module>/` 前缀（哪怕只有一个显式模块——两态、无第三态）；
// modules 不存在 → 单匿名默认模块，v2.1 行为逐字节不变（compat snapshot 对拍）。
const MODULES_CONFIG = PROJECT_CONFIG.modules && typeof PROJECT_CONFIG.modules === 'object' && !Array.isArray(PROJECT_CONFIG.modules)
  ? PROJECT_CONFIG.modules : null;
// 空 modules 分节 = 所有 guard 都不跑的 false green，直接 FAIL（要么声明模块，要么删分节回单模块模式）
if (MODULES_CONFIG && Object.keys(MODULES_CONFIG).length === 0) {
  emitFailureAndExit([
    '✗ docs/design-spec/config.json 的 modules 分节为空 —— 按模块规划后没有任何 guard 会跑（false green）',
    '  修法：在 modules 下声明至少一个模块，或删除 modules 分节回到单模块模式',
  ]);
}
// [{ name: 'mobile-app'|null, layers: [...] }]；name=null = 匿名默认模块（旧行为）
const MODULE_PLANS = MODULES_CONFIG
  ? Object.entries(MODULES_CONFIG).map(([name, mod]) => ({
      name,
      layers: Array.isArray(mod?.layers) && mod.layers.length > 0 ? mod.layers : INSTALLED_LAYERS,
    }))
  : [{ name: null, layers: INSTALLED_LAYERS }];

// ─── 自定义 guard 登记（MULTI-MODULE-PROPOSAL 方案 2）────────────────
// 判定契约（保守合取）：exit != 0 永远 FAIL；exit == 0 且末个 `RESULT:` 行为 FAIL → FAIL；
// 无 RESULT 行按 exit code。信任边界：command 是仓内受版本控制的受信任代码，runner 原样
// 执行——customGuards 不是安全边界，doctor 只校验形态不防注入。
const CUSTOM_GUARDS_RAW = PROJECT_CONFIG.customGuards;
const CUSTOM_GUARDS = [];
{
  const errors = [];
  if (CUSTOM_GUARDS_RAW !== undefined && !Array.isArray(CUSTOM_GUARDS_RAW)) {
    errors.push('customGuards 必须是数组');
  } else if (Array.isArray(CUSTOM_GUARDS_RAW)) {
    const seen = new Set();
    for (const [i, g] of CUSTOM_GUARDS_RAW.entries()) {
      if (!g || typeof g !== 'object' || typeof g.name !== 'string' || !g.name.trim() || typeof g.command !== 'string' || !g.command.trim()) {
        errors.push(`customGuards[${i}] 缺少非空 name / command`); continue;
      }
      if (seen.has(g.name)) { errors.push(`customGuards name 重复：'${g.name}'`); continue; }
      seen.add(g.name);
      const builtinNames = new Set(Object.values(LAYER_GUARDS).flat().map((f) => f.replace(/\.js$/, '')));
      if (builtinNames.has(g.name)) { errors.push(`customGuards['${g.name}'] 与内置 guard 同名 —— 换一个 name`); continue; }
      if (g.module && (!MODULES_CONFIG || !Object.prototype.hasOwnProperty.call(MODULES_CONFIG, g.module))) {
        errors.push(`customGuards['${g.name}'].module='${g.module}' 未在 modules 分节声明`); continue;
      }
      // 输出两态契约（proposal 方案 1）：modules 分节存在时所有输出一律带 <module>/ 前缀——
      // 无 module 的 custom guard 会偷渡出第三态裸名输出，fail closed。
      if (MODULES_CONFIG && !g.module) {
        errors.push(`customGuards['${g.name}'] 缺少 module —— modules 分节存在时每个 custom guard 必须归属一个已声明模块（输出两态契约，禁止第三态裸名）`); continue;
      }
      CUSTOM_GUARDS.push({
        kind: 'custom', name: g.name, command: g.command,
        module: g.module || null, layer: g.layer || null,
        file: g.name, label: `${g.module ? `${g.module}/` : ''}${g.name}`,
      });
    }
  }
  if (errors.length > 0) {
    emitFailureAndExit(errors.map((e) => `✗ ${e}（docs/design-spec/config.json）`),
      { modules: MODULES_CONFIG ? Object.keys(MODULES_CONFIG) : null });
  }
}

const layerSplit = (layers) => ({
  core: layers.filter(isKnownLayer),
  extensions: layers.filter(isKnownExtension),
  unknown: layers.filter((name) => !isKnownLayer(name) && !isKnownExtension(name)),
});
// 全局未知名集合（跨模块去重，供 --strict / 提示用）
const UNKNOWN_LAYER_NAMES = [...new Set(MODULE_PLANS.flatMap((m) => layerSplit(m.layers).unknown))];

const GUARD_PATTERN = /^check-.+\.js$/i;          // guard 文件命名约定
const EXCLUDE = new Set([]);                       // 需要排除的具体文件名（留空即可）


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

async function discoverEnabledExtensions(extensionNames) {
  const plans = [];
  for (const name of extensionNames) {
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
  const flags = { list: false, only: null, all: false, strict: false, executeImpl: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') flags.list = true;
    else if (a === '--json') flags.json = true;
    else if (a === '--all') flags.all = true;
    else if (a === '--strict') flags.strict = true;
    else if (a === '--execute-impl') flags.executeImpl = true;
    else if (a === '--only') flags.only = argv[++i] || null;
    else if (a.startsWith('--only=')) flags.only = a.slice('--only='.length);
  }
  return flags;
}

// 按层把「存在的 core guard」分成三份：将跑 / 跳过（属已知但未启用的层）/ 启用层缺文件。
function planCoreByLayers(present, all, coreLayers) {
  const layerOf = new Map();                                        // 文件名 -> 所属层
  for (const [layer, files] of Object.entries(LAYER_GUARDS)) for (const f of files) layerOf.set(f, layer);
  const enabled = new Set(coreLayers.flatMap(l => LAYER_GUARDS[l] || []));
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

// --only 匹配：裸 guard 名匹配所有模块的该 guard；`<module>/<guard>` 只匹配该模块。
// fail closed：多模块下 `a/b` 的 a 既不是已声明模块也不是 known extension → 视为拼错的模块名，
// 不降级成裸名匹配（那会静默跨模块全跑），走「未匹配到任何 guard」FAIL。
function matchesOnly(check, want) {
  const slash = want.indexOf('/');
  if (slash > 0 && MODULES_CONFIG) {
    const head = want.slice(0, slash);
    if (Object.prototype.hasOwnProperty.call(MODULES_CONFIG, head)) {
      if (check.module !== head) return false;
      want = want.slice(slash + 1);
    } else if (!isKnownExtension(head)) {
      return false;
    }
  }
  const baseLabel = check.module ? check.label.slice(check.module.length + 1) : check.label;
  const normalized = normalizeGuardName(want);
  return normalizeGuardName(baseLabel) === normalized ||
    normalizeGuardName(check.file) === normalized ||
    baseLabel.replace(/\.js$/, '') === normalized;
}

// 子进程跑一个 guard，cwd 继承调用方 cwd（不是 SELF_DIR）——guard 的相对路径配置
// （SCAN_ROOTS 等）都是相对项目 cwd 写的。
function runOne(check, flags) {
  return new Promise(resolve => {
    // 模块上下文经环境变量传给 guard（guard 内以 modules.<m>.guards.<g> ⊕ 顶层 guards.<g> 合成 effective config）
    const env = check.module ? { ...process.env, DESIGN_SPEC_KIT_MODULE: check.module } : process.env;
    const common = { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], env };
    // custom guard：原样执行登记的 command（仓内受信任代码，非安全边界）
    const child = check.kind === 'custom'
      ? spawn(check.command, { ...common, shell: true })
      : spawn(process.execPath, [check.absPath, ...(check.kind === 'extension' && flags.executeImpl ? ['--execute-impl'] : [])], common);
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

// 逐模块规划：每个模块按自己的 effective layers 生成 core/extension 计划；
// 匿名默认模块（name=null）不加前缀，v2.1 输出逐字节不变。
const resolvedModules = [];
for (const mp of MODULE_PLANS) {
  const split = layerSplit(mp.layers);
  const corePlan = planCoreByLayers(presentCore, flags.all, split.core);
  const extensionPlans = (await discoverEnabledExtensions(split.extensions)).map((p) => ({ ...p, module: mp.name }));
  const decorate = (check) => ({ ...check, module: mp.name, label: mp.name ? `${mp.name}/${check.label}` : check.label });
  corePlan.run = corePlan.run.map(decorate);
  for (const p of extensionPlans) p.run = p.run.map(decorate);
  resolvedModules.push({ name: mp.name, layers: mp.layers, corePlan, extensionPlans });
}

let checks = [...resolvedModules.flatMap((m) => [...m.corePlan.run, ...m.extensionPlans.flatMap((p) => p.run)]), ...CUSTOM_GUARDS];

// 老 auto-discovery（不在任何层清单的 tools/check-*.js 照跑）弃用中：只对复制式接入有意义，
// v2.2 起唯一推荐入口是 config.customGuards；与 customGuards 撞名 = 双跑风险，直接 FAIL。
const LAYER_OF_GLOBAL = new Set(Object.values(LAYER_GUARDS).flat());
const autoDiscovered = presentCore.filter((g) => !LAYER_OF_GLOBAL.has(g));
for (const g of autoDiscovered) {
  const base = normalizeGuardName(g);
  const clash = CUSTOM_GUARDS.find((c) => c.name === base || c.name === base.replace(/^check-/, ''));
  if (clash) {
    emitFailureAndExit([`✗ tools/${g}（auto-discovery）与 customGuards['${clash.name}'] 撞名 —— 会双跑同一检查；删除该文件或改 customGuards name`],
      { modules: MODULES_CONFIG ? Object.keys(MODULES_CONFIG) : null });
  }
}
const modTag = (name) => (name ? `${name}/` : '');
const summaryName = (check) => `${modTag(check.module)}${normalizeGuardName(check.file)}`;
const coreSkipped = resolvedModules.flatMap((m) => m.corePlan.skipped.map((s) => ({ ...s, module: m.name })));
const coreMissing = resolvedModules.flatMap((m) => m.corePlan.missing.map((file) => ({ file, module: m.name })));
const allExtensionPlans = resolvedModules.flatMap((m) => m.extensionPlans);
const extensionMissingGuards = allExtensionPlans
  .filter((p) => p.status === 'present')
  .flatMap((p) => p.missing.map((file) => ({ extension: p.name, module: p.module, file })));
const missingExtensionDirs = allExtensionPlans.filter((p) => p.status === 'missing-dir');

function headerLabel() {
  if (!MODULES_CONFIG) return `启用层/扩展 [${enabledLabel()}]`;
  return `模块 [${MODULE_PLANS.map((m) => m.name).join(', ')}]`;
}
function printModuleLayers() {
  if (!MODULES_CONFIG) return;
  for (const m of resolvedModules) console.log(`  · ${m.name}: layers [${m.layers.join(', ')}]`);
}

if (presentCore.length === 0) {
  emitFailureAndExit([
    `✗ ${SELF_DIR} 下没找到任何 check-*.js —— 至少应装 guard①（check-tokens.js）`,
    `修法：确认已把 tools/ 下的 guard 文件从 kit 拷入本项目`,
  ], { modules: MODULES_CONFIG ? Object.keys(MODULES_CONFIG) : null });
} else {
  if (flags.only) {
    const matched = checks.filter((check) => matchesOnly(check, flags.only));   // --only 无视 core 层开关；extension 仍须 opt-in
    if (matched.length === 0) {
      // 立即结束：不落进空 checks 分支重复打印 RESULT（末行 RESULT 是判读约定）
      emitFailureAndExit([`✗ --only ${flags.only} 未匹配到任何已发现 guard（core 存在：${presentCore.map(normalizeGuardName).join(', ')}；enabled extensions：${[...new Set(resolvedModules.flatMap((m) => layerSplit(m.layers).extensions))].join(', ') || '无'}）`],
        { modules: MODULES_CONFIG ? Object.keys(MODULES_CONFIG) : null });
    } else {
      checks = matched;
      coreSkipped.length = 0; coreMissing.length = 0;
      extensionMissingGuards.length = 0;
    }
  }

  const unknownIsFail = flags.strict && UNKNOWN_LAYER_NAMES.length > 0;
  const missingExtensionDirIsFail = flags.strict && missingExtensionDirs.length > 0;
  const missingIsFail = coreMissing.length > 0 || extensionMissingGuards.length > 0 || missingExtensionDirIsFail;

  if (flags.list) {
    console.log(`${headerLabel()}${flags.all ? '（--all 无视 core 层开关）' : ''} · 将跑 ${checks.length} 个 guard（tools：${SELF_DIR}）：`);
    printModuleLayers();
    for (const check of checks) console.log(`  - ${check.label}${check.kind === 'custom' ? `（custom：${check.command}）` : ''}`);
    for (const g of autoDiscovered) console.log(`  ⚠ tools/${g} 不在任何层清单——auto-discovery 弃用中（≥2 个 minor 后移除），迁移到 config.customGuards`);
    for (const s of coreSkipped) console.log(`  · 跳过 ${modTag(s.module)}${s.file}（属未启用层 '${s.layer}'——启用在 docs/design-spec/config.json 配 kit.layers；无 config 的独立项目才改本文件 DEFAULT_INSTALLED_LAYERS）`);
    for (const plan of allExtensionPlans) {
      if (plan.status === 'missing-dir') {
        const mark = flags.strict ? '✗' : '·';
        const label = flags.strict ? 'extension' : '跳过 extension';
        const strictHint = flags.strict ? '；--strict 要求已启用 extension 必须已安装' : '';
        console.log(`  ${mark} ${label} '${modTag(plan.module)}${plan.name}'（${plan.dir} 不存在；如需启用请安装该 extension，或从 kit.layers 移除 '${plan.name}'${strictHint}）`);
      }
    }
    for (const m of coreMissing) console.log(`  ✗ 缺失 ${modTag(m.module)}${m.file}（启用层期望但文件不在——从 kit 拷入或关掉该层）`);
    for (const m of extensionMissingGuards) console.log(`  ✗ 缺失 ${modTag(m.module)}${m.extension}/${m.file}（已安装 extension 目录但 guard 文件不完整）`);
    for (const name of UNKNOWN_LAYER_NAMES) console.log(`  ⚠ 未知 layer / extension '${name}'（已知层：${Object.keys(LAYER_GUARDS).join(', ')}；已知 extension：${Object.keys(KNOWN_EXTENSIONS).join(', ')}）`);
    console.log(missingIsFail || unknownIsFail ? 'RESULT: FAIL' : 'RESULT: PASS');
    if (missingIsFail || unknownIsFail) process.exitCode = 1;
  } else if (checks.length > 0) {
    // --json：抑制全部文本叙述，末尾输出单个稳定 JSON 文档（机读汇总契约，jsonVersion 承诺字段稳定；
    // 文本汇总不作为解析面）。exit 语义与文本模式一致。
    const say = (...a) => { if (!flags.json) console.log(...a); };
    say(`聚合入口：${headerLabel()}${flags.all ? '（--all）' : ''}${flags.executeImpl ? '（--execute-impl）' : ''} · 串跑 ${checks.length} 个 guard`);
    if (!flags.json) printModuleLayers();
    for (const s of coreSkipped) say(`  · 跳过 ${modTag(s.module)}${s.file}（未启用层 '${s.layer}'）`);
    for (const plan of allExtensionPlans) {
      if (plan.status === 'missing-dir') {
        const mark = flags.strict ? '✗' : '·';
        const label = flags.strict ? 'extension' : '跳过 extension';
        const strictHint = flags.strict ? '；--strict 要求已启用 extension 必须已安装' : '';
        say(`  ${mark} ${label} '${modTag(plan.module)}${plan.name}'（${plan.dir} 不存在；安装 extension 或从 kit.layers 移除${strictHint}）`);
      }
    }
    for (const name of UNKNOWN_LAYER_NAMES) say(`  ⚠ 未知 layer / extension '${name}'（kit-doctor 会提示拼写；run-checks --strict 会失败）`);
    for (const g of autoDiscovered) say(`  ⚠ tools/${g} 不在任何层清单——auto-discovery 弃用中（≥2 个 minor 后移除），迁移到 config.customGuards`);
    say('');
    const results = [];
    for (const check of checks) {
      say(`── ${check.label} ──────────────────────────────`);
      const r = await runOne(check, flags);
      if (!flags.json) {
        const prefix = `[${summaryName(check)}] `;
        const prefixed = r.out.split('\n').map(l => l ? `${prefix}${l}` : l).join('\n');
        process.stdout.write(prefixed.endsWith('\n') ? prefixed : prefixed + '\n');
      }
      results.push({ ...r, resultLine: lastResultLine(r.out) });
    }

    say('\n════════ 汇总 ════════');
    let anyFail = false;
    const guardRows = [];
    for (const r of results) {
      // custom guard 判定契约：exit != 0 永远 FAIL；RESULT: FAIL 可否决零退出码；
      // 无 RESULT 行按 exit code（内置 guard 仍要求必须打 RESULT）。
      const isCustom = r.check.kind === 'custom';
      const verdict = r.resultLine || (isCustom ? `(无 RESULT 行，按退出码判定)` : `(未打印 RESULT，退出码 ${r.code})`);
      const failed = r.code !== 0 || (r.resultLine && r.resultLine.includes('FAIL')) || (!isCustom && !r.resultLine);
      if (failed) anyFail = true;
      guardRows.push({
        module: r.check.module, guard: normalizeGuardName(r.check.file), kind: r.check.kind,
        exit: r.code, result: r.resultLine ? (r.resultLine.includes('FAIL') ? 'FAIL' : 'PASS') : null, failed,
      });
      say(`  ${failed ? '✗' : '✓'} ${summaryName(r.check)}  exit=${r.code}  ${verdict}`);
    }
    const missingRows = [];
    for (const m of coreMissing) {
      anyFail = true;
      missingRows.push(`${modTag(m.module)}${normalizeGuardName(m.file)}`);
      say(`  ✗ ${modTag(m.module)}${normalizeGuardName(m.file)}  缺失（启用层期望但文件不在 tools/——从 kit 拷入，或在 config 里关掉该层）`);
    }
    for (const m of extensionMissingGuards) {
      anyFail = true;
      missingRows.push(`${modTag(m.module)}${m.extension}/${normalizeGuardName(m.file)}`);
      say(`  ✗ ${modTag(m.module)}${m.extension}/${normalizeGuardName(m.file)}  缺失（extension 目录不完整）`);
    }
    if (missingExtensionDirIsFail) {
      anyFail = true;
      for (const plan of missingExtensionDirs) {
        missingRows.push(`${modTag(plan.module)}${plan.name}`);
        say(`  ✗ ${modTag(plan.module)}${plan.name}  已启用但 extension 目录不存在（${plan.dir}）`);
      }
    }
    if (unknownIsFail) {
      anyFail = true;
      for (const name of UNKNOWN_LAYER_NAMES) say(`  ✗ ${name}  未知 layer / extension`);
    }

    if (anyFail) {
      const firstFailed = results.find(r => r.code !== 0 || (r.check.kind !== 'custom' && !r.resultLine) || (r.resultLine || '').includes('FAIL'));
      const hint = firstFailed
        ? (firstFailed.check.kind === 'custom' ? `\`${firstFailed.check.command}\`` : `\`${process.execPath} ${firstFailed.check.absPath}\``)
        : '`node tools/run-checks.js --list`';
      say(`\n修法：上面标 ✗ 的逐个单跑 ${hint} 看详细违规再修`);
      say('\nRESULT: FAIL');
      process.exitCode = 1;
    } else {
      say('\nRESULT: PASS');
    }
    if (flags.json) {
      console.log(JSON.stringify({
        jsonVersion: 1,
        modules: MODULES_CONFIG ? MODULE_PLANS.map((m) => m.name) : null,
        guards: guardRows,
        missing: missingRows,
        unknownLayers: UNKNOWN_LAYER_NAMES,
        errors: [],   // 主汇总固定带空 errors，与失败早退文档同构（首版契约字段稳定，消费方免 optional handling）
        result: anyFail ? 'FAIL' : 'PASS',
      }));
    }
  } else {
    for (const plan of allExtensionPlans) {
      if (plan.status === 'missing-dir') {
        const mark = flags.strict ? '✗' : '·';
        const label = flags.strict ? 'extension' : '跳过 extension';
        const strictHint = flags.strict ? '；--strict 要求已启用 extension 必须已安装' : '';
        console.log(`  ${mark} ${label} '${modTag(plan.module)}${plan.name}'（${plan.dir} 不存在；安装 extension 或从 kit.layers 移除${strictHint}）`);
      }
    }
    for (const name of UNKNOWN_LAYER_NAMES) console.log(`  ⚠ 未知 layer / extension '${name}'（kit-doctor 会提示拼写；run-checks --strict 会失败）`);
    console.log(coreMissing.length || extensionMissingGuards.length || missingExtensionDirIsFail || unknownIsFail ? 'RESULT: FAIL' : 'RESULT: PASS');
    if (coreMissing.length || extensionMissingGuards.length || missingExtensionDirIsFail || unknownIsFail) process.exitCode = 1;
  }
}
