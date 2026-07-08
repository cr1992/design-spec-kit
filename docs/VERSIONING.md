# 版本与实例协议（VERSIONING）

> kit 独立 git 仓管理后，「kit 仓」与「使用方实例」的版本关系、升级、回滚、bundle 重生规则。

## 角色
- **kit 仓（权威源）**：本套件的 git 仓库，语义化版本 tag（`v2.0.0` 起）。`package.json` 的 `version` 字段 = 当前版本唯一真源。
- **发版纪律**：`package.json` bump 与打 tag 是同一动作的两半——bump 合入后立即打对应 tag，不允许「version 已 bump、tag 未打」长期存在。消费仓的 pin **必须落在 tag 上**，不落两个 tag 之间的中间 commit；中间 commit 的 pin 无法用版本号沟通、回滚也没有锚点。急用未发版的修复时，先在 kit 仓补一个 patch tag 再 bump 消费仓。
- **实例**：使用方项目里那份 kit（契约 + docs + tools）。版本 pin 有两种，**按接入方式二选一，不要并存**：
  - **submodule 接入**（推荐）：版本 pin 就是 submodule 的 gitlink（精确到 commit）。`git submodule status` 即给版本，**不要**再建 `.design-spec-kit.version`——那会是会漂的第二真源。`kit-doctor` 检测到 kit 目录受 git 管即走此路。
  - **复制式接入 / 无 git 环境**：纯拷文件或 bundle 拆包，没有 gitlink，才在实例根写一个 **`.design-spec-kit.version`** 文件（一行 = 拷入的 kit 版本号）；`kit-doctor` 读它对比 kit 版本报「落后 N 版」。

## 升级 SOP（实例侧）
1. 读 kit 仓两个版本间的 CHANGELOG，确认破坏性变更（guard 配置区字段变化 / schema 变化 / DoD 行变化）。
2. 覆盖拷入新版文件；**guard 配置区是实例资产**——按 diff 把本地配置（扫描目录 / 档集 / 正则）搬进新版配置区，不要整文件回退。
3. 更新版本 pin：submodule 接入 = bump submodule 到目标 tag（gitlink 自动记录，无文件要改）；复制式 = 改 `.design-spec-kit.version`。
4. 跑 `kit-doctor`（配置命中数 / 入口接线 / DoD 对账）+ `run-checks`（baseline 兼容性——schema 变更可能需要按 guard 提示重写 baseline）。
5. 两者绿才算升级完成；CHANGELOG 记一行。

## 回滚
- 实例侧：从 kit 仓对应 tag 重新拷入 + 回写版本 pin + 重跑 doctor。baseline 文件随实例走、不随 kit 走，回滚不丢豁免账本。
- kit 仓侧：正常 git revert / 打补丁版本。**永不改历史 tag。**

## 实例本地改动（防双向漂移）
- 实例**只应**改各 guard 顶部「配置」区与模板占位；改到 guard 逻辑 / 模板正文 = fork。
- 确需改逻辑：优先给 kit 仓提 PR（所有实例受益）；等不及则在实例 CHANGELOG 登记 `instance-patch: <文件> <原因>`，升级时以新版文件为底、按登记逐条人工合并。发现未登记改动的兜底手段是升级 SOP 第 2 步的 diff 对照（kit-doctor 不做逐文件哈希对账）。

## bundle 是生成物
- `design-spec-kit.bundle.md` 由 `tools/build-bundle.js` 从文件清单重生，**勿手改**。
- 改任何 kit 文件后重生 bundle；`build-bundle.js --check` 校验 bundle 与源文件一致（漂移 = FAIL），挂 kit 仓 CI。
- bundle 头部自带版本号与拆包指令；分发时连同 `distribution-prompt.txt` 一起给。

## 旧嵌入式实例的退役
kit 从某项目目录里「独立出仓」时：原目录保留一个过渡窗口（建议两个迭代），期间只留 README 指针（「本目录已迁往 <kit 仓地址>，版本 pin 见 .design-spec-kit.version」），窗口结束删除目录。同步物（会被上游同步机制覆盖的树）里不要留 kit 源文件，避免双权威。


## submodule 接入（推荐）
- 业务仓把 kit 作为 submodule 放在 `tools/design-spec-kit/`。**版本由 submodule 的 gitlink 单一记录**（精确到 commit，git 强制维护）——不要再建 `.design-spec-kit.version`，两个真源必漂。查看版本：`git submodule status`。
- 业务仓配置放在 `docs/design-spec/config.json`，不要改 submodule 内 guard 源码；否则升级会产生 dirty submodule。
- 升级流程：`git -C tools/design-spec-kit fetch && git -C tools/design-spec-kit checkout <目标 tag>` → 在业务仓 `git add tools/design-spec-kit` 提交新 gitlink → 跑 `node tools/design-spec-kit/tools/kit-doctor.js`。无 version 文件要改。
