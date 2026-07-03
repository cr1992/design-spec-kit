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
 * check-i18n.js · guard⑤ i18n 覆盖对账（design-spec-kit · 与平台无关）
 *
 * 守什么：i18n 覆盖性义务的三种漏项——
 *   ① 页面完整性：某页面文件没引用任何 i18n 运行时（漏挂 → 该页文案不走翻译）。
 *   ② 硬编码文案：代码里含 CJK 的字符串字面量、且该行没套翻译包裹器（近似判定，见下）。
 *   ③ 死键：词典里定义了、但全部使用面零出现的键（改版残留的死翻译键）。
 * 怎么跑：read_file 本文件 → 整段粘进 run_script（沙箱）；或 node tools/check-i18n.js（本地 / CI）。
 *   helper：readFile / saveFile / ls / log。末行 `RESULT: PASS|FAIL`。
 * 三维共用一个 baseline（tools/check-i18n.baseline.json，按维分组），机制仿 check-tokens：
 *   首跑固化现状，之后只报**新增**违规；args=['--write-baseline'] 重固化。
 *
 * ⚠ 前置：项目**没有 i18n 机制**（无运行时 / 无词典）则整个 guard 不装——不要空跑本文件。
 * ⚠ 维②是**启发式**：靠「行内是否出现包裹器名」近似判定，不做真正的 AST 作用域分析。
 *   常量表 / 日志 / 注释里的 CJK 可能误报；把这类文件排除出 CODE_ROOTS 或加 baseline。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

async function readDesignSpecConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json')); }
  catch { return {}; }
}
const DESIGN_SPEC_CONFIG = await readDesignSpecConfig();
const GUARD_CONFIG = DESIGN_SPEC_CONFIG.guards?.['check-i18n'] || DESIGN_SPEC_CONFIG.guards?.['check-i18n.js'] || {};
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位。例：['--write-baseline'] 把当前三维违规固化为新 baseline
const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);

// ── 维① 页面完整性 ──
// 每个页面文件必须引用下列子串之一（引到 i18n 运行时才算挂上）。★必改：换成你项目的运行时文件名 / 模块名。
const PAGE_ROOTS = cfgArray('pageRoots', ['pages', 'src']);
const PAGE_EXT   = /\.(html|js|jsx|ts|tsx|vue|svelte)$/i;
const I18N_RUNTIME_HINTS = cfgArray('runtimeHints', ['i18n.js', 'i18n-dict']);   // ★必改
// 豁免页面（如纯静态 login 无文案）：白名单命中即跳过。豁免须在 CHANGELOG 记档（输出会提醒）。
const EXEMPT_PAGES = new Set(cfgArray('exemptPages', []));   // 例：'pages/login.html'

// ── 维② 硬编码文案 ──
// CODE_ROOTS 的 js/ts 文件去注释后，含 CJK 的字符串字面量、且该行不含任何包裹器名 → 违规。
const CODE_ROOTS   = cfgArray('codeRoots', ['src', 'pages']);
const CODE_EXT     = /\.(js|jsx|ts|tsx|mjs|cjs)$/i;
const WRAPPER_NAMES = cfgArray('wrapperNames', ['t(', 'I18N.t', 'tr(']);   // ★可改：你项目的翻译调用形态

