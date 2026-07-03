#!/usr/bin/env node
/**
 * kit-doctor.js · 实例化自检（design-spec-kit · 与平台无关）
 *
 * node-only；沙箱用户逐个跑 guard 即可（不需要在无 shell 沙箱里跑体检）。
 *
 * 守什么：kit「原样拷入即生效」这条假设最容易失效——guard 文件漏拷、配置区
 * 扫描目录/词典路径没按项目改（正则零命中，看着装了其实啥也不查）、入口没接、
 * 版本 pin 缺失或落后、DoD 表没提到已装 guard。本脚本把这些「装了没适配」的
 * 情况一次体检出来。
 *
 *   ① guard 文件在位 —— 已装层期望的 check-*.js 是否都在 tools/（自身目录）
 *   ② 配置命中探针 —— 仅对启用层 guard 生效；从源码抽取关键配置常量，对 cwd 验证
 *                      「目录存在且非空 / 文件可读 / 必填数组非空」，不满足视为漏配
 *   ③ 入口接线 —— cwd 的 package.json scripts.check 是否指向 run-checks（或等价）
 *   ④ 版本 pin —— submodule 接入看 gitlink（不需 version 文件）；复制式接入才对比 .design-spec-kit.version
 *   ⑤ DoD 对账 —— cwd 的 CLAUDE.md 是否提到每个已装 guard 文件名
 *
 * FAIL 仅由 ①② 触发（guard 缺失 / 配置零命中 = 装了跟没装一样）；③④⑤ 只报 WARN。
 *
 * 两种模式：
 *   实例模式（默认）—— cwd = 被体检的实例项目根，跑全部 ①~⑤。
 *   kit 源仓模式 —— cwd 是 kit 仓本身（自动识别：tools/ 就是自身目录且上级有 CLAUDE.template.md；
 *                   或显式 --source）。源仓没有「项目配置」可体检，只跑 ①（且期望全部层的 guard
 *                   都在位——源仓必须携带完整套件），②③④⑤ 跳过。
 *
 * 层配置单一真源：INSTALLED_LAYERS 在 run-checks.js 顶部（聚合入口按它决定跑什么），
 * 本脚本从 run-checks.js 源码读取，不另行配置——防两处配置漂移。
 *
 * 怎么跑：node tools/kit-doctor.js（从项目根）；kit 源仓自检：node tools/kit-doctor.js --source
 * ═════════════════════════════════════════════════════════════*/

import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// ─── 配置（一般无需改；层开关去 run-checks.js 顶部改）─────────────
const args = [];   // 沙箱手改位（本文件 node-only，一般留空）

// 各层期望的 guard 文件清单（新增层时在这里补一行；与 run-checks.js 的表保持一致）。
const LAYER_GUARDS = {
  base:    ['check-tokens.js', 'check-icons.js', 'check-changelog.js', 'check-orphan-css.js'],
  i18n:    ['check-i18n.js'],
  handoff: ['check-manifest.js', 'check-deviation.js'],
};
const FALLBACK_LAYERS = ['base'];   // run-checks.js 读不到时的兜底

const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);

// ─── 定位 kit 自身目录（= 本脚本所在目录）与被体检的项目根（= cwd）────
const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.cwd();

const findings = { fail: [], warn: [] };
const fail = (msg) => findings.fail.push(msg);
const warn = (msg) => findings.warn.push(msg);

// ─── 小工具 ──────────────────────────────────────────────────
async function readIfExists(p) {
  try { return await readFile(p, 'utf8'); } catch { return null; }
}
async function dirNonEmpty(p) {
  try {
    const abs = path.isAbsolute(p) ? p : path.join(PROJECT_ROOT, p);
    const entries = await readdir(abs);
    return entries.length > 0;
  } catch { return false; }
}
async function fileReadable(p) {
  try {
    const abs = path.isAbsolute(p) ? p : path.join(PROJECT_ROOT, p);
    await stat(abs);
    return true;
  } catch { return false; }
}

// 从 guard 源码里抽一个「数组字面量」常量的元素个数与首个字符串值（粗粒度，够用来判断非空）。
function extractArrayConst(src, constName) {
  const re = new RegExp(`${constName}\\s*=\\s*(\\[[^\\]]*\\]|new Set\\(\\[[^\\]]*\\]\\))`, 'm');
  const m = src.match(re);
  if (!m) return null;
  const body = m[1];
  const items = [...body.matchAll(/'([^']*)'|"([^"]*)"/g)].map(g => g[1] ?? g[2]);
  return items;
}

// ─── 模式识别 + 层配置读取（单一真源 = run-checks.js）──────────────
const selfIsProjectTools = path.resolve(SELF_DIR) === path.resolve(PROJECT_ROOT, 'tools');
const IS_SOURCE = EFFECTIVE_ARGS.includes('--source') ||
  (selfIsProjectTools && (await readIfExists(path.join(SELF_DIR, '..', 'CLAUDE.template.md'))) !== null);

