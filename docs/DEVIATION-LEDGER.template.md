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
