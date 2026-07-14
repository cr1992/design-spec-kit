// fixture：模拟 Playwright list reporter 输出（带 ANSI 色码/状态符/序号/project/耗时噪声）
console.log('Running 3 tests using 1 worker');
console.log('\x1b[32m  ✓\x1b[0m  1 [desktop] › sample.spec.ts:5:3 › sample panel › sample panel uses dark glass surface in light and dark (312ms)');
console.log('\x1b[32m  ✓\x1b[0m  2 [desktop] › sample.spec.ts:9:3 › sample panel › sample panel opens with animated presentation (98ms)');
console.log('3 passed (1.2s)');
