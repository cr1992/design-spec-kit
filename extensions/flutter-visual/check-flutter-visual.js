#!/usr/bin/env node
/**
 * check-flutter-visual.js · impl-visual 的注册别名壳（弃用窗口 ≥2 个 minor）
 *
 * 通用实现已抽取到 extensions/impl-visual/check-impl-visual.js（MULTI-MODULE-PROPOSAL
 * 方案 3）。本文件只做转发：以 `--as flutter-visual` 运行通用 guard——层名
 * `flutter-visual`、配置路径 `extensions.flutter-visual`、输出与错误文案均与
 * 独立实现时代逐字节一致（flutter-expanded matcher = 原 --reporter expanded 行为）。
 *
 * 新接入请直接用 `impl-visual` 层名与配置块；Flutter helper 模板见
 * extensions/impl-visual/helpers/flutter/。
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const TARGET = path.join(SELF_DIR, '..', 'impl-visual', 'check-impl-visual.js');

const r = spawnSync(process.execPath, [TARGET, '--as', 'flutter-visual', ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env,
});
process.exit(r.status ?? 1);
