# 落地指南（ADOPTION）

Design Spec Kit 不是“拷一个目录就自动生效”。完整落地分三层：kit 源、设计层、项目实现层。

## 1. 三个责任面

| 层 | 放什么 | 谁维护 | 典型文件 |
|---|---|---|---|
| kit 源 | 通用方法、模板、guard、bundle、CI | kit 仓 | `tools/*.js`、`docs/*.template.md`、`HANDOFF.md` |
| 设计层 | 设计 token、图标真源、设计规范索引、设计侧 changelog | 设计/原型仓或业务仓内设计目录 | `tokens.css`、`icons.js`、`DESIGN-REF.md`、`CHANGELOG.md` |
| 项目实现层 | 项目配置、baseline、实现栈 profile、manifest、偏离台账、CI/commit gate 接线 | 业务项目 | `docs/design-spec/config.json`、`baselines/`、`IMPL-PROFILE`、`DEVIATION-LEDGER.md` |

原则：kit 源不要在业务项目里改；业务项目只维护自己的配置和账本。

## 2. 推荐接入形态

### 内部项目：submodule pin

```text
tools/design-spec-kit/        # submodule，指向内部 Git 仓；gitlink 即版本 pin（见 VERSIONING.md）
docs/design-spec/config.json  # 项目侧配置
docs/design-spec/baselines/   # 当前历史债 baseline
docs/design-spec/manifests/   # handoff 生成物
```

初始化：

```bash
git submodule add <internal-git-url> tools/design-spec-kit
git -C tools/design-spec-kit checkout <tag>
cp tools/design-spec-kit/docs/config.template.json docs/design-spec/config.json
node tools/design-spec-kit/tools/kit-doctor.js
```

Submodule 在消费仓 CI 里有两个高频坑，接入时就处理掉：

- **URL 写相对路径**。`.gitmodules` 里的绝对 ssh URL（`git@host:group/kit.git`）在 CI 的 job-token http clone 下拉不动；同实例托管时写 `../design-spec-kit.git` 这类相对 URL，本地 ssh 与 CI http 都能解析。
- **job token 允许列表**。GitLab 16+ 默认限制跨项目 job token：需要在 **kit 项目**的 Settings → CI/CD → Job token permissions 里把消费仓加入允许列表，否则 CI 拉 submodule 403。这一步只能由 kit 项目的 Maintainer 在 UI/API 操作，不是消费仓侧配置。

### 无 git / 外部分发：bundle

发送 `design-spec-kit.bundle.md` 与 `distribution-prompt.txt`。bundle 是生成物，源仓改动后必须重新生成。

## 3. 启用顺序

### Phase 1：base 层

目标：先防新增设计债。

启用：

```json
{
  "kit": { "layers": ["base"] }
}
```

需要配置：

- `check-tokens.scanRoots`
- `check-icons.scanRoots` / `registrySources`
- `check-orphan-css.cssRoots` / `usageRoots`
- `check-changelog.changelogPath`

首次运行会生成 baseline。baseline 表示“当前历史债先记账”，后续只拦新增。

**baseline 不是“干净”，是“有账本的债”**——每份 baseline 必须有明确的处置口径，写在项目侧 `docs/design-spec/README.md`（或等价入口），二选一：

- `冻结不清`：说明理由（如原型侧历史产物、重写在即）；
- `排队清偿`：写清 owner 和收敛节奏（按屏 / 按迭代）。

没有处置声明的 baseline 会退化成永久豁免池，几百条违规挂在账上无人认领。

### Phase 2：i18n 层

项目已经有运行时 i18n 和词典后再启用：

```json
{ "kit": { "layers": ["base", "i18n"] } }
```

需要配置：`pageRoots`、`codeRoots`、`runtimeHints`、`dictPaths`、`wrapperNames`。

### Phase 3：handoff 层

目标：让设计和实现可对账。

启用前必须具备：

- 每屏 `*.manifest.generated.json`
- `screen-manifest.schema.json`
- 每个实现栈的 `IMPL-PROFILE`
- 实现侧 runtime anchor 规则
- `DEVIATION-LEDGER.md`

启用：

```json
{ "kit": { "layers": ["base", "handoff"] } }
```

## 4. CI 接线

**CI/commit gate 接线是落地必做步骤，不是可选项。** guard 的防漂移承诺 = baseline 只拦新增，前提是每次改动都有人跑；只靠人手动 `run-checks.js` 的项目，漂移会静默进主干，kit 等于没装。上线节奏建议：先报告制（`allow_failure: true` 或等价物）验证 CI 环境（submodule 拉取、Node 版本），连续两次与本地复跑一致后转硬。

### GitHub Actions 示例

```yaml
name: design-spec
on: [pull_request]
jobs:
  design-spec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: node tools/design-spec-kit/tools/kit-doctor.js
      - run: node tools/design-spec-kit/tools/run-checks.js
```

### GitLab CI 示例

```yaml
design_spec:
  image: node:20-alpine
  stage: test
  variables:
    GIT_SUBMODULE_STRATEGY: normal
    GIT_SUBMODULE_PATHS: tools/design-spec-kit
    GIT_SUBMODULE_DEPTH: "1"
  rules:
    - changes:
        - ui-design/**/*
        - docs/design-spec/**/*
        - tools/design-spec-kit   # submodule gitlink（kit 升级）
        - .gitmodules
  script:
    - node tools/design-spec-kit/tools/kit-doctor.js
    - node tools/design-spec-kit/tools/run-checks.js
```

submodule 拉取的相对 URL 与 job token 允许列表两个前置见上文「推荐接入形态」。复制式接入（无 submodule）把 changes 里的 gitlink 行换成 `.design-spec-kit.version`。

## 5. Commit Gate 接线

推荐路径触发，不要全仓无差别跑。示例：

```sh
#!/bin/sh
set -eu

changed=$(git diff --cached --name-only)
if echo "$changed" | grep -Eq '^(ui-design/|docs/design-spec/|\.design-spec-kit\.version|\.gitmodules|tools/design-spec-kit)'; then
  node tools/design-spec-kit/tools/kit-doctor.js
  node tools/design-spec-kit/tools/run-checks.js
fi
```

在已有 commit-gate 系统里，把 `node tools/design-spec-kit/tools/run-checks.js` 注册到设计相关路径即可。

## 6. 什么时候不该硬闸

- handoff 层资产没齐时，不要把实现仓路径纳入硬闸。
- 没有 i18n 运行时和词典时，不要启用 `i18n` 层。
- baseline 未经复核前，CI 可以先报告制；复核后再转硬。
