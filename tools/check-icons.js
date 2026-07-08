// ── 双环境运行时（design-spec-kit 标准头）────────────────────────
// 环境 A：无 shell 的 AI 沙箱 run_script——自带全局 readFile(p)/saveFile(p,c)/ls(dir)/log(...)，整段粘贴执行。
// 环境 B：本地 / CI node ≥18（kit package.json "type":"module"）——node tools/<本文件> [--flags]
// 约定：全文件禁顶层 import/export；node 能力只经此 shim。
if (typeof readFile !== 'function') {
  const fs = await import('node:fs/promises');
  const pathmod = await import('node:path');
  globalThis.readFile = (p) => fs.readFile(p, 'utf8');
  globalThis.saveFile = async (p, c) => { const d = pathmod.dirname(p); if (d && d !== '.') await fs.mkdir(d, { recursive: true }); await fs.writeFile(p, c); };
  globalThis.ls = (d) => fs.readdir(d || '.');
  globalThis.log = (...a) => console.log(...a);
  globalThis.__NODE__ = true;
}

/**
 * check-icons.js · 图标同名异形 + 同形重画防漂移扫描（design-spec-kit · 与平台无关）
 *
 * 守什么：图标单一源纪律——一个 icons 库，勿 per-file 各画一版、也勿把库里的字形 inline 复制粘贴。
 *   两类漂移都抓：
 *     ❌ drift      同一图标名 ≥2 版不同字形（真问题）——同名异形。它让图标长相飘，还卡住「按名抽取」的 icon-gen。
 *     ❌ duplicate  registry 里注册过的字形被某文件 inline `<svg>` 复制（同形重画 · 走 baseline）。
 *     ℹ shared     同名跨 ≥2 文件但字形一致（DRY 信号：该提进单一图标库）。
 * 怎么跑（双环境）：
 *   · AI 沙箱：read_file 本文件 → 整段粘进 run_script（自带 readFile/saveFile/ls/log）。
 *   · 本地 / CI：node tools/check-icons.js [--write-baseline]（node ≥18）。
 *   看末行 `RESULT: PASS|FAIL`；FAIL 时 node 侧给退出码 1。
 * 配置说明：★必改项见「配置」区——SCAN_ROOTS、REGISTRY_SOURCES、DEF_PATTERNS（按项目图标写法启用）。
 *
 * 解决纪律（重要）：**绝不静默选一个 winner**——同形漂移收敛到 canonical；同名但语义不同 → **改名**让两者各有其名，
 *   别合并丢字形。即便两版碰巧也异形，先分清「同义漂移」还是「同名异义」：异义必改名，别按 trivial 收敛合并。
 * 假 PASS 防线：若配了 REGISTRY_SOURCES 却抽到 0 条定义 → 直接 FAIL（DEF_PATTERNS 没适配本项目写法）。
 *   baseline：tools/check-icons.baseline.json 记「已认证保留」的同形重画（duplicate），首跑固化、之后只报新增。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

async function readDesignSpecConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json')); }
  catch { return {}; }
}
const DESIGN_SPEC_CONFIG = await readDesignSpecConfig();
// ── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）：runner 经 DESIGN_SPEC_KIT_MODULE 传模块名 ──
const moduleOverride = '';   // 沙箱手改位：无 shell 粘贴执行时手填模块名
const KIT_MODULE = moduleOverride || globalThis.process?.env?.DESIGN_SPEC_KIT_MODULE || '';
const pickGuardCfg = (node) => node?.guards?.['check-icons'] || node?.guards?.['check-icons.js'] || {};
const MODULE_GUARD_CONFIG = KIT_MODULE ? pickGuardCfg(DESIGN_SPEC_CONFIG.modules?.[KIT_MODULE]) : {};
// key 级浅合并：模块键覆盖顶层公共缺省（数组整键替换，不做深合并）
const GUARD_CONFIG = KIT_MODULE ? { ...pickGuardCfg(DESIGN_SPEC_CONFIG), ...MODULE_GUARD_CONFIG } : pickGuardCfg(DESIGN_SPEC_CONFIG);
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位。例：['--write-baseline'] 把当前 duplicate 固化为新 baseline

const SCAN_ROOTS = cfgArray('scanRoots', ['src', 'components', 'pages', 'assets', 'design-system']);
const SKIP_DIRS  = new Set(cfgArray('skipDirs', ['node_modules', 'dist', 'build', '.git', '_archive', 'tools', 'uploads', 'vendor', 'drafts', 'export']));
const CODE_EXT   = /\.(js|jsx|ts|tsx|vue|svelte|html)$/i;

// ① registry 源文件 = 项目「单一图标库」的真源文件（★按项目填）。用于同形重画维：
//    这些文件里的字形被别处 inline 复制 = duplicate。留空数组 = 关闭同形重画维（只跑同名异形）。
const REGISTRY_SOURCES = cfgArray('registrySources', []);   // 例：['src/icons/registry.js']

// 故意保留的同名异形例外（如特色 / 动画版与标准版并存）：填 'name' 跳过。
const IGNORE = new Set(cfgArray('ignore', []));

// ② 图标定义抽取（线性正则，避免回溯）：捕获组 1 = 名，组 2 = 字形。★按项目图标写法启用需要的行。
const DEF_PATTERNS = [
  /([a-zA-Z][\w-]*)\s*:\s*svg\('([^']*)'(?:\s*,\s*[\d.]+)?\)/g,   // name: svg('...')            helper 包裹
  /([a-zA-Z][\w-]*)\s*:\s*'(<svg[^']*)'/g,                        // name: '<svg ...>'           内联整段
  /([a-zA-Z][\w-]*)\s*:\s*\{\s*s\s*:\s*[\d.]+\s*,\s*p\s*:\s*'([^']*)'\s*\}/g, // name: { s: <n>, p: '<path .../>' }  对象式（按项目启用）
];

// 模块模式 baseline 强制分账：不继承顶层 baselinePath（两模块混一本账 = 债无归属）
const BASELINE_PATH = KIT_MODULE
  ? (MODULE_GUARD_CONFIG.baselinePath || `docs/design-spec/baselines/${KIT_MODULE}/check-icons.baseline.json`)
  : cfgValue('baselinePath', 'tools/check-icons.baseline.json');
// 迁移防线：模块 baseline 缺失而旧全局 baseline 仍在 → FAIL，拒绝静默重建空债 baseline（= 历史债清零）
if (KIT_MODULE && !MODULE_GUARD_CONFIG.baselinePath) {
  const legacyBaseline = pickGuardCfg(DESIGN_SPEC_CONFIG).baselinePath || 'tools/check-icons.baseline.json';
  const fileExists = async (p) => { try { await readFile(p); return true; } catch { return false; } };
  if (!(await fileExists(BASELINE_PATH)) && (await fileExists(legacyBaseline))) {
    log(`✗ 模块 '${KIT_MODULE}' 无 baseline（${BASELINE_PATH}），但旧全局 baseline 仍在（${legacyBaseline}）`);
    log(`  多模块迁移须显式搬移该文件，或在 modules.${KIT_MODULE}.guards['check-icons'] 配 baselinePath`);
    log('RESULT: FAIL');
    if (globalThis.__NODE__) globalThis.process.exit(1);
    throw new Error('baseline migration required');
  }
}

const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);

// ─── 扫描工具 ──────────────────────────────────────────────────

// 字形规范化：去 <svg> 外壳、去空白、引号统一为单引号、转小写——同形比对的判据
const norm = s => String(s)
  .replace(/<svg[^>]*>/i, '').replace(/<\/svg>/i, '')
  .replace(/"/g, "'")
  .replace(/\s+/g, '')
  .toLowerCase();

const baseName = p => p.replace(/^.*\//, '');

async function walk(dir, out) {
  let e; try { e = await ls(dir); } catch { return; }
  for (const n of e || []) {
    const p = dir ? dir + '/' + n : n;
    if (CODE_EXT.test(n)) out.push(p);
    else if (!n.includes('.') && !SKIP_DIRS.has(n)) await walk(p, out);
  }
}

// 从一段源码抽出所有图标定义 [{name, sig}]
function extractDefs(src) {
  const defs = [];
  for (const re of DEF_PATTERNS) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(src)) !== null) {
      const sig = norm(m[2]);
      if (sig) defs.push({ name: m[1], sig });
    }
  }
  return defs;
}

function lineOf(src, idx) { let l = 1; for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++; return l; }

// ─── 收集 ──────────────────────────────────────────────────────

const files = []; for (const r of SCAN_ROOTS) await walk(r, files);
const scanFiles = [...new Set(files)];
const contents = await Promise.all(scanFiles.map(async f => ({ f, s: await readFile(f).catch(() => '') })));

// ─── 维一：同名异形（drift） / 同名同形跨文件（shared）──────────

// name -> sig -> Set(fileBaseName)
const map = {};
let totalDefs = 0;
for (const { f, s } of contents) {
  for (const { name, sig } of extractDefs(s)) {
    totalDefs++;
    (map[name] = map[name] || {});
    (map[name][sig] = map[name][sig] || new Set()).add(baseName(f));
  }
}

// ─── 维二：同形重画（duplicate）—— registry 字形被 inline 复制 ──

// 从 REGISTRY_SOURCES 抽注册字形：sig -> name
const registrySigs = new Map();
let registryDefs = 0;
for (const src of REGISTRY_SOURCES) {
  const s = await readFile(src).catch(() => '');
  for (const { name, sig } of extractDefs(s)) { registrySigs.set(sig, name); registryDefs++; }
}

// 扫描文件里的 inline <svg>...</svg>；内容 norm 后命中 registry 字形 = duplicate
const RE_INLINE_SVG = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
const dupHits = [];   // {file, line, name}
if (registrySigs.size > 0) {
  const registryBaseSet = new Set(REGISTRY_SOURCES.map(baseName));
  for (const { f, s } of contents) {
    if (registryBaseSet.has(baseName(f))) continue;   // registry 文件自身不算复制
    RE_INLINE_SVG.lastIndex = 0; let m;
    while ((m = RE_INLINE_SVG.exec(s)) !== null) {
      const sig = norm(m[0]);
      if (registrySigs.has(sig)) dupHits.push({ file: f, line: lineOf(s, m.index), name: registrySigs.get(sig) });
    }
  }
}

// ─── 报告 ──────────────────────────────────────────────────────

const names = Object.keys(map).sort();
const drift = [], shared = [];
for (const n of names) {
  if (IGNORE.has(n)) continue;
  const sigs = Object.keys(map[n]);
  const fileSet = new Set(); for (const sg of sigs) for (const x of map[n][sg]) fileSet.add(x);
  if (sigs.length >= 2) drift.push([n, sigs.length, sigs.map(sg => [...map[n][sg]].join('+'))]);
  else if (fileSet.size >= 2) shared.push([n, fileSet.size]);
}

log(`scanned ${contents.length} files · ${names.length} icon names · ${totalDefs} defs · drift ${drift.length} · shared(dup) ${shared.length}`);

let fail = false;

// 假 PASS 防线：配了 registry 却抽到 0 条定义 → DEF_PATTERNS 没适配
if (REGISTRY_SOURCES.length > 0 && registryDefs === 0) {
  fail = true;
  log(`\n✗ 配了 REGISTRY_SOURCES（${REGISTRY_SOURCES.length} 个源文件）却抽到 0 条图标定义：`);
  log(`  → DEF_PATTERNS 未适配本项目图标写法。核对 registry 里图标是怎么写的，改 DEF_PATTERNS 的捕获组（1=名 / 2=字形）。`);
  log(`  （registry 抽不到 = 同形重画维形同虚设，不能假装 PASS。）`);
}

if (drift.length) {
  fail = true;
  log(`\n✗ 同名异形（收敛到 canonical；语义不同则改名——绝不静默选 winner）：`);
  for (const [n, c, grps] of drift) log(`  ${n}: ${c} 版 → ${grps.join('  |  ')}`);
}

// 同形重画 → baseline diff（duplicate）
const writeBaseline = EFFECTIVE_ARGS.includes('--write-baseline');
function dupKey(h) { return `${h.file}::${h.name}`; }
function buildBaseline(hits) {
  const grouped = {};
  for (const h of hits) (grouped[h.file] = grouped[h.file] || []).push({ line: h.line, name: h.name });
  for (const f of Object.keys(grouped)) grouped[f].sort((a, b) => a.line - b.line || a.name.localeCompare(b.name));
  return {
    note: '已认证保留的图标同形重画（registry 字形被 inline 复制）清单。新增需改用图标库引用或显式加到这里。',
    generatedAt: new Date().toISOString().slice(0, 10),
    totalEntries: hits.length,
    files: grouped,
  };
}
function baselineKeys(b) {
  const s = new Set();
  if (!b || !b.files) return s;
  for (const [f, arr] of Object.entries(b.files)) for (const e of arr) s.add(`${f}::${e.name}`);
  return s;
}

if (registrySigs.size > 0) {
  if (writeBaseline) {
    await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(dupHits), null, 2) + '\n');
    log(`\n✓ icons baseline rewritten: ${BASELINE_PATH} (${dupHits.length} entries)`);
  } else {
    let baseline = null;
    try { baseline = JSON.parse(await readFile(BASELINE_PATH)); } catch { /* none */ }
    if (!baseline) {
      await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(dupHits), null, 2) + '\n');
      log(`\n✓ icons baseline created: ${BASELINE_PATH} (${dupHits.length} entries) — 复查后再跑一次进入 diff 模式`);
    } else {
      const allowed = baselineKeys(baseline);
      const newDup = dupHits.filter(h => !allowed.has(dupKey(h)));
      if (newDup.length) {
        fail = true;
        log(`\n✗ ${newDup.length} 处新增同形重画（registry 字形被 inline 复制）：`);
        for (const h of newDup) log(`    ${h.file}  L${h.line}  复制了图标 ${h.name}`);
        log(`  修法：改引用图标库（勿把字形 inline 复制粘贴）；确需保留 → args=['--write-baseline'] 并在 CHANGELOG 写明理由`);
      }
    }
  }
}

if (shared.length) {
  log(`\nℹ 同名同形跨多文件（该提进单一图标库 / DRY）：`);
  for (const [n, c] of shared) log(`  ${n}: ${c} 文件`);
}

log(`\nRESULT: ${fail ? 'FAIL' : 'PASS'}`);
if (fail && globalThis.__NODE__) process.exitCode = 1;
