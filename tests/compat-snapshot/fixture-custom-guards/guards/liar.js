// fixture 自定义 guard：exit 非零 + RESULT: PASS —— 验证不可翻案（exit != 0 永远 FAIL）
console.log('RESULT: PASS');
process.exit(2);
