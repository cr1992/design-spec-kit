# Design Spec Kit

Design Spec Kit 是一套设计规范与还原交接工具。它不提供视觉风格、组件库或页面外壳；它提供的是项目里需要长期生效的规则：token 真源、组件准入、更新记录、状态覆盖、偏离登记，以及能在本地或 CI 里跑的检查脚本。

适用场景：Web、移动端、桌面端、小程序、原型仓、实现仓。具体视觉、框架和验收执行器由项目自己决定。

## 结构

```
底座
  CLAUDE.template.md / DESIGN-REF / CHANGELOG / guard 1-4
  管 token、组件、更新记录和死码

平台壳
  EXTENDING.md
  约定移动端、桌面端、Web 壳层如何叠加规范

还原交接层
  HANDOFF.md / screen manifest / deviation ledger / guard 6-7
  管设计到实现的状态覆盖、锚点、偏离申报和对账
```

`i18n` 是可选层：项目有运行时国际化机制时启用 guard 5；没有就不装。

## 文件说明

```
design-spec-kit/
├─ README.md
├─ CLAUDE.template.md             # 项目协作契约模板
├─ AI-BOOTSTRAP.md                # 安装引导文本
├─ EXTENDING.md                   # 平台壳接入约定
├─ HANDOFF.md                     # 设计到实现的交接契约
├─ distribution-prompt.txt        # 只发 bundle 时使用的分发提示
├─ design-spec-kit.bundle.md      # 单文件分发包，由工具生成
├─ package.json
├─ docs/
│  ├─ DESIGN-REF.template.md
│  ├─ CHANGELOG.template.md
│  ├─ SCREEN-MANIFEST.template.md
│  ├─ screen-manifest.schema.json
│  ├─ IMPL-PROFILE.template.md
│  ├─ DEVIATION-LEDGER.template.md
│  ├─ DESIGN-RATIONALE.md
│  └─ VERSIONING.md
└─ tools/
   ├─ check-tokens.js
   ├─ check-icons.js
   ├─ check-changelog.js
   ├─ check-orphan-css.js
   ├─ check-i18n.js
   ├─ check-manifest.js
   ├─ check-deviation.js
   ├─ kit-doctor.js
   ├─ run-checks.js
   └─ build-bundle.js
```

## 落地不是单目录复制

这套方法需要设计层和项目层一起接：

- **设计层**：维护 token、图标真源、DESIGN-REF、设计侧 CHANGELOG，先用 base guard 防新增漂移。
- **项目层**：维护 `docs/design-spec/config.json`、baseline、IMPL-PROFILE、manifest、DEVIATION-LEDGER，并把 guard 接到 CI 或 commit gate。
- **kit 源**：只维护通用模板和工具；业务项目通过 submodule/tag/bundle 消费，不直接改 kit 源码。

完整落地顺序、CI 示例和 commit gate 示例见 [`docs/ADOPTION.md`](docs/ADOPTION.md)。

## 使用方式

### 方式一：从独立仓复制

1. 把整个 `design-spec-kit/` 目录复制进目标项目。
2. 将 `CLAUDE.template.md` 复制到项目根目录并改名为 `CLAUDE.md`，替换占位内容。
3. 将需要的 `docs/*.template.md` 复制到项目文档目录，去掉 `.template` 后缀。
4. 保留 `tools/` 整目录，在项目的 `docs/design-spec/config.json` 里配置 `kit.layers`（模板见 `docs/config.template.json`；没有该文件时回退 `run-checks.js` 内默认 `['base']`，kit 源码无需改动）：
   - `["base"]`：默认底座。
   - 加 `"i18n"`：启用国际化检查。
   - 加 `"handoff"`：启用 manifest 与偏离台账检查。
   - 加 `"flutter-visual"`：启用 Flutter 实现栈扩展；需同时保留 `extensions/flutter-visual/`，并配置 `extensions.flutter-visual.screens[]`。
5. 按项目实际目录修改各 guard 顶部的配置区。
6. 跑 `node tools/kit-doctor.js`，确认入口、层配置和 guard 文件都对上。

### 方式二：只发单文件包

发送 `design-spec-kit.bundle.md` 和 `distribution-prompt.txt`。bundle 由 `node tools/build-bundle.js` 生成，源文件更新后必须重新生成。

## 业务仓配置

作为 submodule 接入时，不要修改 `tools/design-spec-kit/` 里的源码。业务仓在自己的根目录维护：

