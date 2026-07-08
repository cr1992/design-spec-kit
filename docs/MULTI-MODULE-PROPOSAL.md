# 多模块与业务扩展能力方案

> 状态：proposal，待评审。目标版本 v2.2.0。
> 驱动场景：同一个消费仓里出现第二个设计模块（如「移动端 App」之外再接「Web 控制台」），现有单模块视角的配置结构容纳不下；同时消费仓已有一批自建且已硬化的检查，需要被 kit 编排而不是被替换。

## 动机

kit 目前的配置是单模块命名空间。第一个模块用着刚好，第二个模块进场时以下几处直接挤爆：

- `check-manifest` 只有一个 `manifestDir` / `sourceManifestDir` / `screensListPath`；两个模块的 manifest 只能混目录、靠文件名区分。
- `check-deviation` 只有一个 `ledgerPath`；两个模块的偏离裁决混在一本台账，owner 和裁决语境不同却无法分账。
- 每个 guard 只有一份 baseline；模块 A 的历史债和模块 B 的历史债混在一个文件里，处置口径（冻结 / 清偿）和归属没法分开声明。
- `check-changelog` 只有一个 `changelogPath`，而设计侧 changelog 天然按模块维护。
- 汇总输出不带模块维度，一条 FAIL 看不出属于哪个模块。

另一类需求同样真实：消费仓里已经存在与 kit guard 职责相近、但更贴合项目语义且已接进 commit gate 的自建检查（如项目自己的 token 审计、设计稿 diff 校验）。把它们迁移重写进 kit 是纯风险无收益；kit 应该提供登记契约，让它们进同一个 runner 与汇总，而不是另立第二套入口。

## 目标

1. 一份 `docs/design-spec/config.json` 能声明多个模块，guard 按模块跑、按模块汇报、按模块记 baseline。
2. 项目可以把自建检查登记进 `run-checks.js`，与内置 guard 同一汇总、同一 exit 语义。
3. 实现栈视觉契约执行器泛化：config-only 校验与 evidence runner 与具体框架解耦；新实现栈的接入成本收敛为「一个输出 matcher + 一份 IMPL-PROFILE 示例」，而不是整个新 extension。
4. 设计源 manifest → generated 的同步逻辑上收进 kit，消费仓不必各自手写。

## 非目标

- 不做通用插件框架。本方案按「两个真实消费模块」的需求设计，只保证结构上不堵死第三个，不为假想规模预留机制。
- 不替换消费仓已硬化的自建检查，不要求它们改写成 kit guard。
- 不引入新的运行时依赖；全部保持 node 直跑。

## 方案 1：模块 profile

`config.json` 新增 `modules` 分节；guard 级配置可放在模块内，模块外的顶层配置作为公共缺省：

```json
{
  "kit": { "layers": ["base", "handoff"] },
  "modules": {
    "mobile-app": {
      "layers": ["base", "handoff", "impl-visual"],
      "guards": {
        "check-tokens": { "scanRoots": ["ui-design/apps/<module-a>/pages"] },
        "check-manifest": {
          "manifestDir": "docs/design-spec/manifests/mobile-app",
          "sourceManifestDir": "ui-design/apps/<module-a>/docs/manifests"
        },
        "check-deviation": { "ledgerPath": "docs/design-spec/mobile-app/DEVIATION-LEDGER.md" }
      }
    },
    "web-console": {
      "layers": ["handoff"],
      "guards": {
        "check-manifest": {
          "manifestDir": "docs/design-spec/manifests/web-console",
          "sourceManifestDir": "ui-design/apps/<module-b>/docs/manifests"
        }
      }
    }
  }
}
```

约定：

- 模块可声明自己的 `layers` 子集：不是每个模块都要开全部层（上例 Web 模块只接 handoff，base 层职责由该模块自建检查承担）。
- baseline 路径按模块隔离：`docs/design-spec/baselines/<module>/<guard>.baseline.json`。债分账，处置口径按模块声明。
- **profile resolution 规则**（实现的核心，不是配置糖）：现有 guard 都从全局 `config.guards.<guard>` 读一次、runner 每 guard 只执行一次；多模块下 runner 必须**按模块生成 effective config（模块内配置 ⊕ 顶层公共缺省）后对每个模块重复执行该 guard**。`kit-doctor` 的配置命中探针同样按模块展开。
- **输出双态只允许两态，且以 `modules` 存在与否切换**：
  - 无 `modules` 分节：v2.1 原路径、原输出标签、原 exit 语义，逐字节不变（成功标准见文末）。
  - 有 `modules` 分节：**所有**模块输出一律带前缀（`✓ mobile-app/check-tokens`），哪怕只声明了一个模块——避免将来加第二个模块时同一 guard 的输出标签变形，下游解析脚本跟着漂。
