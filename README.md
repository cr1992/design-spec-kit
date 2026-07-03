# Design Spec Kit v2 · 设计纪律 + 还原交接套件（与平台无关）

> 一套**不画任何界面**的方法套件。它不带颜色、不带组件、不带页面外壳——
> 只带「**让一个设计/前端项目长期不腐化、且实现还原不跑偏**」的那层东西：
> 一份契约 + 一套 DoD + 七个机读 guard + 一层设计→实现交接契约。
> 不论你做网页 / 桌面 / 移动 / 小程序，不论实现用什么语言 / 框架，都适用。

## 它解决三个问题
1. **页面漂移** —— 做着做着，A 页一个按钮、B 页又造一个；颜色这里 `#3b82f6`、那里 `#3a80f5`。多人/多会话协作后，「同一个东西长出十个样子」。
2. **UI 设计规范落不了地** —— 有 tokens、有组件库，但没人强制用；规范文档和真实代码越走越远。
3. **还原漂移**（v2 新增）—— 设计原型天然只画 happy path，实现面对真实契约必须自补加载 / 失败 / 降级等状态；补了没人申报、设计侧永远不知道，偏离单向积累。反过来，设计改了实现也未必跟。**设计与实现各说各话，没有机读对账。**

治法很朴素：**单一真源 + 准入纪律 + 可机检的 DoD + 双向申报义务**。把「自觉」变成「会报错」。

---

## 三层结构

```
┌──────────────────────────────────────────────────┐
│  还原交接层（可选 · v2 新增）HANDOFF.md            │
│  屏幕 manifest · 偏离台账 · T1/T2/T3 验收语义      │
│  执行器按实现栈登记（IMPL-PROFILE），kit 不绑框架   │
├──────────────────────────────────────────────────┤
│  平台壳层（可选）EXTENDING.md                      │
│  移动 / 桌面 / Web 呈现壳怎么叠上来                │
├──────────────────────────────────────────────────┤
│  底座（必装）CLAUDE 契约 + DoD + guard ①~④        │
│  token · 组件准入 · changelog · 死码；⑤ i18n 条件装 │
└──────────────────────────────────────────────────┘
```

底座对上层一无所知；上层单向依赖底座。装/卸一层 = 加/减对应的 CLAUDE 小节 + DoD 行 + guard。

## 套件里有什么

```
design-spec-kit/
├─ README.md                      ← 本文件：这是什么 + 怎么用
├─ CLAUDE.template.md             ← 契约骨架 ★核心。复制到项目根改名 CLAUDE.md
├─ AI-BOOTSTRAP.md                ← 粘给接手 AI 的「首条指令」（自我引导安装 + 立规矩）
├─ EXTENDING.md                   ← 平台壳接入契约
├─ HANDOFF.md                     ← 还原交接契约 ★v2 核心（设计→实现怎么不跑偏）
├─ package.json                   ← node 入口：npm/bun run check / doctor / bundle
├─ docs/
│  ├─ DESIGN-REF.template.md      ← 组件 + token 索引骨架（可复用件的「户口」）
│  ├─ CHANGELOG.template.md       ← 更新日志骨架（按天 + 模块标签）
│  ├─ SCREEN-MANIFEST.template.md ← 每屏交接清单骨架（语义半 + 生成物规则）
│  ├─ screen-manifest.schema.json ← manifest 生成物的机读 schema（guard⑥ 的判据）
│  ├─ IMPL-PROFILE.template.md    ← 实现栈接入契约骨架（一栈一份）
│  ├─ DEVIATION-LEDGER.template.md← 偏离台账骨架（裁决队列）
│  ├─ DESIGN-RATIONALE.md         ← v2 设计方案（为什么长这样；决策记录）
│  └─ VERSIONING.md               ← 版本 pin / 实例升级 / 回滚 / bundle 重生协议
└─ tools/
   ├─ check-tokens.js             ← guard①：禁裸 hex/rgba/假 fallback + 离档尺寸/内联阴影
   ├─ check-icons.js              ← guard②：图标同名异形 + 同形重画（per-file 复制粘贴）
   ├─ check-changelog.js          ← guard③：CHANGELOG 卫生（同日合并/长度/深度/索引一致）
   ├─ check-orphan-css.js         ← guard④：死 CSS 对账（定义了没人用 = 改版残留）
   ├─ check-i18n.js               ← guard⑤：i18n 覆盖对账（漏挂运行时/硬编码文案/死键）
   ├─ check-manifest.js           ← guard⑥：manifest 生成物 schema + 语义完备性
   ├─ check-deviation.js          ← guard⑦：偏离对账（代码标记↔台账 + 台账屏引用↔manifest）
   ├─ kit-doctor.js               ← 实例化自检（guard 在位/配置命中/入口真调/版本 pin）
   ├─ run-checks.js               ← 聚合入口（node 串跑全部已装 guard，任一 FAIL 退出码 1）
   └─ build-bundle.js             ← bundle 生成器（bundle.md 是生成物，勿手改）
```

> ★ `CLAUDE.md` 是每个会话**自动加载**的项目说明，是让「每个 AI / 协作者」守同一套纪律的总开关——套件的心脏。
> ★ v2 的心脏第二半在 `HANDOFF.md`：**任何偏离设计的实现都带一个申报义务，漏一条 = 漂移。**

