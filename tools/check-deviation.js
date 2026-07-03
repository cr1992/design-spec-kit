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
 * check-deviation.js · guard⑦ 偏离对账（design-spec-kit 还原交接层 · 与平台无关）
 *
 * 守什么（HANDOFF §2 的机读对账，精确边界如下——「实现落地了 delegated 却无回执」需 T1
 * 渲染树对账才能机判，不在本 guard 范围）：
 *   代码标记 ↔ 台账 双向硬对账 + 台账 ↔ manifest 屏引用校验 + delegated 待裁决队列摘要。
 *   产一张「缺口清单」——本 guard 的核心产物：让缺口一条命令可见。
 *
 *   ① IMPL_ROOTS 为空                                → FAIL（未配置扫描根，防假 PASS）
 *   ② 扫代码收标记（file:line + id/kind/basis）；basis 缺失单列 → FAIL
 *   ③ 解析台账 markdown 表（自动定位含 id / 状态 / 屏 列，容错空格）得 id→{status,screen}
 *   ④ 对账：
 *        · 代码有标记、台账无行            → FAIL「未申报」
 *        · 台账 open、代码无标记          → FAIL「幽灵条目」
 *        · 台账 收编/摘除，代码标记还在    → FAIL「该摘标」
 *        · 台账屏引用无对应 manifest       → FAIL「屏引用无效」（manifest 目录存在时才查）
 *   ⑤ manifest（目录存在时）：delegated status=open 计数 + contract_ref=TBD 计数 → WARN「待裁决队列」
 *
 * 怎么跑：
 *   · AI 沙箱：read_file 本文件 → 整段粘进 run_script（helper：readFile/ls/log）。
 *   · node/CI：node tools/check-deviation.js
 *   末行 `RESULT: PASS|FAIL`；FAIL 时 node 置退出码 1，并带「修法」提示。
 *
 * 配置：接手改下方「配置」区（★必改项已标注）。禁顶层 import/export（node:fs 只在标准头动态 import）。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

const args = [];   // 沙箱手改位：本 guard 无 flag，留空即可

// ★必改：实现代码扫描根（可跨目录）。空 = FAIL（防「没扫任何代码」的假 PASS）。
const IMPL_ROOTS = [];
// 扫哪些扩展名（实现代码常见语言；按你的栈增删）
const IMPL_EXT = /\.(js|jsx|ts|tsx|dart|kt|swift|vue|svelte|html|go|py|rs|java|mm|m)$/i;
// 偏离台账路径（markdown，一行一条）
const LEDGER_PATH = 'docs/DEVIATION-LEDGER.md';
// manifest 生成物目录（存在才读；用于「待裁决队列」摘要）
const MANIFEST_DIR = 'docs/manifests';
const MANIFEST_SUFFIX = '.manifest.generated.json';
// 整目录级 skip
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '_archive', 'uploads', 'vendor', 'drafts', 'export', 'coverage']);

// 偏离标记正则：匹配 @design-deviation( ... )，宽容解析 parens 内 key: value 对。
// 捕获组 1 = 括号内原文（后续按 key 逐个抠 id/kind/basis，容忍顺序 / 空格 / 换行 / 引号）。
const MARKER_RE = /@design-deviation\s*\(([^)]*)\)/g;

const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);
void EFFECTIVE_ARGS;   // 本 guard 暂无 flag 分支；保留统一形态

// 台账「收编 / 摘除」终态词（代码标记应已摘）。open 视为进行中。
const CLOSED_STATUSES = new Set(['收编', '摘除', 'reconciled', 'dropped']);
const OPEN_STATUSES = new Set(['open']);

// ─── 标记解析 ──────────────────────────────────────────────────

