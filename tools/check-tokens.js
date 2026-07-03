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
 * check-tokens.js · token 纪律防漂移扫描（design-spec-kit · 与平台无关）
 *
 * 守什么：把「颜色一律 var(--*)、数值唯一真源在 tokens.css」这条自觉纪律变成可机检 DoD，
 *   直接挡住页面漂移最常见的两类——颜色越走越散（#3b82f6 / #3a80f5），尺寸越走越歪（padding 13 / 18）。
 * 怎么跑（双环境）：
 *   · AI 沙箱：read_file 本文件 → 整段粘进 run_script（自带 readFile/saveFile/ls/log）。
 *   · 本地 / CI：node tools/check-tokens.js [--write-baseline]（node ≥18）。
 *   看末行 `RESULT: PASS|FAIL`；FAIL 时 node 侧给退出码 1。
 * 配置说明：★必改项见下方「配置」区注释——SCAN_ROOTS、尺寸档集、（可选）CONVENTION_RULES。
 *   首次跑自动生成 baseline（接受现状），之后只报新增违规。
 *
 * 扫 .css/.scss/.less/.js/.jsx/.ts/.tsx/.html/.vue/.svelte，抓违反 token 纪律的代码：
 *
 *  ── 颜色维（一直有）──
 *   ❌ bare-hex          `#abc` / `#abcdef` / `#abcdef88`
 *   ❌ bare-rgba         `rgba(0,0,0,.5)`
 *   ❌ fake-fallback     `var(--x, #fff)` / `var(--x, rgba(...))`
 *                       （允许 `var(--x, var(--y))` token→token fallback）
 *
 *  ── 尺寸维（可选 · 档集留空即关闭该子维）──
 *   ❌ off-fs / off-space / off-radius / inline-shadow   离档 px 或内联 box-shadow（未走 var(--shadow-*)）
 *   ★ 档集 = 你 tokens.css 里 --fs-* / --sp-* / --r-* 的真实数值。**别照抄别的项目的刻度。**
 *
 *  ── 约定维（可选 · CONVENTION_RULES 留空即关闭）──
 *   ❌ conv:<name>       项目自定义的可 grep 纪律（如某词禁上屏、某写法禁用），命中即违规。
 *
 *  baseline：tools/check-tokens.baseline.json 记「已认证保留」的违规快照，只报增量。
 *    v2 语义：按「出现次数」计——同一 key(file::kind::match) 实扫次数 > baseline 次数，超出部分算新增（报行号）；
 *    实扫少于 baseline 则算 removed。修掉了 v1「同值再新增被 baseline 预豁免」的缺陷。
 *    要把当前全部违规重新固化为 baseline → args 设成 ['--write-baseline']。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

const args = [];   // 沙箱手改位。例：['--write-baseline'] 把当前扫描结果固化为新 baseline

// ① 扫哪些目录（递归）。默认列了常见目录名，不存在的自动跳过——通常按你的项目补一两个即可。★按项目核对
const SCAN_ROOTS = ['src', 'styles', 'css', 'components', 'pages', 'design-system'];
const ROOT_FILES = [];                       // 需要额外扫的根散件（可留空）
const CODE_EXT   = /\.(css|scss|less|js|jsx|ts|tsx|vue|svelte|html)$/i;

// 整目录级 skip（依赖 / 构建产物 / 归档 / 工具 / 草稿 / 版本库 —— 按你的项目增删）
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '_archive', 'tools', 'uploads', 'vendor', 'drafts', 'export']);
// 整文件级 skip：token 唯一真源（hex/rgba 合法定义于此）
const isSkipFile = p => /(^|\/)tokens\.css$/i.test(p);

const BASELINE_PATH = 'tools/check-tokens.baseline.json';

// ② 尺寸档集 = 你 tokens.css 的真实刻度（★必改）。下面是「4px 基准」示例，按你的项目替换。
//    留空集 new Set() = 关闭对应子维（颜色维始终开）。
const FS_OK     = new Set([12, 13, 14, 16, 18, 20, 24, 30, 36]);            // 字号档 --fs-*
const SPACE_OK  = new Set([4, 8, 12, 16, 20, 24, 32, 40, 48, 64]);         // 间距档 --sp-*（4px 步进示例）
const RADIUS_OK = new Set([4, 6, 8, 12, 16, 999]);                          // 圆角档 --r-*
// z-index：若你 tokens.css 定了 --z-* 刻度，可仿照加 Z_OK + 'z-index' 分支；默认不查。

