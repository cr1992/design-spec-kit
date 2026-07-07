# Flutter 视觉还原扩展方案

> 状态：v1 已落地。本文记录 `design-spec-kit` 的 Flutter 专用实现栈扩展设计。kit core 继续保持语言无关。

## 目标

`design-spec-kit` 已经把扩展分成两条轴：

- 呈现壳：见 `EXTENDING.md`
- 实现栈：见 `HANDOFF.md` 与 `IMPL-PROFILE`

Flutter 视觉检查属于实现栈轴。它要解决的是设计到真实 App 这一跳的还原漂移，例如：

- manifest 声明了 overlay / tray，但 Flutter 渲染成了错误的 surface 语义。
- 设计要求某个面板 light / dark 都保持暗玻璃，但 App 实现跟随了全局主题。
- 设计声明了交互目标，但 Flutter 没有稳定 runtime anchor，也没有 contract test。

扩展不能知道任何业务名、屏幕名、文案或产品组件。它只校验通用 manifest 声明，并调用项目自己登记的 Flutter 测试命令。

## Bundle 安全

`tools/build-bundle.js` 会把 `docs/` 下的普通 Markdown 文档收进 `design-spec-kit.bundle.md`。因此本文和 extension README 的示例必须保持 business-free：

- 示例路径使用 `apps/<app>`、`docs/design-spec/manifests/<screen>.manifest.generated.json`。
- 示例 anchor 使用中性命名，例如 `sample-action-entry`、`sample-action-panel`。
- 禁止出现采用方产品名、业务屏幕名、真实组件名、真实文案。

本文不通过 bundle 排除来规避泄漏；kit 仓内文档本身应适合分发。

## 非目标

- kit core 不解析 Dart 源码。
- core guard 不引入 Flutter 假设。
- 不做 Flutter 截图与 HTML/CSS 原型的自动像素 diff。
- 不把 blur radius、alpha 这类实现数值手写进 generated manifest，除非它们来自设计生成链。
- 默认锚点不依赖本地化文案或 semantics label。

## 总体形态

新增可选扩展目录：

```text
extensions/flutter-visual/
  check-flutter-visual.js
  README.md
  helpers/flutter_visual_contract.dart
```

项目显式启用：

```json
{
  "kit": {
    "layers": ["base", "handoff", "flutter-visual"]
  },
  "extensions": {
    "flutter-visual": {
      "screens": []
    }
  }
}
```

`flutter-visual` 是 extension 名，不是 core layer。`run-checks.js` 与 `kit-doctor.js` 需要能区分三类名字：

- 已知 core layer
- 已知 extension
- 未知名字，通常是拼写错误

## 扩展发现规则

当前 `run-checks.js` 会把顶层未知 `check-*.js` 当项目自定义 guard 默认执行。这个规则不能沿用到 extension。

必须满足：

1. core guard discovery 仍只扫描 `tools/check-*.js`。
2. extension guard discovery 只扫描 `extensions/<name>/`，且 `<name>` 必须出现在 `kit.layers`。
3. 已知 extension 的真源不能来自目录扫描。复制式接入可能只拷贝 `tools/`，此时必须仍能区分“已知 extension 未安装”和“拼写错误”。
4. `run-checks.js` 与 `kit-doctor.js` 维护同一份 `KNOWN_EXTENSIONS`，类似现有 `LAYER_GUARDS`。
5. 启用了已知 extension 但目录不存在时，输出清晰的 skip / setup 提示；不要让所有复制了 kit 目录但没装 extension 的项目失败。
6. `kit.layers` 里出现未知名字时，`kit-doctor` 报“疑似拼写错误”，并列出已知 core layers 与 known extensions。

示意：

```js
const KNOWN_EXTENSIONS = {
  'flutter-visual': {
    guards: ['check-flutter-visual.js'],
  },
};
```

目录扫描只回答“这个已知 extension 是否已安装”，不负责定义 known extension 集合。这样 optional extension 不会在未 opt-in 的项目里误跑。

## Manifest 增补字段

给 `screen-manifest.schema.json` 增加通用可选字段。

### interactions

`interactions` 描述一个 manifest anchor 会揭示或控制另一个 anchor。

```json
{
  "interactions": [
    {
      "trigger": "sample-action-entry",
      "action": "opens",
      "target": "sample-action-panel"
    }
  ]
}
```

core 校验：

- `trigger` 必须引用已有 `elements[].anchor`。
- `target` 必须引用已有 `elements[].anchor`。
- `action` 用小枚举，第一版建议：`opens`、`closes`、`toggles`、`selects`、`navigates`。

### elements[].contracts

`elements[].contracts` 声明通用视觉 / 交互语义。它不重复 CSS token 派生的数值。

```json
{
  "anchor": "sample-action-panel",
  "contracts": {
    "surface": "dark-glass",
    "themeInvariant": true,
    "motion": {
      "portrait": "slide-up",
      "landscape": "slide-in-right"
    }
  }
}
```

