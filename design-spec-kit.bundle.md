# design-spec-kit · 单文件分发包（One-File Bundle）· v2.0.4
#
# 用途：当目标项目只能「一个个上传文件」、没有 git 时，只上传/粘贴本文件这一个即可。
#
# ★ 给落位执行者（读到本文件请执行）：
#   1. 下面用 ⟦FILE 路径⟧ … ⟦/FILE⟧ 包了 31 个文件（含版本 pin）。把每段内容【原样、逐字】写到它的「路径」（含子目录）。
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
#   11. design-spec-kit/docs/DEVIATION-LEDGER.template.md
#   12. design-spec-kit/docs/IMPL-PROFILE.template.md
#   13. design-spec-kit/docs/SCREEN-MANIFEST.template.md
#   14. design-spec-kit/docs/SHELL-KIT.md
#   15. design-spec-kit/docs/VERSIONING.md
#   16. design-spec-kit/docs/config.template.json
#   17. design-spec-kit/docs/screen-manifest.schema.json
#   18. design-spec-kit/package.json
#   19. design-spec-kit/tools/build-bundle.js
#   20. design-spec-kit/tools/check-changelog.js
#   21. design-spec-kit/tools/check-deviation.js
#   22. design-spec-kit/tools/check-i18n.js
#   23. design-spec-kit/tools/check-icons.js
#   24. design-spec-kit/tools/check-manifest.js
#   25. design-spec-kit/tools/check-orphan-css.js
#   26. design-spec-kit/tools/check-tokens.js
#   27. design-spec-kit/tools/ci-check.js
#   28. design-spec-kit/tools/install-git-hooks.js
#   29. design-spec-kit/tools/kit-doctor.js
#   30. design-spec-kit/tools/run-checks.js
#   31. .design-spec-kit.version
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

## 检查命令

```bash
node tools/kit-doctor.js
node tools/run-checks.js
node tools/build-bundle.js --check
```

`run-checks.js` 会按启用层（`docs/design-spec/config.json` 的 `kit.layers`，缺省 `['base']`）跑 guard。未启用层的 guard 文件可以留在目录里，会被明确跳过；启用层缺文件会失败。

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

## 还原交接