- **baseline 迁移不允许静默重置**：模块化后 guard 在新路径找不到 baseline、但旧全局路径存在同名 baseline 时，必须 FAIL 并给出迁移指令（一次性搬移到 `baselines/<module>/`），不得首跑生成一份空债新 baseline 然后 PASS——那等于把全部历史债静默清零。

## 方案 2：自定义 guard 登记契约

```json
{
  "customGuards": [
    {
      "name": "project-token-audit",
      "command": "bun run style:audit",
      "module": "web-console",
      "layer": "base"
    }
  ]
}
```

契约：

- `run-checks.js` 按声明顺序在内置 guard 之后执行 command，计入同一份汇总与总 exit。
- **判定规则（保守合取，无歧义）**：
  1. `exit code != 0` → **永远 FAIL**，不看输出；
  2. `exit code == 0` 但输出中最后一个非空 `RESULT:` 行是 `FAIL` → FAIL；
  3. `exit code == 0` 且无 `RESULT:` 行 → PASS（纯 exit code 语义）；
  4. 即：`RESULT: PASS` 无法翻案非零退出码，`RESULT: FAIL` 可以否决零退出码。
- **信任边界显式声明**：`command` 是仓内受版本控制的受信任代码，runner 会原样执行它——`customGuards` 不是安全边界，改得动 `config.json` 的人本来就改得动仓里任何脚本。`kit-doctor` 只校验形态（name 不与内置 guard 冲突、command 非空、module/layer 引用存在），不宣称防注入。
- **与老 auto-discovery 机制的关系**：现行为是「不在层清单里的 `tools/check-*.js` 视为项目自定义 guard 默认照跑」（run-checks.js）。该机制只对复制式接入有意义（submodule 接入不许改 kit 目录）。v2.2 起：`customGuards[]` 是唯一推荐入口；auto-discovery 保留但进入弃用窗口（≥2 个 minor），发现文件时打弃用 WARN；同名（去掉 `check-` 前缀与 `customGuards[].name` 撞名）时 FAIL 而不是双跑。
- `module` / `layer` 可选，用于汇总归位与 `--only` 过滤。
- kit 不审计自定义 guard 的内部逻辑，只编排与汇总——职责边界与 runner 声明（`runner.checkCommand`）一致。

## 方案 3：flutter-visual 泛化为 impl-visual

`check-flutter-visual.js` 的 config-only 半（校验 screens 配置、manifest contracts / interactions、anchor 映射）与 Flutter 无关；`--execute-impl` 半（跑 command、匹配 evidence）**并非**与栈无关——它硬要求 `--reporter expanded`、错误提示和 anchor 约定都偏 Flutter。抽出通用 extension `impl-visual` 时按此边界拆：

- **impl-visual 提供的是「通用 evidence runner + 内置 matcher 集合」，不承诺任意栈开箱即用**。第一版内置 matcher：`substring`（默认，现行为）、`regex`、`flutter-expanded`、`playwright-list`；screen 级配 `matcher`，单条 evidence 可带 `match`/`pattern` 覆盖。新栈若无现成 matcher，就是要给 kit 提 matcher——这是显式的扩展点，不是"零新代码"。
- matcher 契约：输入 = command 的合并 stdout/stderr,输出 = 每条 evidence 命中与否;matcher 自己负责剥离该 reporter 的状态符号 / 耗时 / project 前缀等噪声。reporter 前置校验从「硬编码 `--reporter expanded`」改为 matcher 声明的 reporter 要求。
- `flutter-visual` 保留为 `impl-visual` 的注册别名（`kit.layers` 与 `extensions.flutter-visual` 配置路径原样可用，弃用窗口 ≥2 个 minor），Flutter helper 模板与 anchor 约定文档随别名保留。
- Playwright 第一版必须交付：`playwright-list` matcher + 一份 Web 栈 IMPL-PROFILE 示例（runtime anchor = `data-design-id`，command 示例带 `--reporter=list`），而不是只留一句"配置即可"。
- helper 模板按栈提供（`extensions/impl-visual/helpers/flutter/…`），是可复制资产而非运行时依赖。

## 方案 4：manifest-sync 上收

消费仓现有的同步脚本不只是复制文件，它实际定义了一套 **generated projection 政策**：裁剪哪些字段（如 `delegated` 的表示形态）、稳定序列化格式、生成 screens 清单、byte-for-byte 漂移校验。上收即意味着这套政策归 kit 所有，边界必须写死：