const PROJECT_CONFIG_PATH = 'docs/design-spec/config.json';
async function readProjectConfig() {
  const src = await readIfExists(path.join(PROJECT_ROOT, PROJECT_CONFIG_PATH));
  if (!src) return {};
  try { return JSON.parse(src); }
  catch { warn(`${PROJECT_CONFIG_PATH} 不是合法 JSON，忽略外部配置并回退源码默认值`); return {}; }
}
const PROJECT_CONFIG = IS_SOURCE ? {} : await readProjectConfig();

async function readInstalledLayers() {
  const configured = PROJECT_CONFIG.kit?.layers;
  if (Array.isArray(configured) && configured.length > 0) return { layers: configured, from: PROJECT_CONFIG_PATH };

  const src = await readIfExists(path.join(SELF_DIR, 'run-checks.js'));
  if (src) {
    const items = extractArrayConst(src, 'INSTALLED_LAYERS');
    if (items && items.length > 0) return { layers: items, from: 'run-checks.js' };
    if (items) warn(`run-checks.js 的 INSTALLED_LAYERS 是空数组——聚合入口啥也不跑，请至少启用 'base'`);
  } else {
    warn(`tools/ 下读不到 run-checks.js —— 层配置无从读取，按兜底 [${FALLBACK_LAYERS.join(', ')}] 体检；建议拷入 run-checks.js 当聚合入口`);
  }
  return { layers: FALLBACK_LAYERS, from: '兜底默认' };
}
// kit 源仓必须携带全部层；实例按 run-checks.js 的启用层。
const layerInfo = IS_SOURCE ? { layers: Object.keys(LAYER_GUARDS), from: '源仓模式（全部层）' } : await readInstalledLayers();
const INSTALLED_LAYERS = layerInfo.layers.filter(l => LAYER_GUARDS[l]);
const ENABLED_GUARDS = new Set(INSTALLED_LAYERS.flatMap(l => LAYER_GUARDS[l] || []));
const GUARD_LAYER = new Map(Object.entries(LAYER_GUARDS).flatMap(([layer, files]) => files.map(file => [file, layer])));

// ─── ① guard 文件在位 ────────────────────────────────────────
async function checkGuardsPresent() {
  const expected = new Set();
  for (const layer of INSTALLED_LAYERS) {
    for (const g of (LAYER_GUARDS[layer] || [])) expected.add(g);
  }
  let toolsEntries = [];
  try { toolsEntries = await readdir(SELF_DIR); } catch { /* ignore */ }
  const present = new Set(toolsEntries);

  const missing = [...expected].filter(g => !present.has(g)).sort();
  const report = [...expected].sort().map(g => `  ${present.has(g) ? '✓' : '✗'} ${g}`);
  if (missing.length > 0) {
    fail(`guard 文件缺失（已装层 [${INSTALLED_LAYERS.join(', ')}] 期望但 tools/ 里没有）：${missing.join(', ')}`);
  }
  return report;
}

// ─── ② 配置命中探针 ──────────────────────────────────────────
// 每条探针：guard 文件、要抽的常量名、判据类型（dir=目录存在且非空 / file=文件可读）。
// optionalEmpty=true 表示空数组是合法关闭某个子维，而不是「装了没适配」。
const PROBES = [
  { guard: 'check-tokens.js',     const: 'SCAN_ROOTS', key: 'scanRoots',       kind: 'dirlist' },
  { guard: 'check-orphan-css.js', const: 'CSS_ROOTS',  key: 'cssRoots',        kind: 'dirlist' },
  { guard: 'check-i18n.js',       const: 'DICT_PATHS', key: 'dictPaths',       kind: 'filelist' },
  { guard: 'check-deviation.js',  const: 'IMPL_ROOTS', key: 'implRoots',       kind: 'dirlist' },
  { guard: 'check-icons.js',      const: 'REGISTRY_SOURCES', key: 'registrySources', kind: 'filelist', optionalEmpty: true,
    note: '空数组 = 关闭同形重画维；check-icons 仍会跑同名异形扫描' },
];

function guardConfig(guardFile) {
  const name = guardFile.replace(/\.js$/, '');
  return PROJECT_CONFIG.guards?.[name] || PROJECT_CONFIG.guards?.[guardFile] || {};
}

