# impl-visual extension

`impl-visual` 是 `design-spec-kit` 的通用实现栈视觉契约执行器（MULTI-MODULE-PROPOSAL 方案 3）。它不理解任何实现语言的语义：核对 evidence 靠调用项目声明的测试 command 并用 **matcher** 从输出匹配；config-only 模式额外把 command 引用的测试源文件当纯文本做 evidence 存在性探测（见「config-only 闭环护栏」），仍不做语言级解析。

`flutter-visual` 是本 extension 的注册别名（弃用窗口 ≥2 个 minor）：层名、`extensions.flutter-visual` 配置路径、输出文案均与独立实现时代一致，缺省 matcher 为 `flutter-expanded`。新接入请直接用 `impl-visual`。

## 启用

```json
{
  "kit": { "layers": ["base", "handoff", "impl-visual"] },
  "extensions": {
    "impl-visual": {
      "screens": [
        {
          "id": "sample-screen",
          "manifest": "docs/design-spec/manifests/sample-screen.manifest.generated.json",
          "command": "npx playwright test tests/design-contract/sample.spec.ts --reporter=list",
          "matcher": "playwright-list",
          "evidence": [
            "sample panel uses dark glass in light and dark",
            { "name": "panel motion", "match": "regex", "pattern": "animated presentation \\(\\d+ms\\)" }
          ]
        }
      ]
    }
  }
}
```

多模块 profile 下可放在 `modules.<m>.extensions.impl-visual`（整块覆盖顶层）。

## Matcher 契约

matcher 输入 = command 的合并 stdout/stderr，输出 = 每条 evidence 命中与否；matcher 自己负责剥离该 reporter 的噪声（ANSI 色码 / 状态符 / 序号 / project 前缀 / 耗时）。**impl-visual 只承诺已定义 matcher 的通用性**——新实现栈若无现成 matcher，就是要给 kit 提 matcher，这是显式扩展点，不是"零新代码"。

| matcher | reporter 前置要求 | 匹配行为 |
| --- | --- | --- |
| `substring`（缺省） | 无 | 原样输出包含 evidence 字符串 |
| `regex` | 无 | `pattern`（缺省取 name）按多行正则匹配原样输出 |
| `flutter-expanded` | command 含 `--reporter expanded` | 原样输出包含 test name（= 原 flutter-visual 行为） |
| `playwright-list` | command 含 `--reporter=list` | 剥 ANSI 色码后按包含匹配（list 行的状态符/序号/耗时不影响） |

声明位置：screen 级 `matcher` 设整屏缺省；单条 evidence 可写成 `{ "name", "match"?, "pattern"? }` 覆盖。

## 执行模式

默认 config-only：校验配置块、manifest 对齐、anchor 映射、interactions 引用、evidence/command 齐备、command 满足 matcher 的 reporter 要求——**不执行实现命令**。

> **默认模式的 PASS 不等于视觉契约已兑现。** 接入方必须给 `--execute-impl` 安排一个真实执行位：本地 DoD 自检清单，或带实现栈运行环境的 CI job。只跑默认模式的项目，「实现是否兑现契约」这一环是空转的。

```bash
node tools/run-checks.js --execute-impl
```

## config-only 闭环护栏（v2.4.0 起）

两道 warning 级护栏（不阻塞，但每次检查可见）+ 两个 fail closed 出口：

- **待登记队列**：manifestDir 下的 `*.manifest.generated.json` 若未在 `screens[]` 登记、也不在 `exempt` 里，逐条挂 warning——设计 sync 带回新屏当下挂账，实现落地补 `command` + `evidence` 销账。manifestDir 解析优先级：`extensions.<name>.manifestDir` > `check-manifest` guard 配置（模块键覆盖顶层）> 默认 `docs/manifests`。**显式配置指向不可读目录 = 配置错误 FAIL**；缺省回退仅 ENOENT（该模块未接 handoff 生成物）静默跳过，ENOTDIR / EACCES 等其余异常同样 FAIL。
- **exempt 豁免**：`extensions.<name>.exempt = [{ "id", "note" }]`，note 必填——**缺 note 按配置错误 FAIL**。条目失效（已登记 / 无对应生成物）挂 warning 提醒清理。
- **evidence 静态核对**（仅 config-only）：从 command 解析源文件（轻量 shell-word lexer：支持单/双引号、`\` 转义与带空格路径，未引号的 `&&`/`;`/`|` 分段，跟踪 `cd`；带字母开头扩展名的词即候选），非 regex 的 evidence name 归一化（剥 `\`、去空白/引号）后须在源码中出现，缺失挂 warning。**command 显式引用的文件不存在也挂 warning**（改名/删除/拼错路径不再静默）；只有解析不出任何文件 token（make target 等）才跳过。动态拼接的用例名为该条改用 `regex` matcher 即可豁免。

## Web 栈（Playwright）IMPL-PROFILE 要点

按 `docs/IMPL-PROFILE.template.md` 填写时，Web 实现栈的关键登记项：

- **runtime anchor 语法**：DOM 上 `data-design-id="<manifest-anchor>"`（偏离现场另加 `data-deviation-id="<DEV-id>"`）。
- **T2 执行器**：Playwright test，command 带 `--reporter=list`，matcher 用 `playwright-list`。
- **evidence**：Playwright 测试用例标题（`test('...')` 的字符串），不是截图文件名。
- 断言测试内部用 `page.locator('[data-design-id="sample-panel"]')` 定位锚点，主题不变性用 `emulateMedia({ colorScheme })` 两次断言。

## Helper 模板

按栈提供的可复制资产（不是运行时依赖）：

- `helpers/flutter/flutter_visual_contract.dart`：Flutter 契约断言模板（expectAnchorVisible / expectDarkGlassSurface / expectThemeInvariantSurface / expectAnimatedPresentationPresent 等）。

复制到项目测试目录后按项目 token / 组件结构调整。