启用还原交接层后，每个实现栈需要填一份 `IMPL-PROFILE`，每个屏幕需要生成一份 `*.manifest.generated.json`。guard 只认生成物，不认手写草稿。

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
tools/design-spec-kit/        # submodule，指向内部 Git 仓
docs/design-spec/config.json  # 项目侧配置
docs/design-spec/baselines/   # 当前历史债 baseline
docs/design-spec/manifests/   # handoff 生成物
.design-spec-kit.version      # 人读版本 pin
```

初始化：

```bash
git submodule add <internal-git-url> tools/design-spec-kit
git -C tools/design-spec-kit checkout <tag>
cp tools/design-spec-kit/docs/config.template.json docs/design-spec/config.json
node tools/design-spec-kit/tools/kit-doctor.js
```

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

### Phase 2：i18n 层

项目已经有运行时 i18n 和词典后再启用：

```json
{ "kit": { "layers": ["base", "i18n"] } }
```

需要配置：`pageRoots`、`codeRoots`、`runtimeHints`、`dictPaths`、`wrapperNames`。

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

## 4. CI 接线

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
  rules:
    - changes:
        - ui-design/**/*
        - docs/design-spec/**/*
        - .design-spec-kit.version
        - .gitmodules
  before_script:
    - git submodule update --init --recursive tools/design-spec-kit
  script:
    - node tools/design-spec-kit/tools/kit-doctor.js
    - node tools/design-spec-kit/tools/run-checks.js
```

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
- 业务名单是项目层:各拷贝的 `check-shell-purity` 三 knob 可以各自项目化,**不算 drift**(drift 只守运行时 + demo 屏的字节同源;guard config 属项目层,不进 kit-drift baseline 的比对口径)。

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
  "kit": {
    "layers": [
      "base"
    ],
    "notes": "业务仓在这里配置已启用层；submodule 内源码保持只读。可选层：i18n、handoff。"
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
      "screensListPath": "docs/design-spec/screens.txt"
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
  "required": ["screen", "version", "elements", "states"],
  "additionalProperties": false,
  "properties": {
    "screen": {
      "type": "object",
      "required": ["id", "source"],
      "additionalProperties": false,
      "properties": {
        "id": { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]*$" },
        "title": { "type": "string" },
        "source": { "type": "string" }
      }
    },
    "version": { "type": "integer", "minimum": 1 },
    "state_classes": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "inherit": { "type": "boolean" },
        "exempt": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "note"],
            "additionalProperties": false,
            "properties": {
              "id": { "type": "string" },
              "note": { "type": "string", "minLength": 4 }
            }
          }
        }
      }
    },
    "elements": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["anchor", "role"],
        "additionalProperties": false,
        "properties": {
          "anchor": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
          "role": { "type": "string", "minLength": 2 },
          "copy_key": { "type": "string" },
          "icon": { "type": "string" },
          "states": { "type": "array", "items": { "type": "string" } },
          "delegated": { "$ref": "#/definitions/delegation" }
        }
      }
    },
    "states": {
      "type": "object",
      "required": ["designed"],
      "additionalProperties": false,
      "properties": {
        "designed": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id"],
            "additionalProperties": false,
            "properties": {
              "id": { "type": "string" },
              "note": { "type": "string" }
            }
          }
        },
        "delegated": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["state", "to", "contract_ref", "status"],
            "additionalProperties": false,
            "properties": {
              "state": { "type": "string" },
              "to": { "enum": ["impl", "backend", "firmware", "other"] },
              "contract_ref": { "type": "string", "minLength": 3 },
              "status": { "enum": ["open", "reconciled", "dropped"] }
            }
          }
        }
      }
    },
    "params_ref": {
      "type": "object",
      "required": ["generator", "output"],
      "additionalProperties": false,
      "properties": {
        "generator": { "type": "string" },
        "output": { "type": "string" }
      }
    }
  },
  "definitions": {
    "delegation": {
      "type": "object",
      "required": ["to", "contract_ref", "status"],
      "additionalProperties": false,
      "properties": {
        "to": { "enum": ["impl", "backend", "firmware", "other"] },
        "contract_ref": { "type": "string", "minLength": 3 },
        "status": { "enum": ["open", "reconciled", "dropped"] }
      }
    }
  }
}
⟦/FILE⟧