core 校验：

- `surface` 是枚举。第一版建议：`dark-glass`、`light-surface`、`neutral-surface`、`transparent`、`danger-surface`。
- `themeInvariant` 是 boolean。
- `motion.<viewport>` 是枚举。第一版建议：`none`、`fade`、`slide-up`、`slide-down`、`slide-in-left`、`slide-in-right`、`scale`。
- `contracts` 只能挂在 `elements` 已声明的 anchor 上。

不要把 `backdropBlur: 10`、`alpha: 0.55` 作为手写值放进 manifest。项目需要检查数值时，应放在项目自己的 Flutter test helper 或项目配置里，让 token 与实现常量能一起演进。

### 声明与机检覆盖

第一版允许 manifest 声明的语义略宽于 helper 能机检的范围，但 extension README 必须把覆盖边界写清楚，避免绿灯被误读。

| contract | v1 schema 校验 | v1 Flutter helper 机检 |
| --- | --- | --- |
| `surface: "dark-glass"` | 枚举合法，anchor 存在 | 暗玻璃 surface / BackdropFilter / 项目 token 断言 |
| `themeInvariant: true` | boolean 合法 | light / dark 两次 pump 后 surface 语义一致 |
| `motion: "fade"` | 枚举合法 | 有 animated presentation |
| `motion: "slide-up"` / `slide-in-right` 等方向值 | 枚举合法 | v1 只验证有 animated presentation；方向断言留到 v2 |

## Generated Manifest 归属

被 guard 检查的是 `*.manifest.generated.json`。新增 `contracts` 或 `interactions` 后，生成链必须拥有这些字段。

实现前必须确认：

1. 语义源在哪里：设计侧 source manifest、屏内 annotation，或另一个源头。
2. 更新生成器，让 generated manifest 输出 `interactions` 和 `contracts`。
3. 同步更新 `screen-manifest.schema.json` 与 `check-manifest.js`。
4. anchor 或 contract 变化时，屏 manifest version 需要递增。
5. 配了 `sourceManifestDir` 时，source-vs-generated 漂移检查也要覆盖新字段。

禁止手改 generated manifest。它会在下次重生成时被覆盖，也会制造第二真源。

## Flutter Anchor 约定

默认 Flutter runtime anchor：

```dart
ValueKey('<manifest-anchor>')
```

示例：

```dart
ValueKey('sample-action-entry')
ValueKey('sample-action-panel')
```

Flutter extension 默认假设这个约定。项目配置只写例外：

```json
{
  "anchors": {
    "legacy-panel": { "byKey": "legacy-panel-root" }
  }
}
```

不要默认使用 `bySemantics`。Semantics label 是用户可见文案，会随 i18n 改变；anchor 应该跨语言稳定。

## 项目配置示例

