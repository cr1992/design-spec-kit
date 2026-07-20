# design-spec-kit · CHANGELOG（kit 自身的版本日志）

> 这是 kit 仓自己的变更日志；给使用方项目的 changelog 骨架在 `docs/CHANGELOG.template.md`，别混淆。
> 升级实例前先读这里的破坏性变更标注（⚠）。

## v2.6.1 — 2026-07-20

- [工具] `run-checks` 债务仪表盘 `BASELINE_GUARDS` 集合补 `check-ghost-classes`——v2.6.0 漏登记导致汇总行不显示该 guard 的 `· baseline N` 账本余额（消费仓实跑发现）。

## v2.6.0 — 2026-07-20

- [guard] 新增 `check-ghost-classes`（可选层 `ghost-classes`）：使用面（`class="..."` 属性 / `className=` / `classList.add|remove|toggle|contains|replace` 字符串字面量）引用的 class 必须在样式真源（`cssRoots`）有定义，否则视为「幽灵类」——类名拼错 / 引用不存在的变体时样式静默回落基底，设计稿呈现即错、实现照抄错样（起源：hirobot 设计侧 `tag danger` 引用不存在的类回落 accent 蓝的双侧走样，设计侧 2026-07-20 先落本地 guard，本版吸收为通用能力）。与 `check-orphan-css` 互为镜像（orphan = 定义了没人用；ghost = 用了没人定义），复用其 brace-aware CSS 选择器解析（声明体 `.5` / `url(a.png)` / `@keyframes` 帧名不误当定义）与 baseline 惯例（首跑固化存量、之后只拦新增、`--write-baseline` 重固化、模块模式 baseline 强制分账 + 迁移防线）。HTML 类文件的 `<style>` 计入该文件局部定义；`<!-- -->` 与 `<script>` 内 JS 注释剥除后再扫（等长替换行号不漂）；JS 拼接碎片经合法 token 过滤跳过（漏报向盲区，与 orphan 的误报向互补）。配置键 `cssRoots` / `usageRoots` / `skipDirs` / `baselinePath`，多模块 profile 与 `DESIGN_SPEC_KIT_MODULE` 语义同其余 guard。
- [工具] `kit-registry` 增层 `ghost-classes`；`kit-doctor` 配置探针补 `check-ghost-classes.cssRoots`（dirlist）。
- [文档] README（层说明 / 文件树 / guard 表 8）、`docs/ADOPTION.md`（Phase 2b）、`docs/config.template.json`、`CLAUDE.template.md` DoD 表同步。
- [工程] compat-snapshot 新增 2 场景（`fixture-ghost-classes` 存量走 baseline PASS / `fixture-ghost-classes-fail` 新增幽灵类 FAIL），总计 34 场景；既有 golden 追加未启用层跳过行，与实现同 commit。

## v2.5.0 — 2026-07-16