// 属性 → 档集映射。只查这几族；width/height/top/left/inset 等是任意尺寸，不纳入。
const FS_PROPS    = new Set(['font-size']);
const SPACE_PROPS = new Set([
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-inline', 'padding-block', 'padding-inline-start', 'padding-inline-end',
  'padding-block-start', 'padding-block-end',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-inline', 'margin-block', 'margin-inline-start', 'margin-inline-end',
  'margin-block-start', 'margin-block-end',
  'gap', 'row-gap', 'column-gap', 'grid-gap',
]);
const RADIUS_PROPS = new Set([
  'border-radius', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-right-radius', 'border-bottom-left-radius',
  'border-start-start-radius', 'border-start-end-radius',
  'border-end-start-radius', 'border-end-end-radius',
]);

// ③ 约定维（★可选 · 默认关闭）：把项目里「可 grep 的自觉纪律」变成 guard 维度。
//    每条 { name, ext(文件名正则), re(命中即违规的内容正则), message }。命中算违规，
//    kind = 'conv:' + name，走同一 baseline 机制。默认空数组 = 关闭本维。
//    示例（默认注释掉）：禁止某占位词上屏 / 禁用某写法——
//    const CONVENTION_RULES = [
//      { name: 'no-todo-text', ext: /\.(html|vue|svelte|jsx|tsx)$/i, re: /\bTODO\b/g, message: '占位词禁上屏，改真实文案或移进注释' },
//    ];
const CONVENTION_RULES = [];

const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);

// ─── 颜色规则 ──────────────────────────────────────────────────

// 单一组合 regex：fake-fallback 优先 → 裸 hex/rgba 兜底
const RE = /var\(\s*--[a-z0-9-]+\s*,\s*#[0-9A-Fa-f]{3,8}\s*\)|var\(\s*--[a-z0-9-]+\s*,\s*rgba?\([^)]*\)\s*\)|#[0-9A-Fa-f]{3,8}\b|\brgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi;

function classify(m) {
  if (m.startsWith('var(')) return m.includes('#') ? 'fake-fallback-hex' : 'fake-fallback-rgba';
  return m.startsWith('#') ? 'bare-hex' : 'bare-rgba';
}

// ─── 尺寸维工具 ────────────────────────────────────────────────

const DECL_RE = /([a-z][a-z-]+)\s*:\s*([^;{}]+)/gi;   // `prop: value`，value 取到 ; { } 为止

function pxTokens(val) {
  const out = []; const re = /(-?\d*\.?\d+)px\b/gi; let m;
  while ((m = re.exec(val)) !== null) out.push({ raw: m[0], n: Math.abs(parseFloat(m[1])) });
  return out;
}
function offScale(prop, val, okSet) {
  const bad = [];
  if (!okSet || okSet.size === 0) return bad;        // 空集 = 该子维关闭
  for (const t of pxTokens(val)) {
    if (t.n === 0) continue;                          // 0px 永远合法
    if (!okSet.has(t.n)) bad.push(`${prop}:${t.raw}`);
  }
  return bad;
}
function shadowOff(val) {
  const v = val.trim().toLowerCase();
  if (v === '' || v === 'none' || v === 'inherit' || v === 'initial' || v === 'unset' || v === 'revert') return false;
  const rest = v.replace(/var\(\s*--shadow-[a-z0-9-]+\s*(?:,[^)]*)?\)/g, '').replace(/[\s,]+/g, '');
  return rest.length > 0;
}

// 用空格替换注释内容（保留位置，方便行号反查）
const stripCss  = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
const stripHtml = s => s.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
const stripJs   = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
                       .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
const extOf  = p => p.slice(p.lastIndexOf('.')).toLowerCase();
const strip  = (s, ext) => ext === '.css' || ext === '.scss' || ext === '.less' ? stripCss(s)
                         : ext === '.html' || ext === '.vue' || ext === '.svelte' ? stripHtml(s)
                         : stripJs(s);

function lineOf(src, idx) {
  let l = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++;
  return l;
}

