#!/usr/bin/env node
/**
 * design-sync.js · 设计 handoff → 消费仓 target 同步引擎（design-spec-kit · 与平台无关）
 *
 * 职责（engine，业务无关）：
 *   - 取源：解压 handoff zip（内置零依赖 ZIP 读取器，中央目录层做安全校验）或直接吃已解出的目录。
 *   - 定位：按 profile 的 sourceProjectSubdir / topNameHints 匹配 module 与 `<top>/project/`。
 *   - 三态对比：changed / onlyInSource / onlyInTarget（扣除 diffExcludes、targetOnlyAllow）。
 *   - _archive 双向提示（report-only，不自动删）。
 *   - 覆盖 / 删除安全门：只比对将被动到的 path 与 `git status --porcelain -- <target>` 交集，
 *     命中本地修改的覆盖须 --force-overwrite，删除须 --apply-deletes。
 *   - 非破坏 apply：默认只增 / 改，不删；写盘边界锁死在 target 子树内。
 *   - postSync 编排：link-check / manifest-sync / manifest-sync-check / design-spec-check / command。
 *   - `--json`：机读报告，供 skill wrapper 解析（不解析人类文本）。
 *
 * 不在职责：业务目录命名、业务后续 SOP、设计稿内容、manifest 路径（manifest-sync.js 自己读 config.json）。
 *
 * 配置：消费仓 `docs/design-spec/design-sync.json`（modules.<name>：target / sourceProjectSubdir /
 *   topNameHints / kind / transferExcludes / diffExcludes / targetOnlyAllow / postSync[]）。
 *
 * 用法（cwd = 消费仓根）：
 *   node <kit>/tools/design-sync.js --zip <handoff.zip> --module <m>            dry-run 默认？否——默认 apply
 *   node <kit>/tools/design-sync.js --zip <handoff.zip> --module <m> --dry-run  只报告不写盘
 *   node <kit>/tools/design-sync.js --module <m> --source <dir>                 吃已解出目录
 *   node <kit>/tools/design-sync.js --module <m> --check-only                   只跑 guard，不同步
 *   附加：--json（机读）--apply-deletes（放行删除）--force-overwrite（放行覆盖本地改动）
 */

import { promises as fs } from 'node:fs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = 'docs/design-spec/design-sync.json';

// ZIP 安全上限（§7.4）——超限即 abort，不落盘。
const ZIP_LIMITS = {
  maxEntries: 20000,
  maxEntryBytes: 128 * 1024 * 1024,
  maxTotalBytes: 512 * 1024 * 1024,
  maxRatio: 200, // uncompressed / compressed
};

const DEFAULT_TRANSFER_EXCLUDES = [
  '.DS_Store', '.design-canvas.state.json', '.thumbnail',
  'uploads/', 'screenshots/', 'tmp/',
];

// ─── CLI ───────────────────────────────────────────────────────
function parseArgs(argv) {
  const flags = {
    zip: null, source: null, module: null,
    dryRun: false, checkOnly: false, json: false,
    applyDeletes: false, forceOverwrite: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--zip') flags.zip = need(argv, ++i, '--zip');
    else if (a === '--source') flags.source = need(argv, ++i, '--source');
    else if (a === '--module') flags.module = need(argv, ++i, '--module');
    else if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--check-only') flags.checkOnly = true;
    else if (a === '--json') flags.json = true;
    else if (a === '--apply-deletes') flags.applyDeletes = true;
    else if (a === '--force-overwrite') flags.forceOverwrite = true;
    else throw new UserError(`未知参数：${a}`);
  }
  return flags;
}
function need(argv, i, name) {
  const v = argv[i];
  if (!v || v.startsWith('--')) throw new UserError(`${name} 需要参数值`);
  return v;
}
class UserError extends Error {}

// ─── glob 排除匹配 ─────────────────────────────────────────────
// 语义（够覆盖 handoff 排除清单）：
//   - 不含 `/` 的 pattern：按 basename glob 匹配（任意深度），如 `.DS_Store` / `*.standalone.html`。
//   - 以 `/` 结尾：目录前缀，如 `uploads/` 匹配 `uploads/**`。
//   - 其余：整相对路径 glob，`**` 跨 `/`，`*` 不跨。
function globToRegExp(glob, { fullPath }) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (fullPath && glob[i + 1] === '*') { re += '.*'; i++; }
      else re += fullPath ? '[^/]*' : '[^/]*';
    } else if ('.+?^${}()|[]\\'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}
