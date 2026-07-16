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
 * check-manifest.js · guard⑥ manifest 完备性（design-spec-kit 还原交接层 · 与平台无关）
 *
 * 守什么：装了还原交接层就必须每屏交出机读 manifest（HANDOFF §1）。本 guard 校验
 *   docs/manifests/*.manifest.generated.json —— 既过 schema，也过 schema 管不到的语义规则：
 *
 *   ① MANIFEST_DIR 不存在 / 空目录          → FAIL（装了还原层却没 manifest；没装本层请卸本 guard）
 *   ② 每份生成物 JSON 可解析 + 过 schema     → FAIL（内置迷你 draft-07 子集校验器，读 SCHEMA_PATH 驱动，字段不硬编码）
 *   ③ 语义规则（schema 管不到 / 双保险）：
 *        · states.designed + states.delegated 合计非空（设计可少画，不可不表态）→ FAIL
 *        · elements[].anchor 单份文件内唯一（对账主键不许撞）        → FAIL
 *        · interactions[].trigger / target 必须引用已有 anchor          → FAIL
 *        · state_classes.exempt 每条带 note（schema 已管，此处双保险）  → FAIL
 *        · states.delegated[].contract_ref === 'TBD'                 → WARN（显式待裁决信号，不 FAIL）
 *   ④ SCREENS_LIST_PATH 配置时：清单里每个 screen-id 必须有对应 manifest → FAIL（覆盖率对账）
 *   ⑤ SOURCE_MANIFEST_DIR 配置时：设计侧语义源 manifest 与 generated 的 version / anchor /
 *      designed state / delegated state / interactions / contracts 双向一致 → FAIL（防生成物过期但 schema 仍 PASS）
 *   ⑥ coverage 配置时：扫设计屏源文件（designRoot + screenGlobs），与各 generated 的
 *      screen.source 集合做差——设计屏尚无 manifest → WARN（覆盖缺口可见，不 FAIL；
 *      ④ 守「清单里的屏都有 manifest」，本维守「设计源文件都进了 manifest 体系」，两腿互补）。
 *      exempt 条目必须带 note（fail closed）；exempt 失效（已覆盖 / 源文件已不存在）→ WARN 提醒清理。
 *      coverage 配置形态错误 / designRoot 不可读 / 任一 glob 零匹配 → FAIL（显式配置指向空无 = 接线坏，
 *      零匹配静默通过 = 假绿，均不静默）。
 *
 * 怎么跑：AI 沙箱 = read_file 本文件整段粘进 run_script（helper readFile/ls/log）；node/CI = node tools/check-manifest.js。
 *   末行 `RESULT: PASS|FAIL`；FAIL 时 node 置退出码 1，带「修法」提示。配置见下方「配置」区（★必改已标）。
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
const pickGuardCfg = (node) => node?.guards?.['check-manifest'] || node?.guards?.['check-manifest.js'] || {};
const MODULE_GUARD_CONFIG = KIT_MODULE ? pickGuardCfg(DESIGN_SPEC_CONFIG.modules?.[KIT_MODULE]) : {};
// key 级浅合并：模块键覆盖顶层公共缺省（数组整键替换，不做深合并）
const GUARD_CONFIG = KIT_MODULE ? { ...pickGuardCfg(DESIGN_SPEC_CONFIG), ...MODULE_GUARD_CONFIG } : pickGuardCfg(DESIGN_SPEC_CONFIG);
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位：本 guard 无 flag，留空即可

// 生成物目录：guard 只认此目录下的 *.manifest.generated.json（HANDOFF §1.2「只认生成物」）
const MANIFEST_DIR = cfgValue('manifestDir', 'docs/manifests');
// schema 真源：驱动内置迷你校验器，字段不硬编码（改 schema 无需改本文件）
const SCHEMA_PATH = cfgValue('schemaPath', 'docs/screen-manifest.schema.json');
// ★可选：期望屏清单文件——配置了才做覆盖率对账；留空 '' = 关闭覆盖率检查。
//   载体二选一：① 每行一个 screen-id 的纯文本；② 一个 JSON 数组 ["login","list",...]。
const SCREENS_LIST_PATH = cfgValue('screensListPath', '');
// ★可选：设计侧语义 manifest 源目录。配置后按 <screen-id><SOURCE_MANIFEST_SUFFIX> 读取源头，
// 与 generated 进行漂移对账；留空 '' = 关闭源头漂移检查。
const SOURCE_MANIFEST_DIR = cfgValue('sourceManifestDir', '');
const SOURCE_MANIFEST_SUFFIX = cfgValue('sourceManifestSuffix', '.manifest.json');

// ★可选：设计屏覆盖对账（⑥）。配置了才启用；不配置 = 本维关闭、输出零变化。
//   { designRoot: '设计根目录', screenGlobs: ['pages/*.html', ...],
//     exempt: [{ source: 'pages/x.html', note: '为何不需要 manifest' }], skipDirs: [...] }
//   screenGlobs 相对 designRoot；glob 支持 *（段内）与 **（跨段）。
const COVERAGE_CONFIG = cfgValue('coverage', null);
const COVERAGE_DEFAULT_SKIP_DIRS = ['node_modules', 'dist', 'build', '.git', '_archive', 'uploads', 'screenshots', 'tmp', 'vendor', 'drafts', 'export'];

// 生成物文件名约定（HANDOFF §1.2）
const MANIFEST_SUFFIX = '.manifest.generated.json';

const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);
void EFFECTIVE_ARGS;   // 本 guard 暂无 flag 分支；保留统一形态

// ─── 迷你 draft-07 校验器（子集：type / required / properties / additionalProperties /
//     items / enum / pattern / minLength / minItems / minimum / $ref→#/definitions）──────

// $ref 只解析同文档 "#/definitions/<name>"；够本 schema 用，不做远程 / 复杂指针。
function resolveRef(root, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  let node = root;
  for (const seg of ref.slice(2).split('/')) {
    if (node == null || typeof node !== 'object') return null;
    node = node[seg];
  }
  return node || null;
}

const typeOf = (v) => Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v === 'object' ? 'object' : typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'number') : typeof v;

// 单值对单 schema 校验；errs 收 `path: 原因`。root = schema 根（供 $ref 回溯）。
function validate(value, schema, root, path, errs) {
  if (schema == null || typeof schema !== 'object') return;
  if (schema.$ref) {
    const target = resolveRef(root, schema.$ref);
    if (!target) { errs.push(`${path}: 无法解析 $ref ${schema.$ref}`); return; }
    validate(value, target, root, path, errs);
    return;
  }

  const t = typeOf(value);
  if (schema.type) {   // integer 也满足 number；其余按精确类型
    const wantList = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!wantList.some((w) => w === t || (w === 'number' && t === 'integer'))) {
      errs.push(`${path}: 类型应为 ${wantList.join('|')}，实际 ${t}`); return;
    }
  }
  if (schema.enum && !schema.enum.some((e) => e === value)) {
    errs.push(`${path}: 值 ${JSON.stringify(value)} 不在枚举 [${schema.enum.join(', ')}]`);
  }
  if (t === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errs.push(`${path}: 字符串长度 ${value.length} < minLength ${schema.minLength}`);
    }
    if (typeof schema.pattern === 'string') {
      let re = null;
      try { re = new RegExp(schema.pattern); } catch { /* 坏 pattern 忽略 */ }
      if (re && !re.test(value)) errs.push(`${path}: 不匹配 pattern /${schema.pattern}/`);
    }
  }
  if ((t === 'integer' || t === 'number') && typeof schema.minimum === 'number' && value < schema.minimum) {
    errs.push(`${path}: 数值 ${value} < minimum ${schema.minimum}`);
  }
  if (t === 'array') {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errs.push(`${path}: 数组长度 ${value.length} < minItems ${schema.minItems}`);
    }
    if (schema.items) value.forEach((item, i) => validate(item, schema.items, root, `${path}[${i}]`, errs));
  }
  if (t === 'object') {
    const props = schema.properties || {};
    if (Array.isArray(schema.required)) for (const key of schema.required) {
      if (!(key in value)) errs.push(`${path}: 缺必填字段 "${key}"`);
    }
    if (schema.additionalProperties === false) for (const key of Object.keys(value)) {
      if (!(key in props)) errs.push(`${path}: 出现未声明字段 "${key}"（additionalProperties:false）`);
    }
    for (const [key, sub] of Object.entries(props)) {
      if (key in value) validate(value[key], sub, root, `${path}.${key}`, errs);
    }
  }
}