// ─── 收集文件（递归遍历 SCAN_ROOTS）─────────────────────────────

async function walk(dir, out) {
  let entries;
  try { entries = await ls(dir); } catch { return; }
  if (!entries || entries.length === 0) return;
  for (const name of entries) {
    const path = dir ? dir + '/' + name : name;
    if (CODE_EXT.test(name)) {
      if (!isSkipFile(path)) out.push(path);
    } else if (!name.includes('.') && !SKIP_DIRS.has(name)) {
      await walk(path, out);
    }
  }
}

async function collectFiles() {
  const out = [];
  for (const r of SCAN_ROOTS) await walk(r, out);
  for (const f of ROOT_FILES) if (!isSkipFile(f)) out.push(f);
  return [...new Set(out)];
}

// ─── 扫描 ──────────────────────────────────────────────────────

const PARALLEL_BATCH = 24;

function baseNameOf(p) { return p.slice(p.lastIndexOf('/') + 1); }

async function scanAll(files) {
  const allHits = [];
  for (let i = 0; i < files.length; i += PARALLEL_BATCH) {
    const batch = files.slice(i, i + PARALLEL_BATCH);
    const contents = await Promise.all(batch.map(async f => {
      try { return { f, src: await readFile(f) }; }
      catch { return { f, src: null }; }
    }));
    for (const { f, src } of contents) {
      if (!src) continue;
      const ext = extOf(f);
      const cleaned = strip(src, ext);
      let m; RE.lastIndex = 0;
      while ((m = RE.exec(cleaned)) !== null) {
        allHits.push({ file: f, line: lineOf(src, m.index), kind: classify(m[0]), match: m[0] });
      }
      let d; DECL_RE.lastIndex = 0;
      while ((d = DECL_RE.exec(cleaned)) !== null) {
        const prop = d[1].toLowerCase(), val = d[2], line = lineOf(src, d.index);
        if (FS_PROPS.has(prop)) {
          for (const mt of offScale(prop, val, FS_OK)) allHits.push({ file: f, line, kind: 'off-fs', match: mt });
        } else if (SPACE_PROPS.has(prop)) {
          for (const mt of offScale(prop, val, SPACE_OK)) allHits.push({ file: f, line, kind: 'off-space', match: mt });
        } else if (RADIUS_PROPS.has(prop)) {
          for (const mt of offScale(prop, val, RADIUS_OK)) allHits.push({ file: f, line, kind: 'off-radius', match: mt });
        } else if (prop === 'box-shadow') {
          if (shadowOff(val)) allHits.push({ file: f, line, kind: 'inline-shadow', match: 'box-shadow:' + val.trim().replace(/\s+/g, ' ') });
        }
      }
      // 约定维：对文件名命中的规则逐条跑正则，命中即违规（走 baseline 机制）
      const base = baseNameOf(f);
      for (const rule of CONVENTION_RULES) {
        if (!rule || !rule.re || (rule.ext && !rule.ext.test(base))) continue;
        rule.re.lastIndex = 0; let cm;
        while ((cm = rule.re.exec(cleaned)) !== null) {
          allHits.push({ file: f, line: lineOf(src, cm.index), kind: 'conv:' + rule.name, match: cm[0] });
          if (cm.index === rule.re.lastIndex) rule.re.lastIndex++;   // 防零宽匹配死循环
        }
      }
    }
  }
  return allHits;
}

// ─── Baseline diff（v2：按出现次数计）──────────────────────────

function keyOf(h) { return `${h.file}::${h.kind}::${h.match}`; }

// baseline / 实扫 → Map(key -> 出现次数)
function countMap(items) {
  const m = new Map();
  for (const it of items) { const k = keyOf(it); m.set(k, (m.get(k) || 0) + 1); }
  return m;
}
function baselineCounts(b) {
  const m = new Map();
  if (!b || !b.files) return m;
  for (const [f, arr] of Object.entries(b.files)) {
    for (const e of arr) { const k = `${f}::${e.kind}::${e.match}`; m.set(k, (m.get(k) || 0) + 1); }
  }
  return m;
}