```text
docs/design-spec/config.json
docs/design-spec/baselines/
docs/design-spec/manifests/
docs/design-spec/DEVIATION-LEDGER.md
```

submodule 接入**不建** `.design-spec-kit.version`——版本 pin 就是 submodule 的 gitlink（`git submodule status`），手写文件是会漂的第二真源。`.design-spec-kit.version` 只在复制式接入（纯拷文件、无 gitlink）时才需要。详见 `docs/VERSIONING.md`。

`docs/config.template.json` 是配置模板。`run-checks.js`、`kit-doctor.js` 和各 guard 会优先读取业务仓的 `docs/design-spec/config.json`；没有配置时才回退 kit 源码默认值。

非 npm 项目可以在 `docs/design-spec/config.json` 里声明 runner，`kit-doctor` 会优先识别它：

```json
{
  "runner": {
    "checkCommand": "make design-spec-check"
  }
}
```

## 检查命令

```bash
node tools/kit-doctor.js
node tools/run-checks.js
node tools/build-bundle.js --check
```

`run-checks.js` 会按启用层 / extension（`docs/design-spec/config.json` 的 `kit.layers`，缺省 `['base']`）跑 guard。未启用层的 guard 文件可以留在目录里，会被明确跳过；启用层缺文件会失败。Extension 只有被 `kit.layers` 点名时才会发现；已知 extension 目录缺失时普通模式给 setup 提示，`--strict` 下失败；未知名字由 `kit-doctor` 判为拼写错误。

## CI 与 Commit Gate

本仓自带 GitHub Actions：`.github/workflows/ci.yml`，运行 `node tools/ci-check.js`，覆盖工具语法、source doctor、bundle 漂移检查。

本仓也提供本地 pre-commit hook：

```bash
npm run hooks:install
```

使用方项目建议把 `node tools/design-spec-kit/tools/run-checks.js` 接到自己的 CI / commit gate，并按路径触发；不要在 handoff 资产未齐时全仓硬拦。

## Guard 清单

| guard | 作用 | baseline |
|---|---|---|
| 1 `check-tokens` | 禁裸色值、假 fallback、离档尺寸和内联阴影 | 有 |
| 2 `check-icons` | 检查同名异形、同形重画和图标注册缺失 | 有 |
| 3 `check-changelog` | 检查更新日志结构、长度和索引一致性 | 无 |
| 4 `check-orphan-css` | 检查定义了但没有使用的 CSS class | 有 |
| 5 `check-i18n` | 检查运行时挂载、硬编码文案和死键 | 有 |
| 6 `check-manifest` | 检查生成的 screen manifest 是否过 schema 且语义完整 | 无 |
| 7 `check-deviation` | 检查代码偏离标记、偏离台账和 manifest 引用是否一致 | 无 |
| ext `flutter-visual` | Flutter 实现栈视觉契约配置与 evidence 核对 | 无 |

## 还原交接

启用还原交接层后，每个实现栈需要填一份 `IMPL-PROFILE`，每个屏幕需要生成一份 `*.manifest.generated.json`。guard 只认生成物，不认手写草稿。

如果项目同时保留设计侧语义源 manifest，可在 `check-manifest` 配置 `sourceManifestDir`。启用后 guard 会检查源 manifest 与 generated 的 `version`、`elements[].anchor`、`states.designed`、`states.delegated`、`interactions` 和 `elements[].contracts` 是否一致，防止生成物落后但 schema 仍 PASS。

偏离设计的实现必须登记到 `DEVIATION-LEDGER`。标准状态类（loading、error、empty、offline 等）不算偏离，但必须在 manifest 的状态空间里覆盖。

像素验收分两层：

- 对设计稿：产并排对照证据，供评审判断，不作为自动像素硬闸。
- 对已批准实现基线：可做 screenshot/golden 回归硬闸。

## 维护规则

- `package.json` 的 `version` 是 kit 版本真源。
- 改任何源文件后运行 `node tools/build-bundle.js` 重生 bundle。
- 发布前运行 `node tools/build-bundle.js --check`，确认 bundle 没漂移。
- 实例项目升级、回滚和本地 patch 规则见 `docs/VERSIONING.md`。

## 边界

Design Spec Kit 只管规则、交接和检查。它不规定颜色、字体、组件形态、框架、目录结构或具体测试工具。