// ── 维③ 死键 ──
// 词典文件里按 KEY_RE 抽键；键名在全部使用面（PAGE_ROOTS + CODE_ROOTS）零出现 → 死键。
// DICT_PATHS 配了但读不到 → FAIL（防呆：别把词典路径写错还静默 PASS）。
const DICT_PATHS = cfgArray('dictPaths', []);   // ★必改：例 ['src/i18n-dict.js']。留空 = 不查维③。
const KEY_RE     = /["']([\w.]+(?:\.[\w.]+)+)["']\s*:/g;   // ★按项目改：默认匹配 "a.b.c": 形态（含点的键路径）

// 整目录级 skip（依赖 / 构建产物 / 归档 / 工具 / 草稿 / 版本库）
const SKIP_DIRS = new Set(cfgArray('skipDirs', ['node_modules', 'dist', 'build', '.git', '_archive', 'tools', 'uploads', 'vendor', 'drafts', 'export']));

const BASELINE_PATH = cfgValue('baselinePath', 'tools/check-i18n.baseline.json');

// ─── 去注释（保留位置，方便行号反查）──────────────────────────
const stripHtml = s => s.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
const stripJs   = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
                       .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
const extOf = p => p.slice(p.lastIndexOf('.')).toLowerCase();
const stripAny = (s, ext) => ext === '.html' || ext === '.vue' || ext === '.svelte' ? stripHtml(s) : stripJs(s);

function lineOf(src, idx) {
  let l = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++;
  return l;
}

// ─── 收集文件 ──────────────────────────────────────────────────
async function walk(dir, out, extRe) {
  let entries;
  try { entries = await ls(dir); } catch { return; }
  if (!entries || entries.length === 0) return;
  for (const name of entries) {
    const path = dir ? dir + '/' + name : name;
    if (extRe.test(name)) out.push(path);
    else if (!name.includes('.') && !SKIP_DIRS.has(name)) await walk(path, out, extRe);
  }
}
async function collect(roots, extRe) {
  const out = [];
  for (const r of roots) await walk(r, out, extRe);
  return [...new Set(out)];
}

// ─── 维① 页面完整性 ────────────────────────────────────────────
async function scanPages() {
  const hits = [];
  const files = await collect(PAGE_ROOTS, PAGE_EXT);
  for (const f of files) {
    if (EXEMPT_PAGES.has(f)) continue;
    let src; try { src = await readFile(f); } catch { continue; }
    const has = I18N_RUNTIME_HINTS.some(h => src.includes(h));
    if (!has) hits.push({ dim: 'page', file: f, line: 1, match: f });
  }
  return hits;
}

// ─── 维② 硬编码文案（启发式：含 CJK 字面量 + 该行无包裹器）────────
const CJK = /[㐀-鿿豈-﫿　-〿＀-￯]/;
const STR_LIT = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;

async function scanHardcoded() {
  const hits = [];
  const files = await collect(CODE_ROOTS, CODE_EXT);
  for (const f of files) {
    let src; try { src = await readFile(f); } catch { continue; }
    const cleaned = stripJs(src);
    const lines = cleaned.split('\n');
    let m; STR_LIT.lastIndex = 0;
    while ((m = STR_LIT.exec(cleaned)) !== null) {
      const lit = m[1] ?? m[2] ?? m[3] ?? '';
      if (!CJK.test(lit)) continue;
      const line = lineOf(cleaned, m.index);
      const lineText = lines[line - 1] || '';
      if (WRAPPER_NAMES.some(w => lineText.includes(w))) continue;   // 该行套了包裹器，放行
      hits.push({ dim: 'hardcoded', file: f, line, match: lit.slice(0, 40) });
    }
  }
  return hits;
}

// ─── 维③ 死键 ──────────────────────────────────────────────────
// 返回 { hits, dictError }。dictError = 配了 DICT_PATHS 但某个读不到（防呆 → FAIL）。
async function scanDeadKeys() {
  const hits = [];
  let dictError = null;
  if (DICT_PATHS.length === 0) return { hits, dictError };

  const keys = [];   // { key, file, line }
  for (const dp of DICT_PATHS) {
    let src;
    try { src = await readFile(dp); } catch { dictError = dp; continue; }
    const cleaned = stripJs(src);
    let m; KEY_RE.lastIndex = 0;
    while ((m = KEY_RE.exec(cleaned)) !== null) keys.push({ key: m[1], file: dp, line: lineOf(cleaned, m.index) });
  }
  if (dictError) return { hits, dictError };

  // 使用面 = PAGE_ROOTS + CODE_ROOTS 全部文件（去注释后拼一大袋），排除词典本身避免自命中。
  const usageFiles = [
    ...await collect(PAGE_ROOTS, PAGE_EXT),
    ...await collect(CODE_ROOTS, CODE_EXT),
  ].filter(f => !DICT_PATHS.includes(f));
  const blobs = [];
  for (const f of [...new Set(usageFiles)]) {
    let src; try { src = await readFile(f); } catch { continue; }
    blobs.push(stripAny(src, extOf(f)));
  }
  const bigUsage = blobs.join('\n');

  for (const k of keys) {
    const esc = k.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(esc).test(bigUsage)) hits.push({ dim: 'deadkey', file: k.file, line: k.line, match: k.key });
  }
  return { hits, dictError };
}

// ─── Baseline（三维分组，仿 check-tokens）────────────────────────
function keyOf(h) { return `${h.dim}::${h.file}::${h.match}`; }

function baselineKeys(b) {
  const s = new Set();
  if (!b || !b.dims) return s;
  for (const [dim, files] of Object.entries(b.dims)) {
    for (const [f, arr] of Object.entries(files)) for (const e of arr) s.add(`${dim}::${f}::${e.match}`);
  }
  return s;
}