- [guard] `check-manifest` 新增可选 `coverage` 设计屏覆盖对账（⑥，report-only）：扫 `designRoot` + `screenGlobs` 收集设计屏源文件，与各 generated 的 `screen.source` 集合做差——设计屏尚无 manifest 逐条挂 **warning、非 FAIL**（④ `screensListPath` 守「清单里的屏都有 manifest」，本维守「设计源文件都进了 manifest 体系」，堵「清单手维护、新屏没人登记、覆盖面停滞无信号」的盲区）。`exempt`（`[{source, note}]`，note 必填 fail closed）豁免确定不建 manifest 的屏；exempt 失效（已覆盖 / 源文件已不存在）提醒清理。coverage 配置形态错误 / `designRoot` 不可读 / 任一 glob 零匹配 → **FAIL**（review 返工补齐：拼错的 glob 若静默通过会输出 `0/0` 假绿，与防漏目标相反）；不配置 `coverage` = 本维关闭、输出零变化。glob 语义（按路径段解析）：`*` 段内不跨 `/`，段级 `**` 匹配零或多个目录段（`**/x` 含根层 x、`a/**/b` 含 a/b、结尾 `/**` 含自身与任意深度），连续 `**` 段折叠（`**/**` ≡ `**`）；review 两轮返工——初版字符串替换把 `**` 编译成必须含 `/` 漏根层文件、二版非重叠替换漏相邻 globstar，终版段解析；语义用例冻结在 `tests/glob-semantics/run.js`（27 用例，接入 ci-check，source-only 不随 bundle）。目录遍历沿用 kit 双环境 walk 惯例与缺省 skipDirs（可 `coverage.skipDirs` 覆盖）。
- [工具] `run-checks` 汇总债务/告警可见性：每行 guard 追加 `· baseline N`（读该 guard 账本文件 `totalEntries`，路径解析逐字镜像 guard 侧规则——模块模式只认模块级 `baselinePath` 缺省分账路径、单模块认顶层缺省 `tools/<guard>.baseline.json`；读不到 / 无 `totalEntries` 不展示）与 `· warnings N`（解析 guard 新增的 `WARNINGS: n` 机器行，无该行 = 0），末尾给 `Σ baseline 债务合计 X 条（N 本账）· warnings 合计 Y` 合计行——「冻结存量只拦新增」的 baseline 模型 PASS ≠ 没债，这行是防退化成永久豁免池的仪表盘。`--json` 附加 `guards[].baseline` / `guards[].warnings` / `totals`（additive，`jsonVersion` 保持 1）。
- [guard] `check-manifest` 与 `impl-visual`（含 `flutter-visual` 别名）在 RESULT 前输出 `WARNINGS: n` 机器行（仅 warnings > 0 时打印，干净仓输出零变化）；与 `RESULT:` 同为约定解析面，人类叙述文本仍不作为解析面。
- [guard] `impl-visual` execute 失败诊断：command 退出码非零时，把子进程输出尾部（最后 ≤40 行）带进 guard 日志——CI 上排障不再只剩一个退出码（review 返工补齐）。
- [工程] compat-snapshot 新增 5 场景：`fixture-manifest-coverage`（覆盖缺口 + exempt 失效挂 warning 且 PASS，含段级 `**` 命中根层文件的语义样例）、`fixture-manifest-coverage-bad`（exempt 缺 note fail closed）、`fixture-manifest-coverage-badroot`（designRoot 不可读 fail closed）、`fixture-manifest-coverage-emptyglob`（glob 零匹配 fail closed）、`fixture-impl-visual-execfail`（execute 失败：>40 行输出截尾 + 失败诊断日志入 golden），总计 32 场景；既有 golden 演进（汇总行 baseline/warnings 追加、`WARNINGS:` 行、`--json` 附加字段）与实现同 commit。
- [文档] HANDOFF §1.2 补设计屏覆盖对账说明；`docs/config.template.json` check-manifest 块补 `coverage` 字段；README guard 表与 run-checks 说明同步。

## v2.4.0 — 2026-07-14

- [guard] `impl-visual`（含 `flutter-visual` 别名）config-only 新增两道闭环护栏，均 warning 级、非 FAIL：
  - **待登记队列**：manifestDir 下的 `*.manifest.generated.json` 未在 `extensions.<name>.screens[]` 登记且不在 `exempt` 名单时逐条挂 warning——设计 sync 带回新屏当下挂账、实现落地补 command + evidence 销账，堵住「manifest 进了 handoff 体系但 evidence 永不执行」的静默缺口。manifestDir 解析：extension 自己的 `manifestDir` > `check-manifest` guard 配置（模块键覆盖顶层）> 默认 `docs/manifests`；目录不存在（未接 handoff 生成物）静默跳过。新配置字段 `extensions.<name>.exempt`（`[{id, note}]`，note 必填——豁免必须写明原因，形态错误 fail closed）；exempt 条目失效（已登记 / 无对应生成物）提醒清理。
  - **evidence 静态核对**：从 `command` 解析实际存在的源文件（按 `&&`/`;` 分段、跟踪 `cd` 前缀），非 regex 的 evidence name 与源码做归一化子串比对（剥转义反斜杠、去空白/引号，容忍换行拼接），缺失即 warning——测试改名断链在每次 config-only 检查（含 CI）可见，不用等本地 `--execute-impl`。command 解析不出源文件（make target 等）静默跳过；动态拼接的用例名改用 regex matcher 豁免。