⟦FILE design-spec-kit/package.json⟧
{
  "name": "design-spec-kit",
  "version": "2.0.4",
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
const GUARD_CONFIG = DESIGN_SPEC_CONFIG.guards?.['check-changelog'] || DESIGN_SPEC_CONFIG.guards?.['check-changelog.js'] || {};
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
const GUARD_CONFIG = DESIGN_SPEC_CONFIG.guards?.['check-deviation'] || DESIGN_SPEC_CONFIG.guards?.['check-deviation.js'] || {};
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
const GUARD_CONFIG = DESIGN_SPEC_CONFIG.guards?.['check-i18n'] || DESIGN_SPEC_CONFIG.guards?.['check-i18n.js'] || {};
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

const BASELINE_PATH = cfgValue('baselinePath', 'tools/check-i18n.baseline.json');

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
const GUARD_CONFIG = DESIGN_SPEC_CONFIG.guards?.['check-icons'] || DESIGN_SPEC_CONFIG.guards?.['check-icons.js'] || {};
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

const BASELINE_PATH = cfgValue('baselinePath', 'tools/check-icons.baseline.json');

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
 *        · state_classes.exempt 每条带 note（schema 已管，此处双保险）  → FAIL
 *        · states.delegated[].contract_ref === 'TBD'                 → WARN（显式待裁决信号，不 FAIL）
 *   ④ SCREENS_LIST_PATH 配置时：清单里每个 screen-id 必须有对应 manifest → FAIL（覆盖率对账）
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
const GUARD_CONFIG = DESIGN_SPEC_CONFIG.guards?.['check-manifest'] || DESIGN_SPEC_CONFIG.guards?.['check-manifest.js'] || {};
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

  // ─── 报告 ───
  const warns = [];
  const totalErrs = perFile.reduce((s, f) => s + f.errs.length, 0) + coverageErrs.length;
  const totalWarns = perFile.reduce((s, f) => s + f.warns.length, 0);
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
  if (warns.length) log(`\n⚠ 待裁决队列（contract_ref=TBD，非 FAIL，随迭代评审收敛）：${warns.length} 条`);

  if (totalErrs > 0) {
    return fatal([`\n修法：`,
      `  1. schema 违规 → 改「源头」再重生生成物（勿手改 *${MANIFEST_SUFFIX}；HANDOFF §1.2 真源+重生）。`,
      `  2. states 合计为空 → 补 designed 或 delegated（设计可少画不可不表态）。`,
      `  3. anchor 撞名 → 改名并 version+1、记 CHANGELOG（anchor 是对账主键）。`,
      `  4. 覆盖率缺口 → 为缺屏补 manifest，或从屏清单真源移除该 id。`]);
  }
  log(`\n✓ check-manifest: 全部生成物过 schema + 语义规则`);
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
const GUARD_CONFIG = DESIGN_SPEC_CONFIG.guards?.['check-orphan-css'] || DESIGN_SPEC_CONFIG.guards?.['check-orphan-css.js'] || {};
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

const BASELINE_PATH = cfgValue('baselinePath', 'tools/check-orphan-css.baseline.json');

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
const GUARD_CONFIG = DESIGN_SPEC_CONFIG.guards?.['check-tokens'] || DESIGN_SPEC_CONFIG.guards?.['check-tokens.js'] || {};
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

const BASELINE_PATH = cfgValue('baselinePath', 'tools/check-tokens.baseline.json');

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
  .sort();

for (const file of toolFiles) {
  run(`node --check tools/${file}`, process.execPath, ['--check', path.join('tools', file)]);
}

run('kit-doctor source mode', process.execPath, ['tools/kit-doctor.js', '--source']);
run('run-checks plan', process.execPath, ['tools/run-checks.js', '--list']);
run('bundle drift check', process.execPath, ['tools/build-bundle.js', '--check']);

console.log('\nRESULT: PASS');
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
 *   ① guard 文件在位 —— 已装层期望的 check-*.js 是否都在 tools/（自身目录）
 *   ② 配置命中探针 —— 仅对启用层 guard 生效；从源码抽取关键配置常量，对 cwd 验证
 *                      「目录存在且非空 / 文件可读 / 必填数组非空」，不满足视为漏配
 *   ③ 入口接线 —— cwd 的 package.json scripts.check 是否指向 run-checks（或等价）
 *   ④ 版本 pin —— submodule 接入看 gitlink（不需 version 文件）；复制式接入才对比 .design-spec-kit.version
 *   ⑤ DoD 对账 —— cwd 的 CLAUDE.md 是否提到每个已装 guard 文件名
 *
 * FAIL 仅由 ①② 触发（guard 缺失 / 配置零命中 = 装了跟没装一样）；③④⑤ 只报 WARN。
 *
 * 两种模式：
 *   实例模式（默认）—— cwd = 被体检的实例项目根，跑全部 ①~⑤。
 *   kit 源仓模式 —— cwd 是 kit 仓本身（自动识别：tools/ 就是自身目录且上级有 CLAUDE.template.md；
 *                   或显式 --source）。源仓没有「项目配置」可体检，只跑 ①（且期望全部层的 guard
 *                   都在位——源仓必须携带完整套件），②③④⑤ 跳过。
 *
 * 层配置单一真源：INSTALLED_LAYERS 在 run-checks.js 顶部（聚合入口按它决定跑什么），
 * 本脚本从 run-checks.js 源码读取，不另行配置——防两处配置漂移。
 *
 * 怎么跑：node tools/kit-doctor.js（从项目根）；kit 源仓自检：node tools/kit-doctor.js --source
 * ═════════════════════════════════════════════════════════════*/

import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// ─── 配置（一般无需改；层开关去 run-checks.js 顶部改）─────────────
const args = [];   // 沙箱手改位（本文件 node-only，一般留空）

// 各层期望的 guard 文件清单（新增层时在这里补一行；与 run-checks.js 的表保持一致）。
const LAYER_GUARDS = {
  base:    ['check-tokens.js', 'check-icons.js', 'check-changelog.js', 'check-orphan-css.js'],
  i18n:    ['check-i18n.js'],
  handoff: ['check-manifest.js', 'check-deviation.js'],
};
const FALLBACK_LAYERS = ['base'];   // run-checks.js 读不到时的兜底

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

// ─── 模式识别 + 层配置读取（单一真源 = run-checks.js）──────────────
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
// kit 源仓必须携带全部层；实例按 run-checks.js 的启用层。
const layerInfo = IS_SOURCE ? { layers: Object.keys(LAYER_GUARDS), from: '源仓模式（全部层）' } : await readInstalledLayers();
const INSTALLED_LAYERS = layerInfo.layers.filter(l => LAYER_GUARDS[l]);
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
  return report;
}

