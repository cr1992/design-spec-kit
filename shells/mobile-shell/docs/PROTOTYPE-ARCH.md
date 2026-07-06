# 页面原型架构（PROTOTYPE-ARCH）

> 本文件沉淀 `prototype-kit/` 这套**「一套屏幕源、两种呈现」**的设计原型架构，并给出**对应的 Flutter 落地映射**。
> 定位：`screens/` 是**设计原型**（HTML，用于评审与交互演示），**不是产品代码**；真实产品是 Flutter。本文件让两边对得上。
> 配套：视觉 token/组件见 `DESIGN-REF.md`；变更记录见 `CHANGELOG.md`。

---

## 0. 一句话概括
**每个屏幕是一个独立 HTML（`screens/*.html`）。交互视图把它当 iframe「活」嵌进 iPhone / iPad 跑真交互；参考视图把同一批屏按「状态 × 设备」缩略平铺速览——同一份源，零 markup 重复。**

---

## 1. 复用关系（交互 ↔ 参考）
```
        screens/home.html  detail.html …            ← 唯一真源（屏幕本体）
                   │                │
     ┌─────────────┴──────┐  ┌──────┴──────────────┐
     ▼                    ▼  ▼                     ▼
  交互视图（interactive）          参考视图（reference）
  屏在 iPhone / iPad 内真跑         所有屏 × 状态 × 设备 平铺
  iOS push 路由 + 无白屏缓存         可缩放 / 拖拽的板上速览
```
- 两视图加载的是**同一批 `screens/*.html`**，区别只在外壳（`index.html` + `pages.css` + `app.js`）如何摆放 iframe。
- 屏幕**不知道**自己被谁嵌入：只渲染自身 + 通过 `postMessage` 向上发意图。外壳决定「交互里真跳转」还是「参考里平铺」。
- 改一处屏幕内容 → 两视图同时更新。**这是核心收益。**

---

## 2. 文件职责
| 文件 | 职责 | 谁加载 |
|---|---|---|
| `screens/<id>.html` | 单屏本体：结构 + 多状态块（`data-when`）+（详情屏）`select` 就地换数据监听 | 两视图都以 iframe 加载；也可单独打开调试 |
| `assets/screen.css` `screen.js` | **屏内**通用：iOS chrome（按 `?device=` 出 iPhone 灵动岛 / iPad 状态栏）、`?state=` 显隐、抽屉/FAB、`postMessage` 导航、收主题、Tab 下划线 | 仅 `screens/*.html` |
| `assets/sheet.js` | 弹层引擎 `DZ.sheet`(底部)+`DZ.dialog`/`DZ.confirm`(居中)，零依赖按需引 | 仅 `screens/*.html` |
| `assets/tokens.css` `spec.css` | 设计 token + 组件（自设计规范复制，保持同步） | 屏 + 外壳 |
| `index.html` | **外壳容器** + **唯一业务耦合点 `window.PROTO_CONFIG`**（屏清单 / 设备 / 主题 / `deviceAlias`）。改这块即换业务 | 顶层 |
| `assets/pages.css` | **外壳**样式：双端设备框（`.dev-iphone` / `.dev-ipad`）、交互/参考视图、缩放控件、左侧索引 | 仅外壳 |
| `assets/app.js` | **外壳**逻辑（**与业务解耦，读 `PROTO_CONFIG`**）：主题下发、**无白屏导航引擎**（缓存+预热+就绪门控+select 换数据）、参考平铺、缩放平移、索引联动 | 仅外壳 |

> 边界铁律：**屏内只管自己**；**跨屏与摆放只在外壳**。屏内不得 `parent.location` 或操作别的 iframe，一律走 `postMessage`。

---

## 3. 屏幕契约（写新屏照抄 `_template.html`）
```html
<div class="pg">
  <div class="app-top">…固定头：.title / 左 .ico 返回 / 右 .acts…</div>
  <div class="app-scroll">
    <div data-when="default">…默认态…</div>
    <div class="empty" data-when="empty">…空态…</div>
  </div>
  <!-- 可选：.scrim + .drawer（抽屉）、.fab-wrap（FAB） -->
</div>
<script src="../assets/screen.js"></script>
```
- iOS chrome 由 `screen.js` 注入，**别自绘**。设备由 `?device=phone|pad` → `screen.js` 写 `<html data-device>`。
- **跳转**：元素加 `data-nav="<id>"`（前进）/ `data-nav-back`（返回）→ `screen.js` 转 `postMessage`。带条目加 `data-rid`。
- **多状态**：`?state=xxx` 命中 `[data-when="xxx"]` 才显示；新状态在 `PROTO_CONFIG.screens[].states` 登记。
- **详情屏（换条目零重载）**：监听 `{type:'select', rid}` 就地换数据（模板末尾有注释示例；业务版见调用方的 detail 脚本）。

