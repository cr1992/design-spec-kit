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
