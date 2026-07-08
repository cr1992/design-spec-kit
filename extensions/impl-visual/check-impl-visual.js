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

import { readFile, stat } from 'node:fs/promises';
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
  if (EXECUTE_IMPL && errors.length === 0) {
    await executeEvidence(validated);
  } else if (!EXECUTE_IMPL) {
    reports.push(`  · config-only 模式：未执行 ${IMPL_LABEL}；需要实现核对时加 --execute-impl`);
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
  console.log('\nRESULT: FAIL');
  process.exitCode = 1;
} else {
  console.log('\nRESULT: PASS');
}