// ─── ② 配置命中探针 ──────────────────────────────────────────
// 每条探针：guard 文件、要抽的常量名、判据类型（dir=目录存在且非空 / file=文件可读）。
// optionalEmpty=true 表示空数组是合法关闭某个子维，而不是「装了没适配」。
const PROBES = [
  { guard: 'check-tokens.js',     const: 'SCAN_ROOTS', key: 'scanRoots',       kind: 'dirlist' },
  { guard: 'check-orphan-css.js', const: 'CSS_ROOTS',  key: 'cssRoots',        kind: 'dirlist' },
  { guard: 'check-i18n.js',       const: 'DICT_PATHS', key: 'dictPaths',       kind: 'filelist' },
  { guard: 'check-deviation.js',  const: 'IMPL_ROOTS', key: 'implRoots',       kind: 'dirlist' },
  { guard: 'check-icons.js',      const: 'REGISTRY_SOURCES', key: 'registrySources', kind: 'filelist', optionalEmpty: true,
    note: '空数组 = 关闭同形重画维；check-icons 仍会跑同名异形扫描' },
];

function guardConfig(guardFile) {
  const name = guardFile.replace(/\.js$/, '');
  return PROJECT_CONFIG.guards?.[name] || PROJECT_CONFIG.guards?.[guardFile] || {};
}