function buildBaseline(hits, reason) {
  const grouped = {};
  for (const h of hits) (grouped[h.file] = grouped[h.file] || []).push({ line: h.line, kind: h.kind, match: h.match });
  for (const f of Object.keys(grouped)) grouped[f].sort((a, b) => a.line - b.line || a.match.localeCompare(b.match));
  return {
    note: '已认证保留的 token 违规清单（按出现次数计）。同 key 再新增一处也算新增，需修代码或显式加到这里。',
    generatedAt: new Date().toISOString().slice(0, 10),
    reason: reason || 'baseline write',
    totalEntries: hits.length,
    files: grouped,
  };
}

// ─── Main（top-level await — run_script 直接执行）──────────────

const writeBaseline = EFFECTIVE_ARGS.includes('--write-baseline');

const files = await collectFiles();
const hits = await scanAll(files);
log(`scanned ${files.length} files · ${hits.length} violations`);

if (writeBaseline) {
  await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(hits, 'manual --write-baseline'), null, 2) + '\n');
  log(`✓ baseline rewritten: ${BASELINE_PATH} (${hits.length} entries)`);
} else {
  let baseline = null;
  try { baseline = JSON.parse(await readFile(BASELINE_PATH)); } catch { /* no baseline */ }

  if (!baseline) {
    await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(hits, 'first run'), null, 2) + '\n');
    log(`✓ baseline created: ${BASELINE_PATH} (${hits.length} entries) — 复查后再跑一次进入 diff 模式`);
    log(`\nRESULT: PASS`);
  } else {
    const allowed = baselineCounts(baseline);            // key -> 允许次数
    const scanned = countMap(hits);                       // key -> 实扫次数

    // 新增：实扫次数 > baseline 次数，超出部分逐条报（挑该 key 行号靠后的几条当代表）
    const hitsByKey = new Map();
    for (const h of hits) { const k = keyOf(h); if (!hitsByKey.has(k)) hitsByKey.set(k, []); hitsByKey.get(k).push(h); }
    const news = [];
    for (const [k, cnt] of scanned) {
      const allow = allowed.get(k) || 0;
      const extra = cnt - allow;
      if (extra > 0) {
        const arr = (hitsByKey.get(k) || []).slice().sort((a, b) => a.line - b.line);
        for (const h of arr.slice(arr.length - extra)) news.push(h);   // 超出的取靠后出现的实例
      }
    }
    // removed：baseline 有、实扫次数不足
    let removedCount = 0; const removedKeys = [];
    for (const [k, allow] of allowed) {
      const have = scanned.get(k) || 0;
      if (have < allow) { removedCount += (allow - have); removedKeys.push(`${k} (-${allow - have})`); }
    }

    log(`baseline: ${[...allowed.values()].reduce((a, b) => a + b, 0)} entries · removed: ${removedCount} · new: ${news.length}`);

    if (removedCount > 0) {
      log(`\n✓ ${removedCount} 处 baseline 违规已被清理（干得漂亮）`);
      for (const k of removedKeys.slice(0, 20)) log('    cleaned: ' + k);
      if (removedKeys.length > 20) log(`    ... 还有 ${removedKeys.length - 20} 处`);
      log(`  → 跑一次 args=['--write-baseline'] 同步 baseline\n`);
    }

    if (news.length > 0) {
      log(`\n✗ ${news.length} 处新增违规：`);
      const byFile = {};
      for (const h of news) (byFile[h.file] = byFile[h.file] || []).push(h);
      for (const [f, arr] of Object.entries(byFile)) {
        arr.sort((a, b) => a.line - b.line);
        log(`  ${f}`);
        for (const h of arr) log(`    L${h.line}  [${h.kind}]  ${h.match}`);
      }
      log(`\n修法：`);
      log(`  1. 颜色 → 收编进 tokens.css；尺寸 → 改用就近档值或 var(--fs-*/--sp-*/--r-*)；阴影 → 用 var(--shadow-*)；约定维 → 按 message 改`);
      log(`  2. 确实必须保留：args=['--write-baseline'] 并在 CHANGELOG 写明理由`);
      log(`\nRESULT: FAIL`);
      if (globalThis.__NODE__) process.exitCode = 1;
    } else if (removedCount === 0) {
      log('✓ check-tokens: 0 新增 · 0 减少 · baseline 保持不变');
      log(`\nRESULT: PASS`);
    } else {
      log(`\nRESULT: PASS`);
    }
  }
}