// 从括号内原文抠某个 key 的值：key: <value>，值取到逗号 / 结尾，去引号去空白。
function pickKey(body, key) {
  const re = new RegExp(key + '\\s*[:=]\\s*([^,]+)', 'i');
  const m = body.match(re);
  if (!m) return null;
  return m[1].trim().replace(/^['"]|['"]$/g, '').trim() || null;
}

function lineOf(src, idx) {
  let l = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++;
  return l;
}

// ─── 文件收集（递归 IMPL_ROOTS）────────────────────────────────

async function walk(dir, out) {
  let entries;
  try { entries = await ls(dir); } catch { return; }
  for (const name of entries || []) {
    const path = dir ? dir + '/' + name : name;
    if (IMPL_EXT.test(name)) out.push(path);
    else if (!name.includes('.') && !SKIP_DIRS.has(name)) await walk(path, out);
  }
}

// ─── 台账解析（自动定位含 id 与 状态 列的 markdown 表）─────────

// split 一行为 cell 数组（容错前后 | 与空格）
function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}
const isSep = (line) => /^\s*\|?\s*:?-{2,}/.test(line) && line.includes('-') && !/[0-9A-Za-z一-鿿]/.test(line.replace(/[-:|\s]/g, ''));

// 表头识别：id 列 + 状态/status 列（必需）+ 屏/screen 列（可选，用于 manifest 引用校验）。
function findCols(headerCells) {
  let idCol = -1, statusCol = -1, screenCol = -1;
  headerCells.forEach((h, i) => {
    const hl = h.toLowerCase();
    if (idCol < 0 && (hl === 'id' || hl.includes('id'))) idCol = i;
    if (statusCol < 0 && (h.includes('状态') || hl.includes('status'))) statusCol = i;
    if (screenCol < 0 && (h.includes('屏') || hl.includes('screen'))) screenCol = i;
  });
  return { idCol, statusCol, screenCol };
}

// 解析整份台账，返回 id -> { status, screen, line }。DEV-id 大小写归一为大写。
function parseLedger(src) {
  const lines = src.split('\n');
  const rows = new Map();
  let cols = null;

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.includes('|')) { cols = null; continue; }      // 跳出表 → 重置列定位
    const cells = splitRow(ln);
    if (isSep(ln)) continue;                                // 分隔行

    if (!cols) {                                            // 尚未锁定列 → 试作表头
      const c = findCols(cells);
      if (c.idCol >= 0 && c.statusCol >= 0) cols = c;
      continue;                                             // 表头本身不作数据行
    }

    // 数据行
    const idRaw = cells[cols.idCol] || '';
    const idm = idRaw.match(/DEV-[0-9]+/i);
    if (!idm) continue;                                     // 无合法 id 的行（模板占位 / 空行）跳过
    const id = idm[0].toUpperCase();
    const status = (cells[cols.statusCol] || '').trim();
    const screen = cols.screenCol >= 0 ? (cells[cols.screenCol] || '').trim() : '';
    rows.set(id, { status, screen, line: i + 1 });
  }
  return rows;
}

// ─── manifest 待裁决队列摘要 ───────────────────────────────────

async function manifestQueue() {
  let names;
  try { names = await ls(MANIFEST_DIR); } catch { return null; }
  if (!names) return null;
  const files = names.filter((n) => n.endsWith(MANIFEST_SUFFIX));
  let openDelegated = 0, tbd = 0;
  const screenIds = new Set();
  for (const f of files) {
    screenIds.add(f.slice(0, -MANIFEST_SUFFIX.length));                  // 文件名基底当兜底 id
    let m;
    try { m = JSON.parse(await readFile(`${MANIFEST_DIR}/${f}`)); } catch { continue; }
    if (m && m.screen && typeof m.screen.id === 'string') screenIds.add(m.screen.id);
    const del = (m && m.states && m.states.delegated) || [];
    if (!Array.isArray(del)) continue;
    for (const d of del) {
      if (d && d.status === 'open') openDelegated++;
      if (d && d.contract_ref === 'TBD') tbd++;
    }
  }
  return { files: files.length, openDelegated, tbd, screenIds };
}

// ─── Main（早退避免深嵌）───────────────────────────────────────

function fatal(lines) { for (const l of lines) log(l); log('\nRESULT: FAIL'); if (globalThis.__NODE__) process.exitCode = 1; }