async function checkConfigProbes() {
  const report = [];
  for (const probe of PROBES) {
    const src = await readIfExists(path.join(SELF_DIR, probe.guard));
    if (src == null) continue; // 该 guard 未装，②不体检未装的文件（①已经报过缺失）
    if (!ENABLED_GUARDS.has(probe.guard)) {
      const layer = GUARD_LAYER.get(probe.guard) || 'custom';
      report.push(`  · ${probe.guard} 未启用（属层 ${layer}），跳过配置探针`);
      continue;
    }
    const sourceItems = extractArrayConst(src, probe.const);
    const configuredItems = guardConfig(probe.guard)[probe.key];
    const items = Array.isArray(configuredItems) ? configuredItems : sourceItems;
    const itemSource = Array.isArray(configuredItems) ? PROJECT_CONFIG_PATH : 'guard 源码默认值';
    if (items == null) {
      report.push(`  ? ${probe.guard} 的 ${probe.const} 未能从源码抽出，也没有在 ${PROJECT_CONFIG_PATH} 配 ${probe.key}（跳过）`);
      continue;
    }
    if (items.length === 0) {
      if (probe.optionalEmpty) {
        report.push(`  · ${probe.guard}  ${probe.const}=[]（${probe.note}）`);
        continue;
      }
      fail(`${probe.guard} 的 ${probe.const} 是空数组 —— 配置区未按项目改，等于该维度不查`);
      report.push(`  ✗ ${probe.guard}  ${probe.const}=[] 空`);
      continue;
    }
    let hitCount = 0;
    for (const item of items) {
      const ok = probe.kind === 'dirlist' ? await dirNonEmpty(item) : await fileReadable(item);
      if (ok) hitCount++;
    }
    if (hitCount === 0) {
      fail(`${probe.guard} 的 ${probe.const}=[${items.join(', ')}] 在当前项目全部零命中（目录不存在/为空或文件不可读）—— 配置命中探针失败，等于装了没适配`);
      report.push(`  ✗ ${probe.guard}  ${probe.const} 零命中：${items.join(', ')}`);
    } else {
      report.push(`  ✓ ${probe.guard}  ${probe.const} 命中 ${hitCount}/${items.length}：${items.join(', ')}（${itemSource}）`);
    }
  }
  return report;
}

// ─── ③ 入口接线（WARN）───────────────────────────────────────
async function checkEntryWiring() {
  const pkgSrc = await readIfExists(path.join(PROJECT_ROOT, 'package.json'));
  if (!pkgSrc) {
    warn(`cwd 下没有 package.json —— 查不到入口接线，若项目走非 npm runner（make / bun 等）请按 IMPL-PROFILE 自行确认已接 run-checks 等价命令`);
    return '  ? 无 package.json，跳过';
  }
  let pkg;
  try { pkg = JSON.parse(pkgSrc); } catch { warn('package.json 解析失败（非法 JSON），跳过入口接线检查'); return '  ? package.json 非法 JSON'; }
  const checkScript = pkg.scripts && pkg.scripts.check;
  if (!checkScript) {
    warn(`package.json scripts.check 未定义 —— 建议接 "node tools/run-checks.js"，或登记等价命令`);
    return '  ⚠ scripts.check 未定义';
  }
  if (/run-checks/.test(checkScript)) {
    return `  ✓ scripts.check = ${checkScript}`;
  }
  warn(`package.json scripts.check="${checkScript}" 未指向 run-checks.js —— 确认它是否是等价聚合入口（跑了全部已装 guard），否则会出现「跑 npm run check 却漏跑某些 guard」的假入口`);
  return `  ⚠ scripts.check="${checkScript}" 未显式指向 run-checks`;
}