- [guard] 异常路径 fail closed / 显性化（review 两轮返工补齐，堵 false-green）：显式配置的 manifestDir（extension 级或 check-manifest guard）指向不可读目录 → **FAIL**；缺省回退路径仅 ENOENT（未接 handoff 生成物）静默跳过，ENOTDIR / EACCES 等其余异常 → **FAIL**。command 显式引用的文件不存在（测试改名/删除/路径拼错）→ **warning**（仅解析不出任何文件 token 才静默跳过）；command 切词用轻量 shell-word lexer（单/双引号、\ 转义、带空格路径、未引号的 && ; | 分段），引号包裹的文件引用不再漏检。
- [工程] compat-snapshot 新增 6 场景：`fixture-impl-visual-pending`（待登记 + 静态核对 + exempt 生效/失效，warning 且 PASS）、`fixture-impl-visual-badexempt`（exempt 缺 note fail closed）、`fixture-impl-visual-gonefile`（command 引用文件不存在挂 warning）、`fixture-impl-visual-badmanifestdir`（显式 manifestDir 不可读 fail closed）、`fixture-impl-visual-quotedgone`（引号包裹的缺失文件仍挂 warning）、`fixture-impl-visual-defaultnotdir`（缺省 manifestDir ENOTDIR fail closed）；v2.1 fixture 补测试源文件使其自洽（顺带覆盖 flutter-expanded 静态核对正向路径），既有 21 场景 golden 零漂移。
- [文档] HANDOFF §3.1 补两道护栏说明；`docs/config.template.json` flutter-visual 块补 `exempt` 字段；extension README 修正「不解析任何实现语言源码」表述并补齐 manifestDir / exempt / 静态核对行为文档。

## v2.3.1 — 2026-07-10

- [工具] `design-sync` 的 best-effort link-check 识别运行时模板路径：跳过 ES template literal（`${...}`）、Handlebars（`{{...}}`）与 EJS（`<%...%>`），不再把占位符当作同包静态文件报假断链；真实相对静态断链仍会报告。`tests/design-sync/run.js` 增覆盖。

## v2.3.0 — 2026-07-09

- [工具] 新增 `tools/design-sync.js`：设计 handoff → 消费仓 target 同步引擎（与平台无关，业务细节全在消费仓 `docs/design-spec/design-sync.json` profile）。能力：内置零依赖 ZIP 读取器（中央目录权威、避 data-descriptor 歧义，store + deflate）；三态对比 changed/onlyInSource/onlyInTarget（`transferExcludes` 不同步、`diffExcludes` 全排除、`targetOnlyAllow` 把目标侧独有产物如 `*.standalone.html` 移出 residue，优先级 diffExcludes > targetOnlyAllow）；`_archive` 双向提示（report-only）；覆盖/删除安全门（只比对将被动到的 path 与 `git status --porcelain -- <target>` 交集、无关 dirty 不阻塞、覆盖须 `--force-overwrite`、删除须 `--apply-deletes`、两门独立）；非破坏 apply 且写盘边界锁死 target 子树；postSync 编排（link-check / manifest-sync / manifest-sync-check / design-spec-check / command，顺序契约重生先于校验，dry-run 全 SKIP）；`--json` 机读报告契约（jsonVersion=1，供 skill wrapper 解析，不解析人类文本）。manifest 路径不重复声明——`manifest-sync.js` 自读 `config.json` guard。CLI `--zip`/`--source`/`--module`/`--dry-run`/`--check-only`/`--json`/`--apply-deletes`/`--force-overwrite`；`--module` 省略按 `topNameHints` 自动认、认不准 fail-closed。
- [安全] ZIP 解压 fail-closed（外部输入）：拒路径逃逸 `..` / 绝对路径 / NUL / symlink entry；zip bomb 单文件·总量·entry 数上限 + 膨胀比阈值；ZIP64 / 加密 / 未知压缩方法一律 fail-closed；apply 写盘每路径规范化后必须仍在 target 子树内（工具级不变量，独立于宿主 auto-mode）。校验全在中央目录解析阶段，越界即 abort、不落任何盘。
- [文档] 新增 `docs/DESIGN-SYNC.md`：引擎边界、`design-sync.json` schema（三种 excludes 语义与优先级）、CLI、三态、安全门、解压安全、postSync 与 command 执行契约、`--json` 契约、与实现级视觉 evidence 的分层。
- [工程] 新增 `tests/design-sync/run.js`（source-only，不随 bundle 分发）：hermetic 单测自拼 ZIP 字节，覆盖良性解压（store + deflate + 中文名）、恶意 zip 全 fail-closed 且不落盘（`../` / 绝对路径 / symlink）、exclude/targetOnlyAllow glob 语义、覆盖/删除安全门。接入 `ci-check.js`（tests/ 不随 bundle → 拆包环境明确 skip）。design-sync 作为工具文件也自动进 `node --check` 与 bundle 漂移校验。

