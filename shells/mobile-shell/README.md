# mobile-shell · 可插拔移动原型壳

> 一套与业务解耦的 HTML 移动原型外壳:**「一套屏幕源、两种呈现」**——
> 同一批 `screens/*.html`,**原型模式**当 iframe「活」嵌进 iPhone/iPad 里跑真交互(iOS 推入/模态转场 + 路由栈),
> **画布模式**把它们按状态平铺在可平移缩放的无限画布上看效果。改一处屏,两种呈现同时更新。

---

## 它和 design-spec-kit 的关系（先读这条）
- **design-spec-kit = 方法底座**:契约(CLAUDE.md)+ DoD + token 纪律 + guard。它管「不腐化」,不规定你怎么呈现界面。
- **mobile-shell = 一层可插拔呈现壳**:管「移动 App 怎么呈现/怎么导航」。它**消费**底座的 token 真源,不带自己的设计语言。
- 两者**配合用**:底座保证设计不漂移,壳负责把屏跑成 iPhone/iPad 原型。接法见 `design-spec-kit/EXTENDING.md` 的三个挂钩点(共用 token 真源 / 追加平台 DoD 行 / 补平台 CLAUDE 小节)。

> 本壳**不重复**底座的任何方法文档/模板/guard。CLAUDE 契约、DESIGN-REF、CHANGELOG、check-tokens 一律在 design-spec-kit / 项目里,壳里不放副本。

---

## 适用边界（会不会限制你的设计？）
**完全自由(壳不碰)**:视觉(颜色/字体/组件全在你的 `tokens.css`+`spec.css`,整套替换即换肤)、业务(屏内容/状态/流程/文案全是你的)。壳唯一认识业务的地方 = `index.html` 的 `window.PROTO_CONFIG`。

**内置假设(是起点不是枷锁)**:单台 iPhone/iPad + 自绘 iOS chrome(状态栏/灵动岛/Home 条)、栈式原生转场(push / modal)+ 边缘返回。要 Android/桌面/网页 → 换设备框 + 改 `pages.css` 转场 + `screen.css` 的 chrome 注入。

**真·通用内核**:「一套屏幕源、两种呈现」+ `postMessage` 协议 + 无限画布 + 主题广播 + token 驱动换肤。

---

## 目录
```
mobile-shell/
├─ index.html              壳 demo:顶栏(主题/明暗/原型·画布切换) + iPhone/iPad 框 + 画布
├─ assets/
│  ├─ pages.css            壳样式(设备框 / push+modal 转场 / 无限画布)        ← 通用
│  ├─ app.js               壳逻辑(主题下发 / 路由栈+预热 / 双端 / 画布)        ← 纯壳零业务·原样复制
│  ├─ screen.css           屏内样式(iOS chrome / 固定头滚动区 / 抽屉 / 空状态) ← 通用
│  ├─ screen.js            屏内逻辑(注入 chrome / 按 ?state 显隐 / postMessage 导航) ← 通用
│  ├─ sheet.js             弹层引擎 DZ.sheet/DZ.dialog/DZ.confirm                ← 零依赖·按需引
│  ├─ pull-refresh.js      下拉刷新 HiPullRefresh.wire(scroll,{onRefresh,ptrHTML})← 可选·指示器可注入
│  ├─ i18n.js              语言运行时(window.I18N·读 ?lang= / 写 data-lang)     ← 可选
│  └─ tokens.css / spec.css  占位视觉,仅供本壳独立 demo 跑                       ← 真接项目时指向项目真源
├─ screens/{_template,home,detail}.html   通用示例屏(照契约,复制改名即用)
├─ tools/check-shell-purity.js   壳纯度 guard(壳内禁业务名字·改壳必跑)
├─ tools/check-kit-drift.js + kit-drift.baseline.json   壳同源 guard(复制式复用才需要)
└─ docs/PROTOTYPE-ARCH.md  壳架构 + Flutter 落地映射
```

直接打开 `index.html` 就能跑(默认带占位 token 作视觉)。

---

## 接进你的项目(引用,不复制)
业务屏**直接 link** 壳运行时 + 你的设计真源,**不复制**——一份源、零漂移:
```html
<!-- pages/<screen>.html -->
<link rel="stylesheet" href="../design-system/tokens.css">       <!-- 你的设计真源 -->
<link rel="stylesheet" href="../design-system/spec.css">
<link rel="stylesheet" href="../mobile-shell/assets/screen.css"> <!-- 壳运行时·引用不复制 -->
<script src="../mobile-shell/assets/screen.js"></script>
```
依赖单向:`pages/`(业务) → `mobile-shell/`(壳) / `design-system/`(真源);壳永不反向依赖业务。屏清单写 `index.html`(或业务壳)的 `window.PROTO_CONFIG`,`app.js` 零业务原样复制。

