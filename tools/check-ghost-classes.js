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
 * check-ghost-classes.js · guard 幽灵类对账（design-spec-kit · 与平台无关）
 *
 * 守什么：使用面（页面 / 组件 / 脚本）引用、但在样式真源（CSS 定义面）零定义的
 *   class——「幽灵类」。类名拼错 / 引用了不存在的变体时样式静默回落基底，
 *   设计稿呈现即错、实现照抄错样（起源案例：`tag danger` 拼进 class，spec 只有
 *   `.tag.bad` → 回落 accent 蓝，双侧走样）。与 check-orphan-css 互为镜像：
 *   orphan = 定义了没人用；ghost = 用了没人定义。
 * 怎么跑：read_file 本文件 → 整段粘进 run_script（沙箱）；或 node tools/check-ghost-classes.js（本地 / CI）。
 *   helper：readFile / saveFile / ls / log。末行 `RESULT: PASS|FAIL`。
 * 配置说明：改下方「配置」区的 CSS_ROOTS / USAGE_ROOTS / BASELINE_PATH。
 *   首跑自动固化 baseline（= 存量幽灵类 / 语义锚点账本），之后只报**新增**；
 *   要把当前全部幽灵类重新固化 → args 设成 ['--write-baseline']。
 *
 * ⚠ 三个已知盲区（本 guard 测不到 / 可能误报，需人工复核）：
 *   ① JS 动态拼接：`'x-' + suffix` 拼出的整段跳过（非法 token 过滤），拼接产物
 *      若是幽灵类抓不到 —— 漏报方向，与 orphan 的误报方向相反。
 *   ② 语义钩子类：只当 JS querySelector 锚点、有意不带样式的类会被报 → 收 baseline
 *      并注明「纯锚点」。
 *   ③ 运行时注入：第三方库 / 框架在运行时挂的类静态扫不到定义 → 收 baseline。
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
const pickGuardCfg = (node) => node?.guards?.['check-ghost-classes'] || node?.guards?.['check-ghost-classes.js'] || {};
const MODULE_GUARD_CONFIG = KIT_MODULE ? pickGuardCfg(DESIGN_SPEC_CONFIG.modules?.[KIT_MODULE]) : {};
// key 级浅合并：模块键覆盖顶层公共缺省（数组整键替换，不做深合并）
const GUARD_CONFIG = KIT_MODULE ? { ...pickGuardCfg(DESIGN_SPEC_CONFIG), ...MODULE_GUARD_CONFIG } : pickGuardCfg(DESIGN_SPEC_CONFIG);
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位。例：['--write-baseline'] 把当前全部幽灵类固化为新 baseline
const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);

// ① CSS 定义面（递归）：class 定义在哪。不存在的目录自动跳过。
const CSS_ROOTS  = cfgArray('cssRoots', ['styles', 'css', 'design-system']);
// ② 使用面（递归）：class 被谁引用。'.' 兜底扫根目录散件；不存在的自动跳过。
const USAGE_ROOTS = cfgArray('usageRoots', ['pages', 'src', 'components', '.']);
const USAGE_EXT  = /\.(html|js|jsx|ts|tsx|vue|svelte)$/i;
const CSS_EXT    = /\.(css|scss|less)$/i;

// 整目录级 skip（依赖 / 构建产物 / 归档 / 工具 / 草稿 / 版本库 —— 按你的项目增删）
const SKIP_DIRS  = new Set(cfgArray('skipDirs', ['node_modules', 'dist', 'build', '.git', '_archive', 'tools', 'uploads', 'vendor', 'drafts', 'export']));

// 模块模式 baseline 强制分账：不继承顶层 baselinePath（两模块混一本账 = 债无归属）
const BASELINE_PATH = KIT_MODULE
  ? (MODULE_GUARD_CONFIG.baselinePath || `docs/design-spec/baselines/${KIT_MODULE}/check-ghost-classes.baseline.json`)
  : cfgValue('baselinePath', 'tools/check-ghost-classes.baseline.json');
// 迁移防线：模块 baseline 缺失而旧全局 baseline 仍在 → FAIL，拒绝静默重建空债 baseline（= 历史债清零）
if (KIT_MODULE && !MODULE_GUARD_CONFIG.baselinePath) {
  const legacyBaseline = pickGuardCfg(DESIGN_SPEC_CONFIG).baselinePath || 'tools/check-ghost-classes.baseline.json';
  const fileExists = async (p) => { try { await readFile(p); return true; } catch { return false; } };
  if (!(await fileExists(BASELINE_PATH)) && (await fileExists(legacyBaseline))) {
    log(`✗ 模块 '${KIT_MODULE}' 无 baseline（${BASELINE_PATH}），但旧全局 baseline 仍在（${legacyBaseline}）`);
    log(`  多模块迁移须显式搬移该文件，或在 modules.${KIT_MODULE}.guards['check-ghost-classes'] 配 baselinePath`);
    log('RESULT: FAIL');
    if (globalThis.__NODE__) globalThis.process.exit(1);
    throw new Error('baseline migration required');
  }
}

