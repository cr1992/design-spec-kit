#!/usr/bin/env node
/**
 * build-bundle.js · bundle 生成器（design-spec-kit · 与平台无关）
 *
 * node-only；沙箱用户逐个跑 guard 即可（bundle 生成不是沙箱场景，落位执行者是
 * bundle 的*消费方*而非生产方）。
 *
 * 守什么：`design-spec-kit.bundle.md` 是「整个 kit 塞进一个文件」的分发形态
 * （给只能逐个上传文件、没有 git 的环境）。它是**生成物**，源文件才是真相；
 * 本脚本从显式文件清单重新拼装 bundle，`--check` 模式校验磁盘 bundle 有没有
 * 落后于源（漂移 = FAIL），可挂 kit 仓 CI。
 *
 * 怎么跑（cwd 在哪里跑都行，脚本自己定位 kit 根）：
 *   node tools/build-bundle.js            重生 design-spec-kit.bundle.md
 *   node tools/build-bundle.js --check    只比对不写盘，不一致则 FAIL
 *
 * 配置说明：FILES 是★必改项——新增/改名文件后来这里补一行；bundle 头部的拆包
 * 指令文案也在下面，一并维护。
 * ═════════════════════════════════════════════════════════════*/

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// ─── 配置（新增/删除 kit 文件时★必改这里）──────────────────────
const args = [];   // 沙箱手改位（本文件 node-only，一般留空，走 process.argv）

// 根目录散件（相对 kit 根）——显式列出，不做目录扫描（bundle 内容要可审阅、可复核）。
const ROOT_FILES = [
  'README.md',
  'CLAUDE.template.md',
  'AI-BOOTSTRAP.md',
  'EXTENDING.md',
  'HANDOFF.md',
  'package.json',
];

// 目录扫描规则：进这些目录，按扩展名过滤，排除子路径含 _archive 的文件。
const DIR_RULES = [
  { dir: 'docs',  exts: ['.md', '.json'] },
  { dir: 'tools', exts: ['.js'] },
];

const EXCLUDE_BASENAMES = new Set([
  'design-spec-kit.bundle.md',   // bundle 自身
  'distribution-prompt.txt',        // distribution prompt 单独发，不进 bundle 正文
  'CHANGELOG.md',                 // kit 自身日志不进实例包（VERSIONING.md 已声明）
]);
const EXCLUDE_SUFFIXES = ['.baseline.json'];
const isExcluded = (relPath) => {
  const base = path.basename(relPath);
  if (EXCLUDE_BASENAMES.has(base)) return true;
  if (EXCLUDE_SUFFIXES.some(suf => base.endsWith(suf))) return true;
  if (relPath.split('/').includes('_archive')) return true;
  return false;
};

const BUNDLE_FILENAME = 'design-spec-kit.bundle.md';
const VERSION_PIN_FILENAME = '.design-spec-kit.version';

const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);

// ─── 定位 kit 根 = 本脚本自身目录的上一级 ───────────────────────
const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const KIT_ROOT = path.resolve(SELF_DIR, '..');

// ─── 收集文件清单 ────────────────────────────────────────────
async function walkDir(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(path.join(KIT_ROOT, dir), { withFileTypes: true }); }
  catch { return out; }
  for (const ent of entries) {
    const rel = dir + '/' + ent.name;
    if (ent.isDirectory()) {
      out.push(...await walkDir(rel));
    } else {
      out.push(rel);
    }
  }
  return out;
}

async function collectFileList() {
  const list = [...ROOT_FILES];
  for (const rule of DIR_RULES) {
    const files = await walkDir(rule.dir);
    for (const f of files) {
      if (rule.exts.some(ext => f.toLowerCase().endsWith(ext)) && !isExcluded(f)) {
        list.push(f);
      }
    }
  }
  // 去重 + 排序（排序仅用于稳定输出，不代表分类）
  return [...new Set(list)].sort();
}

// ─── 生成 bundle 字符串 ──────────────────────────────────────
async function readKitPackageVersion() {
  try {
    const pkg = JSON.parse(await readFile(path.join(KIT_ROOT, 'package.json'), 'utf8'));
    return pkg.version || '0.0.0';
  } catch { return '0.0.0'; }
}