- **kit 上收的只有 schema-owned canonicalization**：新增 `tools/manifest-sync.js`，职责 = 按 schema 定义的 projection 规则生成 generated、稳定 JSON 序列化（键序 / 缩进 / 行尾固定）、生成 screens 清单、`--check` 漂移校验。projection 规则打版本号（`manifestSync.generator: "schema-projection-v1"`），generated 文件头部记录 generator 版本；schema 与 projection 的演进由 kit 说了算，走 kit 版本发布。
- **设计源的抽取与业务特化 normalizer 留在消费仓**：设计树长什么样、从哪个目录读语义源、业务侧想做的额外清洗，都不进 kit core。消费仓脚本迁移后删除，Makefile / CI 命令指向 kit 工具。
- 迁移时 generated 文件可能因序列化规则统一出现一次性排序 / 格式 diff——按 generator 版本切换一次性重生成并提交，CHANGELOG 标注。

## 破坏性变更评估

| 项 | 影响 | 缓解 |
|---|---|---|
| config 增加 `modules` / `customGuards` | 无 `modules` 的旧 config 零行为变化（缺省 = 匿名默认模块） | kit-doctor 提示性迁移，不强制；成功标准含旧 config snapshot 零 diff |
| 汇总输出带模块前缀 | 仅 `modules` 存在时生效，且**一经存在全部带前缀**（含单显式模块）；解析输出的外部脚本需适配一次 | 无 `modules` 时输出逐字节不变；`--only` 支持 `<module>/<guard>` 形式，裸 guard 名在多模块下匹配所有模块的该 guard |
| baseline 路径按模块分目录 | 模块化迁移时新路径无 baseline 而旧全局路径有 → 有静默清债风险 | guard 检测到该状态时 FAIL + 输出迁移指令，禁止首跑重建空债 baseline PASS |
| 老 auto-discovery（未知 `tools/check-*.js` 照跑） | 与 `customGuards[]` 可能双跑 / 撞名 | 弃用窗口 ≥2 个 minor，期间发现打 WARN；与 `customGuards[].name` 撞名 FAIL 不双跑 |
| flutter-visual → impl-visual | `kit.layers` 与 `extensions.flutter-visual` 配置路径均为别名保留 | 弃用窗口 ≥2 个 minor，CHANGELOG 标注 |
| `--execute-impl` reporter 校验改由 matcher 声明 | Flutter 消费方无感（flutter-expanded matcher 保留同一要求） | matcher 缺省 = 现行为（substring + expanded 校验） |
| manifest-sync 上收 | 消费仓 Makefile / CI 命令换指向；generated 因序列化统一出现一次性格式 diff | generator 版本号标记；切换时一次性重生成 + 提交，CHANGELOG 标注 |
| 机器可读汇总 | 目前无稳定机读输出契约，多模块后外部依赖会长出来 | v2.2 定义 `--json` 汇总输出并承诺字段稳定，文本汇总不作为解析面 |

## v2.2.0 成功标准

1. **旧 config snapshot 零 diff**：拿 v2.1 消费仓的 config + baseline 原样跑 v2.2 的 run-checks / kit-doctor，输出与 exit code 逐字节一致（CI 加对拍用例）。
2. **多模块输出规则稳定**：`modules` 存在 → 全前缀；不存在 → 无前缀；没有第三态。
3. **custom guard 判定无歧义**：exit 非零永远 FAIL；`RESULT: FAIL` 可否决零退出码；反向不可翻案。
4. **impl-visual 只承诺已定义 matcher 的通用性**：文档不得出现"任意栈无需 kit 代码"表述；Playwright 支持以 `playwright-list` matcher + IMPL-PROFILE 示例落地为准。
5. **manifest-sync 只上收 schema-owned canonicalization**：设计源抽取与业务 normalizer 不进 kit core；projection 带版本号。

## 落地清单（v2.2.0）

1. `run-checks.js` / `kit-doctor.js` 支持 `modules` 分节：按模块生成 effective config、逐模块执行、按模块汇总；旧 config 对拍用例进 kit CI。
2. baseline 读写支持模块子目录 + 旧 baseline 迁移检测（FAIL + 指令，禁静默重置）。
3. `customGuards` 登记契约（保守判定规则 + 信任边界文档）+ doctor 形态校验 + auto-discovery 弃用 WARN 与撞名 FAIL。
4. `impl-visual` 抽取：matcher 集（substring / regex / flutter-expanded / playwright-list）+ `flutter-visual` 双路径别名 + Web 栈 IMPL-PROFILE 示例。
5. `tools/manifest-sync.js` 上收（schema-projection-v1）+ ADOPTION 补「第二个模块怎么接」一节。
6. `--json` 机读汇总契约。
7. bundle 重生 + CHANGELOG + tag `v2.2.0`。
