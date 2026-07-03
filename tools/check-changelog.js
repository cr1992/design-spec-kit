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
 * check-changelog.js · CHANGELOG 卫生防漂移扫描（design-spec-kit · 项目通用）
 *
 * 守什么：把「Changelog 维护」里可机判的约定变成 DoD 守卫（改 CHANGELOG 后必跑）：
 *   ❌ HARD FAIL  同一日期出现 >1 个 `## YYYY-MM-DD` 段（同日只能一段，命中就 append）。
 *   ⚠  WARN       文件总行数 > WARN_LINES → 把窗口外早期整段移到 _archive/CHANGELOG-YYYY-MM.md。
 *   ⚠  WARN       单条目子 bullet > MAX_SUB → 验尸报告化，细节分流到对应 doc（只点名，不 fail）。
 *   ⚠  WARN       模块索引一致性：条目在用但索引没登记的标签 / 索引里登记了却零使用的标签（只点名，不 fail）。
 * 怎么跑（双环境）：
 *   · AI 沙箱：read_file 本文件 → 整段粘进 run_script（自带 readFile/saveFile/ls/log）。
 *   · 本地 / CI：node tools/check-changelog.js（node ≥18）。无 baseline、无写盘（纯只读扫描）。
 *   看末行 `RESULT: PASS|FAIL`；只有 HARD FAIL 才 FAIL，WARN 不改退出码。
 * 配置说明：★必改项见「配置」区——CHANGELOG_PATH、（如索引写法不同）RE_INDEX_ITEM。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

async function readDesignSpecConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json')); }
  catch { return {}; }
}
const DESIGN_SPEC_CONFIG = await readDesignSpecConfig();
const GUARD_CONFIG = DESIGN_SPEC_CONFIG.guards?.['check-changelog'] || DESIGN_SPEC_CONFIG.guards?.['check-changelog.js'] || {};
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位（本 guard 目前不消费 flag，保留占位以对齐标准约定）

const CHANGELOG_PATH = cfgValue('changelogPath', 'docs/CHANGELOG.md');   // ★ 你的 CHANGELOG 路径
const WARN_LINES = Number(cfgValue('warnLines', 200));   // 超过此行数 → 提示归档（留最近 ~2 会话日 / 超 ~200 行归档）
const MAX_SUB    = Number(cfgValue('maxSubItems', 3));     // 单条目允许的子 bullet 上限（1 行标题 + 最多 3 子 bullet）

// 模块索引：位于 `## 模块索引` 段内的清单行，形如 `- **标签** — 说明`；条目使用形如 `- [标签] 描述`。
// 索引项抽取正则：捕获组 1 = 标签名。★若你的索引写法不同（如无加粗），改这里。
const RE_INDEX_ITEM = /^-\s+\*\*([^*]+)\*\*/;   // 默认：- **标签** — …

const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);
void EFFECTIVE_ARGS;   // 对齐标准约定；本 guard 暂不按 flag 分支

// ─── 解析 ──────────────────────────────────────────────────────

const RE_DATE_H   = /^##\s+(\d{4}-\d{2}-\d{2})\b/;   // 真实日期段（## YYYY-MM-DD）
const RE_ANY_H2   = /^##\s+/;                         // 任意 H2（模块索引 / 约定段等）
const RE_INDEX_H2 = /^##\s+模块索引/;                 // 模块索引段标题
const RE_TOP_LI   = /^-\s+\S/;                        // 顶层条目（- 开头）
const RE_SUB_LI   = /^\s+-\s+\S/;                     // 子 bullet（缩进 - 开头）
const RE_ENTRY_TAG = /^-\s+\[([^\]]+)\]/;             // 条目标签：- [标签] …

let src = null;
try { src = await readFile(CHANGELOG_PATH); } catch { /* 缺文件，下面优雅 FAIL */ }
if (src === null) {
  log(`✗ 读不到 ${CHANGELOG_PATH} —— 项目还没建 changelog，或本文件顶部 CHANGELOG_PATH 配错。`);
  log(`修法：按 docs/CHANGELOG.template.md 建立 changelog，或改配置区路径后重跑。`);
  log(`\nRESULT: FAIL`);
  if (globalThis.__NODE__) process.exit(1);            // node：干净退出，不甩堆栈
  throw new Error('check-changelog: CHANGELOG 缺失（见上方修法提示）');  // 沙箱：中止后续执行
}
const lines = src.split('\n');
const totalLines = lines.length;

// 1) 重复同日段
const dateHits = {};   // date -> [lineNo,...]
lines.forEach((ln, i) => {
  const m = ln.match(RE_DATE_H);
  if (m) (dateHits[m[1]] = dateHits[m[1]] || []).push(i + 1);
});
const dupDates = Object.entries(dateHits).filter(([, ls]) => ls.length > 1);

