#!/usr/bin/env node
/**
 * design-sync 引擎单测（source-only，不随 bundle 分发）
 * ------------------------------------------------------------
 * 覆盖安全关键路径（确定性，不依赖 git / 外部工具）：
 *   - 内置 ZIP 读取器：良性 zip（store + deflate + 中文名）能正确解出。
 *   - 恶意 zip 一律 fail-closed 且不落任何盘：路径逃逸 `../`、绝对路径、symlink entry。
 *   - exclude / targetOnlyAllow glob 语义。
 *   - 覆盖 / 删除安全门：命中本地改动的覆盖须 --force-overwrite，删除须 --apply-deletes。
 *
 * 测试自己拼 zip 字节（store + zlib.deflateRawSync），保持 hermetic，无需 python / zip CLI。
 *
 * 用法：node tests/design-sync/run.js
 */
import { deflateRawSync } from 'node:zlib';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  matchAny, computeGate, assertSafeEntryName, readZipCentral, extractZipToDir, linkCheck,
} from '../../tools/design-sync.js';

let fail = 0;
function ok(name, cond) {
  if (cond) { console.log(`  ✓ ${name}`); }
  else { console.log(`  ✗ ${name}`); fail++; }
}
async function throwsAsync(fn) {
  try { await fn(); return false; } catch { return true; }
}

// ── 最小 ZIP 写入器（store 或 method 8）——仅测试用 ──
// entry: { name, data:Buffer, method?:0|8, unixSymlink?:bool }
function makeZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8');
    const method = e.method ?? 0;
    const raw = e.data ?? Buffer.alloc(0);
    const comp = method === 8 ? deflateRawSync(raw) : raw;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(method, 8);
    lh.writeUInt32LE(0, 14);              // crc（读取器不校验 crc）
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    const localRec = Buffer.concat([lh, nameBuf, comp]);
    locals.push(localRec);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    // version made by：unix(3) 高字节，便于测 symlink 外部属性
    ch.writeUInt16LE(e.unixSymlink ? (3 << 8) : 0, 4);
    ch.writeUInt16LE(method, 10);
    ch.writeUInt32LE(0, 16);
    ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    const extAttr = e.unixSymlink ? (0xA000 << 16) : 0;
    ch.writeUInt32LE(extAttr >>> 0, 38);
    ch.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([ch, nameBuf]));
    offset += localRec.length;
  }
  const localBlob = Buffer.concat(locals);
  const centralBlob = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBlob.length, 12);
  eocd.writeUInt32LE(localBlob.length, 16);
  return Buffer.concat([localBlob, centralBlob, eocd]);
}

