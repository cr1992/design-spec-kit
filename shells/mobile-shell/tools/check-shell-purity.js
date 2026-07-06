/* ============================================================
   check-shell-purity.js · 壳纯度 guard（mobile-shell 专属 · 守单向依赖）
   ------------------------------------------------------------
   壳 = business-free：壳内任何文件不得指名业务名字。
   本 guard 把「壳永不反向依赖业务」从自觉纪律变成机检 DoD：

   ① 模块类名：
      · 机器派生：design-system/modules/*.css 定义的全部**带连字符**类名
        （模块专属件按约定必带模块前缀，如 rb-*；纯短词 .dot/.fill 属共享词汇不收）；
      · 前缀正则：MODULE_PREFIX_RE 兜底（连 spec.css 里暂留 rb- 前缀的技术债也拦）。
      · ALLOW = 壳挂钩契约白名单（README「挂钩契约」同一份名单）——壳可指名的
        壳层/基础层名字，加新挂钩 = 同步 README + 这里。
      壳内命中（`.name` 或 class="…" 上下文）= FAIL。
   ② 业务词 / 业务全局：FORBID_WORDS 命中（含注释/文档）= FAIL。

   零容忍、无 baseline——壳本来就该是干净的；误报改白名单，不留存量。

   跑法：
   · node mobile-shell/tools/check-shell-purity.js   （项目根跑）
   · AI 无 shell：整段粘进 run_script（helpers: readFile/ls/log 原生已有）
   末行 RESULT: PASS|FAIL。
   ============================================================ */

// ── 环境垫片：node 直跑时补 readFile/ls/log（run_script 粘贴时跳过）──
if (typeof readFile === 'undefined') {
  const fs = await import('node:fs/promises');
  globalThis.log = console.log;
  globalThis.readFile = (p) => fs.readFile(p, 'utf8');
  globalThis.ls = async (p) => { try { return await fs.readdir(p); } catch { return []; } };
}

// ── 配置（★消费项目接手第一件事：填下面三个 knob）───────────────
// 这是 kit canonical 骨架自带的模板配置：默认中性（壳本身 business-free，空配置即过）。
// 接入你的项目时，把 MODULE_PREFIX_RE / FORBID_WORDS 换成你自己的业务名单；
// hirobot 实例的真实值见每个 knob 下方注释，照抄改成你项目的即可。
const SHELL_ROOT   = 'mobile-shell';                 // 壳目录（相对运行 cwd；从 shells/ 跑即此值）
const MODULES_DIR  = 'design-system/modules';        // 消费项目模块 CSS 真源（机器派生禁词）；kit canonical 无此目录 → 派生为空
const MODULE_PREFIX_RE = /^(?!x)x/;                  // 占位：默认匹配空。项目填自己的模块前缀。
//   hirobot 实例：/^(?:rb|tp|pv|bt|ra|al|tk|tr)-/
const ALLOW = new Set([                              // 壳挂钩契约白名单（= README「挂钩契约」）——属壳层，通用不改
  'pg', 'app-top', 'app-scroll', 'lay-pad', 'rail',
  'pad-list-head', 'pad-detail-bar', 'pad-main', 'lr-card',
]);
const FORBID_WORDS = [                               // 业务词 / 业务全局（人工名单）；kit canonical 留空
  // hirobot 实例：'HiStateBots','HiRobot','robot-data','robot-view','机器人','告警','导览','配网','遥控','租户','海信'
];
const SKIP = new Set([                               // 壳内不扫的文件
  'tools/check-shell-purity.js',                     // 本 guard（含禁词名单）
  'tools/kit-drift.baseline.json',                   // 哈希清单
]);
const CLASS_EXT = /\.(css|js|html)$/i;               // 类名上下文只在代码文件里查
const WORD_EXT  = /\.(css|js|html|md|json)$/i;       // 业务词连文档一起查

// ── 收集壳文件 ────────────────────────────────────────────────
async function walk(dir, out) {
  const entries = await ls(dir);
  if (!entries || entries.length === 0) return;      // 文件 ls → []，自然终止
  for (const name of entries) {
    const p = dir + '/' + name;
    if (WORD_EXT.test(name)) out.push(p);
    else if (!name.includes('.')) await walk(p, out);
  }
}