---

## 4. 双端 + master-detail
- **iPhone**：竖屏单列 + 底部 Tab，逐页 push。
- **iPad**：横屏 master-detail，左列表 + 右详情一屏联动，**不是放大的手机**；详情屏在 pad 上**就地活在列表右栏、不单独成屏**。
- 外壳用 `PROTO_CONFIG.deviceAlias = { "<子屏id>": "<父屏id>" }` 逐设备解析目标（`resolveDev`）：iPhone push 子屏；iPad 解析回父屏，且目标==当前屏 → 不跳转，发 `{type:'select', rid}` 就地更新右栏。
- 设备由顶栏「双端 / iPhone / iPad」切换；交互视图当前屏出选定设备，参考视图按设备分组平铺。

---

## 5. postMessage 协议（屏 ↔ 外壳）
| 方向 | 消息 | 含义 |
|---|---|---|
| 屏 → 外壳 | `{type:'nav', to:'<id>', rid?}` / `{type:'back'}` | 进入 / 返回（交互 iOS push；参考忽略）。`rid` 透传给目标详情屏 |
| 屏 → 外壳 | `{type:'ready'}` | 屏就绪，索要当前主题 |
| 屏 → 外壳 | `{type:'settheme', theme}` / `{type:'setmode', mode}` | 改主题色 / 明暗 |
| 外壳 → 屏 | `{type:'theme', theme, mode}` | 下发主题 / 明暗，屏即时换肤 |
| 外壳 → 屏 | `{type:'select', rid}` | **就地换条目**：detail 屏（含 iPad master-detail 同屏）收此消息换数据，**不重载 iframe** |

---

## 6. 无白屏导航引擎（秒开 + 零闪白 · 别再退化）
交互视图跳转**绝不新建 + 重载 iframe**——否则加载时闪白、换条目卡顿。范式四件套（`app.js`）：
1. **常驻缓存页**：每个设备框 `.scr` 持有按目标屏 `tid` 缓存的常驻 iframe（`scr._cache`），只建一次。
2. **空闲预热**：首构建后 `requestIdleCallback` 把其余屏全部加载好，停屏外（`translateX(100%)` + `visibility:hidden`，被 `.scr overflow:hidden` 裁剪不露白）。
3. **就绪门控滑入**：跳转只做 `transform` 滑动；`whenReady(f)` —— 缓存页已加载立即滑（秒开），冷页等 `load` 才滑（1600ms 安全兜底）。**不要**提前定时器开滑，会露白。
4. **换条目零重载**：详情屏常驻、**不按 rid 重载**；换条目发 `{type:'select', rid}` 让屏内就地换数据。

> 退化反例：早期每次 `createElement('iframe')` + `src=` 重载，再 `setTimeout(run,650)` 兜底——load 慢时内容没画好就开滑 → 白屏一帧；换不同条目 = 整屏重载 → 明显延迟。**已废弃，勿回退。**

---

## 7. 参考视图（纯评审 · 不进产品）
所有屏 × 状态 × 设备平铺在 `.board` 上：`z` 缩放 → `.board` `scale()`；`⌘/Ctrl`+滚轮（锚点缩放）、右下 `.zoomctl`、空白拖拽平移。卡片内 iframe 仅展示（`loading="lazy"`），跨屏 nav 在参考视图忽略。

---

