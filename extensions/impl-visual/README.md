# impl-visual extension

`impl-visual` 是 `design-spec-kit` 的通用实现栈视觉契约执行器（MULTI-MODULE-PROPOSAL 方案 3）。它不解析任何实现语言源码，只读取 manifest 的通用视觉契约、调用项目自己声明的测试 command，并用 **matcher** 从输出核对 evidence。

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
