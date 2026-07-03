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
 * check-orphan-css.js · guard④ 死 CSS 对账（design-spec-kit · 与平台无关）
 *
 * 守什么：CSS 里定义、但在使用面（页面 / 组件 / 脚本）零命中的 class——
 *   改版残留的死码。「样式还留着，早没人引用」是最常见的删不干净。
 * 怎么跑：read_file 本文件 → 整段粘进 run_script（沙箱）；或 node tools/check-orphan-css.js（本地 / CI）。
 *   helper：readFile / saveFile / ls / log。末行 `RESULT: PASS|FAIL`。
 * 配置说明：改下方「配置」区的 CSS_ROOTS / USAGE_ROOTS / BASELINE_PATH。
 *   首跑自动固化 baseline（= 现状「保留备查」账本），之后只报**新增**孤儿；
 *   要把当前全部孤儿重新固化 → args 设成 ['--write-baseline']。
 *
 * ⚠ 两个已知盲区（本 guard 测不到 / 可能误报，需人工复核）：
 *   ① 组合级死：`.a .b` 两个 class 各自在别处存活，但这条**组合选择器**其实永不命中——
 *      本 guard 只按单 class 存活判定，抓不到组合级死码。
 *   ② JS 动态拼接：`'x-' + suffix` 这类运行时拼出的 class，静态搜不到 → 可能把活着的样式误报成死。
 *      命中可疑项时，先 grep 拼接前缀确认，再决定删 / 加 baseline。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

const args = [];   // 沙箱手改位。例：['--write-baseline'] 把当前全部孤儿固化为新 baseline
const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);

// ① CSS 定义面（递归）：class 定义在哪。不存在的目录自动跳过。
const CSS_ROOTS  = ['styles', 'css', 'design-system'];
// ② 使用面（递归）：class 被谁引用。'.' 兜底扫根目录散件；不存在的自动跳过。
const USAGE_ROOTS = ['pages', 'src', 'components', '.'];
const USAGE_EXT  = /\.(html|js|jsx|ts|tsx|vue|svelte)$/i;
const CSS_EXT    = /\.(css|scss|less)$/i;

// 整目录级 skip（依赖 / 构建产物 / 归档 / 工具 / 草稿 / 版本库 —— 按你的项目增删）
const SKIP_DIRS  = new Set(['node_modules', 'dist', 'build', '.git', '_archive', 'tools', 'uploads', 'vendor', 'drafts', 'export']);

const BASELINE_PATH = 'tools/check-orphan-css.baseline.json';

// ─── 去注释（保留位置，方便行号反查）──────────────────────────
const stripCss  = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
const stripHtml = s => s.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
const stripJs   = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
                       .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
const extOf     = p => p.slice(p.lastIndexOf('.')).toLowerCase();
const stripUsage = (s, ext) => ext === '.html' || ext === '.vue' || ext === '.svelte' ? stripHtml(s) : stripJs(s);

function lineOf(src, idx) {
  let l = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++;
  return l;
}

// ─── CSS 解析（brace-aware：只从选择器位置取 class）──────────────
// 思路：去注释后逐字符扫，维护 brace 深度。深度 0 时累积「选择器段」文本，遇 `{` 时
// 从该段抽 `.class`；`{` 后进入声明体（跳过，声明里的 `.5` 之类不误当选择器）；`}` 回到深度 0。
// @keyframes 帧名（from/to/50%）出现在其块内的深度-1 选择器位，用 @keyframes 上下文跳过。
// @media / @supports 是嵌套 at-rule：其块内仍有真实选择器，正常收（靠深度而非名字白名单）。
const CLASS_IN_SELECTOR = /\.(-?[A-Za-z_][\w-]*)/g;