// ─── 语义规则（schema 之外 / 双保险）──────────────────────────

function semanticChecks(manifest, fileErrs, fileWarns) {
  const states = (manifest && manifest.states) || {};
  const designed = Array.isArray(states.designed) ? states.designed : [];
  const delegated = Array.isArray(states.delegated) ? states.delegated : [];

  // designed + delegated 合计非空
  if (designed.length + delegated.length === 0) {
    fileErrs.push('states.designed 与 states.delegated 合计为空（设计可少画，不可不表态）');
  }

  // anchor 单文件内唯一
  const els = Array.isArray(manifest && manifest.elements) ? manifest.elements : [];
  const seen = new Map();
  for (const el of els) {
    const a = el && el.anchor;
    if (typeof a === 'string') seen.set(a, (seen.get(a) || 0) + 1);
  }
  for (const [a, n] of seen) {
    if (n > 1) fileErrs.push(`elements[].anchor "${a}" 重复 ${n} 次（对账主键须唯一）`);
  }

  // interaction trigger / target 必须引用已有 anchor
  const anchors = new Set([...seen.keys()]);
  const interactions = Array.isArray(manifest && manifest.interactions) ? manifest.interactions : [];
  interactions.forEach((interaction, i) => {
    const trigger = interaction && interaction.trigger;
    const target = interaction && interaction.target;
    if (typeof trigger === 'string' && !anchors.has(trigger)) {
      fileErrs.push(`interactions[${i}].trigger="${trigger}" 未引用任何 elements[].anchor`);
    }
    if (typeof target === 'string' && !anchors.has(target)) {
      fileErrs.push(`interactions[${i}].target="${target}" 未引用任何 elements[].anchor`);
    }
  });

  // state_classes.exempt 每条带 note（schema 已管，双保险）
  const exempt = (manifest && manifest.state_classes && manifest.state_classes.exempt) || [];
  if (Array.isArray(exempt)) exempt.forEach((e, i) => {
    if (!e || typeof e.note !== 'string' || e.note.trim().length < 4) {
      fileErrs.push(`state_classes.exempt[${i}] 缺 note 或过短（豁免标准态必须写原因）`);
    }
  });

  // delegated contract_ref === 'TBD' → WARN（待裁决信号）
  delegated.forEach((d, i) => {
    if (d && d.contract_ref === 'TBD') {
      fileWarns.push(`states.delegated[${i}] state=${d.state || '?'} contract_ref=TBD（显式待裁决）`);
    }
  });
}

