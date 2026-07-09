# DESIGN-SYNC（设计 handoff → 消费仓同步引擎）

> 状态：v2.3.0 落地。`tools/design-sync.js` 把「设计稿进入消费仓 target」这一步做成确定性工具，
> 收尾强制重生 manifest + 跑 guard，不靠 skill 记忆。引擎与平台无关，业务细节全在消费仓 profile。

## 1. 边界

- **引擎负责**：解压 handoff zip（内置零依赖 ZIP 读取器 + 安全校验）/ 吃已解目录、定位 `<top>/project/`、
  三态对比、`_archive` 双向提示、覆盖/删除安全门、非破坏 apply、postSync 编排、`--json` 机读报告。
- **引擎不负责**：业务目录命名、业务后续 SOP、设计稿内容、manifest 路径（由 `manifest-sync.js` 读 `config.json` 解析）、
  实现级视觉 evidence（走 `flutter-visual` / `impl-visual`）。
- 与个人 skill 的关系是**单向依赖 skill → engine**：skill 是驱动前端（认意图、喂引擎吃不到的输入如 MCP 逐文件拉、
  解释结果、拿人确认删除），引擎从不回调 skill。

## 2. 配置：`docs/design-spec/design-sync.json`

```jsonc
{
  "modules": {
    "<module>": {
      "target": "ui-design/apps/<module>",      // 同步目标子树（写盘边界锁死在此）
      "sourceProjectSubdir": "project",          // <top>/<subdir>/ 才是要镜像的源
      "topNameHints": ["hiagent-mobile", "..."], // 顶名子串命中即匹配该 module（自动认 module 用）
      "kind": "static-prototype",                 // 信息性；引擎不据此分支
      "transferExcludes": [".DS_Store", "uploads/", "..."], // 不同步、也不参与分类
      "diffExcludes": [],                          // 两侧都可能出现的派生物：完全排除出三态与 hits
      "targetOnlyAllow": ["**/*.standalone.html"], // 目标侧独有的合法产物：从 onlyInTarget 移到 hits（透明记账）
      "postSync": [
        { "type": "link-check" },
        { "type": "manifest-sync" },
        { "type": "design-spec-check" }
      ]
    }
  }
}
```

manifest 路径**不在此声明**——`manifest-sync.js` 自己读 `config.json` 各模块 `check-manifest` guard 的
`sourceManifestDir` / `manifestDir` / `screensListPath`，避免第二份真源。

### 三种排除，语义不同（别混）

| 字段 | 作用 | 用于 |
|---|---|---|
| `transferExcludes` | 不同步、不参与分类 | 临时/画布状态文件（`.DS_Store` / `uploads/` / `screenshots/` / `tmp/` 等）。缺省即这套。 |
| `diffExcludes` | 从 changed / onlyInSource / onlyInTarget / hits **全部**剔除 | 两侧都可能出现、但不该 diff 的派生物 |
| `targetOnlyAllow` | 只把 `onlyInTarget` 命中项移到 `targetOnlyAllowHits`（可见记账） | 目标侧独有的合法产物（react-spa 的 `*.standalone.html` 等） |

**优先级**：某文件同时命中 `diffExcludes` 与 `targetOnlyAllow` 时，`diffExcludes` 先生效（该文件从分类彻底消失，
不进 hits）。所以**纯目标侧派生物优先用 `targetOnlyAllow`**（进 hits，透明），`diffExcludes` 留给"两侧都可能有"的情形。

> `git`-ignore 但要同步的文件（如设计师 v1 对照 `*.bak`）**不进任何 excludes**，靠消费仓 `.gitignore` 兜。

## 3. CLI

```bash
# cwd = 消费仓根；提交后前缀 tools/design-spec-kit/tools/，dev clone 迭代期换 ~/Desktop/design-spec-kit/tools/
node tools/design-spec-kit/tools/design-sync.js --zip <handoff.zip> --module <m>            # 默认 apply
node tools/design-spec-kit/tools/design-sync.js --zip <handoff.zip> --module <m> --dry-run  # 只报告不写盘
node tools/design-spec-kit/tools/design-sync.js --module <m> --source <dir>                 # 吃已解目录（skill 源 B 用）
node tools/design-spec-kit/tools/design-sync.js --module <m> --check-only                   # 只跑 guard，不同步
```

