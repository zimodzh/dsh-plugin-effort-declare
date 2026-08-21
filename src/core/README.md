# src/core/

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
  </samp>
</p>

本插件的领域逻辑：无 React、无 Cordis 服务实例。设置页与 Vitest 都只依赖这些纯函数，因此档位语义可以在不启动 DSH 的情况下回归。

规范键名与 `thinkingFormat` 取值对齐 `@deepseek-ai/dsh-llm-pi-ai`（0.1.0-rc.8）。仓库内有回退白名单，并由测试钉住，避免 UI 与上游 schema 静默分叉。

## 这个目录里有什么

| 文件 | 说明 |
| --- | --- |
| [`catalog.ts`](./catalog.ts) | 规范档位顺序、`thinkingFormat` 回退列表、`llm-pi-ai` / DeepSeek 相关常量。 |
| [`efforts.ts`](./efforts.ts) | `reasoningEfforts` 读写、Off 三态、校验（空对象 / 只开 Off / 未知键返回错误码，不抛异常）。 |
| [`presets.ts`](./presets.ts) | DeepSeek、OpenAI、仅开/关三套预设；每套对三个方言键都表态；spread 到已有模型行与路由 `compat`。 |
| [`path-ops.ts`](./path-ops.ts) | 与官方模型页相同的一层键 diff；`buildSaveOps` 使用 `settingsPath`，只提交该路由的 `models` 整表和有差异的 `compat` 键。 |
| [`drafts.ts`](./drafts.ts) | 用户层草稿、dirty 与 pathOps 一致、保存后 revision、脏卡合并、generation。 |
| [`paths.ts`](./paths.ts) | 嵌套读取、对象与模型表的 clone（非对象行跳过）。 |
| [`filter.ts`](./filter.ts) | 哪些路由可编辑：手工 `llm-pi-ai` + openai-completions；排除 catalog 与官方 DeepSeek。 |
| [`validate.ts`](./validate.ts) | 对单行 `reasoningEfforts` 调用校验。 |

**缺席字段**表示默认关闭。不要把「未声明」写成 `reasoningEfforts: false`——`false` 在官方语义里是从 catalog 模型上剥掉推理。