// ─── 去注释（等长空白替换，保留位置方便行号反查）────────────────
const stripCss  = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
const stripHtml = s => s.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
const stripJs   = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
                       .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
const extOf     = p => p.slice(p.lastIndexOf('.')).toLowerCase();
const HTML_LIKE = new Set(['.html', '.vue', '.svelte']);
// HTML 类文件：剥 <!-- --> 之外，<script> 块内容再按 JS 剥注释（等长替换，行号不漂）
const stripScriptBlocks = s => s.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (_, open, body, close) => open + stripJs(body) + close);
const stripUsage = (s, ext) => HTML_LIKE.has(ext) ? stripScriptBlocks(stripHtml(s)) : stripJs(s);

function lineOf(src, idx) {
  let l = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++;
  return l;
}

// ─── CSS 解析（brace-aware：只从选择器位置取 class，与 check-orphan-css 同源）──
// 思路：去注释后逐字符扫，维护 brace 深度。深度 0 时累积「选择器段」文本，遇 `{` 时
// 从该段抽 `.class`；`{` 后进入声明体（跳过，声明里的 `.5` / url(a.png) 不误当定义）；
// @keyframes 帧名用 @keyframes 上下文跳过；@media / @supports 块内选择器靠深度正常收。
const CLASS_IN_SELECTOR = /\.(-?[A-Za-z_][\w-]*)/g;

function parseCssDefs(src, defs) {
  const s = stripCss(src);
  let depth = 0;
  let segStart = 0;
  let atKeyframesDepth = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') {
      const seg = s.slice(segStart, i);
      const trimmed = seg.trimStart();
      const isAtRule = trimmed.startsWith('@');
      const isKeyframes = /^@(-\w+-)?keyframes\b/i.test(trimmed);
      if (isKeyframes) {
        atKeyframesDepth = depth;
      } else if (atKeyframesDepth >= 0 && depth === atKeyframesDepth + 1) {
        // @keyframes 容器内的帧块，seg 是帧名（from/to/百分比），不抽 class
      } else if (!isAtRule) {
        let m; CLASS_IN_SELECTOR.lastIndex = 0;
        while ((m = CLASS_IN_SELECTOR.exec(seg)) !== null) defs.add(m[1]);
      }
      depth++;
      segStart = i + 1;
    } else if (ch === '}') {
      depth--;
      if (atKeyframesDepth >= 0 && depth === atKeyframesDepth) atKeyframesDepth = -1;
      segStart = i + 1;
    } else if (ch === ';' && depth === 0) {
      segStart = i + 1;
    }
  }
  return defs;
}

// ─── 收集文件 ──────────────────────────────────────────────────
async function walk(dir, out, extRe) {
  let entries;
  try { entries = await ls(dir); } catch { return; }
  if (!entries || entries.length === 0) return;
  for (const name of entries) {
    // '.' 根产出裸相对路径，与具体根（'pages' 等）产出的路径同形，collect 的 Set 才去得了重
    const path = (dir && dir !== '.') ? dir + '/' + name : name;
    if (extRe.test(name)) {
      out.push(path);
    } else if (!name.includes('.') && !SKIP_DIRS.has(name)) {
      await walk(path, out, extRe);
    }
  }
}

async function collect(roots, extRe) {
  const out = [];
  for (const r of roots) await walk(r, out, extRe);
  return [...new Set(out)];
}