附加：`--json`（机读报告）、`--apply-deletes`（放行删除）、`--force-overwrite`（放行覆盖本地改动）。

`--module` 省略时按 `topNameHints` 自动认；认不准 fail-closed（多模块要求显式 `--module`）。

## 4. 三态与 archive 提示

- `changed`：两侧都有、内容不同。
- `onlyInSource`：设计新增（apply 时补建）。
- `onlyInTarget`：项目侧残留候选（已扣除 `diffExcludes` / `targetOnlyAllow`）。**默认只报告不删**。
- `_archive` 双向提示（report-only）：`possible-archived-residue`（设计师归档、原位置残留）/
  `possible-unarchived-residue`（反归档、`_archive` 内残留）。不自动删，交人确认。

## 5. 覆盖 / 删除安全门（fail-closed）

只对**将被动到的 path** 做本地改动检测，无关 dirty 不阻塞：

1. 算本轮将覆盖（changed）与将删除（`--apply-deletes` 下的 onlyInTarget）的 target path。
2. 与 `git status --porcelain -- <target>` 求交集；空交集则该维度不阻塞。
3. 覆盖命中本地修改：须 `--force-overwrite` 才写，否则跳过并列清单。
4. 删除：须 `--apply-deletes`；命中本地修改的删除额外须 `--force-overwrite`。
5. 两门相互独立，`--force-overwrite` 不隐含 `--apply-deletes`。

非 git 环境下门降级（跳过检测），apply 仍锁写盘边界在 target 子树内。

## 6. 解压安全（外部输入 · fail-closed）

handoff zip 是外部输入，中央目录解析阶段即校验，**任一越界 abort、不落任何盘**：

- 路径逃逸（`..`）、绝对路径（`/` 或盘符开头）、NUL → 拒。
- symlink / hardlink entry（unix 外部属性 `S_IFLNK`）→ 拒。
- zip bomb：单文件 / 总量 / entry 数上限 + 膨胀比阈值 → 超限拒。
- ZIP64 / 加密 / 未知压缩方法 → fail-closed。
- apply 写盘：每个目标路径规范化后必须仍在 target 子树内，否则 abort（工具级不变量，独立于宿主 auto-mode）。

## 7. postSync

| type | 行为 |
|---|---|
| `link-check` | 扫 html/css 相对链接是否解析（best-effort，报 warning 不硬闸） |
| `manifest-sync` | `node <kit>/tools/manifest-sync.js --module <m>`（重生 generated + screens） |
| `manifest-sync-check` | 同上 `--check`（只校验） |
| `design-spec-check` | `node <kit>/tools/run-checks.js`（含 check-manifest guard） |
| `command` | 消费仓自定义命令（契约见下） |

顺序契约：`manifest-sync`（重生）必须排在 `design-spec-check`（校验）之前。dry-run 下全部 SKIP（不写盘、不跑）。

### `command` 执行契约

- **cwd**：消费仓根。
- **cmd**：字符串（走 `sh -c`）或数组（`execFile`，不过 shell，免注入/quoting 漂移）。
- **env**：继承当前环境 + 可选 `step.env` 覆盖。
- **exit**：非 0 即该步 FAIL，整体 `RESULT: FAIL` + 退出码 1。
- **输出**：stdout/stderr 收进报告（`--json` 下作为该步字段）。
- **timeout**：默认 300s（`step.timeoutMs` 可覆盖），超时记 FAIL（exit 124）。
- 命令必须非交互。

## 8. `--json` 报告契约

`{ jsonVersion, tool, module, mode, source, diff:{changed,onlyInSource,onlyInTarget,targetOnlyAllowHits,archiveHints},
gate:{gitAvailable,overwriteConflicts,deleteConflicts,overwriteBlocked,allowedChanged,allowedDeletes},
apply:{written,deleted}|null, postSync:[{type,label,status,...}], result }`。

skill wrapper 解析它做解释与删除项确认，不解析人类文本。

## 9. 与实现级视觉 evidence 的关系

`design-sync` 只保证"设计源 + manifest 同步"，不保证真实 App 实现已对齐。实现级 evidence 仍走
`flutter-visual` / `impl-visual`（`make design-spec-check-flutter` 等显式入口），不进默认 postSync。
