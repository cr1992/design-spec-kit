# design-spec-kit · CHANGELOG（kit 自身的版本日志）

> 这是 kit 仓自己的变更日志；给使用方项目的 changelog 骨架在 `docs/CHANGELOG.template.md`，别混淆。
> 升级实例前先读这里的破坏性变更标注（⚠）。

## Unreleased

- [自定义 guard] 落地 MULTI-MODULE-PROPOSAL 方案 2：`config.customGuards[]` 登记契约（name/command/module?/layer?）——run-checks 在内置 guard 之后按声明顺序原样执行 command，保守合取判定（exit != 0 永远 FAIL、`RESULT: FAIL` 可否决零退出码、无 RESULT 行按 exit code）；配置形态错误 / 与内置 guard 同名 / module 未声明 → 上来即 FAIL；modules 分节存在时每个 custom guard 必须声明 module（输出两态契约，禁止第三态裸名，runner/doctor 双侧 fail closed）；老 auto-discovery（不在层清单的 tools/check-*.js 照跑）进入弃用窗口（≥2 个 minor），运行打 WARN，与 customGuards 撞名 FAIL 不双跑；kit-doctor 同步形态校验；信任边界显式声明（command = 仓内受信任代码，非安全边界）。compat snapshot 增 5 场景（正向、否决语义、不可翻案、无 RESULT 按退出码、缺 module 两态契约），既有 golden 零漂移，总计 10 场景。
- [多模块] 落地 MULTI-MODULE-PROPOSAL 方案 1：`config.json` 支持 `modules.<name>` 分节——runner（run-checks）按模块生成 effective config 逐模块执行 guard，输出一律带 `<module>/` 前缀（两态：无 modules = v2.1 逐字节不变，有 modules = 全前缀）；guard 侧 key 级浅合并（模块键覆盖顶层公共缺省）+ 模块 layers 子集；baseline 强制分账（不继承顶层 baselinePath，缺省 `docs/design-spec/baselines/<module>/<guard>.baseline.json`）+ 迁移防线（模块 baseline 缺失而旧全局仍在 → FAIL，禁静默重建空债）；`--only` 支持 `<module>/<guard>` 限定与裸名跨模块匹配，未知模块名 fail closed（不降级裸名静默跨模块全跑）；空 `modules: {}` 分节 = false green，run-checks 与 kit-doctor 都直接 FAIL；`--only` 无匹配时立即退出，修掉「RESULT: FAIL 后又打 RESULT: PASS」的双 RESULT 既有怪癖（末行 RESULT 是判读约定）；kit-doctor ②探针逐模块展开、①⑤按跨模块并集；flutter-visual 支持模块级 extensions 覆盖。compat snapshot 扩到 5 场景（v2.1 单模块 / 双模块 profile / 迁移防线、--only 未知模块、空 modules 三个负向）。
- [工程] 新增 v2.1 兼容 snapshot 对拍（`tests/compat-snapshot/`，MULTI-MODULE-PROPOSAL 成功标准 1 的安全网）：冻结单模块消费仓 fixture 覆盖 `base + handoff + flutter-visual(config-only)` 三层——base 4 guard 带已入账 baseline、manifest schema/语义/source-drift、deviation 双向对账 + delegated 队列;run-checks 输出与 golden 逐字节比对 + exit 断言 + fixture 防改写检查;接入 `ci-check.js`（tests/ 不随 bundle 分发,拆包环境明确 skip）。guard 输出的合法演进走 `--update`,golden 与实现同 commit。

## v2.1.0 — 2026-07-08