---

## 两种形态

- **独立仓形态（推荐）**：本套件独立 git 管理，tag 化版本。使用方项目把 kit 文件**实例化拷入**并在项目根写 `.design-spec-kit.version` 钉版本；升级 / 回滚按 [`docs/VERSIONING.md`](docs/VERSIONING.md)。
- **目录嵌入 / 无 git 环境**：把整个文件夹给对方；只能逐个传文件时，发 `design-spec-kit.bundle.md`（由 `build-bundle.js` 生成的单文件包）+ `分发提示词.txt` 那段话，对方 AI 会自动拆包落位。

## 怎么用（START HERE · 零猜测）

1. **立契约** —— `CLAUDE.template.md` 复制到**新项目根目录**改名 `CLAUDE.md`，替换所有〈尖括号〉，删掉不装的层的小节。
2. **搬文档骨架** —— `docs/` 下的 `.template` 文件复制进项目 `docs/`，去后缀；不装还原层就不搬 manifest / ledger / profile 三件。
3. **搬 guard** —— `tools/` **整目录**原样复制进项目 `tools/`（不用挑文件）；然后打开 `tools/run-checks.js` 顶部把 `INSTALLED_LAYERS` 改成你装的层（默认 `['base']`；有 i18n 加 `'i18n'`，装还原层加 `'handoff'`）——聚合入口只跑启用层的 guard，未启用层的文件留在目录里会被明确跳过，不会误跑。`package.json` 的 `check` / `doctor` script 合入项目（或直接用 kit 的）。
4. **建 token 真源** —— 项目里建 `tokens.css`，所有颜色/字号/间距/圆角/阴影定义在这一处，组件**只引用 `var(--*)`**。
5. **改配置区** —— 每个 guard 顶部「配置」区按项目改（扫描目录 / 尺寸档 / 图标源写法 / i18n 运行时路径…）。**改完立刻跑 `kit-doctor`**——它专抓「装了但没适配」（正则零命中、入口没接、guard 漏装）。
6. **（装还原层）登记实现栈** —— 每个实现栈填一份 `IMPL-PROFILE`（runner、生成链、标记落点、T1/T2/T3 执行器、抽取器）；给每屏建 manifest 语义半。
7. **`done` 前跑 guard** —— 见下。

---

## guard 怎么跑（双环境）

所有 guard 都是**双环境**的：

- **本地 / CI（node ≥ 18）**：`node tools/run-checks.js` 串跑全部已装 guard（或单跑 `node tools/check-tokens.js`）。FAIL = 退出码 1，可直接挂 pre-commit / CI。runner 用 npm / bun / make 皆可——按 IMPL-PROFILE 登记，**不要假设通用入口是 npm**。
- **无 shell 的 AI 沙箱**（如设计环境的 run_script）：读脚本全文 → 整段粘贴执行（脚本自带环境探测，检测到沙箱 helper 就不加载 node 模块）。看末行 `RESULT: PASS|FAIL`。

| guard | 守什么 | baseline |
|---|---|---|
| ① check-tokens | 裸 `#hex`/`rgba()`/假 fallback；离档 px / 内联 shadow | 有（首跑固化现状，之后只报**新增**，按出现次数计——同值新写一处也算新增） |
| ② check-icons | 同名异形（同一图标名多处各画一版）+ 同形重画（注册过的字形被 inline 复制） | 有 |
| ③ check-changelog | 同日重复段 / 超长 / 单条过深 / 模块索引 ⊇ 实际标签 | 无（直接扫） |
| ④ check-orphan-css | CSS 定义的 class 在使用面零命中（改版残留死码） | 有（= 「保留备查」账本，进 baseline 须在 DESIGN-REF 登记理由） |
| ⑤ check-i18n | 页面漏挂 i18n 运行时 / 代码硬编码文案 / 词典死键 | 有；项目没有 i18n 机制则整个 guard 不装 |
| ⑥ check-manifest | manifest 生成物过 schema + 语义完备（状态空间非空、delegated 必带契约引用） | 无 |
| ⑦ check-deviation | 偏离对账：代码标记↔台账双向互查 + 台账屏引用↔manifest 校验 + delegated 待裁决摘要，产缺口清单 | 无 |

设计哲学：guard ①②③ 防「新增了坏东西」，④⑤ 防「删了没死透 / 覆盖性义务漏项」，⑥⑦ 防「设计与实现各说各话」。三类都要有，缺一类就有一类漂移抓不到。

---

## 一句话边界

- **它管**：纪律、单一真源、可机检的 DoD、组件准入；设计→实现的交接契约（manifest / 偏离台账 / 三级验收语义）。
- **它不管**：你长什么样（颜色/字体/组件/布局全是你的）、用什么框架、做什么平台；验收执行器怎么实现（各栈按 IMPL-PROFILE 登记）。
- 平台壳（移动 App 原型外壳等）是另一个可选包，见 [`EXTENDING.md`](EXTENDING.md)；实现栈接入见 [`HANDOFF.md`](HANDOFF.md)。

> 核心理念：**任何影响产物的改动都带一个同步义务，任何偏离设计的实现都带一个申报义务。漏一项 = 漂移。**
> 把同步义务写进 `CLAUDE.md` 的「收尾同步表」，把申报义务写进 manifest / 台账，再用 guard 守住能机检的每一条。