// ─── ④ 版本 pin（WARN）───────────────────────────────────────
async function checkVersionPin() {
  const kitPkgSrc = await readIfExists(path.join(SELF_DIR, '..', 'package.json'));
  let kitVersion = null;
  try { kitVersion = kitPkgSrc ? JSON.parse(kitPkgSrc).version : null; } catch { /* ignore */ }

  // submodule / 独立 clone 接入：kit 目录本身受 git 管（.git 文件或目录存在），
  // 版本 pin 的真源 = gitlink（git submodule status），比手写 version 文件更精确且不会漂。
  // 这种接入不要求 .design-spec-kit.version——那是给「复制式接入」（纯拷文件、无 gitlink）用的。
  const kitDirIsGitManaged = await fileReadable(path.join(SELF_DIR, '..', '.git'));

  const pinSrc = await readIfExists(path.join(PROJECT_ROOT, '.design-spec-kit.version'));
  if (pinSrc == null) {
    // 更可靠的判据：cwd 自身是否就是 kit 仓（自身目录下能找到 build-bundle.js 且路径一致）
    const selfIsProjectTools = path.resolve(SELF_DIR) === path.resolve(PROJECT_ROOT, 'tools');
    if (selfIsProjectTools && await fileReadable(path.join(SELF_DIR, 'build-bundle.js'))) {
      return '  · kit 仓模式（自身即 kit 源仓，无需版本 pin），跳过';
    }
    if (kitDirIsGitManaged) {
      return `  · submodule 接入：版本 pin 由 gitlink 维护（当前 kit=${kitVersion ?? '未知'}），查看用 \`git submodule status\`——不需要 .design-spec-kit.version`;
    }
    warn(`复制式接入缺 .design-spec-kit.version —— 纯拷文件（无 submodule gitlink）时应写一个版本 pin 文件（一行 = 拷入的 kit 版本），否则升级时无法判断落后几版。submodule 接入忽略本条。`);
    return '  ⚠ 缺 .design-spec-kit.version（仅复制式接入需要；submodule 接入应删掉它，改看 gitlink）';
  }
  // 有 version 文件但同时是 submodule 接入 = 第二真源，必漂，提示删除
  if (kitDirIsGitManaged) {
    warn(`submodule 接入却存在 .design-spec-kit.version —— gitlink 已是版本真源，该文件是会漂的第二真源，建议删除，版本改看 \`git submodule status\``);
    return `  ⚠ submodule 接入应删掉 .design-spec-kit.version（gitlink 已 pin，当前 kit=${kitVersion ?? '未知'}）`;
  }
  const pinned = pinSrc.trim().split('\n')[0].trim();
  if (kitVersion && pinned !== kitVersion) {
    warn(`版本落后：实例 pin=${pinned}，kit 当前=${kitVersion} —— 按 docs/VERSIONING.md 升级 SOP 走一遍`);
    return `  ⚠ 版本落后：pin=${pinned} / kit=${kitVersion}`;
  }
  return `  ✓ 版本 pin=${pinned}${kitVersion ? ` 与 kit ${kitVersion} 一致` : ''}`;
}

// ─── ⑤ DoD 对账（WARN）───────────────────────────────────────
async function checkDodMention(installedGuardFiles) {
  const claudeMd = await readIfExists(path.join(PROJECT_ROOT, 'CLAUDE.md'));
  if (claudeMd == null) {
    warn('cwd 下没有 CLAUDE.md —— 装了 guard 但没有契约文件提示协作者何时跑它');
    return '  ? 无 CLAUDE.md，跳过';
  }
  const missing = installedGuardFiles.filter(g => !claudeMd.includes(g));
  if (missing.length > 0) {
    warn(`CLAUDE.md 未提到以下已装 guard 文件名，DoD 收尾同步表可能漏行：${missing.join(', ')}`);
    return `  ⚠ CLAUDE.md 未提及：${missing.join(', ')}`;
  }
  return '  ✓ CLAUDE.md 覆盖全部已装 guard 文件名';
}

// ─── Main ────────────────────────────────────────────────────

console.log(`kit-doctor 体检：${IS_SOURCE ? 'kit 源仓模式' : '实例模式'} · 项目根=${PROJECT_ROOT}  已装层=[${INSTALLED_LAYERS.join(', ')}]（来源：${layerInfo.from}）\n`);

console.log('① guard 文件在位' + (IS_SOURCE ? '（源仓须携带全部层）' : ''));
for (const line of await checkGuardsPresent()) console.log(line);

if (IS_SOURCE) {
  console.log('\n②~⑤ 跳过：源仓没有「项目配置 / 入口 / 版本 pin / 契约」可体检——这些属实例侧，装进项目后再跑本脚本。');
} else {
  console.log('\n② 配置命中探针');
  for (const line of await checkConfigProbes()) console.log(line);

  console.log('\n③ 入口接线');
  console.log(await checkEntryWiring());

  console.log('\n④ 版本 pin');
  console.log(await checkVersionPin());

  console.log('\n⑤ DoD 对账');
  const expectedGuardFiles = [...new Set(INSTALLED_LAYERS.flatMap(l => LAYER_GUARDS[l] || []))];
  console.log(await checkDodMention(expectedGuardFiles));
}

console.log('\n════════ 体检结论 ════════');
if (findings.warn.length > 0) {
  console.log(`WARN ${findings.warn.length} 条：`);
  for (const w of findings.warn) console.log(`  - ${w}`);
}
if (findings.fail.length > 0) {
  console.log(`\nFAIL ${findings.fail.length} 条：`);
  for (const f of findings.fail) console.log(`  - ${f}`);
  console.log(`\n修法：`);
  console.log(`  · guard 文件缺失 → 从 kit 仓 tools/ 重新拷入缺失文件`);
  console.log(`  · 配置零命中 → 打开对应 guard 顶部「配置」区，把扫描目录/词典路径/registry 改成本项目真实路径`);
  console.log('\nRESULT: FAIL');
  process.exitCode = 1;
} else {
  console.log('\n✓ 无 FAIL 项' + (findings.warn.length ? '（仍有 WARN，建议处理但不阻塞）' : ''));
  console.log('\nRESULT: PASS');
}
