# src/client/

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
  </samp>
</p>

浏览器半区：在 Web UI 的设置面板注册「推理档位」，并经官方 settings RPC 写入 `llm-pi-ai`。

`apply` 的接线失败只记录日志、不抛异常。Web shell 中插件 `apply` 抛错会终止整个前端进程。

跨插件协作只使用 Cordis 服务（`connection`、`settingsScope`、`settingsSchema`、`slots`、`locale`、`remote`）。不要 value-import `@deepseek-ai/dsh-client-ui-settings-models`：client bundle 的 purity 规则禁止把其它 `@deepseek-ai/*` 打进包内（shell 冻结模块表里的平台模块除外）。

## 这个目录里有什么

| 文件 | 说明 |
| --- | --- |
| [`index.ts`](./index.ts) | 注册 zh/en 文案与 `settings.section`（id `effort-declare`，order 15）；订阅 settings / 适配器 / 连接重置以便刷新。 |
| [`EffortDeclareSection.tsx`](./EffortDeclareSection.tsx) | 路由卡片、预设、Off 三态、高级协议开关、保存与取消。 |
| [`locales.ts`](./locales.ts) | 文案 namespace `plugin-effort-declare`。 |
| [`effort-declare.module.css`](./effort-declare.module.css) | 仅使用 `--dsw-alias-*` 设计令牌，保证暗色主题正确。 |
| [`schema-ops.ts`](./schema-ops.ts) | 将 `settingsSchema` 收成普通回调，避免把服务身份带进 React。 |

样式与交互对齐官方模型页，而不是带浅色 fallback 的 `--ds-*` 变量。
