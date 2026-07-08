# flutter-visual extension

> **别名状态**：`flutter-visual` 现在是通用扩展 `impl-visual` 的注册别名（弃用窗口 ≥2 个 minor）。层名、`extensions.flutter-visual` 配置路径、输出文案原样可用，缺省 matcher 为 `flutter-expanded`（= 原 `--reporter expanded` 行为）；guard 文件是转发壳。新接入请直接用 `impl-visual`，matcher 契约见 [`../impl-visual/README.md`](../impl-visual/README.md)。

`flutter-visual` 是 `design-spec-kit` 的 Flutter 实现栈扩展。它不属于 core layer，不解析 Dart 源码，不知道业务文案或业务组件；只读取 manifest 的通用视觉契约，并调用项目自己声明的 Flutter test command。

## 启用

在项目侧 `docs/design-spec/config.json` 中显式启用：

```json
{
  "kit": {
    "layers": ["base", "handoff", "flutter-visual"]
  },
  "extensions": {
    "flutter-visual": {
      "screens": [
        {
          "id": "sample-screen",
          "manifest": "docs/design-spec/manifests/sample-screen.manifest.generated.json",
          "command": "cd apps/<app> && flutter test test/design_contract/sample_screen_design_contract_test.dart --reporter expanded",
          "anchors": {
            "legacy-panel": { "byKey": "legacy-panel-root" }
          },
          "evidence": [
            "sample action panel uses dark glass in light and dark",
            "sample action panel opens with animated presentation"
          ]
        }
      ]
    }
  }
}
```

默认 runtime anchor 约定：

```dart
ValueKey('<manifest-anchor>')
```

遵守默认约定的 anchor 不需要写入 `anchors`。`anchors` 只用于旧实现例外，并且第一版只接受 `byKey`。不要用 `bySemantics` 作为默认锚点，因为 semantics label 会随 i18n 变化。

## 执行模式

默认模式只做配置检查：

```bash
node tools/run-checks.js
```

默认模式不启动 Flutter，只检查：

- extension 已启用时存在 `extensions.flutter-visual.screens[]`
- manifest 存在、可解析，且 `screen.id` 与配置一致
- manifest 的 `interactions[].trigger` / `target` 引用已有 anchor
- manifest 有 `contracts` / `interactions` 时，screen 声明了 evidence
- evidence 存在时，screen 声明了 command
- command 包含 `--reporter expanded`

> **默认模式的 PASS 不等于视觉契约已兑现。** config-only 只保证配置与 manifest 自洽，evidence 从未在 Flutter 里执行过。接入方必须给 `--execute-impl` 安排一个真实执行位：本地 DoD 自检清单，或带 Flutter 环境的 CI job。只跑默认模式的项目，「实现是否兑现契约」这一环是空转的；汇总输出里的 `config-only` 字样就是这个提醒。

实现核对模式：

```bash
node tools/run-checks.js --execute-impl
```

`--execute-impl` 会运行每个 screen 的 `command`，并从 Flutter test 输出中核对 `evidence` test name。command 必须带 `--reporter expanded`；默认 compact reporter 可能用单行覆写输出，无法可靠匹配测试名。

## Evidence

`evidence` 是 `testWidgets` 用例名，不是截图或 golden PNG。

```json
{
  "evidence": [
    "sample action panel uses dark glass in light and dark",
    "sample action panel opens with animated presentation"
  ]
}
```

如果 `--execute-impl` 输出中没有任何 evidence test name，guard 会失败并提示检查 reporter 配置。Golden 仍可作为项目自己的回归测试资产，但不作为 extension 第一版的唯一证据源。

## 覆盖边界

| contract | v1 schema 校验 | v1 Flutter helper 机检 |
| --- | --- | --- |
| `surface: "dark-glass"` | 枚举合法，anchor 存在 | 暗玻璃 surface / BackdropFilter / 项目 token 断言 |
| `themeInvariant: true` | boolean 合法 | light / dark 两次 pump 后 surface 语义一致 |
| `motion: "fade"` | 枚举合法 | 有 animated presentation |
| `motion: "slide-up"` / `slide-in-right` 等方向值 | 枚举合法 | v1 只验证有 animated presentation；方向断言留到 v2 |

因此，`motion` 方向值第一版是机读声明，不代表 extension 已经验证具体滑入方向。

## Helper 模板

`../impl-visual/helpers/flutter/flutter_visual_contract.dart` 是可复制模板（随通用化迁至 impl-visual），不是稳定 package API。推荐复制到项目测试目录，然后按项目 design token / 组件结构调整 surface 抽取。

第一版 helper 包含：

- `expectAnchorVisible`
- `expectBackdropFilterPresent`
- `expectDarkGlassSurface`
- `expectThemeInvariantSurface`
- `expectAnimatedPresentationPresent`

方向类动画断言不要在第一版硬做。它需要 pump 中间帧并读取动画状态，容易受项目 harness、路由和 transition 实现影响。