async function checkConfigProbes() {
  const report = [];
  for (const probe of PROBES) {
    const src = await readIfExists(path.join(SELF_DIR, probe.guard));
    if (src == null) continue; // 该 guard 未装，②不体检未装的文件（①已经报过缺失）
    if (!ENABLED_GUARDS.has(probe.guard)) {
      const layer = GUARD_LAYER.get(probe.guard) || 'custom';
      report.push(`  · ${probe.guard} 未启用（属层 ${layer}），跳过配置探针`);
      continue;
    }
    const sourceItems = extractArrayConst(src, probe.const);
    const configuredItems = guardConfig(probe.guard)[probe.key];
    const items = Array.isArray(configuredItems) ? configuredItems : sourceItems;
    const itemSource = Array.isArray(configuredItems) ? PROJECT_CONFIG_PATH : 'guard 源码默认值';
    if (items == null) {
      report.push(`  ? ${probe.guard} 的 ${probe.const} 未能从源码抽出，也没有在 ${PROJECT_CONFIG_PATH} 配 ${probe.key}（跳过）`);
      continue;
    }
    if (items.length === 0) {
      if (probe.optionalEmpty) {
        report.push(`  · ${probe.guard}  ${probe.const}=[]（${probe.note}）`);
        continue;
      }
      fail(`${probe.guard} 的 ${probe.const} 是空数组 —— 配置区未按项目改，等于该维度不查`);
      report.push(`  ✗ ${probe.guard}  ${probe.const}=[] 空`);
      continue;
    }
    let hitCount = 0;
    for (const item of items) {
      const ok = probe.kind === 'dirlist' ? await dirNonEmpty(item) : await fileReadable(item);
      if (ok) hitCount++;
    }
    if (hitCount === 0) {
      fail(`${probe.guard} 的 ${probe.const}=[${items.join(', ')}] 在当前项目全部零命中（目录不存在/为空或文件不可读）—— 配置命中探针失败，等于装了没适配`);
      report.push(`  ✗ ${probe.guard}  ${probe.const} 零命中：${items.join(', ')}`);
    } else {
      report.push(`  ✓ ${probe.guard}  ${probe.const} 命中 ${hitCount}/${items.length}：${items.join(', ')}（${itemSource}）`);
    }
  }
  return report;
}

// ─── ③ 入口接线（WARN）───────────────────────────────────────
async function checkEntryWiring() {
  const pkgSrc = await readIfExists(path.join(PROJECT_ROOT, 'package.json'));
  if (!pkgSrc) {
    warn(`cwd 下没有 package.json —— 查不到入口接线，若项目走非 npm runner（make / bun 等）请按 IMPL-PROFILE 自行确认已接 run-checks 等价命令`);
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

console.log(`kit-doctor 体检：${IS_SOURCE ? 'kit 源仓模式' : '实例模式'} · 项目根=${PROJECT_ROOT}  已装层=[${INSTALLED_LAYERS.join(', ')}]（来源：${layerInfo.from}）\n`);

console.log('① guard 文件在位' + (IS_SOURCE ? '（源仓须携带全部层）' : ''));
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
  const expectedGuardFiles = [...new Set(INSTALLED_LAYERS.flatMap(l => LAYER_GUARDS[l] || []))];
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
  console.log(`  · 配置零命中 → 打开对应 guard 顶部「配置」区，把扫描目录/词典路径/registry 改成本项目真实路径`);
  console.log('\nRESULT: FAIL');
  process.exitCode = 1;
} else {
  console.log('\n✓ 无 FAIL 项' + (findings.warn.length ? '（仍有 WARN，建议处理但不阻塞）' : ''));
  console.log('\nRESULT: PASS');
}
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
 * 不在任何层清单里的 check-*.js 视为项目自定义 guard，默认照跑。
 * ★层开关单一真源 = 业务仓 docs/design-spec/config.json 的 kit.layers（本文件 / kit-doctor /
 *   各 guard 同读）；没有该配置时才回退本文件的 DEFAULT_INSTALLED_LAYERS。
 *   submodule 模式下 kit 源码保持只读——启用/关闭层一律改业务仓 config，别改这里。
 *
 * 怎么跑：
 *   node tools/run-checks.js              串跑启用层 guard
 *   node tools/run-checks.js --list       只列将跑/跳过/缺失，不执行
 *   node tools/run-checks.js --only check-tokens   只跑一个（无视层开关；带不带 .js 都行）
 *   node tools/run-checks.js --all        无视层开关跑全部存在的 guard
 * ═════════════════════════════════════════════════════════════*/

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';

// ─── 配置 ──────────────────────────────────────────────────────
const args = [];   // 沙箱手改位（本文件 node-only，一般留空，走 process.argv）

async function readProjectConfig() {
  try { return JSON.parse(await readFile('docs/design-spec/config.json', 'utf8')); }
  catch { return {}; }
}
const PROJECT_CONFIG = await readProjectConfig();

// 本实例启用的层。优先读业务仓 docs/design-spec/config.json 的 kit.layers；
// 没有配置时回退 base。这样 submodule 不需要改源码。
const DEFAULT_INSTALLED_LAYERS = ['base'];
const configuredLayers = PROJECT_CONFIG.kit?.layers;
const INSTALLED_LAYERS = Array.isArray(configuredLayers) && configuredLayers.length > 0 ? configuredLayers : DEFAULT_INSTALLED_LAYERS;

// 各层的 guard 清单（新增层在这里补一行；不在任何层里的 check-*.js = 自定义 guard，默认照跑）
const LAYER_GUARDS = {
  base:    ['check-tokens.js', 'check-icons.js', 'check-changelog.js', 'check-orphan-css.js'],
  i18n:    ['check-i18n.js'],
  handoff: ['check-manifest.js', 'check-deviation.js'],
};

const GUARD_PATTERN = /^check-.+\.js$/i;          // guard 文件命名约定
const EXCLUDE = new Set([]);                       // 需要排除的具体文件名（留空即可）

const EFFECTIVE_ARGS = args.length ? args : process.argv.slice(2);

// ─── 定位 guard 目录 = 本脚本自身所在目录 ───────────────────────
const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));