function matchOne(relPath, pattern) {
  if (pattern.endsWith('/')) {
    const dir = pattern.slice(0, -1);
    // 无 `/` 的目录 pattern（如 `uploads/`）：任意深度的同名目录都算（对齐 rsync 语义）。
    if (!dir.includes('/')) return relPath.split('/').includes(dir);
    return relPath === dir || relPath.startsWith(pattern);
  }
  if (!pattern.includes('/')) {
    const base = path.basename(relPath);
    return globToRegExp(pattern, { fullPath: false }).test(base);
  }
  return globToRegExp(pattern, { fullPath: true }).test(relPath);
}
export function matchAny(relPath, patterns) {
  return patterns.some((p) => matchOne(relPath, p));
}

// ─── 零依赖 ZIP 读取器（中央目录权威，安全校验前置）──────────────
function u16(buf, o) { return buf.readUInt16LE(o); }
function u32(buf, o) { return buf.readUInt32LE(o); }

function findEOCD(buf) {
  const SIG = 0x06054b50;
  const min = 22;
  if (buf.length < min) throw new UserError('zip 太小，非合法归档');
  const from = Math.max(0, buf.length - (min + 0xffff));
  for (let i = buf.length - min; i >= from; i--) {
    if (u32(buf, i) === SIG) return i;
  }
  throw new UserError('找不到 ZIP End-Of-Central-Directory（损坏或非 zip）');
}

// 解析中央目录，做安全校验，返回可提取的 entry 列表。
export function readZipCentral(buf) {
  const eocd = findEOCD(buf);
  const totalEntries = u16(buf, eocd + 10);
  const cdSize = u32(buf, eocd + 12);
  const cdOffset = u32(buf, eocd + 16);
  if (totalEntries === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
    throw new UserError('检测到 ZIP64 归档，fail-closed（本引擎只处理常规 handoff zip）');
  }

  const entries = [];
  let p = cdOffset;
  let totalUncomp = 0;
  for (let n = 0; n < totalEntries; n++) {
    if (u32(buf, p) !== 0x02014b50) throw new UserError('中央目录记录签名错，zip 损坏');
    const gpFlag = u16(buf, p + 8);
    const method = u16(buf, p + 10);
    const compSize = u32(buf, p + 20);
    const uncompSize = u32(buf, p + 24);
    const nameLen = u16(buf, p + 28);
    const extraLen = u16(buf, p + 30);
    const commentLen = u16(buf, p + 32);
    const versionMadeBy = u16(buf, p + 4);
    const externalAttr = u32(buf, p + 38);
    const localOffset = u32(buf, p + 42);
    const rawName = buf.slice(p + 46, p + 46 + nameLen);
    const name = rawName.toString('utf8'); // handoff 名含中文，一律按 UTF-8 解（ditto 存的就是 UTF-8）

    if (compSize === 0xffffffff || uncompSize === 0xffffffff || localOffset === 0xffffffff) {
      throw new UserError(`ZIP64 尺寸字段（entry ${name}），fail-closed`);
    }
    if (gpFlag & 0x0001) throw new UserError(`加密 entry（${name}），fail-closed`);

    const isDir = name.endsWith('/');
    // symlink：unix (version-made-by 高字节 3) + 外部属性高 16 位为 S_IFLNK(0xA000)
    const unixMode = (externalAttr >>> 16) & 0xffff;
    const madeByUnix = (versionMadeBy >> 8) === 3;
    const isSymlink = madeByUnix && (unixMode & 0xf000) === 0xa000;

    entries.push({
      name, isDir, isSymlink, method, compSize, uncompSize, localOffset,
    });

    if (!isDir) totalUncomp += uncompSize;
    p += 46 + nameLen + extraLen + commentLen;
  }

  // ── 安全校验（§7.4）——任一越界即 abort ──
  if (entries.length > ZIP_LIMITS.maxEntries) {
    throw new UserError(`entry 数 ${entries.length} 超上限 ${ZIP_LIMITS.maxEntries}`);
  }
  if (totalUncomp > ZIP_LIMITS.maxTotalBytes) {
    throw new UserError(`解压总量 ${totalUncomp} 超上限 ${ZIP_LIMITS.maxTotalBytes}（疑似 zip bomb）`);
  }
  for (const e of entries) {
    if (e.isSymlink) throw new UserError(`拒绝 symlink entry：${e.name}（防逃逸）`);
    assertSafeEntryName(e.name);
    if (!e.isDir) {
      if (e.uncompSize > ZIP_LIMITS.maxEntryBytes) {
        throw new UserError(`entry ${e.name} 解压 ${e.uncompSize} 超单文件上限`);
      }
      if (e.compSize > 0 && e.uncompSize / e.compSize > ZIP_LIMITS.maxRatio) {
        throw new UserError(`entry ${e.name} 膨胀比 ${(e.uncompSize / e.compSize).toFixed(0)}x 异常（疑似 zip bomb）`);
      }
    }
  }
  return entries;
}