// 2) 条目深度 + 条目标签集合：只扫真实日期段内的条目
const entries = [];    // {date, line, title, subCount}
const usedTags = new Map();   // 标签 -> 使用次数（条目实际在用）
let inDated = false, curDate = null, cur = null;
const pushCur = () => { if (cur) { entries.push(cur); cur = null; } };
lines.forEach((ln, i) => {
  const dm = ln.match(RE_DATE_H);
  if (dm) { pushCur(); inDated = true; curDate = dm[1]; return; }
  if (RE_ANY_H2.test(ln)) { pushCur(); inDated = false; curDate = null; return; }  // 非日期 H2（模块索引 / 约定段）
  if (!inDated) return;
  if (RE_TOP_LI.test(ln)) {
    pushCur();
    cur = { date: curDate, line: i + 1, title: ln.replace(/^-\s+/, '').replace(/\*\*/g, '').slice(0, 64), subCount: 0 };
    const tm = ln.match(RE_ENTRY_TAG);
    if (tm) { const t = tm[1].trim(); usedTags.set(t, (usedTags.get(t) || 0) + 1); }
  } else if (cur && RE_SUB_LI.test(ln)) {
    cur.subCount++;
  }
});
pushCur();

const fatEntries = entries.filter(e => e.subCount > MAX_SUB).sort((a, b) => b.subCount - a.subCount);

// 3) 模块索引：解析 `## 模块索引` 段内的清单行 → 索引登记的标签集合
const indexTags = new Set();
let inIndex = false;
for (const ln of lines) {
  if (RE_INDEX_H2.test(ln)) { inIndex = true; continue; }
  if (inIndex && RE_ANY_H2.test(ln)) { inIndex = false; continue; }   // 遇到下一个 H2 结束索引段
  if (!inIndex) continue;
  const im = ln.match(RE_INDEX_ITEM);
  if (im) indexTags.add(im[1].trim());
}
// 一致性对账（只在存在模块索引段时做；无索引段则跳过本维）
const hasIndexSection = lines.some(ln => RE_INDEX_H2.test(ln));
const usedNotIndexed = hasIndexSection ? [...usedTags.keys()].filter(t => !indexTags.has(t)) : [];
const indexedNotUsed = hasIndexSection ? [...indexTags].filter(t => !usedTags.has(t)) : [];

// ─── 报告 ──────────────────────────────────────────────────────

let fail = false;
log(`scanned ${CHANGELOG_PATH} · ${totalLines} 行 · ${entries.length} 条目 · ${Object.keys(dateHits).length} 个日期段 · 索引标签 ${indexTags.size}`);

// 重复同日段（HARD FAIL）
if (dupDates.length > 0) {
  fail = true;
  log(`\n✗ ${dupDates.length} 个日期出现重复 \`## YYYY-MM-DD\` 段（硬规则：同日只能一段）：`);
  for (const [d, ls] of dupDates) log(`    ${d}  ×${ls.length}  → 行 ${ls.join(', ')}`);
  log(`  修法：把这些段的条目合并到第一段（最上方那个），删掉多余 \`## ${dupDates[0][0]}\` 标题与其间的 \`---\` 分隔。`);
} else {
  log('✓ 同日合并：每个日期仅一段');
}

// 文件超长（WARN）
if (totalLines > WARN_LINES) {
  log(`\n⚠ 文件 ${totalLines} 行 > ${WARN_LINES} 行阈值 → 建议归档`);
  const dates = Object.keys(dateHits).sort();
  log(`    当前日期段（旧→新）：${dates.join(' · ')}`);
  log(`    把最旧的几段整段移到 _archive/CHANGELOG-YYYY-MM.md（原样保真），主文件留最近约 2 个会话日 + 底部「更早条目」链接。`);
} else {
  log(`✓ 文件长度：${totalLines} 行（≤ ${WARN_LINES}）`);
}

// 条目深度（WARN，只点名）
if (fatEntries.length > 0) {
  log(`\n⚠ ${fatEntries.length} 条条目子 bullet > ${MAX_SUB}（验尸报告化，细节该分流到对应 doc）：`);
  for (const e of fatEntries.slice(0, 8)) log(`    L${e.line}  [${e.date}]  ${e.subCount} bullets  ·  ${e.title}…`);
  if (fatEntries.length > 8) log(`    …还有 ${fatEntries.length - 8} 条`);
  log(`    深内容指向对应 doc，条目里只留一句话 + 指路。`);
} else {
  log(`✓ 条目深度：均 ≤ ${MAX_SUB} 子 bullet`);
}

// 模块索引一致性（WARN，只点名，不 FAIL）
if (!hasIndexSection) {
  log(`\nℹ 未发现 \`## 模块索引\` 段——跳过索引一致性维（如需启用，在 CHANGELOG 顶部加模块索引清单）。`);
} else if (usedNotIndexed.length === 0 && indexedNotUsed.length === 0) {
  log(`✓ 模块索引一致性：条目标签 ⊆ 索引，且索引无零使用项`);
} else {
  if (usedNotIndexed.length > 0) {
    log(`\n⚠ ${usedNotIndexed.length} 个标签条目在用但模块索引没登记：${usedNotIndexed.join(' · ')}`);
    log(`    修法：把它补进 \`## 模块索引\` 段（\`- **标签** — 说明\`），让筛选口径完整。`);
  }
  if (indexedNotUsed.length > 0) {
    log(`\n⚠ ${indexedNotUsed.length} 个索引标签零使用（可能已废弃 / 拼写不一致）：${indexedNotUsed.join(' · ')}`);
    log(`    修法：确认是否仍需要——废弃就从索引删，拼写不一致就与条目对齐。`);
  }
}

log(`\nRESULT: ${fail ? 'FAIL' : 'PASS'}`);
if (fail && globalThis.__NODE__) process.exitCode = 1;