async function main() {
  const work = mkdtempSync(path.join(tmpdir(), 'design-sync-test-'));

  // 1) 良性 zip：store + deflate + 中文名 → 正确解出
  console.log('[zip] 良性解压');
  const benign = makeZip([
    { name: 'hiagent-mobile/project/a.txt', data: Buffer.from('hi', 'utf8'), method: 0 },
    { name: 'hiagent-mobile/project/中文.txt', data: Buffer.from('你好世界', 'utf8'), method: 8 },
    { name: 'hiagent-mobile/project/sub/b.css', data: Buffer.from('body{color:red}', 'utf8'), method: 8 },
  ]);
  const benignZip = path.join(work, 'benign.zip');
  const fs = await import('node:fs/promises');
  await fs.writeFile(benignZip, benign);
  const outDir = path.join(work, 'out');
  await extractZipToDir(benignZip, outDir);
  ok('a.txt 内容正确', existsSync(path.join(outDir, 'hiagent-mobile/project/a.txt')) &&
    readFileSync(path.join(outDir, 'hiagent-mobile/project/a.txt'), 'utf8') === 'hi');
  ok('中文名 + deflate 解压正确',
    readFileSync(path.join(outDir, 'hiagent-mobile/project/中文.txt'), 'utf8') === '你好世界');
  ok('嵌套目录解出', existsSync(path.join(outDir, 'hiagent-mobile/project/sub/b.css')));
  ok('readZipCentral entry 数正确', readZipCentral(benign).length === 3);

  // 2) 恶意 zip：一律抛 + 不落盘
  console.log('[zip] 恶意 fail-closed');
  const cases = [
    { label: '路径逃逸 ../', name: '../evil.txt' },
    { label: '绝对路径', name: '/etc/evil.txt' },
    { label: 'symlink entry', name: 'link', unixSymlink: true, data: Buffer.from('/etc/passwd') },
  ];
  for (const c of cases) {
    const z = makeZip([{ name: c.name, data: c.data ?? Buffer.from('x'), method: 0, unixSymlink: c.unixSymlink }]);
    ok(`${c.label}: readZipCentral 抛`, (() => { try { readZipCentral(z); return false; } catch { return true; } })());
    const malDir = path.join(work, 'mal-' + Math.abs(hash(c.label)));
    const threw = await throwsAsync(() => extractZipToDir(path.join(work, 'x'), malDir)); // 不存在文件也抛
    // 真正验证：写恶意 zip 再解，必须抛且目录空
    const malZip = path.join(work, 'mal.zip');
    await fs.writeFile(malZip, z);
    const threw2 = await throwsAsync(() => extractZipToDir(malZip, malDir));
    const empty = !existsSync(malDir) || readdirSync(malDir).length === 0;
    ok(`${c.label}: extractZipToDir 抛且未落盘`, threw2 && empty);
  }

  // 3) exclude / targetOnlyAllow glob
  console.log('[glob] exclude / targetOnlyAllow');
  ok('.DS_Store 任意深度', matchAny('a/b/.DS_Store', ['.DS_Store']));
  ok('uploads/ 任意深度', matchAny('x/uploads/p.png', ['uploads/']));
  ok('*.standalone.html basename', matchAny('tenant-console/index.standalone.html', ['*.standalone.html']));
  ok('**/*.standalone.html', matchAny('a/b/x.standalone.html', ['**/*.standalone.html']));
  ok('正常源文件不被排除', !matchAny('src/app.tsx', ['.DS_Store', 'uploads/', '*.standalone.html']));

  // 4) 覆盖 / 删除安全门
  console.log('[gate] 覆盖 / 删除');
  const dirty = new Map([['ui-design/apps/x/a.css', ' M']]);
  const g1 = computeGate({ target: 'ui-design/apps/x', changed: ['a.css', 'b.css'], onlyInTarget: ['old.css'] },
    dirty, { applyDeletes: false, forceOverwrite: false });
  ok('脏文件覆盖被挡', g1.overwriteBlocked.length === 1 && g1.overwriteBlocked[0] === 'a.css');
  ok('干净文件放行', g1.allowedChanged.length === 1 && g1.allowedChanged[0] === 'b.css');
  ok('无 --apply-deletes 不删', g1.allowedDeletes.length === 0);
  const g2 = computeGate({ target: 'ui-design/apps/x', changed: ['a.css'], onlyInTarget: ['old.css'] },
    dirty, { applyDeletes: true, forceOverwrite: true });
  ok('--force-overwrite 放行脏覆盖', g2.overwriteBlocked.length === 0 && g2.allowedChanged.length === 1);
  ok('--apply-deletes 放行删除', g2.allowedDeletes.length === 1 && g2.allowedDeletes[0] === 'old.css');

  // 5) assertSafeEntryName 直接单测
  console.log('[safe-name] 直接校验');
  for (const bad of ['../e', '/abs', 'a/../../b', 'C:\\w', 'x\0y']) {
    ok(`拒 ${JSON.stringify(bad)}`, (() => { try { assertSafeEntryName(bad); return false; } catch { return true; } })());
  }
  ok('收 a/b/c.txt', (() => { try { assertSafeEntryName('a/b/c.txt'); return true; } catch { return false; } })());

  // 6) link-check：模板变量只能在运行时解析，不能报成静态断链；真正的静态断链仍要报。
  console.log('[link-check] 模板变量 / 静态断链');
  const dynamicHtml = path.join(work, 'dynamic.html');
  await fs.writeFile(dynamicHtml, '<link rel="stylesheet" href="${f}">');
  const dynamicBroken = await linkCheck('', new Map([['dynamic.html', dynamicHtml]]));
  ok('ES template 路径不报假断链', dynamicBroken.length === 0);

  const handlebarsHtml = path.join(work, 'handlebars.html');
  await fs.writeFile(handlebarsHtml, '<link rel="stylesheet" href="{{ asset }}">');
  const handlebarsBroken = await linkCheck('', new Map([['handlebars.html', handlebarsHtml]]));
  ok('Handlebars 路径不报假断链', handlebarsBroken.length === 0);

  const missingHtml = path.join(work, 'missing.html');
  await fs.writeFile(missingHtml, '<link rel="stylesheet" href="assets/missing.css">');
  const staticBroken = await linkCheck('', new Map([['missing.html', missingHtml]]));
  ok('静态断链仍会报告', staticBroken.length === 1 &&
    staticBroken[0].from === 'missing.html' && staticBroken[0].ref === 'assets/missing.css');

  rmSync(work, { recursive: true, force: true });

  console.log(`\nRESULT: ${fail === 0 ? 'PASS' : 'FAIL'}${fail ? ` (${fail} 项失败)` : ''}`);
  if (fail) process.exitCode = 1;
}
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }

main().catch((e) => { console.error(e); console.log('RESULT: FAIL'); process.exitCode = 1; });