## v2.2.0 — 2026-07-08

- [工具] 落地 MULTI-MODULE-PROPOSAL 方案 4：新增 `tools/manifest-sync.js`（schema-owned canonicalization 上收）——delegated projection 裁剪、稳定 JSON 序列化、screens 清单生成、`--check` 逐字节漂移校验；多模块感知（按 modules.<m>.guards ⊕ 顶层合并读 check-manifest 配置，`--module <m>` 限定，缺值/单模块模式下带 --module 均 fail closed 不静默退化全量）；generated 追加 `generator: "schema-projection-v1"` 版本标记（schema 增可选 `generator` 字段），projection 演进走 kit 版本发布。消费仓同构脚本迁移后删除。
- [工具] `run-checks.js --json`：抑制文本叙述，输出单行稳定 JSON 汇总（jsonVersion/modules/guards/missing/unknownLayers/errors/result，承诺字段稳定）；**全路径契约**——planning/config 失败的早退分支（空 modules、customGuards 配置错误、--only 未匹配、guard 文件缺失、auto-discovery 撞名）统一经 JSON 失败出口，不漏文本；文本汇总不作为解析面；exit 语义与文本模式一致。
- [文档] `ADOPTION.md` 新增「3.5 第二个模块怎么接」：modules 迁移要点（公共缺省/两态输出/baseline 搬家分账拒静默清零/customGuards 编排自建检查/manifest-sync/--json）。compat snapshot 增 6 场景（--json 多模块、manifest-sync 校验、漂移负向、--json 两个失败路径负向、--module 缺值负向），总计 21 场景。
- [扩展] 落地 MULTI-MODULE-PROPOSAL 方案 3：新增通用实现栈视觉契约执行器 `extensions/impl-visual/`（config-only 校验 + evidence runner + matcher 集 substring/regex/flutter-expanded/playwright-list；screen 级 `matcher` 缺省 + 单条 evidence `{name, match?, pattern?}` 覆盖；reporter 前置校验由 matcher 声明）。`flutter-visual` 降级为注册别名（弃用窗口 ≥2 个 minor）：guard 文件变 `--as flutter-visual` 转发壳，层名 / 配置路径 / 输出文案逐字节不变（v2.1 compat snapshot 全程护航），缺省 matcher `flutter-expanded` = 原 `--reporter expanded` 行为；Flutter helper 模板迁至 `extensions/impl-visual/helpers/flutter/`。README 交付 matcher 契约表 + Web 栈（Playwright）IMPL-PROFILE 示例。校验闭环：单条 evidence 覆盖 matcher 时逐条校验该 effective matcher 的 reporter 要求；regex effective pattern 在 config-only 阶段预编译验证（非法 pattern 不再拖到 execute 阶段裸崩），execute 匹配阶段异常也转 guard 级 FAIL。compat snapshot 增 5 场景（config-only / --execute-impl matcher 端到端含 ANSI 剥离与 regex 覆盖 / 缺 evidence、覆盖 matcher reporter、非法 regex 三个负向），总计 15 场景。
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