export function assertSafeEntryName(name) {
  if (name.includes('\0')) throw new UserError(`entry 名含 NUL：${name}`);
  const norm = name.replace(/\\/g, '/');
  if (norm.startsWith('/') || /^[a-zA-Z]:/.test(norm)) {
    throw new UserError(`拒绝绝对路径 entry：${name}`);
  }
  const segs = norm.split('/');
  if (segs.includes('..')) throw new UserError(`拒绝路径逃逸 entry（含 ..）：${name}`);
}

// 提取单个 entry 的字节：从本地头定位数据区，按 method inflate/store。
function extractEntryData(buf, entry) {
  const lo = entry.localOffset;
  if (u32(buf, lo) !== 0x04034b50) throw new UserError(`本地头签名错：${entry.name}`);
  const nameLen = u16(buf, lo + 26);
  const extraLen = u16(buf, lo + 28);
  const dataStart = lo + 30 + nameLen + extraLen;
  const raw = buf.slice(dataStart, dataStart + entry.compSize);
  if (entry.method === 0) return raw; // stored
  if (entry.method === 8) {
    const out = inflateRawSync(raw);
    if (out.length > ZIP_LIMITS.maxEntryBytes) throw new UserError(`entry ${entry.name} 实际解压超上限`);
    return out;
  }
  throw new UserError(`不支持的压缩方法 ${entry.method}（entry ${entry.name}），fail-closed`);
}

export async function extractZipToDir(zipPath, destDir) {
  const buf = await fs.readFile(zipPath);
  const entries = readZipCentral(buf); // 校验在此，越界即抛，未落任何盘
  const destRoot = path.resolve(destDir);
  for (const e of entries) {
    const outPath = path.resolve(destRoot, e.name);
    // 双保险：规范化后仍须在 destRoot 内
    if (outPath !== destRoot && !outPath.startsWith(destRoot + path.sep)) {
      throw new UserError(`entry ${e.name} 规范化后越出解压根，abort`);
    }
    if (e.isDir) { await fs.mkdir(outPath, { recursive: true }); continue; }
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, extractEntryData(buf, e));
  }
  return destRoot;
}

// ─── 目录遍历 ──────────────────────────────────────────────────
async function walkFiles(root, excludes) {
  const out = new Map(); // relPath -> absPath
  async function rec(dir, rel) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); }
    catch { return; }
    for (const ent of entries) {
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isSymbolicLink()) continue; // 不跟随 symlink
      if (ent.isDirectory()) {
        if (matchAny(childRel, excludes)) continue;
        await rec(path.join(dir, ent.name), childRel);
      } else if (ent.isFile()) {
        if (matchAny(childRel, excludes)) continue;
        out.set(childRel, path.join(dir, ent.name));
      }
    }
  }
  await rec(root, '');
  return out;
}

async function filesEqual(a, b) {
  const [ba, bb] = await Promise.all([fs.readFile(a), fs.readFile(b)]);
  return ba.equals(bb);
}

