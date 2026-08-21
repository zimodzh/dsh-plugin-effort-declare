# dsh-plugin-effort-declare

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
  </samp>
</p>

**dsh-plugin-effort-declare** 是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的第三方设置插件：给手工接入的 OpenAI 兼容模型声明「能选哪些推理档」，让对话里的 Effort 行重新出现。

DSH 只有在模型向选择器公布了推理能力时才会显示该行。官方 catalog 模型自带声明；自配置的第三方供应商的手工 `llm-pi-ai` 路由通常只有 `id`、显示名和容量，Effort 行因此消失。本插件在设置中增加「推理档位」页，按模型写入官方字段 `reasoningEfforts`，必要时一并写 openai-completions 的 `compat`（例如 `thinkingFormat`）。对话选择器和请求编码仍走 DSH 原有路径：不拦截 `llm/stream`，也不替换官方「模型」页。

> **注意：** 本插件为社区维护项目，与 DeepSeek 官方无隶属关系，亦未获官方背书。

## 做什么

- 在设置导航中注册 **推理档位**（紧挨官方「模型」页）。
- 只编辑手工声明、且协议为 `openai-completions` 的 `llm-pi-ai` 路由（未写 `api` 时先读 schema 默认，再按 completions 处理）。
- 每个模型可多选规范档（`minimal` … `max`），并为每档填写发给网关的拼写（默认与键相同）。
- Off 分为三态，互不合并：无 Off；提供 Off 且不发参数；提供 Off 且发送 `none` 或自定义字符串。
- 三套可改草稿的预设（点预设 = 换成这套方言，不是叠加上一套；未知的其它 `compat` 键会保留）：
  - **DeepSeek 兼容**：`off` 空值 + `low` / `high` / `max` 原样；`thinkingFormat: deepseek`、`supportsDeveloperRole: false`，并 **unset** `supportsReasoningEffort`。
  - **OpenAI 兼容**：`minimal` / `low` / `medium` / `high`；**unset** `thinkingFormat`、`supportsDeveloperRole`、`supportsReasoningEffort`（默认 openai 方言）。
  - **仅开/关**：`off` + `high`，**unset** `thinkingFormat` 与 `supportsDeveloperRole`，并设置 `supportsReasoningEffort: false`。界面会提示：选择器里多档在线上没有区别。
- 保存使用官方 `settings.mutate` 嵌套 path ops：对该路由的 `models` 做整表替换并保留未编辑字段；`compat` 只提交有差异的键。
- 「清除本模型声明」会 unset `reasoningEfforts`（字段缺席 = 默认关闭），而不是写入 `false`。

## 不做什么

- 不改对话里当次选择的 Effort，也不写入 `agent-default-model.reasoningEffort`。
- 不拦截 LLM 请求，不编造 HTTP 请求体。
- 不编辑官方 DeepSeek 适配器（`llm-deepseek` / `deepseek-official`）。
- 不编辑 catalog 路由：对其写入 `models` 会整表替换官方目录。
- 不覆盖 Anthropic `thinkingBudgets` 或 `openai-responses`。
- 不在 `cordis.yml` / bundle 层预置 per-model `reasoningEfforts`（settings 字典合并没有删除语义）。
- 不把路由级 `reasoning` 写成 `high`（会话标题、压缩等省略档位的请求会被带去思考）。

## 插件里有什么

| 部分 | 说明 |
| --- | --- |
| 设置页 | 独立 `settings.section`（id `effort-declare`），中英文案，暗色主题安全的 `--dsw-alias-*` 样式 |
| 核心逻辑 | 档位编解码、Off 三态、三套预设、路由过滤、与官方模型页同形的 path ops |
| 组合包 | `package.json` 的 `dsh.bundle` + `cordis.patch.yml`，可供 `dsh plugin add` 安装 |
| 浏览器包 | `dsh.client` 指向 `lib/client.js`，由 Web UI 加载 |
| 测试 | 仓库内 Vitest：预设方言三键、user 层草稿、保存 revision、脏卡合并、校验、列表过滤 |
| 类型与产物 | `pnpm build` 生成的 `lib/`（host ESM、client CJS、`.d.ts`） |

协议转换由 `@earendil-works/pi-ai` 与 `@deepseek-ai/dsh-llm-pi-ai` 完成。本插件只写配置。

## 和官方「模型」页的关系

| 页面 | 负责 |
| --- | --- |
| 模型 | 密钥、端点、协议、模型 id / 显示名 / 容量 |
| 推理档位（本插件） | 每模型 `reasoningEfforts` 与 openai-completions 的 `compat` |

官方模型页保存时会保留未编辑字段，因此改名或改容量不应抹掉本页写过的声明。本插件同样整行 spread，不会把模型收成只剩 `id` / `name`。

## 目录结构

