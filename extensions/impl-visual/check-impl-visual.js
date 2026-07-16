#!/usr/bin/env node
/**
 * check-impl-visual.js · 通用实现栈视觉契约执行器（design-spec-kit · MULTI-MODULE-PROPOSAL 方案 3）
 *
 * 默认只做 config-only 校验，不执行实现命令：
 *   - extension 已启用时必须有 extensions.<name> 配置块与 screens[]
 *   - screen manifest 存在、可解析、screen.id 对齐
 *   - interactions trigger / target 引用合法 anchor
 *   - contracts / interactions 需要 evidence；evidence 需要 command
 *   - command 满足所选 matcher 声明的 reporter 要求
 *   - 待登记队列（warning，非 FAIL）：manifestDir 下的 *.manifest.generated.json 若未在
 *     screens[] 登记、也不在 extensions.<name>.exempt（[{id, note}]，note 必填）里，
 *     逐条挂 warning——设计 sync 带回新屏时立即可见，实现落地后补登记销账。
 *     manifestDir 为显式配置（extension 级或 check-manifest guard）但目录不可读 = 配置错误 FAIL；
 *     只有缺省回退路径不存在才静默跳过（该模块未接 handoff 生成物）
 *   - evidence 静态核对（warning，非 FAIL，仅 config-only）：从 command 解析源文件，
 *     非 regex 的 evidence name 归一化后必须能在源文件里找到——测试改名断链
 *     不用等 --execute-impl 才暴露；command 里显式引用的文件不存在也挂 warning，
 *     只有解析不出任何文件 token（make target 等）才静默跳过
 *
 * 传入 --execute-impl 时才运行项目声明的 command，用 matcher 从输出中核对 evidence。
 *
 * Matcher 契约：输入 = command 合并 stdout/stderr，输出 = 每条 evidence 命中与否；
 * matcher 自己负责剥离该 reporter 的噪声（ANSI 色码 / 状态符 / 耗时等）。
 * 内置：substring（缺省）/ regex / flutter-expanded / playwright-list。
 * 新实现栈若无现成 matcher，就是要给 kit 提 matcher——这是显式扩展点，不是"零新代码"。
 *
 * 别名机制：`--as <extension-name>`（或环境变量 DESIGN_SPEC_KIT_EXT_AS）指定以哪个
 * extension 名运行——flutter-visual 薄壳以 `--as flutter-visual` 转发到本文件，
 * 层名 / 配置路径 / 输出文案与独立 flutter-visual 时代逐字节一致。
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const args = [];
const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);
const EXECUTE_IMPL = EFFECTIVE_ARGS.includes('--execute-impl');

function argValue(flag) {
  const i = EFFECTIVE_ARGS.indexOf(flag);
  if (i >= 0 && EFFECTIVE_ARGS[i + 1]) return EFFECTIVE_ARGS[i + 1];
  const eq = EFFECTIVE_ARGS.find((a) => a.startsWith(`${flag}=`));
  return eq ? eq.slice(flag.length + 1) : null;
}

const PROJECT_ROOT = process.cwd();
const CONFIG_PATH = 'docs/design-spec/config.json';
const EXTENSION_NAME = argValue('--as') || globalThis.process?.env?.DESIGN_SPEC_KIT_EXT_AS || 'impl-visual';
const IS_FLUTTER_ALIAS = EXTENSION_NAME === 'flutter-visual';
// 别名文案兼容：flutter-visual 时代的输出与错误文案原样保留
const IMPL_LABEL = IS_FLUTTER_ALIAS ? 'Flutter' : '实现命令';
const OUTPUT_LABEL = IS_FLUTTER_ALIAS ? 'Flutter test 输出' : '命令输出';

// ─── Matcher 集 ────────────────────────────────────────────────
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const MATCHERS = {
  substring: {
    matches: (output, value) => output.includes(value),
  },
  regex: {
    matches: (output, value) => new RegExp(value, 'm').test(output),
  },
  'flutter-expanded': {
    requiredReporter: { pattern: /--reporter(?:=|\s+)expanded\b/, hint: '--reporter expanded' },
    matches: (output, value) => output.includes(value),
  },
  'playwright-list': {
    requiredReporter: { pattern: /--reporter(?:=|\s+)list\b/, hint: '--reporter=list' },
    // list reporter 行含状态符/序号/[project]/耗时且可能带 ANSI 色码——剥色码后按包含匹配
    matches: (output, value) => stripAnsi(output).includes(value),
  },
};
const DEFAULT_MATCHER = IS_FLUTTER_ALIAS ? 'flutter-expanded' : 'substring';

const errors = [];
const warnings = [];
const reports = [];

function error(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function absProjectPath(p) {
  return path.isAbsolute(p) ? p : path.join(PROJECT_ROOT, p);
}

async function readJsonFile(filePath) {
  const raw = await readFile(absProjectPath(filePath), 'utf8');
  return JSON.parse(raw);
}

async function fileExists(filePath) {
  try {
    await stat(absProjectPath(filePath));
    return true;
  } catch {
    return false;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasContracts(element) {
  return isObject(element?.contracts) && Object.keys(element.contracts).length > 0;
}

// 解析 screen 的 matcher 声明；未知名字算配置错误
function resolveMatcher(screenId, name) {
  const key = name ?? DEFAULT_MATCHER;
  if (typeof key !== 'string' || !Object.prototype.hasOwnProperty.call(MATCHERS, key)) {
    error(`${screenId}: 未知 matcher '${key}'（内置：${Object.keys(MATCHERS).join(', ')}）`);
    return null;
  }
  return { key, ...MATCHERS[key] };
}

// evidence 项：string，或 { name, match?, pattern? }（match/pattern 单条覆盖 screen matcher）
function normalizeEvidenceItem(screenId, item, index) {
  if (typeof item === 'string') {
    if (!item.trim()) { error(`${screenId}: evidence 含空项或非字符串项`); return null; }
    return { name: item, match: null, pattern: null };
  }
  if (isObject(item)) {
    if (typeof item.name !== 'string' || !item.name.trim()) {
      error(`${screenId}: evidence[${index}] 是 object 时必须带非空 name`); return null;
    }
    if (item.match != null && !Object.prototype.hasOwnProperty.call(MATCHERS, item.match)) {
      error(`${screenId}: evidence[${index}].match='${item.match}' 未知（内置：${Object.keys(MATCHERS).join(', ')}）`); return null;
    }
    if (item.pattern != null && typeof item.pattern !== 'string') {
      error(`${screenId}: evidence[${index}].pattern 必须是字符串`); return null;
    }
    return { name: item.name, match: item.match ?? null, pattern: item.pattern ?? null };
  }
  error(`${screenId}: evidence 含空项或非字符串项`);
  return null;
}

function validateAnchorMap(screenId, manifestAnchors, anchors) {
  if (anchors == null) return;
  if (!isObject(anchors)) {
    error(`${screenId}: anchors 必须是 object`);
    return;
  }
  for (const [anchor, mapping] of Object.entries(anchors)) {
    if (!manifestAnchors.has(anchor)) {
      error(`${screenId}: anchors.${anchor} 未引用 manifest elements[].anchor`);
    }
    if (!isObject(mapping)) {
      error(`${screenId}: anchors.${anchor} 必须是 object`);
      continue;
    }
    if (typeof mapping.bySemantics === 'string') {
      error(`${screenId}: anchors.${anchor} 使用 bySemantics；默认约定要求 ValueKey(anchor)，例外请用 byKey`);
    }
    if (typeof mapping.byKey !== 'string' || !mapping.byKey.trim()) {
      error(`${screenId}: anchors.${anchor} 例外映射必须提供非空 byKey`);
    }
  }
}

function validateInteractions(screenId, manifest, manifestAnchors) {
  const interactions = Array.isArray(manifest.interactions) ? manifest.interactions : [];
  interactions.forEach((interaction, index) => {
    if (!manifestAnchors.has(interaction?.trigger)) {
      error(`${screenId}: interactions[${index}].trigger="${interaction?.trigger ?? ''}" 未引用 manifest anchor`);
    }
    if (!manifestAnchors.has(interaction?.target)) {
      error(`${screenId}: interactions[${index}].target="${interaction?.target ?? ''}" 未引用 manifest anchor`);
    }
  });
  return interactions;
}

function validateEvidence(screen, manifest, interactions, matcher) {
  const screenId = screen.id;
  const rawEvidence = Array.isArray(screen.evidence) ? screen.evidence : [];
  const elements = Array.isArray(manifest.elements) ? manifest.elements : [];
  const contractAnchors = elements.filter(hasContracts).map((element) => element.anchor);
  const needsEvidence = contractAnchors.length > 0 || interactions.length > 0;

  if (screen.evidence != null && !Array.isArray(screen.evidence)) {
    error(`${screenId}: evidence 必须是 string[]（或 {name, match?, pattern?} 项）`);
  }
  const evidence = rawEvidence
    .map((item, index) => normalizeEvidenceItem(screenId, item, index))
    .filter(Boolean);
  if (needsEvidence && evidence.length === 0 && rawEvidence.length === 0) {
    error(`${screenId}: manifest 声明了 contracts/interactions，但 screen 未声明 evidence test name`);
  }
  if (evidence.length > 0) {
    if (typeof screen.command !== 'string' || !screen.command.trim()) {
      error(`${screenId}: 声明了 evidence 但缺少 command`);
    } else {
      if (matcher?.requiredReporter && !matcher.requiredReporter.pattern.test(screen.command)) {
        if (IS_FLUTTER_ALIAS) {
          error(`${screenId}: command 必须包含 --reporter expanded，以便 --execute-impl 稳定核对 test name`);
        } else {
          error(`${screenId}: matcher '${matcher.key}' 要求 command 包含 ${matcher.requiredReporter.hint}，以便 --execute-impl 稳定核对 evidence`);
        }
      }
      // 单条 evidence 覆盖 matcher 时，逐条校验该 effective matcher 的 reporter 要求
      for (const item of evidence) {
        if (!item.match || item.match === matcher?.key) continue;
        const override = MATCHERS[item.match];
        if (override.requiredReporter && !override.requiredReporter.pattern.test(screen.command)) {
          error(`${screenId}: evidence '${item.name}' 的 matcher '${item.match}' 要求 command 包含 ${override.requiredReporter.hint}，以便 --execute-impl 稳定核对 evidence`);
        }
      }
    }
    // regex effective pattern 必须在 config-only 阶段就能编译，别拖到 execute 阶段崩异常
    for (const item of evidence) {
      const effectiveKey = item.match ?? matcher?.key;
      if (effectiveKey !== 'regex') continue;
      const value = item.pattern ?? item.name;
      try { new RegExp(value, 'm'); }
      catch (err) { error(`${screenId}: evidence '${item.name}' 的 regex pattern 非法：${err && err.message}`); }
    }
  }
  return { evidence, contractAnchors };
}

// ─── 待登记队列（coverage）───────────────────────────────────
// manifestDir 解析：extension 自己的 manifestDir > check-manifest guard 配置（模块键覆盖顶层）> 默认。
// 返回 { dir, source }——source 区分显式配置与缺省回退：显式配置指向不可读目录是配置错误（fail closed），
// 缺省回退不存在只说明该模块没接 handoff 生成物，静默跳过。
function resolveManifestDir(config, kitModule, extConfig) {
  if (typeof extConfig.manifestDir === 'string' && extConfig.manifestDir.trim()) {
    return { dir: extConfig.manifestDir, source: `extensions.${EXTENSION_NAME}.manifestDir` };
  }
  const pick = (node) => node?.guards?.['check-manifest'] || node?.guards?.['check-manifest.js'] || {};
  const merged = kitModule
    ? { ...pick(config), ...pick(config.modules?.[kitModule]) }
    : pick(config);
  if (typeof merged.manifestDir === 'string' && merged.manifestDir.trim()) {
    return { dir: merged.manifestDir, source: 'check-manifest guard 配置的 manifestDir' };
  }
  return { dir: 'docs/manifests', source: null };
}

// exempt 形态校验（fail closed：豁免必须写明原因）；返回 Map<id, note>，形态错误记 error
function parseExempt(extConfig) {
  const raw = extConfig.exempt;
  const exempt = new Map();
  if (raw == null) return exempt;
  if (!Array.isArray(raw)) {
    error(`extensions.${EXTENSION_NAME}.exempt 必须是数组（[{id, note}]）`);
    return exempt;
  }
  raw.forEach((item, index) => {
    if (!isObject(item) || typeof item.id !== 'string' || !item.id.trim()
      || typeof item.note !== 'string' || !item.note.trim()) {
      error(`extensions.${EXTENSION_NAME}.exempt[${index}] 必须是 { id, note } 且两者非空——豁免必须写明原因`);
      return;
    }
    exempt.set(item.id, item.note);
  });
  return exempt;
}

async function checkCoverage(config, kitModule, extConfig, registeredIds) {
  const exempt = parseExempt(extConfig);
  const { dir, source } = resolveManifestDir(config, kitModule, extConfig);
  const SUFFIX = '.manifest.generated.json';
  let entries;
  try {
    entries = await readdir(absProjectPath(dir));
  } catch (err) {
    const code = err && err.code ? err.code : String(err);
    if (source) {
      // 显式配置的对账面读不到 = 配置错误，fail closed——静默跳过会让待登记队列整体假绿
      error(`${source} 指向不可读目录：${dir}（${code}）——修正路径，或该模块确无 handoff 生成物时移除该配置`);
      return;
    }
    // 缺省回退路径只有 ENOENT（目录不存在 = 该模块未接 handoff 生成物）可静默跳过；
    // ENOTDIR / EACCES 等其余异常说明对账面状态异常，静默会假绿
    if (code === 'ENOENT') return;
    error(`缺省 manifestDir 读取异常：${dir}（${code}）——对账面不可用；修复该路径，或用 extensions.${EXTENSION_NAME}.manifestDir 显式指向生成物目录`);
    return;
  }
  const manifestIds = entries.filter((f) => f.endsWith(SUFFIX)).map((f) => f.slice(0, -SUFFIX.length)).sort();
  for (const id of manifestIds) {
    if (registeredIds.has(id) || exempt.has(id)) continue;
    warn(`待登记：${dir}/${id}${SUFFIX} 已进 handoff 体系，但未在 extensions.${EXTENSION_NAME}.screens 登记——实现落地后补 command + evidence；有意不做实现核对则加入 extensions.${EXTENSION_NAME}.exempt（附 note 说明原因）`);
  }
  for (const id of exempt.keys()) {
    if (registeredIds.has(id)) {
      warn(`exempt '${id}' 同时已在 screens 登记，豁免条目已失效，请删除`);
    } else if (!manifestIds.includes(id)) {
      warn(`exempt '${id}' 没有对应生成物（${dir}/${id}${SUFFIX}），豁免条目已失效，请删除`);
    }
  }
}

// ─── evidence 静态核对（config-only）─────────────────────────
// 轻量 shell-word lexer：把 command 切成「段（未引号的 && / ; / | / || 为界）× 词（空白为界）」。
// 单引号内原样；双引号内支持 \ 转义；未引号部分支持 \ 转义与引号进入。不做变量展开/globbing——
// 只为让 `node 'a b.js'` 这类带引号/空格的文件引用被正确识别，不是完整 shell 实现。
function lexCommandSegments(command) {
  const s = String(command);
  const segments = [];
  let words = [];
  let cur = '';
  let hasCur = false;
  let quote = null;
  const pushWord = () => { if (hasCur) { words.push(cur); cur = ''; hasCur = false; } };
  const pushSegment = () => { pushWord(); if (words.length > 0) segments.push(words); words = []; };
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote === "'") {
      if (ch === "'") { quote = null; } else { cur += ch; }
      continue;
    }
    if (quote === '"') {
      if (ch === '\\' && i + 1 < s.length) { cur += s[i + 1]; i++; continue; }
      if (ch === '"') { quote = null; continue; }
      cur += ch;
      continue;
    }
    if (ch === '\\' && i + 1 < s.length) { cur += s[i + 1]; hasCur = true; i++; continue; }
    if (ch === "'" || ch === '"') { quote = ch; hasCur = true; continue; }
    if (/\s/.test(ch)) { pushWord(); continue; }
    if (ch === ';') { pushSegment(); continue; }
    if (ch === '&' && s[i + 1] === '&') { pushSegment(); i++; continue; }
    if (ch === '|') { pushSegment(); if (s[i + 1] === '|') i++; continue; }
    cur += ch;
    hasCur = true;
  }
  pushSegment();
  return segments;
}

// 从 command 解析源文件：逐段跟踪 cd 前缀，段内带扩展名（首字母开头，排除 1.2.3 类版本号）
// 的词即文件候选。返回 { files, missing }——candidate 存在进 files，不存在进 missing：
// 「没有任何文件 token」（make target 等）与「显式引用的文件不存在」（改名/删除/路径拼错）必须区分，
// 后者静默跳过会让静态核对整体假绿。
async function resolveCommandFiles(command) {
  let cwd = PROJECT_ROOT;
  const files = [];
  const missing = [];
  for (const tokens of lexCommandSegments(command)) {
    if (tokens[0] === 'cd' && tokens[1]) {
      cwd = path.isAbsolute(tokens[1]) ? tokens[1] : path.join(cwd, tokens[1]);
      continue;
    }
    for (const token of tokens) {
      if (token.startsWith('-') || token.includes('://') || !/\.[A-Za-z][A-Za-z0-9]*$/.test(token)) continue;
      const candidate = path.isAbsolute(token) ? token : path.join(cwd, token);
      try {
        if ((await stat(candidate)).isFile()) files.push(candidate);
        else missing.push(path.relative(PROJECT_ROOT, candidate));
      } catch {
        missing.push(path.relative(PROJECT_ROOT, candidate));
      }
    }
  }
  return { files, missing };
}

// 归一化：剥转义反斜杠 + 去空白/引号——容忍源码里字符串换行拼接与引号转义
const normalizeForSource = (s) => s.replace(/\\/g, '').replace(/['"`\s]+/g, '');

async function staticEvidenceCheck(validatedScreens) {
  for (const item of validatedScreens) {
    if (!item || item.evidence.length === 0 || !item.matcher) continue;
    const { screen, evidence, matcher } = item;
    if (typeof screen.command !== 'string' || !screen.command.trim()) continue;
    const { files, missing } = await resolveCommandFiles(screen.command);
    if (missing.length > 0) {
      warn(`${screen.id}: command 引用的文件不存在：${missing.join(', ')}——测试文件改名/删除/路径拼错会让 evidence 永不核对；请修正 command`);
    }
    if (files.length === 0) continue; // 解析不出任何存在的源文件（如 make target），静态核对不适用
    let haystack = '';
    for (const file of files) {
      try { haystack += normalizeForSource(await readFile(file, 'utf8')); }
      catch { /* 读不到就少一份来源，不阻塞 */ }
    }
    if (!haystack) continue;
    for (const e of evidence) {
      const effectiveKey = e.match ?? matcher.key;
      if (effectiveKey === 'regex' || e.pattern != null) continue; // regex/pattern 语义面向运行输出，静态跳过
      if (!haystack.includes(normalizeForSource(e.name))) {
        warn(`${screen.id}: evidence '${e.name}' 未出现在测试源码（${files.map((f) => path.relative(PROJECT_ROOT, f)).join(', ')}）——测试改名会静默断链；改名请同步 config，动态拼接的用例名可为该条改用 regex matcher`);
      }
    }
  }
}