// ─── 三态分类 ──────────────────────────────────────────────────
export async function classify(srcMap, dstMap, { diffExcludes, targetOnlyAllow }) {
  const changed = [], onlyInSource = [], onlyInTarget = [], targetOnlyAllowHits = [];
  for (const [rel, srcAbs] of srcMap) {
    if (matchAny(rel, diffExcludes)) continue;
    const dstAbs = dstMap.get(rel);
    if (!dstAbs) onlyInSource.push(rel);
    else if (!await filesEqual(srcAbs, dstAbs)) changed.push(rel);
  }
  for (const rel of dstMap.keys()) {
    if (srcMap.has(rel)) continue;
    if (matchAny(rel, diffExcludes)) continue;
    if (matchAny(rel, targetOnlyAllow)) { targetOnlyAllowHits.push(rel); continue; }
    onlyInTarget.push(rel);
  }
  return {
    changed: changed.sort(),
    onlyInSource: onlyInSource.sort(),
    onlyInTarget: onlyInTarget.sort(),
    targetOnlyAllowHits: targetOnlyAllowHits.sort(),
  };
}

// ─── _archive 双向提示（report-only）──────────────────────────
export function archiveHints(srcMap, dstMap) {
  const hints = [];
  const stripArchive = (rel) => rel.split('/').filter((s) => s !== '_archive').join('/');
  for (const rel of srcMap.keys()) {
    if (!rel.split('/').includes('_archive')) continue;
    const orig = stripArchive(rel);
    if (orig !== rel && dstMap.has(orig)) hints.push({ kind: 'possible-archived-residue', path: orig, via: rel });
  }
  for (const rel of dstMap.keys()) {
    if (!rel.split('/').includes('_archive')) continue;
    const orig = stripArchive(rel);
    if (orig !== rel && srcMap.has(orig)) hints.push({ kind: 'possible-unarchived-residue', path: rel, via: orig });
  }
  return hints;
}

// ─── git 覆盖 / 删除安全门 ─────────────────────────────────────
function gitDirtyUnder(target) {
  const r = spawnSync('git', ['status', '--porcelain', '--', target], { cwd: process.cwd(), encoding: 'utf8' });
  if (r.status !== 0) return null; // 非 git 环境 / 失败：返回 null，上层降级
  const map = new Map(); // repo-root-relative path -> XY 状态
  for (const line of r.stdout.split('\n')) {
    if (!line.trim()) continue;
    const xy = line.slice(0, 2);
    let p = line.slice(3);
    if (p.includes(' -> ')) p = p.split(' -> ')[1]; // rename
    if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1);
    map.set(p, xy);
  }
  return map;
}

export function computeGate({ target, changed, onlyInTarget }, dirtyMap, { applyDeletes, forceOverwrite }) {
  const toRepoRel = (rel) => path.posix.join(target.split(path.sep).join('/'), rel);
  const overwriteConflicts = [], deleteConflicts = [];
  if (dirtyMap) {
    for (const rel of changed) {
      const xy = dirtyMap.get(toRepoRel(rel));
      if (xy) overwriteConflicts.push({ path: rel, status: xy.trim() || xy });
    }
    for (const rel of onlyInTarget) {
      const xy = dirtyMap.get(toRepoRel(rel));
      if (xy) deleteConflicts.push({ path: rel, status: xy.trim() || xy });
    }
  }
  const overwriteBlocked = forceOverwrite ? [] : overwriteConflicts.map((c) => c.path);
  const allowedChanged = changed.filter((rel) => !overwriteBlocked.includes(rel));
  // 删除：须 --apply-deletes；命中本地修改的删除额外须 --force-overwrite
  const deleteBlockedByDirty = new Set(forceOverwrite ? [] : deleteConflicts.map((c) => c.path));
  const allowedDeletes = applyDeletes ? onlyInTarget.filter((rel) => !deleteBlockedByDirty.has(rel)) : [];
  return {
    gitAvailable: !!dirtyMap,
    overwriteConflicts, deleteConflicts,
    overwriteBlocked, allowedChanged, allowedDeletes,
  };
}

// ─── apply（非破坏；写盘边界锁 target 子树）───────────────────
async function applySync({ srcMap, target, onlyInSource, allowedChanged, allowedDeletes }) {
  const targetRoot = path.resolve(process.cwd(), target);
  const written = [], deleted = [];
  const assertInTarget = (abs) => {
    if (abs !== targetRoot && !abs.startsWith(targetRoot + path.sep)) {
      throw new UserError(`写盘越界（不在 target 子树内）：${abs}`);
    }
  };
  for (const rel of [...onlyInSource, ...allowedChanged].sort()) {
    const srcAbs = srcMap.get(rel);
    const dstAbs = path.resolve(targetRoot, rel);
    assertInTarget(dstAbs);
    await fs.mkdir(path.dirname(dstAbs), { recursive: true });
    await fs.copyFile(srcAbs, dstAbs);
    written.push(rel);
  }
  for (const rel of allowedDeletes) {
    const dstAbs = path.resolve(targetRoot, rel);
    assertInTarget(dstAbs);
    await fs.rm(dstAbs, { force: true });
    deleted.push(rel);
  }
  return { written, deleted };
}