function buildBaseline(hits, reason) {
  const dims = {};
  for (const h of hits) {
    const d = dims[h.dim] = dims[h.dim] || {};
    (d[h.file] = d[h.file] || []).push({ line: h.line, match: h.match });
  }
  for (const dim of Object.keys(dims))
    for (const f of Object.keys(dims[dim]))
      dims[dim][f].sort((a, b) => a.line - b.line || a.match.localeCompare(b.match));
  return {
    note: '已认证保留的 i18n 覆盖违规清单（按 page/hardcoded/deadkey 三维分组）。新增违规须修代码或显式加到这里。',
    generatedAt: new Date().toISOString().slice(0, 10),
    reason: reason || 'baseline write',
    totalEntries: hits.length,
    dims,
  };
}

// ─── Main（top-level await）────────────────────────────────────
const writeBaseline = EFFECTIVE_ARGS.includes('--write-baseline');

const [pageHits, hardHits, deadRes] = await Promise.all([scanPages(), scanHardcoded(), scanDeadKeys()]);
const allHits = [...pageHits, ...hardHits, ...deadRes.hits];

log(`i18n · page漏挂: ${pageHits.length} · 硬编码: ${hardHits.length} · 死键: ${deadRes.hits.length}${deadRes.dictError ? ' · 词典读取失败!' : ''}`);

// 防呆：DICT_PATHS 配了但读不到 → 直接 FAIL，不进 baseline 逻辑（否则等于静默放过）
if (deadRes.dictError) {
  log(`\n✗ 维③防呆：DICT_PATHS 里的词典读不到 → ${deadRes.dictError}`);
  log(`  修法：改对 DICT_PATHS 路径；确实移除了词典 → 把该条从 DICT_PATHS 删掉。`);
  log(`\nRESULT: FAIL`);
  if (globalThis.__NODE__) process.exitCode = 1;
} else if (writeBaseline) {
  await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(allHits, 'manual --write-baseline'), null, 2) + '\n');
  log(`✓ baseline rewritten: ${BASELINE_PATH} (${allHits.length} entries)`);
  log(`\nRESULT: PASS`);
} else {
  let baseline = null;
  try { baseline = JSON.parse(await readFile(BASELINE_PATH)); } catch { /* no baseline */ }

  if (!baseline) {
    await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(allHits, 'first run'), null, 2) + '\n');
    log(`✓ baseline created: ${BASELINE_PATH} (${allHits.length} entries) — 复查后再跑一次进入 diff 模式`);
    log(`\nRESULT: PASS`);
  } else {
    const allowed = baselineKeys(baseline);
    const news    = allHits.filter(h => !allowed.has(keyOf(h)));
    const removed = [...allowed].filter(k => !allHits.some(h => keyOf(h) === k));

    log(`baseline: ${allowed.size} entries · removed: ${removed.length} · new: ${news.length}`);

    if (removed.length > 0) {
      log(`\n✓ ${removed.length} 处 baseline 违规已消失（干得漂亮）`);
      for (const k of removed.slice(0, 20)) log('    cleared: ' + k);
      if (removed.length > 20) log(`    ... 还有 ${removed.length - 20} 处`);
      log(`  → 跑一次 args=['--write-baseline'] 同步 baseline\n`);
    }

    if (news.length > 0) {
      const label = { page: '页面漏挂 i18n 运行时', hardcoded: '硬编码 CJK 文案', deadkey: '词典死键' };
      log(`\n✗ ${news.length} 处新增 i18n 覆盖违规：`);
      const byDim = {};
      for (const h of news) (byDim[h.dim] = byDim[h.dim] || []).push(h);
      for (const [dim, arr] of Object.entries(byDim)) {
        log(`  [${label[dim] || dim}]`);
        for (const h of arr) log(`    ${h.file}:L${h.line}  ${h.match}`);
      }
      log(`\n修法：`);
      log(`  1. 页面漏挂 → 引入 i18n 运行时（${I18N_RUNTIME_HINTS.join(' / ')}）；纯静态无文案页 → 加 EXEMPT_PAGES 并在 CHANGELOG 记档。`);
      log(`  2. 硬编码文案 → 抽进词典改走包裹器（${WRAPPER_NAMES.join(' / ')}）；常量 / 日志误报 → 排除该文件或加 baseline。`);
      log(`  3. 死键 → 删掉没人用的翻译键；确要保留 → args=['--write-baseline'] 并记档。`);
      log(`\nRESULT: FAIL`);
      if (globalThis.__NODE__) process.exitCode = 1;
    } else if (removed.length === 0) {
      log('✓ check-i18n: 0 新增 · 0 减少 · baseline 保持不变');
      log(`\nRESULT: PASS`);
    } else {
      log(`\nRESULT: PASS`);
    }
  }
}