async function runCommand(command) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: PROJECT_ROOT,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk.toString(); });
    child.stderr.on('data', (chunk) => { output += chunk.toString(); });
    child.on('close', (code) => resolve({ code, output }));
    child.on('error', (err) => resolve({ code: 1, output: `spawn error: ${err.message}` }));
  });
}

async function loadConfig() {
  try {
    return await readJsonFile(CONFIG_PATH);
  } catch (err) {
    error(`无法读取 / 解析 ${CONFIG_PATH}: ${err && err.message}`);
    return null;
  }
}

async function validateScreen(screen) {
  if (!isObject(screen)) {
    error('screens[] 每项必须是 object');
    return null;
  }
  if (typeof screen.id !== 'string' || !screen.id.trim()) error('screens[] 缺少非空 id');
  if (typeof screen.manifest !== 'string' || !screen.manifest.trim()) error(`${screen.id || '?'}: 缺少 manifest 路径`);

  if (typeof screen.manifest !== 'string' || !screen.manifest.trim()) return null;
  if (!await fileExists(screen.manifest)) {
    error(`${screen.id || '?'}: manifest 不存在：${screen.manifest}`);
    return null;
  }

  let manifest;
  try {
    manifest = await readJsonFile(screen.manifest);
  } catch (err) {
    error(`${screen.id || '?'}: manifest 无法解析：${err && err.message}`);
    return null;
  }

  const manifestId = manifest?.screen?.id;
  if (typeof screen.id === 'string' && typeof manifestId === 'string' && screen.id !== manifestId) {
    error(`${screen.id}: config id 与 manifest screen.id 不一致（manifest=${manifestId}）`);
  }

  const matcher = resolveMatcher(screen.id || manifestId || '?', screen.matcher);

  const elements = Array.isArray(manifest.elements) ? manifest.elements : [];
  const manifestAnchors = new Set(elements.map((element) => element?.anchor).filter((anchor) => typeof anchor === 'string'));
  validateAnchorMap(screen.id || manifestId || '?', manifestAnchors, screen.anchors);
  const interactions = validateInteractions(screen.id || manifestId || '?', manifest, manifestAnchors);
  const { evidence, contractAnchors } = validateEvidence(screen, manifest, interactions, matcher);

  reports.push(`  ✓ ${screen.id}: anchors=${manifestAnchors.size} contracts=${contractAnchors.length} interactions=${interactions.length} evidence=${evidence.length}`);

  return { screen, evidence, matcher };
}