// ─── postSync ──────────────────────────────────────────────────
function runNodeTool(relFromSelf, args) {
  const tool = path.join(SELF_DIR, relFromSelf);
  const r = spawnSync(process.execPath, [tool, ...args], { cwd: process.cwd(), encoding: 'utf8' });
  return { exit: r.status ?? 1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

function runCommand(step) {
  const cmd = step.cmd;
  let file, args;
  if (Array.isArray(cmd)) { file = cmd[0]; args = cmd.slice(1); }
  else { file = process.env.SHELL || '/bin/sh'; args = ['-c', String(cmd)]; }
  const r = spawnSync(file, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, ...(step.env || {}) },
    timeout: step.timeoutMs ?? 300000,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const timedOut = r.error && r.error.code === 'ETIMEDOUT';
  return { exit: timedOut ? 124 : (r.status ?? 1), out: (r.stdout ?? '') + (r.stderr ?? ''), timedOut };
}

// link-check：保守 best-effort——报告断链但不硬闸（解析局限不该拦真实同步）。
export async function linkCheck(target, srcMap) {
  const broken = [];
  const refRe = /(?:href|src)\s*=\s*["']([^"'#?]+)["']|url\(\s*["']?([^"'()?#]+)["']?\s*\)/gi;
  for (const [rel, abs] of srcMap) {
    if (!/\.(html?|css)$/i.test(rel)) continue;
    let text;
    try { text = await fs.readFile(abs, 'utf8'); } catch { continue; }
    let m;
    while ((m = refRe.exec(text))) {
      const raw = (m[1] || m[2] || '').trim();
      if (!raw || /^(https?:|data:|mailto:|tel:|\/\/|#)/i.test(raw)) continue;
      if (raw.startsWith('/')) continue; // 绝对站点路径不判
      // `${f}` / `{{ asset }}` / `<%= asset %>` 只能在模板运行时才能解析；
      // 不能把字面占位符当作同包静态文件，从而制造假断链警告。
      if (raw.includes('${') || raw.includes('{{') || raw.includes('<%')) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(rel), raw));
      if (resolved.startsWith('..')) continue;
      if (!srcMap.has(resolved) && !srcMap.has(resolved.replace(/\/$/, '/index.html'))) {
        broken.push({ from: rel, ref: raw });
      }
    }
  }
  return broken;
}

async function runPostSync(steps, { module, target, srcMap, dryRun }) {
  const results = [];
  for (const step of steps) {
    const label = step.label || step.type;
    if (step.type === 'link-check') {
      const broken = dryRun ? [] : await linkCheck(target, srcMap);
      results.push({ type: 'link-check', label, status: 'PASS', warnings: broken, note: dryRun ? 'dry-run 跳过' : `${broken.length} 断链（warning，不阻断）` });
    } else if (step.type === 'manifest-sync') {
      const r = dryRun ? skipped() : runNodeTool('manifest-sync.js', ['--module', module]);
      results.push(toStep('manifest-sync', label, r, dryRun));
    } else if (step.type === 'manifest-sync-check') {
      const r = dryRun ? skipped() : runNodeTool('manifest-sync.js', ['--check', '--module', module]);
      results.push(toStep('manifest-sync-check', label, r, dryRun));
    } else if (step.type === 'design-spec-check') {
      const r = dryRun ? skipped() : runNodeTool('run-checks.js', []);
      results.push(toStep('design-spec-check', label, r, dryRun));
    } else if (step.type === 'command') {
      const r = dryRun ? skipped() : runCommand(step);
      results.push(toStep('command', label, r, dryRun));
    } else {
      results.push({ type: step.type, label, status: 'FAIL', note: `未知 postSync 类型：${step.type}` });
    }
  }
  return results;
  function skipped() { return { exit: 0, out: '', skipped: true }; }
  function toStep(type, label, r, dry) {
    if (r.skipped) return { type, label, status: 'SKIP', note: 'dry-run 跳过' };
    return { type, label, status: r.exit === 0 ? 'PASS' : 'FAIL', exit: r.exit, output: r.out.trimEnd() };
  }
}

// ─── module 匹配 ───────────────────────────────────────────────
function resolveModule(config, flags, detectedTop) {
  const names = Object.keys(config.modules || {});
  if (names.length === 0) throw new UserError('design-sync.json 未声明任何 module');
  if (flags.module) {
    if (!config.modules[flags.module]) throw new UserError(`--module ${flags.module} 未在 design-sync.json 声明`);
    return flags.module;
  }
  if (detectedTop) {
    for (const name of names) {
      const hints = config.modules[name].topNameHints || [];
      if (hints.some((h) => detectedTop.toLowerCase().includes(String(h).toLowerCase()))) return name;
    }
  }
  if (names.length === 1) return names[0];
  throw new UserError(`无法自动匹配 module（顶名=${detectedTop || 'N/A'}）——用 --module 显式指定`);
}

// 在解出的根下定位 `<top>/<sourceProjectSubdir>/`。
async function locateSource(root, sourceProjectSubdir) {
  const subdir = sourceProjectSubdir || 'project';
  // root 直接就是 project？
  if (await isDir(path.join(root, subdir))) {
    // root/<subdir> 存在 → top 为 root 的 basename
    return { top: path.basename(root), projectDir: path.join(root, subdir) };
  }
  const entries = (await fs.readdir(root, { withFileTypes: true })).filter((e) => e.isDirectory());
  for (const e of entries) {
    const cand = path.join(root, e.name, subdir);
    if (await isDir(cand)) return { top: e.name, projectDir: cand };
  }
  // 兜底：root 自己当 project（--source 直接指到 project 的情形）
  return { top: path.basename(root), projectDir: root };
}
async function isDir(p) { try { return (await fs.stat(p)).isDirectory(); } catch { return false; } }

// ─── 报告 ──────────────────────────────────────────────────────
function printHuman(report) {
  const p = (s) => process.stdout.write(s + '\n');
  p(`design-sync · module=${report.module} · mode=${report.mode}`);
  p('── Source detection ──────────────');
  p(`  top=${report.source.top}  project=${report.source.projectDir}`);
  if (report.mode === 'check-only') {
    p('── Check only（跳过 diff / apply）──');
  } else {
    p('── Diff plan ─────────────────────');
    p(`  changed:      ${report.diff.changed.length}`);
    p(`  onlyInSource: ${report.diff.onlyInSource.length}`);
    p(`  onlyInTarget: ${report.diff.onlyInTarget.length}（residue 候选；targetOnlyAllow 命中 ${report.diff.targetOnlyAllowHits.length} 已扣除）`);
    for (const rel of report.diff.onlyInTarget) p(`      - ${rel}`);
    if (report.diff.archiveHints.length) {
      p('  archive hints:');
      for (const h of report.diff.archiveHints) p(`      · ${h.kind}: ${h.path}`);
    }
    p('── Gate ──────────────────────────');
    if (!report.gate.gitAvailable) p('  (git 不可用，跳过本地改动检测)');
    if (report.gate.overwriteConflicts.length)
      p(`  覆盖命中本地改动 ${report.gate.overwriteConflicts.length}（${report.flags.forceOverwrite ? '已 --force-overwrite 放行' : '未放行→跳过，需 --force-overwrite'}）`);
    for (const c of report.gate.overwriteConflicts) p(`      - [${c.status}] ${c.path}`);
    if (report.gate.deleteConflicts.length)
      p(`  删除命中本地改动 ${report.gate.deleteConflicts.length}`);
    if (report.apply) {
      p('── Apply ─────────────────────────');
      p(`  written: ${report.apply.written.length}  deleted: ${report.apply.deleted.length}`);
    } else {
      p('── Apply ─────────────────────────');
      p('  (dry-run，未写盘)');
    }
  }
  p('── Post sync ─────────────────────');
  for (const s of report.postSync) {
    p(`  [${s.status}] ${s.label}${s.note ? ' · ' + s.note : ''}`);
    if (s.status === 'FAIL' && s.output) {
      for (const line of s.output.split('\n').slice(-8)) p(`      | ${line}`);
    }
  }
  p(`RESULT: ${report.result}`);
}

// ─── main ──────────────────────────────────────────────────────
async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

  let root = null, tmpDir = null;
  if (flags.zip) {
    tmpDir = path.join(process.env.TMPDIR || '/tmp', `design-sync-${process.pid}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
    root = await extractZipToDir(flags.zip, tmpDir);
  } else if (flags.source) {
    root = path.resolve(flags.source);
  } else if (!flags.checkOnly) {
    throw new UserError('需要 --zip <zip> 或 --source <dir>（或 --check-only）');
  }

  // 先定位真顶名（zip 解压根 basename 不是设计顶名），再据顶名 hints 匹配 module。
  let source = { top: null, projectDir: null };
  let moduleName;
  if (root) {
    const probeSubdir = flags.module
      ? (config.modules[flags.module].sourceProjectSubdir || 'project')
      : 'project';
    source = await locateSource(root, probeSubdir);
    moduleName = resolveModule(config, flags, source.top);
    const realSub = config.modules[moduleName].sourceProjectSubdir || 'project';
    if (realSub !== probeSubdir) source = await locateSource(root, realSub);
  } else {
    moduleName = resolveModule(config, flags, null);
  }

  const prof = config.modules[moduleName];
  const target = prof.target;
  if (!target) throw new UserError(`module ${moduleName} 未配置 target`);

  const transferExcludes = prof.transferExcludes || DEFAULT_TRANSFER_EXCLUDES;
  const diffExcludes = prof.diffExcludes || [];
  const targetOnlyAllow = prof.targetOnlyAllow || [];
  const postSyncSteps = prof.postSync || [];

  const mode = flags.checkOnly ? 'check-only' : (flags.dryRun ? 'dry-run' : 'apply');
  const report = { tool: 'design-sync', module: moduleName, mode, flags, source, result: 'PASS' };

  if (!flags.checkOnly) {
    const [srcMap, dstMap] = await Promise.all([
      walkFiles(source.projectDir, transferExcludes),
      walkFiles(path.resolve(process.cwd(), target), transferExcludes),
    ]);
    const diff = await classify(srcMap, dstMap, { diffExcludes, targetOnlyAllow });
    diff.archiveHints = archiveHints(srcMap, dstMap);
    const dirtyMap = gitDirtyUnder(target);
    const gate = computeGate({ target, changed: diff.changed, onlyInTarget: diff.onlyInTarget }, dirtyMap, flags);
    report.diff = diff;
    report.gate = gate;
    report._srcMap = srcMap;

    if (mode === 'apply') {
      report.apply = await applySync({
        srcMap, target,
        onlyInSource: diff.onlyInSource,
        allowedChanged: gate.allowedChanged,
        allowedDeletes: gate.allowedDeletes,
      });
    } else {
      report.apply = null;
    }
    // postSync 只在真正 apply 后跑（dry-run 全 SKIP）
    report.postSync = await runPostSync(postSyncSteps, {
      module: moduleName, target, srcMap, dryRun: mode !== 'apply',
    });
  } else {
    // check-only：不同步，只跑 guard（manifest-sync --check + design-spec-check）
    report.postSync = await runPostSync(
      [{ type: 'manifest-sync-check' }, { type: 'design-spec-check' }],
      { module: moduleName, target, srcMap: new Map(), dryRun: false },
    );
  }

  if (report.postSync.some((s) => s.status === 'FAIL')) report.result = 'FAIL';

  if (tmpDir) await fs.rm(tmpDir, { recursive: true, force: true });

  delete report._srcMap;
  if (flags.json) {
    process.stdout.write(JSON.stringify({ jsonVersion: 1, ...report }) + '\n');
  } else {
    printHuman(report);
  }
  if (report.result === 'FAIL') process.exitCode = 1;
}

// 只有被直接运行才跑 main；被 import（测试）时只导出纯函数。
const invokedDirectly = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (process.argv.includes('--json')) {
      process.stdout.write(JSON.stringify({ jsonVersion: 1, tool: 'design-sync', result: 'FAIL', errors: [msg] }) + '\n');
    } else {
      process.stderr.write(msg + '\n');
      process.stderr.write('RESULT: FAIL\n');
    }
    process.exitCode = 1;
  });
}