async function discoverGuards() {
  let entries;
  try { entries = await readdir(SELF_DIR); } catch { entries = []; }
  return entries
    .filter(name => GUARD_PATTERN.test(name) && !EXCLUDE.has(name))
    .filter(name => !name.endsWith('.baseline.json'))
    .sort();
}

function parseFlags(argv) {
  const flags = { list: false, only: null, all: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') flags.list = true;
    else if (a === '--all') flags.all = true;
    else if (a === '--only') flags.only = argv[++i] || null;
    else if (a.startsWith('--only=')) flags.only = a.slice('--only='.length);
  }
  return flags;
}

// 按层把「存在的 guard」分成三份：将跑 / 跳过（属已知但未启用的层）/ 启用层缺文件。
function planByLayers(present, all) {
  const layerOf = new Map();                                        // 文件名 -> 所属层
  for (const [layer, files] of Object.entries(LAYER_GUARDS)) for (const f of files) layerOf.set(f, layer);
  const enabled = new Set(INSTALLED_LAYERS.flatMap(l => LAYER_GUARDS[l] || []));
  const run = [], skipped = [];
  for (const g of present) {
    if (all || enabled.has(g) || !layerOf.has(g)) run.push(g);      // 启用层 / 自定义 guard 照跑
    else skipped.push({ file: g, layer: layerOf.get(g) });
  }
  const missing = all ? [] : [...enabled].filter(g => !present.includes(g)).sort();
  return { run, skipped, missing };
}

function normalizeGuardName(n) {
  return n.endsWith('.js') ? n.slice(0, -3) : n;
}

// 子进程跑一个 guard，cwd 继承调用方 cwd（不是 SELF_DIR）——guard 的相对路径配置
// （SCAN_ROOTS 等）都是相对项目 cwd 写的。
function runOne(guardFile) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(SELF_DIR, guardFile)], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { out += d.toString(); });
    child.on('close', code => resolve({ guardFile, code, out }));
    child.on('error', err => resolve({ guardFile, code: 1, out: `spawn error: ${err.message}` }));
  });
}

function lastResultLine(out) {
  const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^RESULT:\s*(PASS|FAIL)/.test(lines[i])) return lines[i];
  }
  return null;
}

// ─── Main ────────────────────────────────────────────────────

const flags = parseFlags(EFFECTIVE_ARGS);
const present = await discoverGuards();
const plan = planByLayers(present, flags.all);
let guards = plan.run;

