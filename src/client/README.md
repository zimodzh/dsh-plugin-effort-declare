# src/client/

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
  </samp>
</p>

浏览器半区：在 Web UI 的设置面板注册「推理档位」，并经官方 settings RPC 写入 `llm-pi-ai`。

`apply` 接线失败会抛出，与官方模型页相同；不要整段 `try/catch` 吞掉。卸载时 locale、CSS 与事件订阅随 `ctx.effect` 清理。

跨插件协作只使用 Cordis 服务（`connection`、`settingsScope`、`settingsSchema`、`slots`、`locale`、`remote`）。不要 value-import `@deepseek-ai/dsh-client-ui-settings-models`：client bundle 的 purity 规则禁止把其它 `@deepseek-ai/*` 打进包内（shell 冻结模块表里的平台模块除外）。

## 这个目录里有什么

| 文件 | 说明 |
| --- | --- |
| [`index.ts`](./index.ts) | 注册 zh/en 文案、CSS（`ctx.effect` 插入/移除）与 `settings.section`（id `effort-declare`，order 12）。`describe.subscribe` 只同步 `writable`（任意 namespace 都会触发，含自己的 `acceptView`）。`settings/document-updated`（仅 `llm-pi-ai`）带上 Host 的 revision；设置页跳过自己这次 mutate 的回声，等镜像 revision **追上**后再 `getSnapshot()`，不把 `ensure()` 当刷新。提供方目录来自 `llm/adapters-updated`；`connection/reset` 走 `ensure()` 以便等待官方镜像的 in-flight `load()`。`locale: NS` 由框架注入 `t`，inject 只传 `api` / `describe` / `schema` / `subscribeInvalidate`。 |
| [`EffortDeclareSection.tsx`](./EffortDeclareSection.tsx) | 路由卡片、预设、Off 三态、高级协议开关、保存与取消。保存互斥到整个 `llm-pi-ai` namespace（以 ref 防连点）；`busy` 只给正在 mutate 的卡显示「保存中」，其它卡 `saveLocked`。自己写入成功立刻同步 `draftsRef` 并走 `acceptView` + `applySaveSuccess`。保存过程中到达的外部 `document-updated` 会在结束后补刷。无冲突的 reload 清掉该卡 conflict/error notice。页脚显示打包时冻结的版本与版权年。 |
| [`build-info.ts`](./build-info.ts) | 读取 tsdown `define` 注入的 `package.json` version 与 UTC 打包年，拼出页脚文案。 |
| [`globals.d.ts`](./globals.d.ts) | `__PLUGIN_VERSION__` / `__COPYRIGHT_TO__` 的类型声明。 |
| [`load-drafts.ts`](./load-drafts.ts) | 从 `llm.providers` + 镜像组装草稿；草稿取自 `user`，协议分类可用 `value`。`thinkingFormat` 可选项只来自现场 schema union。首屏 `ensure()`；刷新只读 `getSnapshot()`，并提供等 namespace revision 的 helper。 |
| [`locales.ts`](./locales.ts) | 文案 namespace `plugin-effort-declare`。 |
| [`effort-declare.module.css`](./effort-declare.module.css) | 仅使用 `--dsw-alias-*` 设计令牌，保证暗色主题正确。 |
| [`schema-ops.ts`](./schema-ops.ts) | 将 `settingsSchema` 收成普通回调（含 `validate`），避免把服务身份带进 React。 |

样式与交互对齐官方模型页，而不是带浅色 fallback 的 `--ds-*` 变量。
