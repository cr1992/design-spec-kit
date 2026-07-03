# 给 AI 的首条指令（粘这一段给接手项目的 Claude）

> 用法：把下面 `===` 之间的整段，连同 `design-spec-kit/` 文件夹一起交给新项目的 Claude（或粘进对方项目的第一条消息）。它会自我引导完成安装 + 立规矩。

===

我给你一套 **design-spec-kit**（在项目里的 `design-spec-kit/` 文件夹）。它是一套**与平台无关的设计纪律 + 还原交接套件**，目的是让这个项目长期**不发生页面漂移、UI 规范能落地、实现还原不跑偏**。请你按下面步骤接管它，做完跟我确认。

**第一步 · 先读不动手**
读这四份，建立认知，先别改任何东西：
- `design-spec-kit/README.md`（这是什么 + 三层结构 + 怎么用）
- `design-spec-kit/CLAUDE.template.md`（契约骨架）
- `design-spec-kit/HANDOFF.md`（还原交接层——本项目**有实现侧还原需求才装**，纯设计项目可跳过）
- `design-spec-kit/docs/DESIGN-REF.template.md`（组件/token 索引骨架）

**第二步 · 跟我对齐基调与范围（提问，别自己定）**
用一轮问题跟我确认：产品一句话定位、技术栈、气质方向、浅色/深色/双模式、字体、主题色、平台与信息密度；**另外确认两件装配决策**：① 要不要装还原交接层（有没有独立的实现侧要对账）；② 项目有没有 i18n 机制（决定 guard⑤ 装不装）。**没对齐前不要建 token、不要画屏。**

**第三步 · 安装套件（落地到项目）**
- `CLAUDE.template.md` 复制到**项目根目录**改名 `CLAUDE.md`，替换所有〈尖括号〉，删掉不装的层的小节。
- `docs/` 模板复制进项目 `docs/` 去后缀（不装还原层就跳过 manifest / ledger / profile 三件）。
- `tools/` **整目录**原样复制进项目 `tools/`；按第二步的装配决策改 `tools/run-checks.js` 顶部的 `INSTALLED_LAYERS`（层开关单一真源，kit-doctor 也读它）——聚合入口只跑启用层，未启用层的 guard 文件留着不会被误跑。kit 的 `package.json` scripts（check / doctor）合入项目。
- **逐个打开 guard 顶部「配置」区按本项目改**：扫描目录、尺寸档集、图标源写法、i18n 运行时路径、（还原层）manifest 目录与偏离标记扫描根。

**第四步 · 建设计真源（token 先行）**
建 `tokens.css`：颜色/字号/间距/圆角/阴影**全部定义在这一处**。之后所有组件**只引用 `var(--*)`**。同步在 `docs/DESIGN-REF.md` 登记。

**第五步 · 跑 kit-doctor 验安装**
读 `tools/kit-doctor.js` 全文粘进 run_script 执行（有 shell 就 `node tools/kit-doctor.js`）。它专抓「装了但没适配」：guard 漏装、配置正则在本项目零命中、聚合入口没接、DoD 表与已装 guard 对不上。**doctor 不过 = 安装没完成**，别急着画屏。

**第六步 · 此后每次干活都守这四条纪律**
1. **先 grep 再写**：造任何 UI 元素前先读/grep `docs/DESIGN-REF.md`——命中就抄，没命中再造，造完**立刻登记**。
2. **单一真源 + 生成物重生**：数值只在 `tokens.css`；一切生成物改源必重生、勿手改。
3. **删东西删干净**：删屏/删组件同步删 CSS 与登记；确要保留进 orphan baseline 并写原因。
4. **定档即写 CHANGELOG**：当天段落 append，绝不开第二个同日段。
（装了还原层再加第五条：**屏 done = 屏 + manifest 语义半**；状态空间必须表态，实现偏离必申报。）

**第七步 · 每次 `done` 前跑 DoD guard**
- 有 shell：`node tools/run-checks.js`（串跑全部已装 guard，任一 FAIL 退出码 1）。
- 无 shell（AI 沙箱）：逐个读 guard 全文粘进 run_script 执行，看末行 `RESULT: PASS|FAIL`。
- FAIL 的处理写在各 guard 的输出提示里：修代码，或确需保留则按提示写 baseline 并在 CHANGELOG 注明理由——**绝不静默忽略**。

请先做第一、二步：读完四份文件，然后开始问我基调与装配问题。**不要跳过提问直接安装。**

===
