#!/usr/bin/env node
/**
 * coverage glob 语义单测（source-only，不随 bundle 分发；ci-check.js 接入）
 * ------------------------------------------------------------
 * check-manifest.js 是双环境脚本（顶层 await、无 export），无法 import——
 * 从源文件正则抽取 globToRegExp 函数体执行。函数被改名 / 改签名时本测试
 * 会显式崩溃（抽取断言），不会静默跳过。
 *
 * 语义契约（HANDOFF §1.2）：`*` 段内不跨 '/'；段级 `**` 匹配零或多个目录段；
 * 连续 `**` 段折叠；段内 `**` 按 `*` 处理。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(SELF_DIR, '..', '..', 'tools', 'check-manifest.js');

const src = readFileSync(SOURCE, 'utf8');
const m = src.match(/function globToRegExp\(glob\) \{\n([\s\S]*?)\n\}/);
if (!m) { console.log('✗ 无法从 check-manifest.js 抽取 globToRegExp（函数被改名或重构？同步更新本测试）'); console.log('RESULT: FAIL'); process.exit(1); }
const globToRegExp = new Function('glob', m[1]);

// [glob, 候选路径, 应否匹配]
const CASES = [
  // 单星段内语义
  ['pages/*.html', 'pages/a.html', true],
  ['pages/*.html', 'pages/sub/a.html', false],
  ['pages/*.html', 'a.html', false],
  ['tenant-console/*/page-*.jsx', 'tenant-console/robot/page-device-detail.jsx', true],
  ['tenant-console/*/page-*.jsx', 'explorations/x/robot/page-a.jsx', false],
  ['tenant-console/*/page-*.jsx', 'tenant-console/agent/_archive/page-debug.jsx', false],
  // 段级 ** 含零目录段
  ['**/*.html', 'home.html', true],
  ['**/*.html', 'a/b/home.html', true],
  ['a/**/b.html', 'a/b.html', true],
  ['a/**/b.html', 'a/x/y/b.html', true],
  ['a/**/b.html', 'a-b.html', false],
  // 结尾 /**（含自身与任意深度）
  ['pages/**', 'pages', true],
  ['pages/**', 'pages/a.html', true],
  ['pages/**', 'pages/a/b/c.html', true],
  ['pages/**', 'pagesx/a.html', false],
  // 整串 **
  ['**', 'anything/deep/x.y', true],
  ['**', 'x', true],
  // 连续 ** 段折叠（零目录语义不因相邻 globstar 失效）
  ['**/**/x', 'x', true],
  ['**/**/x', 'a/b/x', true],
  ['a/**/**/b', 'a/b', true],
  ['a/**/**/b', 'a/m/n/b', true],
  ['a/**/**', 'a', true],
  ['a/**/**', 'a/deep/file.txt', true],
  // 段内 ** 按 * 处理
  ['pages/page-**.jsx', 'pages/page-home.jsx', true],
  ['pages/page-**.jsx', 'pages/sub/page-home.jsx', false],
  // 字面字符转义
  ['pages/a.b.html', 'pages/aXb.html', false],
  ['pages/(x)*.html', 'pages/(x)1.html', true],
];

let failures = 0;
for (const [glob, candidate, want] of CASES) {
  let got;
  try { got = globToRegExp(glob).test(candidate); }
  catch (e) { failures++; console.log(`✗ ${glob} ⟂ ${candidate}：抛异常 ${e && e.message}`); continue; }
  if (got !== want) {
    failures++;
    console.log(`✗ ${glob} ⟂ ${candidate}：期望 ${want ? '匹配' : '不匹配'}，实际相反`);
  }
}

console.log(`glob-semantics：${CASES.length} 用例 · ${failures} 失败`);
console.log(failures === 0 ? 'RESULT: PASS' : 'RESULT: FAIL');
if (failures > 0) process.exit(1);