function parseCssDefs(src, file, defs) {
  const s = stripCss(src);
  let depth = 0;
  let segStart = 0;                 // 当前选择器段起点（只在深度 0 或嵌套 at-rule 块内累积）
  let atKeyframesDepth = -1;        // @keyframes 容器所在深度；其直属子块的「选择器」是帧名，跳过
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') {
      const seg = s.slice(segStart, i);
      const trimmed = seg.trimStart();
      const isAtRule = trimmed.startsWith('@');
      const isKeyframes = /^@(-\w+-)?keyframes\b/i.test(trimmed);
      if (isKeyframes) {
        atKeyframesDepth = depth;   // 进入 keyframes 容器块
      } else if (atKeyframesDepth >= 0 && depth === atKeyframesDepth + 1) {
        // @keyframes 容器内的帧块，seg 是帧名（from/to/百分比），不抽 class
      } else if (!isAtRule) {
        // 普通规则块的选择器段——抽 class 定义
        let m; CLASS_IN_SELECTOR.lastIndex = 0;
        while ((m = CLASS_IN_SELECTOR.exec(seg)) !== null) {
          const name = m[1];
          if (!defs.has(name)) defs.set(name, { file, line: lineOf(src, segStart + m.index) });
        }
      }
      // isAtRule 且非 keyframes（@media/@supports 等）：段本身无选择器 class，进块后按深度继续收内层
      depth++;
      segStart = i + 1;             // 进块后段从块内开始（嵌套 at-rule 的内层选择器）
    } else if (ch === '}') {
      depth--;
      if (atKeyframesDepth >= 0 && depth === atKeyframesDepth) atKeyframesDepth = -1;  // 离开 keyframes 容器
      segStart = i + 1;
    } else if (ch === ';' && depth === 0) {
      segStart = i + 1;             // 顶层 @import/@charset 等语句，重置段起点
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
    const path = dir ? dir + '/' + name : name;
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

// ─── 使用面命中检测 ────────────────────────────────────────────
// 双侧边界正则：class 名两侧不能是 [\w-]（避免 `.card` 命中 `card-title` 的子串）。
function reFor(name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
  return new RegExp('(?<![\\w-])' + esc + '(?![\\w-])');
}

// ─── Baseline（仿 check-tokens）────────────────────────────────
function keyOf(o) { return `${o.file}::${o.name}`; }

function baselineKeys(b) {
  const s = new Set();
  if (!b || !b.files) return s;
  for (const [f, arr] of Object.entries(b.files)) for (const e of arr) s.add(`${f}::${e.name}`);
  return s;
}

function buildBaseline(orphans, reason) {
  const grouped = {};
  for (const o of orphans) (grouped[o.file] = grouped[o.file] || []).push({ line: o.line, name: o.name });
  for (const f of Object.keys(grouped)) grouped[f].sort((a, b) => a.line - b.line || a.name.localeCompare(b.name));
  return {
    note: '已认证「保留备查」的死 CSS 清单——进此账本须在 DESIGN-REF 登记保留原因。新增孤儿须删码或显式加到这里。',
    generatedAt: new Date().toISOString().slice(0, 10),
    reason: reason || 'baseline write',
    totalEntries: orphans.length,
    files: grouped,
  };
}

// ─── Main（top-level await）────────────────────────────────────
const writeBaseline = EFFECTIVE_ARGS.includes('--write-baseline');

// 1) 定义面：收集全部 class 定义（首个定义处的 file + line）
const cssFiles = await collect(CSS_ROOTS, CSS_EXT);
const defs = new Map();   // name -> { file, line }
for (const f of cssFiles) {
  let src; try { src = await readFile(f); } catch { continue; }
  parseCssDefs(src, f, defs);
}

// 2) 使用面：拼一大袋去注释文本，逐 class 双侧边界搜
const usageFiles = await collect(USAGE_ROOTS, USAGE_EXT);
const usageBlobs = [];
for (const f of usageFiles) {
  let src; try { src = await readFile(f); } catch { continue; }
  usageBlobs.push(stripUsage(src, extOf(f)));
}
const bigUsage = usageBlobs.join('\n');

// 3) 判孤儿：零命中
const orphans = [];
for (const [name, meta] of defs) {
  if (!reFor(name).test(bigUsage)) orphans.push({ name, file: meta.file, line: meta.line });
}
orphans.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

log(`css defs: ${defs.size} classes (${cssFiles.length} files) · usage面: ${usageFiles.length} files · orphans: ${orphans.length}`);

if (writeBaseline) {
  await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(orphans, 'manual --write-baseline'), null, 2) + '\n');
  log(`✓ baseline rewritten: ${BASELINE_PATH} (${orphans.length} entries)`);
  log(`\nRESULT: PASS`);
} else {
  let baseline = null;
  try { baseline = JSON.parse(await readFile(BASELINE_PATH)); } catch { /* no baseline */ }

  if (!baseline) {
    await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(orphans, 'first run'), null, 2) + '\n');
    log(`✓ baseline created: ${BASELINE_PATH} (${orphans.length} entries) — 复查后再跑一次进入 diff 模式`);
    log(`\nRESULT: PASS`);
  } else {
    const allowed = baselineKeys(baseline);
    const news    = orphans.filter(o => !allowed.has(keyOf(o)));
    const removed = [...allowed].filter(k => !orphans.some(o => keyOf(o) === k));

    log(`baseline: ${allowed.size} entries · removed: ${removed.length} · new: ${news.length}`);

    if (removed.length > 0) {
      log(`\n✓ ${removed.length} 处 baseline 孤儿已消失（被删掉或重新被引用，干得漂亮）`);
      for (const k of removed.slice(0, 20)) log('    cleared: ' + k);
      if (removed.length > 20) log(`    ... 还有 ${removed.length - 20} 处`);
      log(`  → 跑一次 args=['--write-baseline'] 同步 baseline\n`);
    }

    if (news.length > 0) {
      log(`\n✗ ${news.length} 处新增死 CSS（定义了但使用面零命中）：`);
      const byFile = {};
      for (const o of news) (byFile[o.file] = byFile[o.file] || []).push(o);
      for (const [f, arr] of Object.entries(byFile)) {
        log(`  ${f}`);
        for (const o of arr) log(`    L${o.line}  .${o.name}`);
      }
      log(`\n修法：`);
      log(`  1. 删掉死样式（改版残留的收尾）。`);
      log(`  2. 若是 JS 动态拼接（'x-'+suffix）导致的误报 → grep 拼接前缀确认后加 baseline。`);
      log(`  3. 确要保留备查 → args=['--write-baseline'] 并在 DESIGN-REF 登记「保留备查 + 原因」。`);
      log(`\nRESULT: FAIL`);
      if (globalThis.__NODE__) process.exitCode = 1;
    } else if (removed.length === 0) {
      log('✓ check-orphan-css: 0 新增 · 0 减少 · baseline 保持不变');
      log(`\nRESULT: PASS`);
    } else {
      log(`\nRESULT: PASS`);
    }
  }
}