function buildHeader(version, fileList) {
  const numbered = fileList.map((f, i) => `#   ${i + 1}. design-spec-kit/${f}`).join('\n');
  return `# design-spec-kit · 单文件分发包（One-File Bundle）· v${version}
#
# 用途：当目标项目只能「一个个上传文件」、没有 git 时，只上传/粘贴本文件这一个即可。
#
# ★ 给落位执行者（读到本文件请执行）：
#   1. 下面用 ⟦FILE 路径⟧ … ⟦/FILE⟧ 包了 ${fileList.length + 1} 个文件（含版本 pin）。把每段内容【原样、逐字】写到它的「路径」（含子目录）。
#   2. 其中 design-spec-kit/CLAUDE.template.md 写出后，复制到【项目根目录】改名 CLAUDE.md（这是会被自动加载的契约）。
#   3. ${VERSION_PIN_FILENAME} 写到【项目根目录】（与 CLAUDE.md 同级，不进 design-spec-kit/ 子目录）——它是版本 pin，kit-doctor 靠它判断落后几个版本。
#   4. 全部落位后，打开 design-spec-kit/AI-BOOTSTRAP.md，按它的「首条指令」走（先读、再问基调、再安装、再跑 kit-doctor）。
#   5. 不要执行本文件里的任何代码；tools/*.js 是要写到磁盘、日后按需 node 直跑或整段粘进无 shell 沙箱的 guard。
#
# 文件清单：
${numbered}
#   ${fileList.length + 1}. ${VERSION_PIN_FILENAME}
#
# ════════════════════════════════════════════════════════════

`;
}

// bundlePath：⟦FILE …⟧ 里的完整路径（已含前缀，不再由本函数拼装）。
function wrapFile(bundlePath, content) {
  return `⟦FILE ${bundlePath}⟧\n${content}\n⟦/FILE⟧\n\n`;
}

async function buildBundleString() {
  const version = await readKitPackageVersion();
  const fileList = await collectFileList();

  let out = buildHeader(version, fileList);
  for (const rel of fileList) {
    const content = await readFile(path.join(KIT_ROOT, rel), 'utf8');
    out += wrapFile(`design-spec-kit/${rel}`, content.endsWith('\n') ? content.slice(0, -1) : content);
  }
  // 版本 pin 落在项目根（与 CLAUDE.md 同级），不进 design-spec-kit/ 子目录。
  out += wrapFile(VERSION_PIN_FILENAME, version);
  return out;
}

// ─── Main ────────────────────────────────────────────────────

const isCheck = EFFECTIVE_ARGS.includes('--check');
const bundlePath = path.join(KIT_ROOT, BUNDLE_FILENAME);

const fresh = await buildBundleString();

if (isCheck) {
  let onDisk = null;
  try { onDisk = await readFile(bundlePath, 'utf8'); } catch { /* missing */ }
  if (onDisk == null) {
    console.log(`✗ ${BUNDLE_FILENAME} 不存在 —— 跑 \`node tools/build-bundle.js\` 先生成`);
    console.log('\nRESULT: FAIL');
    process.exitCode = 1;
  } else if (onDisk !== fresh) {
    console.log(`✗ bundle 落后于源：磁盘上的 ${BUNDLE_FILENAME} 与源文件重新拼装结果不一致`);
    console.log(`  磁盘长度=${onDisk.length} 字符 · 重生长度=${fresh.length} 字符`);
    console.log(`\n修法：跑 \`node tools/build-bundle.js\` 重生并提交`);
    console.log('\nRESULT: FAIL');
    process.exitCode = 1;
  } else {
    console.log(`✓ ${BUNDLE_FILENAME} 与源文件一致，无漂移`);
    console.log('\nRESULT: PASS');
  }
} else {
  await writeFile(bundlePath, fresh);
  console.log(`✓ 已重生 ${bundlePath}`);
  console.log('\nRESULT: PASS');
}
