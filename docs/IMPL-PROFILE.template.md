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