- [文档] `extensions/flutter-visual/README.md` 补 config-only 显式警示：默认模式 PASS ≠ evidence 已执行，接入方必须给 `--execute-impl` 安排本地 DoD 或带 Flutter 的 CI 执行位。
- [文档] `ADOPTION.md`：CI/commit gate 接线升级为落地必做步骤（含报告制→转硬节奏）；补 submodule 消费仓 CI 两坑（`.gitmodules` 相对 URL、GitLab job token 允许列表，来自 sproboagent 实测）；baseline 补处置声明约定（冻结不清 / 排队清偿 + owner，防退化成永久豁免池）；submodule 接入树移除 `.design-spec-kit.version` 残留（与 VERSIONING 单源规则对齐），GitLab CI 示例改用 `GIT_SUBMODULE_*` 变量 + gitlink 触发路径。
- [文档] `VERSIONING.md` 补发版纪律：bump 与打 tag 同动作，消费仓 pin 必须落 tag、不落中间 commit。
- [扩展] 新增实现栈 extension 机制：`tools/kit-registry.js` 维护 known extensions，`run-checks.js` 只发现 `kit.layers` 点名的 extension，`kit-doctor.js` 区分 core layer / known extension / unknown name；已启用 extension 目录缺失时普通模式给 setup 提示，`--strict` 失败。
- [扩展] 新增 `extensions/flutter-visual/` v1：默认 config-only 校验 manifest contracts / interactions、anchor 映射、evidence 与 `--reporter expanded`；`--execute-impl` 才运行项目声明的 Flutter test command 并核对 test name；helper 模板使用 Flutter 新版 Color component API。
- [还原层] `screen-manifest.schema.json` 支持 `interactions` 与 `elements[].contracts`，`check-manifest.js` 增加 interaction anchor 校验，并把 interactions / contracts 纳入 source-vs-generated 漂移对账。
- [还原层] `check-manifest` 支持可选 `sourceManifestDir` / `sourceManifestSuffix`：对设计侧语义源 manifest 与 generated 的 `version`、anchors、designed/delegated states 做双向漂移检查，防止生成物过期但 schema 仍 PASS。
- [工程] `kit-doctor` 支持非 npm runner：业务仓可在 `docs/design-spec/config.json` 配 `runner.checkCommand`，doctor 优先识别该入口，不再把 Makefile / bun / 其他 runner 项目误报为入口接线 WARN。
- [壳] kit 随包 ship canonical 壳骨架 `shells/mobile-shell/`(business-free 移动端,从 hirobot 原型 promote):通用运行时 + 中性 demo 屏 + 占位视觉 + 纯度 / 同源 guard。新增 `docs/SHELL-KIT.md` 划清 kit 层(通用运行时)vs 项目层(纯度 config 各自填)、两种接入方式、canonical / 拷贝收敛。`check-shell-purity.js` 三 knob(`MODULE_PREFIX_RE`/`FORBID_WORDS`/`MODULES_DIR`)中性化,hirobot 值转注释示例;纯度 + kit-drift guard 均 PASS。桌面等壳后续 `shells/<name>/` 平级加。
- [文档] `EXTENDING.md` 补壳纯度维:「造新壳最小清单」加 business-free 纯度 guard(`check-shell-purity.js`)+ ALLOW 白名单要求;挂钩②的 DoD guard 表加可选 `check-shell-purity.js` 行,指向 `mobile-shell` 参考实现。明确它与 `check-kit-drift.js` 正交——纯度守「壳永不指名业务」(引用 / 复制式都要)、同源守「复制副本没被就地改」(仅复制式)。

## v2.0.4 — 2026-07-03

- [工程] `kit-doctor` 版本检查改为 submodule-aware：kit 目录受 git 管（submodule / 独立 clone）时以 gitlink 为版本真源、不再要求 `.design-spec-kit.version`；同时存在该文件会 WARN「第二真源，建议删」。`.design-spec-kit.version` 明确降级为仅复制式接入（无 gitlink）需要。
- [文档] README / VERSIONING 区分两种接入的版本 pin 方式（submodule=gitlink 单源、复制式=version 文件），修正原「submodule commit + version 文件双重记录」的双真源表述。

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
