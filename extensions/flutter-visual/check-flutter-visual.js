#!/usr/bin/env node
/**
 * check-flutter-visual.js · Flutter visual contract extension（design-spec-kit）
 *
 * 默认只做 config-only 校验，不启动 Flutter：
 *   - extension 已启用时必须有 extensions.flutter-visual 配置块与 screens[]
 *   - screen manifest 存在、可解析、screen.id 对齐
 *   - interactions trigger / target 引用合法 anchor
 *   - contracts / interactions 需要 evidence；evidence 需要 command
 *   - command 必须使用可稳定输出测试名的 reporter：--reporter expanded
 *
 * 传入 --execute-impl 时才运行项目声明的 command，并从输出中核对 evidence test name。
 */

import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const args = [];
const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);
const EXECUTE_IMPL = EFFECTIVE_ARGS.includes('--execute-impl');

const PROJECT_ROOT = process.cwd();
const CONFIG_PATH = 'docs/design-spec/config.json';
const EXTENSION_NAME = 'flutter-visual';

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

function hasReporterExpanded(command) {
  return /--reporter(?:=|\s+)expanded\b/.test(command);
}

function hasContracts(element) {
  return isObject(element?.contracts) && Object.keys(element.contracts).length > 0;
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

function validateEvidence(screen, manifest, interactions) {
  const screenId = screen.id;
  const evidence = Array.isArray(screen.evidence) ? screen.evidence : [];
  const elements = Array.isArray(manifest.elements) ? manifest.elements : [];
  const contractAnchors = elements.filter(hasContracts).map((element) => element.anchor);
  const needsEvidence = contractAnchors.length > 0 || interactions.length > 0;

  if (screen.evidence != null && !Array.isArray(screen.evidence)) {
    error(`${screenId}: evidence 必须是 string[]`);
  }
  for (const item of evidence) {
    if (typeof item !== 'string' || !item.trim()) error(`${screenId}: evidence 含空项或非字符串项`);
  }
  if (needsEvidence && evidence.length === 0) {
    error(`${screenId}: manifest 声明了 contracts/interactions，但 screen 未声明 evidence test name`);
  }
  if (evidence.length > 0) {
    if (typeof screen.command !== 'string' || !screen.command.trim()) {
      error(`${screenId}: 声明了 evidence 但缺少 command`);
    } else if (!hasReporterExpanded(screen.command)) {
      error(`${screenId}: command 必须包含 --reporter expanded，以便 --execute-impl 稳定核对 test name`);
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

  const elements = Array.isArray(manifest.elements) ? manifest.elements : [];
  const manifestAnchors = new Set(elements.map((element) => element?.anchor).filter((anchor) => typeof anchor === 'string'));
  validateAnchorMap(screen.id || manifestId || '?', manifestAnchors, screen.anchors);
  const interactions = validateInteractions(screen.id || manifestId || '?', manifest, manifestAnchors);
  const { evidence, contractAnchors } = validateEvidence(screen, manifest, interactions);

  reports.push(`  ✓ ${screen.id}: anchors=${manifestAnchors.size} contracts=${contractAnchors.length} interactions=${interactions.length} evidence=${evidence.length}`);

  return { screen, evidence };
}

async function executeEvidence(validatedScreens) {
  for (const item of validatedScreens) {
    if (!item || item.evidence.length === 0) continue;
    const { screen, evidence } = item;
    reports.push(`  · execute ${screen.id}: ${screen.command}`);
    const result = await runCommand(screen.command);
    if (result.code !== 0) {
      error(`${screen.id}: command 退出码 ${result.code}`);
    }
    const found = evidence.filter((name) => result.output.includes(name));
    if (found.length === 0) {
      error(`${screen.id}: Flutter test 输出没有任何 evidence test name；请确认 command 使用 --reporter expanded`);
      continue;
    }
    const missing = evidence.filter((name) => !result.output.includes(name));
    for (const name of missing) {
      error(`${screen.id}: Flutter test 输出缺少 evidence test name: ${name}`);
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
    reports.push('  · config-only 模式：未执行 Flutter；需要实现核对时加 --execute-impl');
  }
}

await main();

console.log(`flutter-visual: errors ${errors.length} · warnings ${warnings.length}${EXECUTE_IMPL ? ' · execute-impl' : ' · config-only'}`);
for (const line of reports) console.log(line);
for (const warning of warnings) console.log(`  ⚠ ${warning}`);
for (const err of errors) console.log(`  ✗ ${err}`);

if (errors.length > 0) {
  console.log('\n修法：');
  console.log(`  1. 在 ${CONFIG_PATH} 中补齐 kit.layers 与 extensions.${EXTENSION_NAME}.screens[]。`);
  console.log('  2. 遵守默认 ValueKey(anchor)；只有旧 key 例外才写 anchors.<anchor>.byKey。');
  console.log('  3. evidence 写 testWidgets 用例名，command 使用 flutter test --reporter expanded。');
  console.log('\nRESULT: FAIL');
  process.exitCode = 1;
} else {
  console.log('\nRESULT: PASS');
}