function sortedUnique(values) {
  return [...new Set(values
    .filter((v) => typeof v === 'string' && v.trim())
    .map((v) => v.trim()))].sort();
}

function delegatedKey(d) {
  if (!d || typeof d !== 'object') return '';
  return [
    d.state || '',
    d.to || '',
    d.contract_ref || '',
    d.status || '',
  ].join('|');
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function interactionKey(interaction) {
  if (!interaction || typeof interaction !== 'object') return '';
  return [
    interaction.trigger || '',
    interaction.action || '',
    interaction.target || '',
  ].join('|');
}

function contractKey(element) {
  if (!element || typeof element !== 'object' || !element.contracts) return '';
  return `${element.anchor || ''}|${stableJson(element.contracts)}`;
}

function diffSet(label, sourceValues, generatedValues, fileErrs) {
  const source = sortedUnique(sourceValues);
  const generated = sortedUnique(generatedValues);
  const sourceSet = new Set(source);
  const generatedSet = new Set(generated);
  const missing = source.filter((v) => !generatedSet.has(v));
  const extra = generated.filter((v) => !sourceSet.has(v));
  if (missing.length) fileErrs.push(`source drift: generated 缺 ${label}: ${missing.join(', ')}`);
  if (extra.length) fileErrs.push(`source drift: generated 多 ${label}: ${extra.join(', ')}`);
}

function sourceDriftChecks(sourceManifest, generatedManifest, fileErrs) {
  if (!sourceManifest || !generatedManifest) return;

  if (sourceManifest.version !== generatedManifest.version) {
    fileErrs.push(`source drift: version 不一致（source=${sourceManifest.version ?? '缺失'} / generated=${generatedManifest.version ?? '缺失'}）`);
  }

  const sourceElements = Array.isArray(sourceManifest.elements) ? sourceManifest.elements : [];
  const generatedElements = Array.isArray(generatedManifest.elements) ? generatedManifest.elements : [];
  diffSet(
    'anchors',
    sourceElements.map((el) => el && el.anchor),
    generatedElements.map((el) => el && el.anchor),
    fileErrs,
  );
  diffSet(
    'contracts',
    sourceElements.map(contractKey),
    generatedElements.map(contractKey),
    fileErrs,
  );

  const sourceInteractions = Array.isArray(sourceManifest.interactions) ? sourceManifest.interactions : [];
  const generatedInteractions = Array.isArray(generatedManifest.interactions) ? generatedManifest.interactions : [];
  diffSet(
    'interactions',
    sourceInteractions.map(interactionKey),
    generatedInteractions.map(interactionKey),
    fileErrs,
  );

  const sourceStates = sourceManifest.states || {};
  const generatedStates = generatedManifest.states || {};
  diffSet(
    'designed states',
    Array.isArray(sourceStates.designed) ? sourceStates.designed.map((s) => s && s.id) : [],
    Array.isArray(generatedStates.designed) ? generatedStates.designed.map((s) => s && s.id) : [],
    fileErrs,
  );
  diffSet(
    'delegated states',
    Array.isArray(sourceStates.delegated) ? sourceStates.delegated.map(delegatedKey) : [],
    Array.isArray(generatedStates.delegated) ? generatedStates.delegated.map(delegatedKey) : [],
    fileErrs,
  );
}

// ─── 收集工具 ──────────────────────────────────────────────────

async function readDirNames(dir) {
  try { return await ls(dir); } catch { return null; }
}

// 从清单文件解析期望 screen-id：优先 JSON 数组，回落逐行。
function parseScreensList(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) return arr.filter((x) => typeof x === 'string').map((x) => x.trim()).filter(Boolean);
    } catch { /* 回落逐行 */ }
  }
  return trimmed.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

