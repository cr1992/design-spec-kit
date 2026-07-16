// 模拟失败的实现核对命令：输出 >40 行后非零退出（截尾 + 失败诊断日志的 snapshot 靶子）
for (let i = 1; i <= 50; i++) console.log(`fake reporter noise line ${i}`);
console.log('Error: expected anchor [data-design-id="sample-panel"] to be visible');
process.exit(1);
