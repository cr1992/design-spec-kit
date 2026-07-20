# design-spec-kit · 单文件分发包（One-File Bundle）· v2.6.1
#
# 用途：当目标项目只能「一个个上传文件」、没有 git 时，只上传/粘贴本文件这一个即可。
#
# ★ 给落位执行者（读到本文件请执行）：
#   1. 下面用 ⟦FILE 路径⟧ … ⟦/FILE⟧ 包了 43 个文件（含版本 pin）。把每段内容【原样、逐字】写到它的「路径」（含子目录）。
#   2. 其中 design-spec-kit/CLAUDE.template.md 写出后，复制到【项目根目录】改名 CLAUDE.md（这是会被自动加载的契约）。
#   3. .design-spec-kit.version 写到【项目根目录】（与 CLAUDE.md 同级，不进 design-spec-kit/ 子目录）——它是版本 pin，kit-doctor 靠它判断落后几个版本。
#   4. 全部落位后，打开 design-spec-kit/AI-BOOTSTRAP.md，按它的「首条指令」走（先读、再问基调、再安装、再跑 kit-doctor）。
#   5. 不要执行本文件里的任何代码；tools/*.js 是要写到磁盘、日后按需 node 直跑或整段粘进无 shell 沙箱的 guard。
#
# 文件清单：
#   1. design-spec-kit/.githooks/pre-commit
#   2. design-spec-kit/AI-BOOTSTRAP.md
#   3. design-spec-kit/CLAUDE.template.md
#   4. design-spec-kit/EXTENDING.md
#   5. design-spec-kit/HANDOFF.md
#   6. design-spec-kit/README.md
#   7. design-spec-kit/docs/ADOPTION.md
#   8. design-spec-kit/docs/CHANGELOG.template.md
#   9. design-spec-kit/docs/DESIGN-RATIONALE.md
#   10. design-spec-kit/docs/DESIGN-REF.template.md
#   11. design-spec-kit/docs/DESIGN-SYNC.md
#   12. design-spec-kit/docs/DEVIATION-LEDGER.template.md
#   13. design-spec-kit/docs/FLUTTER-VISUAL-EXTENSION-PROPOSAL.md
#   14. design-spec-kit/docs/IMPL-PROFILE.template.md
#   15. design-spec-kit/docs/MULTI-MODULE-PROPOSAL.md
#   16. design-spec-kit/docs/SCREEN-MANIFEST.template.md
#   17. design-spec-kit/docs/SHELL-KIT.md
#   18. design-spec-kit/docs/VERSIONING.md
#   19. design-spec-kit/docs/config.template.json
#   20. design-spec-kit/docs/screen-manifest.schema.json
#   21. design-spec-kit/extensions/flutter-visual/README.md
#   22. design-spec-kit/extensions/flutter-visual/check-flutter-visual.js
#   23. design-spec-kit/extensions/impl-visual/README.md
#   24. design-spec-kit/extensions/impl-visual/check-impl-visual.js
#   25. design-spec-kit/extensions/impl-visual/helpers/flutter/flutter_visual_contract.dart
#   26. design-spec-kit/package.json
#   27. design-spec-kit/tools/build-bundle.js
#   28. design-spec-kit/tools/check-changelog.js
#   29. design-spec-kit/tools/check-deviation.js
#   30. design-spec-kit/tools/check-ghost-classes.js
#   31. design-spec-kit/tools/check-i18n.js
#   32. design-spec-kit/tools/check-icons.js
#   33. design-spec-kit/tools/check-manifest.js
#   34. design-spec-kit/tools/check-orphan-css.js
#   35. design-spec-kit/tools/check-tokens.js
#   36. design-spec-kit/tools/ci-check.js
#   37. design-spec-kit/tools/design-sync.js
#   38. design-spec-kit/tools/install-git-hooks.js
#   39. design-spec-kit/tools/kit-doctor.js
#   40. design-spec-kit/tools/kit-registry.js
#   41. design-spec-kit/tools/manifest-sync.js
#   42. design-spec-kit/tools/run-checks.js
#   43. .design-spec-kit.version
#
# ════════════════════════════════════════════════════════════

⟦FILE design-spec-kit/.githooks/pre-commit⟧
#!/bin/sh
set -eu
node tools/ci-check.js
⟦/FILE⟧

⟦FILE design-spec-kit/AI-BOOTSTRAP.md⟧
# 给 AI 的首条指令（粘这一段给接手项目的 Claude）

> 用法：把下面 `===` 之间的整段，连同 `design-spec-kit/` 文件夹一起交给新项目的 Claude（或粘进对方项目的第一条消息）。它会自我引导完成安装 + 立规矩。

===

我给你一套 **design-spec-kit**（在项目里的 `design-spec-kit/` 文件夹）。它是一套**与平台无关的设计纪律 + 还原交接套件**，目的是让这个项目长期**不发生页面漂移、UI 规范能落地、实现还原不跑偏**。请你按下面步骤接管它，做完跟我确认。

**第一步 · 先读不动手**
读这四份，建立认知，先别改任何东西：
- `design-spec-kit/README.md`（这是什么 + 三层结构 + 怎么用）
- `design-spec-kit/CLAUDE.template.md`（契约骨架）
- `design-spec-kit/HANDOFF.md`（还原交接层——本项目**有实现侧还原需求才装**，纯设计项目可跳过）
- `design-spec-kit/docs/DESIGN-REF.template.md`（组件/token 索引骨架）

**第二步 · 跟我对齐基调与范围（提问，别自己定）**
用一轮问题跟我确认：产品一句话定位、技术栈、气质方向、浅色/深色/双模式、字体、主题色、平台与信息密度；**另外确认两件装配决策**：① 要不要装还原交接层（有没有独立的实现侧要对账）；② 项目有没有 i18n 机制（决定 guard⑤ 装不装）。**没对齐前不要建 token、不要画屏。**

**第三步 · 安装套件（落地到项目）**
- `CLAUDE.template.md` 复制到**项目根目录**改名 `CLAUDE.md`，替换所有〈尖括号〉，删掉不装的层的小节。
- `docs/` 模板复制进项目 `docs/` 去后缀（不装还原层就跳过 manifest / ledger / profile 三件）。
- `tools/` **整目录**原样复制进项目 `tools/`；按第二步的装配决策在项目 `docs/design-spec/config.json` 配 `kit.layers`（模板 `docs/config.template.json`；层开关单一真源，run-checks / kit-doctor / 各 guard 同读，没有 config 时回退默认 `['base']`）——聚合入口只跑启用层，未启用层的 guard 文件留着不会被误跑。kit 的 `package.json` scripts（check / doctor）合入项目。
- **逐个打开 guard 顶部「配置」区按本项目改**：扫描目录、尺寸档集、图标源写法、i18n 运行时路径、（还原层）manifest 目录与偏离标记扫描根。

**第四步 · 建设计真源（token 先行）**
建 `tokens.css`：颜色/字号/间距/圆角/阴影**全部定义在这一处**。之后所有组件**只引用 `var(--*)`**。同步在 `docs/DESIGN-REF.md` 登记。

**第五步 · 跑 kit-doctor 验安装**
读 `tools/kit-doctor.js` 全文粘进 run_script 执行（有 shell 就 `node tools/kit-doctor.js`）。它专抓「装了但没适配」：guard 漏装、配置正则在本项目零命中、聚合入口没接、DoD 表与已装 guard 对不上。**doctor 不过 = 安装没完成**，别急着画屏。

**第六步 · 此后每次干活都守这四条纪律**
1. **先 grep 再写**：造任何 UI 元素前先读/grep `docs/DESIGN-REF.md`——命中就抄，没命中再造，造完**立刻登记**。
2. **单一真源 + 生成物重生**：数值只在 `tokens.css`；一切生成物改源必重生、勿手改。
3. **删东西删干净**：删屏/删组件同步删 CSS 与登记；确要保留进 orphan baseline 并写原因。
4. **定档即写 CHANGELOG**：当天段落 append，绝不开第二个同日段。
（装了还原层再加第五条：**屏 done = 屏 + manifest 语义半**；状态空间必须表态，实现偏离必申报。）

**第七步 · 每次 `done` 前跑 DoD guard**
- 有 shell：`node tools/run-checks.js`（串跑全部已装 guard，任一 FAIL 退出码 1）。
- 无 shell（AI 沙箱）：逐个读 guard 全文粘进 run_script 执行，看末行 `RESULT: PASS|FAIL`。
- FAIL 的处理写在各 guard 的输出提示里：修代码，或确需保留则按提示写 baseline 并在 CHANGELOG 注明理由——**绝不静默忽略**。

请先做第一、二步：读完四份文件，然后开始问我基调与装配问题。**不要跳过提问直接安装。**

===
⟦/FILE⟧

⟦FILE design-spec-kit/CLAUDE.template.md⟧
# 〈项目名〉— 项目说明（CLAUDE.md）

> 本文件随 **design-spec-kit** 提供，是**项目说明 + 文档体系 + 工作纪律**的骨架（与平台无关）。
> 复制到新项目根目录后改名为 `CLAUDE.md`，把所有〈尖括号占位〉替换为真实内容，删掉本引言与不适用的小节。
> 标〈还原层〉的小节只在装了还原交接层（HANDOFF.md）时保留。
> CLAUDE.md 必须放在**项目根目录**（会被每个会话自动加载）；其余文档统一收进 `docs/`。

## 产品
**〈产品名〉** 是〈一句话定位：平台 / 关键特性 / 对标对象〉。
技术栈：〈框架 / 语言 / 数据层〉。〈当前阶段说明，如「UI 属新建阶段」〉。

核心场景：
- **〈场景一〉**：〈说明〉。
- **〈场景二〉**：〈说明〉。

## 设计基调（与用户确认后填写）
- 气质：〈如 温润 / 克制 / 锐利 / 活泼〉，一个明确方向。
- 模式：〈浅色 / 深色 / 双模式〉。
- 排版：〈正文字体 + UI 字体 + 语言主次〉。
- 主题色：〈单套 or 多套可切换；每套包含哪些角色色 accent / strong / soft / ink / on-accent〉。
- 平台与密度：〈移动 / 桌面 / 响应式；信息密度高低〉。

## 设计 Token（单一真源）
所有 token 定义在 `〈你的 tokens.css 路径〉`，是**唯一真源**。
- **切勿凭空发明颜色 / 字号 / 间距**，一律引用 `var(--*)`。裸 `#hex` / `rgba()` 由 `check-tokens.js` 拦截。
- 间距 4px 基准（`--sp-*`），圆角 `--r-*`，阴影 `--shadow-*`，字体 `--font-*`。
- 〈若多主题/明暗：中性色随 `data-mode`，强调色随 `data-theme + data-mode`——组件只用 `var(--*)`，换 token 即换肤。〉

## 交付物与文档
- `〈设计规范展示页〉` —— 给人看的展示文档（色板 / 字阶 / 组件总览）。
- `docs/DESIGN-REF.md` —— **AI / 开发速查手册**（机器友好）：token 全表 + 组件目录（类名 + 最小 HTML）。**复用组件前先读它。**
- `docs/CHANGELOG.md` —— 更新日志（按天 + 模块标签）。
- 〈还原层〉`docs/manifests/*.manifest.generated.json` —— 每屏交接清单**生成物**（唯一机读事实源，改源重生、勿手改）；源头载体 = 〈单文件手写 / 屏内结构化注释 + 重生脚本，按项目定〉。
- 〈还原层〉`docs/DEVIATION-LEDGER.md` —— 实现偏离台账（裁决队列）。
- 〈还原层〉`docs/impl-profiles/<stack>.md` —— 各实现栈接入契约（runner / 生成链 / 执行器）。
- 项目文档统一收纳在 `docs/`（CLAUDE.md 因需置于根目录而保留在根）。

## 约定
- 新设计 / 组件一律遵循上述 token 与基调，**保持克制**（少即是多，避免无意义的数字、图标、渐变堆砌）。
- **图标单一源**：所有图标收口于一个图标库〈如 `icons.js` 的 `Icons('name')`〉，**勿在各文件 per-file 重画**——同名多版会漂成不同长相，同形重画会在改字形时集体掉队。新增图标加进库 + 登记 DESIGN-REF。`check-icons.js` 守同名异形与同形重画。
- 〈语言 / 排版细则，如 CJK 正文行高 1.55–1.7。〉
- 〈平台细则，如移动端点击目标下限——按你的平台填。若想机检，把可 grep 的形态约定（按钮圆角档 / 点击目标下限 / 术语黑名单）填进 `check-tokens.js` 的「约定维」配置区。〉

## 工作纪律（来自 design-spec-kit · 换项目仍成立）
- **先 grep 再写**：造任何 UI 元素前先读 `DESIGN-REF.md` / grep 现有 class——命中就抄类名直接用，**别重造已沉淀的组件**。这是防「页面漂移」的第一道闸。
- **按需披露**：`docs/` 索引按任务需要再打开，**不要预读**全部；深细节走对应 doc。
- **单一真源**：数值只在 tokens.css；改源不改副本，两处冲突以 tokens.css 为准。
- **生成物 = 真源 + 重生，不手改副本**：任何从机读真源生成的「副本」（进度表 / 索引 / manifest 生成物 / bundle）——改真源后必须重生，绝不手改副本。`done` 前跑对应 `--check` 漂移闸。
- **克隆兄弟屏 ≠ 合规，真源才是准**：照抄已有屏 / 组件当模板，会连它的 bug 一起继承。下笔前回真源核对，别凭直觉选变体。
- **改老元素先查病史**：动反复调过的元素、或看到「⚠ 意图锚点」注释前，先 `grep '<类名>' docs/CHANGELOG.md` 看它为什么长这样。看着「该统一 / 简化」的显式特例，多半是有意为之的解法——**删特例 ≈ 删某人写下的决策，先问再动**。
- **只改要求的，不擅自扩大范围**：让改 A 就只动 A；觉得 B 也该改时，先问再动。不确定先提问。
- **删东西要删干净**：删屏 / 删组件 / 换方向时，同步删掉对应 CSS / 词典键 / 登记条目；确要保留的进 `check-orphan-css` baseline 并在 DESIGN-REF 写「保留备查 + 原因」。改版残留死码由 guard④ 拦截。

## 〈还原层〉还原交接纪律（装了 HANDOFF 层时保留）
- **屏 done 的定义** = 屏文件 + **manifest 语义半**（元素锚点 + 状态空间声明）。状态空间必须显式二分 `designed / delegated`；delegated 必带 `contract_ref`。**设计可以少画，不可以不表态。**
- **语义锚点稳定**：manifest 登记的 anchor（稳定 class / 命名）是设计↔实现对账主键；改名 = 破坏性变更，记 CHANGELOG + manifest 版本递增。
- **实现偏离必申报**：渲染了 manifest 之外的元素 / 状态形态（平台标准状态类除外）→ 打 `@design-deviation` 注释 + runtime anchor + 台账登记。台账每条只有「收编 / 摘除」两个出口。
- **像素验收两层口径**：对设计稿 = 并排对照证据（人 / AI 判读，非硬闸）；防回归 = 对自己已批准基线的像素断言（可硬闸）。**不得要求「对设计稿自动像素断言」。**

## 单一真源 & 不腐化
- **tokens.css 是 token 唯一真源**；`DESIGN-REF.md` 只做索引与语义，冲突以 tokens.css 为准并立即修正 DESIGN-REF。
- **新组件准入**：组件只有在 `DESIGN-REF.md` 有条目（类名 + 最小 HTML）后才算「可复用」；没登记的视为临时草稿——**这是阻止「同一个东西长出十个样子」的关键纪律。**

## Changelog 维护
- 维护 `docs/CHANGELOG.md`，**按天 + 模块标签**记录（格式 `- [模块] 描述`）。新增模块同步补顶部「模块索引」——索引必须涵盖所有在用标签（guard③ 会查）。
- **定档即写**：仅把已定稿的工作写入当天 changelog；草稿 / 试验不记录。
- **同日合并（硬规则）**：写条目前先 `grep '^## <今天日期>' docs/CHANGELOG.md`，命中就 append 到那段，**绝不新开第二个同日段**。新的一天在文件**顶部**（模块索引下方）开新段——newest-first。
- **深度上限**：一条 = **1 行标题 + 最多 3 子 bullet**。深内容分流到对应 doc 并指路。
- **滚动归档**：主文件只留最近约 2 个会话日；超 ~200 行就把最旧整段移到 `docs/_archive/CHANGELOG-YYYY-MM.md`。

## 收尾同步表（DoD · `done` 前逐行过）
> 核心纪律：**任何影响产物的改动都带一个同步义务**，漏一项 = 漂移。
> 标 🤖 的由 `tools/` 的 guard 机检。跑法双环境：本地 / CI = `node tools/run-checks.js`（或项目登记的 runner 命令）；无 shell 的 AI 沙箱 = 读脚本全文整段粘贴执行，看末行 `RESULT`。

| 改了 | 必做 | 谁来守 |
|---|---|---|
| `tokens.css` 加 / 改 token | 同步 `DESIGN-REF.md` Token 速查表 | 人 |
| 新增 / 改 / 删可复用组件 | 登记 / 更新 `DESIGN-REF.md` 组件目录；**删组件同步删 CSS 或进「保留备查」baseline** | 人 + 🤖 `check-orphan-css.js` |
| 页面 / 脚本里**引用 class**（项目启用 ghost-classes 层时） | 只引用样式真源已定义的类；新变体先定义再用，勿拼不存在的类名 | 🤖 `check-ghost-classes.js` |
| 改了**颜色 / 尺寸**值 | 颜色一律 `var(--*)`；字号 / 间距 / 圆角 / 阴影走 token 档 | 🤖 `check-tokens.js` |
| 新增 / 改**图标** | 加进单一图标库 + 登记 DESIGN-REF；勿 per-file 重画 / 复制字形 | 🤖 `check-icons.js` |
| 新增页面 / 改**用户可见文案**（项目有 i18n 时） | 页面挂 i18n 运行时；文案走词典键，勿硬编码 | 🤖 `check-i18n.js` |
| 改了某**生成物**的真源（进度表 / 索引 / manifest / bundle） | 重生该副本，`done` 前跑 `--check` 漂移闸 | 🤖 / 人 |
| 〈还原层〉加 / 删 / 改屏或屏内状态 | 更新 manifest 语义半 → 重生 `*.manifest.generated.json` | 🤖 `check-manifest.js` |
| 〈还原层〉实现渲染了设计之外的元素 / 形态 | 打 `@design-deviation` + runtime anchor + 台账登记 | 🤖 `check-deviation.js` |
| 装 / 卸 / 重配任何 guard | 跑 `kit-doctor.js`（配置命中数 / 入口接线 / 版本 pin） | 🤖 `kit-doctor.js` |
| 任意定档 | 写当天 `CHANGELOG.md`（先 grep 同日段，命中即 append） | 🤖 `check-changelog.js` |
| 〈接了某平台外壳 / 模块，按需追加行〉 | 〈对应同步义务〉 | 〈人 / guard〉 |
⟦/FILE⟧

⟦FILE design-spec-kit/EXTENDING.md⟧
# 扩展:给底座叠一层「平台壳」（EXTENDING）

> design-spec-kit 是**方法底座**(契约 + DoD + token 纪律),它**不规定你怎么呈现界面**。
> 「壳」= 一层可插拔的呈现方案:移动 App 原型(iPhone 框 + 画布 + iOS chrome + 路由栈)、桌面窗口、Web 多栏……
> 底座对壳一无所知;**壳单向依赖底座**。本文讲一个壳怎么干净地接进来,以及怎么自己造一个新壳。
>
> ⚠ 分清两个扩展轴:**呈现壳**(设计原型长什么外壳)接入看本文件;**实现栈**(Flutter / React / 原生等真实实现怎么对账还原)接入看 [`HANDOFF.md`](HANDOFF.md) + `docs/IMPL-PROFILE.template.md`——两轴正交,互不依赖。
>
> kit 随包 ship 一个 canonical 壳骨架 [`shells/mobile-shell/`](../shells/mobile-shell/)(business-free 移动端),既是参考实现也是可直接接入的组件——分发形态、kit 层 vs 项目层边界、canonical / 拷贝收敛见 [`docs/SHELL-KIT.md`](docs/SHELL-KIT.md)。

---

## 一句话扩展契约
> 一个「壳」= **消费底座的 token 真源 + 自带平台 DoD 行(可选 guard)+ 自带平台 CLAUDE 小节与架构 doc**。
> 装/卸一个壳 = 加/减下面三块。底座永不依赖壳。

## 接入只有三个挂钩点

### ① 共用同一个 token 真源(不复制)
壳里的屏 `link` 的是底座管的那份 `tokens.css` + 组件 CSS,全走 `var(--*)`。换 token 自动换肤。
- **铁律:壳不带自己的颜色。** 壳自带的占位 token 仅供它独立 demo 跑;真接进项目就指向项目的 `tokens.css`。
- 把壳的目录(如 `mobile-shell/`、`pages/`)加进 `tools/check-tokens.js` 的 `SCAN_ROOTS`——**漂移防线自动覆盖到壳**,壳里冒出裸 hex 照样 FAIL。

### ② 往 DoD 表追加平台行 +(可选)平台 guard
`CLAUDE.template.md` 的收尾同步表最后一行是预留扩展位:
```
| 〈接了某平台外壳 / 模块,按需追加行〉 | 〈对应同步义务〉 | 〈人 / guard〉 |
```
比如接移动壳时实化成:

| 改了 | 必做 | 谁来守 |
|---|---|---|
| 加 / 删 / 改屏 | 同步壳的屏清单(如 `PROTO_CONFIG.screens`);必要时更新架构 doc | 人 |
| 改了壳资产(壳 CSS / JS 本身) | 跑壳自带的 `check-shell-purity.js` 守「壳永不指名业务」 | 🤖 |
| 改了外壳机制(路由 / 转场 / 画布) | 跑壳自带的 `check-kit-drift.js` 守外壳同源 | 🤖 |

> `check-shell-purity.js` 是**壳纯度 guard**:壳里出现任何业务名字(模块前缀类 / 业务全局 / 业务词,含注释)即 FAIL,守「壳单向依赖底座、永不反向依赖业务」。模块类名从项目 `design-system/modules/*.css` 自动派生 + 业务词名单机检;ALLOW 白名单(壳唯一可指名的基础层 / 壳层类名)在壳 README 声明。只在**要保持壳 business-free** 时需要。参考实现见 kit 自带的 [`shells/mobile-shell/`](../shells/mobile-shell/)。
> `check-kit-drift.js` 是**壳同源 guard**,只在「复制式复用了壳」的项目里需要。
> ⚠ 两者正交:纯度守「壳不指名业务」(引用式 / 复制式都要)、同源守「复制的壳副本没被就地改」(仅复制式)。若项目是**引用**壳(屏直接 `link ../<壳>/assets/*`、不复制),就**没有副本→没有副本漂移**,`check-kit-drift.js` 自动退役——纯度 guard 与底座的两个 guard 仍照常守。

### ③ 往 CLAUDE.md 补一节平台纪律 + 一份架构 doc
壳把自己的「别自造清单」(如 iOS chrome / `data-nav` / 底部弹层 / 画布外壳都现成)补进 CLAUDE.md 的工作纪律,并把它的架构说明(如 `PROTOTYPE-ARCH.md`)放进 `docs/`。
- 这些平台专属内容**只在装了壳时才出现**,不污染底座。卸壳 = 删这一节 + 删 doc + 删 DoD 平台行。

---

## 多壳并存
一个项目可以同时挂多个壳(如 `mobile-shell/` + `desktop-shell/`):它们**共用同一份 `tokens.css` + `DESIGN-REF.md`**,只是「怎么摆」不同。底座保证它们说的是同一套设计语言,壳只负责各自平台的呈现与导航。

## 造一个新壳的最小清单
1. 壳目录里所有 CSS/组件**只用 `var(--*)`**,自带一份占位 `tokens.css` 仅供独立 demo。
2. 写一份壳 README:它解决什么平台、屏怎么登记、有哪些现成能力(别让人重画),并声明 **ALLOW 白名单**——壳唯一可指名的基础层 / 壳层类名。
3. 若壳要 **business-free**(单向依赖底座、永不指名业务),带一个 `check-shell-purity.js`:模块类名从项目 `design-system/modules/*.css` 自动派生 + 业务词名单机检,壳内冒出任何业务名字即 FAIL;ALLOW 白名单与壳 README 同一份。加新挂钩须同步 ALLOW + README 契约段。参考实现见 kit 自带的 [`shells/mobile-shell/`](../shells/mobile-shell/)。
4. 若是复制式复用,再带一个 `check-kit-drift.js`;引用式不需要。
5. 给出要追加到底座的:DoD 平台行 + CLAUDE.md 平台小节 + 架构 doc。
6. 确认壳目录已进 `check-tokens.js` 的 `SCAN_ROOTS`——纳入漂移防线。

> 核心:壳负责「怎么呈现」,底座负责「不腐化」。两者通过 token 真源 + DoD 表 + CLAUDE 小节这三个挂钩点对接,各自可独立替换。
⟦/FILE⟧

⟦FILE design-spec-kit/HANDOFF.md⟧
# 还原交接契约（HANDOFF）· 设计 → 实现怎么不跑偏

> 底座管「设计侧不腐化」，本文件管「**设计到实现这一跳不漂移**」。
> 与语言 / 框架无关：契约 = 纯数据（manifest / 台账）+ 可 grep 的标记约定；
> 需要跑在具体技术栈上的验收**执行器**，按栈登记在 `IMPL-PROFILE`（一栈一份），kit 永不绑框架。

---

## 0. 根因模型（为什么需要这一层）

设计原型天然只画 happy path。实现面对真实契约（接口 / 协议 / 权限）必须自补加载、失败、降级、离线等状态——这不是「自造轮子」，是职责。漂移发生在三个缺口：

1. **设计不申报状态空间**：哪些状态画了、哪些授权实现自补，无处声明 → 实现只能猜。
2. **实现不申报偏离**：补了什么、改了什么形态，设计侧永远不知道 → 单向积累。
3. **无机读对账**：两边的申报即使存在也只是散落文字，没人能一条命令看出缺口。

对应三个义务：**设计申报状态空间（manifest）、实现申报偏离（deviation 标记 + 台账）、双向机读对账（guard⑥⑦ + T1）**。

---

## 1. SCREEN-MANIFEST：每屏交接清单

### 1.1 两半结构
- **语义半（设计侧手写，一屏一页内）**：元素锚点清单 + 状态空间声明 + 标记。这是设计侧的新交付物——**屏 done = 屏文件 + manifest 语义半**。
- **参数半（机器生成，不手写）**：布局参数由抽取器从渲染后的原型读 computed 值产出（抽取器按栈登记在 IMPL-PROFILE），manifest 只存生成物引用。

### 1.2 normalized 规则（载体自由，生成物统一）
源头怎么维护随项目：可以是单个手写文件，也可以是散在屏文件里的结构化注释 + 索引脚本。但**必须重生为统一机读生成物** `docs/manifests/<screen>.manifest.generated.json`，符合 [`docs/screen-manifest.schema.json`](docs/screen-manifest.schema.json)。guard⑥ 与 T1 **只认生成物**——这是「语言无关」不退化成「每个项目一套解析器」的前提。生成物遵守底座的「真源 + 重生」纪律：改源必重生，勿手改生成物。

如果项目保留了设计侧语义源 manifest（例如 `ui-design/.../docs/manifests/<screen>.manifest.json`），在 `docs/design-spec/config.json` 给 `check-manifest` 配 `sourceManifestDir`。guard⑥ 会把 source 与 generated 的 `version`、锚点和状态集合做双向对账，防止「设计源已变、生成物没重生」的假 PASS。

**设计屏覆盖对账（可选，report-only）**：`screensListPath` 守的是「清单里的屏都有 manifest」，但清单本身是手维护的——设计侧新增屏没人写进清单时，guard 全绿、覆盖面停滞无信号。给 `check-manifest` 配 `coverage`（`{designRoot, screenGlobs, exempt?}`）后，guard⑥ 会扫设计屏源文件与各 generated 的 `screen.source` 集合做差：设计屏尚无 manifest → **warning 不 FAIL**（缺口可见、不硬拦节奏）；确定不需要 manifest 的屏登记 `exempt`（`[{source, note}]`，note 必填，缺 note 按配置错误 FAIL）；exempt 失效（已覆盖 / 源文件已不存在）提醒清理。`coverage` 配置形态错误、`designRoot` 不可读、或任一 `screenGlobs` 条目零匹配 → FAIL（显式配置指向空无 = 接线坏；零匹配静默通过 = 假绿）。glob 语义：`*` 段内不跨 `/`，段级 `**` 匹配零或多个目录段（`**/x` 含根层 x、`a/**/b` 含 a/b、结尾 `/**` 含任意深度）。

### 1.3 状态空间声明（本层的心脏）
每屏的 `states` 必须显式二分：

```yaml
states:
  designed:                                # 设计已画出的状态
    - { id: <state-id>, note: <可选> }
  delegated:                               # 设计授权下游自补（不画但认账）
    - state: <state-id>
      to: impl | backend | firmware | other  # 授权对象：实现自补 / 等后端 / 等设备固件
      contract_ref: <路径#锚点>               # 必填。授权凭据：协议 / 接口 / 规范文档
      status: open | reconciled | dropped
```

- `to: impl` 是本层的新语义：设计明说「这些态我不画，实现按 `contract_ref` 指向的契约自补，落地后回执」。
- `to: backend / firmware` 收编常见的「设计领先下游能力」标记：设计画了、下游还没有——等能力补齐后 `reconciled`。
- **一屏 states 为空 = guard⑥ FAIL**。设计可以少画，不可以不表态。

### 1.4 平台标准状态类（system state classes）
加载 / 空态 / 错误 / 无权限 / 离线 / 保存中 / 高风险确认 / 权限拒绝——这类**平台规范本来就要求覆盖**的状态，不逐屏申报也不算偏离：

- kit 提供 `required_state_classes` 基线清单（上述八类起步），各平台在 IMPL-PROFILE 里增删定稿。
- manifest 默认 `state_classes.inherit: true`：标准态视为已授权（等同 `to: impl`，contract_ref = 平台规范文档），实现覆盖它们**不打 deviation**。
- 某屏确实不适用某标准态 → `state_classes.exempt` 列出并写原因；guard⑥ 检查 exempt 必带 note。
- 反向义务：标准态是「必须覆盖」不是「随便覆盖」——T1 走查与平台 DoD 检查这些态有没有做。

### 1.5 语义锚点（anchor）
manifest 的 `elements[].anchor` 是设计 ↔ 实现的对账主键：来自设计稿的稳定 class / 命名。**锚点改名 = 破坏性变更**：记 CHANGELOG + manifest `version` 递增。

---

## 2. 声明式偏离：标记 + 台账 + runtime anchor

**封闭世界 + 一个逃生口**：实现渲染的元素与状态，要么在 manifest（designed / delegated / 标准状态类）里，要么带偏离申报。申报由三件东西构成，各司其职：

| 件 | 形态 | 作用 |
|---|---|---|
| **runtime anchor（事实源）** | 渲染树上可见的稳定标识：DOM = `data-design-id="<anchor>"` / `data-deviation-id="<DEV-id>"`；widget 树 = 稳定 key / 语义标识（具体语法按 IMPL-PROFILE 登记） | T1 结构对账靠它——**渲染树看不到源码注释**，只有 runtime anchor 能支撑「反向多出必有申报」的机械判定 |
| **源码注释（审计索引）** | `@design-deviation(id: DEV-xx, kind: extra-element\|state-form\|copy\|debug, basis: <依据引用>)`，任何语言可写可 grep | 让 grep / code review 能定位偏离现场；**不是 T1 的事实源** |
| **DEVIATION-LEDGER（裁决队列）** | `docs/DEVIATION-LEDGER.md` 一行一条 | 生命周期管理：`open → 收编`（设计更新、摘标）或 `open → 摘除`（实现回退）。**只有两个出口，不许长期挂账** |

guard⑦ 做机读对账，产缺口清单：代码标记 ↔ 台账**双向互查**（有标记无台账 = 未申报；台账 open 无标记 = 幽灵条目；已收编/摘除但标记还在 = 该摘标）+ 台账屏引用必须存在对应 manifest + delegated 待裁决队列摘要（open / TBD 计数，WARN 性质）。边界说明：「delegated 落地了却无回执」需要 T1 渲染树对账才能机判，不在 guard⑦ 范围。

---

## 3. 三级验收接口（语义在 kit，执行器在栈）

| 级 | 语义（通用） | 闸的性质 |
|---|---|---|
| **T1 结构对账** | manifest 元素 ⊆ 渲染树（按 runtime anchor 匹配）；反向：渲染树多出的锚点必须有 deviation 申报或属标准状态类 | 可硬闸（有 manifest 才能跑） |
| **T2 参数断言** | token 派生值断档位；bespoke 值断字面量；生成链产物 `--check` 防漂 | 可硬闸 |
| **T3 像素**（两层，勿混） | **(a) prototype-compare 证据层**：实现 vs 原型同视口并排对照图，供人 / AI 读图判偏差——**跨渲染管线（不同字体栅格 / 抗锯齿）不存在「对设计稿自动像素断言」这种验收，硬断言会永远红**；产证据、贴进任务记录，非硬闸。**(b) approved-baseline 回归层**：实现对**自己上次人工批准的截图**做像素断言（golden / screenshot 基线），锁住已验收成果防回归——可硬闸，且基线由登记的权威平台生成（跨机渲染有差异，别拿本地截图当基线） | (a) 非硬闸 (b) 可硬闸 |

把「像素级还原」写进任何验收时，必须按 (a)+(b) 两层口径表述，不得要求「对设计稿自动 diff 报红」。

### 3.1 实现栈 extension

当某类验收必须进入具体技术栈时，用 `extensions/<name>/` 承载，不把框架假设写进 core guard。

- 已知 extension 名由 `tools/kit-registry.js` 维护；`run-checks.js` / `kit-doctor.js` 同读该真源。
- extension 只有在项目 `docs/design-spec/config.json` 的 `kit.layers` 里点名时才会被发现。
- extension 目录缺失时普通模式给 setup guidance，不把所有复制式接入项目打红；`run-checks --strict` 下已启用但目录缺失会 FAIL。未知名字视为拼写错误，由 `kit-doctor` FAIL，`run-checks --strict` FAIL。
- extension 的命令必须由项目配置声明，kit 不写死 Flutter / iOS / Android / Web 的运行方式。

第一版内置 `flutter-visual`，用于把 manifest 的 `interactions` / `elements[].contracts` 与 Flutter widget test evidence 对起来。它默认只做 config-only 检查；带 `--execute-impl` 才运行项目声明的 Flutter test command。

config-only 模式自带两道闭环护栏（v2.4.0 起，warning 级、非 FAIL）：

- **待登记队列**：manifestDir（extension 自己的 `manifestDir` > `check-manifest` guard 配置 > 默认）下的 `*.manifest.generated.json` 若未在 `screens[]` 登记，逐条挂 warning——设计 sync 带回新屏的当下就挂账，实现落地补 `command` + `evidence` 销账；有意不做实现核对的屏加 `extensions.<name>.exempt`（`[{id, note}]`，note 必填，缺 note 按配置错误 FAIL）。exempt 条目失效（已登记 / 无对应生成物）同样提醒清理。
- **evidence 静态核对**：从 `command` 解析出实际存在的源文件（跟踪 `cd` 前缀），非 regex 的 evidence name 归一化后必须能在源文件里找到——测试改名断链不用等 `--execute-impl` 才暴露。command 里显式引用的文件不存在挂 warning（引号/空格路径经 shell-word lexer 正确识别），只有解析不出任何文件 token（如 make target）才静默跳过；动态拼接的用例名为该条改用 regex matcher 即可豁免。

---

## 4. 流程闭环

- **sync 后走查**：设计稿每次同步进实现仓后跑一轮——先 fast-path（guard⑦ 缺口清单 + guard⑥）再按屏走 checklist（结构 → 状态 → 参数 → 像素证据）。走查产出的偏离进台账。
- **裁决节奏**：台账定期过（随迭代评审即可），每条向两个出口之一收敛；`contract_ref: TBD` 的 delegated 是显式的「待裁决」信号。
- **回流**：`收编` = 设计侧按台账更新原型 + manifest，实现摘标——偏离信息由此流回设计，打破单向漂移。

## 5. 接入一个新实现栈的最小清单

1. 复制 [`docs/IMPL-PROFILE.template.md`](docs/IMPL-PROFILE.template.md) 填一份：runner（node / bun / make…，命令怎么调）、生成链、deviation 标记与 runtime anchor 语法、T1/T2/T3 执行器与 CI 挂点、抽取器。
2. 实现缺的执行器（通常 T1 是新写的，T2/T3 多半已有雏形可挂）。
3. 往项目 `CLAUDE.md` 的收尾同步表追加还原层 DoD 行（模板里有现成行）。
4. 跑 `kit-doctor` 确认接线完整。

> 装卸本层 = 加/减：CLAUDE 还原小节 + DoD 行 + guard⑥⑦ + manifest/ledger/profile 三件文档。与壳层一样，底座对本层一无所知。
⟦/FILE⟧

⟦FILE design-spec-kit/README.md⟧
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
`ghost-classes` 是可选层：使用面（HTML / JS / JSX）引用的 class 必须在样式真源有定义，拦「类名拼错 / 引用不存在的变体 → 样式静默回落」的走样源头；与 `check-orphan-css` 互为镜像。

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
   ├─ check-ghost-classes.js
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
   - 加 `"ghost-classes"`：启用幽灵类对账（引用了但样式真源没定义的 class）。
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

`run-checks.js` 会按启用层 / extension（`docs/design-spec/config.json` 的 `kit.layers`，缺省 `['base']`）跑 guard。汇总行带各 baseline 账本余额（`· baseline N`，来自账本文件 `totalEntries`——PASS ≠ 没债，「冻结存量只拦新增」的债务要有仪表盘）与 guard 挂账（`· warnings N`，解析 guard 的 `WARNINGS: n` 机器行），并在末尾给合计 `Σ` 行；`--json` 输出对应 `guards[].baseline` / `guards[].warnings` / `totals` 字段（additive，`jsonVersion` 不变）。未启用层的 guard 文件可以留在目录里，会被明确跳过；启用层缺文件会失败。Extension 只有被 `kit.layers` 点名时才会发现；已知 extension 目录缺失时普通模式给 setup 提示，`--strict` 下失败；未知名字由 `kit-doctor` 判为拼写错误。

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
| 6 `check-manifest` | 检查生成的 screen manifest 是否过 schema 且语义完整；可选 `coverage` 对账设计屏覆盖缺口（warning 不 FAIL） | 无 |
| 7 `check-deviation` | 检查代码偏离标记、偏离台账和 manifest 引用是否一致 | 无 |
| 8 `check-ghost-classes` | 检查使用面引用了但样式真源没定义的 class（幽灵类） | 有 |
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

消费仓在设计纪律 / 还原交接上遇到 guard 能力缺口时，通用规则应回流 kit 演进（新 guard 维度、新配置项、新 matcher），项目特化走消费仓 `config.json`（`customGuards` / 各 guard 配置）——不要在消费仓里另写平行检查脚本，那会让同类规则出现第二真源。kit 的多模块、design-sync、待登记队列、coverage 对账都来自消费仓摩擦回流。
⟦/FILE⟧

⟦FILE design-spec-kit/docs/ADOPTION.md⟧
# 落地指南（ADOPTION）

Design Spec Kit 不是“拷一个目录就自动生效”。完整落地分三层：kit 源、设计层、项目实现层。

## 1. 三个责任面

| 层 | 放什么 | 谁维护 | 典型文件 |
|---|---|---|---|
| kit 源 | 通用方法、模板、guard、bundle、CI | kit 仓 | `tools/*.js`、`docs/*.template.md`、`HANDOFF.md` |
| 设计层 | 设计 token、图标真源、设计规范索引、设计侧 changelog | 设计/原型仓或业务仓内设计目录 | `tokens.css`、`icons.js`、`DESIGN-REF.md`、`CHANGELOG.md` |
| 项目实现层 | 项目配置、baseline、实现栈 profile、manifest、偏离台账、CI/commit gate 接线 | 业务项目 | `docs/design-spec/config.json`、`baselines/`、`IMPL-PROFILE`、`DEVIATION-LEDGER.md` |

原则：kit 源不要在业务项目里改；业务项目只维护自己的配置和账本。

## 2. 推荐接入形态

### 内部项目：submodule pin

```text
tools/design-spec-kit/        # submodule，指向内部 Git 仓；gitlink 即版本 pin（见 VERSIONING.md）
docs/design-spec/config.json  # 项目侧配置
docs/design-spec/baselines/   # 当前历史债 baseline
docs/design-spec/manifests/   # handoff 生成物
```

初始化：

```bash
git submodule add <internal-git-url> tools/design-spec-kit
git -C tools/design-spec-kit checkout <tag>
cp tools/design-spec-kit/docs/config.template.json docs/design-spec/config.json
node tools/design-spec-kit/tools/kit-doctor.js
```

Submodule 在消费仓 CI 里有两个高频坑，接入时就处理掉：

- **URL 写相对路径**。`.gitmodules` 里的绝对 ssh URL（`git@host:group/kit.git`）在 CI 的 job-token http clone 下拉不动；同实例托管时写 `../design-spec-kit.git` 这类相对 URL，本地 ssh 与 CI http 都能解析。
- **job token 允许列表**。GitLab 16+ 默认限制跨项目 job token：需要在 **kit 项目**的 Settings → CI/CD → Job token permissions 里把消费仓加入允许列表，否则 CI 拉 submodule 403。这一步只能由 kit 项目的 Maintainer 在 UI/API 操作，不是消费仓侧配置。

### 无 git / 外部分发：bundle

发送 `design-spec-kit.bundle.md` 与 `distribution-prompt.txt`。bundle 是生成物，源仓改动后必须重新生成。

## 3. 启用顺序

### Phase 1：base 层

目标：先防新增设计债。

启用：

```json
{
  "kit": { "layers": ["base"] }
}
```

需要配置：

- `check-tokens.scanRoots`
- `check-icons.scanRoots` / `registrySources`
- `check-orphan-css.cssRoots` / `usageRoots`
- `check-changelog.changelogPath`

首次运行会生成 baseline。baseline 表示“当前历史债先记账”，后续只拦新增。

**baseline 不是“干净”，是“有账本的债”**——每份 baseline 必须有明确的处置口径，写在项目侧 `docs/design-spec/README.md`（或等价入口），二选一：

- `冻结不清`：说明理由（如原型侧历史产物、重写在即）；
- `排队清偿`：写清 owner 和收敛节奏（按屏 / 按迭代）。

没有处置声明的 baseline 会退化成永久豁免池，几百条违规挂在账上无人认领。

### Phase 2：i18n 层

项目已经有运行时 i18n 和词典后再启用：

```json
{ "kit": { "layers": ["base", "i18n"] } }
```

需要配置：`pageRoots`、`codeRoots`、`runtimeHints`、`dictPaths`、`wrapperNames`。

### Phase 2b：ghost-classes 层（可选，随时可加）

拦「使用面引用了但样式真源没定义的 class」——类名拼错 / 引用不存在的变体时样式静默回落基底，设计稿呈现即错、实现照抄错样。与 `check-orphan-css` 互为镜像（orphan = 定义了没人用；ghost = 用了没人定义），无前置依赖，设计侧样式真源稳定后即可启用：

```json
{ "kit": { "layers": ["base", "ghost-classes"] } }
```

需要配置：`check-ghost-classes.cssRoots` / `usageRoots`。首跑固化 baseline（存量幽灵类 / 纯 JS 锚点类记账），之后只拦新增。

### Phase 3：handoff 层

目标：让设计和实现可对账。

启用前必须具备：

- 每屏 `*.manifest.generated.json`
- `screen-manifest.schema.json`
- 每个实现栈的 `IMPL-PROFILE`
- 实现侧 runtime anchor 规则
- `DEVIATION-LEDGER.md`

启用：

```json
{ "kit": { "layers": ["base", "handoff"] } }
```

## 3.5 第二个模块怎么接（多模块 profile）

第一个模块用单模块 config 即可；第二个设计模块进场时切到 `modules` 分节（详细规则见 `MULTI-MODULE-PROPOSAL.md`）：

```json
{
  "kit": { "layers": ["base"] },
  "guards": { "check-changelog": { "changelogPath": "docs/design-spec/CHANGELOG.md" } },
  "modules": {
    "mobile-app": {
      "guards": { "check-tokens": { "scanRoots": ["ui-design/apps/<module-a>/pages"] } }
    },
    "web-console": {
      "layers": ["base", "handoff"],
      "guards": { "check-manifest": { "sourceManifestDir": "ui-design/apps/<module-b>/docs/manifests" } }
    }
  }
}
```

迁移要点：

- **顶层 `guards` 变成公共缺省**，模块内同名 guard 配置按 key 覆盖（数组整键替换）。模块可声明自己的 `layers` 子集。
- **输出两态**：一旦有 `modules` 分节，所有 guard 输出与汇总一律带 `<module>/` 前缀；`--only` 支持 `<module>/<guard>` 限定。空 `modules: {}` 会直接 FAIL。
- **baseline 必须搬家分账**：模块模式不继承顶层 `baselinePath`，缺省路径为 `docs/design-spec/baselines/<module>/<guard>.baseline.json`。旧全局 baseline 还在而模块 baseline 缺失时 guard 会 FAIL 并给迁移指令——按指令 `mv` 过去，**不要**删掉重跑（那等于历史债静默清零）。每份 baseline 的处置口径（冻结 / 清偿 + owner）按模块声明。
- **已硬化的自建检查不迁移**：用 `customGuards[]` 登记进同一 runner（modules 分节存在时每条必须声明 `module`）。
- **manifest 同步**：设计源 manifest → generated 用 `node tools/design-spec-kit/tools/manifest-sync.js`（按模块读 `check-manifest.sourceManifestDir`；`--check` 挂 CI / commit gate；`--module <m>` 只处理一个模块）。消费仓不要自己维护同构脚本。
- **机读汇总**：外部系统解析结果用 `run-checks.js --json`（`jsonVersion` 承诺字段稳定），不要解析文本汇总。

## 4. CI 接线

**CI/commit gate 接线是落地必做步骤，不是可选项。** guard 的防漂移承诺 = baseline 只拦新增，前提是每次改动都有人跑；只靠人手动 `run-checks.js` 的项目，漂移会静默进主干，kit 等于没装。上线节奏建议：先报告制（`allow_failure: true` 或等价物）验证 CI 环境（submodule 拉取、Node 版本），连续两次与本地复跑一致后转硬。

### GitHub Actions 示例

```yaml
name: design-spec
on: [pull_request]
jobs:
  design-spec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: node tools/design-spec-kit/tools/kit-doctor.js
      - run: node tools/design-spec-kit/tools/run-checks.js
```

### GitLab CI 示例

```yaml
design_spec:
  image: node:20-alpine
  stage: test
  variables:
    GIT_SUBMODULE_STRATEGY: normal
    GIT_SUBMODULE_PATHS: tools/design-spec-kit
    GIT_SUBMODULE_DEPTH: "1"
  rules:
    - changes:
        - ui-design/**/*
        - docs/design-spec/**/*
        - tools/design-spec-kit   # submodule gitlink（kit 升级）
        - .gitmodules
  script:
    - node tools/design-spec-kit/tools/kit-doctor.js
    - node tools/design-spec-kit/tools/run-checks.js
```

submodule 拉取的相对 URL 与 job token 允许列表两个前置见上文「推荐接入形态」。复制式接入（无 submodule）把 changes 里的 gitlink 行换成 `.design-spec-kit.version`。

## 5. Commit Gate 接线

推荐路径触发，不要全仓无差别跑。示例：

```sh
#!/bin/sh
set -eu

changed=$(git diff --cached --name-only)
if echo "$changed" | grep -Eq '^(ui-design/|docs/design-spec/|\.design-spec-kit\.version|\.gitmodules|tools/design-spec-kit)'; then
  node tools/design-spec-kit/tools/kit-doctor.js
  node tools/design-spec-kit/tools/run-checks.js
fi
```

在已有 commit-gate 系统里，把 `node tools/design-spec-kit/tools/run-checks.js` 注册到设计相关路径即可。

## 6. 什么时候不该硬闸

- handoff 层资产没齐时，不要把实现仓路径纳入硬闸。
- 没有 i18n 运行时和词典时，不要启用 `i18n` 层。
- baseline 未经复核前，CI 可以先报告制；复核后再转硬。
⟦/FILE⟧

⟦FILE design-spec-kit/docs/CHANGELOG.template.md⟧
# 〈项目名〉更新日志（Changelog）

> 按**天**记录更新,每条标注涉及的**模块**便于筛选。**最新日期段在最上面**(newest-first)。
> 格式:`- [模块] 变更描述`。一天内可有多条,按模块归类。
> **定档即写**:仅把已定稿的工作写入;草稿 / 试验不记录。模块索引随新模块扩充。
>
> **卫生三条**(由 `tools/check-changelog.js` 机检):
> 1. **同日合并**——写前先 `grep '^## <今天>'`,命中就 append,绝不开第二个同日 `## YYYY-MM-DD` 段。
> 2. **深度上限**——一条 = 1 行标题 + 最多 3 子 bullet;根因 / 踩坑一句话带过,深内容分流到对应 doc。
> 3. **滚动归档**——主文件只留最近约 2 个会话日;超 ~200 行把窗口外**最旧整段(文件底部)**移到 `_archive/CHANGELOG-YYYY-MM.md`,底部留链接。

## 模块索引
- **设计规范** — tokens / 组件 / 展示文档
- **文档** — CLAUDE.md / DESIGN-REF / 本文件
- 〈按你的项目追加模块标签〉

---

## 〈YYYY-MM-DD〉
- [文档] 从 design-spec-kit 起步,立 CLAUDE.md 契约 + DESIGN-REF 索引 + DoD guard。

<!-- 新的一天在「模块索引」下方、本段之上开新 `## YYYY-MM-DD`（newest-first）。 -->
⟦/FILE⟧

⟦FILE design-spec-kit/docs/DESIGN-RATIONALE.md⟧
# design-spec-kit v2 设计方案（DESIGN-RATIONALE）

> 本文件回答「kit 为什么长这样」：v2 的实证来源、失效假设复盘、关键决策与被否决的备选。
> 面向 kit 的维护者与评审者；使用者看 README / HANDOFF 即可。全文不含任何具体业务内容。

---

## 1. 实证来源

v2 不是凭空设计，来自对两个生产项目的三轮多 agent 审计（关键断言均回源核实）：

- **案例 A**：静态 HTML/CSS/JS 设计原型 → 移动端 widget 树实现（跨技术栈，需 token/图标生成链）。
- **案例 B**：React JSX 设计原型 → React SPA 实现（同构栈，无生成链）。

三轮审计分别做了：① 一个复杂交互屏的设计 vs 实现逐元素比对；② 设计原型全量体检（41 条发现）+ 逐条「kit v1 为什么没兜住」归因；③ 两案例全链盘点 + 交叉映射验证。

### 1.1 还原侧的核心发现
实现侧「自造」极少（逐元素比对仅 2 处真自造）；「设计稿上没有的东西」绝大多数是**协议 / 契约驱动的状态覆盖**——设计只画 happy path，真实会话有建连 / 失败 / 降级 / 关闭一整套状态空间，实现有据可依地自补了，但**无申报机制、无回流通道**，设计侧永远不知道。结论：治理目标不是「禁止发明」，是「让偏离可申报、可对账、可回流」。

### 1.2 设计侧的兜漏归因（41 条分布）
guard 盲区 59%（死 CSS + i18n 覆盖——v1 三个 guard 全是「新增侧」防线）；有纪律无机检 15%（契约里最像产品纪律的几条恰恰没长成 guard）；baseline 固化 7%（key 无行号 → 同值新增被预豁免）；实例化缺失 5%（guard 漏装 / 正则不适配，无自检可发现）；入口脱节 5%（文档宣称的聚合命令实际不跑 guard）；复核为非问题 10%。**凡有机检的纪律执行度都高，凡没有的都漏——方法论成立，覆盖不全。**

### 1.3 交叉映射的结论
两案例各自演化出了互补的半套：一侧强在提交闸与走查 SOP、另一侧强在生成链硬闸与布局断言。**两案例都缺的只有三件**：状态空间声明、偏离台账、结构对账——这三件就是 v2 的真新增。四层模型无需为任一案例改结构，栈差异全部落 IMPL-PROFILE。

---

## 2. v1 的四个失效假设（复盘）

1. **「漂移 = 新增了坏东西」**：实际过半腐化是「改版后旧东西没死透」（每次方向切换留一层死码）与「覆盖性义务漏项」（整屏漏挂 i18n）。→ 补删除侧 / 消费侧 guard（④⑤）。
2. **「写进契约 = 会被执行」**：可 grep 的纪律必须长成 guard 维度，否则只是愿望。→ 「约定维」并入 guard①（形态 / 点击目标 / 术语黑名单等按项目配置）。
3. **「原样拷入即生效」**：guard 需要按项目适配配置区，而「忘了适配」无人能发现。→ kit-doctor（配置命中数 > 0、入口真调、DoD 对得上）。
4. **「kit 止于设计侧自洽」**：设计→实现之间没有契约层，代价见 §1.1。→ 还原交接层（HANDOFF）。

---

## 3. 关键决策记录

### D1 normalized manifest：载体自由，生成物统一
**决策**：manifest 源头载体随项目（单文件 / 屏内注释 + 索引），但必须重生为统一 schema 的 `*.manifest.generated.json`；guard⑥ 与 T1 只认生成物。
**为什么**：审计中一个案例明确否决过「强推单一状态表文件」——强制载体形态会撞死既有工作流；但完全自由会让「语言无关」退化成每项目一套解析器。锁语义、放载体，用「真源 + 重生」纪律（kit 既有机制）桥接。
**否决的备选**：强制单文件（撞既有决策）；只写文档约定不出 schema（guard 无判据，回到人工纪律）。

### D2 runtime anchor 是 T1 事实源，源码注释只是审计索引
**决策**：偏离申报三件套——渲染树上的稳定标识（`data-design-id` / `data-deviation-id` / widget key，语法按栈登记）+ 源码注释 `@design-deviation(...)` + 台账行。T1 只认 runtime anchor。
**为什么**：T1 要做「渲染树多出的元素必有申报」的机械判定，而**渲染树看不到源码注释**——只靠注释 grep 的方案在评审中被判定不可实现。
**否决的备选**：仅注释 grep（无法支撑 T1 反查）；仅台账（离代码现场太远，必然漂）。

### D3 T3 像素两层：对设计稿只产证据，硬闸只对自批准基线
**决策**：T3(a) prototype-compare = 实现 vs 原型并排对照图，人 / AI 读图，非硬闸；T3(b) approved-baseline = 实现对自己上次批准的截图断言，可硬闸、权威平台唯一。
**为什么**：跨渲染管线（不同字体栅格 / 抗锯齿）的像素断言会永远红——这是被生产项目验收标准明文确认过的边界。把「对设计稿自动 diff 报红」写进验收是常见错误，kit 层面直接堵死这种表述。

### D4 delegated.to 枚举统一三种「设计领先」标记
**决策**：状态空间的 `delegated` 带 `to: impl | backend | firmware | other`。
**为什么**：审计发现两案例各自长出了「设计领先下游」标记（一个对后端契约、一个对设备能力），而还原层需要的新语义是「设计授权实现自补」——三者是同一抽象（设计声明了下游未兑现的契约点）的不同投影。一个枚举收编全部，不发明第三种标记体系；两案例的历史标记可无损迁入，反向验证了抽象正确。

### D5 平台标准状态类不算偏离
**决策**：loading / empty / error / no-permission / offline / saving / confirm-high-risk / permission-denied 为 kit 基线 `required_state_classes`，各栈在 IMPL-PROFILE 定稿；manifest 默认继承，实现覆盖它们不打 deviation，且**必须**覆盖。
**为什么**：评审指出「封闭世界」若不留这个口子，会把平台规范**要求**的状态覆盖全部误伤成偏离，台账被噪声淹没，纪律立刻失去公信力。

### D6 guard 双环境 + 聚合入口
**决策**：所有 guard 单文件双环境（无 shell 的 AI 沙箱粘贴执行 / 本地 node），FAIL 在 node 侧给退出码；`run-checks.js` 为聚合入口。
**为什么**：v1 的 guard 只能在设计沙箱跑，本地 / CI 无可执行路径，且文档宣称的聚合命令实际不含 guard——纪律执行链在最后一米断掉是归因里杀伤最大的单点。runner（npm / bun / make）按 IMPL-PROFILE 登记，不假设通用入口。

### D7 baseline 按出现次数计
**决策**：baseline 豁免以「file + kind + match + 出现次数」计——已豁免文件里同值**再新增一处**也算新增。
**为什么**：v1 的 key 不含位置信息，一条 baseline 罩住同文件同值的所有未来出现，形成「预豁免」，guard 事实上跑不红。

### D8 独立成仓
**决策**：kit 独立 git 仓管理，tag 化版本；使用方实例化拷入 + `.design-spec-kit.version` 钉版；升级 / 回滚 / bundle 重生协议见 VERSIONING.md。
**为什么**：一个自称可交付他人的通用套件，不应寄居在某个具体设计项目的目录里（权威模糊、同步互相冲掉、消费方多元后无版本可依）。bundle 从「手工打包的分发副本」降级为「由脚本重生的生成物」，符合 kit 自己的「真源 + 重生」纪律。

---

## 4. 边界（v2 不做什么）

- 不做设计工具插件、不解析任何设计工具私有格式——输入永远是「进了版本库的原型产物」。
- 不内置任何栈的执行器——T1/T2/T3 语义归 kit，实现归各栈 IMPL-PROFILE。
- 不做跨渲染管线像素断言（见 D3）。
- 不管进度 / 项目管理——manifest 是交接契约，不是任务看板。
⟦/FILE⟧

⟦FILE design-spec-kit/docs/DESIGN-REF.template.md⟧
# 〈项目名〉设计规范 · AI 速查手册（DESIGN-REF）

> 本文件是**给 AI / 开发快速复用的索引**,不是给人看的展示文档(展示见〈设计规范展示页〉)。
> **复用任何组件前先读本文件**:直接抄类名与最小 HTML 片段,不必重读 CSS。
> 黄金规则:**只引用 `var(--*)`,绝不写死颜色 / 字号 / 间距**;改完若定档,按 `CHANGELOG.md` 规矩记录。

## 文件结构（按你的项目填实）
```
项目根/
├── CLAUDE.md             # 项目说明（必须在根目录，自动加载）
├── docs/
│   ├── DESIGN-REF.md     # 本文件 · AI 速查
│   └── CHANGELOG.md      # 更新日志（按天 + 模块标签）
├── tools/
│   ├── check-tokens.js
│   └── check-changelog.js
└── 〈样式目录〉/
    ├── tokens.css        # 所有设计变量（唯一真源）
    └── 〈组件样式〉.css    # 布局 + 组件样式（只用 var(--*)）
```

## Token 速查
> 数值唯一真源在 `tokens.css`;下表只做语义索引。改了 tokens.css 必须同步本表。
> 下面是**建议骨架**,按你的实际 token 增删。

### 颜色（中性 · 〈随 data-mode,可选〉）
| token | 语义 |
|---|---|
| `--bg` / `--bg-2` | 页面底 / 次级底 |
| `--surface` / `--surface-2` | 卡片面 / 次级面 |
| `--ink` / `--ink-2` / `--ink-3` | 正文 / 次要 / 占位 |
| `--hairline` | 分隔线 |

### 颜色（强调 · 〈随 data-theme + data-mode,可选〉）
| token | 语义 |
|---|---|
| `--accent` | 主强调(按钮 / 选中 / 链接) |
| `--accent-strong` | 加重强调 |
| `--accent-soft` | 浅底 |
| `--on-accent` | 实色强调上的文字 |

### 字体 / 间距 / 圆角 / 阴影
| 类别 | token | 说明 |
|---|---|---|
| 字体 | `--font-sans` / `--font-mono` | UI / 等宽 |
| 间距 | `--sp-1`…`--sp-16` | 4px 基准 |
| 圆角 | `--r-xs`…`--r-xl` / `--r-full` | |
| 阴影 | `--shadow-sm` / `--shadow-md` / `--shadow-lg` | |

## 组件目录
> 每个可复用组件一条:类名 + 一句用途 + 最小 HTML。**没登记的组件视为临时草稿。**

### 〈组件名示例:按钮〉
〈用途〉
```html
<button class="〈类名〉">…</button>
```

<!-- 按此格式继续追加组件。新增组件先在此登记，再写进 CHANGELOG。 -->

## 图标与贡献约定
- **图标单一源**:全部图标收口于一个图标库〈如 `icons.js` 的 `Icons('name')`〉,组件经它取用,**勿 per-file 重画**(同名多版 = 漂移,还卡按名抽取的 icon-gen)。标准字形取一个库(如 lucide)的 canonical;特色 / 动画图标(带 class、填充态)可留本地并标注。`check-icons.js` 守同名异形。
- 图标风格:〈线性 / 填充、stroke-width、来源库〉。
- 新增图标 / 组件先在本目录登记(图标名 / 类名 + 最小 HTML),再写进 CHANGELOG。
⟦/FILE⟧

⟦FILE design-spec-kit/docs/DESIGN-SYNC.md⟧
# DESIGN-SYNC（设计 handoff → 消费仓同步引擎）

> 状态：v2.3.0 落地。`tools/design-sync.js` 把「设计稿进入消费仓 target」这一步做成确定性工具，
> 收尾强制重生 manifest + 跑 guard，不靠 skill 记忆。引擎与平台无关，业务细节全在消费仓 profile。

## 1. 边界

- **引擎负责**：解压 handoff zip（内置零依赖 ZIP 读取器 + 安全校验）/ 吃已解目录、定位 `<top>/project/`、
  三态对比、`_archive` 双向提示、覆盖/删除安全门、非破坏 apply、postSync 编排、`--json` 机读报告。
- **引擎不负责**：业务目录命名、业务后续 SOP、设计稿内容、manifest 路径（由 `manifest-sync.js` 读 `config.json` 解析）、
  实现级视觉 evidence（走 `flutter-visual` / `impl-visual`）。
- 与个人 skill 的关系是**单向依赖 skill → engine**：skill 是驱动前端（认意图、喂引擎吃不到的输入如 MCP 逐文件拉、
  解释结果、拿人确认删除），引擎从不回调 skill。

## 2. 配置：`docs/design-spec/design-sync.json`

```jsonc
{
  "modules": {
    "<module>": {
      "target": "ui-design/apps/<module>",      // 同步目标子树（写盘边界锁死在此）
      "sourceProjectSubdir": "project",          // <top>/<subdir>/ 才是要镜像的源
      "topNameHints": ["hiagent-mobile", "..."], // 顶名子串命中即匹配该 module（自动认 module 用）
      "kind": "static-prototype",                 // 信息性；引擎不据此分支
      "transferExcludes": [".DS_Store", "uploads/", "..."], // 不同步、也不参与分类
      "diffExcludes": [],                          // 两侧都可能出现的派生物：完全排除出三态与 hits
      "targetOnlyAllow": ["**/*.standalone.html"], // 目标侧独有的合法产物：从 onlyInTarget 移到 hits（透明记账）
      "postSync": [
        { "type": "link-check" },
        { "type": "manifest-sync" },
        { "type": "design-spec-check" }
      ]
    }
  }
}
```

manifest 路径**不在此声明**——`manifest-sync.js` 自己读 `config.json` 各模块 `check-manifest` guard 的
`sourceManifestDir` / `manifestDir` / `screensListPath`，避免第二份真源。

### 三种排除，语义不同（别混）

| 字段 | 作用 | 用于 |
|---|---|---|
| `transferExcludes` | 不同步、不参与分类 | 临时/画布状态文件（`.DS_Store` / `uploads/` / `screenshots/` / `tmp/` 等）。缺省即这套。 |
| `diffExcludes` | 从 changed / onlyInSource / onlyInTarget / hits **全部**剔除 | 两侧都可能出现、但不该 diff 的派生物 |
| `targetOnlyAllow` | 只把 `onlyInTarget` 命中项移到 `targetOnlyAllowHits`（可见记账） | 目标侧独有的合法产物（react-spa 的 `*.standalone.html` 等） |

**优先级**：某文件同时命中 `diffExcludes` 与 `targetOnlyAllow` 时，`diffExcludes` 先生效（该文件从分类彻底消失，
不进 hits）。所以**纯目标侧派生物优先用 `targetOnlyAllow`**（进 hits，透明），`diffExcludes` 留给"两侧都可能有"的情形。

> `git`-ignore 但要同步的文件（如设计师 v1 对照 `*.bak`）**不进任何 excludes**，靠消费仓 `.gitignore` 兜。

## 3. CLI

```bash
# cwd = 消费仓根；提交后前缀 tools/design-spec-kit/tools/，dev clone 迭代期换 ~/Desktop/design-spec-kit/tools/
node tools/design-spec-kit/tools/design-sync.js --zip <handoff.zip> --module <m>            # 默认 apply
node tools/design-spec-kit/tools/design-sync.js --zip <handoff.zip> --module <m> --dry-run  # 只报告不写盘
node tools/design-spec-kit/tools/design-sync.js --module <m> --source <dir>                 # 吃已解目录（skill 源 B 用）
node tools/design-spec-kit/tools/design-sync.js --module <m> --check-only                   # 只跑 guard，不同步
```

附加：`--json`（机读报告）、`--apply-deletes`（放行删除）、`--force-overwrite`（放行覆盖本地改动）。

`--module` 省略时按 `topNameHints` 自动认；认不准 fail-closed（多模块要求显式 `--module`）。

## 4. 三态与 archive 提示

- `changed`：两侧都有、内容不同。
- `onlyInSource`：设计新增（apply 时补建）。
- `onlyInTarget`：项目侧残留候选（已扣除 `diffExcludes` / `targetOnlyAllow`）。**默认只报告不删**。
- `_archive` 双向提示（report-only）：`possible-archived-residue`（设计师归档、原位置残留）/
  `possible-unarchived-residue`（反归档、`_archive` 内残留）。不自动删，交人确认。

## 5. 覆盖 / 删除安全门（fail-closed）

只对**将被动到的 path** 做本地改动检测，无关 dirty 不阻塞：

1. 算本轮将覆盖（changed）与将删除（`--apply-deletes` 下的 onlyInTarget）的 target path。
2. 与 `git status --porcelain -- <target>` 求交集；空交集则该维度不阻塞。
3. 覆盖命中本地修改：须 `--force-overwrite` 才写，否则跳过并列清单。
4. 删除：须 `--apply-deletes`；命中本地修改的删除额外须 `--force-overwrite`。
5. 两门相互独立，`--force-overwrite` 不隐含 `--apply-deletes`。

非 git 环境下门降级（跳过检测），apply 仍锁写盘边界在 target 子树内。

## 6. 解压安全（外部输入 · fail-closed）

handoff zip 是外部输入，中央目录解析阶段即校验，**任一越界 abort、不落任何盘**：

- 路径逃逸（`..`）、绝对路径（`/` 或盘符开头）、NUL → 拒。
- symlink / hardlink entry（unix 外部属性 `S_IFLNK`）→ 拒。
- zip bomb：单文件 / 总量 / entry 数上限 + 膨胀比阈值 → 超限拒。
- ZIP64 / 加密 / 未知压缩方法 → fail-closed。
- apply 写盘：每个目标路径规范化后必须仍在 target 子树内，否则 abort（工具级不变量，独立于宿主 auto-mode）。

## 7. postSync

| type | 行为 |
|---|---|
| `link-check` | 扫 html/css 相对链接是否解析（best-effort，报 warning 不硬闸） |
| `manifest-sync` | `node <kit>/tools/manifest-sync.js --module <m>`（重生 generated + screens） |
| `manifest-sync-check` | 同上 `--check`（只校验） |
| `design-spec-check` | `node <kit>/tools/run-checks.js`（含 check-manifest guard） |
| `command` | 消费仓自定义命令（契约见下） |

顺序契约：`manifest-sync`（重生）必须排在 `design-spec-check`（校验）之前。dry-run 下全部 SKIP（不写盘、不跑）。

### `command` 执行契约

- **cwd**：消费仓根。
- **cmd**：字符串（走 `sh -c`）或数组（`execFile`，不过 shell，免注入/quoting 漂移）。
- **env**：继承当前环境 + 可选 `step.env` 覆盖。
- **exit**：非 0 即该步 FAIL，整体 `RESULT: FAIL` + 退出码 1。
- **输出**：stdout/stderr 收进报告（`--json` 下作为该步字段）。
- **timeout**：默认 300s（`step.timeoutMs` 可覆盖），超时记 FAIL（exit 124）。
- 命令必须非交互。

## 8. `--json` 报告契约

`{ jsonVersion, tool, module, mode, source, diff:{changed,onlyInSource,onlyInTarget,targetOnlyAllowHits,archiveHints},
gate:{gitAvailable,overwriteConflicts,deleteConflicts,overwriteBlocked,allowedChanged,allowedDeletes},
apply:{written,deleted}|null, postSync:[{type,label,status,...}], result }`。

skill wrapper 解析它做解释与删除项确认，不解析人类文本。

## 9. 与实现级视觉 evidence 的关系

`design-sync` 只保证"设计源 + manifest 同步"，不保证真实 App 实现已对齐。实现级 evidence 仍走
`flutter-visual` / `impl-visual`（`make design-spec-check-flutter` 等显式入口），不进默认 postSync。
⟦/FILE⟧

⟦FILE design-spec-kit/docs/DEVIATION-LEDGER.template.md⟧
# 实现偏离台账（DEVIATION-LEDGER）

> 实现侧对设计的一切偏离在此挂号裁决。放实现仓 `docs/DEVIATION-LEDGER.md`。
> 铁律：**每条只有两个出口**——`收编`（设计更新原型 + manifest，实现摘标）或 `摘除`（实现回退）。不许长期挂账。
> `check-deviation.js`（guard⑦）机读对账：代码标记 ↔ 本台账双向互查（未申报 / 幽灵条目 / 该摘标 = FAIL）+ 屏列引用必须存在对应 manifest（引用无效 = FAIL）+ manifest delegated 待裁决摘要（WARN）。

## 台账

| id | 屏 | anchor | kind | 依据（basis） | 状态 | 裁决记录 |
|---|---|---|---|---|---|---|
| DEV-001 | 〈screen-id〉 | 〈runtime anchor〉 | extra-element | 〈契约 / 任务引用〉 | open | |

字段规则：
- **id**：`DEV-` + 三位递增，与代码里 `@design-deviation(id: ...)` 及 runtime anchor（`data-deviation-id` / 等价物）一致。
- **kind**：`extra-element`（渲染了设计没有的元素）/ `state-form`（状态的呈现形态与设计不同）/ `copy`（文案改写）/ `debug`（调试设施——必须有运行时开关隔离，且开关默认关）。
- **basis**：为什么偏离——契约文件、任务、平台限制，必须可回查。写不出 basis 的偏离 = 直接摘除候选。
- **状态**：`open` → `收编` / `摘除`。收编 / 摘除后**保留行**并填裁决记录（日期 + 拍板人一句话），保持审计可回放；台账过长时整段归档到 `docs/_archive/`。
- 平台标准状态类（loading / error 等，见 IMPL-PROFILE §5）**不进台账**——那是必须覆盖的职责，不是偏离。

## 裁决节奏
- 随迭代评审过一遍 open 条目，逐条向两个出口收敛。
- manifest 里 `contract_ref: TBD` 的 delegated 项视同 open 条目一起过。
- 收编的执行顺序：设计侧更新原型与 manifest（版本 +1）→ 实现摘 `@design-deviation` 标与 runtime deviation anchor → guard⑦ 转绿。
⟦/FILE⟧

⟦FILE design-spec-kit/docs/FLUTTER-VISUAL-EXTENSION-PROPOSAL.md⟧
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
   - 已知 extension 目录缺失时普通模式 skip 并提示 setup guidance；`--strict` 下非零退出。
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

- 未知 extension 名：`kit-doctor` 失败；`run-checks --list` 打 warning；`run-checks --strict` 非零退出。已知 extension 启用但目录缺失时，普通模式提示 setup，`--strict` 非零退出。
- evidence 粒度：v1 按 screen 声明，后续再支持 per-anchor evidence。
- helper 引入方式：v1 复制到项目测试目录，不从 extension 路径 import。
- motion 方向：manifest v1 可声明方向语义；helper v1 只机检 animated presentation，方向机检进 v2。

## 成功标准

- 项目能通过配置启用 `flutter-visual`，无需手改 kit core guard 清单。
- 非 Flutter 项目不会误跑该扩展。
- manifest contracts 保持语义化，不复制 token 数值。
- Flutter 测试能证明 light/dark invariant surface 和 animated presentation，不依赖 golden 图片。
- 当设计声明“暗玻璃托盘 + 动画呈现”，但 Flutter 实现成“跟随全局主题的静态面板”时，`--execute-impl` 会让项目 contract test 失败。
⟦/FILE⟧

⟦FILE design-spec-kit/docs/IMPL-PROFILE.template.md⟧
# 实现栈接入契约（IMPL-PROFILE）· 模板

> 一个实现栈一份，放实现仓 `docs/impl-profiles/<stack>.md`。
> kit 定验收**语义**（HANDOFF.md §3），本文件登记该栈的**执行器**——命令、挂点、权威平台、能力边界。
> 没登记的执行器视为不存在：验收口径只认这里写了的。

---

## Profile：〈栈名，如 web-dom / widget-tree / native-view〉

### 0. runner（先定，别假设）
| 项 | 值 |
|---|---|
| 包管理 / 任务入口 | 〈node / bun / make / gradle …——写出真实调用方式，如 `bun run check`、`make verify`。**不要把某一个包管理器写成通用入口**〉 |
| guard 跑法 | 〈本地命令〉；AI 沙箱 = 读脚本粘贴执行 |
| CI 挂点 | 〈pipeline / job 名，或「无 CI，本地 pre-commit」〉 |
| 提交闸 | 〈commit 前 / push 前各跑什么；无则写明「仅 CI」〉 |

### 1. 生成链（设计真源 → 栈产物）
| 产物 | 生成命令 | 漂移闸 |
|---|---|---|
| 〈token 常量 / 主题对象〉 | 〈命令〉 | 〈`--check` 命令 + 挂点〉 |
| 〈图标资源〉 | 〈命令〉 | 〈同上〉 |
> 原型与实现同构（无需生成链）时写 `N/A`，并写明 token 对账走什么（如「设计 tokens ⊆ 实现 tokens 的 diff 脚本」）及其强制等级。

### 2. 偏离标记与 runtime anchor
| 项 | 本栈语法 |
|---|---|
| 源码注释（审计索引） | `@design-deviation(id, kind, basis)` 于〈注释形态，如 `//` / `/** */`〉 |
| runtime anchor（T1 事实源） | 〈DOM 栈：`data-design-id="<anchor>"` + `data-deviation-id="<DEV-id>"`；widget 栈：稳定 key / 语义标识如 `key: 'ds.<anchor>'`；写出真实 API〉 |
| 标记扫描根 | 〈实现代码目录列表——check-deviation.js 配置区同步〉 |

### 3. 三级验收执行器
| 级 | 执行器 | 命令 | 闸性质 | 已知能力边界 |
|---|---|---|---|---|
| T1 结构对账 | 〈渲染树 dump vs manifest，按 runtime anchor〉 | 〈命令〉 | 可硬闸 | 〈如：portal / overlay 场景需显式挂载〉 |
| T2 参数断言 | 〈布局 box 断言 / token 字面量扫描〉 | 〈命令〉 | 可硬闸 | |
| T3(a) 对设计稿证据 | 〈并排对照截图产出工具〉 | 〈命令〉 | **非硬闸**（人 / AI 读图） | 跨渲染管线禁自动像素断言 |
| T3(b) 自回归基线 | 〈golden / screenshot 断言〉 | 〈命令〉 | 可硬闸 | **权威平台 = 〈唯一生成基线的环境〉**；其他机器跑红属预期，不作为 DoD 依据 |

### 4. 参数抽取器（manifest 参数半）
| 项 | 值 |
|---|---|
| 抽取器 | 〈命令——从渲染后的原型读 computed 布局值；原型能在浏览器渲染即可用，与原型源码形态无关〉 |
| 屏登记表 | 〈抽取器覆盖哪些屏的登记文件〉 |
| 产物 | 〈输出路径——manifest `params_ref.output` 指它〉 |

### 5. 平台标准状态类定稿
基线（kit 默认）：loading / empty / error / no-permission / offline / saving / confirm-high-risk / permission-denied。
本栈增删：〈如 +suspended（移动端后台挂起）；-offline（纯内网桌面端）——每条写一句理由〉。
⟦/FILE⟧

⟦FILE design-spec-kit/docs/MULTI-MODULE-PROPOSAL.md⟧
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
⟦/FILE⟧

⟦FILE design-spec-kit/docs/SCREEN-MANIFEST.template.md⟧
# 屏幕交接清单（SCREEN-MANIFEST）· 模板与规则

> 每屏一份「设计 → 实现」交接契约。**屏 done = 屏文件 + 本清单语义半。**
> 方法论见 kit 的 `HANDOFF.md` §1；本文件是可直接抄的骨架 + 字段规则。

## normalized 规则（先读）
- 源头载体随项目：单文件手写 / 屏文件内结构化注释 + 索引脚本，都行。
- 但**必须重生为** `docs/manifests/<screen>.manifest.generated.json`，符合同目录 `screen-manifest.schema.json`。
- guard⑥（check-manifest）与 T1 结构对账**只认生成物**。改源必重生，勿手改生成物（底座「真源 + 重生」纪律）。

## 生成物骨架（JSON）

```json
{
  "screen": { "id": "<screen-id>", "title": "<人读名>", "source": "<屏文件相对路径>" },
  "version": 1,
  "state_classes": { "inherit": true, "exempt": [] },
  "elements": [
    {
      "anchor": "<稳定class或命名>",
      "role": "<一句话职责>",
      "copy_key": "<词典键·可选>",
      "icon": "<图标名·可选>",
      "states": ["<仅在这些状态可见·可选，缺省=常驻>"],
      "delegated": { "to": "backend", "contract_ref": "<路径#锚点>", "status": "open" }
    }
  ],
  "states": {
    "designed": [
      { "id": "<state-id>", "note": "<可选>" }
    ],
    "delegated": [
      { "state": "<state-id>", "to": "impl", "contract_ref": "<路径#锚点>", "status": "open" }
    ]
  },
  "params_ref": { "generator": "<抽取器命令>", "output": "<参数产物路径>" }
}
```

## 字段规则

| 字段 | 规则 |
|---|---|
| `screen.id` | 屏唯一 id，与项目屏清单真源一致 |
| `version` | 整数，从 1 起。**任何 anchor 改名 / 状态空间变更 = 破坏性变更，版本 +1 并记 CHANGELOG** |
| `state_classes.inherit` | 默认 `true`：平台标准状态类（loading / empty / error / no-permission / offline / saving / 高风险确认 / 权限拒绝，最终清单以 IMPL-PROFILE 定稿为准）视为已授权，实现覆盖它们不算偏离、且**必须**覆盖 |
| `state_classes.exempt` | 本屏确实不适用的标准态，**每条必须带 note 写原因**（guard⑥ 查） |
| `elements[].anchor` | 设计↔实现对账主键（`^[a-z][a-z0-9-]*$`）。实现侧以 runtime anchor（如 `data-design-id`，语法按 IMPL-PROFILE）回指它 |
| `elements[].delegated` | 元素级「设计画了、下游还没有」：`to: backend/firmware` + 契约引用（对应界面上的占位 / 置灰处置） |
| `states.designed` | 设计画出的状态。**designed 与 delegated 合计不得为空——设计可以少画，不可以不表态** |
| `states.delegated` | 设计授权自补：`to: impl`（实现按契约自补，落地后回执改 `reconciled`）/ `backend` / `firmware`（等下游能力）。`contract_ref` 必填；写 `TBD` = 显式待裁决信号（guard⑥ 记 WARN 不 FAIL） |
| `params_ref` | 参数半：抽取器生成的布局参数产物引用（抽取器按 IMPL-PROFILE 登记），无抽取器可整段省略 |

## 最小可用示例（一个登录屏）

```json
{
  "screen": { "id": "login", "title": "登录", "source": "pages/login.html" },
  "version": 1,
  "state_classes": { "inherit": true, "exempt": [ { "id": "offline", "note": "登录前无会话，离线态由系统弹层承载" } ] },
  "elements": [
    { "anchor": "login-form", "role": "账号密码表单" },
    { "anchor": "login-submit", "role": "主按钮", "copy_key": "login.submit" },
    { "anchor": "login-sso", "role": "第三方登录入口", "delegated": { "to": "backend", "contract_ref": "docs/api/auth.yaml#sso", "status": "open" } }
  ],
  "states": {
    "designed": [ { "id": "default" }, { "id": "submitting" } ],
    "delegated": [
      { "state": "captcha-required", "to": "impl", "contract_ref": "docs/api/auth.yaml#captcha", "status": "open" }
    ]
  }
}
```
⟦/FILE⟧

⟦FILE design-spec-kit/docs/SHELL-KIT.md⟧
# SHELL-KIT：kit 自带的可插拔壳骨架

> design-spec-kit 的**方法底座**(契约 + DoD + token 纪律 + guard)本身对呈现一无所知。
> 但 kit 仓**随包 ship 一个可选的壳骨架**放在 `shells/`,作为"怎么把设计跑成平台原型"的 **canonical 参考实现**。
> 当前只有 `shells/mobile-shell/`(移动端最刚需);桌面 / Web 等以后按同一规范平级加 `shells/<name>/`。
>
> 关系一句话:**底座不依赖壳(依赖方向),但 kit 仓可以分发壳(分发形态)**——两者不矛盾,像框架 core 不依赖 starter、仓库却 ship 官方 starter。

---

## 一、边界:哪些是 kit 层(通用·别动),哪些是项目层(各自填)

壳骨架里的东西分两类,搬用时分清:

| | kit 层(canonical·通用) | 项目层(消费项目各自) |
|---|---|---|
| 运行时 | `assets/{app,screen,pages,sheet,pull-refresh,i18n}.*`——壳内核,原样用 | —— |
| 视觉 | `assets/{tokens,spec}.css`——**占位 demo 视觉**,仅供壳独立跑 | 真接入时屏 link 项目 `design-system/{tokens,spec}.css`,不复制占位 |
| 样板屏 | `screens/{_template,home,detail}.html`——中性 demo 屏 | 业务屏在项目 `pages/`,**不进 kit** |
| 纯度 guard | `tools/check-shell-purity.js` 的**逻辑 + ALLOW 白名单**(壳挂钩契约) | guard 顶部三 knob `MODULE_PREFIX_RE`/`FORBID_WORDS`/`MODULES_DIR`——**每个项目填自己的业务名单**(kit canonical 留中性/空) |
| 同源 guard | `tools/check-kit-drift.js` + `kit-drift.baseline.json` | 仅"复制式复用"项目需要 |

**约束(硬)**:kit `shells/mobile-shell/` **零业务**——无业务屏、无业务类名(`rb-*` 等)、无业务词。纯度 guard 的 hirobot 实例值只作**注释示例**保留,配置本体中性。

---

## 二、两种接入方式

1. **引用式(推荐·无副本)**:业务屏直接 `link ../shells/mobile-shell/assets/{screen.css,screen.js}` + 项目 `design-system/{tokens,spec}.css`。无壳副本 → 无副本漂移,`check-kit-drift` 免跑;只需按你项目填 `check-shell-purity` 三 knob 后照跑。
2. **复制式(设计侧原型必走)**:把 `shells/mobile-shell/` 拷进项目树(如 claude.ai/design 的自包含原型环境没法引用外部 kit)。拷贝由 `check-kit-drift.js` 对着 canonical baseline 守"没被就地改";改壳走上游(见下)。

---

## 三、canonical 与拷贝的收敛

- **kit `shells/mobile-shell/` = 唯一真源**(随 kit 版本走)。
- 设计侧原型 / 复制式项目持**下游拷贝**,`check-kit-drift` 守同源。
- **改壳只在 kit 改** → 重生 `kit-drift.baseline.json` → 再同步下发到各拷贝。**绝不就地补丁拷贝**(drift guard 会报红)。
- 业务名单是项目层:各拷贝的 `check-shell-purity` 三 knob 可以各自项目化,**不算 drift**。落地机制:`check-kit-drift` 的 `SKIP` 把整个 `tools/check-shell-purity.js` 排除出 baseline——它是项目可配置工具,各拷贝改自己的 knob **不会触发 drift FAIL**。drift 守的是**壳运行时**(`assets/` + `screens/` + `index.html` + 占位视觉)与 `check-kit-drift.js` 自身的字节同源。

---

## 四、扩展:加一个新壳

照 [`EXTENDING.md`](../EXTENDING.md)「造一个新壳的最小清单」,在 `shells/` 下平级加 `shells/desktop-shell/` 等:通用内核("一套屏源两种呈现" + postMessage + 画布 + 主题广播)可复用,换设备框 + chrome 注入即换平台。所有壳**共用项目同一份 tokens.css**,底座保证它们说同一套设计语言。

---

## Promote 记录

- **2026-07-06**:`mobile-shell` 从 hirobot 原型 promote 进 kit `shells/mobile-shell/` 当 canonical。generalize = 纯度 guard 三 knob 中性化(hirobot 值转注释示例)+ 两处业务举例注释改中性;运行时 / demo 屏 / 占位视觉原样。纯度 + kit-drift guard 均 PASS。此后 hirobot 原型那份降级为 kit 的下游拷贝。
⟦/FILE⟧

⟦FILE design-spec-kit/docs/VERSIONING.md⟧
# 版本与实例协议（VERSIONING）

> kit 独立 git 仓管理后，「kit 仓」与「使用方实例」的版本关系、升级、回滚、bundle 重生规则。

## 角色
- **kit 仓（权威源）**：本套件的 git 仓库，语义化版本 tag（`v2.0.0` 起）。`package.json` 的 `version` 字段 = 当前版本唯一真源。
- **发版纪律**：`package.json` bump 与打 tag 是同一动作的两半——bump 合入后立即打对应 tag，不允许「version 已 bump、tag 未打」长期存在。消费仓的 pin **必须落在 tag 上**，不落两个 tag 之间的中间 commit；中间 commit 的 pin 无法用版本号沟通、回滚也没有锚点。急用未发版的修复时，先在 kit 仓补一个 patch tag 再 bump 消费仓。
- **实例**：使用方项目里那份 kit（契约 + docs + tools）。版本 pin 有两种，**按接入方式二选一，不要并存**：
  - **submodule 接入**（推荐）：版本 pin 就是 submodule 的 gitlink（精确到 commit）。`git submodule status` 即给版本，**不要**再建 `.design-spec-kit.version`——那会是会漂的第二真源。`kit-doctor` 检测到 kit 目录受 git 管即走此路。
  - **复制式接入 / 无 git 环境**：纯拷文件或 bundle 拆包，没有 gitlink，才在实例根写一个 **`.design-spec-kit.version`** 文件（一行 = 拷入的 kit 版本号）；`kit-doctor` 读它对比 kit 版本报「落后 N 版」。

## 升级 SOP（实例侧）
1. 读 kit 仓两个版本间的 CHANGELOG，确认破坏性变更（guard 配置区字段变化 / schema 变化 / DoD 行变化）。
2. 覆盖拷入新版文件；**guard 配置区是实例资产**——按 diff 把本地配置（扫描目录 / 档集 / 正则）搬进新版配置区，不要整文件回退。
3. 更新版本 pin：submodule 接入 = bump submodule 到目标 tag（gitlink 自动记录，无文件要改）；复制式 = 改 `.design-spec-kit.version`。
4. 跑 `kit-doctor`（配置命中数 / 入口接线 / DoD 对账）+ `run-checks`（baseline 兼容性——schema 变更可能需要按 guard 提示重写 baseline）。
5. 两者绿才算升级完成；CHANGELOG 记一行。

## 回滚
- 实例侧：从 kit 仓对应 tag 重新拷入 + 回写版本 pin + 重跑 doctor。baseline 文件随实例走、不随 kit 走，回滚不丢豁免账本。
- kit 仓侧：正常 git revert / 打补丁版本。**永不改历史 tag。**

## 实例本地改动（防双向漂移）
- 实例**只应**改各 guard 顶部「配置」区与模板占位；改到 guard 逻辑 / 模板正文 = fork。
- 确需改逻辑：优先给 kit 仓提 PR（所有实例受益）；等不及则在实例 CHANGELOG 登记 `instance-patch: <文件> <原因>`，升级时以新版文件为底、按登记逐条人工合并。发现未登记改动的兜底手段是升级 SOP 第 2 步的 diff 对照（kit-doctor 不做逐文件哈希对账）。

## bundle 是生成物
- `design-spec-kit.bundle.md` 由 `tools/build-bundle.js` 从文件清单重生，**勿手改**。
- 改任何 kit 文件后重生 bundle；`build-bundle.js --check` 校验 bundle 与源文件一致（漂移 = FAIL），挂 kit 仓 CI。
- bundle 头部自带版本号与拆包指令；分发时连同 `distribution-prompt.txt` 一起给。

## 旧嵌入式实例的退役
kit 从某项目目录里「独立出仓」时：原目录保留一个过渡窗口（建议两个迭代），期间只留 README 指针（「本目录已迁往 <kit 仓地址>，版本 pin 见 .design-spec-kit.version」），窗口结束删除目录。同步物（会被上游同步机制覆盖的树）里不要留 kit 源文件，避免双权威。


## submodule 接入（推荐）
- 业务仓把 kit 作为 submodule 放在 `tools/design-spec-kit/`。**版本由 submodule 的 gitlink 单一记录**（精确到 commit，git 强制维护）——不要再建 `.design-spec-kit.version`，两个真源必漂。查看版本：`git submodule status`。
- 业务仓配置放在 `docs/design-spec/config.json`，不要改 submodule 内 guard 源码；否则升级会产生 dirty submodule。
- 升级流程：`git -C tools/design-spec-kit fetch && git -C tools/design-spec-kit checkout <目标 tag>` → 在业务仓 `git add tools/design-spec-kit` 提交新 gitlink → 跑 `node tools/design-spec-kit/tools/kit-doctor.js`。无 version 文件要改。
⟦/FILE⟧

⟦FILE design-spec-kit/docs/config.template.json⟧
{
  "runner": {
    "checkCommand": "node tools/design-spec-kit/tools/run-checks.js"
  },
  "kit": {
    "layers": [
      "base"
    ],
    "notes": "业务仓在这里配置已启用层 / extension；submodule 内源码保持只读。可选层：i18n、ghost-classes、handoff。可选 extension：flutter-visual。"
  },
  "extensions": {
    "flutter-visual": {
      "screens": [],
      "exempt": []
    }
  },
  "guards": {
    "check-tokens": {
      "scanRoots": [
        "src",
        "styles",
        "css",
        "components",
        "pages",
        "design-system"
      ],
      "rootFiles": [],
      "skipDirs": [
        "node_modules",
        "dist",
        "build",
        ".git",
        "_archive",
        "tools",
        "uploads",
        "vendor",
        "drafts",
        "export"
      ],
      "baselinePath": "docs/design-spec/baselines/check-tokens.baseline.json",
      "fontSizes": [
        12,
        13,
        14,
        16,
        18,
        20,
        24,
        30,
        36
      ],
      "spacing": [
        4,
        8,
        12,
        16,
        20,
        24,
        32,
        40,
        48,
        64
      ],
      "radii": [
        4,
        6,
        8,
        12,
        16,
        999
      ]
    },
    "check-icons": {
      "scanRoots": [
        "src",
        "components",
        "pages",
        "assets",
        "design-system"
      ],
      "registrySources": [],
      "ignore": [],
      "baselinePath": "docs/design-spec/baselines/check-icons.baseline.json"
    },
    "check-changelog": {
      "changelogPath": "docs/design-spec/CHANGELOG.md",
      "warnLines": 200,
      "maxSubItems": 3
    },
    "check-orphan-css": {
      "cssRoots": [
        "styles",
        "css",
        "design-system"
      ],
      "usageRoots": [
        "pages",
        "src",
        "components",
        "."
      ],
      "baselinePath": "docs/design-spec/baselines/check-orphan-css.baseline.json"
    },
    "check-ghost-classes": {
      "cssRoots": [
        "styles",
        "css",
        "design-system"
      ],
      "usageRoots": [
        "pages",
        "src",
        "components",
        "."
      ],
      "baselinePath": "docs/design-spec/baselines/check-ghost-classes.baseline.json"
    },
    "check-i18n": {
      "pageRoots": [
        "pages",
        "src"
      ],
      "codeRoots": [
        "src",
        "pages"
      ],
      "runtimeHints": [
        "i18n.js",
        "i18n-dict"
      ],
      "wrapperNames": [
        "t(",
        "I18N.t",
        "tr("
      ],
      "dictPaths": [],
      "baselinePath": "docs/design-spec/baselines/check-i18n.baseline.json"
    },
    "check-manifest": {
      "manifestDir": "docs/design-spec/manifests",
      "schemaPath": "docs/design-spec/screen-manifest.schema.json",
      "screensListPath": "docs/design-spec/screens.txt",
      "sourceManifestDir": "",
      "sourceManifestSuffix": ".manifest.json",
      "coverage": {
        "designRoot": "ui-design/apps/<module>",
        "screenGlobs": ["pages/*.html"],
        "exempt": [
          { "source": "pages/legal.html", "note": "为何该设计屏不需要 manifest（note 必填）" }
        ]
      }
    },
    "check-deviation": {
      "implRoots": [],
      "ledgerPath": "docs/design-spec/DEVIATION-LEDGER.md",
      "manifestDir": "docs/design-spec/manifests"
    }
  }
}
⟦/FILE⟧

⟦FILE design-spec-kit/docs/screen-manifest.schema.json⟧
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "screen-manifest.generated",
  "description": "design-spec-kit 还原交接层：每屏交接清单生成物的机读契约。guard⑥（check-manifest）与 T1 结构对账只认符合本 schema 的生成物。",
  "type": "object",
  "required": [
    "screen",
    "version",
    "elements",
    "states"
  ],
  "additionalProperties": false,
  "properties": {
    "screen": {
      "type": "object",
      "required": [
        "id",
        "source"
      ],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[a-z0-9][a-z0-9-]*$"
        },
        "title": {
          "type": "string"
        },
        "source": {
          "type": "string"
        }
      }
    },
    "version": {
      "type": "integer",
      "minimum": 1
    },
    "state_classes": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "inherit": {
          "type": "boolean"
        },
        "exempt": {
          "type": "array",
          "items": {
            "type": "object",
            "required": [
              "id",
              "note"
            ],
            "additionalProperties": false,
            "properties": {
              "id": {
                "type": "string"
              },
              "note": {
                "type": "string",
                "minLength": 4
              }
            }
          }
        }
      }
    },
    "interactions": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/interaction"
      }
    },
    "elements": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": [
          "anchor",
          "role"
        ],
        "additionalProperties": false,
        "properties": {
          "anchor": {
            "type": "string",
            "pattern": "^[a-z][a-z0-9-]*$"
          },
          "role": {
            "type": "string",
            "minLength": 2
          },
          "copy_key": {
            "type": "string"
          },
          "icon": {
            "type": "string"
          },
          "states": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "contracts": {
            "$ref": "#/definitions/contracts"
          },
          "delegated": {
            "$ref": "#/definitions/delegation"
          }
        }
      }
    },
    "states": {
      "type": "object",
      "required": [
        "designed"
      ],
      "additionalProperties": false,
      "properties": {
        "designed": {
          "type": "array",
          "items": {
            "type": "object",
            "required": [
              "id"
            ],
            "additionalProperties": false,
            "properties": {
              "id": {
                "type": "string"
              },
              "note": {
                "type": "string"
              }
            }
          }
        },
        "delegated": {
          "type": "array",
          "items": {
            "type": "object",
            "required": [
              "state",
              "to",
              "contract_ref",
              "status"
            ],
            "additionalProperties": false,
            "properties": {
              "state": {
                "type": "string"
              },
              "to": {
                "enum": [
                  "impl",
                  "backend",
                  "firmware",
                  "other"
                ]
              },
              "contract_ref": {
                "type": "string",
                "minLength": 3
              },
              "status": {
                "enum": [
                  "open",
                  "reconciled",
                  "dropped"
                ]
              }
            }
          }
        }
      }
    },
    "params_ref": {
      "type": "object",
      "required": [
        "generator",
        "output"
      ],
      "additionalProperties": false,
      "properties": {
        "generator": {
          "type": "string"
        },
        "output": {
          "type": "string"
        }
      }
    },
    "generator": {
      "type": "string",
      "description": "manifest-sync projection 版本标记（如 schema-projection-v1）；由 tools/manifest-sync.js 写入 generated，源 manifest 不需要"
    }
  },
  "definitions": {
    "interaction": {
      "type": "object",
      "required": [
        "trigger",
        "action",
        "target"
      ],
      "additionalProperties": false,
      "properties": {
        "trigger": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$"
        },
        "action": {
          "enum": [
            "opens",
            "closes",
            "toggles",
            "selects",
            "navigates"
          ]
        },
        "target": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$"
        }
      }
    },
    "contracts": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "surface": {
          "enum": [
            "dark-glass",
            "light-surface",
            "neutral-surface",
            "transparent",
            "danger-surface"
          ]
        },
        "themeInvariant": {
          "type": "boolean"
        },
        "motion": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "portrait": {
              "enum": [
                "none",
                "fade",
                "slide-up",
                "slide-down",
                "slide-in-left",
                "slide-in-right",
                "scale"
              ]
            },
            "landscape": {
              "enum": [
                "none",
                "fade",
                "slide-up",
                "slide-down",
                "slide-in-left",
                "slide-in-right",
                "scale"
              ]
            }
          }
        }
      }
    },
    "delegation": {
      "type": "object",
      "required": [
        "to",
        "contract_ref",
        "status"
      ],
      "additionalProperties": false,
      "properties": {
        "to": {
          "enum": [
            "impl",
            "backend",
            "firmware",
            "other"
          ]
        },
        "contract_ref": {
          "type": "string",
          "minLength": 3
        },
        "status": {
          "enum": [
            "open",
            "reconciled",
            "dropped"
          ]
        }
      }
    }
  }
}
⟦/FILE⟧

⟦FILE design-spec-kit/extensions/flutter-visual/README.md⟧
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
⟦/FILE⟧

⟦FILE design-spec-kit/extensions/flutter-visual/check-flutter-visual.js⟧
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
⟦/FILE⟧

⟦FILE design-spec-kit/extensions/impl-visual/README.md⟧
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
⟦/FILE⟧

⟦FILE design-spec-kit/extensions/impl-visual/check-impl-visual.js⟧
#!/usr/bin/env node
/**
 * check-impl-visual.js · 通用实现栈视觉契约执行器（design-spec-kit · MULTI-MODULE-PROPOSAL 方案 3）
 *
 * 默认只做 config-only 校验，不执行实现命令：
 *   - extension 已启用时必须有 extensions.<name> 配置块与 screens[]
 *   - screen manifest 存在、可解析、screen.id 对齐
 *   - interactions trigger / target 引用合法 anchor
 *   - contracts / interactions 需要 evidence；evidence 需要 command
 *   - command 满足所选 matcher 声明的 reporter 要求
 *   - 待登记队列（warning，非 FAIL）：manifestDir 下的 *.manifest.generated.json 若未在
 *     screens[] 登记、也不在 extensions.<name>.exempt（[{id, note}]，note 必填）里，
 *     逐条挂 warning——设计 sync 带回新屏时立即可见，实现落地后补登记销账。
 *     manifestDir 为显式配置（extension 级或 check-manifest guard）但目录不可读 = 配置错误 FAIL；
 *     只有缺省回退路径不存在才静默跳过（该模块未接 handoff 生成物）
 *   - evidence 静态核对（warning，非 FAIL，仅 config-only）：从 command 解析源文件，
 *     非 regex 的 evidence name 归一化后必须能在源文件里找到——测试改名断链
 *     不用等 --execute-impl 才暴露；command 里显式引用的文件不存在也挂 warning，
 *     只有解析不出任何文件 token（make target 等）才静默跳过
 *
 * 传入 --execute-impl 时才运行项目声明的 command，用 matcher 从输出中核对 evidence。
 *
 * Matcher 契约：输入 = command 合并 stdout/stderr，输出 = 每条 evidence 命中与否；
 * matcher 自己负责剥离该 reporter 的噪声（ANSI 色码 / 状态符 / 耗时等）。
 * 内置：substring（缺省）/ regex / flutter-expanded / playwright-list。
 * 新实现栈若无现成 matcher，就是要给 kit 提 matcher——这是显式扩展点，不是"零新代码"。
 *
 * 别名机制：`--as <extension-name>`（或环境变量 DESIGN_SPEC_KIT_EXT_AS）指定以哪个
 * extension 名运行——flutter-visual 薄壳以 `--as flutter-visual` 转发到本文件，
 * 层名 / 配置路径 / 输出文案与独立 flutter-visual 时代逐字节一致。
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const args = [];
const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);
const EXECUTE_IMPL = EFFECTIVE_ARGS.includes('--execute-impl');

function argValue(flag) {
  const i = EFFECTIVE_ARGS.indexOf(flag);
  if (i >= 0 && EFFECTIVE_ARGS[i + 1]) return EFFECTIVE_ARGS[i + 1];
  const eq = EFFECTIVE_ARGS.find((a) => a.startsWith(`${flag}=`));
  return eq ? eq.slice(flag.length + 1) : null;
}

const PROJECT_ROOT = process.cwd();
const CONFIG_PATH = 'docs/design-spec/config.json';
const EXTENSION_NAME = argValue('--as') || globalThis.process?.env?.DESIGN_SPEC_KIT_EXT_AS || 'impl-visual';
const IS_FLUTTER_ALIAS = EXTENSION_NAME === 'flutter-visual';
// 别名文案兼容：flutter-visual 时代的输出与错误文案原样保留
const IMPL_LABEL = IS_FLUTTER_ALIAS ? 'Flutter' : '实现命令';
const OUTPUT_LABEL = IS_FLUTTER_ALIAS ? 'Flutter test 输出' : '命令输出';

// ─── Matcher 集 ────────────────────────────────────────────────
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const MATCHERS = {
  substring: {
    matches: (output, value) => output.includes(value),
  },
  regex: {
    matches: (output, value) => new RegExp(value, 'm').test(output),
  },
  'flutter-expanded': {
    requiredReporter: { pattern: /--reporter(?:=|\s+)expanded\b/, hint: '--reporter expanded' },
    matches: (output, value) => output.includes(value),
  },
  'playwright-list': {
    requiredReporter: { pattern: /--reporter(?:=|\s+)list\b/, hint: '--reporter=list' },
    // list reporter 行含状态符/序号/[project]/耗时且可能带 ANSI 色码——剥色码后按包含匹配
    matches: (output, value) => stripAnsi(output).includes(value),
  },
};
const DEFAULT_MATCHER = IS_FLUTTER_ALIAS ? 'flutter-expanded' : 'substring';

const errors = [];
const warnings = [];
const reports = [];

function error(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function absProjectPath(p) {
  return path.isAbsolute(p) ? p : path.join(PROJECT_ROOT, p);
}

async function readJsonFile(filePath) {
  const raw = await readFile(absProjectPath(filePath), 'utf8');
  return JSON.parse(raw);
}

async function fileExists(filePath) {
  try {
    await stat(absProjectPath(filePath));
    return true;
  } catch {
    return false;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasContracts(element) {
  return isObject(element?.contracts) && Object.keys(element.contracts).length > 0;
}

// 解析 screen 的 matcher 声明；未知名字算配置错误
function resolveMatcher(screenId, name) {
  const key = name ?? DEFAULT_MATCHER;
  if (typeof key !== 'string' || !Object.prototype.hasOwnProperty.call(MATCHERS, key)) {
    error(`${screenId}: 未知 matcher '${key}'（内置：${Object.keys(MATCHERS).join(', ')}）`);
    return null;
  }
  return { key, ...MATCHERS[key] };
}

// evidence 项：string，或 { name, match?, pattern? }（match/pattern 单条覆盖 screen matcher）
function normalizeEvidenceItem(screenId, item, index) {
  if (typeof item === 'string') {
    if (!item.trim()) { error(`${screenId}: evidence 含空项或非字符串项`); return null; }
    return { name: item, match: null, pattern: null };
  }
  if (isObject(item)) {
    if (typeof item.name !== 'string' || !item.name.trim()) {
      error(`${screenId}: evidence[${index}] 是 object 时必须带非空 name`); return null;
    }
    if (item.match != null && !Object.prototype.hasOwnProperty.call(MATCHERS, item.match)) {
      error(`${screenId}: evidence[${index}].match='${item.match}' 未知（内置：${Object.keys(MATCHERS).join(', ')}）`); return null;
    }
    if (item.pattern != null && typeof item.pattern !== 'string') {
      error(`${screenId}: evidence[${index}].pattern 必须是字符串`); return null;
    }
    return { name: item.name, match: item.match ?? null, pattern: item.pattern ?? null };
  }
  error(`${screenId}: evidence 含空项或非字符串项`);
  return null;
}

function validateAnchorMap(screenId, manifestAnchors, anchors) {
  if (anchors == null) return;
  if (!isObject(anchors)) {
    error(`${screenId}: anchors 必须是 object`);
    return;
  }
  for (const [anchor, mapping] of Object.entries(anchors)) {
    if (!manifestAnchors.has(anchor)) {
      error(`${screenId}: anchors.${anchor} 未引用 manifest elements[].anchor`);
    }
    if (!isObject(mapping)) {
      error(`${screenId}: anchors.${anchor} 必须是 object`);
      continue;
    }
    if (typeof mapping.bySemantics === 'string') {
      error(`${screenId}: anchors.${anchor} 使用 bySemantics；默认约定要求 ValueKey(anchor)，例外请用 byKey`);
    }
    if (typeof mapping.byKey !== 'string' || !mapping.byKey.trim()) {
      error(`${screenId}: anchors.${anchor} 例外映射必须提供非空 byKey`);
    }
  }
}

function validateInteractions(screenId, manifest, manifestAnchors) {
  const interactions = Array.isArray(manifest.interactions) ? manifest.interactions : [];
  interactions.forEach((interaction, index) => {
    if (!manifestAnchors.has(interaction?.trigger)) {
      error(`${screenId}: interactions[${index}].trigger="${interaction?.trigger ?? ''}" 未引用 manifest anchor`);
    }
    if (!manifestAnchors.has(interaction?.target)) {
      error(`${screenId}: interactions[${index}].target="${interaction?.target ?? ''}" 未引用 manifest anchor`);
    }
  });
  return interactions;
}

function validateEvidence(screen, manifest, interactions, matcher) {
  const screenId = screen.id;
  const rawEvidence = Array.isArray(screen.evidence) ? screen.evidence : [];
  const elements = Array.isArray(manifest.elements) ? manifest.elements : [];
  const contractAnchors = elements.filter(hasContracts).map((element) => element.anchor);
  const needsEvidence = contractAnchors.length > 0 || interactions.length > 0;

  if (screen.evidence != null && !Array.isArray(screen.evidence)) {
    error(`${screenId}: evidence 必须是 string[]（或 {name, match?, pattern?} 项）`);
  }
  const evidence = rawEvidence
    .map((item, index) => normalizeEvidenceItem(screenId, item, index))
    .filter(Boolean);
  if (needsEvidence && evidence.length === 0 && rawEvidence.length === 0) {
    error(`${screenId}: manifest 声明了 contracts/interactions，但 screen 未声明 evidence test name`);
  }
  if (evidence.length > 0) {
    if (typeof screen.command !== 'string' || !screen.command.trim()) {
      error(`${screenId}: 声明了 evidence 但缺少 command`);
    } else {
      if (matcher?.requiredReporter && !matcher.requiredReporter.pattern.test(screen.command)) {
        if (IS_FLUTTER_ALIAS) {
          error(`${screenId}: command 必须包含 --reporter expanded，以便 --execute-impl 稳定核对 test name`);
        } else {
          error(`${screenId}: matcher '${matcher.key}' 要求 command 包含 ${matcher.requiredReporter.hint}，以便 --execute-impl 稳定核对 evidence`);
        }
      }
      // 单条 evidence 覆盖 matcher 时，逐条校验该 effective matcher 的 reporter 要求
      for (const item of evidence) {
        if (!item.match || item.match === matcher?.key) continue;
        const override = MATCHERS[item.match];
        if (override.requiredReporter && !override.requiredReporter.pattern.test(screen.command)) {
          error(`${screenId}: evidence '${item.name}' 的 matcher '${item.match}' 要求 command 包含 ${override.requiredReporter.hint}，以便 --execute-impl 稳定核对 evidence`);
        }
      }
    }
    // regex effective pattern 必须在 config-only 阶段就能编译，别拖到 execute 阶段崩异常
    for (const item of evidence) {
      const effectiveKey = item.match ?? matcher?.key;
      if (effectiveKey !== 'regex') continue;
      const value = item.pattern ?? item.name;
      try { new RegExp(value, 'm'); }
      catch (err) { error(`${screenId}: evidence '${item.name}' 的 regex pattern 非法：${err && err.message}`); }
    }
  }
  return { evidence, contractAnchors };
}

// ─── 待登记队列（coverage）───────────────────────────────────
// manifestDir 解析：extension 自己的 manifestDir > check-manifest guard 配置（模块键覆盖顶层）> 默认。
// 返回 { dir, source }——source 区分显式配置与缺省回退：显式配置指向不可读目录是配置错误（fail closed），
// 缺省回退不存在只说明该模块没接 handoff 生成物，静默跳过。
function resolveManifestDir(config, kitModule, extConfig) {
  if (typeof extConfig.manifestDir === 'string' && extConfig.manifestDir.trim()) {
    return { dir: extConfig.manifestDir, source: `extensions.${EXTENSION_NAME}.manifestDir` };
  }
  const pick = (node) => node?.guards?.['check-manifest'] || node?.guards?.['check-manifest.js'] || {};
  const merged = kitModule
    ? { ...pick(config), ...pick(config.modules?.[kitModule]) }
    : pick(config);
  if (typeof merged.manifestDir === 'string' && merged.manifestDir.trim()) {
    return { dir: merged.manifestDir, source: 'check-manifest guard 配置的 manifestDir' };
  }
  return { dir: 'docs/manifests', source: null };
}

// exempt 形态校验（fail closed：豁免必须写明原因）；返回 Map<id, note>，形态错误记 error
function parseExempt(extConfig) {
  const raw = extConfig.exempt;
  const exempt = new Map();
  if (raw == null) return exempt;
  if (!Array.isArray(raw)) {
    error(`extensions.${EXTENSION_NAME}.exempt 必须是数组（[{id, note}]）`);
    return exempt;
  }
  raw.forEach((item, index) => {
    if (!isObject(item) || typeof item.id !== 'string' || !item.id.trim()
      || typeof item.note !== 'string' || !item.note.trim()) {
      error(`extensions.${EXTENSION_NAME}.exempt[${index}] 必须是 { id, note } 且两者非空——豁免必须写明原因`);
      return;
    }
    exempt.set(item.id, item.note);
  });
  return exempt;
}

async function checkCoverage(config, kitModule, extConfig, registeredIds) {
  const exempt = parseExempt(extConfig);
  const { dir, source } = resolveManifestDir(config, kitModule, extConfig);
  const SUFFIX = '.manifest.generated.json';
  let entries;
  try {
    entries = await readdir(absProjectPath(dir));
  } catch (err) {
    const code = err && err.code ? err.code : String(err);
    if (source) {
      // 显式配置的对账面读不到 = 配置错误，fail closed——静默跳过会让待登记队列整体假绿
      error(`${source} 指向不可读目录：${dir}（${code}）——修正路径，或该模块确无 handoff 生成物时移除该配置`);
      return;
    }
    // 缺省回退路径只有 ENOENT（目录不存在 = 该模块未接 handoff 生成物）可静默跳过；
    // ENOTDIR / EACCES 等其余异常说明对账面状态异常，静默会假绿
    if (code === 'ENOENT') return;
    error(`缺省 manifestDir 读取异常：${dir}（${code}）——对账面不可用；修复该路径，或用 extensions.${EXTENSION_NAME}.manifestDir 显式指向生成物目录`);
    return;
  }
  const manifestIds = entries.filter((f) => f.endsWith(SUFFIX)).map((f) => f.slice(0, -SUFFIX.length)).sort();
  for (const id of manifestIds) {
    if (registeredIds.has(id) || exempt.has(id)) continue;
    warn(`待登记：${dir}/${id}${SUFFIX} 已进 handoff 体系，但未在 extensions.${EXTENSION_NAME}.screens 登记——实现落地后补 command + evidence；有意不做实现核对则加入 extensions.${EXTENSION_NAME}.exempt（附 note 说明原因）`);
  }
  for (const id of exempt.keys()) {
    if (registeredIds.has(id)) {
      warn(`exempt '${id}' 同时已在 screens 登记，豁免条目已失效，请删除`);
    } else if (!manifestIds.includes(id)) {
      warn(`exempt '${id}' 没有对应生成物（${dir}/${id}${SUFFIX}），豁免条目已失效，请删除`);
    }
  }
}

// ─── evidence 静态核对（config-only）─────────────────────────
// 轻量 shell-word lexer：把 command 切成「段（未引号的 && / ; / | / || 为界）× 词（空白为界）」。
// 单引号内原样；双引号内支持 \ 转义；未引号部分支持 \ 转义与引号进入。不做变量展开/globbing——
// 只为让 `node 'a b.js'` 这类带引号/空格的文件引用被正确识别，不是完整 shell 实现。
function lexCommandSegments(command) {
  const s = String(command);
  const segments = [];
  let words = [];
  let cur = '';
  let hasCur = false;
  let quote = null;
  const pushWord = () => { if (hasCur) { words.push(cur); cur = ''; hasCur = false; } };
  const pushSegment = () => { pushWord(); if (words.length > 0) segments.push(words); words = []; };
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote === "'") {
      if (ch === "'") { quote = null; } else { cur += ch; }
      continue;
    }
    if (quote === '"') {
      if (ch === '\\' && i + 1 < s.length) { cur += s[i + 1]; i++; continue; }
      if (ch === '"') { quote = null; continue; }
      cur += ch;
      continue;
    }
    if (ch === '\\' && i + 1 < s.length) { cur += s[i + 1]; hasCur = true; i++; continue; }
    if (ch === "'" || ch === '"') { quote = ch; hasCur = true; continue; }
    if (/\s/.test(ch)) { pushWord(); continue; }
    if (ch === ';') { pushSegment(); continue; }
    if (ch === '&' && s[i + 1] === '&') { pushSegment(); i++; continue; }
    if (ch === '|') { pushSegment(); if (s[i + 1] === '|') i++; continue; }
    cur += ch;
    hasCur = true;
  }
  pushSegment();
  return segments;
}

// 从 command 解析源文件：逐段跟踪 cd 前缀，段内带扩展名（首字母开头，排除 1.2.3 类版本号）
// 的词即文件候选。返回 { files, missing }——candidate 存在进 files，不存在进 missing：
// 「没有任何文件 token」（make target 等）与「显式引用的文件不存在」（改名/删除/路径拼错）必须区分，
// 后者静默跳过会让静态核对整体假绿。
async function resolveCommandFiles(command) {
  let cwd = PROJECT_ROOT;
  const files = [];
  const missing = [];
  for (const tokens of lexCommandSegments(command)) {
    if (tokens[0] === 'cd' && tokens[1]) {
      cwd = path.isAbsolute(tokens[1]) ? tokens[1] : path.join(cwd, tokens[1]);
      continue;
    }
    for (const token of tokens) {
      if (token.startsWith('-') || token.includes('://') || !/\.[A-Za-z][A-Za-z0-9]*$/.test(token)) continue;
      const candidate = path.isAbsolute(token) ? token : path.join(cwd, token);
      try {
        if ((await stat(candidate)).isFile()) files.push(candidate);
        else missing.push(path.relative(PROJECT_ROOT, candidate));
      } catch {
        missing.push(path.relative(PROJECT_ROOT, candidate));
      }
    }
  }
  return { files, missing };
}

// 归一化：剥转义反斜杠 + 去空白/引号——容忍源码里字符串换行拼接与引号转义
const normalizeForSource = (s) => s.replace(/\\/g, '').replace(/['"`\s]+/g, '');

async function staticEvidenceCheck(validatedScreens) {
  for (const item of validatedScreens) {
    if (!item || item.evidence.length === 0 || !item.matcher) continue;
    const { screen, evidence, matcher } = item;
    if (typeof screen.command !== 'string' || !screen.command.trim()) continue;
    const { files, missing } = await resolveCommandFiles(screen.command);
    if (missing.length > 0) {
      warn(`${screen.id}: command 引用的文件不存在：${missing.join(', ')}——测试文件改名/删除/路径拼错会让 evidence 永不核对；请修正 command`);
    }
    if (files.length === 0) continue; // 解析不出任何存在的源文件（如 make target），静态核对不适用
    let haystack = '';
    for (const file of files) {
      try { haystack += normalizeForSource(await readFile(file, 'utf8')); }
      catch { /* 读不到就少一份来源，不阻塞 */ }
    }
    if (!haystack) continue;
    for (const e of evidence) {
      const effectiveKey = e.match ?? matcher.key;
      if (effectiveKey === 'regex' || e.pattern != null) continue; // regex/pattern 语义面向运行输出，静态跳过
      if (!haystack.includes(normalizeForSource(e.name))) {
        warn(`${screen.id}: evidence '${e.name}' 未出现在测试源码（${files.map((f) => path.relative(PROJECT_ROOT, f)).join(', ')}）——测试改名会静默断链；改名请同步 config，动态拼接的用例名可为该条改用 regex matcher`);
      }
    }
  }
}

async function runCommand(command) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: PROJECT_ROOT,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk.toString(); });
    child.stderr.on('data', (chunk) => { output += chunk.toString(); });
    child.on('close', (code) => resolve({ code, output }));
    child.on('error', (err) => resolve({ code: 1, output: `spawn error: ${err.message}` }));
  });
}

async function loadConfig() {
  try {
    return await readJsonFile(CONFIG_PATH);
  } catch (err) {
    error(`无法读取 / 解析 ${CONFIG_PATH}: ${err && err.message}`);
    return null;
  }
}

async function validateScreen(screen) {
  if (!isObject(screen)) {
    error('screens[] 每项必须是 object');
    return null;
  }
  if (typeof screen.id !== 'string' || !screen.id.trim()) error('screens[] 缺少非空 id');
  if (typeof screen.manifest !== 'string' || !screen.manifest.trim()) error(`${screen.id || '?'}: 缺少 manifest 路径`);

  if (typeof screen.manifest !== 'string' || !screen.manifest.trim()) return null;
  if (!await fileExists(screen.manifest)) {
    error(`${screen.id || '?'}: manifest 不存在：${screen.manifest}`);
    return null;
  }

  let manifest;
  try {
    manifest = await readJsonFile(screen.manifest);
  } catch (err) {
    error(`${screen.id || '?'}: manifest 无法解析：${err && err.message}`);
    return null;
  }

  const manifestId = manifest?.screen?.id;
  if (typeof screen.id === 'string' && typeof manifestId === 'string' && screen.id !== manifestId) {
    error(`${screen.id}: config id 与 manifest screen.id 不一致（manifest=${manifestId}）`);
  }

  const matcher = resolveMatcher(screen.id || manifestId || '?', screen.matcher);

  const elements = Array.isArray(manifest.elements) ? manifest.elements : [];
  const manifestAnchors = new Set(elements.map((element) => element?.anchor).filter((anchor) => typeof anchor === 'string'));
  validateAnchorMap(screen.id || manifestId || '?', manifestAnchors, screen.anchors);
  const interactions = validateInteractions(screen.id || manifestId || '?', manifest, manifestAnchors);
  const { evidence, contractAnchors } = validateEvidence(screen, manifest, interactions, matcher);

  reports.push(`  ✓ ${screen.id}: anchors=${manifestAnchors.size} contracts=${contractAnchors.length} interactions=${interactions.length} evidence=${evidence.length}`);

  return { screen, evidence, matcher };
}

function evidenceHit(output, item, screenMatcher) {
  const matcher = item.match ? { key: item.match, ...MATCHERS[item.match] } : screenMatcher;
  const value = item.pattern ?? item.name;
  return matcher.matches(output, value);
}

async function executeEvidence(validatedScreens) {
  for (const item of validatedScreens) {
    if (!item || item.evidence.length === 0 || !item.matcher) continue;
    const { screen, evidence, matcher } = item;
    reports.push(`  · execute ${screen.id}: ${screen.command}`);
    const result = await runCommand(screen.command);
    if (result.code !== 0) {
      error(`${screen.id}: command 退出码 ${result.code}`);
      // 失败诊断：CI 上看不到本地终端，把子进程输出尾部带进 guard 日志，别让排障只剩一个退出码
      const tail = (result.output || '').split('\n').filter((l) => l.trim()).slice(-40);
      if (tail.length > 0) {
        reports.push(`      ┌ command 输出尾部（最后 ${tail.length} 行）：`);
        for (const line of tail) reports.push(`      │ ${line}`);
      }
    }
    // 匹配阶段防御：matcher 抛异常（如运行期才暴露的非法输入）转成 guard 级 FAIL，不裸崩
    const found = [];
    const errored = new Set();
    for (const e of evidence) {
      try {
        if (evidenceHit(result.output, e, matcher)) found.push(e);
      } catch (err) {
        errored.add(e);
        error(`${screen.id}: evidence '${e.name}' 匹配执行异常：${err && err.message}`);
      }
    }
    if (found.length === 0 && errored.size === 0) {
      if (IS_FLUTTER_ALIAS) {
        error(`${screen.id}: ${OUTPUT_LABEL}没有任何 evidence test name；请确认 command 使用 --reporter expanded`);
      } else {
        error(`${screen.id}: ${OUTPUT_LABEL}没有任何 evidence 命中；请确认 reporter 配置与 matcher '${matcher.key}' 匹配`);
      }
      continue;
    }
    for (const e of evidence) {
      if (!found.includes(e) && !errored.has(e)) {
        error(`${screen.id}: ${OUTPUT_LABEL}缺少 evidence${IS_FLUTTER_ALIAS ? ' test name' : ''}: ${e.name}`);
      }
    }
  }
}

async function main() {
  const config = await loadConfig();
  if (!config) return;

  // 多模块 profile：runner 经 DESIGN_SPEC_KIT_MODULE 传模块名；模块的 extensions 块整体覆盖顶层
  const moduleOverride = '';   // 沙箱手改位
  const kitModule = moduleOverride || globalThis.process?.env?.DESIGN_SPEC_KIT_MODULE || '';
  const moduleNode = kitModule ? (config.modules?.[kitModule] ?? {}) : null;
  const effectiveLayers = kitModule
    ? (Array.isArray(moduleNode.layers) && moduleNode.layers.length > 0 ? moduleNode.layers : config.kit?.layers)
    : config.kit?.layers;

  const enabled = Array.isArray(effectiveLayers) && effectiveLayers.includes(EXTENSION_NAME);
  if (!enabled) {
    reports.push(`  · ${EXTENSION_NAME} 未在 kit.layers 启用，跳过`);
    return;
  }

  const extConfig = kitModule
    ? (moduleNode.extensions?.[EXTENSION_NAME] ?? config.extensions?.[EXTENSION_NAME])
    : config.extensions?.[EXTENSION_NAME];
  if (!isObject(extConfig)) {
    error(`kit.layers 启用了 '${EXTENSION_NAME}'，但缺少 extensions.${EXTENSION_NAME} 配置块`);
    return;
  }
  if (!Array.isArray(extConfig.screens)) {
    error(`extensions.${EXTENSION_NAME}.screens 必须是数组`);
    return;
  }
  if (extConfig.screens.length === 0) {
    error(`extensions.${EXTENSION_NAME}.screens 为空；启用 extension 后至少声明一个 screen，或从 kit.layers 移除 '${EXTENSION_NAME}'`);
    return;
  }

  const validated = [];
  for (const screen of extConfig.screens) {
    validated.push(await validateScreen(screen));
  }
  // 待登记队列：manifest 已生成但 screens 未登记 → warning（execute 与 config-only 均报）
  if (errors.length === 0) {
    const registeredIds = new Set(
      extConfig.screens.filter(isObject).map((s) => s.id).filter((id) => typeof id === 'string' && id.trim()),
    );
    await checkCoverage(config, kitModule, extConfig, registeredIds);
  }
  if (EXECUTE_IMPL && errors.length === 0) {
    await executeEvidence(validated);
  } else if (!EXECUTE_IMPL) {
    reports.push(`  · config-only 模式：未执行 ${IMPL_LABEL}；需要实现核对时加 --execute-impl`);
    if (errors.length === 0) {
      await staticEvidenceCheck(validated);
    }
  }
}

await main();

console.log(`${EXTENSION_NAME}: errors ${errors.length} · warnings ${warnings.length}${EXECUTE_IMPL ? ' · execute-impl' : ' · config-only'}`);
for (const line of reports) console.log(line);
for (const warning of warnings) console.log(`  ⚠ ${warning}`);
for (const err of errors) console.log(`  ✗ ${err}`);

if (errors.length > 0) {
  console.log('\n修法：');
  console.log(`  1. 在 ${CONFIG_PATH} 中补齐 kit.layers 与 extensions.${EXTENSION_NAME}.screens[]。`);
  console.log('  2. 遵守默认 ValueKey(anchor)；只有旧 key 例外才写 anchors.<anchor>.byKey。');
  if (IS_FLUTTER_ALIAS) {
    console.log('  3. evidence 写 testWidgets 用例名，command 使用 flutter test --reporter expanded。');
  } else {
    console.log('  3. evidence 写测试用例名（或 {name, match, pattern}），command 的 reporter 满足所选 matcher 要求。');
  }
  if (warnings.length > 0) console.log(`WARNINGS: ${warnings.length}`);
  console.log('\nRESULT: FAIL');
  process.exitCode = 1;
} else {
  if (warnings.length > 0) console.log(`WARNINGS: ${warnings.length}`);
  console.log('\nRESULT: PASS');
}
⟦/FILE⟧

⟦FILE design-spec-kit/extensions/impl-visual/helpers/flutter/flutter_visual_contract.dart⟧
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Flutter visual contract helper template.
///
/// Copy this file into the adopting Flutter project's test helpers and adapt
/// surface extraction to the local design tokens when needed. The kit extension
/// treats project tests as the implementation authority.
Finder findByManifestAnchor(String anchor) => find.byKey(ValueKey<String>(anchor));

void expectAnchorVisible(String anchor) {
  expect(findByManifestAnchor(anchor), findsOneWidget);
}

void expectBackdropFilterPresent(String anchor) {
  final root = findByManifestAnchor(anchor);
  expect(root, findsOneWidget);
  expect(
    find.descendant(of: root, matching: find.byType(BackdropFilter)),
    findsWidgets,
  );
}

void expectAnimatedPresentationPresent(String anchor) {
  final root = findByManifestAnchor(anchor);
  expect(root, findsOneWidget);
  final animated = find.descendant(
    of: root,
    matching: find.byWidgetPredicate(
      (widget) =>
          widget is FadeTransition ||
          widget is SlideTransition ||
          widget is ScaleTransition ||
          widget is SizeTransition ||
          widget is AnimatedOpacity ||
          widget is AnimatedSlide ||
          widget is AnimatedScale ||
          widget is AnimatedContainer ||
          widget is AnimatedPositioned,
    ),
  );
  expect(animated, findsWidgets);
}

void expectDarkGlassSurface(
  String anchor, {
  double maxLuminance = 0.42,
  double minOpacity = 0.20,
}) {
  final color = _surfaceColor(anchor);
  expect(color, isNotNull, reason: 'No BoxDecoration color found under $anchor');
  expect(color!.a, greaterThanOrEqualTo(minOpacity));
  expect(color.computeLuminance(), lessThanOrEqualTo(maxLuminance));
  expectBackdropFilterPresent(anchor);
}

Future<void> expectThemeInvariantSurface({
  required WidgetTester tester,
  required Widget lightApp,
  required Widget darkApp,
  required String anchor,
  Future<void> Function(WidgetTester tester)? reveal,
}) async {
  await tester.pumpWidget(lightApp);
  await reveal?.call(tester);
  await tester.pump();
  final light = _surfaceSignature(anchor);

  await tester.pumpWidget(darkApp);
  await reveal?.call(tester);
  await tester.pump();
  final dark = _surfaceSignature(anchor);

  expect(dark, light);
}

Color? _surfaceColor(String anchor) {
  final root = findByManifestAnchor(anchor);
  final decorated = find.descendant(
    of: root,
    matching: find.byWidgetPredicate((widget) {
      if (widget is DecoratedBox && widget.decoration is BoxDecoration) {
        return (widget.decoration as BoxDecoration).color != null;
      }
      if (widget is Container && widget.decoration is BoxDecoration) {
        return (widget.decoration as BoxDecoration).color != null;
      }
      return false;
    }),
  );
  if (decorated.evaluate().isEmpty) return null;
  final widget = decorated.evaluate().first.widget;
  if (widget is DecoratedBox) {
    return (widget.decoration as BoxDecoration).color;
  }
  if (widget is Container) {
    return (widget.decoration as BoxDecoration).color;
  }
  return null;
}

String _surfaceSignature(String anchor) {
  final color = _surfaceColor(anchor);
  if (color == null) return 'missing';
  return [
    _componentSignature(color.a),
    _componentSignature(color.r),
    _componentSignature(color.g),
    _componentSignature(color.b),
  ].join(':');
}

String _componentSignature(double value) => value.toStringAsFixed(4);
⟦/FILE⟧

⟦FILE design-spec-kit/package.json⟧
{
  "name": "design-spec-kit",
  "version": "2.6.1",
  "private": true,
  "type": "module",
  "description": "设计纪律 + 还原交接套件（与平台无关）。guard 支持 node 直跑或无 shell 环境粘贴执行。",
  "scripts": {
    "check": "node tools/run-checks.js",
    "doctor": "node tools/kit-doctor.js",
    "bundle": "node tools/build-bundle.js",
    "bundle:check": "node tools/build-bundle.js --check",
    "ci": "node tools/ci-check.js",
    "hooks:install": "node tools/install-git-hooks.js"
  }
}
⟦/FILE⟧

⟦FILE design-spec-kit/tools/build-bundle.js⟧
#!/usr/bin/env node
/**
 * build-bundle.js · bundle 生成器（design-spec-kit · 与平台无关）
 *
 * node-only；沙箱用户逐个跑 guard 即可（bundle 生成不是沙箱场景，落位执行者是
 * bundle 的*消费方*而非生产方）。
 *
 * 守什么：`design-spec-kit.bundle.md` 是「整个 kit 塞进一个文件」的分发形态
 * （给只能逐个上传文件、没有 git 的环境）。它是**生成物**，源文件才是真相；
 * 本脚本从显式文件清单重新拼装 bundle，`--check` 模式校验磁盘 bundle 有没有
 * 落后于源（漂移 = FAIL），可挂 kit 仓 CI。
 *
 * 怎么跑（cwd 在哪里跑都行，脚本自己定位 kit 根）：
 *   node tools/build-bundle.js            重生 design-spec-kit.bundle.md
 *   node tools/build-bundle.js --check    只比对不写盘，不一致则 FAIL
 *
 * 配置说明：FILES 是★必改项——新增/改名文件后来这里补一行；bundle 头部的拆包
 * 指令文案也在下面，一并维护。
 * ═════════════════════════════════════════════════════════════*/

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// ─── 配置（新增/删除 kit 文件时★必改这里）──────────────────────
const args = [];   // 沙箱手改位（本文件 node-only，一般留空，走 process.argv）

// 根目录散件（相对 kit 根）——显式列出，不做目录扫描（bundle 内容要可审阅、可复核）。
const ROOT_FILES = [
  'README.md',
  'CLAUDE.template.md',
  'AI-BOOTSTRAP.md',
  'EXTENDING.md',
  'HANDOFF.md',
  'package.json',
  '.githooks/pre-commit',
];

// 目录扫描规则：进这些目录，按扩展名过滤，排除子路径含 _archive 的文件。
const DIR_RULES = [
  { dir: 'docs',  exts: ['.md', '.json'] },
  { dir: 'extensions', exts: ['.js', '.md', '.dart'] },
  { dir: 'tools', exts: ['.js'] },
];

const EXCLUDE_BASENAMES = new Set([
  'design-spec-kit.bundle.md',   // bundle 自身
  'distribution-prompt.txt',        // distribution prompt 单独发，不进 bundle 正文
  'CHANGELOG.md',                 // kit 自身日志不进实例包（VERSIONING.md 已声明）
]);
const EXCLUDE_SUFFIXES = ['.baseline.json'];
const isExcluded = (relPath) => {
  const base = path.basename(relPath);
  if (EXCLUDE_BASENAMES.has(base)) return true;
  if (EXCLUDE_SUFFIXES.some(suf => base.endsWith(suf))) return true;
  if (relPath.split('/').includes('_archive')) return true;
  return false;
};

const BUNDLE_FILENAME = 'design-spec-kit.bundle.md';
const VERSION_PIN_FILENAME = '.design-spec-kit.version';

const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);

// ─── 定位 kit 根 = 本脚本自身目录的上一级 ───────────────────────
const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const KIT_ROOT = path.resolve(SELF_DIR, '..');

// ─── 收集文件清单 ────────────────────────────────────────────
async function walkDir(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(path.join(KIT_ROOT, dir), { withFileTypes: true }); }
  catch { return out; }
  for (const ent of entries) {
    const rel = dir + '/' + ent.name;
    if (ent.isDirectory()) {
      out.push(...await walkDir(rel));
    } else {
      out.push(rel);
    }
  }
  return out;
}

async function collectFileList() {
  const list = [...ROOT_FILES];
  for (const rule of DIR_RULES) {
    const files = await walkDir(rule.dir);
    for (const f of files) {
      if (rule.exts.some(ext => f.toLowerCase().endsWith(ext)) && !isExcluded(f)) {
        list.push(f);
      }
    }
  }
  // 去重 + 排序（排序仅用于稳定输出，不代表分类）
  return [...new Set(list)].sort();
}

// ─── 生成 bundle 字符串 ──────────────────────────────────────
async function readKitPackageVersion() {
  try {
    const pkg = JSON.parse(await readFile(path.join(KIT_ROOT, 'package.json'), 'utf8'));
    return pkg.version || '0.0.0';
  } catch { return '0.0.0'; }
}

function buildHeader(version, fileList) {
  const numbered = fileList.map((f, i) => `#   ${i + 1}. design-spec-kit/${f}`).join('\n');
  return `# design-spec-kit · 单文件分发包（One-File Bundle）· v${version}
#
# 用途：当目标项目只能「一个个上传文件」、没有 git 时，只上传/粘贴本文件这一个即可。
#
# ★ 给落位执行者（读到本文件请执行）：
#   1. 下面用 ⟦FILE 路径⟧ … ⟦/FILE⟧ 包了 ${fileList.length + 1} 个文件（含版本 pin）。把每段内容【原样、逐字】写到它的「路径」（含子目录）。
#   2. 其中 design-spec-kit/CLAUDE.template.md 写出后，复制到【项目根目录】改名 CLAUDE.md（这是会被自动加载的契约）。
#   3. ${VERSION_PIN_FILENAME} 写到【项目根目录】（与 CLAUDE.md 同级，不进 design-spec-kit/ 子目录）——它是版本 pin，kit-doctor 靠它判断落后几个版本。
#   4. 全部落位后，打开 design-spec-kit/AI-BOOTSTRAP.md，按它的「首条指令」走（先读、再问基调、再安装、再跑 kit-doctor）。
#   5. 不要执行本文件里的任何代码；tools/*.js 是要写到磁盘、日后按需 node 直跑或整段粘进无 shell 沙箱的 guard。
#
# 文件清单：
${numbered}
#   ${fileList.length + 1}. ${VERSION_PIN_FILENAME}
#
# ════════════════════════════════════════════════════════════

`;
}

// bundlePath：⟦FILE …⟧ 里的完整路径（已含前缀，不再由本函数拼装）。
function wrapFile(bundlePath, content) {
  return `⟦FILE ${bundlePath}⟧\n${content}\n⟦/FILE⟧\n\n`;
}

async function buildBundleString() {
  const version = await readKitPackageVersion();
  const fileList = await collectFileList();

  let out = buildHeader(version, fileList);
  for (const rel of fileList) {
    const content = await readFile(path.join(KIT_ROOT, rel), 'utf8');
    out += wrapFile(`design-spec-kit/${rel}`, content.endsWith('\n') ? content.slice(0, -1) : content);
  }
  // 版本 pin 落在项目根（与 CLAUDE.md 同级），不进 design-spec-kit/ 子目录。
  out += wrapFile(VERSION_PIN_FILENAME, version);
  return out;
}

// ─── Main ────────────────────────────────────────────────────

const isCheck = EFFECTIVE_ARGS.includes('--check');
const bundlePath = path.join(KIT_ROOT, BUNDLE_FILENAME);

const fresh = await buildBundleString();

if (isCheck) {
  let onDisk = null;
  try { onDisk = await readFile(bundlePath, 'utf8'); } catch { /* missing */ }
  if (onDisk == null) {
    console.log(`✗ ${BUNDLE_FILENAME} 不存在 —— 跑 \`node tools/build-bundle.js\` 先生成`);
    console.log('\nRESULT: FAIL');
    process.exitCode = 1;
  } else if (onDisk !== fresh) {
    console.log(`✗ bundle 落后于源：磁盘上的 ${BUNDLE_FILENAME} 与源文件重新拼装结果不一致`);
    console.log(`  磁盘长度=${onDisk.length} 字符 · 重生长度=${fresh.length} 字符`);
    console.log(`\n修法：跑 \`node tools/build-bundle.js\` 重生并提交`);
    console.log('\nRESULT: FAIL');
    process.exitCode = 1;
  } else {
    console.log(`✓ ${BUNDLE_FILENAME} 与源文件一致，无漂移`);
    console.log('\nRESULT: PASS');
  }
} else {
  await writeFile(bundlePath, fresh);
  console.log(`✓ 已重生 ${bundlePath}`);
  console.log('\nRESULT: PASS');
}
⟦/FILE⟧

⟦FILE design-spec-kit/tools/check-changelog.js⟧
// ── 双环境运行时（design-spec-kit 标准头）────────────────────────
// 环境 A：无 shell 的 AI 沙箱 run_script——自带全局 readFile(p)/saveFile(p,c)/ls(dir)/log(...)，整段粘贴执行。
// 环境 B：本地 / CI node ≥18（kit package.json "type":"module"）——node tools/<本文件> [--flags]
// 约定：全文件禁顶层 import/export；node 能力只经此 shim。
if (typeof readFile !== 'function') {
  const fs = await import('node:fs/promises');
  const pathmod = await import('node:path');
  globalThis.readFile = (p) => fs.readFile(p, 'utf8');
  globalThis.saveFile = async (p, c) => { const d = pathmod.dirname(p); if (d && d !== '.') await fs.mkdir(d, { recursive: true }); await fs.writeFile(p, c); };
  globalThis.ls = (d) => fs.readdir(d || '.');
  globalThis.log = (...a) => console.log(...a);
  globalThis.__NODE__ = true;
}

/**
 * check-changelog.js · CHANGELOG 卫生防漂移扫描（design-spec-kit · 项目通用）
 *
 * 守什么：把「Changelog 维护」里可机判的约定变成 DoD 守卫（改 CHANGELOG 后必跑）：
 *   ❌ HARD FAIL  同一日期出现 >1 个 `## YYYY-MM-DD` 段（同日只能一段，命中就 append）。
 *   ⚠  WARN       文件总行数 > WARN_LINES → 把窗口外早期整段移到 _archive/CHANGELOG-YYYY-MM.md。
 *   ⚠  WARN       单条目子 bullet > MAX_SUB → 验尸报告化，细节分流到对应 doc（只点名，不 fail）。
 *   ⚠  WARN       模块索引一致性：条目在用但索引没登记的标签 / 索引里登记了却零使用的标签（只点名，不 fail）。
 * 怎么跑（双环境）：
 *   · AI 沙箱：read_file 本文件 → 整段粘进 run_script（自带 readFile/saveFile/ls/log）。
 *   · 本地 / CI：node tools/check-changelog.js（node ≥18）。无 baseline、无写盘（纯只读扫描）。
 *   看末行 `RESULT: PASS|FAIL`；只有 HARD FAIL 才 FAIL，WARN 不改退出码。
 * 配置说明：★必改项见「配置」区——CHANGELOG_PATH、（如索引写法不同）RE_INDEX_ITEM。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

async function readDesignSpecConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json')); }
  catch { return {}; }
}
const DESIGN_SPEC_CONFIG = await readDesignSpecConfig();
// ── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）：runner 经 DESIGN_SPEC_KIT_MODULE 传模块名 ──
const moduleOverride = '';   // 沙箱手改位：无 shell 粘贴执行时手填模块名
const KIT_MODULE = moduleOverride || globalThis.process?.env?.DESIGN_SPEC_KIT_MODULE || '';
const pickGuardCfg = (node) => node?.guards?.['check-changelog'] || node?.guards?.['check-changelog.js'] || {};
const MODULE_GUARD_CONFIG = KIT_MODULE ? pickGuardCfg(DESIGN_SPEC_CONFIG.modules?.[KIT_MODULE]) : {};
// key 级浅合并：模块键覆盖顶层公共缺省（数组整键替换，不做深合并）
const GUARD_CONFIG = KIT_MODULE ? { ...pickGuardCfg(DESIGN_SPEC_CONFIG), ...MODULE_GUARD_CONFIG } : pickGuardCfg(DESIGN_SPEC_CONFIG);
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位（本 guard 目前不消费 flag，保留占位以对齐标准约定）

const CHANGELOG_PATH = cfgValue('changelogPath', 'docs/CHANGELOG.md');   // ★ 你的 CHANGELOG 路径
const WARN_LINES = Number(cfgValue('warnLines', 200));   // 超过此行数 → 提示归档（留最近 ~2 会话日 / 超 ~200 行归档）
const MAX_SUB    = Number(cfgValue('maxSubItems', 3));     // 单条目允许的子 bullet 上限（1 行标题 + 最多 3 子 bullet）

// 模块索引：位于 `## 模块索引` 段内的清单行，形如 `- **标签** — 说明`；条目使用形如 `- [标签] 描述`。
// 索引项抽取正则：捕获组 1 = 标签名。★若你的索引写法不同（如无加粗），改这里。
const RE_INDEX_ITEM = /^-\s+\*\*([^*]+)\*\*/;   // 默认：- **标签** — …

const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);
void EFFECTIVE_ARGS;   // 对齐标准约定；本 guard 暂不按 flag 分支

// ─── 解析 ──────────────────────────────────────────────────────

const RE_DATE_H   = /^##\s+(\d{4}-\d{2}-\d{2})\b/;   // 真实日期段（## YYYY-MM-DD）
const RE_ANY_H2   = /^##\s+/;                         // 任意 H2（模块索引 / 约定段等）
const RE_INDEX_H2 = /^##\s+模块索引/;                 // 模块索引段标题
const RE_TOP_LI   = /^-\s+\S/;                        // 顶层条目（- 开头）
const RE_SUB_LI   = /^\s+-\s+\S/;                     // 子 bullet（缩进 - 开头）
const RE_ENTRY_TAG = /^-\s+\[([^\]]+)\]/;             // 条目标签：- [标签] …

let src = null;
try { src = await readFile(CHANGELOG_PATH); } catch { /* 缺文件，下面优雅 FAIL */ }
if (src === null) {
  log(`✗ 读不到 ${CHANGELOG_PATH} —— 项目还没建 changelog，或本文件顶部 CHANGELOG_PATH 配错。`);
  log(`修法：按 docs/CHANGELOG.template.md 建立 changelog，或改配置区路径后重跑。`);
  log(`\nRESULT: FAIL`);
  if (globalThis.__NODE__) process.exit(1);            // node：干净退出，不甩堆栈
  throw new Error('check-changelog: CHANGELOG 缺失（见上方修法提示）');  // 沙箱：中止后续执行
}
const lines = src.split('\n');
const totalLines = lines.length;

// 1) 重复同日段
const dateHits = {};   // date -> [lineNo,...]
lines.forEach((ln, i) => {
  const m = ln.match(RE_DATE_H);
  if (m) (dateHits[m[1]] = dateHits[m[1]] || []).push(i + 1);
});
const dupDates = Object.entries(dateHits).filter(([, ls]) => ls.length > 1);

// 2) 条目深度 + 条目标签集合：只扫真实日期段内的条目
const entries = [];    // {date, line, title, subCount}
const usedTags = new Map();   // 标签 -> 使用次数（条目实际在用）
let inDated = false, curDate = null, cur = null;
const pushCur = () => { if (cur) { entries.push(cur); cur = null; } };
lines.forEach((ln, i) => {
  const dm = ln.match(RE_DATE_H);
  if (dm) { pushCur(); inDated = true; curDate = dm[1]; return; }
  if (RE_ANY_H2.test(ln)) { pushCur(); inDated = false; curDate = null; return; }  // 非日期 H2（模块索引 / 约定段）
  if (!inDated) return;
  if (RE_TOP_LI.test(ln)) {
    pushCur();
    cur = { date: curDate, line: i + 1, title: ln.replace(/^-\s+/, '').replace(/\*\*/g, '').slice(0, 64), subCount: 0 };
    const tm = ln.match(RE_ENTRY_TAG);
    if (tm) { const t = tm[1].trim(); usedTags.set(t, (usedTags.get(t) || 0) + 1); }
  } else if (cur && RE_SUB_LI.test(ln)) {
    cur.subCount++;
  }
});
pushCur();

const fatEntries = entries.filter(e => e.subCount > MAX_SUB).sort((a, b) => b.subCount - a.subCount);

// 3) 模块索引：解析 `## 模块索引` 段内的清单行 → 索引登记的标签集合
const indexTags = new Set();
let inIndex = false;
for (const ln of lines) {
  if (RE_INDEX_H2.test(ln)) { inIndex = true; continue; }
  if (inIndex && RE_ANY_H2.test(ln)) { inIndex = false; continue; }   // 遇到下一个 H2 结束索引段
  if (!inIndex) continue;
  const im = ln.match(RE_INDEX_ITEM);
  if (im) indexTags.add(im[1].trim());
}
// 一致性对账（只在存在模块索引段时做；无索引段则跳过本维）
const hasIndexSection = lines.some(ln => RE_INDEX_H2.test(ln));
const usedNotIndexed = hasIndexSection ? [...usedTags.keys()].filter(t => !indexTags.has(t)) : [];
const indexedNotUsed = hasIndexSection ? [...indexTags].filter(t => !usedTags.has(t)) : [];

// ─── 报告 ──────────────────────────────────────────────────────

let fail = false;
log(`scanned ${CHANGELOG_PATH} · ${totalLines} 行 · ${entries.length} 条目 · ${Object.keys(dateHits).length} 个日期段 · 索引标签 ${indexTags.size}`);

// 重复同日段（HARD FAIL）
if (dupDates.length > 0) {
  fail = true;
  log(`\n✗ ${dupDates.length} 个日期出现重复 \`## YYYY-MM-DD\` 段（硬规则：同日只能一段）：`);
  for (const [d, ls] of dupDates) log(`    ${d}  ×${ls.length}  → 行 ${ls.join(', ')}`);
  log(`  修法：把这些段的条目合并到第一段（最上方那个），删掉多余 \`## ${dupDates[0][0]}\` 标题与其间的 \`---\` 分隔。`);
} else {
  log('✓ 同日合并：每个日期仅一段');
}

// 文件超长（WARN）
if (totalLines > WARN_LINES) {
  log(`\n⚠ 文件 ${totalLines} 行 > ${WARN_LINES} 行阈值 → 建议归档`);
  const dates = Object.keys(dateHits).sort();
  log(`    当前日期段（旧→新）：${dates.join(' · ')}`);
  log(`    把最旧的几段整段移到 _archive/CHANGELOG-YYYY-MM.md（原样保真），主文件留最近约 2 个会话日 + 底部「更早条目」链接。`);
} else {
  log(`✓ 文件长度：${totalLines} 行（≤ ${WARN_LINES}）`);
}

// 条目深度（WARN，只点名）
if (fatEntries.length > 0) {
  log(`\n⚠ ${fatEntries.length} 条条目子 bullet > ${MAX_SUB}（验尸报告化，细节该分流到对应 doc）：`);
  for (const e of fatEntries.slice(0, 8)) log(`    L${e.line}  [${e.date}]  ${e.subCount} bullets  ·  ${e.title}…`);
  if (fatEntries.length > 8) log(`    …还有 ${fatEntries.length - 8} 条`);
  log(`    深内容指向对应 doc，条目里只留一句话 + 指路。`);
} else {
  log(`✓ 条目深度：均 ≤ ${MAX_SUB} 子 bullet`);
}

// 模块索引一致性（WARN，只点名，不 FAIL）
if (!hasIndexSection) {
  log(`\nℹ 未发现 \`## 模块索引\` 段——跳过索引一致性维（如需启用，在 CHANGELOG 顶部加模块索引清单）。`);
} else if (usedNotIndexed.length === 0 && indexedNotUsed.length === 0) {
  log(`✓ 模块索引一致性：条目标签 ⊆ 索引，且索引无零使用项`);
} else {
  if (usedNotIndexed.length > 0) {
    log(`\n⚠ ${usedNotIndexed.length} 个标签条目在用但模块索引没登记：${usedNotIndexed.join(' · ')}`);
    log(`    修法：把它补进 \`## 模块索引\` 段（\`- **标签** — 说明\`），让筛选口径完整。`);
  }
  if (indexedNotUsed.length > 0) {
    log(`\n⚠ ${indexedNotUsed.length} 个索引标签零使用（可能已废弃 / 拼写不一致）：${indexedNotUsed.join(' · ')}`);
    log(`    修法：确认是否仍需要——废弃就从索引删，拼写不一致就与条目对齐。`);
  }
}

log(`\nRESULT: ${fail ? 'FAIL' : 'PASS'}`);
if (fail && globalThis.__NODE__) process.exitCode = 1;
⟦/FILE⟧

⟦FILE design-spec-kit/tools/check-deviation.js⟧
// ── 双环境运行时（design-spec-kit 标准头）────────────────────────
// 环境 A：无 shell 的 AI 沙箱 run_script——自带全局 readFile(p)/saveFile(p,c)/ls(dir)/log(...)，整段粘贴执行。
// 环境 B：本地 / CI node ≥18（kit package.json "type":"module"）——node tools/<本文件> [--flags]
// 约定：全文件禁顶层 import/export；node 能力只经此 shim。
if (typeof readFile !== 'function') {
  const fs = await import('node:fs/promises');
  const pathmod = await import('node:path');
  globalThis.readFile = (p) => fs.readFile(p, 'utf8');
  globalThis.saveFile = async (p, c) => { const d = pathmod.dirname(p); if (d && d !== '.') await fs.mkdir(d, { recursive: true }); await fs.writeFile(p, c); };
  globalThis.ls = (d) => fs.readdir(d || '.');
  globalThis.log = (...a) => console.log(...a);
  globalThis.__NODE__ = true;
}

/**
 * check-deviation.js · guard⑦ 偏离对账（design-spec-kit 还原交接层 · 与平台无关）
 *
 * 守什么（HANDOFF §2 的机读对账，精确边界如下——「实现落地了 delegated 却无回执」需 T1
 * 渲染树对账才能机判，不在本 guard 范围）：
 *   代码标记 ↔ 台账 双向硬对账 + 台账 ↔ manifest 屏引用校验 + delegated 待裁决队列摘要。
 *   产一张「缺口清单」——本 guard 的核心产物：让缺口一条命令可见。
 *
 *   ① IMPL_ROOTS 为空                                → FAIL（未配置扫描根，防假 PASS）
 *   ② 扫代码收标记（file:line + id/kind/basis）；basis 缺失单列 → FAIL
 *   ③ 解析台账 markdown 表（自动定位含 id / 状态 / 屏 列，容错空格）得 id→{status,screen}
 *   ④ 对账：
 *        · 代码有标记、台账无行            → FAIL「未申报」
 *        · 台账 open、代码无标记          → FAIL「幽灵条目」
 *        · 台账 收编/摘除，代码标记还在    → FAIL「该摘标」
 *        · 台账屏引用无对应 manifest       → FAIL「屏引用无效」（manifest 目录存在时才查）
 *   ⑤ manifest（目录存在时）：delegated status=open 计数 + contract_ref=TBD 计数 → WARN「待裁决队列」
 *
 * 怎么跑：
 *   · AI 沙箱：read_file 本文件 → 整段粘进 run_script（helper：readFile/ls/log）。
 *   · node/CI：node tools/check-deviation.js
 *   末行 `RESULT: PASS|FAIL`；FAIL 时 node 置退出码 1，并带「修法」提示。
 *
 * 配置：接手改下方「配置」区（★必改项已标注）。禁顶层 import/export（node:fs 只在标准头动态 import）。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

async function readDesignSpecConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json')); }
  catch { return {}; }
}
const DESIGN_SPEC_CONFIG = await readDesignSpecConfig();
// ── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）：runner 经 DESIGN_SPEC_KIT_MODULE 传模块名 ──
const moduleOverride = '';   // 沙箱手改位：无 shell 粘贴执行时手填模块名
const KIT_MODULE = moduleOverride || globalThis.process?.env?.DESIGN_SPEC_KIT_MODULE || '';
const pickGuardCfg = (node) => node?.guards?.['check-deviation'] || node?.guards?.['check-deviation.js'] || {};
const MODULE_GUARD_CONFIG = KIT_MODULE ? pickGuardCfg(DESIGN_SPEC_CONFIG.modules?.[KIT_MODULE]) : {};
// key 级浅合并：模块键覆盖顶层公共缺省（数组整键替换，不做深合并）
const GUARD_CONFIG = KIT_MODULE ? { ...pickGuardCfg(DESIGN_SPEC_CONFIG), ...MODULE_GUARD_CONFIG } : pickGuardCfg(DESIGN_SPEC_CONFIG);
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位：本 guard 无 flag，留空即可

// ★必改：实现代码扫描根（可跨目录）。空 = FAIL（防「没扫任何代码」的假 PASS）。
const IMPL_ROOTS = cfgArray('implRoots', []);
// 扫哪些扩展名（实现代码常见语言；按你的栈增删）
const IMPL_EXT = /\.(js|jsx|ts|tsx|dart|kt|swift|vue|svelte|html|go|py|rs|java|mm|m)$/i;
// 偏离台账路径（markdown，一行一条）
const LEDGER_PATH = cfgValue('ledgerPath', 'docs/DEVIATION-LEDGER.md');
// manifest 生成物目录（存在才读；用于「待裁决队列」摘要）
const MANIFEST_DIR = cfgValue('manifestDir', 'docs/manifests');
const MANIFEST_SUFFIX = '.manifest.generated.json';
// 整目录级 skip
const SKIP_DIRS = new Set(cfgArray('skipDirs', ['node_modules', 'dist', 'build', '.git', '_archive', 'uploads', 'vendor', 'drafts', 'export', 'coverage']));

// 偏离标记正则：匹配 @design-deviation( ... )，宽容解析 parens 内 key: value 对。
// 捕获组 1 = 括号内原文（后续按 key 逐个抠 id/kind/basis，容忍顺序 / 空格 / 换行 / 引号）。
const MARKER_RE = /@design-deviation\s*\(([^)]*)\)/g;

const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);
void EFFECTIVE_ARGS;   // 本 guard 暂无 flag 分支；保留统一形态

// 台账「收编 / 摘除」终态词（代码标记应已摘）。open 视为进行中。
const CLOSED_STATUSES = new Set(['收编', '摘除', 'reconciled', 'dropped']);
const OPEN_STATUSES = new Set(['open']);

// ─── 标记解析 ──────────────────────────────────────────────────

// 从括号内原文抠某个 key 的值：key: <value>，值取到逗号 / 结尾，去引号去空白。
function pickKey(body, key) {
  const re = new RegExp(key + '\\s*[:=]\\s*([^,]+)', 'i');
  const m = body.match(re);
  if (!m) return null;
  return m[1].trim().replace(/^['"]|['"]$/g, '').trim() || null;
}

function lineOf(src, idx) {
  let l = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++;
  return l;
}

// ─── 文件收集（递归 IMPL_ROOTS）────────────────────────────────

async function walk(dir, out) {
  let entries;
  try { entries = await ls(dir); } catch { return; }
  for (const name of entries || []) {
    const path = dir ? dir + '/' + name : name;
    if (IMPL_EXT.test(name)) out.push(path);
    else if (!name.includes('.') && !SKIP_DIRS.has(name)) await walk(path, out);
  }
}

// ─── 台账解析（自动定位含 id 与 状态 列的 markdown 表）─────────

// split 一行为 cell 数组（容错前后 | 与空格）
function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}
const isSep = (line) => /^\s*\|?\s*:?-{2,}/.test(line) && line.includes('-') && !/[0-9A-Za-z一-鿿]/.test(line.replace(/[-:|\s]/g, ''));

// 表头识别：id 列 + 状态/status 列（必需）+ 屏/screen 列（可选，用于 manifest 引用校验）。
function findCols(headerCells) {
  let idCol = -1, statusCol = -1, screenCol = -1;
  headerCells.forEach((h, i) => {
    const hl = h.toLowerCase();
    if (idCol < 0 && (hl === 'id' || hl.includes('id'))) idCol = i;
    if (statusCol < 0 && (h.includes('状态') || hl.includes('status'))) statusCol = i;
    if (screenCol < 0 && (h.includes('屏') || hl.includes('screen'))) screenCol = i;
  });
  return { idCol, statusCol, screenCol };
}

// 解析整份台账，返回 id -> { status, screen, line }。DEV-id 大小写归一为大写。
function parseLedger(src) {
  const lines = src.split('\n');
  const rows = new Map();
  let cols = null;

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.includes('|')) { cols = null; continue; }      // 跳出表 → 重置列定位
    const cells = splitRow(ln);
    if (isSep(ln)) continue;                                // 分隔行

    if (!cols) {                                            // 尚未锁定列 → 试作表头
      const c = findCols(cells);
      if (c.idCol >= 0 && c.statusCol >= 0) cols = c;
      continue;                                             // 表头本身不作数据行
    }

    // 数据行
    const idRaw = cells[cols.idCol] || '';
    const idm = idRaw.match(/DEV-[0-9]+/i);
    if (!idm) continue;                                     // 无合法 id 的行（模板占位 / 空行）跳过
    const id = idm[0].toUpperCase();
    const status = (cells[cols.statusCol] || '').trim();
    const screen = cols.screenCol >= 0 ? (cells[cols.screenCol] || '').trim() : '';
    rows.set(id, { status, screen, line: i + 1 });
  }
  return rows;
}

// ─── manifest 待裁决队列摘要 ───────────────────────────────────

async function manifestQueue() {
  let names;
  try { names = await ls(MANIFEST_DIR); } catch { return null; }
  if (!names) return null;
  const files = names.filter((n) => n.endsWith(MANIFEST_SUFFIX));
  let openDelegated = 0, tbd = 0;
  const screenIds = new Set();
  for (const f of files) {
    screenIds.add(f.slice(0, -MANIFEST_SUFFIX.length));                  // 文件名基底当兜底 id
    let m;
    try { m = JSON.parse(await readFile(`${MANIFEST_DIR}/${f}`)); } catch { continue; }
    if (m && m.screen && typeof m.screen.id === 'string') screenIds.add(m.screen.id);
    const del = (m && m.states && m.states.delegated) || [];
    if (!Array.isArray(del)) continue;
    for (const d of del) {
      if (d && d.status === 'open') openDelegated++;
      if (d && d.contract_ref === 'TBD') tbd++;
    }
  }
  return { files: files.length, openDelegated, tbd, screenIds };
}

// ─── Main（早退避免深嵌）───────────────────────────────────────

function fatal(lines) { for (const l of lines) log(l); log('\nRESULT: FAIL'); if (globalThis.__NODE__) process.exitCode = 1; }

async function main() {
  // ① 未配置扫描根 → FAIL（空根让「代码无标记」永远成立 = 假 PASS）
  if (!Array.isArray(IMPL_ROOTS) || IMPL_ROOTS.length === 0) {
    return fatal(['✗ IMPL_ROOTS 未配置——本 guard 不知道扫哪儿的代码',
      '  修法：在配置区把 IMPL_ROOTS 填成实现代码目录（★必改，可跨目录）。',
      '        空扫描根会让「代码无标记」永远成立，产生假 PASS——故直接 FAIL。']);
  }

  // ② 收集代码标记
  const files = [];
  for (const r of IMPL_ROOTS) await walk(r, files);
  const uniqFiles = [...new Set(files)];
  const markers = new Map();     // id -> { file, line, kind, basis }（同 id 取首个现场）
  const noBasis = [], noId = []; // basis 缺失 / 连 id 都抠不出的坏标记
  for (const f of uniqFiles) {
    let src;
    try { src = await readFile(f); } catch { continue; }
    let m; MARKER_RE.lastIndex = 0;
    while ((m = MARKER_RE.exec(src)) !== null) {
      const body = m[1], line = lineOf(src, m.index);
      const idRaw = pickKey(body, 'id');
      const idm = idRaw ? idRaw.match(/DEV-[0-9]+/i) : null;
      if (!idm) { noId.push({ file: f, line }); continue; }
      const id = idm[0].toUpperCase();
      const kind = pickKey(body, 'kind'), basis = pickKey(body, 'basis');
      if (!basis) noBasis.push({ id, file: f, line });
      if (!markers.has(id)) markers.set(id, { file: f, line, kind, basis });
    }
  }

  // ③ 解析台账
  let ledger = new Map(), ledgerReadOk = true;
  try { ledger = parseLedger(await readFile(LEDGER_PATH)); } catch { ledgerReadOk = false; }

  // ④ 三方对账 → 缺口清单
  const undeclared = [], ghosts = [], shouldUnmark = [];
  for (const [id, mk] of markers) if (!ledger.has(id)) undeclared.push({ id, file: mk.file, line: mk.line, kind: mk.kind });
  for (const [id, row] of ledger) {
    const hasMarker = markers.has(id);
    if (OPEN_STATUSES.has(row.status) && !hasMarker) ghosts.push({ id, line: row.line });
    if (CLOSED_STATUSES.has(row.status) && hasMarker) {
      const mk = markers.get(id);
      shouldUnmark.push({ id, status: row.status, ledgerLine: row.line, file: mk.file, line: mk.line });
    }
  }

  // ⑤ manifest：待裁决摘要 + 台账屏引用校验（manifest 目录存在且非空时才查）
  const queue = await manifestQueue();
  const badScreenRefs = [];
  if (queue && queue.files > 0) {
    for (const [id, row] of ledger) {
      if (row.screen && !queue.screenIds.has(row.screen)) badScreenRefs.push({ id, screen: row.screen, line: row.line });
    }
  }

  // ─── 报告 ───
  const gapCount = noBasis.length + noId.length + undeclared.length + ghosts.length + shouldUnmark.length + badScreenRefs.length;
  log(`scanned ${uniqFiles.length} files · ${markers.size} markers · ledger ${ledgerReadOk ? ledger.size + ' rows' : '读不到'} · gaps ${gapCount}`);
  if (!ledgerReadOk) log(`\n⚠ 台账读不到：${LEDGER_PATH}（视为空台账——凡有标记都会记「未申报」）`);
  if (queue) log(`\nℹ 待裁决队列（manifest ${queue.files} 份）：delegated open ${queue.openDelegated} · contract_ref=TBD ${queue.tbd}（随迭代评审收敛，非 FAIL）`);
  if (gapCount === 0) {
    log(`\n✓ check-deviation: 代码标记 ↔ 台账双向、台账 ↔ manifest 屏引用全部对齐，无缺口`);
    log(`\nRESULT: PASS`);
    return;
  }

  // 缺口清单（本 guard 核心产物）——数据驱动，每类一段
  log(`\n──── 缺口清单 ────`);
  const fmt = (x) => x.id
    ? `    ${x.id}${x.status ? '  [' + x.status + ']' : ''}${x.screen ? '  屏=' + x.screen : ''}  ${x.file ? x.file + ':' + x.line : '台账 L' + x.line}${x.kind ? '  kind=' + x.kind : ''}${x.ledgerLine ? '  台账 L' + x.ledgerLine : ''}`
    : `    ${x.file}:${x.line}`;
  for (const [title, arr] of [
    [`坏标记（抠不出 DEV-id）`, noId],
    [`缺 basis（写不出依据 = 摘除候选）`, noBasis],
    [`未申报（代码有标记、台账无行）`, undeclared],
    [`幽灵条目（台账 open、代码无标记）`, ghosts],
    [`该摘标（台账已 ${[...CLOSED_STATUSES].join('/')}、代码标记还在）`, shouldUnmark],
    [`屏引用无效（台账的屏在 manifest 里不存在）`, badScreenRefs],
  ]) {
    if (!arr.length) continue;
    log(`\n✗ ${title}：${arr.length}`);
    for (const x of arr) log(fmt(x));
  }

  return fatal([`\n修法：`,
    `  · 未申报 → 台账 ${LEDGER_PATH} 补一行（id/屏/anchor/kind/basis/状态=open）。`,
    `  · 幽灵条目 → 代码补 @design-deviation 标记（+ runtime anchor），或该条走「摘除」出口。`,
    `  · 该摘标 → 收编/摘除后须摘掉代码里的 @design-deviation 标与 runtime deviation anchor。`,
    `  · 缺 basis / 坏标记 → 补 basis:<契约或任务引用>，或直接摘除（写不出依据的偏离不留）。`,
    `  · 屏引用无效 → 修台账屏列的 screen-id 笔误，或给该屏补 manifest（屏还没进交接层就别在台账引用它）。`]);
}

await main();
⟦/FILE⟧

⟦FILE design-spec-kit/tools/check-ghost-classes.js⟧
// ── 双环境运行时（design-spec-kit 标准头）────────────────────────
// 环境 A：无 shell 的 AI 沙箱 run_script——自带全局 readFile(p)/saveFile(p,c)/ls(dir)/log(...)，整段粘贴执行。
// 环境 B：本地 / CI node ≥18（kit package.json "type":"module"）——node tools/<本文件> [--flags]
// 约定：全文件禁顶层 import/export；node 能力只经此 shim。
if (typeof readFile !== 'function') {
  const fs = await import('node:fs/promises');
  const pathmod = await import('node:path');
  globalThis.readFile = (p) => fs.readFile(p, 'utf8');
  globalThis.saveFile = async (p, c) => { const d = pathmod.dirname(p); if (d && d !== '.') await fs.mkdir(d, { recursive: true }); await fs.writeFile(p, c); };
  globalThis.ls = (d) => fs.readdir(d || '.');
  globalThis.log = (...a) => console.log(...a);
  globalThis.__NODE__ = true;
}

/**
 * check-ghost-classes.js · guard 幽灵类对账（design-spec-kit · 与平台无关）
 *
 * 守什么：使用面（页面 / 组件 / 脚本）引用、但在样式真源（CSS 定义面）零定义的
 *   class——「幽灵类」。类名拼错 / 引用了不存在的变体时样式静默回落基底，
 *   设计稿呈现即错、实现照抄错样（起源案例：`tag danger` 拼进 class，spec 只有
 *   `.tag.bad` → 回落 accent 蓝，双侧走样）。与 check-orphan-css 互为镜像：
 *   orphan = 定义了没人用；ghost = 用了没人定义。
 * 怎么跑：read_file 本文件 → 整段粘进 run_script（沙箱）；或 node tools/check-ghost-classes.js（本地 / CI）。
 *   helper：readFile / saveFile / ls / log。末行 `RESULT: PASS|FAIL`。
 * 配置说明：改下方「配置」区的 CSS_ROOTS / USAGE_ROOTS / BASELINE_PATH。
 *   首跑自动固化 baseline（= 存量幽灵类 / 语义锚点账本），之后只报**新增**；
 *   要把当前全部幽灵类重新固化 → args 设成 ['--write-baseline']。
 *
 * ⚠ 三个已知盲区（本 guard 测不到 / 可能误报，需人工复核）：
 *   ① JS 动态拼接：`'x-' + suffix` 拼出的整段跳过（非法 token 过滤），拼接产物
 *      若是幽灵类抓不到 —— 漏报方向，与 orphan 的误报方向相反。
 *   ② 语义钩子类：只当 JS querySelector 锚点、有意不带样式的类会被报 → 收 baseline
 *      并注明「纯锚点」。
 *   ③ 运行时注入：第三方库 / 框架在运行时挂的类静态扫不到定义 → 收 baseline。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

async function readDesignSpecConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json')); }
  catch { return {}; }
}
const DESIGN_SPEC_CONFIG = await readDesignSpecConfig();
// ── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）：runner 经 DESIGN_SPEC_KIT_MODULE 传模块名 ──
const moduleOverride = '';   // 沙箱手改位：无 shell 粘贴执行时手填模块名
const KIT_MODULE = moduleOverride || globalThis.process?.env?.DESIGN_SPEC_KIT_MODULE || '';
const pickGuardCfg = (node) => node?.guards?.['check-ghost-classes'] || node?.guards?.['check-ghost-classes.js'] || {};
const MODULE_GUARD_CONFIG = KIT_MODULE ? pickGuardCfg(DESIGN_SPEC_CONFIG.modules?.[KIT_MODULE]) : {};
// key 级浅合并：模块键覆盖顶层公共缺省（数组整键替换，不做深合并）
const GUARD_CONFIG = KIT_MODULE ? { ...pickGuardCfg(DESIGN_SPEC_CONFIG), ...MODULE_GUARD_CONFIG } : pickGuardCfg(DESIGN_SPEC_CONFIG);
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位。例：['--write-baseline'] 把当前全部幽灵类固化为新 baseline
const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);

// ① CSS 定义面（递归）：class 定义在哪。不存在的目录自动跳过。
const CSS_ROOTS  = cfgArray('cssRoots', ['styles', 'css', 'design-system']);
// ② 使用面（递归）：class 被谁引用。'.' 兜底扫根目录散件；不存在的自动跳过。
const USAGE_ROOTS = cfgArray('usageRoots', ['pages', 'src', 'components', '.']);
const USAGE_EXT  = /\.(html|js|jsx|ts|tsx|vue|svelte)$/i;
const CSS_EXT    = /\.(css|scss|less)$/i;

// 整目录级 skip（依赖 / 构建产物 / 归档 / 工具 / 草稿 / 版本库 —— 按你的项目增删）
const SKIP_DIRS  = new Set(cfgArray('skipDirs', ['node_modules', 'dist', 'build', '.git', '_archive', 'tools', 'uploads', 'vendor', 'drafts', 'export']));

// 模块模式 baseline 强制分账：不继承顶层 baselinePath（两模块混一本账 = 债无归属）
const BASELINE_PATH = KIT_MODULE
  ? (MODULE_GUARD_CONFIG.baselinePath || `docs/design-spec/baselines/${KIT_MODULE}/check-ghost-classes.baseline.json`)
  : cfgValue('baselinePath', 'tools/check-ghost-classes.baseline.json');
// 迁移防线：模块 baseline 缺失而旧全局 baseline 仍在 → FAIL，拒绝静默重建空债 baseline（= 历史债清零）
if (KIT_MODULE && !MODULE_GUARD_CONFIG.baselinePath) {
  const legacyBaseline = pickGuardCfg(DESIGN_SPEC_CONFIG).baselinePath || 'tools/check-ghost-classes.baseline.json';
  const fileExists = async (p) => { try { await readFile(p); return true; } catch { return false; } };
  if (!(await fileExists(BASELINE_PATH)) && (await fileExists(legacyBaseline))) {
    log(`✗ 模块 '${KIT_MODULE}' 无 baseline（${BASELINE_PATH}），但旧全局 baseline 仍在（${legacyBaseline}）`);
    log(`  多模块迁移须显式搬移该文件，或在 modules.${KIT_MODULE}.guards['check-ghost-classes'] 配 baselinePath`);
    log('RESULT: FAIL');
    if (globalThis.__NODE__) globalThis.process.exit(1);
    throw new Error('baseline migration required');
  }
}

// ─── 去注释（等长空白替换，保留位置方便行号反查）────────────────
const stripCss  = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
const stripHtml = s => s.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
const stripJs   = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
                       .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
const extOf     = p => p.slice(p.lastIndexOf('.')).toLowerCase();
const HTML_LIKE = new Set(['.html', '.vue', '.svelte']);
// HTML 类文件：剥 <!-- --> 之外，<script> 块内容再按 JS 剥注释（等长替换，行号不漂）
const stripScriptBlocks = s => s.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (_, open, body, close) => open + stripJs(body) + close);
const stripUsage = (s, ext) => HTML_LIKE.has(ext) ? stripScriptBlocks(stripHtml(s)) : stripJs(s);

function lineOf(src, idx) {
  let l = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++;
  return l;
}

// ─── CSS 解析（brace-aware：只从选择器位置取 class，与 check-orphan-css 同源）──
// 思路：去注释后逐字符扫，维护 brace 深度。深度 0 时累积「选择器段」文本，遇 `{` 时
// 从该段抽 `.class`；`{` 后进入声明体（跳过，声明里的 `.5` / url(a.png) 不误当定义）；
// @keyframes 帧名用 @keyframes 上下文跳过；@media / @supports 块内选择器靠深度正常收。
const CLASS_IN_SELECTOR = /\.(-?[A-Za-z_][\w-]*)/g;

function parseCssDefs(src, defs) {
  const s = stripCss(src);
  let depth = 0;
  let segStart = 0;
  let atKeyframesDepth = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') {
      const seg = s.slice(segStart, i);
      const trimmed = seg.trimStart();
      const isAtRule = trimmed.startsWith('@');
      const isKeyframes = /^@(-\w+-)?keyframes\b/i.test(trimmed);
      if (isKeyframes) {
        atKeyframesDepth = depth;
      } else if (atKeyframesDepth >= 0 && depth === atKeyframesDepth + 1) {
        // @keyframes 容器内的帧块，seg 是帧名（from/to/百分比），不抽 class
      } else if (!isAtRule) {
        let m; CLASS_IN_SELECTOR.lastIndex = 0;
        while ((m = CLASS_IN_SELECTOR.exec(seg)) !== null) defs.add(m[1]);
      }
      depth++;
      segStart = i + 1;
    } else if (ch === '}') {
      depth--;
      if (atKeyframesDepth >= 0 && depth === atKeyframesDepth) atKeyframesDepth = -1;
      segStart = i + 1;
    } else if (ch === ';' && depth === 0) {
      segStart = i + 1;
    }
  }
  return defs;
}

// ─── 收集文件 ──────────────────────────────────────────────────
async function walk(dir, out, extRe) {
  let entries;
  try { entries = await ls(dir); } catch { return; }
  if (!entries || entries.length === 0) return;
  for (const name of entries) {
    // '.' 根产出裸相对路径，与具体根（'pages' 等）产出的路径同形，collect 的 Set 才去得了重
    const path = (dir && dir !== '.') ? dir + '/' + name : name;
    if (extRe.test(name)) {
      out.push(path);
    } else if (!name.includes('.') && !SKIP_DIRS.has(name)) {
      await walk(path, out, extRe);
    }
  }
}

async function collect(roots, extRe) {
  const out = [];
  for (const r of roots) await walk(r, out, extRe);
  return [...new Set(out)];
}

// ─── 使用面 class 引用抽取 ─────────────────────────────────────
// 抽三类静态引用：class="..." 属性、className="..."（JSX 花括号包字符串也认）、
// classList.add/remove/toggle/contains/replace("...") 字符串字面量。
// 非法 token（含 $ + ' ` 等拼接痕迹）由 VALID 过滤——只判完整合法类名。
const VALID = /^-?[A-Za-z_][\w-]*$/;
const ATTR_RE  = /\bclass\s*=\s*(["'])([^"']*)\1/g;
const PROP_RE  = /\bclassName\s*=\s*[{]?\s*(["'])([^"']*)\1/g;
const LIST_RE  = /\bclassList\.(?:add|remove|toggle|contains|replace)\(([^)]*)\)/g;
const STR_RE   = /(["'])([^"']*)\1/g;

function harvestUses(src, file, addUse) {
  let m;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(src)) !== null) for (const t of m[2].split(/\s+/)) if (t && VALID.test(t)) addUse(t, file, m.index);
  PROP_RE.lastIndex = 0;
  while ((m = PROP_RE.exec(src)) !== null) for (const t of m[2].split(/\s+/)) if (t && VALID.test(t)) addUse(t, file, m.index);
  LIST_RE.lastIndex = 0;
  while ((m = LIST_RE.exec(src)) !== null) {
    let sm; STR_RE.lastIndex = 0;
    while ((sm = STR_RE.exec(m[1])) !== null) for (const t of sm[2].split(/\s+/)) if (t && VALID.test(t)) addUse(t, file, m.index);
  }
}

// ─── Baseline（仿 check-orphan-css）────────────────────────────
function keyOf(o) { return `${o.file}::${o.name}`; }

function baselineKeys(b) {
  const s = new Set();
  if (!b || !b.files) return s;
  for (const [f, arr] of Object.entries(b.files)) for (const e of arr) s.add(`${f}::${e.name}`);
  return s;
}

function buildBaseline(ghosts, reason) {
  const grouped = {};
  for (const o of ghosts) (grouped[o.file] = grouped[o.file] || []).push({ line: o.line, name: o.name });
  for (const f of Object.keys(grouped)) grouped[f].sort((a, b) => a.line - b.line || a.name.localeCompare(b.name));
  return {
    note: '已认证保留的幽灵类清单（存量 / 纯锚点 / 运行时注入类）——新增幽灵类应改代码而非扩容此表。',
    generatedAt: new Date().toISOString().slice(0, 10),
    reason: reason || 'baseline write',
    totalEntries: ghosts.length,
    files: grouped,
  };
}

// ─── Main（top-level await）────────────────────────────────────
const writeBaseline = EFFECTIVE_ARGS.includes('--write-baseline');

// 1) 定义面：样式真源里全部 class 定义（含 scss/less 的 .class 选择器）
const cssFiles = await collect(CSS_ROOTS, CSS_EXT);
const defs = new Set();
for (const f of cssFiles) {
  let src; try { src = await readFile(f); } catch { continue; }
  parseCssDefs(src, defs);
}

// 2) 使用面：逐文件抽 class 引用；HTML 类文件的 <style> 计入该文件局部定义
const usageFiles = await collect(USAGE_ROOTS, USAGE_EXT);
const ghosts = [];
let usedCount = 0;
for (const f of usageFiles) {
  let raw; try { raw = await readFile(f); } catch { continue; }
  const src = stripUsage(raw, extOf(f));
  const localDefs = new Set();
  if (HTML_LIKE.has(extOf(f))) {
    let sm; const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    while ((sm = styleRe.exec(src)) !== null) parseCssDefs(sm[1], localDefs);
  }
  const seen = new Set();   // 同文件同类名只报一次（首个出现位置）
  usedCount++;
  harvestUses(src, f, (name, file, idx) => {
    if (seen.has(name)) return;
    seen.add(name);
    if (!defs.has(name) && !localDefs.has(name)) ghosts.push({ name, file, line: lineOf(src, idx) });
  });
}
ghosts.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

log(`css defs: ${defs.size} classes (${cssFiles.length} files) · usage面: ${usedCount} files · ghosts: ${ghosts.length}`);

if (writeBaseline) {
  await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(ghosts, 'manual --write-baseline'), null, 2) + '\n');
  log(`✓ baseline rewritten: ${BASELINE_PATH} (${ghosts.length} entries)`);
  log(`\nRESULT: PASS`);
} else {
  let baseline = null;
  try { baseline = JSON.parse(await readFile(BASELINE_PATH)); } catch { /* no baseline */ }

  if (!baseline) {
    await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(ghosts, 'first run'), null, 2) + '\n');
    log(`✓ baseline created: ${BASELINE_PATH} (${ghosts.length} entries) — 复查后再跑一次进入 diff 模式`);
    log(`\nRESULT: PASS`);
  } else {
    const allowed = baselineKeys(baseline);
    const news    = ghosts.filter(o => !allowed.has(keyOf(o)));
    const removed = [...allowed].filter(k => !ghosts.some(o => keyOf(o) === k));

    log(`baseline: ${allowed.size} entries · removed: ${removed.length} · new: ${news.length}`);

    if (removed.length > 0) {
      log(`\n✓ ${removed.length} 处 baseline 幽灵类已消失（补了定义或删了引用，干得漂亮）`);
      for (const k of removed.slice(0, 20)) log('    cleared: ' + k);
      if (removed.length > 20) log(`    ... 还有 ${removed.length - 20} 处`);
      log(`  → 跑一次 args=['--write-baseline'] 同步 baseline\n`);
    }

    if (news.length > 0) {
      log(`\n✗ ${news.length} 处新增幽灵类（使用面引用了但样式真源零定义）：`);
      const byFile = {};
      for (const o of news) (byFile[o.file] = byFile[o.file] || []).push(o);
      for (const [f, arr] of Object.entries(byFile)) {
        log(`  ${f}`);
        for (const o of arr) log(`    L${o.line}  .${o.name}`);
      }
      log(`\n修法：`);
      log(`  1. 类名拼错 / 引用了不存在的变体 → 改成样式真源里已有的类。`);
      log(`  2. 确属新组件 / 新变体 → 先在样式真源定义再引用。`);
      log(`  3. 纯 JS 锚点类 / 运行时注入类 → 确认后 args=['--write-baseline'] 收编并注明原因。`);
      log(`\nRESULT: FAIL`);
      if (globalThis.__NODE__) process.exitCode = 1;
    } else if (removed.length === 0) {
      log('✓ check-ghost-classes: 0 新增 · 0 减少 · baseline 保持不变');
      log(`\nRESULT: PASS`);
    } else {
      log(`\nRESULT: PASS`);
    }
  }
}
⟦/FILE⟧

⟦FILE design-spec-kit/tools/check-i18n.js⟧
// ── 双环境运行时（design-spec-kit 标准头）────────────────────────
// 环境 A：无 shell 的 AI 沙箱 run_script——自带全局 readFile(p)/saveFile(p,c)/ls(dir)/log(...)，整段粘贴执行。
// 环境 B：本地 / CI node ≥18（kit package.json "type":"module"）——node tools/<本文件> [--flags]
// 约定：全文件禁顶层 import/export；node 能力只经此 shim。
if (typeof readFile !== 'function') {
  const fs = await import('node:fs/promises');
  const pathmod = await import('node:path');
  globalThis.readFile = (p) => fs.readFile(p, 'utf8');
  globalThis.saveFile = async (p, c) => { const d = pathmod.dirname(p); if (d && d !== '.') await fs.mkdir(d, { recursive: true }); await fs.writeFile(p, c); };
  globalThis.ls = (d) => fs.readdir(d || '.');
  globalThis.log = (...a) => console.log(...a);
  globalThis.__NODE__ = true;
}

/**
 * check-i18n.js · guard⑤ i18n 覆盖对账（design-spec-kit · 与平台无关）
 *
 * 守什么：i18n 覆盖性义务的三种漏项——
 *   ① 页面完整性：某页面文件没引用任何 i18n 运行时（漏挂 → 该页文案不走翻译）。
 *   ② 硬编码文案：代码里含 CJK 的字符串字面量、且该行没套翻译包裹器（近似判定，见下）。
 *   ③ 死键：词典里定义了、但全部使用面零出现的键（改版残留的死翻译键）。
 * 怎么跑：read_file 本文件 → 整段粘进 run_script（沙箱）；或 node tools/check-i18n.js（本地 / CI）。
 *   helper：readFile / saveFile / ls / log。末行 `RESULT: PASS|FAIL`。
 * 三维共用一个 baseline（tools/check-i18n.baseline.json，按维分组），机制仿 check-tokens：
 *   首跑固化现状，之后只报**新增**违规；args=['--write-baseline'] 重固化。
 *
 * ⚠ 前置：项目**没有 i18n 机制**（无运行时 / 无词典）则整个 guard 不装——不要空跑本文件。
 * ⚠ 维②是**启发式**：靠「行内是否出现包裹器名」近似判定，不做真正的 AST 作用域分析。
 *   常量表 / 日志 / 注释里的 CJK 可能误报；把这类文件排除出 CODE_ROOTS 或加 baseline。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

async function readDesignSpecConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json')); }
  catch { return {}; }
}
const DESIGN_SPEC_CONFIG = await readDesignSpecConfig();
// ── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）：runner 经 DESIGN_SPEC_KIT_MODULE 传模块名 ──
const moduleOverride = '';   // 沙箱手改位：无 shell 粘贴执行时手填模块名
const KIT_MODULE = moduleOverride || globalThis.process?.env?.DESIGN_SPEC_KIT_MODULE || '';
const pickGuardCfg = (node) => node?.guards?.['check-i18n'] || node?.guards?.['check-i18n.js'] || {};
const MODULE_GUARD_CONFIG = KIT_MODULE ? pickGuardCfg(DESIGN_SPEC_CONFIG.modules?.[KIT_MODULE]) : {};
// key 级浅合并：模块键覆盖顶层公共缺省（数组整键替换，不做深合并）
const GUARD_CONFIG = KIT_MODULE ? { ...pickGuardCfg(DESIGN_SPEC_CONFIG), ...MODULE_GUARD_CONFIG } : pickGuardCfg(DESIGN_SPEC_CONFIG);
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位。例：['--write-baseline'] 把当前三维违规固化为新 baseline
const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);

// ── 维① 页面完整性 ──
// 每个页面文件必须引用下列子串之一（引到 i18n 运行时才算挂上）。★必改：换成你项目的运行时文件名 / 模块名。
const PAGE_ROOTS = cfgArray('pageRoots', ['pages', 'src']);
const PAGE_EXT   = /\.(html|js|jsx|ts|tsx|vue|svelte)$/i;
const I18N_RUNTIME_HINTS = cfgArray('runtimeHints', ['i18n.js', 'i18n-dict']);   // ★必改
// 豁免页面（如纯静态 login 无文案）：白名单命中即跳过。豁免须在 CHANGELOG 记档（输出会提醒）。
const EXEMPT_PAGES = new Set(cfgArray('exemptPages', []));   // 例：'pages/login.html'

// ── 维② 硬编码文案 ──
// CODE_ROOTS 的 js/ts 文件去注释后，含 CJK 的字符串字面量、且该行不含任何包裹器名 → 违规。
const CODE_ROOTS   = cfgArray('codeRoots', ['src', 'pages']);
const CODE_EXT     = /\.(js|jsx|ts|tsx|mjs|cjs)$/i;
const WRAPPER_NAMES = cfgArray('wrapperNames', ['t(', 'I18N.t', 'tr(']);   // ★可改：你项目的翻译调用形态

// ── 维③ 死键 ──
// 词典文件里按 KEY_RE 抽键；键名在全部使用面（PAGE_ROOTS + CODE_ROOTS）零出现 → 死键。
// DICT_PATHS 配了但读不到 → FAIL（防呆：别把词典路径写错还静默 PASS）。
const DICT_PATHS = cfgArray('dictPaths', []);   // ★必改：例 ['src/i18n-dict.js']。留空 = 不查维③。
const KEY_RE     = /["']([\w.]+(?:\.[\w.]+)+)["']\s*:/g;   // ★按项目改：默认匹配 "a.b.c": 形态（含点的键路径）

// 整目录级 skip（依赖 / 构建产物 / 归档 / 工具 / 草稿 / 版本库）
const SKIP_DIRS = new Set(cfgArray('skipDirs', ['node_modules', 'dist', 'build', '.git', '_archive', 'tools', 'uploads', 'vendor', 'drafts', 'export']));

// 模块模式 baseline 强制分账：不继承顶层 baselinePath（两模块混一本账 = 债无归属）
const BASELINE_PATH = KIT_MODULE
  ? (MODULE_GUARD_CONFIG.baselinePath || `docs/design-spec/baselines/${KIT_MODULE}/check-i18n.baseline.json`)
  : cfgValue('baselinePath', 'tools/check-i18n.baseline.json');
// 迁移防线：模块 baseline 缺失而旧全局 baseline 仍在 → FAIL，拒绝静默重建空债 baseline（= 历史债清零）
if (KIT_MODULE && !MODULE_GUARD_CONFIG.baselinePath) {
  const legacyBaseline = pickGuardCfg(DESIGN_SPEC_CONFIG).baselinePath || 'tools/check-i18n.baseline.json';
  const fileExists = async (p) => { try { await readFile(p); return true; } catch { return false; } };
  if (!(await fileExists(BASELINE_PATH)) && (await fileExists(legacyBaseline))) {
    log(`✗ 模块 '${KIT_MODULE}' 无 baseline（${BASELINE_PATH}），但旧全局 baseline 仍在（${legacyBaseline}）`);
    log(`  多模块迁移须显式搬移该文件，或在 modules.${KIT_MODULE}.guards['check-i18n'] 配 baselinePath`);
    log('RESULT: FAIL');
    if (globalThis.__NODE__) globalThis.process.exit(1);
    throw new Error('baseline migration required');
  }
}

// ─── 去注释（保留位置，方便行号反查）──────────────────────────
const stripHtml = s => s.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
const stripJs   = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
                       .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
const extOf = p => p.slice(p.lastIndexOf('.')).toLowerCase();
const stripAny = (s, ext) => ext === '.html' || ext === '.vue' || ext === '.svelte' ? stripHtml(s) : stripJs(s);

function lineOf(src, idx) {
  let l = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++;
  return l;
}

// ─── 收集文件 ──────────────────────────────────────────────────
async function walk(dir, out, extRe) {
  let entries;
  try { entries = await ls(dir); } catch { return; }
  if (!entries || entries.length === 0) return;
  for (const name of entries) {
    const path = dir ? dir + '/' + name : name;
    if (extRe.test(name)) out.push(path);
    else if (!name.includes('.') && !SKIP_DIRS.has(name)) await walk(path, out, extRe);
  }
}
async function collect(roots, extRe) {
  const out = [];
  for (const r of roots) await walk(r, out, extRe);
  return [...new Set(out)];
}

// ─── 维① 页面完整性 ────────────────────────────────────────────
async function scanPages() {
  const hits = [];
  const files = await collect(PAGE_ROOTS, PAGE_EXT);
  for (const f of files) {
    if (EXEMPT_PAGES.has(f)) continue;
    let src; try { src = await readFile(f); } catch { continue; }
    const has = I18N_RUNTIME_HINTS.some(h => src.includes(h));
    if (!has) hits.push({ dim: 'page', file: f, line: 1, match: f });
  }
  return hits;
}

// ─── 维② 硬编码文案（启发式：含 CJK 字面量 + 该行无包裹器）────────
const CJK = /[㐀-鿿豈-﫿　-〿＀-￯]/;
const STR_LIT = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;

async function scanHardcoded() {
  const hits = [];
  const files = await collect(CODE_ROOTS, CODE_EXT);
  for (const f of files) {
    let src; try { src = await readFile(f); } catch { continue; }
    const cleaned = stripJs(src);
    const lines = cleaned.split('\n');
    let m; STR_LIT.lastIndex = 0;
    while ((m = STR_LIT.exec(cleaned)) !== null) {
      const lit = m[1] ?? m[2] ?? m[3] ?? '';
      if (!CJK.test(lit)) continue;
      const line = lineOf(cleaned, m.index);
      const lineText = lines[line - 1] || '';
      if (WRAPPER_NAMES.some(w => lineText.includes(w))) continue;   // 该行套了包裹器，放行
      hits.push({ dim: 'hardcoded', file: f, line, match: lit.slice(0, 40) });
    }
  }
  return hits;
}

// ─── 维③ 死键 ──────────────────────────────────────────────────
// 返回 { hits, dictError }。dictError = 配了 DICT_PATHS 但某个读不到（防呆 → FAIL）。
async function scanDeadKeys() {
  const hits = [];
  let dictError = null;
  if (DICT_PATHS.length === 0) return { hits, dictError };

  const keys = [];   // { key, file, line }
  for (const dp of DICT_PATHS) {
    let src;
    try { src = await readFile(dp); } catch { dictError = dp; continue; }
    const cleaned = stripJs(src);
    let m; KEY_RE.lastIndex = 0;
    while ((m = KEY_RE.exec(cleaned)) !== null) keys.push({ key: m[1], file: dp, line: lineOf(cleaned, m.index) });
  }
  if (dictError) return { hits, dictError };

  // 使用面 = PAGE_ROOTS + CODE_ROOTS 全部文件（去注释后拼一大袋），排除词典本身避免自命中。
  const usageFiles = [
    ...await collect(PAGE_ROOTS, PAGE_EXT),
    ...await collect(CODE_ROOTS, CODE_EXT),
  ].filter(f => !DICT_PATHS.includes(f));
  const blobs = [];
  for (const f of [...new Set(usageFiles)]) {
    let src; try { src = await readFile(f); } catch { continue; }
    blobs.push(stripAny(src, extOf(f)));
  }
  const bigUsage = blobs.join('\n');

  for (const k of keys) {
    const esc = k.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(esc).test(bigUsage)) hits.push({ dim: 'deadkey', file: k.file, line: k.line, match: k.key });
  }
  return { hits, dictError };
}

// ─── Baseline（三维分组，仿 check-tokens）────────────────────────
function keyOf(h) { return `${h.dim}::${h.file}::${h.match}`; }

function baselineKeys(b) {
  const s = new Set();
  if (!b || !b.dims) return s;
  for (const [dim, files] of Object.entries(b.dims)) {
    for (const [f, arr] of Object.entries(files)) for (const e of arr) s.add(`${dim}::${f}::${e.match}`);
  }
  return s;
}

function buildBaseline(hits, reason) {
  const dims = {};
  for (const h of hits) {
    const d = dims[h.dim] = dims[h.dim] || {};
    (d[h.file] = d[h.file] || []).push({ line: h.line, match: h.match });
  }
  for (const dim of Object.keys(dims))
    for (const f of Object.keys(dims[dim]))
      dims[dim][f].sort((a, b) => a.line - b.line || a.match.localeCompare(b.match));
  return {
    note: '已认证保留的 i18n 覆盖违规清单（按 page/hardcoded/deadkey 三维分组）。新增违规须修代码或显式加到这里。',
    generatedAt: new Date().toISOString().slice(0, 10),
    reason: reason || 'baseline write',
    totalEntries: hits.length,
    dims,
  };
}

// ─── Main（top-level await）────────────────────────────────────
const writeBaseline = EFFECTIVE_ARGS.includes('--write-baseline');

const [pageHits, hardHits, deadRes] = await Promise.all([scanPages(), scanHardcoded(), scanDeadKeys()]);
const allHits = [...pageHits, ...hardHits, ...deadRes.hits];

log(`i18n · page漏挂: ${pageHits.length} · 硬编码: ${hardHits.length} · 死键: ${deadRes.hits.length}${deadRes.dictError ? ' · 词典读取失败!' : ''}`);

// 防呆：DICT_PATHS 配了但读不到 → 直接 FAIL，不进 baseline 逻辑（否则等于静默放过）
if (deadRes.dictError) {
  log(`\n✗ 维③防呆：DICT_PATHS 里的词典读不到 → ${deadRes.dictError}`);
  log(`  修法：改对 DICT_PATHS 路径；确实移除了词典 → 把该条从 DICT_PATHS 删掉。`);
  log(`\nRESULT: FAIL`);
  if (globalThis.__NODE__) process.exitCode = 1;
} else if (writeBaseline) {
  await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(allHits, 'manual --write-baseline'), null, 2) + '\n');
  log(`✓ baseline rewritten: ${BASELINE_PATH} (${allHits.length} entries)`);
  log(`\nRESULT: PASS`);
} else {
  let baseline = null;
  try { baseline = JSON.parse(await readFile(BASELINE_PATH)); } catch { /* no baseline */ }

  if (!baseline) {
    await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(allHits, 'first run'), null, 2) + '\n');
    log(`✓ baseline created: ${BASELINE_PATH} (${allHits.length} entries) — 复查后再跑一次进入 diff 模式`);
    log(`\nRESULT: PASS`);
  } else {
    const allowed = baselineKeys(baseline);
    const news    = allHits.filter(h => !allowed.has(keyOf(h)));
    const removed = [...allowed].filter(k => !allHits.some(h => keyOf(h) === k));

    log(`baseline: ${allowed.size} entries · removed: ${removed.length} · new: ${news.length}`);

    if (removed.length > 0) {
      log(`\n✓ ${removed.length} 处 baseline 违规已消失（干得漂亮）`);
      for (const k of removed.slice(0, 20)) log('    cleared: ' + k);
      if (removed.length > 20) log(`    ... 还有 ${removed.length - 20} 处`);
      log(`  → 跑一次 args=['--write-baseline'] 同步 baseline\n`);
    }

    if (news.length > 0) {
      const label = { page: '页面漏挂 i18n 运行时', hardcoded: '硬编码 CJK 文案', deadkey: '词典死键' };
      log(`\n✗ ${news.length} 处新增 i18n 覆盖违规：`);
      const byDim = {};
      for (const h of news) (byDim[h.dim] = byDim[h.dim] || []).push(h);
      for (const [dim, arr] of Object.entries(byDim)) {
        log(`  [${label[dim] || dim}]`);
        for (const h of arr) log(`    ${h.file}:L${h.line}  ${h.match}`);
      }
      log(`\n修法：`);
      log(`  1. 页面漏挂 → 引入 i18n 运行时（${I18N_RUNTIME_HINTS.join(' / ')}）；纯静态无文案页 → 加 EXEMPT_PAGES 并在 CHANGELOG 记档。`);
      log(`  2. 硬编码文案 → 抽进词典改走包裹器（${WRAPPER_NAMES.join(' / ')}）；常量 / 日志误报 → 排除该文件或加 baseline。`);
      log(`  3. 死键 → 删掉没人用的翻译键；确要保留 → args=['--write-baseline'] 并记档。`);
      log(`\nRESULT: FAIL`);
      if (globalThis.__NODE__) process.exitCode = 1;
    } else if (removed.length === 0) {
      log('✓ check-i18n: 0 新增 · 0 减少 · baseline 保持不变');
      log(`\nRESULT: PASS`);
    } else {
      log(`\nRESULT: PASS`);
    }
  }
}
⟦/FILE⟧

⟦FILE design-spec-kit/tools/check-icons.js⟧
// ── 双环境运行时（design-spec-kit 标准头）────────────────────────
// 环境 A：无 shell 的 AI 沙箱 run_script——自带全局 readFile(p)/saveFile(p,c)/ls(dir)/log(...)，整段粘贴执行。
// 环境 B：本地 / CI node ≥18（kit package.json "type":"module"）——node tools/<本文件> [--flags]
// 约定：全文件禁顶层 import/export；node 能力只经此 shim。
if (typeof readFile !== 'function') {
  const fs = await import('node:fs/promises');
  const pathmod = await import('node:path');
  globalThis.readFile = (p) => fs.readFile(p, 'utf8');
  globalThis.saveFile = async (p, c) => { const d = pathmod.dirname(p); if (d && d !== '.') await fs.mkdir(d, { recursive: true }); await fs.writeFile(p, c); };
  globalThis.ls = (d) => fs.readdir(d || '.');
  globalThis.log = (...a) => console.log(...a);
  globalThis.__NODE__ = true;
}

/**
 * check-icons.js · 图标同名异形 + 同形重画防漂移扫描（design-spec-kit · 与平台无关）
 *
 * 守什么：图标单一源纪律——一个 icons 库，勿 per-file 各画一版、也勿把库里的字形 inline 复制粘贴。
 *   两类漂移都抓：
 *     ❌ drift      同一图标名 ≥2 版不同字形（真问题）——同名异形。它让图标长相飘，还卡住「按名抽取」的 icon-gen。
 *     ❌ duplicate  registry 里注册过的字形被某文件 inline `<svg>` 复制（同形重画 · 走 baseline）。
 *     ℹ shared     同名跨 ≥2 文件但字形一致（DRY 信号：该提进单一图标库）。
 * 怎么跑（双环境）：
 *   · AI 沙箱：read_file 本文件 → 整段粘进 run_script（自带 readFile/saveFile/ls/log）。
 *   · 本地 / CI：node tools/check-icons.js [--write-baseline]（node ≥18）。
 *   看末行 `RESULT: PASS|FAIL`；FAIL 时 node 侧给退出码 1。
 * 配置说明：★必改项见「配置」区——SCAN_ROOTS、REGISTRY_SOURCES、DEF_PATTERNS（按项目图标写法启用）。
 *
 * 解决纪律（重要）：**绝不静默选一个 winner**——同形漂移收敛到 canonical；同名但语义不同 → **改名**让两者各有其名，
 *   别合并丢字形。即便两版碰巧也异形，先分清「同义漂移」还是「同名异义」：异义必改名，别按 trivial 收敛合并。
 * 假 PASS 防线：若配了 REGISTRY_SOURCES 却抽到 0 条定义 → 直接 FAIL（DEF_PATTERNS 没适配本项目写法）。
 *   baseline：tools/check-icons.baseline.json 记「已认证保留」的同形重画（duplicate），首跑固化、之后只报新增。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

async function readDesignSpecConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json')); }
  catch { return {}; }
}
const DESIGN_SPEC_CONFIG = await readDesignSpecConfig();
// ── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）：runner 经 DESIGN_SPEC_KIT_MODULE 传模块名 ──
const moduleOverride = '';   // 沙箱手改位：无 shell 粘贴执行时手填模块名
const KIT_MODULE = moduleOverride || globalThis.process?.env?.DESIGN_SPEC_KIT_MODULE || '';
const pickGuardCfg = (node) => node?.guards?.['check-icons'] || node?.guards?.['check-icons.js'] || {};
const MODULE_GUARD_CONFIG = KIT_MODULE ? pickGuardCfg(DESIGN_SPEC_CONFIG.modules?.[KIT_MODULE]) : {};
// key 级浅合并：模块键覆盖顶层公共缺省（数组整键替换，不做深合并）
const GUARD_CONFIG = KIT_MODULE ? { ...pickGuardCfg(DESIGN_SPEC_CONFIG), ...MODULE_GUARD_CONFIG } : pickGuardCfg(DESIGN_SPEC_CONFIG);
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位。例：['--write-baseline'] 把当前 duplicate 固化为新 baseline

const SCAN_ROOTS = cfgArray('scanRoots', ['src', 'components', 'pages', 'assets', 'design-system']);
const SKIP_DIRS  = new Set(cfgArray('skipDirs', ['node_modules', 'dist', 'build', '.git', '_archive', 'tools', 'uploads', 'vendor', 'drafts', 'export']));
const CODE_EXT   = /\.(js|jsx|ts|tsx|vue|svelte|html)$/i;

// ① registry 源文件 = 项目「单一图标库」的真源文件（★按项目填）。用于同形重画维：
//    这些文件里的字形被别处 inline 复制 = duplicate。留空数组 = 关闭同形重画维（只跑同名异形）。
const REGISTRY_SOURCES = cfgArray('registrySources', []);   // 例：['src/icons/registry.js']

// 故意保留的同名异形例外（如特色 / 动画版与标准版并存）：填 'name' 跳过。
const IGNORE = new Set(cfgArray('ignore', []));

// ② 图标定义抽取（线性正则，避免回溯）：捕获组 1 = 名，组 2 = 字形。★按项目图标写法启用需要的行。
const DEF_PATTERNS = [
  /([a-zA-Z][\w-]*)\s*:\s*svg\('([^']*)'(?:\s*,\s*[\d.]+)?\)/g,   // name: svg('...')            helper 包裹
  /([a-zA-Z][\w-]*)\s*:\s*'(<svg[^']*)'/g,                        // name: '<svg ...>'           内联整段
  /([a-zA-Z][\w-]*)\s*:\s*\{\s*s\s*:\s*[\d.]+\s*,\s*p\s*:\s*'([^']*)'\s*\}/g, // name: { s: <n>, p: '<path .../>' }  对象式（按项目启用）
];

// 模块模式 baseline 强制分账：不继承顶层 baselinePath（两模块混一本账 = 债无归属）
const BASELINE_PATH = KIT_MODULE
  ? (MODULE_GUARD_CONFIG.baselinePath || `docs/design-spec/baselines/${KIT_MODULE}/check-icons.baseline.json`)
  : cfgValue('baselinePath', 'tools/check-icons.baseline.json');
// 迁移防线：模块 baseline 缺失而旧全局 baseline 仍在 → FAIL，拒绝静默重建空债 baseline（= 历史债清零）
if (KIT_MODULE && !MODULE_GUARD_CONFIG.baselinePath) {
  const legacyBaseline = pickGuardCfg(DESIGN_SPEC_CONFIG).baselinePath || 'tools/check-icons.baseline.json';
  const fileExists = async (p) => { try { await readFile(p); return true; } catch { return false; } };
  if (!(await fileExists(BASELINE_PATH)) && (await fileExists(legacyBaseline))) {
    log(`✗ 模块 '${KIT_MODULE}' 无 baseline（${BASELINE_PATH}），但旧全局 baseline 仍在（${legacyBaseline}）`);
    log(`  多模块迁移须显式搬移该文件，或在 modules.${KIT_MODULE}.guards['check-icons'] 配 baselinePath`);
    log('RESULT: FAIL');
    if (globalThis.__NODE__) globalThis.process.exit(1);
    throw new Error('baseline migration required');
  }
}

const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);

// ─── 扫描工具 ──────────────────────────────────────────────────

// 字形规范化：去 <svg> 外壳、去空白、引号统一为单引号、转小写——同形比对的判据
const norm = s => String(s)
  .replace(/<svg[^>]*>/i, '').replace(/<\/svg>/i, '')
  .replace(/"/g, "'")
  .replace(/\s+/g, '')
  .toLowerCase();

const baseName = p => p.replace(/^.*\//, '');

async function walk(dir, out) {
  let e; try { e = await ls(dir); } catch { return; }
  for (const n of e || []) {
    const p = dir ? dir + '/' + n : n;
    if (CODE_EXT.test(n)) out.push(p);
    else if (!n.includes('.') && !SKIP_DIRS.has(n)) await walk(p, out);
  }
}

// 从一段源码抽出所有图标定义 [{name, sig}]
function extractDefs(src) {
  const defs = [];
  for (const re of DEF_PATTERNS) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(src)) !== null) {
      const sig = norm(m[2]);
      if (sig) defs.push({ name: m[1], sig });
    }
  }
  return defs;
}

function lineOf(src, idx) { let l = 1; for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++; return l; }

// ─── 收集 ──────────────────────────────────────────────────────

const files = []; for (const r of SCAN_ROOTS) await walk(r, files);
const scanFiles = [...new Set(files)];
const contents = await Promise.all(scanFiles.map(async f => ({ f, s: await readFile(f).catch(() => '') })));

// ─── 维一：同名异形（drift） / 同名同形跨文件（shared）──────────

// name -> sig -> Set(fileBaseName)
const map = {};
let totalDefs = 0;
for (const { f, s } of contents) {
  for (const { name, sig } of extractDefs(s)) {
    totalDefs++;
    (map[name] = map[name] || {});
    (map[name][sig] = map[name][sig] || new Set()).add(baseName(f));
  }
}

// ─── 维二：同形重画（duplicate）—— registry 字形被 inline 复制 ──

// 从 REGISTRY_SOURCES 抽注册字形：sig -> name
const registrySigs = new Map();
let registryDefs = 0;
for (const src of REGISTRY_SOURCES) {
  const s = await readFile(src).catch(() => '');
  for (const { name, sig } of extractDefs(s)) { registrySigs.set(sig, name); registryDefs++; }
}

// 扫描文件里的 inline <svg>...</svg>；内容 norm 后命中 registry 字形 = duplicate
const RE_INLINE_SVG = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
const dupHits = [];   // {file, line, name}
if (registrySigs.size > 0) {
  const registryBaseSet = new Set(REGISTRY_SOURCES.map(baseName));
  for (const { f, s } of contents) {
    if (registryBaseSet.has(baseName(f))) continue;   // registry 文件自身不算复制
    RE_INLINE_SVG.lastIndex = 0; let m;
    while ((m = RE_INLINE_SVG.exec(s)) !== null) {
      const sig = norm(m[0]);
      if (registrySigs.has(sig)) dupHits.push({ file: f, line: lineOf(s, m.index), name: registrySigs.get(sig) });
    }
  }
}

// ─── 报告 ──────────────────────────────────────────────────────

const names = Object.keys(map).sort();
const drift = [], shared = [];
for (const n of names) {
  if (IGNORE.has(n)) continue;
  const sigs = Object.keys(map[n]);
  const fileSet = new Set(); for (const sg of sigs) for (const x of map[n][sg]) fileSet.add(x);
  if (sigs.length >= 2) drift.push([n, sigs.length, sigs.map(sg => [...map[n][sg]].join('+'))]);
  else if (fileSet.size >= 2) shared.push([n, fileSet.size]);
}

log(`scanned ${contents.length} files · ${names.length} icon names · ${totalDefs} defs · drift ${drift.length} · shared(dup) ${shared.length}`);

let fail = false;

// 假 PASS 防线：配了 registry 却抽到 0 条定义 → DEF_PATTERNS 没适配
if (REGISTRY_SOURCES.length > 0 && registryDefs === 0) {
  fail = true;
  log(`\n✗ 配了 REGISTRY_SOURCES（${REGISTRY_SOURCES.length} 个源文件）却抽到 0 条图标定义：`);
  log(`  → DEF_PATTERNS 未适配本项目图标写法。核对 registry 里图标是怎么写的，改 DEF_PATTERNS 的捕获组（1=名 / 2=字形）。`);
  log(`  （registry 抽不到 = 同形重画维形同虚设，不能假装 PASS。）`);
}

if (drift.length) {
  fail = true;
  log(`\n✗ 同名异形（收敛到 canonical；语义不同则改名——绝不静默选 winner）：`);
  for (const [n, c, grps] of drift) log(`  ${n}: ${c} 版 → ${grps.join('  |  ')}`);
}

// 同形重画 → baseline diff（duplicate）
const writeBaseline = EFFECTIVE_ARGS.includes('--write-baseline');
function dupKey(h) { return `${h.file}::${h.name}`; }
function buildBaseline(hits) {
  const grouped = {};
  for (const h of hits) (grouped[h.file] = grouped[h.file] || []).push({ line: h.line, name: h.name });
  for (const f of Object.keys(grouped)) grouped[f].sort((a, b) => a.line - b.line || a.name.localeCompare(b.name));
  return {
    note: '已认证保留的图标同形重画（registry 字形被 inline 复制）清单。新增需改用图标库引用或显式加到这里。',
    generatedAt: new Date().toISOString().slice(0, 10),
    totalEntries: hits.length,
    files: grouped,
  };
}
function baselineKeys(b) {
  const s = new Set();
  if (!b || !b.files) return s;
  for (const [f, arr] of Object.entries(b.files)) for (const e of arr) s.add(`${f}::${e.name}`);
  return s;
}

if (registrySigs.size > 0) {
  if (writeBaseline) {
    await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(dupHits), null, 2) + '\n');
    log(`\n✓ icons baseline rewritten: ${BASELINE_PATH} (${dupHits.length} entries)`);
  } else {
    let baseline = null;
    try { baseline = JSON.parse(await readFile(BASELINE_PATH)); } catch { /* none */ }
    if (!baseline) {
      await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(dupHits), null, 2) + '\n');
      log(`\n✓ icons baseline created: ${BASELINE_PATH} (${dupHits.length} entries) — 复查后再跑一次进入 diff 模式`);
    } else {
      const allowed = baselineKeys(baseline);
      const newDup = dupHits.filter(h => !allowed.has(dupKey(h)));
      if (newDup.length) {
        fail = true;
        log(`\n✗ ${newDup.length} 处新增同形重画（registry 字形被 inline 复制）：`);
        for (const h of newDup) log(`    ${h.file}  L${h.line}  复制了图标 ${h.name}`);
        log(`  修法：改引用图标库（勿把字形 inline 复制粘贴）；确需保留 → args=['--write-baseline'] 并在 CHANGELOG 写明理由`);
      }
    }
  }
}

if (shared.length) {
  log(`\nℹ 同名同形跨多文件（该提进单一图标库 / DRY）：`);
  for (const [n, c] of shared) log(`  ${n}: ${c} 文件`);
}

log(`\nRESULT: ${fail ? 'FAIL' : 'PASS'}`);
if (fail && globalThis.__NODE__) process.exitCode = 1;
⟦/FILE⟧

⟦FILE design-spec-kit/tools/check-manifest.js⟧
// ── 双环境运行时（design-spec-kit 标准头）────────────────────────
// 环境 A：无 shell 的 AI 沙箱 run_script——自带全局 readFile(p)/saveFile(p,c)/ls(dir)/log(...)，整段粘贴执行。
// 环境 B：本地 / CI node ≥18（kit package.json "type":"module"）——node tools/<本文件> [--flags]
// 约定：全文件禁顶层 import/export；node 能力只经此 shim。
if (typeof readFile !== 'function') {
  const fs = await import('node:fs/promises');
  const pathmod = await import('node:path');
  globalThis.readFile = (p) => fs.readFile(p, 'utf8');
  globalThis.saveFile = async (p, c) => { const d = pathmod.dirname(p); if (d && d !== '.') await fs.mkdir(d, { recursive: true }); await fs.writeFile(p, c); };
  globalThis.ls = (d) => fs.readdir(d || '.');
  globalThis.log = (...a) => console.log(...a);
  globalThis.__NODE__ = true;
}

/**
 * check-manifest.js · guard⑥ manifest 完备性（design-spec-kit 还原交接层 · 与平台无关）
 *
 * 守什么：装了还原交接层就必须每屏交出机读 manifest（HANDOFF §1）。本 guard 校验
 *   docs/manifests/*.manifest.generated.json —— 既过 schema，也过 schema 管不到的语义规则：
 *
 *   ① MANIFEST_DIR 不存在 / 空目录          → FAIL（装了还原层却没 manifest；没装本层请卸本 guard）
 *   ② 每份生成物 JSON 可解析 + 过 schema     → FAIL（内置迷你 draft-07 子集校验器，读 SCHEMA_PATH 驱动，字段不硬编码）
 *   ③ 语义规则（schema 管不到 / 双保险）：
 *        · states.designed + states.delegated 合计非空（设计可少画，不可不表态）→ FAIL
 *        · elements[].anchor 单份文件内唯一（对账主键不许撞）        → FAIL
 *        · interactions[].trigger / target 必须引用已有 anchor          → FAIL
 *        · state_classes.exempt 每条带 note（schema 已管，此处双保险）  → FAIL
 *        · states.delegated[].contract_ref === 'TBD'                 → WARN（显式待裁决信号，不 FAIL）
 *   ④ SCREENS_LIST_PATH 配置时：清单里每个 screen-id 必须有对应 manifest → FAIL（覆盖率对账）
 *   ⑤ SOURCE_MANIFEST_DIR 配置时：设计侧语义源 manifest 与 generated 的 version / anchor /
 *      designed state / delegated state / interactions / contracts 双向一致 → FAIL（防生成物过期但 schema 仍 PASS）
 *   ⑥ coverage 配置时：扫设计屏源文件（designRoot + screenGlobs），与各 generated 的
 *      screen.source 集合做差——设计屏尚无 manifest → WARN（覆盖缺口可见，不 FAIL；
 *      ④ 守「清单里的屏都有 manifest」，本维守「设计源文件都进了 manifest 体系」，两腿互补）。
 *      exempt 条目必须带 note（fail closed）；exempt 失效（已覆盖 / 源文件已不存在）→ WARN 提醒清理。
 *      coverage 配置形态错误 / designRoot 不可读 / 任一 glob 零匹配 → FAIL（显式配置指向空无 = 接线坏，
 *      零匹配静默通过 = 假绿，均不静默）。
 *
 * 怎么跑：AI 沙箱 = read_file 本文件整段粘进 run_script（helper readFile/ls/log）；node/CI = node tools/check-manifest.js。
 *   末行 `RESULT: PASS|FAIL`；FAIL 时 node 置退出码 1，带「修法」提示。配置见下方「配置」区（★必改已标）。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

async function readDesignSpecConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json')); }
  catch { return {}; }
}
const DESIGN_SPEC_CONFIG = await readDesignSpecConfig();
// ── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）：runner 经 DESIGN_SPEC_KIT_MODULE 传模块名 ──
const moduleOverride = '';   // 沙箱手改位：无 shell 粘贴执行时手填模块名
const KIT_MODULE = moduleOverride || globalThis.process?.env?.DESIGN_SPEC_KIT_MODULE || '';
const pickGuardCfg = (node) => node?.guards?.['check-manifest'] || node?.guards?.['check-manifest.js'] || {};
const MODULE_GUARD_CONFIG = KIT_MODULE ? pickGuardCfg(DESIGN_SPEC_CONFIG.modules?.[KIT_MODULE]) : {};
// key 级浅合并：模块键覆盖顶层公共缺省（数组整键替换，不做深合并）
const GUARD_CONFIG = KIT_MODULE ? { ...pickGuardCfg(DESIGN_SPEC_CONFIG), ...MODULE_GUARD_CONFIG } : pickGuardCfg(DESIGN_SPEC_CONFIG);
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位：本 guard 无 flag，留空即可

// 生成物目录：guard 只认此目录下的 *.manifest.generated.json（HANDOFF §1.2「只认生成物」）
const MANIFEST_DIR = cfgValue('manifestDir', 'docs/manifests');
// schema 真源：驱动内置迷你校验器，字段不硬编码（改 schema 无需改本文件）
const SCHEMA_PATH = cfgValue('schemaPath', 'docs/screen-manifest.schema.json');
// ★可选：期望屏清单文件——配置了才做覆盖率对账；留空 '' = 关闭覆盖率检查。
//   载体二选一：① 每行一个 screen-id 的纯文本；② 一个 JSON 数组 ["login","list",...]。
const SCREENS_LIST_PATH = cfgValue('screensListPath', '');
// ★可选：设计侧语义 manifest 源目录。配置后按 <screen-id><SOURCE_MANIFEST_SUFFIX> 读取源头，
// 与 generated 进行漂移对账；留空 '' = 关闭源头漂移检查。
const SOURCE_MANIFEST_DIR = cfgValue('sourceManifestDir', '');
const SOURCE_MANIFEST_SUFFIX = cfgValue('sourceManifestSuffix', '.manifest.json');

// ★可选：设计屏覆盖对账（⑥）。配置了才启用；不配置 = 本维关闭、输出零变化。
//   { designRoot: '设计根目录', screenGlobs: ['pages/*.html', ...],
//     exempt: [{ source: 'pages/x.html', note: '为何不需要 manifest' }], skipDirs: [...] }
//   screenGlobs 相对 designRoot；glob 支持 *（段内）与 **（跨段）。
const COVERAGE_CONFIG = cfgValue('coverage', null);
const COVERAGE_DEFAULT_SKIP_DIRS = ['node_modules', 'dist', 'build', '.git', '_archive', 'uploads', 'screenshots', 'tmp', 'vendor', 'drafts', 'export'];

// 生成物文件名约定（HANDOFF §1.2）
const MANIFEST_SUFFIX = '.manifest.generated.json';

const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);
void EFFECTIVE_ARGS;   // 本 guard 暂无 flag 分支；保留统一形态

// ─── 迷你 draft-07 校验器（子集：type / required / properties / additionalProperties /
//     items / enum / pattern / minLength / minItems / minimum / $ref→#/definitions）──────

// $ref 只解析同文档 "#/definitions/<name>"；够本 schema 用，不做远程 / 复杂指针。
function resolveRef(root, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  let node = root;
  for (const seg of ref.slice(2).split('/')) {
    if (node == null || typeof node !== 'object') return null;
    node = node[seg];
  }
  return node || null;
}

const typeOf = (v) => Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v === 'object' ? 'object' : typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'number') : typeof v;

// 单值对单 schema 校验；errs 收 `path: 原因`。root = schema 根（供 $ref 回溯）。
function validate(value, schema, root, path, errs) {
  if (schema == null || typeof schema !== 'object') return;
  if (schema.$ref) {
    const target = resolveRef(root, schema.$ref);
    if (!target) { errs.push(`${path}: 无法解析 $ref ${schema.$ref}`); return; }
    validate(value, target, root, path, errs);
    return;
  }

  const t = typeOf(value);
  if (schema.type) {   // integer 也满足 number；其余按精确类型
    const wantList = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!wantList.some((w) => w === t || (w === 'number' && t === 'integer'))) {
      errs.push(`${path}: 类型应为 ${wantList.join('|')}，实际 ${t}`); return;
    }
  }
  if (schema.enum && !schema.enum.some((e) => e === value)) {
    errs.push(`${path}: 值 ${JSON.stringify(value)} 不在枚举 [${schema.enum.join(', ')}]`);
  }
  if (t === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errs.push(`${path}: 字符串长度 ${value.length} < minLength ${schema.minLength}`);
    }
    if (typeof schema.pattern === 'string') {
      let re = null;
      try { re = new RegExp(schema.pattern); } catch { /* 坏 pattern 忽略 */ }
      if (re && !re.test(value)) errs.push(`${path}: 不匹配 pattern /${schema.pattern}/`);
    }
  }
  if ((t === 'integer' || t === 'number') && typeof schema.minimum === 'number' && value < schema.minimum) {
    errs.push(`${path}: 数值 ${value} < minimum ${schema.minimum}`);
  }
  if (t === 'array') {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errs.push(`${path}: 数组长度 ${value.length} < minItems ${schema.minItems}`);
    }
    if (schema.items) value.forEach((item, i) => validate(item, schema.items, root, `${path}[${i}]`, errs));
  }
  if (t === 'object') {
    const props = schema.properties || {};
    if (Array.isArray(schema.required)) for (const key of schema.required) {
      if (!(key in value)) errs.push(`${path}: 缺必填字段 "${key}"`);
    }
    if (schema.additionalProperties === false) for (const key of Object.keys(value)) {
      if (!(key in props)) errs.push(`${path}: 出现未声明字段 "${key}"（additionalProperties:false）`);
    }
    for (const [key, sub] of Object.entries(props)) {
      if (key in value) validate(value[key], sub, root, `${path}.${key}`, errs);
    }
  }
}

// ─── 语义规则（schema 之外 / 双保险）──────────────────────────

function semanticChecks(manifest, fileErrs, fileWarns) {
  const states = (manifest && manifest.states) || {};
  const designed = Array.isArray(states.designed) ? states.designed : [];
  const delegated = Array.isArray(states.delegated) ? states.delegated : [];

  // designed + delegated 合计非空
  if (designed.length + delegated.length === 0) {
    fileErrs.push('states.designed 与 states.delegated 合计为空（设计可少画，不可不表态）');
  }

  // anchor 单文件内唯一
  const els = Array.isArray(manifest && manifest.elements) ? manifest.elements : [];
  const seen = new Map();
  for (const el of els) {
    const a = el && el.anchor;
    if (typeof a === 'string') seen.set(a, (seen.get(a) || 0) + 1);
  }
  for (const [a, n] of seen) {
    if (n > 1) fileErrs.push(`elements[].anchor "${a}" 重复 ${n} 次（对账主键须唯一）`);
  }

  // interaction trigger / target 必须引用已有 anchor
  const anchors = new Set([...seen.keys()]);
  const interactions = Array.isArray(manifest && manifest.interactions) ? manifest.interactions : [];
  interactions.forEach((interaction, i) => {
    const trigger = interaction && interaction.trigger;
    const target = interaction && interaction.target;
    if (typeof trigger === 'string' && !anchors.has(trigger)) {
      fileErrs.push(`interactions[${i}].trigger="${trigger}" 未引用任何 elements[].anchor`);
    }
    if (typeof target === 'string' && !anchors.has(target)) {
      fileErrs.push(`interactions[${i}].target="${target}" 未引用任何 elements[].anchor`);
    }
  });

  // state_classes.exempt 每条带 note（schema 已管，双保险）
  const exempt = (manifest && manifest.state_classes && manifest.state_classes.exempt) || [];
  if (Array.isArray(exempt)) exempt.forEach((e, i) => {
    if (!e || typeof e.note !== 'string' || e.note.trim().length < 4) {
      fileErrs.push(`state_classes.exempt[${i}] 缺 note 或过短（豁免标准态必须写原因）`);
    }
  });

  // delegated contract_ref === 'TBD' → WARN（待裁决信号）
  delegated.forEach((d, i) => {
    if (d && d.contract_ref === 'TBD') {
      fileWarns.push(`states.delegated[${i}] state=${d.state || '?'} contract_ref=TBD（显式待裁决）`);
    }
  });
}

function sortedUnique(values) {
  return [...new Set(values
    .filter((v) => typeof v === 'string' && v.trim())
    .map((v) => v.trim()))].sort();
}

function delegatedKey(d) {
  if (!d || typeof d !== 'object') return '';
  return [
    d.state || '',
    d.to || '',
    d.contract_ref || '',
    d.status || '',
  ].join('|');
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function interactionKey(interaction) {
  if (!interaction || typeof interaction !== 'object') return '';
  return [
    interaction.trigger || '',
    interaction.action || '',
    interaction.target || '',
  ].join('|');
}

function contractKey(element) {
  if (!element || typeof element !== 'object' || !element.contracts) return '';
  return `${element.anchor || ''}|${stableJson(element.contracts)}`;
}

function diffSet(label, sourceValues, generatedValues, fileErrs) {
  const source = sortedUnique(sourceValues);
  const generated = sortedUnique(generatedValues);
  const sourceSet = new Set(source);
  const generatedSet = new Set(generated);
  const missing = source.filter((v) => !generatedSet.has(v));
  const extra = generated.filter((v) => !sourceSet.has(v));
  if (missing.length) fileErrs.push(`source drift: generated 缺 ${label}: ${missing.join(', ')}`);
  if (extra.length) fileErrs.push(`source drift: generated 多 ${label}: ${extra.join(', ')}`);
}

function sourceDriftChecks(sourceManifest, generatedManifest, fileErrs) {
  if (!sourceManifest || !generatedManifest) return;

  if (sourceManifest.version !== generatedManifest.version) {
    fileErrs.push(`source drift: version 不一致（source=${sourceManifest.version ?? '缺失'} / generated=${generatedManifest.version ?? '缺失'}）`);
  }

  const sourceElements = Array.isArray(sourceManifest.elements) ? sourceManifest.elements : [];
  const generatedElements = Array.isArray(generatedManifest.elements) ? generatedManifest.elements : [];
  diffSet(
    'anchors',
    sourceElements.map((el) => el && el.anchor),
    generatedElements.map((el) => el && el.anchor),
    fileErrs,
  );
  diffSet(
    'contracts',
    sourceElements.map(contractKey),
    generatedElements.map(contractKey),
    fileErrs,
  );

  const sourceInteractions = Array.isArray(sourceManifest.interactions) ? sourceManifest.interactions : [];
  const generatedInteractions = Array.isArray(generatedManifest.interactions) ? generatedManifest.interactions : [];
  diffSet(
    'interactions',
    sourceInteractions.map(interactionKey),
    generatedInteractions.map(interactionKey),
    fileErrs,
  );

  const sourceStates = sourceManifest.states || {};
  const generatedStates = generatedManifest.states || {};
  diffSet(
    'designed states',
    Array.isArray(sourceStates.designed) ? sourceStates.designed.map((s) => s && s.id) : [],
    Array.isArray(generatedStates.designed) ? generatedStates.designed.map((s) => s && s.id) : [],
    fileErrs,
  );
  diffSet(
    'delegated states',
    Array.isArray(sourceStates.delegated) ? sourceStates.delegated.map(delegatedKey) : [],
    Array.isArray(generatedStates.delegated) ? generatedStates.delegated.map(delegatedKey) : [],
    fileErrs,
  );
}

// ─── 收集工具 ──────────────────────────────────────────────────

async function readDirNames(dir) {
  try { return await ls(dir); } catch { return null; }
}

// 从清单文件解析期望 screen-id：优先 JSON 数组，回落逐行。
function parseScreensList(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) return arr.filter((x) => typeof x === 'string').map((x) => x.trim()).filter(Boolean);
    } catch { /* 回落逐行 */ }
  }
  return trimmed.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

// ─── ⑥ 设计屏覆盖对账（report-only：缺口 WARN；配置坏 FAIL）───────────

// 简易 glob → 正则（按路径段解析）：`*` 段内不跨 '/'；段级 `**` 匹配零或多个目录段
// （`**/x` 含根层 x、`a/**/b` 含 a/b、结尾 `/**` 含自身与任意深度）；连续 `**` 段先折叠
// （`**/**` ≡ `**`）；段内出现的 `**` 按 `*` 处理。其余字符按字面转义，不做花括号/问号。
// 语义用例冻结在 tests/glob-semantics/run.js（源仓 CI 跑）。
function globToRegExp(glob) {
  const rawSegs = glob.split('/').filter((s) => s !== '');
  const segs = rawSegs.filter((s, i) => !(s === '**' && rawSegs[i - 1] === '**'));
  let body = '';
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (seg === '**') {
      if (segs.length === 1) body += '.*';                                  // 整串 '**'
      else if (i === segs.length - 1) body += '(?:/.*)?';                   // 结尾 '/**'
      else body += (i === 0 ? '(?:[^/]+/)*' : '/(?:[^/]+/)*');              // 开头 / 中间
      continue;
    }
    if (i > 0 && segs[i - 1] !== '**') body += '/';   // 中间 '**' 的展开式已带结尾 '/'
    body += seg.replace(/[.+^${}()|[\]\\?]/g, '\\$&').replace(/\*/g, '[^/]*');
  }
  return new RegExp(`^${body}$`);
}

// 形态校验（fail closed）：返回错误行数组；空数组 = 合法。
function validateCoverageConfig(cov) {
  const errs = [];
  if (!cov || typeof cov !== 'object' || Array.isArray(cov)) return ['coverage 必须是对象'];
  if (typeof cov.designRoot !== 'string' || !cov.designRoot.trim()) errs.push('coverage.designRoot 缺失或为空');
  if (!Array.isArray(cov.screenGlobs) || cov.screenGlobs.length === 0 || cov.screenGlobs.some((g) => typeof g !== 'string' || !g.trim())) {
    errs.push('coverage.screenGlobs 必须是非空字符串数组');
  }
  if (cov.exempt !== undefined) {
    if (!Array.isArray(cov.exempt)) errs.push('coverage.exempt 必须是数组');
    else cov.exempt.forEach((e, i) => {
      if (!e || typeof e !== 'object' || typeof e.source !== 'string' || !e.source.trim()) errs.push(`coverage.exempt[${i}] 缺 source`);
      else if (typeof e.note !== 'string' || e.note.trim().length < 4) errs.push(`coverage.exempt[${i}]（${e.source}）缺 note 或过短——豁免必须写明原因`);
    });
  }
  if (cov.skipDirs !== undefined && (!Array.isArray(cov.skipDirs) || cov.skipDirs.some((d) => typeof d !== 'string'))) {
    errs.push('coverage.skipDirs 必须是字符串数组');
  }
  return errs;
}

// 走 designRoot 收集屏源候选（相对 designRoot 的路径）。沿用 kit 双环境 walk 惯例：
// 名字含 '.' 视为文件、不含视为目录（shim 无 stat）。
async function walkDesignRoot(root, rel, skipDirs, out) {
  let entries;
  try { entries = await ls(rel ? `${root}/${rel}` : root); } catch { return; }
  if (!entries || entries.length === 0) return;
  for (const name of entries) {
    const relPath = rel ? `${rel}/${name}` : name;
    if (name.includes('.')) out.push(relPath);
    else if (!skipDirs.has(name)) await walkDesignRoot(root, relPath, skipDirs, out);
  }
}

const normalizeSource = (s) => (typeof s === 'string' ? s.trim().replace(/^\.\//, '') : '');

// 返回 { errs: [], warns: [] }：errs=配置/接线坏（FAIL），warns=覆盖缺口与失效豁免（不 FAIL）。
async function coverageChecks(manifestSources) {
  const errs = validateCoverageConfig(COVERAGE_CONFIG);
  if (errs.length > 0) return { errs: errs.map((e) => `coverage 配置形态错误：${e}（${KIT_MODULE ? `modules.${KIT_MODULE}.` : ''}guards['check-manifest'].coverage）`), warns: [] };

  const root = COVERAGE_CONFIG.designRoot.trim().replace(/\/+$/, '');
  try { await ls(root); }
  catch { return { errs: [`coverage.designRoot 不可读：${root}（显式配置指向空无 = 接线坏；目录搬家请同步改配置）`], warns: [] }; }

  const skipDirs = new Set(Array.isArray(COVERAGE_CONFIG.skipDirs) ? COVERAGE_CONFIG.skipDirs : COVERAGE_DEFAULT_SKIP_DIRS);
  const candidates = [];
  await walkDesignRoot(root, '', skipDirs, candidates);
  // 逐 glob 零匹配 fail closed：拼错的 glob 会让本维静默变成 0/0 假绿，与防漏目标相反。
  // 屏还没建出来的合法过渡期请先移除该 glob，建屏时再加回。
  const globErrs = [];
  const matchedSet = new Set();
  for (const raw of COVERAGE_CONFIG.screenGlobs) {
    const g = raw.trim().replace(/^\.\//, '');
    const re = globToRegExp(g);
    const hits = candidates.filter((p) => re.test(p));
    if (hits.length === 0) globErrs.push(`coverage.screenGlobs '${raw}' 在 ${root} 下零匹配——glob 拼错或目录结构已变，修 glob 或移除该条（零匹配静默通过 = 假绿）`);
    for (const p of hits) matchedSet.add(p);
  }
  if (globErrs.length > 0) return { errs: globErrs, warns: [] };
  const screens = [...matchedSet].sort();

  const covered = new Set(manifestSources.map(normalizeSource).filter(Boolean));
  const exempt = Array.isArray(COVERAGE_CONFIG.exempt) ? COVERAGE_CONFIG.exempt : [];
  const exemptSources = new Set(exempt.map((e) => normalizeSource(e.source)));

  const warns = [];
  const uncovered = screens.filter((p) => !covered.has(p) && !exemptSources.has(p));
  for (const p of uncovered) warns.push(`设计屏尚无 manifest：${p}（补 manifest 进 handoff 体系，或登记 coverage.exempt 并写明原因）`);
  const screenSet = new Set(screens);
  for (const e of exempt) {
    const src = normalizeSource(e.source);
    if (covered.has(src)) warns.push(`coverage.exempt 失效（已有 manifest 覆盖）：${src}——请清理该豁免条目`);
    else if (!screenSet.has(src)) warns.push(`coverage.exempt 失效（源文件已不存在或不匹配 screenGlobs）：${src}——请清理该豁免条目`);
  }
  return { errs: [], warns, stats: { screens: screens.length, covered: screens.filter((p) => covered.has(p)).length } };
}

// ─── Main（早退避免深嵌；末行统一由本函数 log RESULT）─────────────

function fatal(lines) { for (const l of lines) log(l); log('\nRESULT: FAIL'); if (globalThis.__NODE__) process.exitCode = 1; }

async function main() {
  // ① 目录存在性
  const names = await readDirNames(MANIFEST_DIR);
  if (names === null || names.length === 0) {
    return fatal([`✗ manifest 目录不存在或为空：${MANIFEST_DIR}`,
      `  修法：装了还原交接层就必须每屏产 <screen>${MANIFEST_SUFFIX}（见 SCREEN-MANIFEST.template.md）。`,
      `        不装还原层请勿装本 guard（连同 CLAUDE 还原小节 / DoD 行一起卸）。`]);
  }
  const manifestFiles = names.filter((n) => n.endsWith(MANIFEST_SUFFIX)).sort();
  if (manifestFiles.length === 0) {
    return fatal([`✗ ${MANIFEST_DIR} 下无 *${MANIFEST_SUFFIX}（目录里有 ${names.length} 项但无生成物）`,
      `  修法：manifest 生成物文件名须以 ${MANIFEST_SUFFIX} 结尾；重生源头得到生成物。`]);
  }

  // 加载 schema
  let schema;
  try { schema = JSON.parse(await readFile(SCHEMA_PATH)); }
  catch (e) {
    return fatal([`✗ 无法读取 / 解析 schema：${SCHEMA_PATH}（${e && e.message}）`,
      `  修法：确认 SCHEMA_PATH 指向 screen-manifest.schema.json 且为合法 JSON。`]);
  }

  const idToFile = new Map();   // screen.id → 文件名（覆盖率对账用）
  const manifestSources = [];   // screen.source 集合（⑥ 设计屏覆盖对账用）
  const perFile = [];           // { file, errs, warns }
  for (const fname of manifestFiles) {
    const errs = [], fw = [];
    let manifest = null;
    try { manifest = JSON.parse(await readFile(`${MANIFEST_DIR}/${fname}`)); }
    catch (e) { errs.push(`JSON 无法解析：${e && e.message}`); }
    if (manifest !== null) {
      validate(manifest, schema, schema, '(root)', errs);
      semanticChecks(manifest, errs, fw);
      const id = manifest && manifest.screen && manifest.screen.id;
      if (typeof id === 'string' && id) idToFile.set(id, fname);
      const source = manifest && manifest.screen && manifest.screen.source;
      if (typeof source === 'string' && source.trim()) manifestSources.push(source);
      if (SOURCE_MANIFEST_DIR && typeof id === 'string' && id) {
        const sourcePath = `${SOURCE_MANIFEST_DIR}/${id}${SOURCE_MANIFEST_SUFFIX}`;
        let sourceManifest = null;
        try { sourceManifest = JSON.parse(await readFile(sourcePath)); }
        catch (e) { errs.push(`source drift: 无法读取 / 解析源 manifest ${sourcePath}（${e && e.message}）`); }
        if (sourceManifest) sourceDriftChecks(sourceManifest, manifest, errs);
      }
    }
    perFile.push({ file: fname, errs, warns: fw });
  }

  // ④ 覆盖率对账
  const coverageErrs = [];
  if (SCREENS_LIST_PATH) {
    let listRaw = null;
    try { listRaw = await readFile(SCREENS_LIST_PATH); } catch { /* 缺文件 */ }
    if (listRaw === null) coverageErrs.push(`SCREENS_LIST_PATH 配了但读不到：${SCREENS_LIST_PATH}`);
    else for (const id of parseScreensList(listRaw)) {
      if (!idToFile.has(id)) coverageErrs.push(`期望屏 "${id}" 无对应 manifest 生成物`);
    }
  }

  // ⑥ 设计屏覆盖对账（配置了才启用；缺口 WARN、配置坏 FAIL）
  let coverage = { errs: [], warns: [], stats: null };
  if (COVERAGE_CONFIG !== null) coverage = await coverageChecks(manifestSources);

  // ─── 报告 ───
  const warns = [];
  const totalErrs = perFile.reduce((s, f) => s + f.errs.length, 0) + coverageErrs.length + coverage.errs.length;
  const totalWarns = perFile.reduce((s, f) => s + f.warns.length, 0) + coverage.warns.length;
  log(`scanned ${manifestFiles.length} manifest · schema=${SCHEMA_PATH} · errors ${totalErrs} · warnings ${totalWarns}`);
  for (const { file, errs, warns: fw } of perFile) {
    if (errs.length === 0 && fw.length === 0) { log(`  ✓ ${file}`); continue; }
    log(`  ${errs.length ? '✗' : '⚠'} ${file}`);
    for (const e of errs) log(`      ✗ ${e}`);
    for (const w of fw) { log(`      ⚠ ${w}`); warns.push(`${file}: ${w}`); }
  }
  if (coverageErrs.length) {
    log(`\n✗ 覆盖率对账（SCREENS_LIST_PATH=${SCREENS_LIST_PATH}）：`);
    for (const e of coverageErrs) log(`      ✗ ${e}`);
  }
  if (coverage.errs.length) {
    log(`\n✗ 设计屏覆盖对账（coverage）：`);
    for (const e of coverage.errs) log(`      ✗ ${e}`);
  }
  if (COVERAGE_CONFIG !== null && coverage.stats) {
    log(`\nℹ 设计屏覆盖：${coverage.stats.covered}/${coverage.stats.screens} 屏已进 manifest 体系（缺口 WARN 不 FAIL，逐屏补齐或登记豁免）`);
    for (const w of coverage.warns) log(`  ⚠ ${w}`);
  }
  if (warns.length) log(`\n⚠ 待裁决队列（contract_ref=TBD，非 FAIL，随迭代评审收敛）：${warns.length} 条`);

  if (totalErrs > 0) {
    if (totalWarns > 0) log(`WARNINGS: ${totalWarns}`);
    return fatal([`\n修法：`,
      `  1. schema 违规 → 改「源头」再重生生成物（勿手改 *${MANIFEST_SUFFIX}；HANDOFF §1.2 真源+重生）。`,
      `  2. states 合计为空 → 补 designed 或 delegated（设计可少画不可不表态）。`,
      `  3. anchor 撞名 → 改名并 version+1、记 CHANGELOG（anchor 是对账主键）。`,
      `  4. 覆盖率缺口 → 为缺屏补 manifest，或从屏清单真源移除该 id。`,
      `  5. source drift → 先同步设计侧语义源，再重生 generated；勿让 generated 落后于 source。`,
      `  6. coverage 配置坏 → 修 designRoot / screenGlobs / exempt 形态（豁免必须带 note）。`]);
  }
  log(`\n✓ check-manifest: 全部生成物过 schema + 语义规则`);
  if (totalWarns > 0) log(`WARNINGS: ${totalWarns}`);
  log(`\nRESULT: PASS`);
}

await main();
⟦/FILE⟧

⟦FILE design-spec-kit/tools/check-orphan-css.js⟧
// ── 双环境运行时（design-spec-kit 标准头）────────────────────────
// 环境 A：无 shell 的 AI 沙箱 run_script——自带全局 readFile(p)/saveFile(p,c)/ls(dir)/log(...)，整段粘贴执行。
// 环境 B：本地 / CI node ≥18（kit package.json "type":"module"）——node tools/<本文件> [--flags]
// 约定：全文件禁顶层 import/export；node 能力只经此 shim。
if (typeof readFile !== 'function') {
  const fs = await import('node:fs/promises');
  const pathmod = await import('node:path');
  globalThis.readFile = (p) => fs.readFile(p, 'utf8');
  globalThis.saveFile = async (p, c) => { const d = pathmod.dirname(p); if (d && d !== '.') await fs.mkdir(d, { recursive: true }); await fs.writeFile(p, c); };
  globalThis.ls = (d) => fs.readdir(d || '.');
  globalThis.log = (...a) => console.log(...a);
  globalThis.__NODE__ = true;
}

/**
 * check-orphan-css.js · guard④ 死 CSS 对账（design-spec-kit · 与平台无关）
 *
 * 守什么：CSS 里定义、但在使用面（页面 / 组件 / 脚本）零命中的 class——
 *   改版残留的死码。「样式还留着，早没人引用」是最常见的删不干净。
 * 怎么跑：read_file 本文件 → 整段粘进 run_script（沙箱）；或 node tools/check-orphan-css.js（本地 / CI）。
 *   helper：readFile / saveFile / ls / log。末行 `RESULT: PASS|FAIL`。
 * 配置说明：改下方「配置」区的 CSS_ROOTS / USAGE_ROOTS / BASELINE_PATH。
 *   首跑自动固化 baseline（= 现状「保留备查」账本），之后只报**新增**孤儿；
 *   要把当前全部孤儿重新固化 → args 设成 ['--write-baseline']。
 *
 * ⚠ 两个已知盲区（本 guard 测不到 / 可能误报，需人工复核）：
 *   ① 组合级死：`.a .b` 两个 class 各自在别处存活，但这条**组合选择器**其实永不命中——
 *      本 guard 只按单 class 存活判定，抓不到组合级死码。
 *   ② JS 动态拼接：`'x-' + suffix` 这类运行时拼出的 class，静态搜不到 → 可能把活着的样式误报成死。
 *      命中可疑项时，先 grep 拼接前缀确认，再决定删 / 加 baseline。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

async function readDesignSpecConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json')); }
  catch { return {}; }
}
const DESIGN_SPEC_CONFIG = await readDesignSpecConfig();
// ── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）：runner 经 DESIGN_SPEC_KIT_MODULE 传模块名 ──
const moduleOverride = '';   // 沙箱手改位：无 shell 粘贴执行时手填模块名
const KIT_MODULE = moduleOverride || globalThis.process?.env?.DESIGN_SPEC_KIT_MODULE || '';
const pickGuardCfg = (node) => node?.guards?.['check-orphan-css'] || node?.guards?.['check-orphan-css.js'] || {};
const MODULE_GUARD_CONFIG = KIT_MODULE ? pickGuardCfg(DESIGN_SPEC_CONFIG.modules?.[KIT_MODULE]) : {};
// key 级浅合并：模块键覆盖顶层公共缺省（数组整键替换，不做深合并）
const GUARD_CONFIG = KIT_MODULE ? { ...pickGuardCfg(DESIGN_SPEC_CONFIG), ...MODULE_GUARD_CONFIG } : pickGuardCfg(DESIGN_SPEC_CONFIG);
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位。例：['--write-baseline'] 把当前全部孤儿固化为新 baseline
const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);

// ① CSS 定义面（递归）：class 定义在哪。不存在的目录自动跳过。
const CSS_ROOTS  = cfgArray('cssRoots', ['styles', 'css', 'design-system']);
// ② 使用面（递归）：class 被谁引用。'.' 兜底扫根目录散件；不存在的自动跳过。
const USAGE_ROOTS = cfgArray('usageRoots', ['pages', 'src', 'components', '.']);
const USAGE_EXT  = /\.(html|js|jsx|ts|tsx|vue|svelte)$/i;
const CSS_EXT    = /\.(css|scss|less)$/i;

// 整目录级 skip（依赖 / 构建产物 / 归档 / 工具 / 草稿 / 版本库 —— 按你的项目增删）
const SKIP_DIRS  = new Set(cfgArray('skipDirs', ['node_modules', 'dist', 'build', '.git', '_archive', 'tools', 'uploads', 'vendor', 'drafts', 'export']));

// 模块模式 baseline 强制分账：不继承顶层 baselinePath（两模块混一本账 = 债无归属）
const BASELINE_PATH = KIT_MODULE
  ? (MODULE_GUARD_CONFIG.baselinePath || `docs/design-spec/baselines/${KIT_MODULE}/check-orphan-css.baseline.json`)
  : cfgValue('baselinePath', 'tools/check-orphan-css.baseline.json');
// 迁移防线：模块 baseline 缺失而旧全局 baseline 仍在 → FAIL，拒绝静默重建空债 baseline（= 历史债清零）
if (KIT_MODULE && !MODULE_GUARD_CONFIG.baselinePath) {
  const legacyBaseline = pickGuardCfg(DESIGN_SPEC_CONFIG).baselinePath || 'tools/check-orphan-css.baseline.json';
  const fileExists = async (p) => { try { await readFile(p); return true; } catch { return false; } };
  if (!(await fileExists(BASELINE_PATH)) && (await fileExists(legacyBaseline))) {
    log(`✗ 模块 '${KIT_MODULE}' 无 baseline（${BASELINE_PATH}），但旧全局 baseline 仍在（${legacyBaseline}）`);
    log(`  多模块迁移须显式搬移该文件，或在 modules.${KIT_MODULE}.guards['check-orphan-css'] 配 baselinePath`);
    log('RESULT: FAIL');
    if (globalThis.__NODE__) globalThis.process.exit(1);
    throw new Error('baseline migration required');
  }
}

// ─── 去注释（保留位置，方便行号反查）──────────────────────────
const stripCss  = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
const stripHtml = s => s.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
const stripJs   = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
                       .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
const extOf     = p => p.slice(p.lastIndexOf('.')).toLowerCase();
const stripUsage = (s, ext) => ext === '.html' || ext === '.vue' || ext === '.svelte' ? stripHtml(s) : stripJs(s);

function lineOf(src, idx) {
  let l = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++;
  return l;
}

// ─── CSS 解析（brace-aware：只从选择器位置取 class）──────────────
// 思路：去注释后逐字符扫，维护 brace 深度。深度 0 时累积「选择器段」文本，遇 `{` 时
// 从该段抽 `.class`；`{` 后进入声明体（跳过，声明里的 `.5` 之类不误当选择器）；`}` 回到深度 0。
// @keyframes 帧名（from/to/50%）出现在其块内的深度-1 选择器位，用 @keyframes 上下文跳过。
// @media / @supports 是嵌套 at-rule：其块内仍有真实选择器，正常收（靠深度而非名字白名单）。
const CLASS_IN_SELECTOR = /\.(-?[A-Za-z_][\w-]*)/g;

function parseCssDefs(src, file, defs) {
  const s = stripCss(src);
  let depth = 0;
  let segStart = 0;                 // 当前选择器段起点（只在深度 0 或嵌套 at-rule 块内累积）
  let atKeyframesDepth = -1;        // @keyframes 容器所在深度；其直属子块的「选择器」是帧名，跳过
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') {
      const seg = s.slice(segStart, i);
      const trimmed = seg.trimStart();
      const isAtRule = trimmed.startsWith('@');
      const isKeyframes = /^@(-\w+-)?keyframes\b/i.test(trimmed);
      if (isKeyframes) {
        atKeyframesDepth = depth;   // 进入 keyframes 容器块
      } else if (atKeyframesDepth >= 0 && depth === atKeyframesDepth + 1) {
        // @keyframes 容器内的帧块，seg 是帧名（from/to/百分比），不抽 class
      } else if (!isAtRule) {
        // 普通规则块的选择器段——抽 class 定义
        let m; CLASS_IN_SELECTOR.lastIndex = 0;
        while ((m = CLASS_IN_SELECTOR.exec(seg)) !== null) {
          const name = m[1];
          if (!defs.has(name)) defs.set(name, { file, line: lineOf(src, segStart + m.index) });
        }
      }
      // isAtRule 且非 keyframes（@media/@supports 等）：段本身无选择器 class，进块后按深度继续收内层
      depth++;
      segStart = i + 1;             // 进块后段从块内开始（嵌套 at-rule 的内层选择器）
    } else if (ch === '}') {
      depth--;
      if (atKeyframesDepth >= 0 && depth === atKeyframesDepth) atKeyframesDepth = -1;  // 离开 keyframes 容器
      segStart = i + 1;
    } else if (ch === ';' && depth === 0) {
      segStart = i + 1;             // 顶层 @import/@charset 等语句，重置段起点
    }
  }
  return defs;
}

// ─── 收集文件 ──────────────────────────────────────────────────
async function walk(dir, out, extRe) {
  let entries;
  try { entries = await ls(dir); } catch { return; }
  if (!entries || entries.length === 0) return;
  for (const name of entries) {
    const path = dir ? dir + '/' + name : name;
    if (extRe.test(name)) {
      out.push(path);
    } else if (!name.includes('.') && !SKIP_DIRS.has(name)) {
      await walk(path, out, extRe);
    }
  }
}

async function collect(roots, extRe) {
  const out = [];
  for (const r of roots) await walk(r, out, extRe);
  return [...new Set(out)];
}

// ─── 使用面命中检测 ────────────────────────────────────────────
// 双侧边界正则：class 名两侧不能是 [\w-]（避免 `.card` 命中 `card-title` 的子串）。
function reFor(name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
  return new RegExp('(?<![\\w-])' + esc + '(?![\\w-])');
}

// ─── Baseline（仿 check-tokens）────────────────────────────────
function keyOf(o) { return `${o.file}::${o.name}`; }

function baselineKeys(b) {
  const s = new Set();
  if (!b || !b.files) return s;
  for (const [f, arr] of Object.entries(b.files)) for (const e of arr) s.add(`${f}::${e.name}`);
  return s;
}

function buildBaseline(orphans, reason) {
  const grouped = {};
  for (const o of orphans) (grouped[o.file] = grouped[o.file] || []).push({ line: o.line, name: o.name });
  for (const f of Object.keys(grouped)) grouped[f].sort((a, b) => a.line - b.line || a.name.localeCompare(b.name));
  return {
    note: '已认证「保留备查」的死 CSS 清单——进此账本须在 DESIGN-REF 登记保留原因。新增孤儿须删码或显式加到这里。',
    generatedAt: new Date().toISOString().slice(0, 10),
    reason: reason || 'baseline write',
    totalEntries: orphans.length,
    files: grouped,
  };
}

// ─── Main（top-level await）────────────────────────────────────
const writeBaseline = EFFECTIVE_ARGS.includes('--write-baseline');

// 1) 定义面：收集全部 class 定义（首个定义处的 file + line）
const cssFiles = await collect(CSS_ROOTS, CSS_EXT);
const defs = new Map();   // name -> { file, line }
for (const f of cssFiles) {
  let src; try { src = await readFile(f); } catch { continue; }
  parseCssDefs(src, f, defs);
}

// 2) 使用面：拼一大袋去注释文本，逐 class 双侧边界搜
const usageFiles = await collect(USAGE_ROOTS, USAGE_EXT);
const usageBlobs = [];
for (const f of usageFiles) {
  let src; try { src = await readFile(f); } catch { continue; }
  usageBlobs.push(stripUsage(src, extOf(f)));
}
const bigUsage = usageBlobs.join('\n');

// 3) 判孤儿：零命中
const orphans = [];
for (const [name, meta] of defs) {
  if (!reFor(name).test(bigUsage)) orphans.push({ name, file: meta.file, line: meta.line });
}
orphans.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

log(`css defs: ${defs.size} classes (${cssFiles.length} files) · usage面: ${usageFiles.length} files · orphans: ${orphans.length}`);

if (writeBaseline) {
  await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(orphans, 'manual --write-baseline'), null, 2) + '\n');
  log(`✓ baseline rewritten: ${BASELINE_PATH} (${orphans.length} entries)`);
  log(`\nRESULT: PASS`);
} else {
  let baseline = null;
  try { baseline = JSON.parse(await readFile(BASELINE_PATH)); } catch { /* no baseline */ }

  if (!baseline) {
    await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(orphans, 'first run'), null, 2) + '\n');
    log(`✓ baseline created: ${BASELINE_PATH} (${orphans.length} entries) — 复查后再跑一次进入 diff 模式`);
    log(`\nRESULT: PASS`);
  } else {
    const allowed = baselineKeys(baseline);
    const news    = orphans.filter(o => !allowed.has(keyOf(o)));
    const removed = [...allowed].filter(k => !orphans.some(o => keyOf(o) === k));

    log(`baseline: ${allowed.size} entries · removed: ${removed.length} · new: ${news.length}`);

    if (removed.length > 0) {
      log(`\n✓ ${removed.length} 处 baseline 孤儿已消失（被删掉或重新被引用，干得漂亮）`);
      for (const k of removed.slice(0, 20)) log('    cleared: ' + k);
      if (removed.length > 20) log(`    ... 还有 ${removed.length - 20} 处`);
      log(`  → 跑一次 args=['--write-baseline'] 同步 baseline\n`);
    }

    if (news.length > 0) {
      log(`\n✗ ${news.length} 处新增死 CSS（定义了但使用面零命中）：`);
      const byFile = {};
      for (const o of news) (byFile[o.file] = byFile[o.file] || []).push(o);
      for (const [f, arr] of Object.entries(byFile)) {
        log(`  ${f}`);
        for (const o of arr) log(`    L${o.line}  .${o.name}`);
      }
      log(`\n修法：`);
      log(`  1. 删掉死样式（改版残留的收尾）。`);
      log(`  2. 若是 JS 动态拼接（'x-'+suffix）导致的误报 → grep 拼接前缀确认后加 baseline。`);
      log(`  3. 确要保留备查 → args=['--write-baseline'] 并在 DESIGN-REF 登记「保留备查 + 原因」。`);
      log(`\nRESULT: FAIL`);
      if (globalThis.__NODE__) process.exitCode = 1;
    } else if (removed.length === 0) {
      log('✓ check-orphan-css: 0 新增 · 0 减少 · baseline 保持不变');
      log(`\nRESULT: PASS`);
    } else {
      log(`\nRESULT: PASS`);
    }
  }
}
⟦/FILE⟧

⟦FILE design-spec-kit/tools/check-tokens.js⟧
// ── 双环境运行时（design-spec-kit 标准头）────────────────────────
// 环境 A：无 shell 的 AI 沙箱 run_script——自带全局 readFile(p)/saveFile(p,c)/ls(dir)/log(...)，整段粘贴执行。
// 环境 B：本地 / CI node ≥18（kit package.json "type":"module"）——node tools/<本文件> [--flags]
// 约定：全文件禁顶层 import/export；node 能力只经此 shim。
if (typeof readFile !== 'function') {
  const fs = await import('node:fs/promises');
  const pathmod = await import('node:path');
  globalThis.readFile = (p) => fs.readFile(p, 'utf8');
  globalThis.saveFile = async (p, c) => { const d = pathmod.dirname(p); if (d && d !== '.') await fs.mkdir(d, { recursive: true }); await fs.writeFile(p, c); };
  globalThis.ls = (d) => fs.readdir(d || '.');
  globalThis.log = (...a) => console.log(...a);
  globalThis.__NODE__ = true;
}

/**
 * check-tokens.js · token 纪律防漂移扫描（design-spec-kit · 与平台无关）
 *
 * 守什么：把「颜色一律 var(--*)、数值唯一真源在 tokens.css」这条自觉纪律变成可机检 DoD，
 *   直接挡住页面漂移最常见的两类——颜色越走越散（#3b82f6 / #3a80f5），尺寸越走越歪（padding 13 / 18）。
 * 怎么跑（双环境）：
 *   · AI 沙箱：read_file 本文件 → 整段粘进 run_script（自带 readFile/saveFile/ls/log）。
 *   · 本地 / CI：node tools/check-tokens.js [--write-baseline]（node ≥18）。
 *   看末行 `RESULT: PASS|FAIL`；FAIL 时 node 侧给退出码 1。
 * 配置说明：★必改项见下方「配置」区注释——SCAN_ROOTS、尺寸档集、（可选）CONVENTION_RULES。
 *   首次跑自动生成 baseline（接受现状），之后只报新增违规。
 *
 * 扫 .css/.scss/.less/.js/.jsx/.ts/.tsx/.html/.vue/.svelte，抓违反 token 纪律的代码：
 *
 *  ── 颜色维（一直有）──
 *   ❌ bare-hex          `#abc` / `#abcdef` / `#abcdef88`
 *   ❌ bare-rgba         `rgba(0,0,0,.5)`
 *   ❌ fake-fallback     `var(--x, #fff)` / `var(--x, rgba(...))`
 *                       （允许 `var(--x, var(--y))` token→token fallback）
 *
 *  ── 尺寸维（可选 · 档集留空即关闭该子维）──
 *   ❌ off-fs / off-space / off-radius / inline-shadow   离档 px 或内联 box-shadow（未走 var(--shadow-*)）
 *   ★ 档集 = 你 tokens.css 里 --fs-* / --sp-* / --r-* 的真实数值。**别照抄别的项目的刻度。**
 *
 *  ── 约定维（可选 · CONVENTION_RULES 留空即关闭）──
 *   ❌ conv:<name>       项目自定义的可 grep 纪律（如某词禁上屏、某写法禁用），命中即违规。
 *
 *  baseline：tools/check-tokens.baseline.json 记「已认证保留」的违规快照，只报增量。
 *    v2 语义：按「出现次数」计——同一 key(file::kind::match) 实扫次数 > baseline 次数，超出部分算新增（报行号）；
 *    实扫少于 baseline 则算 removed。修掉了 v1「同值再新增被 baseline 预豁免」的缺陷。
 *    要把当前全部违规重新固化为 baseline → args 设成 ['--write-baseline']。
 * ═════════════════════════════════════════════════════════════*/

// ─── 配置（接手第一件事：按你的项目改这里）──────────────────────

async function readDesignSpecConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json')); }
  catch { return {}; }
}
const DESIGN_SPEC_CONFIG = await readDesignSpecConfig();
// ── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）：runner 经 DESIGN_SPEC_KIT_MODULE 传模块名 ──
const moduleOverride = '';   // 沙箱手改位：无 shell 粘贴执行时手填模块名
const KIT_MODULE = moduleOverride || globalThis.process?.env?.DESIGN_SPEC_KIT_MODULE || '';
const pickGuardCfg = (node) => node?.guards?.['check-tokens'] || node?.guards?.['check-tokens.js'] || {};
const MODULE_GUARD_CONFIG = KIT_MODULE ? pickGuardCfg(DESIGN_SPEC_CONFIG.modules?.[KIT_MODULE]) : {};
// key 级浅合并：模块键覆盖顶层公共缺省（数组整键替换，不做深合并）
const GUARD_CONFIG = KIT_MODULE ? { ...pickGuardCfg(DESIGN_SPEC_CONFIG), ...MODULE_GUARD_CONFIG } : pickGuardCfg(DESIGN_SPEC_CONFIG);
const cfgArray = (key, fallback) => Array.isArray(GUARD_CONFIG[key]) ? GUARD_CONFIG[key] : fallback;
const cfgValue = (key, fallback) => Object.prototype.hasOwnProperty.call(GUARD_CONFIG, key) ? GUARD_CONFIG[key] : fallback;

const args = [];   // 沙箱手改位。例：['--write-baseline'] 把当前扫描结果固化为新 baseline

// ① 扫哪些目录（递归）。默认列了常见目录名，不存在的自动跳过——通常按你的项目补一两个即可。★按项目核对
const SCAN_ROOTS = cfgArray('scanRoots', ['src', 'styles', 'css', 'components', 'pages', 'design-system']);
const ROOT_FILES = cfgArray('rootFiles', []);                       // 需要额外扫的根散件（可留空）
const CODE_EXT   = /\.(css|scss|less|js|jsx|ts|tsx|vue|svelte|html)$/i;

// 整目录级 skip（依赖 / 构建产物 / 归档 / 工具 / 草稿 / 版本库 —— 按你的项目增删）
const SKIP_DIRS = new Set(cfgArray('skipDirs', ['node_modules', 'dist', 'build', '.git', '_archive', 'tools', 'uploads', 'vendor', 'drafts', 'export']));
// 整文件级 skip：token 唯一真源（hex/rgba 合法定义于此）
const isSkipFile = p => /(^|\/)tokens\.css$/i.test(p);

// 模块模式 baseline 强制分账：不继承顶层 baselinePath（两模块混一本账 = 债无归属）
const BASELINE_PATH = KIT_MODULE
  ? (MODULE_GUARD_CONFIG.baselinePath || `docs/design-spec/baselines/${KIT_MODULE}/check-tokens.baseline.json`)
  : cfgValue('baselinePath', 'tools/check-tokens.baseline.json');
// 迁移防线：模块 baseline 缺失而旧全局 baseline 仍在 → FAIL，拒绝静默重建空债 baseline（= 历史债清零）
if (KIT_MODULE && !MODULE_GUARD_CONFIG.baselinePath) {
  const legacyBaseline = pickGuardCfg(DESIGN_SPEC_CONFIG).baselinePath || 'tools/check-tokens.baseline.json';
  const fileExists = async (p) => { try { await readFile(p); return true; } catch { return false; } };
  if (!(await fileExists(BASELINE_PATH)) && (await fileExists(legacyBaseline))) {
    log(`✗ 模块 '${KIT_MODULE}' 无 baseline（${BASELINE_PATH}），但旧全局 baseline 仍在（${legacyBaseline}）`);
    log(`  多模块迁移须显式搬移该文件，或在 modules.${KIT_MODULE}.guards['check-tokens'] 配 baselinePath`);
    log('RESULT: FAIL');
    if (globalThis.__NODE__) globalThis.process.exit(1);
    throw new Error('baseline migration required');
  }
}

// ② 尺寸档集 = 你 tokens.css 的真实刻度（★必改）。下面是「4px 基准」示例，按你的项目替换。
//    留空集 new Set() = 关闭对应子维（颜色维始终开）。
const FS_OK     = new Set(cfgArray('fontSizes', [12, 13, 14, 16, 18, 20, 24, 30, 36]));            // 字号档 --fs-*
const SPACE_OK  = new Set(cfgArray('spacing', [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]));         // 间距档 --sp-*（4px 步进示例）
const RADIUS_OK = new Set(cfgArray('radii', [4, 6, 8, 12, 16, 999]));                          // 圆角档 --r-*
// z-index：若你 tokens.css 定了 --z-* 刻度，可仿照加 Z_OK + 'z-index' 分支；默认不查。

// 属性 → 档集映射。只查这几族；width/height/top/left/inset 等是任意尺寸，不纳入。
const FS_PROPS    = new Set(['font-size']);
const SPACE_PROPS = new Set([
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-inline', 'padding-block', 'padding-inline-start', 'padding-inline-end',
  'padding-block-start', 'padding-block-end',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-inline', 'margin-block', 'margin-inline-start', 'margin-inline-end',
  'margin-block-start', 'margin-block-end',
  'gap', 'row-gap', 'column-gap', 'grid-gap',
]);
const RADIUS_PROPS = new Set([
  'border-radius', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-right-radius', 'border-bottom-left-radius',
  'border-start-start-radius', 'border-start-end-radius',
  'border-end-start-radius', 'border-end-end-radius',
]);

// ③ 约定维（★可选 · 默认关闭）：把项目里「可 grep 的自觉纪律」变成 guard 维度。
//    每条 { name, ext(文件名正则), re(命中即违规的内容正则), message }。命中算违规，
//    kind = 'conv:' + name，走同一 baseline 机制。默认空数组 = 关闭本维。
//    示例（默认注释掉）：禁止某占位词上屏 / 禁用某写法——
//    const CONVENTION_RULES = [
//      { name: 'no-todo-text', ext: /\.(html|vue|svelte|jsx|tsx)$/i, re: /\bTODO\b/g, message: '占位词禁上屏，改真实文案或移进注释' },
//    ];
const CONVENTION_RULES = [];

const EFFECTIVE_ARGS = args.length ? args : (globalThis.__NODE__ ? process.argv.slice(2) : []);

// ─── 颜色规则 ──────────────────────────────────────────────────

// 单一组合 regex：fake-fallback 优先 → 裸 hex/rgba 兜底
const RE = /var\(\s*--[a-z0-9-]+\s*,\s*#[0-9A-Fa-f]{3,8}\s*\)|var\(\s*--[a-z0-9-]+\s*,\s*rgba?\([^)]*\)\s*\)|#[0-9A-Fa-f]{3,8}\b|\brgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi;

function classify(m) {
  if (m.startsWith('var(')) return m.includes('#') ? 'fake-fallback-hex' : 'fake-fallback-rgba';
  return m.startsWith('#') ? 'bare-hex' : 'bare-rgba';
}

// ─── 尺寸维工具 ────────────────────────────────────────────────

const DECL_RE = /([a-z][a-z-]+)\s*:\s*([^;{}]+)/gi;   // `prop: value`，value 取到 ; { } 为止

function pxTokens(val) {
  const out = []; const re = /(-?\d*\.?\d+)px\b/gi; let m;
  while ((m = re.exec(val)) !== null) out.push({ raw: m[0], n: Math.abs(parseFloat(m[1])) });
  return out;
}
function offScale(prop, val, okSet) {
  const bad = [];
  if (!okSet || okSet.size === 0) return bad;        // 空集 = 该子维关闭
  for (const t of pxTokens(val)) {
    if (t.n === 0) continue;                          // 0px 永远合法
    if (!okSet.has(t.n)) bad.push(`${prop}:${t.raw}`);
  }
  return bad;
}
function shadowOff(val) {
  const v = val.trim().toLowerCase();
  if (v === '' || v === 'none' || v === 'inherit' || v === 'initial' || v === 'unset' || v === 'revert') return false;
  const rest = v.replace(/var\(\s*--shadow-[a-z0-9-]+\s*(?:,[^)]*)?\)/g, '').replace(/[\s,]+/g, '');
  return rest.length > 0;
}

// 用空格替换注释内容（保留位置，方便行号反查）
const stripCss  = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
const stripHtml = s => s.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
const stripJs   = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
                       .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
const extOf  = p => p.slice(p.lastIndexOf('.')).toLowerCase();
const strip  = (s, ext) => ext === '.css' || ext === '.scss' || ext === '.less' ? stripCss(s)
                         : ext === '.html' || ext === '.vue' || ext === '.svelte' ? stripHtml(s)
                         : stripJs(s);

function lineOf(src, idx) {
  let l = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) l++;
  return l;
}

// ─── 收集文件（递归遍历 SCAN_ROOTS）─────────────────────────────

async function walk(dir, out) {
  let entries;
  try { entries = await ls(dir); } catch { return; }
  if (!entries || entries.length === 0) return;
  for (const name of entries) {
    const path = dir ? dir + '/' + name : name;
    if (CODE_EXT.test(name)) {
      if (!isSkipFile(path)) out.push(path);
    } else if (!name.includes('.') && !SKIP_DIRS.has(name)) {
      await walk(path, out);
    }
  }
}

async function collectFiles() {
  const out = [];
  for (const r of SCAN_ROOTS) await walk(r, out);
  for (const f of ROOT_FILES) if (!isSkipFile(f)) out.push(f);
  return [...new Set(out)];
}

// ─── 扫描 ──────────────────────────────────────────────────────

const PARALLEL_BATCH = 24;

function baseNameOf(p) { return p.slice(p.lastIndexOf('/') + 1); }

async function scanAll(files) {
  const allHits = [];
  for (let i = 0; i < files.length; i += PARALLEL_BATCH) {
    const batch = files.slice(i, i + PARALLEL_BATCH);
    const contents = await Promise.all(batch.map(async f => {
      try { return { f, src: await readFile(f) }; }
      catch { return { f, src: null }; }
    }));
    for (const { f, src } of contents) {
      if (!src) continue;
      const ext = extOf(f);
      const cleaned = strip(src, ext);
      let m; RE.lastIndex = 0;
      while ((m = RE.exec(cleaned)) !== null) {
        allHits.push({ file: f, line: lineOf(src, m.index), kind: classify(m[0]), match: m[0] });
      }
      let d; DECL_RE.lastIndex = 0;
      while ((d = DECL_RE.exec(cleaned)) !== null) {
        const prop = d[1].toLowerCase(), val = d[2], line = lineOf(src, d.index);
        if (FS_PROPS.has(prop)) {
          for (const mt of offScale(prop, val, FS_OK)) allHits.push({ file: f, line, kind: 'off-fs', match: mt });
        } else if (SPACE_PROPS.has(prop)) {
          for (const mt of offScale(prop, val, SPACE_OK)) allHits.push({ file: f, line, kind: 'off-space', match: mt });
        } else if (RADIUS_PROPS.has(prop)) {
          for (const mt of offScale(prop, val, RADIUS_OK)) allHits.push({ file: f, line, kind: 'off-radius', match: mt });
        } else if (prop === 'box-shadow') {
          if (shadowOff(val)) allHits.push({ file: f, line, kind: 'inline-shadow', match: 'box-shadow:' + val.trim().replace(/\s+/g, ' ') });
        }
      }
      // 约定维：对文件名命中的规则逐条跑正则，命中即违规（走 baseline 机制）
      const base = baseNameOf(f);
      for (const rule of CONVENTION_RULES) {
        if (!rule || !rule.re || (rule.ext && !rule.ext.test(base))) continue;
        rule.re.lastIndex = 0; let cm;
        while ((cm = rule.re.exec(cleaned)) !== null) {
          allHits.push({ file: f, line: lineOf(src, cm.index), kind: 'conv:' + rule.name, match: cm[0] });
          if (cm.index === rule.re.lastIndex) rule.re.lastIndex++;   // 防零宽匹配死循环
        }
      }
    }
  }
  return allHits;
}

// ─── Baseline diff（v2：按出现次数计）──────────────────────────

function keyOf(h) { return `${h.file}::${h.kind}::${h.match}`; }

// baseline / 实扫 → Map(key -> 出现次数)
function countMap(items) {
  const m = new Map();
  for (const it of items) { const k = keyOf(it); m.set(k, (m.get(k) || 0) + 1); }
  return m;
}
function baselineCounts(b) {
  const m = new Map();
  if (!b || !b.files) return m;
  for (const [f, arr] of Object.entries(b.files)) {
    for (const e of arr) { const k = `${f}::${e.kind}::${e.match}`; m.set(k, (m.get(k) || 0) + 1); }
  }
  return m;
}

function buildBaseline(hits, reason) {
  const grouped = {};
  for (const h of hits) (grouped[h.file] = grouped[h.file] || []).push({ line: h.line, kind: h.kind, match: h.match });
  for (const f of Object.keys(grouped)) grouped[f].sort((a, b) => a.line - b.line || a.match.localeCompare(b.match));
  return {
    note: '已认证保留的 token 违规清单（按出现次数计）。同 key 再新增一处也算新增，需修代码或显式加到这里。',
    generatedAt: new Date().toISOString().slice(0, 10),
    reason: reason || 'baseline write',
    totalEntries: hits.length,
    files: grouped,
  };
}

// ─── Main（top-level await — run_script 直接执行）──────────────

const writeBaseline = EFFECTIVE_ARGS.includes('--write-baseline');

const files = await collectFiles();
const hits = await scanAll(files);
log(`scanned ${files.length} files · ${hits.length} violations`);

if (writeBaseline) {
  await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(hits, 'manual --write-baseline'), null, 2) + '\n');
  log(`✓ baseline rewritten: ${BASELINE_PATH} (${hits.length} entries)`);
} else {
  let baseline = null;
  try { baseline = JSON.parse(await readFile(BASELINE_PATH)); } catch { /* no baseline */ }

  if (!baseline) {
    await saveFile(BASELINE_PATH, JSON.stringify(buildBaseline(hits, 'first run'), null, 2) + '\n');
    log(`✓ baseline created: ${BASELINE_PATH} (${hits.length} entries) — 复查后再跑一次进入 diff 模式`);
    log(`\nRESULT: PASS`);
  } else {
    const allowed = baselineCounts(baseline);            // key -> 允许次数
    const scanned = countMap(hits);                       // key -> 实扫次数

    // 新增：实扫次数 > baseline 次数，超出部分逐条报（挑该 key 行号靠后的几条当代表）
    const hitsByKey = new Map();
    for (const h of hits) { const k = keyOf(h); if (!hitsByKey.has(k)) hitsByKey.set(k, []); hitsByKey.get(k).push(h); }
    const news = [];
    for (const [k, cnt] of scanned) {
      const allow = allowed.get(k) || 0;
      const extra = cnt - allow;
      if (extra > 0) {
        const arr = (hitsByKey.get(k) || []).slice().sort((a, b) => a.line - b.line);
        for (const h of arr.slice(arr.length - extra)) news.push(h);   // 超出的取靠后出现的实例
      }
    }
    // removed：baseline 有、实扫次数不足
    let removedCount = 0; const removedKeys = [];
    for (const [k, allow] of allowed) {
      const have = scanned.get(k) || 0;
      if (have < allow) { removedCount += (allow - have); removedKeys.push(`${k} (-${allow - have})`); }
    }

    log(`baseline: ${[...allowed.values()].reduce((a, b) => a + b, 0)} entries · removed: ${removedCount} · new: ${news.length}`);

    if (removedCount > 0) {
      log(`\n✓ ${removedCount} 处 baseline 违规已被清理（干得漂亮）`);
      for (const k of removedKeys.slice(0, 20)) log('    cleaned: ' + k);
      if (removedKeys.length > 20) log(`    ... 还有 ${removedKeys.length - 20} 处`);
      log(`  → 跑一次 args=['--write-baseline'] 同步 baseline\n`);
    }

    if (news.length > 0) {
      log(`\n✗ ${news.length} 处新增违规：`);
      const byFile = {};
      for (const h of news) (byFile[h.file] = byFile[h.file] || []).push(h);
      for (const [f, arr] of Object.entries(byFile)) {
        arr.sort((a, b) => a.line - b.line);
        log(`  ${f}`);
        for (const h of arr) log(`    L${h.line}  [${h.kind}]  ${h.match}`);
      }
      log(`\n修法：`);
      log(`  1. 颜色 → 收编进 tokens.css；尺寸 → 改用就近档值或 var(--fs-*/--sp-*/--r-*)；阴影 → 用 var(--shadow-*)；约定维 → 按 message 改`);
      log(`  2. 确实必须保留：args=['--write-baseline'] 并在 CHANGELOG 写明理由`);
      log(`\nRESULT: FAIL`);
      if (globalThis.__NODE__) process.exitCode = 1;
    } else if (removedCount === 0) {
      log('✓ check-tokens: 0 新增 · 0 减少 · baseline 保持不变');
      log(`\nRESULT: PASS`);
    } else {
      log(`\nRESULT: PASS`);
    }
  }
}
⟦/FILE⟧

⟦FILE design-spec-kit/tools/ci-check.js⟧
#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const KIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(label, cmd, args) {
  console.log(`\n── ${label} ─────────────────────────────`);
  const r = spawnSync(cmd, args, { cwd: KIT_ROOT, stdio: 'inherit' });
  if (r.error) {
    console.error(`${label}: ${r.error.message}`);
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const toolFiles = (await readdir(path.join(KIT_ROOT, 'tools')))
  .filter((name) => name.endsWith('.js'))
  .map((name) => path.join('tools', name))
  .sort();

for (const file of toolFiles) {
  run(`node --check ${file}`, process.execPath, ['--check', file]);
}

async function collectExtensionJs(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(path.join(KIT_ROOT, dir), { withFileTypes: true }); }
  catch { return out; }
  for (const entry of entries) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectExtensionJs(rel));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(rel);
  }
  return out.sort();
}

for (const file of await collectExtensionJs('extensions')) {
  run(`node --check ${file}`, process.execPath, ['--check', file]);
}

run('kit-doctor source mode', process.execPath, ['tools/kit-doctor.js', '--source']);
run('run-checks plan', process.execPath, ['tools/run-checks.js', '--list']);
// compat snapshot 是 kit 源仓 CI 资产，不进 bundle（fixture 的稳态 *.baseline.json
// 被 bundle 排除规则挡住，硬纳入会让拆包环境必然 FAIL）。bundle 拆包后无 tests/ → 明确 skip。
if (existsSync(path.join(KIT_ROOT, 'tests/compat-snapshot/run.js'))) {
  run('v2.1 compat snapshot', process.execPath, ['tests/compat-snapshot/run.js']);
} else {
  console.log('\n── v2.1 compat snapshot ─────────────────────────────');
  console.log('· 跳过：tests/ 不随 bundle 分发（source-only 检查，kit 源仓 CI 才跑）');
}
if (existsSync(path.join(KIT_ROOT, 'tests/design-sync/run.js'))) {
  run('design-sync engine unit', process.execPath, ['tests/design-sync/run.js']);
} else {
  console.log('\n── design-sync engine unit ─────────────────────────────');
  console.log('· 跳过：tests/ 不随 bundle 分发（source-only 检查，kit 源仓 CI 才跑）');
}
if (existsSync(path.join(KIT_ROOT, 'tests/glob-semantics/run.js'))) {
  run('coverage glob semantics unit', process.execPath, ['tests/glob-semantics/run.js']);
} else {
  console.log('\n── coverage glob semantics unit ─────────────────────────────');
  console.log('· 跳过：tests/ 不随 bundle 分发（source-only 检查，kit 源仓 CI 才跑）');
}
run('bundle drift check', process.execPath, ['tools/build-bundle.js', '--check']);

console.log('\nRESULT: PASS');
⟦/FILE⟧

⟦FILE design-spec-kit/tools/design-sync.js⟧
#!/usr/bin/env node
/**
 * design-sync.js · 设计 handoff → 消费仓 target 同步引擎（design-spec-kit · 与平台无关）
 *
 * 职责（engine，业务无关）：
 *   - 取源：解压 handoff zip（内置零依赖 ZIP 读取器，中央目录层做安全校验）或直接吃已解出的目录。
 *   - 定位：按 profile 的 sourceProjectSubdir / topNameHints 匹配 module 与 `<top>/project/`。
 *   - 三态对比：changed / onlyInSource / onlyInTarget（扣除 diffExcludes、targetOnlyAllow）。
 *   - _archive 双向提示（report-only，不自动删）。
 *   - 覆盖 / 删除安全门：只比对将被动到的 path 与 `git status --porcelain -- <target>` 交集，
 *     命中本地修改的覆盖须 --force-overwrite，删除须 --apply-deletes。
 *   - 非破坏 apply：默认只增 / 改，不删；写盘边界锁死在 target 子树内。
 *   - postSync 编排：link-check / manifest-sync / manifest-sync-check / design-spec-check / command。
 *   - `--json`：机读报告，供 skill wrapper 解析（不解析人类文本）。
 *
 * 不在职责：业务目录命名、业务后续 SOP、设计稿内容、manifest 路径（manifest-sync.js 自己读 config.json）。
 *
 * 配置：消费仓 `docs/design-spec/design-sync.json`（modules.<name>：target / sourceProjectSubdir /
 *   topNameHints / kind / transferExcludes / diffExcludes / targetOnlyAllow / postSync[]）。
 *
 * 用法（cwd = 消费仓根）：
 *   node <kit>/tools/design-sync.js --zip <handoff.zip> --module <m>            dry-run 默认？否——默认 apply
 *   node <kit>/tools/design-sync.js --zip <handoff.zip> --module <m> --dry-run  只报告不写盘
 *   node <kit>/tools/design-sync.js --module <m> --source <dir>                 吃已解出目录
 *   node <kit>/tools/design-sync.js --module <m> --check-only                   只跑 guard，不同步
 *   附加：--json（机读）--apply-deletes（放行删除）--force-overwrite（放行覆盖本地改动）
 */

import { promises as fs } from 'node:fs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = 'docs/design-spec/design-sync.json';

// ZIP 安全上限（§7.4）——超限即 abort，不落盘。
const ZIP_LIMITS = {
  maxEntries: 20000,
  maxEntryBytes: 128 * 1024 * 1024,
  maxTotalBytes: 512 * 1024 * 1024,
  maxRatio: 200, // uncompressed / compressed
};

const DEFAULT_TRANSFER_EXCLUDES = [
  '.DS_Store', '.design-canvas.state.json', '.thumbnail',
  'uploads/', 'screenshots/', 'tmp/',
];

// ─── CLI ───────────────────────────────────────────────────────
function parseArgs(argv) {
  const flags = {
    zip: null, source: null, module: null,
    dryRun: false, checkOnly: false, json: false,
    applyDeletes: false, forceOverwrite: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--zip') flags.zip = need(argv, ++i, '--zip');
    else if (a === '--source') flags.source = need(argv, ++i, '--source');
    else if (a === '--module') flags.module = need(argv, ++i, '--module');
    else if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--check-only') flags.checkOnly = true;
    else if (a === '--json') flags.json = true;
    else if (a === '--apply-deletes') flags.applyDeletes = true;
    else if (a === '--force-overwrite') flags.forceOverwrite = true;
    else throw new UserError(`未知参数：${a}`);
  }
  return flags;
}
function need(argv, i, name) {
  const v = argv[i];
  if (!v || v.startsWith('--')) throw new UserError(`${name} 需要参数值`);
  return v;
}
class UserError extends Error {}

// ─── glob 排除匹配 ─────────────────────────────────────────────
// 语义（够覆盖 handoff 排除清单）：
//   - 不含 `/` 的 pattern：按 basename glob 匹配（任意深度），如 `.DS_Store` / `*.standalone.html`。
//   - 以 `/` 结尾：目录前缀，如 `uploads/` 匹配 `uploads/**`。
//   - 其余：整相对路径 glob，`**` 跨 `/`，`*` 不跨。
function globToRegExp(glob, { fullPath }) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (fullPath && glob[i + 1] === '*') { re += '.*'; i++; }
      else re += fullPath ? '[^/]*' : '[^/]*';
    } else if ('.+?^${}()|[]\\'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}
function matchOne(relPath, pattern) {
  if (pattern.endsWith('/')) {
    const dir = pattern.slice(0, -1);
    // 无 `/` 的目录 pattern（如 `uploads/`）：任意深度的同名目录都算（对齐 rsync 语义）。
    if (!dir.includes('/')) return relPath.split('/').includes(dir);
    return relPath === dir || relPath.startsWith(pattern);
  }
  if (!pattern.includes('/')) {
    const base = path.basename(relPath);
    return globToRegExp(pattern, { fullPath: false }).test(base);
  }
  return globToRegExp(pattern, { fullPath: true }).test(relPath);
}
export function matchAny(relPath, patterns) {
  return patterns.some((p) => matchOne(relPath, p));
}

// ─── 零依赖 ZIP 读取器（中央目录权威，安全校验前置）──────────────
function u16(buf, o) { return buf.readUInt16LE(o); }
function u32(buf, o) { return buf.readUInt32LE(o); }

function findEOCD(buf) {
  const SIG = 0x06054b50;
  const min = 22;
  if (buf.length < min) throw new UserError('zip 太小，非合法归档');
  const from = Math.max(0, buf.length - (min + 0xffff));
  for (let i = buf.length - min; i >= from; i--) {
    if (u32(buf, i) === SIG) return i;
  }
  throw new UserError('找不到 ZIP End-Of-Central-Directory（损坏或非 zip）');
}

// 解析中央目录，做安全校验，返回可提取的 entry 列表。
export function readZipCentral(buf) {
  const eocd = findEOCD(buf);
  const totalEntries = u16(buf, eocd + 10);
  const cdSize = u32(buf, eocd + 12);
  const cdOffset = u32(buf, eocd + 16);
  if (totalEntries === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
    throw new UserError('检测到 ZIP64 归档，fail-closed（本引擎只处理常规 handoff zip）');
  }

  const entries = [];
  let p = cdOffset;
  let totalUncomp = 0;
  for (let n = 0; n < totalEntries; n++) {
    if (u32(buf, p) !== 0x02014b50) throw new UserError('中央目录记录签名错，zip 损坏');
    const gpFlag = u16(buf, p + 8);
    const method = u16(buf, p + 10);
    const compSize = u32(buf, p + 20);
    const uncompSize = u32(buf, p + 24);
    const nameLen = u16(buf, p + 28);
    const extraLen = u16(buf, p + 30);
    const commentLen = u16(buf, p + 32);
    const versionMadeBy = u16(buf, p + 4);
    const externalAttr = u32(buf, p + 38);
    const localOffset = u32(buf, p + 42);
    const rawName = buf.slice(p + 46, p + 46 + nameLen);
    const name = rawName.toString('utf8'); // handoff 名含中文，一律按 UTF-8 解（ditto 存的就是 UTF-8）

    if (compSize === 0xffffffff || uncompSize === 0xffffffff || localOffset === 0xffffffff) {
      throw new UserError(`ZIP64 尺寸字段（entry ${name}），fail-closed`);
    }
    if (gpFlag & 0x0001) throw new UserError(`加密 entry（${name}），fail-closed`);

    const isDir = name.endsWith('/');
    // symlink：unix (version-made-by 高字节 3) + 外部属性高 16 位为 S_IFLNK(0xA000)
    const unixMode = (externalAttr >>> 16) & 0xffff;
    const madeByUnix = (versionMadeBy >> 8) === 3;
    const isSymlink = madeByUnix && (unixMode & 0xf000) === 0xa000;

    entries.push({
      name, isDir, isSymlink, method, compSize, uncompSize, localOffset,
    });

    if (!isDir) totalUncomp += uncompSize;
    p += 46 + nameLen + extraLen + commentLen;
  }

  // ── 安全校验（§7.4）——任一越界即 abort ──
  if (entries.length > ZIP_LIMITS.maxEntries) {
    throw new UserError(`entry 数 ${entries.length} 超上限 ${ZIP_LIMITS.maxEntries}`);
  }
  if (totalUncomp > ZIP_LIMITS.maxTotalBytes) {
    throw new UserError(`解压总量 ${totalUncomp} 超上限 ${ZIP_LIMITS.maxTotalBytes}（疑似 zip bomb）`);
  }
  for (const e of entries) {
    if (e.isSymlink) throw new UserError(`拒绝 symlink entry：${e.name}（防逃逸）`);
    assertSafeEntryName(e.name);
    if (!e.isDir) {
      if (e.uncompSize > ZIP_LIMITS.maxEntryBytes) {
        throw new UserError(`entry ${e.name} 解压 ${e.uncompSize} 超单文件上限`);
      }
      if (e.compSize > 0 && e.uncompSize / e.compSize > ZIP_LIMITS.maxRatio) {
        throw new UserError(`entry ${e.name} 膨胀比 ${(e.uncompSize / e.compSize).toFixed(0)}x 异常（疑似 zip bomb）`);
      }
    }
  }
  return entries;
}

export function assertSafeEntryName(name) {
  if (name.includes('\0')) throw new UserError(`entry 名含 NUL：${name}`);
  const norm = name.replace(/\\/g, '/');
  if (norm.startsWith('/') || /^[a-zA-Z]:/.test(norm)) {
    throw new UserError(`拒绝绝对路径 entry：${name}`);
  }
  const segs = norm.split('/');
  if (segs.includes('..')) throw new UserError(`拒绝路径逃逸 entry（含 ..）：${name}`);
}

// 提取单个 entry 的字节：从本地头定位数据区，按 method inflate/store。
function extractEntryData(buf, entry) {
  const lo = entry.localOffset;
  if (u32(buf, lo) !== 0x04034b50) throw new UserError(`本地头签名错：${entry.name}`);
  const nameLen = u16(buf, lo + 26);
  const extraLen = u16(buf, lo + 28);
  const dataStart = lo + 30 + nameLen + extraLen;
  const raw = buf.slice(dataStart, dataStart + entry.compSize);
  if (entry.method === 0) return raw; // stored
  if (entry.method === 8) {
    const out = inflateRawSync(raw);
    if (out.length > ZIP_LIMITS.maxEntryBytes) throw new UserError(`entry ${entry.name} 实际解压超上限`);
    return out;
  }
  throw new UserError(`不支持的压缩方法 ${entry.method}（entry ${entry.name}），fail-closed`);
}

export async function extractZipToDir(zipPath, destDir) {
  const buf = await fs.readFile(zipPath);
  const entries = readZipCentral(buf); // 校验在此，越界即抛，未落任何盘
  const destRoot = path.resolve(destDir);
  for (const e of entries) {
    const outPath = path.resolve(destRoot, e.name);
    // 双保险：规范化后仍须在 destRoot 内
    if (outPath !== destRoot && !outPath.startsWith(destRoot + path.sep)) {
      throw new UserError(`entry ${e.name} 规范化后越出解压根，abort`);
    }
    if (e.isDir) { await fs.mkdir(outPath, { recursive: true }); continue; }
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, extractEntryData(buf, e));
  }
  return destRoot;
}

// ─── 目录遍历 ──────────────────────────────────────────────────
async function walkFiles(root, excludes) {
  const out = new Map(); // relPath -> absPath
  async function rec(dir, rel) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); }
    catch { return; }
    for (const ent of entries) {
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isSymbolicLink()) continue; // 不跟随 symlink
      if (ent.isDirectory()) {
        if (matchAny(childRel, excludes)) continue;
        await rec(path.join(dir, ent.name), childRel);
      } else if (ent.isFile()) {
        if (matchAny(childRel, excludes)) continue;
        out.set(childRel, path.join(dir, ent.name));
      }
    }
  }
  await rec(root, '');
  return out;
}

async function filesEqual(a, b) {
  const [ba, bb] = await Promise.all([fs.readFile(a), fs.readFile(b)]);
  return ba.equals(bb);
}

// ─── 三态分类 ──────────────────────────────────────────────────
export async function classify(srcMap, dstMap, { diffExcludes, targetOnlyAllow }) {
  const changed = [], onlyInSource = [], onlyInTarget = [], targetOnlyAllowHits = [];
  for (const [rel, srcAbs] of srcMap) {
    if (matchAny(rel, diffExcludes)) continue;
    const dstAbs = dstMap.get(rel);
    if (!dstAbs) onlyInSource.push(rel);
    else if (!await filesEqual(srcAbs, dstAbs)) changed.push(rel);
  }
  for (const rel of dstMap.keys()) {
    if (srcMap.has(rel)) continue;
    if (matchAny(rel, diffExcludes)) continue;
    if (matchAny(rel, targetOnlyAllow)) { targetOnlyAllowHits.push(rel); continue; }
    onlyInTarget.push(rel);
  }
  return {
    changed: changed.sort(),
    onlyInSource: onlyInSource.sort(),
    onlyInTarget: onlyInTarget.sort(),
    targetOnlyAllowHits: targetOnlyAllowHits.sort(),
  };
}

// ─── _archive 双向提示（report-only）──────────────────────────
export function archiveHints(srcMap, dstMap) {
  const hints = [];
  const stripArchive = (rel) => rel.split('/').filter((s) => s !== '_archive').join('/');
  for (const rel of srcMap.keys()) {
    if (!rel.split('/').includes('_archive')) continue;
    const orig = stripArchive(rel);
    if (orig !== rel && dstMap.has(orig)) hints.push({ kind: 'possible-archived-residue', path: orig, via: rel });
  }
  for (const rel of dstMap.keys()) {
    if (!rel.split('/').includes('_archive')) continue;
    const orig = stripArchive(rel);
    if (orig !== rel && srcMap.has(orig)) hints.push({ kind: 'possible-unarchived-residue', path: rel, via: orig });
  }
  return hints;
}

// ─── git 覆盖 / 删除安全门 ─────────────────────────────────────
function gitDirtyUnder(target) {
  const r = spawnSync('git', ['status', '--porcelain', '--', target], { cwd: process.cwd(), encoding: 'utf8' });
  if (r.status !== 0) return null; // 非 git 环境 / 失败：返回 null，上层降级
  const map = new Map(); // repo-root-relative path -> XY 状态
  for (const line of r.stdout.split('\n')) {
    if (!line.trim()) continue;
    const xy = line.slice(0, 2);
    let p = line.slice(3);
    if (p.includes(' -> ')) p = p.split(' -> ')[1]; // rename
    if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1);
    map.set(p, xy);
  }
  return map;
}

export function computeGate({ target, changed, onlyInTarget }, dirtyMap, { applyDeletes, forceOverwrite }) {
  const toRepoRel = (rel) => path.posix.join(target.split(path.sep).join('/'), rel);
  const overwriteConflicts = [], deleteConflicts = [];
  if (dirtyMap) {
    for (const rel of changed) {
      const xy = dirtyMap.get(toRepoRel(rel));
      if (xy) overwriteConflicts.push({ path: rel, status: xy.trim() || xy });
    }
    for (const rel of onlyInTarget) {
      const xy = dirtyMap.get(toRepoRel(rel));
      if (xy) deleteConflicts.push({ path: rel, status: xy.trim() || xy });
    }
  }
  const overwriteBlocked = forceOverwrite ? [] : overwriteConflicts.map((c) => c.path);
  const allowedChanged = changed.filter((rel) => !overwriteBlocked.includes(rel));
  // 删除：须 --apply-deletes；命中本地修改的删除额外须 --force-overwrite
  const deleteBlockedByDirty = new Set(forceOverwrite ? [] : deleteConflicts.map((c) => c.path));
  const allowedDeletes = applyDeletes ? onlyInTarget.filter((rel) => !deleteBlockedByDirty.has(rel)) : [];
  return {
    gitAvailable: !!dirtyMap,
    overwriteConflicts, deleteConflicts,
    overwriteBlocked, allowedChanged, allowedDeletes,
  };
}

// ─── apply（非破坏；写盘边界锁 target 子树）───────────────────
async function applySync({ srcMap, target, onlyInSource, allowedChanged, allowedDeletes }) {
  const targetRoot = path.resolve(process.cwd(), target);
  const written = [], deleted = [];
  const assertInTarget = (abs) => {
    if (abs !== targetRoot && !abs.startsWith(targetRoot + path.sep)) {
      throw new UserError(`写盘越界（不在 target 子树内）：${abs}`);
    }
  };
  for (const rel of [...onlyInSource, ...allowedChanged].sort()) {
    const srcAbs = srcMap.get(rel);
    const dstAbs = path.resolve(targetRoot, rel);
    assertInTarget(dstAbs);
    await fs.mkdir(path.dirname(dstAbs), { recursive: true });
    await fs.copyFile(srcAbs, dstAbs);
    written.push(rel);
  }
  for (const rel of allowedDeletes) {
    const dstAbs = path.resolve(targetRoot, rel);
    assertInTarget(dstAbs);
    await fs.rm(dstAbs, { force: true });
    deleted.push(rel);
  }
  return { written, deleted };
}

// ─── postSync ──────────────────────────────────────────────────
function runNodeTool(relFromSelf, args) {
  const tool = path.join(SELF_DIR, relFromSelf);
  const r = spawnSync(process.execPath, [tool, ...args], { cwd: process.cwd(), encoding: 'utf8' });
  return { exit: r.status ?? 1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

function runCommand(step) {
  const cmd = step.cmd;
  let file, args;
  if (Array.isArray(cmd)) { file = cmd[0]; args = cmd.slice(1); }
  else { file = process.env.SHELL || '/bin/sh'; args = ['-c', String(cmd)]; }
  const r = spawnSync(file, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, ...(step.env || {}) },
    timeout: step.timeoutMs ?? 300000,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const timedOut = r.error && r.error.code === 'ETIMEDOUT';
  return { exit: timedOut ? 124 : (r.status ?? 1), out: (r.stdout ?? '') + (r.stderr ?? ''), timedOut };
}

// link-check：保守 best-effort——报告断链但不硬闸（解析局限不该拦真实同步）。
export async function linkCheck(target, srcMap) {
  const broken = [];
  const refRe = /(?:href|src)\s*=\s*["']([^"'#?]+)["']|url\(\s*["']?([^"'()?#]+)["']?\s*\)/gi;
  for (const [rel, abs] of srcMap) {
    if (!/\.(html?|css)$/i.test(rel)) continue;
    let text;
    try { text = await fs.readFile(abs, 'utf8'); } catch { continue; }
    let m;
    while ((m = refRe.exec(text))) {
      const raw = (m[1] || m[2] || '').trim();
      if (!raw || /^(https?:|data:|mailto:|tel:|\/\/|#)/i.test(raw)) continue;
      if (raw.startsWith('/')) continue; // 绝对站点路径不判
      // `${f}` / `{{ asset }}` / `<%= asset %>` 只能在模板运行时才能解析；
      // 不能把字面占位符当作同包静态文件，从而制造假断链警告。
      if (raw.includes('${') || raw.includes('{{') || raw.includes('<%')) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(rel), raw));
      if (resolved.startsWith('..')) continue;
      if (!srcMap.has(resolved) && !srcMap.has(resolved.replace(/\/$/, '/index.html'))) {
        broken.push({ from: rel, ref: raw });
      }
    }
  }
  return broken;
}

async function runPostSync(steps, { module, target, srcMap, dryRun }) {
  const results = [];
  for (const step of steps) {
    const label = step.label || step.type;
    if (step.type === 'link-check') {
      const broken = dryRun ? [] : await linkCheck(target, srcMap);
      results.push({ type: 'link-check', label, status: 'PASS', warnings: broken, note: dryRun ? 'dry-run 跳过' : `${broken.length} 断链（warning，不阻断）` });
    } else if (step.type === 'manifest-sync') {
      const r = dryRun ? skipped() : runNodeTool('manifest-sync.js', ['--module', module]);
      results.push(toStep('manifest-sync', label, r, dryRun));
    } else if (step.type === 'manifest-sync-check') {
      const r = dryRun ? skipped() : runNodeTool('manifest-sync.js', ['--check', '--module', module]);
      results.push(toStep('manifest-sync-check', label, r, dryRun));
    } else if (step.type === 'design-spec-check') {
      const r = dryRun ? skipped() : runNodeTool('run-checks.js', []);
      results.push(toStep('design-spec-check', label, r, dryRun));
    } else if (step.type === 'command') {
      const r = dryRun ? skipped() : runCommand(step);
      results.push(toStep('command', label, r, dryRun));
    } else {
      results.push({ type: step.type, label, status: 'FAIL', note: `未知 postSync 类型：${step.type}` });
    }
  }
  return results;
  function skipped() { return { exit: 0, out: '', skipped: true }; }
  function toStep(type, label, r, dry) {
    if (r.skipped) return { type, label, status: 'SKIP', note: 'dry-run 跳过' };
    return { type, label, status: r.exit === 0 ? 'PASS' : 'FAIL', exit: r.exit, output: r.out.trimEnd() };
  }
}

// ─── module 匹配 ───────────────────────────────────────────────
function resolveModule(config, flags, detectedTop) {
  const names = Object.keys(config.modules || {});
  if (names.length === 0) throw new UserError('design-sync.json 未声明任何 module');
  if (flags.module) {
    if (!config.modules[flags.module]) throw new UserError(`--module ${flags.module} 未在 design-sync.json 声明`);
    return flags.module;
  }
  if (detectedTop) {
    for (const name of names) {
      const hints = config.modules[name].topNameHints || [];
      if (hints.some((h) => detectedTop.toLowerCase().includes(String(h).toLowerCase()))) return name;
    }
  }
  if (names.length === 1) return names[0];
  throw new UserError(`无法自动匹配 module（顶名=${detectedTop || 'N/A'}）——用 --module 显式指定`);
}

// 在解出的根下定位 `<top>/<sourceProjectSubdir>/`。
async function locateSource(root, sourceProjectSubdir) {
  const subdir = sourceProjectSubdir || 'project';
  // root 直接就是 project？
  if (await isDir(path.join(root, subdir))) {
    // root/<subdir> 存在 → top 为 root 的 basename
    return { top: path.basename(root), projectDir: path.join(root, subdir) };
  }
  const entries = (await fs.readdir(root, { withFileTypes: true })).filter((e) => e.isDirectory());
  for (const e of entries) {
    const cand = path.join(root, e.name, subdir);
    if (await isDir(cand)) return { top: e.name, projectDir: cand };
  }
  // 兜底：root 自己当 project（--source 直接指到 project 的情形）
  return { top: path.basename(root), projectDir: root };
}
async function isDir(p) { try { return (await fs.stat(p)).isDirectory(); } catch { return false; } }

// ─── 报告 ──────────────────────────────────────────────────────
function printHuman(report) {
  const p = (s) => process.stdout.write(s + '\n');
  p(`design-sync · module=${report.module} · mode=${report.mode}`);
  p('── Source detection ──────────────');
  p(`  top=${report.source.top}  project=${report.source.projectDir}`);
  if (report.mode === 'check-only') {
    p('── Check only（跳过 diff / apply）──');
  } else {
    p('── Diff plan ─────────────────────');
    p(`  changed:      ${report.diff.changed.length}`);
    p(`  onlyInSource: ${report.diff.onlyInSource.length}`);
    p(`  onlyInTarget: ${report.diff.onlyInTarget.length}（residue 候选；targetOnlyAllow 命中 ${report.diff.targetOnlyAllowHits.length} 已扣除）`);
    for (const rel of report.diff.onlyInTarget) p(`      - ${rel}`);
    if (report.diff.archiveHints.length) {
      p('  archive hints:');
      for (const h of report.diff.archiveHints) p(`      · ${h.kind}: ${h.path}`);
    }
    p('── Gate ──────────────────────────');
    if (!report.gate.gitAvailable) p('  (git 不可用，跳过本地改动检测)');
    if (report.gate.overwriteConflicts.length)
      p(`  覆盖命中本地改动 ${report.gate.overwriteConflicts.length}（${report.flags.forceOverwrite ? '已 --force-overwrite 放行' : '未放行→跳过，需 --force-overwrite'}）`);
    for (const c of report.gate.overwriteConflicts) p(`      - [${c.status}] ${c.path}`);
    if (report.gate.deleteConflicts.length)
      p(`  删除命中本地改动 ${report.gate.deleteConflicts.length}`);
    if (report.apply) {
      p('── Apply ─────────────────────────');
      p(`  written: ${report.apply.written.length}  deleted: ${report.apply.deleted.length}`);
    } else {
      p('── Apply ─────────────────────────');
      p('  (dry-run，未写盘)');
    }
  }
  p('── Post sync ─────────────────────');
  for (const s of report.postSync) {
    p(`  [${s.status}] ${s.label}${s.note ? ' · ' + s.note : ''}`);
    if (s.status === 'FAIL' && s.output) {
      for (const line of s.output.split('\n').slice(-8)) p(`      | ${line}`);
    }
  }
  p(`RESULT: ${report.result}`);
}

// ─── main ──────────────────────────────────────────────────────
async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

  let root = null, tmpDir = null;
  if (flags.zip) {
    tmpDir = path.join(process.env.TMPDIR || '/tmp', `design-sync-${process.pid}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
    root = await extractZipToDir(flags.zip, tmpDir);
  } else if (flags.source) {
    root = path.resolve(flags.source);
  } else if (!flags.checkOnly) {
    throw new UserError('需要 --zip <zip> 或 --source <dir>（或 --check-only）');
  }

  // 先定位真顶名（zip 解压根 basename 不是设计顶名），再据顶名 hints 匹配 module。
  let source = { top: null, projectDir: null };
  let moduleName;
  if (root) {
    const probeSubdir = flags.module
      ? (config.modules[flags.module].sourceProjectSubdir || 'project')
      : 'project';
    source = await locateSource(root, probeSubdir);
    moduleName = resolveModule(config, flags, source.top);
    const realSub = config.modules[moduleName].sourceProjectSubdir || 'project';
    if (realSub !== probeSubdir) source = await locateSource(root, realSub);
  } else {
    moduleName = resolveModule(config, flags, null);
  }

  const prof = config.modules[moduleName];
  const target = prof.target;
  if (!target) throw new UserError(`module ${moduleName} 未配置 target`);

  const transferExcludes = prof.transferExcludes || DEFAULT_TRANSFER_EXCLUDES;
  const diffExcludes = prof.diffExcludes || [];
  const targetOnlyAllow = prof.targetOnlyAllow || [];
  const postSyncSteps = prof.postSync || [];

  const mode = flags.checkOnly ? 'check-only' : (flags.dryRun ? 'dry-run' : 'apply');
  const report = { tool: 'design-sync', module: moduleName, mode, flags, source, result: 'PASS' };

  if (!flags.checkOnly) {
    const [srcMap, dstMap] = await Promise.all([
      walkFiles(source.projectDir, transferExcludes),
      walkFiles(path.resolve(process.cwd(), target), transferExcludes),
    ]);
    const diff = await classify(srcMap, dstMap, { diffExcludes, targetOnlyAllow });
    diff.archiveHints = archiveHints(srcMap, dstMap);
    const dirtyMap = gitDirtyUnder(target);
    const gate = computeGate({ target, changed: diff.changed, onlyInTarget: diff.onlyInTarget }, dirtyMap, flags);
    report.diff = diff;
    report.gate = gate;
    report._srcMap = srcMap;

    if (mode === 'apply') {
      report.apply = await applySync({
        srcMap, target,
        onlyInSource: diff.onlyInSource,
        allowedChanged: gate.allowedChanged,
        allowedDeletes: gate.allowedDeletes,
      });
    } else {
      report.apply = null;
    }
    // postSync 只在真正 apply 后跑（dry-run 全 SKIP）
    report.postSync = await runPostSync(postSyncSteps, {
      module: moduleName, target, srcMap, dryRun: mode !== 'apply',
    });
  } else {
    // check-only：不同步，只跑 guard（manifest-sync --check + design-spec-check）
    report.postSync = await runPostSync(
      [{ type: 'manifest-sync-check' }, { type: 'design-spec-check' }],
      { module: moduleName, target, srcMap: new Map(), dryRun: false },
    );
  }

  if (report.postSync.some((s) => s.status === 'FAIL')) report.result = 'FAIL';

  if (tmpDir) await fs.rm(tmpDir, { recursive: true, force: true });

  delete report._srcMap;
  if (flags.json) {
    process.stdout.write(JSON.stringify({ jsonVersion: 1, ...report }) + '\n');
  } else {
    printHuman(report);
  }
  if (report.result === 'FAIL') process.exitCode = 1;
}

// 只有被直接运行才跑 main；被 import（测试）时只导出纯函数。
const invokedDirectly = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (process.argv.includes('--json')) {
      process.stdout.write(JSON.stringify({ jsonVersion: 1, tool: 'design-sync', result: 'FAIL', errors: [msg] }) + '\n');
    } else {
      process.stderr.write(msg + '\n');
      process.stderr.write('RESULT: FAIL\n');
    }
    process.exitCode = 1;
  });
}
⟦/FILE⟧

⟦FILE design-spec-kit/tools/install-git-hooks.js⟧
#!/usr/bin/env node
import { access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const KIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hookPath = path.join(KIT_ROOT, '.githooks', 'pre-commit');

try {
  await access(hookPath);
} catch {
  console.error('missing .githooks/pre-commit');
  process.exit(1);
}

const r = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: KIT_ROOT,
  stdio: 'inherit',
});
if (r.error) {
  console.error(r.error.message);
  process.exit(1);
}
if (r.status !== 0) process.exit(r.status ?? 1);
console.log('git hooks installed: core.hooksPath=.githooks');
⟦/FILE⟧

⟦FILE design-spec-kit/tools/kit-doctor.js⟧
#!/usr/bin/env node
/**
 * kit-doctor.js · 实例化自检（design-spec-kit · 与平台无关）
 *
 * node-only；沙箱用户逐个跑 guard 即可（不需要在无 shell 沙箱里跑体检）。
 *
 * 守什么：kit「原样拷入即生效」这条假设最容易失效——guard 文件漏拷、配置区
 * 扫描目录/词典路径没按项目改（正则零命中，看着装了其实啥也不查）、入口没接、
 * 版本 pin 缺失或落后、DoD 表没提到已装 guard。本脚本把这些「装了没适配」的
 * 情况一次体检出来。
 *
 *   ① guard 文件在位 —— 已装 core 层期望的 check-*.js 是否都在 tools/（自身目录），
 *                       已装 extension 是否存在自己的 guard 文件
 *   ② 配置命中探针 —— 仅对启用层 guard 生效；从源码抽取关键配置常量，对 cwd 验证
 *                      「目录存在且非空 / 文件可读 / 必填数组非空」，不满足视为漏配
 *   ③ 入口接线 —— 优先读 docs/design-spec/config.json 的 runner.checkCommand；
 *                  未配置时检查 cwd 的 package.json scripts.check 是否指向 run-checks（或等价）
 *   ④ 版本 pin —— submodule 接入看 gitlink（不需 version 文件）；复制式接入才对比 .design-spec-kit.version
 *   ⑤ DoD 对账 —— cwd 的 CLAUDE.md 是否提到每个已装 guard 文件名
 *
 * FAIL 由 ①② 和未知 layer / extension 触发（guard 缺失 / 配置零命中 = 装了跟没装一样）；
 * ③④⑤ 只报 WARN。
 *
 * 两种模式：
 *   实例模式（默认）—— cwd = 被体检的实例项目根，跑全部 ①~⑤。
 *   kit 源仓模式 —— cwd 是 kit 仓本身（自动识别：tools/ 就是自身目录且上级有 CLAUDE.template.md；
 *                   或显式 --source）。源仓没有「项目配置」可体检，只跑 ①（且期望全部层的 guard
 *                   都在位——源仓必须携带完整套件），②③④⑤ 跳过。
 *
 * 层 / extension 真源：业务仓 docs/design-spec/config.json 的 kit.layers 声明启用项；
 * 已知 core layer 与 known extension 集合来自 tools/kit-registry.js，防两处配置漂移。
 *
 * 怎么跑：node tools/kit-doctor.js（从项目根）；kit 源仓自检：node tools/kit-doctor.js --source
 * ═════════════════════════════════════════════════════════════*/

import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { DEFAULT_INSTALLED_LAYERS as FALLBACK_LAYERS, KNOWN_EXTENSIONS, LAYER_GUARDS, isKnownExtension, isKnownLayer } from './kit-registry.js';

// ─── 配置（一般无需改；层开关去 run-checks.js 顶部改）─────────────
const args = [];   // 沙箱手改位（本文件 node-only，一般留空）

const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);

// ─── 定位 kit 自身目录（= 本脚本所在目录）与被体检的项目根（= cwd）────
const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.cwd();

const findings = { fail: [], warn: [] };
const fail = (msg) => findings.fail.push(msg);
const warn = (msg) => findings.warn.push(msg);

// ─── 小工具 ──────────────────────────────────────────────────
async function readIfExists(p) {
  try { return await readFile(p, 'utf8'); } catch { return null; }
}
async function dirNonEmpty(p) {
  try {
    const abs = path.isAbsolute(p) ? p : path.join(PROJECT_ROOT, p);
    const entries = await readdir(abs);
    return entries.length > 0;
  } catch { return false; }
}
async function fileReadable(p) {
  try {
    const abs = path.isAbsolute(p) ? p : path.join(PROJECT_ROOT, p);
    await stat(abs);
    return true;
  } catch { return false; }
}

// 从 guard 源码里抽一个「数组字面量」常量的元素个数与首个字符串值（粗粒度，够用来判断非空）。
function extractArrayConst(src, constName) {
  const re = new RegExp(`${constName}\\s*=\\s*(\\[[^\\]]*\\]|new Set\\(\\[[^\\]]*\\]\\))`, 'm');
  const m = src.match(re);
  if (!m) return null;
  const body = m[1];
  const items = [...body.matchAll(/'([^']*)'|"([^"]*)"/g)].map(g => g[1] ?? g[2]);
  return items;
}

// ─── 模式识别 + 层 / extension 配置读取 ────────────────────────
const selfIsProjectTools = path.resolve(SELF_DIR) === path.resolve(PROJECT_ROOT, 'tools');
const IS_SOURCE = EFFECTIVE_ARGS.includes('--source') ||
  (selfIsProjectTools && (await readIfExists(path.join(SELF_DIR, '..', 'CLAUDE.template.md'))) !== null);

const PROJECT_CONFIG_PATH = 'docs/design-spec/config.json';
async function readProjectConfig() {
  const src = await readIfExists(path.join(PROJECT_ROOT, PROJECT_CONFIG_PATH));
  if (!src) return {};
  try { return JSON.parse(src); }
  catch { warn(`${PROJECT_CONFIG_PATH} 不是合法 JSON，忽略外部配置并回退源码默认值`); return {}; }
}
const PROJECT_CONFIG = IS_SOURCE ? {} : await readProjectConfig();

async function readInstalledLayers() {
  const configured = PROJECT_CONFIG.kit?.layers;
  if (Array.isArray(configured) && configured.length > 0) return { layers: configured, from: PROJECT_CONFIG_PATH };

  const src = await readIfExists(path.join(SELF_DIR, 'run-checks.js'));
  if (src) {
    const items = extractArrayConst(src, 'INSTALLED_LAYERS');
    if (items && items.length > 0) return { layers: items, from: 'run-checks.js' };
    if (items) warn(`run-checks.js 的 INSTALLED_LAYERS 是空数组——聚合入口啥也不跑，请至少启用 'base'`);
  } else {
    warn(`tools/ 下读不到 run-checks.js —— 层配置无从读取，按兜底 [${FALLBACK_LAYERS.join(', ')}] 体检；建议拷入 run-checks.js 当聚合入口`);
  }
  return { layers: FALLBACK_LAYERS, from: '兜底默认' };
}
// kit 源仓必须携带全部 core 层与 known extension；实例按 config 的启用项。
const layerInfo = IS_SOURCE
  ? { layers: [...Object.keys(LAYER_GUARDS), ...Object.keys(KNOWN_EXTENSIONS)], from: '源仓模式（全部层 + known extension）' }
  : await readInstalledLayers();

// ── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）──────────────────
// modules 分节存在 → ①在位/⑤对账按跨模块 effective layers 并集体检，②探针逐模块展开；
// 不存在 → 单匿名默认模块，v2.1 行为不变。
const MODULES_CONFIG = !IS_SOURCE && PROJECT_CONFIG.modules && typeof PROJECT_CONFIG.modules === 'object' && !Array.isArray(PROJECT_CONFIG.modules)
  ? PROJECT_CONFIG.modules : null;
// 空 modules 分节 = run-checks 按模块规划后啥也不跑（false green）——doctor 同步报 FAIL；
// 体检其余部分按单模块视角继续，输出仍有参考价值。
if (MODULES_CONFIG && Object.keys(MODULES_CONFIG).length === 0) {
  fail(`${PROJECT_CONFIG_PATH} 的 modules 分节为空 —— run-checks 按模块规划后没有任何 guard 会跑（false green）；声明至少一个模块，或删除 modules 分节回到单模块模式`);
}
const MODULE_PLANS = MODULES_CONFIG && Object.keys(MODULES_CONFIG).length > 0
  ? Object.entries(MODULES_CONFIG).map(([name, mod]) => ({
      name,
      layers: Array.isArray(mod?.layers) && mod.layers.length > 0 ? mod.layers : layerInfo.layers,
    }))
  : [{ name: null, layers: layerInfo.layers }];

// ── customGuards 形态校验（MULTI-MODULE-PROPOSAL 方案 2）───────────────
// 只校验形态与引用；command 是仓内受信任代码，doctor 不宣称防注入。
if (!IS_SOURCE && PROJECT_CONFIG.customGuards !== undefined) {
  const raw = PROJECT_CONFIG.customGuards;
  if (!Array.isArray(raw)) {
    fail(`customGuards 必须是数组（${PROJECT_CONFIG_PATH}）`);
  } else {
    const seen = new Set();
    const builtinNames = new Set(Object.values(LAYER_GUARDS).flat().map((f) => f.replace(/\.js$/, '')));
    for (const [i, g] of raw.entries()) {
      if (!g || typeof g !== 'object' || typeof g.name !== 'string' || !g.name.trim() || typeof g.command !== 'string' || !g.command.trim()) {
        fail(`customGuards[${i}] 缺少非空 name / command（${PROJECT_CONFIG_PATH}）`); continue;
      }
      if (seen.has(g.name)) fail(`customGuards name 重复：'${g.name}'`);
      seen.add(g.name);
      if (builtinNames.has(g.name)) fail(`customGuards['${g.name}'] 与内置 guard 同名 —— 换一个 name（内置：${[...builtinNames].join(', ')}）`);
      if (g.module && (!MODULES_CONFIG || !Object.prototype.hasOwnProperty.call(MODULES_CONFIG, g.module))) {
        fail(`customGuards['${g.name}'].module='${g.module}' 未在 modules 分节声明`);
      }
      if (MODULES_CONFIG && Object.keys(MODULES_CONFIG).length > 0 && !g.module) {
        fail(`customGuards['${g.name}'] 缺少 module —— modules 分节存在时每个 custom guard 必须归属一个已声明模块（输出两态契约，禁止第三态裸名）`);
      }
    }
  }
}
const RAW_INSTALLED_LAYERS = [...new Set(MODULE_PLANS.flatMap((m) => m.layers))];
const UNKNOWN_LAYER_NAMES = RAW_INSTALLED_LAYERS.filter((name) => !isKnownLayer(name) && !isKnownExtension(name));
const INSTALLED_LAYERS = RAW_INSTALLED_LAYERS.filter(isKnownLayer);
const INSTALLED_EXTENSIONS = RAW_INSTALLED_LAYERS.filter(isKnownExtension);
const ENABLED_GUARDS = new Set(INSTALLED_LAYERS.flatMap(l => LAYER_GUARDS[l] || []));
const GUARD_LAYER = new Map(Object.entries(LAYER_GUARDS).flatMap(([layer, files]) => files.map(file => [file, layer])));

// ─── ① guard 文件在位 ────────────────────────────────────────
async function checkGuardsPresent() {
  const expected = new Set();
  for (const layer of INSTALLED_LAYERS) {
    for (const g of (LAYER_GUARDS[layer] || [])) expected.add(g);
  }
  let toolsEntries = [];
  try { toolsEntries = await readdir(SELF_DIR); } catch { /* ignore */ }
  const present = new Set(toolsEntries);

  const missing = [...expected].filter(g => !present.has(g)).sort();
  const report = [...expected].sort().map(g => `  ${present.has(g) ? '✓' : '✗'} ${g}`);
  if (missing.length > 0) {
    fail(`guard 文件缺失（已装层 [${INSTALLED_LAYERS.join(', ')}] 期望但 tools/ 里没有）：${missing.join(', ')}`);
  }

  for (const name of INSTALLED_EXTENSIONS) {
    const meta = KNOWN_EXTENSIONS[name];
    const extDir = path.join(SELF_DIR, '..', meta.dir);
    let entries = null;
    try { entries = await readdir(extDir); } catch { /* missing dir */ }
    if (entries === null) {
      const message = `extension '${name}' 已在 kit.layers 启用，但目录 ${meta.dir} 不存在`;
      if (IS_SOURCE) fail(`${message} —— 源仓 registry 已声明 known extension，源码必须携带实现`);
      else warn(`${message} —— 如需启用请安装该 extension；否则从 kit.layers 移除 '${name}'`);
      report.push(`  ${IS_SOURCE ? '✗' : '⚠'} ${name}/（${meta.dir} 不存在）`);
      continue;
    }
    const extPresent = new Set(entries);
    for (const guard of meta.guards) {
      const ok = extPresent.has(guard);
      report.push(`  ${ok ? '✓' : '✗'} ${name}/${guard}`);
      if (!ok) fail(`extension guard 文件缺失：${meta.dir}/${guard}`);
    }
  }

  for (const name of UNKNOWN_LAYER_NAMES) {
    fail(`kit.layers 包含未知 layer / extension '${name}' —— 已知层：[${Object.keys(LAYER_GUARDS).join(', ')}]；已知 extension：[${Object.keys(KNOWN_EXTENSIONS).join(', ')}]`);
    report.push(`  ✗ ${name}（未知 layer / extension，疑似拼写错误）`);
  }

  return report;
}

// ─── ② 配置命中探针 ──────────────────────────────────────────
// 每条探针：guard 文件、要抽的常量名、判据类型（dir=目录存在且非空 / file=文件可读）。
// optionalEmpty=true 表示空数组是合法关闭某个子维，而不是「装了没适配」。
const PROBES = [
  { guard: 'check-tokens.js',     const: 'SCAN_ROOTS', key: 'scanRoots',       kind: 'dirlist' },
  { guard: 'check-orphan-css.js', const: 'CSS_ROOTS',  key: 'cssRoots',        kind: 'dirlist' },
  { guard: 'check-ghost-classes.js', const: 'CSS_ROOTS', key: 'cssRoots',      kind: 'dirlist' },
  { guard: 'check-i18n.js',       const: 'DICT_PATHS', key: 'dictPaths',       kind: 'filelist' },
  { guard: 'check-deviation.js',  const: 'IMPL_ROOTS', key: 'implRoots',       kind: 'dirlist' },
  { guard: 'check-icons.js',      const: 'REGISTRY_SOURCES', key: 'registrySources', kind: 'filelist', optionalEmpty: true,
    note: '空数组 = 关闭同形重画维；check-icons 仍会跑同名异形扫描' },
];

function guardConfig(guardFile, moduleName) {
  const name = guardFile.replace(/\.js$/, '');
  const pick = (node) => node?.guards?.[name] || node?.guards?.[guardFile] || {};
  if (!moduleName) return pick(PROJECT_CONFIG);
  // 与 guard 内合并规则一致：key 级浅合并，模块键覆盖顶层公共缺省
  return { ...pick(PROJECT_CONFIG), ...pick(MODULES_CONFIG?.[moduleName]) };
}

function isKnownCheckCommand(command) {
  return /\brun-checks(?:\.js)?\b/.test(command) ||
    /\bdesign-spec-check\b/.test(command);
}

async function checkConfigProbes() {
  const report = [];
  for (const mp of MODULE_PLANS) {
    const tag = mp.name ? `${mp.name}/` : '';
    const moduleEnabledGuards = new Set(mp.layers.filter(isKnownLayer).flatMap((l) => LAYER_GUARDS[l] || []));
    for (const probe of PROBES) {
      const src = await readIfExists(path.join(SELF_DIR, probe.guard));
      if (src == null) continue; // 该 guard 未装，②不体检未装的文件（①已经报过缺失）
      if (!moduleEnabledGuards.has(probe.guard)) {
        const layer = GUARD_LAYER.get(probe.guard) || 'custom';
        report.push(`  · ${tag}${probe.guard} 未启用（属层 ${layer}），跳过配置探针`);
        continue;
      }
      const sourceItems = extractArrayConst(src, probe.const);
      const configuredItems = guardConfig(probe.guard, mp.name)[probe.key];
      const items = Array.isArray(configuredItems) ? configuredItems : sourceItems;
      const itemSource = Array.isArray(configuredItems) ? PROJECT_CONFIG_PATH : 'guard 源码默认值';
      if (items == null) {
        report.push(`  ? ${tag}${probe.guard} 的 ${probe.const} 未能从源码抽出，也没有在 ${PROJECT_CONFIG_PATH} 配 ${probe.key}（跳过）`);
        continue;
      }
      if (items.length === 0) {
        if (probe.optionalEmpty) {
          report.push(`  · ${tag}${probe.guard}  ${probe.const}=[]（${probe.note}）`);
          continue;
        }
        fail(`${tag}${probe.guard} 的 ${probe.const} 是空数组 —— 配置区未按项目改，等于该维度不查`);
        report.push(`  ✗ ${tag}${probe.guard}  ${probe.const}=[] 空`);
        continue;
      }
      let hitCount = 0;
      for (const item of items) {
        const ok = probe.kind === 'dirlist' ? await dirNonEmpty(item) : await fileReadable(item);
        if (ok) hitCount++;
      }
      if (hitCount === 0) {
        fail(`${tag}${probe.guard} 的 ${probe.const}=[${items.join(', ')}] 在当前项目全部零命中（目录不存在/为空或文件不可读）—— 配置命中探针失败，等于装了没适配`);
        report.push(`  ✗ ${tag}${probe.guard}  ${probe.const} 零命中：${items.join(', ')}`);
      } else {
        report.push(`  ✓ ${tag}${probe.guard}  ${probe.const} 命中 ${hitCount}/${items.length}：${items.join(', ')}（${itemSource}）`);
      }
    }
  }
  return report;
}

// ─── ③ 入口接线（WARN）───────────────────────────────────────
async function checkEntryWiring() {
  const runner = PROJECT_CONFIG.runner || {};
  const checkCommand = runner.checkCommand || runner.check;
  if (typeof checkCommand === 'string' && checkCommand.trim()) {
    const command = checkCommand.trim();
    if (isKnownCheckCommand(command)) {
      return `  ✓ runner.checkCommand = ${command}（${PROJECT_CONFIG_PATH}）`;
    }
    warn(`${PROJECT_CONFIG_PATH} 的 runner.checkCommand="${command}" 未识别为 run-checks.js 或已知等价入口（如 make design-spec-check）——请确认它会跑全部已启用 guard`);
    return `  ⚠ runner.checkCommand = ${command}（未识别等价入口）`;
  }

  const pkgSrc = await readIfExists(path.join(PROJECT_ROOT, 'package.json'));
  if (!pkgSrc) {
    warn(`cwd 下没有 package.json，且 ${PROJECT_CONFIG_PATH} 未配置 runner.checkCommand —— 查不到入口接线，若项目走非 npm runner（make / bun 等）请在 config.runner.checkCommand 登记等价命令`);
    return '  ? 无 package.json，跳过';
  }
  let pkg;
  try { pkg = JSON.parse(pkgSrc); } catch { warn('package.json 解析失败（非法 JSON），跳过入口接线检查'); return '  ? package.json 非法 JSON'; }
  const checkScript = pkg.scripts && pkg.scripts.check;
  if (!checkScript) {
    warn(`package.json scripts.check 未定义 —— 建议接 "node tools/run-checks.js"，或登记等价命令`);
    return '  ⚠ scripts.check 未定义';
  }
  if (/run-checks/.test(checkScript)) {
    return `  ✓ scripts.check = ${checkScript}`;
  }
  warn(`package.json scripts.check="${checkScript}" 未指向 run-checks.js —— 确认它是否是等价聚合入口（跑了全部已装 guard），否则会出现「跑 npm run check 却漏跑某些 guard」的假入口`);
  return `  ⚠ scripts.check="${checkScript}" 未显式指向 run-checks`;
}

// ─── ④ 版本 pin（WARN）───────────────────────────────────────
async function checkVersionPin() {
  const kitPkgSrc = await readIfExists(path.join(SELF_DIR, '..', 'package.json'));
  let kitVersion = null;
  try { kitVersion = kitPkgSrc ? JSON.parse(kitPkgSrc).version : null; } catch { /* ignore */ }

  // submodule / 独立 clone 接入：kit 目录本身受 git 管（.git 文件或目录存在），
  // 版本 pin 的真源 = gitlink（git submodule status），比手写 version 文件更精确且不会漂。
  // 这种接入不要求 .design-spec-kit.version——那是给「复制式接入」（纯拷文件、无 gitlink）用的。
  const kitDirIsGitManaged = await fileReadable(path.join(SELF_DIR, '..', '.git'));

  const pinSrc = await readIfExists(path.join(PROJECT_ROOT, '.design-spec-kit.version'));
  if (pinSrc == null) {
    // 更可靠的判据：cwd 自身是否就是 kit 仓（自身目录下能找到 build-bundle.js 且路径一致）
    const selfIsProjectTools = path.resolve(SELF_DIR) === path.resolve(PROJECT_ROOT, 'tools');
    if (selfIsProjectTools && await fileReadable(path.join(SELF_DIR, 'build-bundle.js'))) {
      return '  · kit 仓模式（自身即 kit 源仓，无需版本 pin），跳过';
    }
    if (kitDirIsGitManaged) {
      return `  · submodule 接入：版本 pin 由 gitlink 维护（当前 kit=${kitVersion ?? '未知'}），查看用 \`git submodule status\`——不需要 .design-spec-kit.version`;
    }
    warn(`复制式接入缺 .design-spec-kit.version —— 纯拷文件（无 submodule gitlink）时应写一个版本 pin 文件（一行 = 拷入的 kit 版本），否则升级时无法判断落后几版。submodule 接入忽略本条。`);
    return '  ⚠ 缺 .design-spec-kit.version（仅复制式接入需要；submodule 接入应删掉它，改看 gitlink）';
  }
  // 有 version 文件但同时是 submodule 接入 = 第二真源，必漂，提示删除
  if (kitDirIsGitManaged) {
    warn(`submodule 接入却存在 .design-spec-kit.version —— gitlink 已是版本真源，该文件是会漂的第二真源，建议删除，版本改看 \`git submodule status\``);
    return `  ⚠ submodule 接入应删掉 .design-spec-kit.version（gitlink 已 pin，当前 kit=${kitVersion ?? '未知'}）`;
  }
  const pinned = pinSrc.trim().split('\n')[0].trim();
  if (kitVersion && pinned !== kitVersion) {
    warn(`版本落后：实例 pin=${pinned}，kit 当前=${kitVersion} —— 按 docs/VERSIONING.md 升级 SOP 走一遍`);
    return `  ⚠ 版本落后：pin=${pinned} / kit=${kitVersion}`;
  }
  return `  ✓ 版本 pin=${pinned}${kitVersion ? ` 与 kit ${kitVersion} 一致` : ''}`;
}

// ─── ⑤ DoD 对账（WARN）───────────────────────────────────────
async function checkDodMention(installedGuardFiles) {
  const claudeMd = await readIfExists(path.join(PROJECT_ROOT, 'CLAUDE.md'));
  if (claudeMd == null) {
    warn('cwd 下没有 CLAUDE.md —— 装了 guard 但没有契约文件提示协作者何时跑它');
    return '  ? 无 CLAUDE.md，跳过';
  }
  const missing = installedGuardFiles.filter(g => !claudeMd.includes(g));
  if (missing.length > 0) {
    warn(`CLAUDE.md 未提到以下已装 guard 文件名，DoD 收尾同步表可能漏行：${missing.join(', ')}`);
    return `  ⚠ CLAUDE.md 未提及：${missing.join(', ')}`;
  }
  return '  ✓ CLAUDE.md 覆盖全部已装 guard 文件名';
}

// ─── Main ────────────────────────────────────────────────────

console.log(`kit-doctor 体检：${IS_SOURCE ? 'kit 源仓模式' : '实例模式'} · 项目根=${PROJECT_ROOT}  已启用项=[${RAW_INSTALLED_LAYERS.join(', ')}]（来源：${layerInfo.from}）\n`);

console.log('① guard 文件在位' + (IS_SOURCE ? '（源仓须携带全部层 + known extension）' : ''));
for (const line of await checkGuardsPresent()) console.log(line);

if (IS_SOURCE) {
  console.log('\n②~⑤ 跳过：源仓没有「项目配置 / 入口 / 版本 pin / 契约」可体检——这些属实例侧，装进项目后再跑本脚本。');
} else {
  console.log('\n② 配置命中探针');
  for (const line of await checkConfigProbes()) console.log(line);

  console.log('\n③ 入口接线');
  console.log(await checkEntryWiring());

  console.log('\n④ 版本 pin');
  console.log(await checkVersionPin());

  console.log('\n⑤ DoD 对账');
  const expectedGuardFiles = [...new Set([
    ...INSTALLED_LAYERS.flatMap(l => LAYER_GUARDS[l] || []),
    ...INSTALLED_EXTENSIONS.flatMap((name) => KNOWN_EXTENSIONS[name]?.guards || []),
  ])];
  console.log(await checkDodMention(expectedGuardFiles));
}

console.log('\n════════ 体检结论 ════════');
if (findings.warn.length > 0) {
  console.log(`WARN ${findings.warn.length} 条：`);
  for (const w of findings.warn) console.log(`  - ${w}`);
}
if (findings.fail.length > 0) {
  console.log(`\nFAIL ${findings.fail.length} 条：`);
  for (const f of findings.fail) console.log(`  - ${f}`);
  console.log(`\n修法：`);
  console.log(`  · guard 文件缺失 → 从 kit 仓 tools/ 重新拷入缺失文件`);
  console.log(`  · extension 缺失 → 安装对应 extensions/<name>/，或从 docs/design-spec/config.json 的 kit.layers 移除该 extension`);
  console.log(`  · 配置零命中 → 打开对应 guard 顶部「配置」区，把扫描目录/词典路径/registry 改成本项目真实路径`);
  console.log('\nRESULT: FAIL');
  process.exitCode = 1;
} else {
  console.log('\n✓ 无 FAIL 项' + (findings.warn.length ? '（仍有 WARN，建议处理但不阻塞）' : ''));
  console.log('\nRESULT: PASS');
}
⟦/FILE⟧

⟦FILE design-spec-kit/tools/kit-registry.js⟧
// design-spec-kit registry shared by run-checks and kit-doctor.
// Keep extension names here, not by scanning directories: copied installs may omit extensions.

export const LAYER_GUARDS = {
  base: ['check-tokens.js', 'check-icons.js', 'check-changelog.js', 'check-orphan-css.js'],
  i18n: ['check-i18n.js'],
  'ghost-classes': ['check-ghost-classes.js'],
  handoff: ['check-manifest.js', 'check-deviation.js'],
};

export const KNOWN_EXTENSIONS = {
  // 通用实现栈视觉契约执行器（MULTI-MODULE-PROPOSAL 方案 3）：
  // config-only 校验 + evidence runner + matcher 集（substring/regex/flutter-expanded/playwright-list）。
  'impl-visual': {
    dir: 'extensions/impl-visual',
    guards: ['check-impl-visual.js'],
  },
  // impl-visual 的注册别名（弃用窗口 ≥2 个 minor）：kit.layers 'flutter-visual' 与
  // extensions.flutter-visual 配置路径原样可用；guard 文件是薄转发壳（--as flutter-visual）。
  'flutter-visual': {
    dir: 'extensions/flutter-visual',
    guards: ['check-flutter-visual.js'],
  },
};

export const DEFAULT_INSTALLED_LAYERS = ['base'];

export function isKnownLayer(name) {
  return Object.prototype.hasOwnProperty.call(LAYER_GUARDS, name);
}

export function isKnownExtension(name) {
  return Object.prototype.hasOwnProperty.call(KNOWN_EXTENSIONS, name);
}
⟦/FILE⟧

⟦FILE design-spec-kit/tools/manifest-sync.js⟧
#!/usr/bin/env node
/**
 * manifest-sync.js · 设计源 manifest → generated 同步（design-spec-kit · MULTI-MODULE-PROPOSAL 方案 4）
 *
 * kit 上收的只有 schema-owned canonicalization：
 *   - projection：按 schema 语义裁剪 delegated（elements[].delegated / states.delegated
 *     只保留 to / contract_ref / status，去掉设计侧附注字段）
 *   - 稳定序列化：JSON 2 空格缩进 + 末尾换行；generated 追加 `generator` 字段记录
 *     projection 版本（schema-projection-v1），演进走 kit 版本发布
 *   - screens 清单：按 screen.id 排序生成 screensListPath
 *   - `--check`：对 generated 与 screens 清单做逐字节漂移校验（CI / commit gate 用）
 *
 * 设计源的抽取与业务特化 normalizer 留在消费仓，不进本工具。
 *
 * 配置：读各模块 check-manifest 的 sourceManifestDir / sourceManifestSuffix /
 * manifestDir / screensListPath（多模块下按 modules.<m>.guards ⊕ 顶层 guards 合并；
 * 未配 sourceManifestDir 的模块跳过）。
 *
 * 用法：
 *   node tools/manifest-sync.js               重生 generated + screens 清单
 *   node tools/manifest-sync.js --check       只校验不写盘，漂移则 FAIL
 *   node tools/manifest-sync.js --module <m>  只处理指定模块
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const CONFIG_PATH = 'docs/design-spec/config.json';
const GENERATED_SUFFIX = '.manifest.generated.json';
const GENERATOR_VERSION = 'schema-projection-v1';

const argv = process.argv.slice(2);
const mode = argv.includes('--check') ? 'check' : 'write';
// --module 必须带模块名：缺值/下一项是 flag 都 fail closed，绝不静默退化成全量
//（write 模式下退化会误重生全部模块的 generated）
const onlyModuleIdx = argv.indexOf('--module');
let onlyModule = null;
if (onlyModuleIdx >= 0) {
  const value = argv[onlyModuleIdx + 1];
  if (!value || value.startsWith('--')) {
    console.error('--module 需要模块名参数（用法：--module <name>）');
    console.error('RESULT: FAIL');
    process.exit(1);
  }
  onlyModule = value;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function normalizeText(value) {
  return value.endsWith('\n') ? value : `${value}\n`;
}

// schema-owned projection：裁剪 delegated 到 schema 要求的最小字段，追加 generator 版本
function toGeneratedManifest(source) {
  const manifest = structuredClone(source);

  for (const item of manifest.elements ?? []) {
    if (item.delegated) {
      item.delegated = {
        to: item.delegated.to,
        contract_ref: item.delegated.contract_ref,
        status: item.delegated.status,
      };
    }
  }

  if (manifest.states?.delegated) {
    manifest.states.delegated = manifest.states.delegated.map((item) => ({
      state: item.state,
      to: item.to,
      contract_ref: item.contract_ref,
      status: item.status,
    }));
  }

  manifest.generator = GENERATOR_VERSION;

  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function pickGuardCfg(node) {
  return node?.guards?.['check-manifest'] || node?.guards?.['check-manifest.js'] || {};
}

async function syncOne({ moduleName, guard, drift }) {
  const tag = moduleName ? `${moduleName}/` : '';
  const sourceDir = guard.sourceManifestDir;
  const sourceSuffix = guard.sourceManifestSuffix ?? '.manifest.json';
  const targetDir = guard.manifestDir ?? 'docs/design-spec/manifests';
  const screensListPath = guard.screensListPath ?? '';

  if (!sourceDir) {
    console.log(`  · ${tag}check-manifest 未配置 sourceManifestDir，跳过（该模块不走本工具同步）`);
    return [];
  }

  const sourceNames = (await fs.readdir(sourceDir))
    .filter((name) => name.endsWith(sourceSuffix))
    .sort();

  if (sourceNames.length === 0) {
    throw new Error(`${tag}${sourceDir} 下没有 ${sourceSuffix} 源 manifest`);
  }

  const planned = [];
  for (const sourceName of sourceNames) {
    const sourcePath = path.join(sourceDir, sourceName);
    const manifest = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
    const screenId = manifest.screen?.id;
    if (!screenId) {
      throw new Error(`${sourcePath} 缺 screen.id`);
    }
    planned.push({
      screenId,
      sourcePath,
      targetPath: path.join(targetDir, sourceName.slice(0, -sourceSuffix.length) + GENERATED_SUFFIX),
      raw: toGeneratedManifest(manifest),
    });
  }

  const screensText = normalizeText(planned.map((item) => item.screenId).sort().join('\n'));

  for (const item of planned) {
    if (mode === 'write') {
      await fs.mkdir(path.dirname(item.targetPath), { recursive: true });
      await fs.writeFile(item.targetPath, item.raw);
      continue;
    }
    const current = (await exists(item.targetPath))
      ? normalizeText(await fs.readFile(item.targetPath, 'utf8'))
      : '';
    if (current !== item.raw) {
      drift.push(`${item.targetPath} 未与 ${item.sourcePath} 同步`);
    }
  }

  if (screensListPath) {
    if (mode === 'write') {
      await fs.writeFile(screensListPath, screensText);
    } else {
      const current = (await exists(screensListPath))
        ? normalizeText(await fs.readFile(screensListPath, 'utf8'))
        : '';
      if (current !== screensText) {
        drift.push(`${screensListPath} 未与源 manifest 同步`);
      }
    }
  }

  return planned.map((item) => `${tag}${item.screenId}`);
}

async function main() {
  const config = await readJson(CONFIG_PATH);
  const modulesConfig = config.modules && typeof config.modules === 'object' && !Array.isArray(config.modules)
    ? config.modules : null;

  let plans;
  if (modulesConfig) {
    const names = Object.keys(modulesConfig);
    if (names.length === 0) throw new Error('modules 分节为空——声明至少一个模块，或删除 modules 分节回到单模块模式');
    if (onlyModule && !names.includes(onlyModule)) throw new Error(`--module ${onlyModule} 未在 modules 分节声明`);
    plans = names
      .filter((name) => !onlyModule || name === onlyModule)
      .map((name) => ({
        moduleName: name,
        guard: { ...pickGuardCfg(config), ...pickGuardCfg(modulesConfig[name]) },
      }));
  } else {
    if (onlyModule) throw new Error('--module 仅在 modules 分节存在时可用');
    plans = [{ moduleName: null, guard: pickGuardCfg(config) }];
  }

  const drift = [];
  const synced = [];
  for (const plan of plans) {
    synced.push(...await syncOne({ ...plan, drift }));
  }

  if (drift.length > 0) {
    console.error('manifest-sync 漂移：');
    for (const item of drift) console.error(`  - ${item}`);
    console.error('修法：node tools/design-spec-kit/tools/manifest-sync.js 重生并提交');
    console.error('RESULT: FAIL');
    process.exitCode = 1;
    return;
  }

  const action = mode === 'write' ? '已重生' : '校验通过';
  console.log(`manifest-sync（${GENERATOR_VERSION}）${action}：${synced.join(', ') || '无屏'}`);
  console.log('RESULT: PASS');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  console.error('RESULT: FAIL');
  process.exitCode = 1;
});
⟦/FILE⟧

⟦FILE design-spec-kit/tools/run-checks.js⟧
#!/usr/bin/env node
/**
 * run-checks.js · guard 聚合入口（design-spec-kit · 与平台无关）
 *
 * node-only；沙箱用户逐个跑 guard 即可（每个 guard 自带双环境头，本文件不需要）。
 *
 * 守什么：把「跑没跑全部 guard」从人肉记忆变成一条命令——按「已启用层」串跑 guard，
 * 汇总每个 guard 的末行 RESULT 与退出码；任一 FAIL（或启用层缺 guard 文件）→ 总退出码 1。
 *
 * 层感知（防「整目录拷入 → 可选 guard 被误跑」）：tools/ 可以整目录拷入，本文件只跑
 * INSTALLED_LAYERS 启用层的 guard；未启用层的 guard 文件留在目录里会被明确「跳过」，
 * 不在任何层清单里的 tools/check-*.js 视为项目自定义 guard，默认照跑。
 *
 * Extension 感知：extensions/<name>/ 不参与顶层未知 guard 自动发现。只有 kit.layers 点名、
 * 且 name 存在于 KNOWN_EXTENSIONS 的 extension 才会被发现；目录缺失只给 setup 提示。
 *
 * ★层开关单一真源 = 业务仓 docs/design-spec/config.json 的 kit.layers（本文件 / kit-doctor /
 *   各 guard 同读）；没有该配置时才回退本文件的 DEFAULT_INSTALLED_LAYERS。
 *   submodule 模式下 kit 源码保持只读——启用/关闭层一律改业务仓 config，别改这里。
 *
 * 怎么跑：
 *   node tools/run-checks.js              串跑启用层 guard
 *   node tools/run-checks.js --list       只列将跑/跳过/缺失，不执行
 *   node tools/run-checks.js --strict     未知 layer / extension 名、已启用但未安装的 extension 作为失败
 *   node tools/run-checks.js --execute-impl  透传给 extension guard
 *   node tools/run-checks.js --only check-tokens   只跑一个（无视 core 层开关；带不带 .js 都行）
 *   node tools/run-checks.js --all        无视 core 层开关跑全部 tools/ guard
 *   node tools/run-checks.js --json       抑制文本，输出单行稳定 JSON 汇总（jsonVersion 承诺字段稳定；
 *                                         文本汇总不作为解析面）；exit 语义与文本模式一致
 * ═════════════════════════════════════════════════════════════*/

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { DEFAULT_INSTALLED_LAYERS, KNOWN_EXTENSIONS, LAYER_GUARDS, isKnownExtension, isKnownLayer } from './kit-registry.js';

// ─── 配置 ──────────────────────────────────────────────────────
const args = [];   // 沙箱手改位（本文件 node-only，一般留空，走 process.argv）
const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);
// --json 是全路径契约：planning / config 失败的早退分支也必须输出 JSON，不能漏文本
const JSON_MODE = EFFECTIVE_ARGS.includes('--json');

// 统一失败出口：文本模式打原有行 + RESULT: FAIL；JSON 模式输出稳定单行 JSON（errors[] 承载原因）
function emitFailureAndExit(errorLines, { modules = null } = {}) {
  if (JSON_MODE) {
    console.log(JSON.stringify({
      jsonVersion: 1, modules, guards: [], missing: [], unknownLayers: [],
      errors: errorLines.map((l) => l.replace(/^[✗\s]+/, '')),
      result: 'FAIL',
    }));
  } else {
    for (const line of errorLines) console.log(line);
    console.log('RESULT: FAIL');
  }
  process.exit(1);
}

async function readProjectConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json', 'utf8')); }
  catch { return {}; }
}
const PROJECT_CONFIG = await readProjectConfig();

// 本实例启用的层 / extension。优先读业务仓 docs/design-spec/config.json 的 kit.layers；
// 没有配置时回退 base。这样 submodule 不需要改源码。
const configuredLayers = PROJECT_CONFIG.kit?.layers;
const INSTALLED_LAYERS = Array.isArray(configuredLayers) && configuredLayers.length > 0 ? configuredLayers : DEFAULT_INSTALLED_LAYERS;

// ─── 多模块 profile（MULTI-MODULE-PROPOSAL 方案 1）─────────────────
// modules 分节存在 → 每个模块按自己的 effective layers（modules.<m>.layers ?? kit.layers）
// 重复执行 guard，输出一律带 `<module>/` 前缀（哪怕只有一个显式模块——两态、无第三态）；
// modules 不存在 → 单匿名默认模块，v2.1 行为逐字节不变（compat snapshot 对拍）。
const MODULES_CONFIG = PROJECT_CONFIG.modules && typeof PROJECT_CONFIG.modules === 'object' && !Array.isArray(PROJECT_CONFIG.modules)
  ? PROJECT_CONFIG.modules : null;
// 空 modules 分节 = 所有 guard 都不跑的 false green，直接 FAIL（要么声明模块，要么删分节回单模块模式）
if (MODULES_CONFIG && Object.keys(MODULES_CONFIG).length === 0) {
  emitFailureAndExit([
    '✗ docs/design-spec/config.json 的 modules 分节为空 —— 按模块规划后没有任何 guard 会跑（false green）',
    '  修法：在 modules 下声明至少一个模块，或删除 modules 分节回到单模块模式',
  ]);
}
// [{ name: 'mobile-app'|null, layers: [...] }]；name=null = 匿名默认模块（旧行为）
const MODULE_PLANS = MODULES_CONFIG
  ? Object.entries(MODULES_CONFIG).map(([name, mod]) => ({
      name,
      layers: Array.isArray(mod?.layers) && mod.layers.length > 0 ? mod.layers : INSTALLED_LAYERS,
    }))
  : [{ name: null, layers: INSTALLED_LAYERS }];

// ─── 自定义 guard 登记（MULTI-MODULE-PROPOSAL 方案 2）────────────────
// 判定契约（保守合取）：exit != 0 永远 FAIL；exit == 0 且末个 `RESULT:` 行为 FAIL → FAIL；
// 无 RESULT 行按 exit code。信任边界：command 是仓内受版本控制的受信任代码，runner 原样
// 执行——customGuards 不是安全边界，doctor 只校验形态不防注入。
const CUSTOM_GUARDS_RAW = PROJECT_CONFIG.customGuards;
const CUSTOM_GUARDS = [];
{
  const errors = [];
  if (CUSTOM_GUARDS_RAW !== undefined && !Array.isArray(CUSTOM_GUARDS_RAW)) {
    errors.push('customGuards 必须是数组');
  } else if (Array.isArray(CUSTOM_GUARDS_RAW)) {
    const seen = new Set();
    for (const [i, g] of CUSTOM_GUARDS_RAW.entries()) {
      if (!g || typeof g !== 'object' || typeof g.name !== 'string' || !g.name.trim() || typeof g.command !== 'string' || !g.command.trim()) {
        errors.push(`customGuards[${i}] 缺少非空 name / command`); continue;
      }
      if (seen.has(g.name)) { errors.push(`customGuards name 重复：'${g.name}'`); continue; }
      seen.add(g.name);
      const builtinNames = new Set(Object.values(LAYER_GUARDS).flat().map((f) => f.replace(/\.js$/, '')));
      if (builtinNames.has(g.name)) { errors.push(`customGuards['${g.name}'] 与内置 guard 同名 —— 换一个 name`); continue; }
      if (g.module && (!MODULES_CONFIG || !Object.prototype.hasOwnProperty.call(MODULES_CONFIG, g.module))) {
        errors.push(`customGuards['${g.name}'].module='${g.module}' 未在 modules 分节声明`); continue;
      }
      // 输出两态契约（proposal 方案 1）：modules 分节存在时所有输出一律带 <module>/ 前缀——
      // 无 module 的 custom guard 会偷渡出第三态裸名输出，fail closed。
      if (MODULES_CONFIG && !g.module) {
        errors.push(`customGuards['${g.name}'] 缺少 module —— modules 分节存在时每个 custom guard 必须归属一个已声明模块（输出两态契约，禁止第三态裸名）`); continue;
      }
      CUSTOM_GUARDS.push({
        kind: 'custom', name: g.name, command: g.command,
        module: g.module || null, layer: g.layer || null,
        file: g.name, label: `${g.module ? `${g.module}/` : ''}${g.name}`,
      });
    }
  }
  if (errors.length > 0) {
    emitFailureAndExit(errors.map((e) => `✗ ${e}（docs/design-spec/config.json）`),
      { modules: MODULES_CONFIG ? Object.keys(MODULES_CONFIG) : null });
  }
}

const layerSplit = (layers) => ({
  core: layers.filter(isKnownLayer),
  extensions: layers.filter(isKnownExtension),
  unknown: layers.filter((name) => !isKnownLayer(name) && !isKnownExtension(name)),
});
// 全局未知名集合（跨模块去重，供 --strict / 提示用）
const UNKNOWN_LAYER_NAMES = [...new Set(MODULE_PLANS.flatMap((m) => layerSplit(m.layers).unknown))];

const GUARD_PATTERN = /^check-.+\.js$/i;          // guard 文件命名约定
const EXCLUDE = new Set([]);                       // 需要排除的具体文件名（留空即可）


// ─── 定位 guard 目录 = 本脚本自身所在目录 ───────────────────────
const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const KIT_ROOT = path.resolve(SELF_DIR, '..');

async function discoverCoreGuards() {
  let entries;
  try { entries = await readdir(SELF_DIR); } catch { entries = []; }
  return entries
    .filter(name => GUARD_PATTERN.test(name) && !EXCLUDE.has(name))
    .filter(name => !name.endsWith('.baseline.json'))
    .sort();
}

async function discoverEnabledExtensions(extensionNames) {
  const plans = [];
  for (const name of extensionNames) {
    const meta = KNOWN_EXTENSIONS[name];
    const dir = path.join(KIT_ROOT, meta.dir);
    let entries = null;
    try { entries = await readdir(dir); } catch { /* missing dir */ }
    if (entries === null) {
      plans.push({ name, dir, status: 'missing-dir', run: [], missing: [], skipped: meta.guards });
      continue;
    }
    const present = new Set(entries);
    const run = meta.guards
      .filter((file) => present.has(file))
      .map((file) => ({
        kind: 'extension',
        extension: name,
        file,
        label: `${name}/${file}`,
        absPath: path.join(dir, file),
      }));
    const missing = meta.guards.filter((file) => !present.has(file)).sort();
    plans.push({ name, dir, status: 'present', run, missing, skipped: [] });
  }
  return plans;
}

function parseFlags(argv) {
  const flags = { list: false, only: null, all: false, strict: false, executeImpl: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') flags.list = true;
    else if (a === '--json') flags.json = true;
    else if (a === '--all') flags.all = true;
    else if (a === '--strict') flags.strict = true;
    else if (a === '--execute-impl') flags.executeImpl = true;
    else if (a === '--only') flags.only = argv[++i] || null;
    else if (a.startsWith('--only=')) flags.only = a.slice('--only='.length);
  }
  return flags;
}

// 按层把「存在的 core guard」分成三份：将跑 / 跳过（属已知但未启用的层）/ 启用层缺文件。
function planCoreByLayers(present, all, coreLayers) {
  const layerOf = new Map();                                        // 文件名 -> 所属层
  for (const [layer, files] of Object.entries(LAYER_GUARDS)) for (const f of files) layerOf.set(f, layer);
  const enabled = new Set(coreLayers.flatMap(l => LAYER_GUARDS[l] || []));
  const run = [], skipped = [];
  for (const g of present) {
    if (all || enabled.has(g) || !layerOf.has(g)) {
      run.push({ kind: 'core', file: g, label: g, absPath: path.join(SELF_DIR, g) }); // 启用层 / 自定义 guard 照跑
    } else {
      skipped.push({ file: g, layer: layerOf.get(g) });
    }
  }
  const missing = all ? [] : [...enabled].filter(g => !present.includes(g)).sort();
  return { run, skipped, missing };
}

function normalizeGuardName(n) {
  const base = n.includes('/') ? n.split('/').pop() : n;
  return base.endsWith('.js') ? base.slice(0, -3) : base;
}

// --only 匹配：裸 guard 名匹配所有模块的该 guard；`<module>/<guard>` 只匹配该模块。
// fail closed：多模块下 `a/b` 的 a 既不是已声明模块也不是 known extension → 视为拼错的模块名，
// 不降级成裸名匹配（那会静默跨模块全跑），走「未匹配到任何 guard」FAIL。
function matchesOnly(check, want) {
  const slash = want.indexOf('/');
  if (slash > 0 && MODULES_CONFIG) {
    const head = want.slice(0, slash);
    if (Object.prototype.hasOwnProperty.call(MODULES_CONFIG, head)) {
      if (check.module !== head) return false;
      want = want.slice(slash + 1);
    } else if (!isKnownExtension(head)) {
      return false;
    }
  }
  const baseLabel = check.module ? check.label.slice(check.module.length + 1) : check.label;
  const normalized = normalizeGuardName(want);
  return normalizeGuardName(baseLabel) === normalized ||
    normalizeGuardName(check.file) === normalized ||
    baseLabel.replace(/\.js$/, '') === normalized;
}

// 子进程跑一个 guard，cwd 继承调用方 cwd（不是 SELF_DIR）——guard 的相对路径配置
// （SCAN_ROOTS 等）都是相对项目 cwd 写的。
function runOne(check, flags) {
  return new Promise(resolve => {
    // 模块上下文经环境变量传给 guard（guard 内以 modules.<m>.guards.<g> ⊕ 顶层 guards.<g> 合成 effective config）
    const env = check.module ? { ...process.env, DESIGN_SPEC_KIT_MODULE: check.module } : process.env;
    const common = { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], env };
    // custom guard：原样执行登记的 command（仓内受信任代码，非安全边界）
    const child = check.kind === 'custom'
      ? spawn(check.command, { ...common, shell: true })
      : spawn(process.execPath, [check.absPath, ...(check.kind === 'extension' && flags.executeImpl ? ['--execute-impl'] : [])], common);
    let out = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { out += d.toString(); });
    child.on('close', code => resolve({ check, code, out }));
    child.on('error', err => resolve({ check, code: 1, out: `spawn error: ${err.message}` }));
  });
}

function lastResultLine(out) {
  const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^RESULT:\s*(PASS|FAIL)/.test(lines[i])) return lines[i];
  }
  return null;
}

// guard 的 `WARNINGS: n` 机器行（无该行 = 0；与 RESULT 同为约定解析面，人类叙述文本不解析）
function lastWarningsCount(out) {
  const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = /^WARNINGS:\s*(\d+)$/.exec(lines[i]);
    if (m) return Number(m[1]);
  }
  return 0;
}

// ─── baseline 债务可见性：汇总行带各账本 totalEntries ─────────────
// 账本文件是债务真源（guard --write-baseline 写入 totalEntries），run-checks 只读不判——
// 路径解析逐字镜像 guard 侧规则：模块模式只认模块级 baselinePath（不继承顶层，分账铁律），
// 缺省 docs/design-spec/baselines/<module>/<guard>.baseline.json；单模块模式认顶层
// guards.<g>.baselinePath，缺省 tools/<guard>.baseline.json。读不到 / 无 totalEntries → 不展示。
const BASELINE_GUARDS = new Set(['check-tokens', 'check-icons', 'check-orphan-css', 'check-ghost-classes', 'check-i18n']);
function pickGuardCfgFor(node, guard) {
  return node?.guards?.[guard] || node?.guards?.[`${guard}.js`] || {};
}
async function baselineTotal(check) {
  const guard = normalizeGuardName(check.file);
  if (check.kind !== 'core' || !BASELINE_GUARDS.has(guard)) return null;
  let baselinePath;
  if (check.module) {
    const modCfg = pickGuardCfgFor(PROJECT_CONFIG.modules?.[check.module], guard);
    baselinePath = modCfg.baselinePath || `docs/design-spec/baselines/${check.module}/${guard}.baseline.json`;
  } else {
    const topCfg = pickGuardCfgFor(PROJECT_CONFIG, guard);
    baselinePath = Object.prototype.hasOwnProperty.call(topCfg, 'baselinePath') ? topCfg.baselinePath : `tools/${guard}.baseline.json`;
  }
  try {
    const parsed = JSON.parse(await readFile(baselinePath, 'utf8'));
    return typeof parsed.totalEntries === 'number' ? parsed.totalEntries : null;
  } catch { return null; }
}

function enabledLabel() {
  return INSTALLED_LAYERS.join(', ');
}

// ─── Main ────────────────────────────────────────────────────

const flags = parseFlags(EFFECTIVE_ARGS);
const presentCore = await discoverCoreGuards();

// 逐模块规划：每个模块按自己的 effective layers 生成 core/extension 计划；
// 匿名默认模块（name=null）不加前缀，v2.1 输出逐字节不变。
const resolvedModules = [];
for (const mp of MODULE_PLANS) {
  const split = layerSplit(mp.layers);
  const corePlan = planCoreByLayers(presentCore, flags.all, split.core);
  const extensionPlans = (await discoverEnabledExtensions(split.extensions)).map((p) => ({ ...p, module: mp.name }));
  const decorate = (check) => ({ ...check, module: mp.name, label: mp.name ? `${mp.name}/${check.label}` : check.label });
  corePlan.run = corePlan.run.map(decorate);
  for (const p of extensionPlans) p.run = p.run.map(decorate);
  resolvedModules.push({ name: mp.name, layers: mp.layers, corePlan, extensionPlans });
}

let checks = [...resolvedModules.flatMap((m) => [...m.corePlan.run, ...m.extensionPlans.flatMap((p) => p.run)]), ...CUSTOM_GUARDS];

// 老 auto-discovery（不在任何层清单的 tools/check-*.js 照跑）弃用中：只对复制式接入有意义，
// v2.2 起唯一推荐入口是 config.customGuards；与 customGuards 撞名 = 双跑风险，直接 FAIL。
const LAYER_OF_GLOBAL = new Set(Object.values(LAYER_GUARDS).flat());
const autoDiscovered = presentCore.filter((g) => !LAYER_OF_GLOBAL.has(g));
for (const g of autoDiscovered) {
  const base = normalizeGuardName(g);
  const clash = CUSTOM_GUARDS.find((c) => c.name === base || c.name === base.replace(/^check-/, ''));
  if (clash) {
    emitFailureAndExit([`✗ tools/${g}（auto-discovery）与 customGuards['${clash.name}'] 撞名 —— 会双跑同一检查；删除该文件或改 customGuards name`],
      { modules: MODULES_CONFIG ? Object.keys(MODULES_CONFIG) : null });
  }
}
const modTag = (name) => (name ? `${name}/` : '');
const summaryName = (check) => `${modTag(check.module)}${normalizeGuardName(check.file)}`;
const coreSkipped = resolvedModules.flatMap((m) => m.corePlan.skipped.map((s) => ({ ...s, module: m.name })));
const coreMissing = resolvedModules.flatMap((m) => m.corePlan.missing.map((file) => ({ file, module: m.name })));
const allExtensionPlans = resolvedModules.flatMap((m) => m.extensionPlans);
const extensionMissingGuards = allExtensionPlans
  .filter((p) => p.status === 'present')
  .flatMap((p) => p.missing.map((file) => ({ extension: p.name, module: p.module, file })));
const missingExtensionDirs = allExtensionPlans.filter((p) => p.status === 'missing-dir');

function headerLabel() {
  if (!MODULES_CONFIG) return `启用层/扩展 [${enabledLabel()}]`;
  return `模块 [${MODULE_PLANS.map((m) => m.name).join(', ')}]`;
}
function printModuleLayers() {
  if (!MODULES_CONFIG) return;
  for (const m of resolvedModules) console.log(`  · ${m.name}: layers [${m.layers.join(', ')}]`);
}

if (presentCore.length === 0) {
  emitFailureAndExit([
    `✗ ${SELF_DIR} 下没找到任何 check-*.js —— 至少应装 guard①（check-tokens.js）`,
    `修法：确认已把 tools/ 下的 guard 文件从 kit 拷入本项目`,
  ], { modules: MODULES_CONFIG ? Object.keys(MODULES_CONFIG) : null });
} else {
  if (flags.only) {
    const matched = checks.filter((check) => matchesOnly(check, flags.only));   // --only 无视 core 层开关；extension 仍须 opt-in
    if (matched.length === 0) {
      // 立即结束：不落进空 checks 分支重复打印 RESULT（末行 RESULT 是判读约定）
      emitFailureAndExit([`✗ --only ${flags.only} 未匹配到任何已发现 guard（core 存在：${presentCore.map(normalizeGuardName).join(', ')}；enabled extensions：${[...new Set(resolvedModules.flatMap((m) => layerSplit(m.layers).extensions))].join(', ') || '无'}）`],
        { modules: MODULES_CONFIG ? Object.keys(MODULES_CONFIG) : null });
    } else {
      checks = matched;
      coreSkipped.length = 0; coreMissing.length = 0;
      extensionMissingGuards.length = 0;
    }
  }

  const unknownIsFail = flags.strict && UNKNOWN_LAYER_NAMES.length > 0;
  const missingExtensionDirIsFail = flags.strict && missingExtensionDirs.length > 0;
  const missingIsFail = coreMissing.length > 0 || extensionMissingGuards.length > 0 || missingExtensionDirIsFail;

  if (flags.list) {
    console.log(`${headerLabel()}${flags.all ? '（--all 无视 core 层开关）' : ''} · 将跑 ${checks.length} 个 guard（tools：${SELF_DIR}）：`);
    printModuleLayers();
    for (const check of checks) console.log(`  - ${check.label}${check.kind === 'custom' ? `（custom：${check.command}）` : ''}`);
    for (const g of autoDiscovered) console.log(`  ⚠ tools/${g} 不在任何层清单——auto-discovery 弃用中（≥2 个 minor 后移除），迁移到 config.customGuards`);
    for (const s of coreSkipped) console.log(`  · 跳过 ${modTag(s.module)}${s.file}（属未启用层 '${s.layer}'——启用在 docs/design-spec/config.json 配 kit.layers；无 config 的独立项目才改本文件 DEFAULT_INSTALLED_LAYERS）`);
    for (const plan of allExtensionPlans) {
      if (plan.status === 'missing-dir') {
        const mark = flags.strict ? '✗' : '·';
        const label = flags.strict ? 'extension' : '跳过 extension';
        const strictHint = flags.strict ? '；--strict 要求已启用 extension 必须已安装' : '';
        console.log(`  ${mark} ${label} '${modTag(plan.module)}${plan.name}'（${plan.dir} 不存在；如需启用请安装该 extension，或从 kit.layers 移除 '${plan.name}'${strictHint}）`);
      }
    }
    for (const m of coreMissing) console.log(`  ✗ 缺失 ${modTag(m.module)}${m.file}（启用层期望但文件不在——从 kit 拷入或关掉该层）`);
    for (const m of extensionMissingGuards) console.log(`  ✗ 缺失 ${modTag(m.module)}${m.extension}/${m.file}（已安装 extension 目录但 guard 文件不完整）`);
    for (const name of UNKNOWN_LAYER_NAMES) console.log(`  ⚠ 未知 layer / extension '${name}'（已知层：${Object.keys(LAYER_GUARDS).join(', ')}；已知 extension：${Object.keys(KNOWN_EXTENSIONS).join(', ')}）`);
    console.log(missingIsFail || unknownIsFail ? 'RESULT: FAIL' : 'RESULT: PASS');
    if (missingIsFail || unknownIsFail) process.exitCode = 1;
  } else if (checks.length > 0) {
    // --json：抑制全部文本叙述，末尾输出单个稳定 JSON 文档（机读汇总契约，jsonVersion 承诺字段稳定；
    // 文本汇总不作为解析面）。exit 语义与文本模式一致。
    const say = (...a) => { if (!flags.json) console.log(...a); };
    say(`聚合入口：${headerLabel()}${flags.all ? '（--all）' : ''}${flags.executeImpl ? '（--execute-impl）' : ''} · 串跑 ${checks.length} 个 guard`);
    if (!flags.json) printModuleLayers();
    for (const s of coreSkipped) say(`  · 跳过 ${modTag(s.module)}${s.file}（未启用层 '${s.layer}'）`);
    for (const plan of allExtensionPlans) {
      if (plan.status === 'missing-dir') {
        const mark = flags.strict ? '✗' : '·';
        const label = flags.strict ? 'extension' : '跳过 extension';
        const strictHint = flags.strict ? '；--strict 要求已启用 extension 必须已安装' : '';
        say(`  ${mark} ${label} '${modTag(plan.module)}${plan.name}'（${plan.dir} 不存在；安装 extension 或从 kit.layers 移除${strictHint}）`);
      }
    }
    for (const name of UNKNOWN_LAYER_NAMES) say(`  ⚠ 未知 layer / extension '${name}'（kit-doctor 会提示拼写；run-checks --strict 会失败）`);
    for (const g of autoDiscovered) say(`  ⚠ tools/${g} 不在任何层清单——auto-discovery 弃用中（≥2 个 minor 后移除），迁移到 config.customGuards`);
    say('');
    const results = [];
    for (const check of checks) {
      say(`── ${check.label} ──────────────────────────────`);
      const r = await runOne(check, flags);
      if (!flags.json) {
        const prefix = `[${summaryName(check)}] `;
        const prefixed = r.out.split('\n').map(l => l ? `${prefix}${l}` : l).join('\n');
        process.stdout.write(prefixed.endsWith('\n') ? prefixed : prefixed + '\n');
      }
      results.push({ ...r, resultLine: lastResultLine(r.out) });
    }

    say('\n════════ 汇总 ════════');
    let anyFail = false;
    const guardRows = [];
    let debtTotal = 0, debtBooks = 0, warningsTotal = 0;
    for (const r of results) {
      // custom guard 判定契约：exit != 0 永远 FAIL；RESULT: FAIL 可否决零退出码；
      // 无 RESULT 行按 exit code（内置 guard 仍要求必须打 RESULT）。
      const isCustom = r.check.kind === 'custom';
      const verdict = r.resultLine || (isCustom ? `(无 RESULT 行，按退出码判定)` : `(未打印 RESULT，退出码 ${r.code})`);
      const failed = r.code !== 0 || (r.resultLine && r.resultLine.includes('FAIL')) || (!isCustom && !r.resultLine);
      if (failed) anyFail = true;
      const baseline = await baselineTotal(r.check);
      const warningCount = lastWarningsCount(r.out);
      if (baseline !== null) { debtTotal += baseline; debtBooks += 1; }
      warningsTotal += warningCount;
      guardRows.push({
        module: r.check.module, guard: normalizeGuardName(r.check.file), kind: r.check.kind,
        exit: r.code, result: r.resultLine ? (r.resultLine.includes('FAIL') ? 'FAIL' : 'PASS') : null, failed,
        baseline, warnings: warningCount,
      });
      const extras = [
        ...(baseline !== null ? [`baseline ${baseline}`] : []),
        ...(warningCount > 0 ? [`warnings ${warningCount}`] : []),
      ];
      say(`  ${failed ? '✗' : '✓'} ${summaryName(r.check)}  exit=${r.code}  ${verdict}${extras.length ? `  · ${extras.join(' · ')}` : ''}`);
    }
    // 债务/告警合计：baseline 是「冻结存量只拦新增」的账本余额——PASS ≠ 没债，这行让退化
    // 成永久豁免池的风险有仪表盘；warnings 是非 FAIL 挂账（待登记队列 / 覆盖缺口等），
    // 全绿 pipeline 里别让它埋在 job log 中间。
    if (debtBooks > 0 || warningsTotal > 0) {
      const parts = [
        ...(debtBooks > 0 ? [`baseline 债务合计 ${debtTotal} 条（${debtBooks} 本账）`] : []),
        ...(warningsTotal > 0 ? [`warnings 合计 ${warningsTotal}`] : []),
      ];
      say(`  Σ ${parts.join(' · ')}`);
    }
    const missingRows = [];
    for (const m of coreMissing) {
      anyFail = true;
      missingRows.push(`${modTag(m.module)}${normalizeGuardName(m.file)}`);
      say(`  ✗ ${modTag(m.module)}${normalizeGuardName(m.file)}  缺失（启用层期望但文件不在 tools/——从 kit 拷入，或在 config 里关掉该层）`);
    }
    for (const m of extensionMissingGuards) {
      anyFail = true;
      missingRows.push(`${modTag(m.module)}${m.extension}/${normalizeGuardName(m.file)}`);
      say(`  ✗ ${modTag(m.module)}${m.extension}/${normalizeGuardName(m.file)}  缺失（extension 目录不完整）`);
    }
    if (missingExtensionDirIsFail) {
      anyFail = true;
      for (const plan of missingExtensionDirs) {
        missingRows.push(`${modTag(plan.module)}${plan.name}`);
        say(`  ✗ ${modTag(plan.module)}${plan.name}  已启用但 extension 目录不存在（${plan.dir}）`);
      }
    }
    if (unknownIsFail) {
      anyFail = true;
      for (const name of UNKNOWN_LAYER_NAMES) say(`  ✗ ${name}  未知 layer / extension`);
    }

    if (anyFail) {
      const firstFailed = results.find(r => r.code !== 0 || (r.check.kind !== 'custom' && !r.resultLine) || (r.resultLine || '').includes('FAIL'));
      const hint = firstFailed
        ? (firstFailed.check.kind === 'custom' ? `\`${firstFailed.check.command}\`` : `\`${process.execPath} ${firstFailed.check.absPath}\``)
        : '`node tools/run-checks.js --list`';
      say(`\n修法：上面标 ✗ 的逐个单跑 ${hint} 看详细违规再修`);
      say('\nRESULT: FAIL');
      process.exitCode = 1;
    } else {
      say('\nRESULT: PASS');
    }
    if (flags.json) {
      console.log(JSON.stringify({
        jsonVersion: 1,
        modules: MODULES_CONFIG ? MODULE_PLANS.map((m) => m.name) : null,
        guards: guardRows,
        missing: missingRows,
        unknownLayers: UNKNOWN_LAYER_NAMES,
        errors: [],   // 主汇总固定带空 errors，与失败早退文档同构（首版契约字段稳定，消费方免 optional handling）
        // v2.5.0 附加（additive，jsonVersion 不变）：guards[].baseline / guards[].warnings + 本合计
        totals: { baseline: debtTotal, baselineBooks: debtBooks, warnings: warningsTotal },
        result: anyFail ? 'FAIL' : 'PASS',
      }));
    }
  } else {
    for (const plan of allExtensionPlans) {
      if (plan.status === 'missing-dir') {
        const mark = flags.strict ? '✗' : '·';
        const label = flags.strict ? 'extension' : '跳过 extension';
        const strictHint = flags.strict ? '；--strict 要求已启用 extension 必须已安装' : '';
        console.log(`  ${mark} ${label} '${modTag(plan.module)}${plan.name}'（${plan.dir} 不存在；安装 extension 或从 kit.layers 移除${strictHint}）`);
      }
    }
    for (const name of UNKNOWN_LAYER_NAMES) console.log(`  ⚠ 未知 layer / extension '${name}'（kit-doctor 会提示拼写；run-checks --strict 会失败）`);
    console.log(coreMissing.length || extensionMissingGuards.length || missingExtensionDirIsFail || unknownIsFail ? 'RESULT: FAIL' : 'RESULT: PASS');
    if (coreMissing.length || extensionMissingGuards.length || missingExtensionDirIsFail || unknownIsFail) process.exitCode = 1;
  }
}
⟦/FILE⟧

⟦FILE .design-spec-kit.version⟧
2.6.1
⟦/FILE⟧

