# src/core/

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
  </samp>
</p>

本插件的领域逻辑：无 React、无 Cordis 服务实例。设置页与 Vitest 都只依赖这些纯函数，因此推理档位与图片输入语义可以在不启动 DSH 的情况下回归。

规范键名与 `thinkingFormat` 取值对齐 `@deepseek-ai/dsh-llm-pi-ai`（0.1.0-rc.8；0.1.1-rc.2 档位集合相同）。`thinkingFormat` 由 [`tests/fixtures/pi-ai-thinking-format-union.ts`](../../tests/fixtures/pi-ai-thinking-format-union.ts) 钉现场 schema；档位键由测试钉本地白名单。UI 可选项只来自现场 schema union。`models[].input` 的可写模态为 `text` 与 `image`，与官方 schema 一致。

## 这个目录里有什么

| 文件 | 说明 |
| --- | --- |
| [`catalog.ts`](./catalog.ts) | 规范档位顺序、`thinkingFormat` 回退列表、请求模态（`INPUT_MODALITIES` / `IMAGE_CAPABLE_INPUT`）、`llm-pi-ai` / DeepSeek 相关常量。 |
| [`efforts.ts`](./efforts.ts) | `reasoningEfforts` 读写、Off 三态（value 模式写入 `trim()` 后的字符串）、校验（空对象 / 只开 Off / 未知键返回错误码，不抛异常）。 |
| [`input.ts`](./input.ts) | 每模型 `input`：勾选写入 `['text', 'image']`，取消删除该键；空列表 / 仅 image / 重复 / 未知模态返回错误码。 |
| [`presets.ts`](./presets.ts) | DeepSeek、OpenAI、仅开/关三套预设；每套对三个方言键都表态；spread 到已有模型行与路由 `compat`，保留已有 `input`。 |
| [`path-ops.ts`](./path-ops.ts) | 与官方模型页相同的一层键 diff；`buildSaveOps` 使用 `settingsPath`，只提交该路由的 `models` 整表和有差异的 `compat` 键。 |
| [`drafts.ts`](./drafts.ts) | 用户层草稿、dirty 与 pathOps 一致、保存后 revision。刷新时以最新用户层模型名单为成员真理，按 id 贴回未保存的 overlay 键（`reasoningEfforts` 与 `input` 独立，含已清除 = 删键）；`compat` 按键三路合并。冲突仅当本地脏字段的 originals 也变了（只 bump revision 或别的卡保存不报）。 |
| [`paths.ts`](./paths.ts) | 嵌套读取、对象与模型表的 clone（非对象行跳过）。 |
| [`filter.ts`](./filter.ts) | 哪些路由可编辑：手工 `llm-pi-ai` + openai-completions；排除 catalog 与官方 DeepSeek。 |
| [`validate.ts`](./validate.ts) | 对单行先校验 `reasoningEfforts`，再校验 `input`。 |
| [`attribution.ts`](./attribution.ts) | 设置页页脚：`version © 年 Stardust`。首年写死 2026，结束年由打包时的 UTC 年注入，不是用户打开 DSH 的日期。 |

**缺席字段**表示默认关闭。不要把「未声明档位」写成 `reasoningEfforts: false`——`false` 在官方语义里是从 catalog 模型上剥掉推理。不要把「未声明视觉」写成 `input: []`——官方把空列表当成缺席，但坏戳记不应被重新保存。取消图片输入必须删除该键，而不是写成 `[text]`。