function evidenceHit(output, item, screenMatcher) {
  const matcher = item.match ? { key: item.match, ...MATCHERS[item.match] } : screenMatcher;
  const value = item.pattern ?? item.name;
  return matcher.matches(output, value);
}

async function executeEvidence(validatedScreens) {
  for (const item of validatedScreens) {
    if (!item || item.evidence.length === 0 || !item.matcher) continue;
    const { screen, evidence, matcher } = item;
    reports.push(`  · execute ${screen.id}: ${screen.command}`);
    const result = await runCommand(screen.command);
    if (result.code !== 0) {
      error(`${screen.id}: command 退出码 ${result.code}`);
      // 失败诊断：CI 上看不到本地终端，把子进程输出尾部带进 guard 日志，别让排障只剩一个退出码
      const tail = (result.output || '').split('\n').filter((l) => l.trim()).slice(-40);
      if (tail.length > 0) {
        reports.push(`      ┌ command 输出尾部（最后 ${tail.length} 行）：`);
        for (const line of tail) reports.push(`      │ ${line}`);
      }
    }
    // 匹配阶段防御：matcher 抛异常（如运行期才暴露的非法输入）转成 guard 级 FAIL，不裸崩
    const found = [];
    const errored = new Set();
    for (const e of evidence) {
      try {
        if (evidenceHit(result.output, e, matcher)) found.push(e);
      } catch (err) {
        errored.add(e);
        error(`${screen.id}: evidence '${e.name}' 匹配执行异常：${err && err.message}`);
      }
    }
    if (found.length === 0 && errored.size === 0) {
      if (IS_FLUTTER_ALIAS) {
        error(`${screen.id}: ${OUTPUT_LABEL}没有任何 evidence test name；请确认 command 使用 --reporter expanded`);
      } else {
        error(`${screen.id}: ${OUTPUT_LABEL}没有任何 evidence 命中；请确认 reporter 配置与 matcher '${matcher.key}' 匹配`);
      }
      continue;
    }
    for (const e of evidence) {
      if (!found.includes(e) && !errored.has(e)) {
        error(`${screen.id}: ${OUTPUT_LABEL}缺少 evidence${IS_FLUTTER_ALIAS ? ' test name' : ''}: ${e.name}`);
      }
    }
  }
}

