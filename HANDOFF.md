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