```json
{
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

说明：

- 遵守默认 `ValueKey(anchor)` 的 anchor 不需要写进 `anchors`。
- `anchors` 示例只展示真实例外：manifest anchor 是 `legacy-panel`，Flutter 旧 key 是 `legacy-panel-root`。
- `evidence` 是 `testWidgets` 用例名，不是截图文件名。
- extension 不判断业务文案或屏幕内容。
- `command` 必须使用能稳定输出测试名的 reporter，Flutter 项目第一版统一要求 `--reporter expanded`。

## Evidence 语义

Evidence 是测试覆盖，不是图片资产。

第一版把 evidence 定义为 Flutter test name：

- config-only 模式只检查 evidence 已声明。
- `--execute-impl` 运行配置里的命令，并从 Flutter test 输出中核对 evidence test name 是否出现。
- 若测试命令输出里没有任何 evidence / test name 痕迹，guard 必须失败并提示项目改用 `flutter test --reporter expanded`，不能静默通过或产生假阴。

这样不会把 golden PNG 当成唯一证据源。Golden 仍可用于已批准实现基线的回归测试，但它有平台敏感性，不适合作为“视觉契约存在”的唯一证明。

## 执行模式

### 默认模式

`check-flutter-visual.js` 只做配置校验：

- manifest 文件存在且 JSON 可解析。
- screen id 与配置一致。
- interaction trigger / target 都是合法 anchor。
- 带 `contracts` 的 anchor 或 interaction target 有默认 key 约定，或有显式 project mapping。
- 有 visual contract 的 anchor 配了 evidence。
- 有 evidence 的 screen 配了 command。

默认模式不启动 Flutter 进程。

### `--execute-impl`

传入 `--execute-impl` 时：

1. 执行每个 screen 配置的 command。
2. command 非零退出则失败。
3. Flutter test 输出中缺少任一 required evidence test name 则失败。
4. Flutter test 输出不包含可匹配测试名时失败，并提示 `--reporter expanded`。

此模式适合本地 gate 或具备 Flutter 环境的 CI job。不应在没有 Flutter 的项目里静默开启。

## Flutter Helper 边界

`helpers/flutter_visual_contract.dart` 提供项目测试可复制使用的 helper 模板。它不是必须依赖的 API。

第一版 helper 只做稳定断言：

- `expectAnchorVisible`
- `expectDarkGlassSurface`
- `expectThemeInvariant`
- `expectBackdropFilterPresent`
- `expectAnimatedPresentationPresent`

方向类动画断言，例如 `expectSlideInFromBottom`，放到第二版。它们需要 pump 中间帧并读取动画状态，在不同 harness 下更脆。

helper 第一版建议复制到项目测试目录使用，不从 extension 路径直接 import。Dart package analysis 对 submodule 相对路径 import 更脆，复制模板更符合“项目拥有实现断言”的边界。

## 文档归属

正式实现时，应把 extension 机制写进 `HANDOFF.md`，不是 `EXTENDING.md`。

原因：

- `EXTENDING.md` 管 presentation shell，例如 mobile-shell、desktop-shell、web shell。
- Flutter visual 是 implementation-stack adapter。它验证真实 App 的 runtime anchor 和 contract test。

`EXTENDING.md` 保留现有提示即可：实现栈扩展看 `HANDOFF.md` 与 `IMPL-PROFILE`。

## v1 落地清单

### Kit 仓

1. 给 `docs/screen-manifest.schema.json` 增加 `interactions` 与 `elements[].contracts`。
2. 更新 `tools/check-manifest.js` 语义检查：
   - interaction anchor 必须存在。
   - contract enum 必须合法。
   - 配了 source-vs-generated 检查时，覆盖 interactions 和 contracts。
3. 更新 `tools/run-checks.js`：
   - 增加与 `LAYER_GUARDS` 同级的 `KNOWN_EXTENSIONS` 真源。
   - 只发现显式启用且已知的 extension。
   - 已知 extension 目录缺失时 skip 并提示 setup guidance。
   - 未知 extension / layer 在普通模式 warning，在 `--strict` 下非零退出。
   - 将 `--execute-impl` 透传给 extension guard。
4. 更新 `tools/kit-doctor.js`：
   - 使用同一份 `KNOWN_EXTENSIONS` 区分 core layer、known extension、unknown name。
   - extension 目录缺失时报 setup guidance，不当作 core guard 缺失。
   - 对 `runner.checkCommand` 做更强提示：包含 `run-checks` 或已知等价入口才打成功；非空但无法识别等价性时降为 warning，不打绿色通过。
5. 新增 `extensions/flutter-visual/check-flutter-visual.js`。
6. 新增 `extensions/flutter-visual/README.md`：
   - 说明 `--reporter expanded` 要求。
   - 包含“已声明 / 已机检”覆盖表。
   - 说明 helper 第一版复制到项目使用。
7. 新增可选 helper 模板 `extensions/flutter-visual/helpers/flutter_visual_contract.dart`。
8. 更新 `HANDOFF.md`，说明实现栈 extension 模型。
9. 更新 `docs/config.template.json`，给出最小 `flutter-visual` 示例。
10. 更新 `CHANGELOG.md`。
11. 重建 `design-spec-kit.bundle.md`。

### 使用方接入步骤

1. 确认设计 manifest 生成链归属，让需要 contract 的交互目标成为独立 anchor。
2. 在设计侧 source 中加入 contracts 与 interactions，然后重生成 `*.manifest.generated.json`。
3. 按默认 `ValueKey(anchor)` 约定给 Flutter 节点加稳定 key。
4. 对每个有 evidence 的 screen 增加 Flutter design contract test，并使用 `--reporter expanded`。
5. 在 `docs/design-spec/config.json` 配 `extensions.flutter-visual.screens[]`。
6. 在有 Flutter 环境的本地 gate 或 CI job 里运行 `run-checks.js --execute-impl`。

submodule 使用方应在 kit 发布后更新 submodule pin。不要在业务仓里直接改 kit 源码。

## 已定决策

- 未知 extension 名：`kit-doctor` 失败；`run-checks --list` 打 warning；`run-checks --strict` 非零退出。
- evidence 粒度：v1 按 screen 声明，后续再支持 per-anchor evidence。
- helper 引入方式：v1 复制到项目测试目录，不从 extension 路径 import。
- motion 方向：manifest v1 可声明方向语义；helper v1 只机检 animated presentation，方向机检进 v2。

## 成功标准

- 项目能通过配置启用 `flutter-visual`，无需手改 kit core guard 清单。
- 非 Flutter 项目不会误跑该扩展。
- manifest contracts 保持语义化，不复制 token 数值。
- Flutter 测试能证明 light/dark invariant surface 和 animated presentation，不依赖 golden 图片。
- 当设计声明“暗玻璃托盘 + 动画呈现”，但 Flutter 实现成“跟随全局主题的静态面板”时，`--execute-impl` 会让项目 contract test 失败。