async function main() {
  const config = await loadConfig();
  if (!config) return;

  // 多模块 profile：runner 经 DESIGN_SPEC_KIT_MODULE 传模块名；模块的 extensions 块整体覆盖顶层
  const moduleOverride = '';   // 沙箱手改位
  const kitModule = moduleOverride || globalThis.process?.env?.DESIGN_SPEC_KIT_MODULE || '';
  const moduleNode = kitModule ? (config.modules?.[kitModule] ?? {}) : null;
  const effectiveLayers = kitModule
    ? (Array.isArray(moduleNode.layers) && moduleNode.layers.length > 0 ? moduleNode.layers : config.kit?.layers)
    : config.kit?.layers;

  const enabled = Array.isArray(effectiveLayers) && effectiveLayers.includes(EXTENSION_NAME);
  if (!enabled) {
    reports.push(`  · ${EXTENSION_NAME} 未在 kit.layers 启用，跳过`);
    return;
  }

  const extConfig = kitModule
    ? (moduleNode.extensions?.[EXTENSION_NAME] ?? config.extensions?.[EXTENSION_NAME])
    : config.extensions?.[EXTENSION_NAME];
  if (!isObject(extConfig)) {
    error(`kit.layers 启用了 '${EXTENSION_NAME}'，但缺少 extensions.${EXTENSION_NAME} 配置块`);
    return;
  }
  if (!Array.isArray(extConfig.screens)) {
    error(`extensions.${EXTENSION_NAME}.screens 必须是数组`);
    return;
  }
  if (extConfig.screens.length === 0) {
    error(`extensions.${EXTENSION_NAME}.screens 为空；启用 extension 后至少声明一个 screen，或从 kit.layers 移除 '${EXTENSION_NAME}'`);
    return;
  }

  const validated = [];
  for (const screen of extConfig.screens) {
    validated.push(await validateScreen(screen));
  }
  // 待登记队列：manifest 已生成但 screens 未登记 → warning（execute 与 config-only 均报）
  if (errors.length === 0) {
    const registeredIds = new Set(
      extConfig.screens.filter(isObject).map((s) => s.id).filter((id) => typeof id === 'string' && id.trim()),
    );
    await checkCoverage(config, kitModule, extConfig, registeredIds);
  }
  if (EXECUTE_IMPL && errors.length === 0) {
    await executeEvidence(validated);
  } else if (!EXECUTE_IMPL) {
    reports.push(`  · config-only 模式：未执行 ${IMPL_LABEL}；需要实现核对时加 --execute-impl`);
    if (errors.length === 0) {
      await staticEvidenceCheck(validated);
    }
  }
}

