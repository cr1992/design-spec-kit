#!/usr/bin/env node
/* ============================================================
   check-kit-drift.js · 壳同源 guard（mobile-shell 专属 · 复制式复用才需要）
   ------------------------------------------------------------
   谁需要：把 mobile-shell/ **复制**进项目的使用方——本 guard 对 baseline 校验
   壳副本是否被就地改动（壳的改动应回上游壳仓，避免副本漂移）。
   引用式复用（屏直接 link ../mobile-shell/assets/*、壳与项目同仓）没有副本 → 免跑。

   用法（在项目根跑）：
     node mobile-shell/tools/check-kit-drift.js            # 校验，漂移退出码 1
     node mobile-shell/tools/check-kit-drift.js --update   # 接受现状 / 升级壳后重生 baseline
   AI 无 shell 环境：在 run_script 复刻——readFile 逐文件算 djb2 与 baseline 比对
   （djb2：h=5381; h=((h<<5)+h+charCodeAt)>>>0；十六进制 8 位补零）。
   ============================================================ */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHELL_ROOT = path.resolve(HERE, '..');                 // mobile-shell/
const BASELINE = path.join(HERE, 'kit-drift.baseline.json');
const SKIP = new Set([
  'tools/kit-drift.baseline.json',      // baseline 自身不入账
  'tools/check-shell-purity.js',        // 项目可配置工具（三 knob 各项目自填）→ 属项目层，不算副本漂移
]);

function djb2(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

async function walk(dir, out) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
}

const files = [];
await walk(SHELL_ROOT, files);
const current = {};
for (const f of files.sort()) {
  const rel = path.relative(SHELL_ROOT, f).split(path.sep).join('/');
  if (SKIP.has(rel)) continue;
  const txt = await readFile(f, 'utf8');
  current[rel] = { hash: djb2(txt), len: txt.length };
}

if (process.argv.includes('--update')) {
  await writeFile(BASELINE, JSON.stringify(current, null, 2) + '\n');
  console.log(`baseline 已重生：${Object.keys(current).length} 个文件`);
  console.log('RESULT: PASS');
  process.exit(0);
}

let base;
try { base = JSON.parse(await readFile(BASELINE, 'utf8')); }
catch { console.error('缺 baseline：先跑 --update 生成'); process.exit(1); }

const changed = [], added = [], removed = [];
for (const k of Object.keys(current)) {
  if (!base[k]) added.push(k);
  else if (base[k].hash !== current[k].hash) changed.push(k);
}
for (const k of Object.keys(base)) if (!current[k]) removed.push(k);

if (changed.length + added.length + removed.length === 0) {
  console.log(`壳同源：${Object.keys(current).length} 个文件与 baseline 一致`);
  console.log('RESULT: PASS');
} else {
  for (const k of changed) console.log(`CHANGED  ${k}`);
  for (const k of added)   console.log(`ADDED    ${k}`);
  for (const k of removed) console.log(`REMOVED  ${k}`);
  console.log('壳副本相对 baseline 有漂移：改动应回上游壳仓；确认属壳升级则 --update 重生。');
  console.log('RESULT: FAIL');
  process.exit(1);
}