async function main() {
  // ① 未配置扫描根 → FAIL（空根让「代码无标记」永远成立 = 假 PASS）
  if (!Array.isArray(IMPL_ROOTS) || IMPL_ROOTS.length === 0) {
    return fatal(['✗ IMPL_ROOTS 未配置——本 guard 不知道扫哪儿的代码',
      '  修法：在配置区把 IMPL_ROOTS 填成实现代码目录（★必改，可跨目录）。',
      '        空扫描根会让「代码无标记」永远成立，产生假 PASS——故直接 FAIL。']);
  }

  // ② 收集代码标记
  const files = [];
  for (const r of IMPL_ROOTS) await walk(r, files);
  const uniqFiles = [...new Set(files)];
  const markers = new Map();     // id -> { file, line, kind, basis }（同 id 取首个现场）
  const noBasis = [], noId = []; // basis 缺失 / 连 id 都抠不出的坏标记
  for (const f of uniqFiles) {
    let src;
    try { src = await readFile(f); } catch { continue; }
    let m; MARKER_RE.lastIndex = 0;
    while ((m = MARKER_RE.exec(src)) !== null) {
      const body = m[1], line = lineOf(src, m.index);
      const idRaw = pickKey(body, 'id');
      const idm = idRaw ? idRaw.match(/DEV-[0-9]+/i) : null;
      if (!idm) { noId.push({ file: f, line }); continue; }
      const id = idm[0].toUpperCase();
      const kind = pickKey(body, 'kind'), basis = pickKey(body, 'basis');
      if (!basis) noBasis.push({ id, file: f, line });
      if (!markers.has(id)) markers.set(id, { file: f, line, kind, basis });
    }
  }

  // ③ 解析台账
  let ledger = new Map(), ledgerReadOk = true;
  try { ledger = parseLedger(await readFile(LEDGER_PATH)); } catch { ledgerReadOk = false; }

  // ④ 三方对账 → 缺口清单
  const undeclared = [], ghosts = [], shouldUnmark = [];
  for (const [id, mk] of markers) if (!ledger.has(id)) undeclared.push({ id, file: mk.file, line: mk.line, kind: mk.kind });
  for (const [id, row] of ledger) {
    const hasMarker = markers.has(id);
    if (OPEN_STATUSES.has(row.status) && !hasMarker) ghosts.push({ id, line: row.line });
    if (CLOSED_STATUSES.has(row.status) && hasMarker) {
      const mk = markers.get(id);
      shouldUnmark.push({ id, status: row.status, ledgerLine: row.line, file: mk.file, line: mk.line });
    }
  }

  // ⑤ manifest：待裁决摘要 + 台账屏引用校验（manifest 目录存在且非空时才查）
  const queue = await manifestQueue();
  const badScreenRefs = [];
  if (queue && queue.files > 0) {
    for (const [id, row] of ledger) {
      if (row.screen && !queue.screenIds.has(row.screen)) badScreenRefs.push({ id, screen: row.screen, line: row.line });
    }
  }

  // ─── 报告 ───
  const gapCount = noBasis.length + noId.length + undeclared.length + ghosts.length + shouldUnmark.length + badScreenRefs.length;
  log(`scanned ${uniqFiles.length} files · ${markers.size} markers · ledger ${ledgerReadOk ? ledger.size + ' rows' : '读不到'} · gaps ${gapCount}`);
  if (!ledgerReadOk) log(`\n⚠ 台账读不到：${LEDGER_PATH}（视为空台账——凡有标记都会记「未申报」）`);
  if (queue) log(`\nℹ 待裁决队列（manifest ${queue.files} 份）：delegated open ${queue.openDelegated} · contract_ref=TBD ${queue.tbd}（随迭代评审收敛，非 FAIL）`);
  if (gapCount === 0) {
    log(`\n✓ check-deviation: 代码标记 ↔ 台账双向、台账 ↔ manifest 屏引用全部对齐，无缺口`);
    log(`\nRESULT: PASS`);
    return;
  }

  // 缺口清单（本 guard 核心产物）——数据驱动，每类一段
  log(`\n──── 缺口清单 ────`);
  const fmt = (x) => x.id
    ? `    ${x.id}${x.status ? '  [' + x.status + ']' : ''}${x.screen ? '  屏=' + x.screen : ''}  ${x.file ? x.file + ':' + x.line : '台账 L' + x.line}${x.kind ? '  kind=' + x.kind : ''}${x.ledgerLine ? '  台账 L' + x.ledgerLine : ''}`
    : `    ${x.file}:${x.line}`;
  for (const [title, arr] of [
    [`坏标记（抠不出 DEV-id）`, noId],
    [`缺 basis（写不出依据 = 摘除候选）`, noBasis],
    [`未申报（代码有标记、台账无行）`, undeclared],
    [`幽灵条目（台账 open、代码无标记）`, ghosts],
    [`该摘标（台账已 ${[...CLOSED_STATUSES].join('/')}、代码标记还在）`, shouldUnmark],
    [`屏引用无效（台账的屏在 manifest 里不存在）`, badScreenRefs],
  ]) {
    if (!arr.length) continue;
    log(`\n✗ ${title}：${arr.length}`);
    for (const x of arr) log(fmt(x));
  }

  return fatal([`\n修法：`,
    `  · 未申报 → 台账 ${LEDGER_PATH} 补一行（id/屏/anchor/kind/basis/状态=open）。`,
    `  · 幽灵条目 → 代码补 @design-deviation 标记（+ runtime anchor），或该条走「摘除」出口。`,
    `  · 该摘标 → 收编/摘除后须摘掉代码里的 @design-deviation 标与 runtime deviation anchor。`,
    `  · 缺 basis / 坏标记 → 补 basis:<契约或任务引用>，或直接摘除（写不出依据的偏离不留）。`,
    `  · 屏引用无效 → 修台账屏列的 screen-id 笔误，或给该屏补 manifest（屏还没进交接层就别在台账引用它）。`]);
}

await main();
