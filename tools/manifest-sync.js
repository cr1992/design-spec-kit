#!/usr/bin/env node
/**
 * manifest-sync.js · 设计源 manifest → generated 同步（design-spec-kit · MULTI-MODULE-PROPOSAL 方案 4）
 *
 * kit 上收的只有 schema-owned canonicalization：
 *   - projection：按 schema 语义裁剪 delegated（elements[].delegated / states.delegated
 *     只保留 to / contract_ref / status，去掉设计侧附注字段）
 *   - 稳定序列化：JSON 2 空格缩进 + 末尾换行；generated 追加 `generator` 字段记录
 *     projection 版本（schema-projection-v1），演进走 kit 版本发布
 *   - screens 清单：按 screen.id 排序生成 screensListPath
 *   - `--check`：对 generated 与 screens 清单做逐字节漂移校验（CI / commit gate 用）
 *
 * 设计源的抽取与业务特化 normalizer 留在消费仓，不进本工具。
 *
 * 配置：读各模块 check-manifest 的 sourceManifestDir / sourceManifestSuffix /
 * manifestDir / screensListPath（多模块下按 modules.<m>.guards ⊕ 顶层 guards 合并；
 * 未配 sourceManifestDir 的模块跳过）。
 *
 * 用法：
 *   node tools/manifest-sync.js               重生 generated + screens 清单
 *   node tools/manifest-sync.js --check       只校验不写盘，漂移则 FAIL
 *   node tools/manifest-sync.js --module <m>  只处理指定模块
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const CONFIG_PATH = 'docs/design-spec/config.json';
const GENERATED_SUFFIX = '.manifest.generated.json';
const GENERATOR_VERSION = 'schema-projection-v1';

const argv = process.argv.slice(2);
const mode = argv.includes('--check') ? 'check' : 'write';
// --module 必须带模块名：缺值/下一项是 flag 都 fail closed，绝不静默退化成全量
//（write 模式下退化会误重生全部模块的 generated）
const onlyModuleIdx = argv.indexOf('--module');
let onlyModule = null;
if (onlyModuleIdx >= 0) {
  const value = argv[onlyModuleIdx + 1];
  if (!value || value.startsWith('--')) {
    console.error('--module 需要模块名参数（用法：--module <name>）');
    console.error('RESULT: FAIL');
    process.exit(1);
  }
  onlyModule = value;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function normalizeText(value) {
  return value.endsWith('\n') ? value : `${value}\n`;
}

// schema-owned projection：裁剪 delegated 到 schema 要求的最小字段，追加 generator 版本
function toGeneratedManifest(source) {
  const manifest = structuredClone(source);

  for (const item of manifest.elements ?? []) {
    if (item.delegated) {
      item.delegated = {
        to: item.delegated.to,
        contract_ref: item.delegated.contract_ref,
        status: item.delegated.status,
      };
    }
  }

  if (manifest.states?.delegated) {
    manifest.states.delegated = manifest.states.delegated.map((item) => ({
      state: item.state,
      to: item.to,
      contract_ref: item.contract_ref,
      status: item.status,
    }));
  }

  manifest.generator = GENERATOR_VERSION;

  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function pickGuardCfg(node) {
  return node?.guards?.['check-manifest'] || node?.guards?.['check-manifest.js'] || {};
}

async function syncOne({ moduleName, guard, drift }) {
  const tag = moduleName ? `${moduleName}/` : '';
  const sourceDir = guard.sourceManifestDir;
  const sourceSuffix = guard.sourceManifestSuffix ?? '.manifest.json';
  const targetDir = guard.manifestDir ?? 'docs/design-spec/manifests';
  const screensListPath = guard.screensListPath ?? '';

  if (!sourceDir) {
    console.log(`  · ${tag}check-manifest 未配置 sourceManifestDir，跳过（该模块不走本工具同步）`);
    return [];
  }

  const sourceNames = (await fs.readdir(sourceDir))
    .filter((name) => name.endsWith(sourceSuffix))
    .sort();

  if (sourceNames.length === 0) {
    throw new Error(`${tag}${sourceDir} 下没有 ${sourceSuffix} 源 manifest`);
  }

  const planned = [];
  for (const sourceName of sourceNames) {
    const sourcePath = path.join(sourceDir, sourceName);
    const manifest = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
    const screenId = manifest.screen?.id;
    if (!screenId) {
      throw new Error(`${sourcePath} 缺 screen.id`);
    }
    planned.push({
      screenId,
      sourcePath,
      targetPath: path.join(targetDir, sourceName.slice(0, -sourceSuffix.length) + GENERATED_SUFFIX),
      raw: toGeneratedManifest(manifest),
    });
  }

  const screensText = normalizeText(planned.map((item) => item.screenId).sort().join('\n'));

  for (const item of planned) {
    if (mode === 'write') {
      await fs.mkdir(path.dirname(item.targetPath), { recursive: true });
      await fs.writeFile(item.targetPath, item.raw);
      continue;
    }
    const current = (await exists(item.targetPath))
      ? normalizeText(await fs.readFile(item.targetPath, 'utf8'))
      : '';
    if (current !== item.raw) {
      drift.push(`${item.targetPath} 未与 ${item.sourcePath} 同步`);
    }
  }

  if (screensListPath) {
    if (mode === 'write') {
      await fs.writeFile(screensListPath, screensText);
    } else {
      const current = (await exists(screensListPath))
        ? normalizeText(await fs.readFile(screensListPath, 'utf8'))
        : '';
      if (current !== screensText) {
        drift.push(`${screensListPath} 未与源 manifest 同步`);
      }
    }
  }

  return planned.map((item) => `${tag}${item.screenId}`);
}

async function main() {
  const config = await readJson(CONFIG_PATH);
  const modulesConfig = config.modules && typeof config.modules === 'object' && !Array.isArray(config.modules)
    ? config.modules : null;

  let plans;
  if (modulesConfig) {
    const names = Object.keys(modulesConfig);
    if (names.length === 0) throw new Error('modules 分节为空——声明至少一个模块，或删除 modules 分节回到单模块模式');
    if (onlyModule && !names.includes(onlyModule)) throw new Error(`--module ${onlyModule} 未在 modules 分节声明`);
    plans = names
      .filter((name) => !onlyModule || name === onlyModule)
      .map((name) => ({
        moduleName: name,
        guard: { ...pickGuardCfg(config), ...pickGuardCfg(modulesConfig[name]) },
      }));
  } else {
    if (onlyModule) throw new Error('--module 仅在 modules 分节存在时可用');
    plans = [{ moduleName: null, guard: pickGuardCfg(config) }];
  }

  const drift = [];
  const synced = [];
  for (const plan of plans) {
    synced.push(...await syncOne({ ...plan, drift }));
  }

  if (drift.length > 0) {
    console.error('manifest-sync 漂移：');
    for (const item of drift) console.error(`  - ${item}`);
    console.error('修法：node tools/design-spec-kit/tools/manifest-sync.js 重生并提交');
    console.error('RESULT: FAIL');
    process.exitCode = 1;
    return;
  }

  const action = mode === 'write' ? '已重生' : '校验通过';
  console.log(`manifest-sync（${GENERATOR_VERSION}）${action}：${synced.join(', ') || '无屏'}`);
  console.log('RESULT: PASS');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  console.error('RESULT: FAIL');
  process.exitCode = 1;
});