// ─── 使用面 class 引用抽取 ─────────────────────────────────────
// 抽三类静态引用：class="..." 属性、className="..."（JSX 花括号包字符串也认）、
// classList.add/remove/toggle/contains/replace("...") 字符串字面量。
// 非法 token（含 $ + ' ` 等拼接痕迹）由 VALID 过滤——只判完整合法类名。
const VALID = /^-?[A-Za-z_][\w-]*$/;
const ATTR_RE  = /\bclass\s*=\s*(["'])([^"']*)\1/g;
const PROP_RE  = /\bclassName\s*=\s*[{]?\s*(["'])([^"']*)\1/g;
const LIST_RE  = /\bclassList\.(?:add|remove|toggle|contains|replace)\(([^)]*)\)/g;
const STR_RE   = /(["'])([^"']*)\1/g;

function harvestUses(src, file, addUse) {
  let m;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(src)) !== null) for (const t of m[2].split(/\s+/)) if (t && VALID.test(t)) addUse(t, file, m.index);
  PROP_RE.lastIndex = 0;
  while ((m = PROP_RE.exec(src)) !== null) for (const t of m[2].split(/\s+/)) if (t && VALID.test(t)) addUse(t, file, m.index);
  LIST_RE.lastIndex = 0;
  while ((m = LIST_RE.exec(src)) !== null) {
    let sm; STR_RE.lastIndex = 0;
    while ((sm = STR_RE.exec(m[1])) !== null) for (const t of sm[2].split(/\s+/)) if (t && VALID.test(t)) addUse(t, file, m.index);
  }
}

// ─── Baseline（仿 check-orphan-css）────────────────────────────
function keyOf(o) { return `${o.file}::${o.name}`; }

function baselineKeys(b) {
  const s = new Set();
  if (!b || !b.files) return s;
  for (const [f, arr] of Object.entries(b.files)) for (const e of arr) s.add(`${f}::${e.name}`);
  return s;
}

function buildBaseline(ghosts, reason) {
  const grouped = {};
  for (const o of ghosts) (grouped[o.file] = grouped[o.file] || []).push({ line: o.line, name: o.name });
  for (const f of Object.keys(grouped)) grouped[f].sort((a, b) => a.line - b.line || a.name.localeCompare(b.name));
  return {
    note: '已认证保留的幽灵类清单（存量 / 纯锚点 / 运行时注入类）——新增幽灵类应改代码而非扩容此表。',
    generatedAt: new Date().toISOString().slice(0, 10),
    reason: reason || 'baseline write',
    totalEntries: ghosts.length,
    files: grouped,
  };
}

// ─── Main（top-level await）────────────────────────────────────
const writeBaseline = EFFECTIVE_ARGS.includes('--write-baseline');

// 1) 定义面：样式真源里全部 class 定义（含 scss/less 的 .class 选择器）
const cssFiles = await collect(CSS_ROOTS, CSS_EXT);
const defs = new Set();
for (const f of cssFiles) {
  let src; try { src = await readFile(f); } catch { continue; }
  parseCssDefs(src, defs);
}

// 2) 使用面：逐文件抽 class 引用；HTML 类文件的 <style> 计入该文件局部定义
const usageFiles = await collect(USAGE_ROOTS, USAGE_EXT);
const ghosts = [];
let usedCount = 0;
for (const f of usageFiles) {
  let raw; try { raw = await readFile(f); } catch { continue; }
  const src = stripUsage(raw, extOf(f));
  const localDefs = new Set();
  if (HTML_LIKE.has(extOf(f))) {
    let sm; const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    while ((sm = styleRe.exec(src)) !== null) parseCssDefs(sm[1], localDefs);
  }
  const seen = new Set();   // 同文件同类名只报一次（首个出现位置）
  usedCount++;
  harvestUses(src, f, (name, file, idx) => {
    if (seen.has(name)) return;
    seen.add(name);
    if (!defs.has(name) && !localDefs.has(name)) ghosts.push({ name, file, line: lineOf(src, idx) });
  });
}
ghosts.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

log(`css defs: ${defs.size} classes (${cssFiles.length} files) · usage面: ${usedCount} files · ghosts: ${ghosts.length}`);

if (writeBaseline) {
  await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(ghosts, 'manual --write-baseline'), null, 2) + '\n');
  log(`✓ baseline rewritten: ${BASELINE_PATH} (${ghosts.length} entries)`);
  log(`\nRESULT: PASS`);
} else {
  let baseline = null;
  try { baseline = JSON.parse(await readFile(BASELINE_PATH)); } catch { /* no baseline */ }

  if (!baseline) {
    await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(ghosts, 'first run'), null, 2) + '\n');
    log(`✓ baseline created: ${BASELINE_PATH} (${ghosts.length} entries) — 复查后再跑一次进入 diff 模式`);
    log(`\nRESULT: PASS`);
  } else {
    const allowed = baselineKeys(baseline);
    const news    = ghosts.filter(o => !allowed.has(keyOf(o)));
    const removed = [...allowed].filter(k => !ghosts.some(o => keyOf(o) === k));

    log(`baseline: ${allowed.size} entries · removed: ${removed.length} · new: ${news.length}`);

    if (removed.length > 0) {
      log(`\n✓ ${removed.length} 处 baseline 幽灵类已消失（补了定义或删了引用，干得漂亮）`);
      for (const k of removed.slice(0, 20)) log('    cleared: ' + k);
      if (removed.length > 20) log(`    ... 还有 ${removed.length - 20} 处`);
      log(`  → 跑一次 args=['--write-baseline'] 同步 baseline\n`);
    }

    if (news.length > 0) {
      log(`\n✗ ${news.length} 处新增幽灵类（使用面引用了但样式真源零定义）：`);
      const byFile = {};
      for (const o of news) (byFile[o.file] = byFile[o.file] || []).push(o);
      for (const [f, arr] of Object.entries(byFile)) {
        log(`  ${f}`);
        for (const o of arr) log(`    L${o.line}  .${o.name}`);
      }
      log(`\n修法：`);
      log(`  1. 类名拼错 / 引用了不存在的变体 → 改成样式真源里已有的类。`);
      log(`  2. 确属新组件 / 新变体 → 先在样式真源定义再引用。`);
      log(`  3. 纯 JS 锚点类 / 运行时注入类 → 确认后 args=['--write-baseline'] 收编并注明原因。`);
      log(`\nRESULT: FAIL`);
      if (globalThis.__NODE__) process.exitCode = 1;
    } else if (removed.length === 0) {
      log('✓ check-ghost-classes: 0 新增 · 0 减少 · baseline 保持不变');
      log(`\nRESULT: PASS`);
    } else {
      log(`\nRESULT: PASS`);
    }
  }
}