// ─── ⑥ 设计屏覆盖对账（report-only：缺口 WARN；配置坏 FAIL）───────────

// 简易 glob → 正则（按路径段解析）：`*` 段内不跨 '/'；段级 `**` 匹配零或多个目录段
// （`**/x` 含根层 x、`a/**/b` 含 a/b、结尾 `/**` 含自身与任意深度）；连续 `**` 段先折叠
// （`**/**` ≡ `**`）；段内出现的 `**` 按 `*` 处理。其余字符按字面转义，不做花括号/问号。
// 语义用例冻结在 tests/glob-semantics/run.js（源仓 CI 跑）。
function globToRegExp(glob) {
  const rawSegs = glob.split('/').filter((s) => s !== '');
  const segs = rawSegs.filter((s, i) => !(s === '**' && rawSegs[i - 1] === '**'));
  let body = '';
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (seg === '**') {
      if (segs.length === 1) body += '.*';                                  // 整串 '**'
      else if (i === segs.length - 1) body += '(?:/.*)?';                   // 结尾 '/**'
      else body += (i === 0 ? '(?:[^/]+/)*' : '/(?:[^/]+/)*');              // 开头 / 中间
      continue;
    }
    if (i > 0 && segs[i - 1] !== '**') body += '/';   // 中间 '**' 的展开式已带结尾 '/'
    body += seg.replace(/[.+^${}()|[\]\\?]/g, '\\$&').replace(/\*/g, '[^/]*');
  }
  return new RegExp(`^${body}$`);
}

