# 屏幕交接清单（SCREEN-MANIFEST）· 模板与规则

> 每屏一份「设计 → 实现」交接契约。**屏 done = 屏文件 + 本清单语义半。**
> 方法论见 kit 的 `HANDOFF.md` §1；本文件是可直接抄的骨架 + 字段规则。

## normalized 规则（先读）
- 源头载体随项目：单文件手写 / 屏文件内结构化注释 + 索引脚本，都行。
- 但**必须重生为** `docs/manifests/<screen>.manifest.generated.json`，符合同目录 `screen-manifest.schema.json`。
- guard⑥（check-manifest）与 T1 结构对账**只认生成物**。改源必重生，勿手改生成物（底座「真源 + 重生」纪律）。

## 生成物骨架（JSON）

```json
{
  "screen": { "id": "<screen-id>", "title": "<人读名>", "source": "<屏文件相对路径>" },
  "version": 1,
  "state_classes": { "inherit": true, "exempt": [] },
  "elements": [
    {
      "anchor": "<稳定class或命名>",
      "role": "<一句话职责>",
      "copy_key": "<词典键·可选>",
      "icon": "<图标名·可选>",
      "states": ["<仅在这些状态可见·可选，缺省=常驻>"],
      "delegated": { "to": "backend", "contract_ref": "<路径#锚点>", "status": "open" }
    }
  ],
  "states": {
    "designed": [
      { "id": "<state-id>", "note": "<可选>" }
    ],
    "delegated": [
      { "state": "<state-id>", "to": "impl", "contract_ref": "<路径#锚点>", "status": "open" }
    ]
  },
  "params_ref": { "generator": "<抽取器命令>", "output": "<参数产物路径>" }
}
```

## 字段规则

| 字段 | 规则 |
|---|---|
| `screen.id` | 屏唯一 id，与项目屏清单真源一致 |
| `version` | 整数，从 1 起。**任何 anchor 改名 / 状态空间变更 = 破坏性变更，版本 +1 并记 CHANGELOG** |
| `state_classes.inherit` | 默认 `true`：平台标准状态类（loading / empty / error / no-permission / offline / saving / 高风险确认 / 权限拒绝，最终清单以 IMPL-PROFILE 定稿为准）视为已授权，实现覆盖它们不算偏离、且**必须**覆盖 |
| `state_classes.exempt` | 本屏确实不适用的标准态，**每条必须带 note 写原因**（guard⑥ 查） |
| `elements[].anchor` | 设计↔实现对账主键（`^[a-z][a-z0-9-]*$`）。实现侧以 runtime anchor（如 `data-design-id`，语法按 IMPL-PROFILE）回指它 |
| `elements[].delegated` | 元素级「设计画了、下游还没有」：`to: backend/firmware` + 契约引用（对应界面上的占位 / 置灰处置） |
| `states.designed` | 设计画出的状态。**designed 与 delegated 合计不得为空——设计可以少画，不可以不表态** |
| `states.delegated` | 设计授权自补：`to: impl`（实现按契约自补，落地后回执改 `reconciled`）/ `backend` / `firmware`（等下游能力）。`contract_ref` 必填；写 `TBD` = 显式待裁决信号（guard⑥ 记 WARN 不 FAIL） |
| `params_ref` | 参数半：抽取器生成的布局参数产物引用（抽取器按 IMPL-PROFILE 登记），无抽取器可整段省略 |

## 最小可用示例（一个登录屏）

```json
{
  "screen": { "id": "login", "title": "登录", "source": "pages/login.html" },
  "version": 1,
  "state_classes": { "inherit": true, "exempt": [ { "id": "offline", "note": "登录前无会话，离线态由系统弹层承载" } ] },
  "elements": [
    { "anchor": "login-form", "role": "账号密码表单" },
    { "anchor": "login-submit", "role": "主按钮", "copy_key": "login.submit" },
    { "anchor": "login-sso", "role": "第三方登录入口", "delegated": { "to": "backend", "contract_ref": "docs/api/auth.yaml#sso", "status": "open" } }
  ],
  "states": {
    "designed": [ { "id": "default" }, { "id": "submitting" } ],
    "delegated": [
      { "state": "captcha-required", "to": "impl", "contract_ref": "docs/api/auth.yaml#captcha", "status": "open" }
    ]
  }
}
```