```
dsh-plugin-effort-declare/
├── README.md / README.en.md     # 本文件
├── LICENSE                      # MIT
├── package.json                 # 包名、dsh.bundle / dsh.client、导出
├── cordis.patch.yml             # 安装时插入的插件行
├── tsconfig*.json               # host / client 分 Program
├── tsdown.config.ts             # host ESM + client CJS；@deepseek-ai/* 保持 external
├── vitest.config.ts
├── src/                         # 源码
│   ├── index.ts                 # Host 入口（v1 不注册 host 服务）
│   ├── core/                    # 纯函数，单测直接覆盖
│   └── client/                  # 设置页 UI
├── tests/                       # Vitest
└── lib/                         # 构建产物（建议随仓发布，便于安装）
```

各子目录另有中英 README，说明该目录的职责与文件。

## 安装

本插件在 DeepSeek Harness **0.1.0-rc.8** 上制作，并在 **0.1.1-rc.1** 上手测通过。请使用 **≥ 0.1.0-rc.8** 的 DSH，以及一个可启动的 profile（常见是 `web`）。低于 rc.8 未经测试。

`dsh plugin` 写入的是 **当前 `$DSH_HOME`** 里的 profile。未设置时默认 `~/.dsh`。DeepSeek Harness Desktop 等部署的 home 往往不是这条默认路径：必须先导出 `DSH_HOME`（PowerShell：`$env:DSH_HOME`）再跑下面的命令，否则会装进另一份 home。

**从本地目录（推荐）：** 需要已有 `lib/`（本仓库提交了构建产物）。Windows 用 `file:` 加正斜杠绝对路径更稳：

```bash
dsh plugin --profile web add file:/absolute/path/to/dsh-plugin-effort-declare
dsh --profile web --dump-config   # 应出现 # == dsh-plugin-effort-declare
```

装完后重启正在跑这个 profile 的 DSH（Desktop 则重启其后端）。打开 **设置 → 推理档位**。先在「模型」页添加手工 `llm-pi-ai` 提供方，本页才会列出可编辑路由。

**从 GitHub：** 本插件尚未发布到固定上游。有仓库后再：

```bash
dsh plugin --profile web add github:OWNER/dsh-plugin-effort-declare
```

git 安装会跑 `prepare`（`tsdown`）。若 pnpm 拒绝，把包名写入该 profile 的 `pnpm-workspace.yaml` 的 `allowBuilds` 后再 `add` 一次。已构建的 checkout 或 `pnpm pack` 的 tarball 可跳过构建授权。

## 使用

1. 打开对应路由的卡片，或点预设写入草稿。
2. 按模型勾选档位；需要时改线上拼写，并单独设置 Off 三态。
3. 高级区（默认折叠）可改 `thinkingFormat`、`supportsDeveloperRole`、`supportsReasoningEffort`。v1 勾选框只能把 `supportsDeveloperRole` 写成 `false` 或缺席；文档里若已是 `true`，页面会提示，未勾选时不会因为展示逻辑去写 `false`。
4. 保存。校验失败（例如只开了 Off、或空的 `reasoningEfforts`）会显示在对应路由卡片上，不会让客户端崩溃；官方 schema 拒绝时同样展示 Host 返回的错误。`apply` 接线失败会抛出，设置里不应出现「静默没有这一页」。

只读部署下提交按钮不可用。

## 开发

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

- Host 与 client 必须分 `tsconfig`（两边 Context merge 不能共一个 TypeScript Program）。
- 客户端 bundle 禁止把 `@deepseek-ai/*` 打进包内（除 shell 冻结模块表里的平台模块）。跨插件协作走 Cordis 服务，不要 value-import 官方模型页。
- 不要打印或把凭据写进文档与 issue。

## 维护与贡献

欢迎 Issue 与 Pull Request。提交前请：

1. 说明改动是修 bug、增强 UI，还是对齐新的 DSH / pi-ai schema。
2. 保持「只写 `llm-pi-ai` 配置」的边界：不要加 `llm/stream` 拦截、不要 fork 官方模型页、不要平行存一份档位表。
3. 跑通 `pnpm test`、`pnpm typecheck`、`pnpm build`。
4. 新增模型可见字段时，必须走会话日志可重建的机制（本插件 v1 不向模型注入提示词）。
5. 中英 README 一起改。子目录 README 只描述该目录，安装与贡献以仓库根文档为准。

上游档位名与 `thinkingFormat` 枚举以 DSH 安装里 `llm-pi-ai` 的 schema / catalog 为准。仓库内有一份回退白名单，并由测试钉住；schema 漂移时应先改测试再改 UI。

安全：不要在日志、截图或 issue 中粘贴 API 密钥或 `.credentials.yaml` 的值。

## License

[MIT](./LICENSE) © 2026 Stardust
