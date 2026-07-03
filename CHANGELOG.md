# design-spec-kit · CHANGELOG（kit 自身的版本日志）

> 这是 kit 仓自己的变更日志；给使用方项目的 changelog 骨架在 `docs/CHANGELOG.template.md`，别混淆。
> 升级实例前先读这里的破坏性变更标注（⚠）。

## v2.0.0 — 2026-07-03

- [还原层] 新增设计→实现交接契约：`HANDOFF.md` + `docs/SCREEN-MANIFEST.template.md` + `docs/screen-manifest.schema.json` + `docs/IMPL-PROFILE.template.md` + `docs/DEVIATION-LEDGER.template.md`；新 guard⑥ `check-manifest.js`、guard⑦ `check-deviation.js`。
- [底座] 新 guard④ `check-orphan-css.js`（删除侧死码对账）、guard⑤ `check-i18n.js`（消费侧覆盖对账，条件启用）；新增 `kit-doctor.js`（实例化自检）、`run-checks.js`（聚合入口）、`build-bundle.js`（bundle 生成器）。
- [底座] ⚠ 全部 guard 改双环境（AI 沙箱粘贴 / 本地 node 直跑，FAIL 给退出码）；`check-tokens` baseline 改按出现次数计（同值新增一处也算新增——旧 baseline 兼容，首跑可能报出历史预豁免的增量，按提示处置）；`check-icons` 增同形重画维 + 配置零命中自报 FAIL；`check-changelog` 增模块索引一致性维。
- [文档] README 重写为三层结构与独立仓形态；新增 `docs/DESIGN-RATIONALE.md`（设计方案与决策记录）、`docs/VERSIONING.md`（版本 pin / 升级 / 回滚 / bundle 重生协议）；`CLAUDE.template.md` / `AI-BOOTSTRAP.md` 同步 v2 纪律。

## v1 — 2026-06（历史）

- 契约 + DoD + 三 guard（tokens / icons / changelog）+ 壳接入契约 + bundle 手工分发。仅设计侧纪律，无还原层。