## 8. Flutter 落地映射（做产品照此，别照抄 HTML）
| 原型（HTML） | Flutter |
|---|---|
| `screens/<id>.html` | 一个页面 Widget + `go_router` 注册路由 |
| iOS push 路由栈 + 转场 | `Navigator.push` + `CupertinoPageRoute`（系统右滑入场 + 边缘返回） |
| **常驻缓存页 + 预热 + 就绪门控** | `IndexedStack` / `AutomaticKeepAliveClientMixin` / `go_router` 页面保活（详情页不销毁）。无「预热/就绪门控」对应——Flutter 构建同步，本无 iframe 加载白屏 |
| **`select` 就地换条目（零重载）** | 提状态（`ValueNotifier` / Riverpod `selectedId`）驱动同一 detail Widget rebuild，而非 push 新页 |
| `deviceAlias` master-detail | `flutter_adaptive_scaffold` 断点路由：窄屏 push 详情页，宽屏只更新 detail pane 选中态（同一 `selectedId`） |
| `?state=` 多状态 | 入参 + 状态管理（Riverpod/Bloc）：空/载/错/满 用同一 Widget 按 state 渲染 |
| iOS chrome | 真机系统提供；`SafeArea` + `MediaQuery.padding` 让位，别自绘 |
| 固定头 `.app-top` + `.app-scroll` | `Scaffold(appBar:)` 或 `CustomScrollView` + `SliverAppBar(pinned:true)` |
| 底部 Tab `.tabbar` | `NavigationBar`（M3）/ `CupertinoTabScaffold` |
| 抽屉 `.drawer` / FAB `.fab-wrap` | `Scaffold(drawer:)` / `FloatingActionButton` |
| 底部弹层 `DZ.sheet` | `showModalBottomSheet`（圆角顶 + 拖拽柄 + `SafeArea`） |
| token（`tokens.css`） | `ThemeData` + `ThemeExtension`（多主题 × 明暗），token 名一一对应 |
| 主题广播到 iframe | 顶层 `ThemeData` 切换，全树自动 rebuild，无需广播 |
| 参考视图平铺 | 无运行时对应——纯评审；Flutter 侧用 widgetbook 看各状态 |

---

## 9. 复用这套框架做新原型（移植指南）
> 外壳（`index.html` 容器 + `pages.css` + `app.js`）**与业务完全解耦**，可直接照搬。唯一业务耦合点是 `index.html` 顶部的 `window.PROTO_CONFIG` + 视觉 token + 屏幕本体。

**外壳文件（直接复制，几乎不改）**：`index.html`（改品牌字样）、`assets/pages.css`、`assets/app.js`（**逻辑全通用，不改**）、`assets/screen.{css,js}`、`assets/sheet.js`、`screens/_template.html`。

**项目专属（每个新原型写 3 处）**：
1. **视觉**：换 `assets/tokens.css`（+ `spec.css`）——来自该项目设计规范。全走 `var(--*)`，换 token 自动换肤。
2. **配置**：改 `index.html` 的 `window.PROTO_CONFIG`：
   ```js
   window.PROTO_CONFIG = {
     screensDir: "screens/", storagePrefix: "<项目>",
     devices: { phone:{w:418,h:872,label:"iPhone"}, pad:{w:1212,h:852,label:"iPad"} },
     defaultDevice: "both", defaultTheme: "<id>", defaultMode: "light", refScale: 0.4,
     themes: [{ id, name, color }, …],
     deviceAlias: { /* "detail":"home" —— pad master-detail */ },
     screens: [{ id, idx, name, group, states:[{k,n}] }, …]
   };
   ```
3. **屏幕**：照 `_template.html` 写每个 `screens/<id>.html`（多状态 `data-when`，跳转 `data-nav`，详情屏加 `select` 监听）。

**移植步骤**：复制 `prototype-kit/` 整目录 → 替换 tokens/spec → 清空 `screens/` 只留 `_template.html` → 填 `PROTO_CONFIG` → 按 §10 一屏一屏加。导航引擎 / 双端 / 主题广播 / postMessage 协议全部现成，无需重写。

---

## 10. 新增一屏 / 一状态清单
1. 写 `screens/<id>.html`（照 §3 契约）。
2. `index.html` 的 `PROTO_CONFIG.screens[]` 加一项 `{id,idx,name,group,states}`。
3. 被别处跳转 → 来源屏元素加 `data-nav="<id>"`（带条目加 `data-rid`）。
4. 「详情即列表」型屏 → `PROTO_CONFIG.deviceAlias` 登记 `{ "<子屏>":"<父屏>" }`，并在子屏加 `select` 监听。
5. 新状态 = 屏内加 `data-when` 块 + `states[]` 加一项。
6. 两视图各看一眼，多主题 × 明暗抽查。
7. 定档：写 `CHANGELOG.md`；动 token/组件同步 `DESIGN-REF.md`；动架构回来更新本文件。
