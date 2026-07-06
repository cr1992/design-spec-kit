# design-spec-kit · CHANGELOG（kit 自身的版本日志）

> 这是 kit 仓自己的变更日志；给使用方项目的 changelog 骨架在 `docs/CHANGELOG.template.md`，别混淆。
> 升级实例前先读这里的破坏性变更标注（⚠）。

## Unreleased

- [文档] `EXTENDING.md` 补壳纯度维:「造新壳最小清单」加 business-free 纯度 guard(`check-shell-purity.js`)+ ALLOW 白名单要求;挂钩②的 DoD guard 表加可选 `check-shell-purity.js` 行,指向 `mobile-shell` 参考实现。明确它与 `check-kit-drift.js` 正交——纯度守「壳永不指名业务」(引用 / 复制式都要)、同源守「复制副本没被就地改」(仅复制式)。

## v2.0.3 — 2026-07-03

- [文档] 修正三处随 v2.0.1 外部配置遗留的旧指引（run-checks 头注释与跳过提示、README 安装步骤 4 与检查命令说明、AI-BOOTSTRAP 第三步）：层开关统一指向业务仓 `docs/design-spec/config.json` 的 `kit.layers`，不再引导修改 kit 源码内 `INSTALLED_LAYERS`。
- [工程] 新增 `.gitlab-ci.yml`：内网主仓与 GitHub 镜像同跑 `node tools/ci-check.js` 门禁，消除主远端零门禁缺口。

## v2.0.2 — 2026-07-03

- [文档] 新增 `docs/ADOPTION.md`，明确 kit 源、设计层、项目实现层的责任边界，并补充 CI / commit gate 接线示例。
- [工程] 新增 GitHub Actions CI、`tools/ci-check.js` 和本仓 pre-commit hook 安装脚本，确保工具语法、source doctor、bundle 漂移检查在提交和 CI 中一致。

## v2.0.1 — 2026-07-03

- [底座] 支持业务仓外部配置：`docs/design-spec/config.json` 可声明启用层、扫描根、baseline 路径、manifest/ledger 路径；submodule 接入时不再需要改 guard 源码。
- [工具] `run-checks.js` / `kit-doctor.js` 优先读取外部配置；新增 `docs/config.template.json`。

## v2.0.0 — 2026-07-03

- [还原层] 新增设计→实现交接契约：`HANDOFF.md` + `docs/SCREEN-MANIFEST.template.md` + `docs/screen-manifest.schema.json` + `docs/IMPL-PROFILE.template.md` + `docs/DEVIATION-LEDGER.template.md`；新 guard⑥ `check-manifest.js`、guard⑦ `check-deviation.js`。
- [底座] 新 guard④ `check-orphan-css.js`（删除侧死码对账）、guard⑤ `check-i18n.js`（消费侧覆盖对账，条件启用）；新增 `kit-doctor.js`（实例化自检）、`run-checks.js`（聚合入口）、`build-bundle.js`（bundle 生成器）。
- [底座] ⚠ 全部 guard 改双环境（AI 沙箱粘贴 / 本地 node 直跑，FAIL 给退出码）；`check-tokens` baseline 改按出现次数计（同值新增一处也算新增——旧 baseline 兼容，首跑可能报出历史预豁免的增量，按提示处置）；`check-icons` 增同形重画维 + 配置零命中自报 FAIL；`check-changelog` 增模块索引一致性维。
- [文档] README 重写为三层结构与独立仓形态；新增 `docs/DESIGN-RATIONALE.md`（设计方案与决策记录）、`docs/VERSIONING.md`（版本 pin / 升级 / 回滚 / bundle 重生协议）；`CLAUDE.template.md` / `AI-BOOTSTRAP.md` 同步 v2 纪律。

## v1 — 2026-06（历史）

- 契约 + DoD + 三 guard（tokens / icons / changelog）+ 壳接入契约 + bundle 手工分发。仅设计侧纪律，无还原层。