// ── ① 派生模块类名禁词表（只收带连字符的模块件名）────────────
const moduleClasses = new Set();
for (const f of await ls(MODULES_DIR)) {
  if (!/\.css$/i.test(f)) continue;
  const src = (await readFile(MODULES_DIR + '/' + f)).replace(/\/\*[\s\S]*?\*\//g, ' ');
  let m; const re = /\.([a-z][a-z0-9]*-[a-z0-9-]+)/g;
  while ((m = re.exec(src)) !== null) if (!ALLOW.has(m[1])) moduleClasses.add(m[1]);
}

// ── 扫描 ──────────────────────────────────────────────────────
function lineOf(src, idx) { let l = 1; for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++; return l; }
const isForbiddenClass = n => !ALLOW.has(n) && (moduleClasses.has(n) || MODULE_PREFIX_RE.test(n));

const files = [];
await walk(SHELL_ROOT, files);
// 空扫防呆：SHELL_ROOT 不存在 / cwd 不对时 walk 得到 []，若不拦会「扫 0 文件仍 PASS」的假绿。
if (files.length === 0) {
  const cwd = (typeof process !== 'undefined' && process.cwd) ? process.cwd() : '?';
  log(`shell-purity: 在 '${SHELL_ROOT}/' 下未找到任何壳文件——多半 cwd 不对（当前 cwd: ${cwd}）。`);
  log(`  正确跑法：cd 到 '${SHELL_ROOT}' 的父目录再跑，例如 (cd shells && node mobile-shell/tools/check-shell-purity.js)。`);
  log('RESULT: FAIL');
  if (typeof process !== 'undefined' && process.exit) process.exit(1);
}
const hits = [];
for (const f of files) {
  const rel = f.slice(SHELL_ROOT.length + 1);
  if (SKIP.has(rel)) continue;
  const src = await readFile(f);
  if (CLASS_EXT.test(f)) {
    // 类名上下文 a：`.name`（CSS 选择器 / querySelector / classList 字符串）
    let m; const dotRe = /\.([a-z][a-z0-9-]*)/g;
    while ((m = dotRe.exec(src)) !== null)
      if (isForbiddenClass(m[1])) hits.push({ f, line: lineOf(src, m.index), kind: 'module-class', match: '.' + m[1] });
    // 类名上下文 b：class="a b c" / class='a b c'（单双引号）
    const attrRe = /class\s*=\s*["']([^"']*)["']/g;
    while ((m = attrRe.exec(src)) !== null)
      for (const t of m[1].split(/\s+/))
        if (t && isForbiddenClass(t)) hits.push({ f, line: lineOf(src, m.index), kind: 'module-class', match: 'class=' + t });
    // 类名上下文 c：el.className = 'a b c'（JS 字符串赋值，单/双/反引号）
    const cnRe = /className\s*=\s*["'`]([^"'`]*)["'`]/g;
    while ((m = cnRe.exec(src)) !== null)
      for (const t of m[1].split(/\s+/))
        if (t && isForbiddenClass(t)) hits.push({ f, line: lineOf(src, m.index), kind: 'module-class', match: 'className=' + t });
    // 类名上下文 d：classList.add/remove/toggle/replace('name', …)（裸类名，无点，上下文 a 漏）
    const clRe = /classList\s*\.\s*(?:add|remove|toggle|replace|contains)\(([^)]*)\)/g;
    while ((m = clRe.exec(src)) !== null) {
      let s; const argRe = /["'`]([a-z][a-z0-9-]*)["'`]/g;
      while ((s = argRe.exec(m[1])) !== null)
        if (isForbiddenClass(s[1])) hits.push({ f, line: lineOf(src, m.index), kind: 'module-class', match: 'classList:' + s[1] });
    }
  }
  for (const w of FORBID_WORDS) {
    let i = -1;
    while ((i = src.indexOf(w, i + 1)) !== -1) hits.push({ f, line: lineOf(src, i), kind: 'business-word', match: w });
  }
}

// ── 报告 ──────────────────────────────────────────────────────
log(`shell-purity: ${files.length} 个壳文件 · 模块类禁词 ${moduleClasses.size} + 前缀兜底 + 业务词 ${FORBID_WORDS.length} · 命中 ${hits.length}`);
if (hits.length === 0) {
  log('✓ 壳无业务泄漏（单向依赖成立）');
  log('RESULT: PASS');
} else {
  const byFile = {};
  for (const h of hits) (byFile[h.f] = byFile[h.f] || []).push(h);
  for (const [f, arr] of Object.entries(byFile)) {
    log(`  ${f}`);
    for (const h of arr.slice(0, 20)) log(`    L${h.line}  [${h.kind}]  ${h.match}`);
    if (arr.length > 20) log(`    … 还有 ${arr.length - 20} 处`);
  }
  log('修法：壳侧改通用钩子类 / opts 注入；业务名字只许活在 pages/ 与 design-system/。');
  log('RESULT: FAIL');
}
if (typeof process !== 'undefined' && process.exit && hits.length > 0) process.exit(1);
