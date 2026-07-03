# 版本与实例协议（VERSIONING）

> kit 独立 git 仓管理后，「kit 仓」与「使用方实例」的版本关系、升级、回滚、bundle 重生规则。

## 角色
- **kit 仓（权威源）**：本套件的 git 仓库，语义化版本 tag（`v2.0.0` 起）。`package.json` 的 `version` 字段 = 当前版本唯一真源。
- **实例**：使用方项目里拷入的那份 kit 文件（契约 + docs + tools）。实例根目录放一个 **`.design-spec-kit.version`** 文件，内容一行 = 拷入时的 kit 版本号。`kit-doctor` 读它对比 kit 版本，报「落后 N 个版本」。
- **无 git 环境的设计项目**：持有 bundle 拆包出的实例，同样写版本 pin 文件（bundle 里自带）。

## 升级 SOP（实例侧）
1. 读 kit 仓两个版本间的 CHANGELOG，确认破坏性变更（guard 配置区字段变化 / schema 变化 / DoD 行变化）。
2. 覆盖拷入新版文件；**guard 配置区是实例资产**——按 diff 把本地配置（扫描目录 / 档集 / 正则）搬进新版配置区，不要整文件回退。
3. 更新 `.design-spec-kit.version`。
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