**接入清单(对应 design-spec-kit EXTENDING 的三个挂钩点)**:
1. 屏 link 你的 `tokens.css`+`spec.css`(见上);壳目录加进项目 `check-tokens.js` 的 `SCAN_ROOTS`——token 漂移防线覆盖到壳;
2. 项目 DoD 表追加平台行:「加/删/改屏 → 同步 `PROTO_CONFIG.screens`」;
3. CLAUDE.md 补壳纪律小节(iOS chrome / `data-nav` / `DZ.sheet` / 画布都现成,别重画),`docs/PROTOTYPE-ARCH.md` 入项目文档。

**壳的挂钩契约(business-free 铁律)**:壳 CSS/JS 只指名**壳层/基础层**名字——
`.pg` `.app-top` `.app-scroll` `.lay-pad` `.rail` `.pad-list-head` `.pad-detail-bar` `.pad-main .inner` `[data-detail-empty]` `.lr-card`——
**永不指名业务模块前缀类(如 `rb-*`)或业务全局**。这条不靠自觉——`tools/check-shell-purity.js` 机检(模块类名从项目 `design-system/modules/*.css` 自动派生 + 业务词名单),改壳必跑。业务屏接壳的 iPad 状态栏让位:详情头元素挂 `pad-detail-bar` 即可;
下拉刷新指示器经 `HiPullRefresh.wire(scroll,{ptrHTML})` 注入,壳内只有最简兜底。

**复制式复用才需要的壳同源 guard**:若把壳**复制**进项目(而非引用),跑 `node mobile-shell/tools/check-kit-drift.js`
对 baseline 查副本是否被就地改过(壳的改动应回上游仓);引用式没有副本,此 guard 免跑。首次/升级壳后 `--update` 重生 baseline。

---

## 写一屏的契约(`_template.html` 已含)
- 根 `.pg`;固定头 `.app-top`(`.title` / 左 `.ico` 返回 / 右 `.acts`);滚动区 `.app-scroll`。
  - 顶栏是**悬浮覆盖层**:`screen.js` 实测顶栏高写入 `--top-h`;`.app-scroll` 已 `padding-top:var(--top-h)` 让位。
- iOS chrome(灵动岛/状态栏/Home 条)由 `screen.js` 按 `?device=phone|pad` 注入,**别自绘**。
- 多状态:块上加 `data-when="xxx"`,`?state=xxx` 命中才显示;并在 `PROTO_CONFIG.screens[].states` 登记。
- 跳转:`data-nav="<目标屏id>"`(前进)/ `data-nav-back`(返回)→ `screen.js` 转 `postMessage`;原型模式真路由,画布模式忽略。**别写 `<a href>`**。
- 可选:`.drawer-stage`+`.scrim`+`.drawer`(抽屉)、`.fab-wrap`(FAB)。

## 登记一屏(`PROTO_CONFIG.screens`)
```js
{ id: "home", idx: "01", name: "首页", label: "Home · 列表", proto: "default",
  states: [{ k: "default", n: "默认" }, { k: "empty", n: "空状态" }] }
// 模态 sheet 屏（下→上升起）：再加 modal:true
// pad master-detail：子屏用 deviceAlias 映射到父屏右栏
```
`id`=文件名 · `proto`=原型默认状态 · `states`=画布平铺的各状态 · `modal:true`=下→上模态推入。

## 画布操作
平移:空白拖拽 / 滚轮 / `空格`+拖拽。缩放:`⌘/Ctrl`+滚轮、右下控件、`+`/`-`/`0`。卡片可交互(跨屏 nav 仅原型模式)。左侧索引点击 → 居中该屏。

---

## 易踩的坑（壳专属）
- **吸顶子头与覆盖式顶栏之间空一段** → 吸顶用 `top:0`(不是 `top:var(--top-h)`,否则叠加两次)。
- **`box-shadow` 从 `none` 过渡不显示** → 给显式透明起点 `0 0 0 0 rgba(...,0)` 再过渡,或去过渡。
- **离屏预览不推进 CSS 过渡 / rAF** → 进场别用 rAF,append 后 `void el.offsetWidth` 强制回流再加 `.in`;别用截图判断动画态。
- **`html-to-image` 截不到 `<iframe>` 内容** → 要出图就直接 `show_html` 那一屏再截,别做嵌 N 个 iframe 的排版页。
- **全屏遮罩塞进小定位容器** → 遮罩作触发元素的**后继兄弟**(同在 `.pg` 下),`inset:0` 才铺满、`z-index` 低于触发元素。
- **展示文档手抄产品屏 mock** → 必漂移。展示处用 `<iframe>` 直接嵌真实屏 + `postMessage` 同步主题。

> token/颜色纪律、组件准入、CHANGELOG、DoD guard —— 全在 **design-spec-kit**,本壳不重复。
