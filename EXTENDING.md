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