// 形态校验（fail closed）：返回错误行数组；空数组 = 合法。
function validateCoverageConfig(cov) {
  const errs = [];
  if (!cov || typeof cov !== 'object' || Array.isArray(cov)) return ['coverage 必须是对象'];
  if (typeof cov.designRoot !== 'string' || !cov.designRoot.trim()) errs.push('coverage.designRoot 缺失或为空');
  if (!Array.isArray(cov.screenGlobs) || cov.screenGlobs.length === 0 || cov.screenGlobs.some((g) => typeof g !== 'string' || !g.trim())) {
    errs.push('coverage.screenGlobs 必须是非空字符串数组');
  }
  if (cov.exempt !== undefined) {
    if (!Array.isArray(cov.exempt)) errs.push('coverage.exempt 必须是数组');
    else cov.exempt.forEach((e, i) => {
      if (!e || typeof e !== 'object' || typeof e.source !== 'string' || !e.source.trim()) errs.push(`coverage.exempt[${i}] 缺 source`);
      else if (typeof e.note !== 'string' || e.note.trim().length < 4) errs.push(`coverage.exempt[${i}]（${e.source}）缺 note 或过短——豁免必须写明原因`);
    });
  }
  if (cov.skipDirs !== undefined && (!Array.isArray(cov.skipDirs) || cov.skipDirs.some((d) => typeof d !== 'string'))) {
    errs.push('coverage.skipDirs 必须是字符串数组');
  }
  return errs;
}

// 走 designRoot 收集屏源候选（相对 designRoot 的路径）。沿用 kit 双环境 walk 惯例：
// 名字含 '.' 视为文件、不含视为目录（shim 无 stat）。
async function walkDesignRoot(root, rel, skipDirs, out) {
  let entries;
  try { entries = await ls(rel ? `${root}/${rel}` : root); } catch { return; }
  if (!entries || entries.length === 0) return;
  for (const name of entries) {
    const relPath = rel ? `${rel}/${name}` : name;
    if (name.includes('.')) out.push(relPath);
    else if (!skipDirs.has(name)) await walkDesignRoot(root, relPath, skipDirs, out);
  }
}