await main();

console.log(`${EXTENSION_NAME}: errors ${errors.length} · warnings ${warnings.length}${EXECUTE_IMPL ? ' · execute-impl' : ' · config-only'}`);
for (const line of reports) console.log(line);
for (const warning of warnings) console.log(`  ⚠ ${warning}`);
for (const err of errors) console.log(`  ✗ ${err}`);

if (errors.length > 0) {
  console.log('\n修法：');
  console.log(`  1. 在 ${CONFIG_PATH} 中补齐 kit.layers 与 extensions.${EXTENSION_NAME}.screens[]。`);
  console.log('  2. 遵守默认 ValueKey(anchor)；只有旧 key 例外才写 anchors.<anchor>.byKey。');
  if (IS_FLUTTER_ALIAS) {
    console.log('  3. evidence 写 testWidgets 用例名，command 使用 flutter test --reporter expanded。');
  } else {
    console.log('  3. evidence 写测试用例名（或 {name, match, pattern}），command 的 reporter 满足所选 matcher 要求。');
  }
  if (warnings.length > 0) console.log(`WARNINGS: ${warnings.length}`);
  console.log('\nRESULT: FAIL');
  process.exitCode = 1;
} else {
  if (warnings.length > 0) console.log(`WARNINGS: ${warnings.length}`);
  console.log('\nRESULT: PASS');
}