if (present.length === 0) {
  console.log(`✗ ${SELF_DIR} 下没找到任何 check-*.js —— 至少应装 guard①（check-tokens.js）`);
  console.log(`修法：确认已把 tools/ 下的 guard 文件从 kit 拷入本项目`);
  console.log('RESULT: FAIL');
  process.exitCode = 1;
} else {
  if (flags.only) {
    const want = normalizeGuardName(flags.only);
    const matched = present.filter(g => normalizeGuardName(g) === want);   // --only 无视层开关
    if (matched.length === 0) {
      console.log(`✗ --only ${flags.only} 未匹配到任何 guard（存在：${present.map(normalizeGuardName).join(', ')}）`);
      console.log('RESULT: FAIL');
      process.exitCode = 1;
      guards = [];
    } else {
      guards = matched;
      plan.skipped = []; plan.missing = [];
    }
  }

  if (flags.list) {
    console.log(`启用层 [${INSTALLED_LAYERS.join(', ')}]${flags.all ? '（--all 无视层开关）' : ''} · 将跑 ${guards.length} 个 guard（目录：${SELF_DIR}）：`);
    for (const g of guards) console.log(`  - ${g}`);
    for (const s of plan.skipped) console.log(`  · 跳过 ${s.file}（属未启用层 '${s.layer}'——启用在 docs/design-spec/config.json 配 kit.layers；无 config 的独立项目才改本文件 DEFAULT_INSTALLED_LAYERS）`);
    for (const m of plan.missing) console.log(`  ✗ 缺失 ${m}（启用层期望但文件不在——从 kit 拷入或关掉该层）`);
    console.log(plan.missing.length ? 'RESULT: FAIL' : 'RESULT: PASS');
    if (plan.missing.length) process.exitCode = 1;
  } else if (guards.length > 0) {
    console.log(`聚合入口：启用层 [${INSTALLED_LAYERS.join(', ')}]${flags.all ? '（--all）' : ''} · 串跑 ${guards.length} 个 guard`);
    for (const s of plan.skipped) console.log(`  · 跳过 ${s.file}（未启用层 '${s.layer}'）`);
    console.log('');
    const results = [];
    for (const g of guards) {
      console.log(`── ${g} ──────────────────────────────`);
      const r = await runOne(g);
      const prefixed = r.out.split('\n').map(l => l ? `[${normalizeGuardName(g)}] ${l}` : l).join('\n');
      process.stdout.write(prefixed.endsWith('\n') ? prefixed : prefixed + '\n');
      results.push({ ...r, resultLine: lastResultLine(r.out) });
    }

    console.log('\n════════ 汇总 ════════');
    let anyFail = false;
    for (const r of results) {
      const verdict = r.resultLine || `(未打印 RESULT，退出码 ${r.code})`;
      const failed = r.code !== 0 || (r.resultLine && r.resultLine.includes('FAIL')) || !r.resultLine;
      if (failed) anyFail = true;
      console.log(`  ${failed ? '✗' : '✓'} ${normalizeGuardName(r.guardFile)}  exit=${r.code}  ${verdict}`);
    }
    for (const m of plan.missing) {
      anyFail = true;
      console.log(`  ✗ ${normalizeGuardName(m)}  缺失（启用层期望但文件不在 tools/——从 kit 拷入，或在本文件顶部关掉该层）`);
    }

    if (anyFail) {
      console.log(`\n修法：上面标 ✗ 的逐个单跑 \`node tools/${results.find(r => r.code !== 0 || !r.resultLine || (r.resultLine||'').includes('FAIL'))?.guardFile}\` 看详细违规再修`);
      console.log('\nRESULT: FAIL');
      process.exitCode = 1;
    } else {
      console.log('\nRESULT: PASS');
    }
  }
}
⟦/FILE⟧

⟦FILE .design-spec-kit.version⟧
2.0.4
⟦/FILE⟧