const normalizeSource = (s) => (typeof s === 'string' ? s.trim().replace(/^\.\//, '') : '');

// 返回 { errs: [], warns: [] }：errs=配置/接线坏（FAIL），warns=覆盖缺口与失效豁免（不 FAIL）。
async function coverageChecks(manifestSources) {
  const errs = validateCoverageConfig(COVERAGE_CONFIG);
  if (errs.length > 0) return { errs: errs.map((e) => `coverage 配置形态错误：${e}（${KIT_MODULE ? `modules.${KIT_MODULE}.` : ''}guards['check-manifest'].coverage）`), warns: [] };

  const root = COVERAGE_CONFIG.designRoot.trim().replace(/\/+$/, '');
  try { await ls(root); }
  catch { return { errs: [`coverage.designRoot 不可读：${root}（显式配置指向空无 = 接线坏；目录搬家请同步改配置）`], warns: [] }; }

  const skipDirs = new Set(Array.isArray(COVERAGE_CONFIG.skipDirs) ? COVERAGE_CONFIG.skipDirs : COVERAGE_DEFAULT_SKIP_DIRS);
  const candidates = [];
  await walkDesignRoot(root, '', skipDirs, candidates);
  // 逐 glob 零匹配 fail closed：拼错的 glob 会让本维静默变成 0/0 假绿，与防漏目标相反。
  // 屏还没建出来的合法过渡期请先移除该 glob，建屏时再加回。
  const globErrs = [];
  const matchedSet = new Set();
  for (const raw of COVERAGE_CONFIG.screenGlobs) {
    const g = raw.trim().replace(/^\.\//, '');
    const re = globToRegExp(g);
    const hits = candidates.filter((p) => re.test(p));
    if (hits.length === 0) globErrs.push(`coverage.screenGlobs '${raw}' 在 ${root} 下零匹配——glob 拼错或目录结构已变，修 glob 或移除该条（零匹配静默通过 = 假绿）`);
    for (const p of hits) matchedSet.add(p);
  }
  if (globErrs.length > 0) return { errs: globErrs, warns: [] };
  const screens = [...matchedSet].sort();

  const covered = new Set(manifestSources.map(normalizeSource).filter(Boolean));
  const exempt = Array.isArray(COVERAGE_CONFIG.exempt) ? COVERAGE_CONFIG.exempt : [];
  const exemptSources = new Set(exempt.map((e) => normalizeSource(e.source)));

  const warns = [];
  const uncovered = screens.filter((p) => !covered.has(p) && !exemptSources.has(p));
  for (const p of uncovered) warns.push(`设计屏尚无 manifest：${p}（补 manifest 进 handoff 体系，或登记 coverage.exempt 并写明原因）`);
  const screenSet = new Set(screens);
  for (const e of exempt) {
    const src = normalizeSource(e.source);
    if (covered.has(src)) warns.push(`coverage.exempt 失效（已有 manifest 覆盖）：${src}——请清理该豁免条目`);
    else if (!screenSet.has(src)) warns.push(`coverage.exempt 失效（源文件已不存在或不匹配 screenGlobs）：${src}——请清理该豁免条目`);
  }
  return { errs: [], warns, stats: { screens: screens.length, covered: screens.filter((p) => covered.has(p)).length } };
}

// ─── Main（早退避免深嵌；末行统一由本函数 log RESULT）─────────────

function fatal(lines) { for (const l of lines) log(l); log('\nRESULT: FAIL'); if (globalThis.__NODE__) process.exitCode = 1; }

async function main() {
  // ① 目录存在性
  const names = await readDirNames(MANIFEST_DIR);
  if (names === null || names.length === 0) {
    return fatal([`✗ manifest 目录不存在或为空：${MANIFEST_DIR}`,
      `  修法：装了还原交接层就必须每屏产 <screen>${MANIFEST_SUFFIX}（见 SCREEN-MANIFEST.template.md）。`,
      `        不装还原层请勿装本 guard（连同 CLAUDE 还原小节 / DoD 行一起卸）。`]);
  }
  const manifestFiles = names.filter((n) => n.endsWith(MANIFEST_SUFFIX)).sort();
  if (manifestFiles.length === 0) {
    return fatal([`✗ ${MANIFEST_DIR} 下无 *${MANIFEST_SUFFIX}（目录里有 ${names.length} 项但无生成物）`,
      `  修法：manifest 生成物文件名须以 ${MANIFEST_SUFFIX} 结尾；重生源头得到生成物。`]);
  }

  // 加载 schema
  let schema;
  try { schema = JSON.parse(await readFile(SCHEMA_PATH)); }
  catch (e) {
    return fatal([`✗ 无法读取 / 解析 schema：${SCHEMA_PATH}（${e && e.message}）`,
      `  修法：确认 SCHEMA_PATH 指向 screen-manifest.schema.json 且为合法 JSON。`]);
  }

  const idToFile = new Map();   // screen.id → 文件名（覆盖率对账用）
  const manifestSources = [];   // screen.source 集合（⑥ 设计屏覆盖对账用）
  const perFile = [];           // { file, errs, warns }
  for (const fname of manifestFiles) {
    const errs = [], fw = [];
    let manifest = null;
    try { manifest = JSON.parse(await readFile(`${MANIFEST_DIR}/${fname}`)); }
    catch (e) { errs.push(`JSON 无法解析：${e && e.message}`); }
    if (manifest !== null) {
      validate(manifest, schema, schema, '(root)', errs);
      semanticChecks(manifest, errs, fw);
      const id = manifest && manifest.screen && manifest.screen.id;
      if (typeof id === 'string' && id) idToFile.set(id, fname);
      const source = manifest && manifest.screen && manifest.screen.source;
      if (typeof source === 'string' && source.trim()) manifestSources.push(source);
      if (SOURCE_MANIFEST_DIR && typeof id === 'string' && id) {
        const sourcePath = `${SOURCE_MANIFEST_DIR}/${id}${SOURCE_MANIFEST_SUFFIX}`;
        let sourceManifest = null;
        try { sourceManifest = JSON.parse(await readFile(sourcePath)); }
        catch (e) { errs.push(`source drift: 无法读取 / 解析源 manifest ${sourcePath}（${e && e.message}）`); }
        if (sourceManifest) sourceDriftChecks(sourceManifest, manifest, errs);
      }
    }
    perFile.push({ file: fname, errs, warns: fw });
  }

  // ④ 覆盖率对账
  const coverageErrs = [];
  if (SCREENS_LIST_PATH) {
    let listRaw = null;
    try { listRaw = await readFile(SCREENS_LIST_PATH); } catch { /* 缺文件 */ }
    if (listRaw === null) coverageErrs.push(`SCREENS_LIST_PATH 配了但读不到：${SCREENS_LIST_PATH}`);
    else for (const id of parseScreensList(listRaw)) {
      if (!idToFile.has(id)) coverageErrs.push(`期望屏 "${id}" 无对应 manifest 生成物`);
    }
  }

  // ⑥ 设计屏覆盖对账（配置了才启用；缺口 WARN、配置坏 FAIL）
  let coverage = { errs: [], warns: [], stats: null };
  if (COVERAGE_CONFIG !== null) coverage = await coverageChecks(manifestSources);

  // ─── 报告 ───
  const warns = [];
  const totalErrs = perFile.reduce((s, f) => s + f.errs.length, 0) + coverageErrs.length + coverage.errs.length;
  const totalWarns = perFile.reduce((s, f) => s + f.warns.length, 0) + coverage.warns.length;
  log(`scanned ${manifestFiles.length} manifest · schema=${SCHEMA_PATH} · errors ${totalErrs} · warnings ${totalWarns}`);
  for (const { file, errs, warns: fw } of perFile) {
    if (errs.length === 0 && fw.length === 0) { log(`  ✓ ${file}`); continue; }
    log(`  ${errs.length ? '✗' : '⚠'} ${file}`);
    for (const e of errs) log(`      ✗ ${e}`);
    for (const w of fw) { log(`      ⚠ ${w}`); warns.push(`${file}: ${w}`); }
  }
  if (coverageErrs.length) {
    log(`\n✗ 覆盖率对账（SCREENS_LIST_PATH=${SCREENS_LIST_PATH}）：`);
    for (const e of coverageErrs) log(`      ✗ ${e}`);
  }
  if (coverage.errs.length) {
    log(`\n✗ 设计屏覆盖对账（coverage）：`);
    for (const e of coverage.errs) log(`      ✗ ${e}`);
  }
  if (COVERAGE_CONFIG !== null && coverage.stats) {
    log(`\nℹ 设计屏覆盖：${coverage.stats.covered}/${coverage.stats.screens} 屏已进 manifest 体系（缺口 WARN 不 FAIL，逐屏补齐或登记豁免）`);
    for (const w of coverage.warns) log(`  ⚠ ${w}`);
  }
  if (warns.length) log(`\n⚠ 待裁决队列（contract_ref=TBD，非 FAIL，随迭代评审收敛）：${warns.length} 条`);

  if (totalErrs > 0) {
    if (totalWarns > 0) log(`WARNINGS: ${totalWarns}`);
    return fatal([`\n修法：`,
      `  1. schema 违规 → 改「源头」再重生生成物（勿手改 *${MANIFEST_SUFFIX}；HANDOFF §1.2 真源+重生）。`,
      `  2. states 合计为空 → 补 designed 或 delegated（设计可少画不可不表态）。`,
      `  3. anchor 撞名 → 改名并 version+1、记 CHANGELOG（anchor 是对账主键）。`,
      `  4. 覆盖率缺口 → 为缺屏补 manifest，或从屏清单真源移除该 id。`,
      `  5. source drift → 先同步设计侧语义源，再重生 generated；勿让 generated 落后于 source。`,
      `  6. coverage 配置坏 → 修 designRoot / screenGlobs / exempt 形态（豁免必须带 note）。`]);
  }
  log(`\n✓ check-manifest: 全部生成物过 schema + 语义规则`);
  if (totalWarns > 0) log(`WARNINGS: ${totalWarns}`);
  log(`\nRESULT: PASS`);
}

await main();
