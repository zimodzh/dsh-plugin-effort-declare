# src/client/

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

Browser half: registers **Reasoning efforts** in the Web UI settings panel and writes `llm-pi-ai` through the official settings RPC.

Wiring failures in `apply` are logged and never thrown. A throwing plugin `apply` in the web shell takes down the whole front end.

Cross-plugin work uses Cordis services only (`connection`, `settingsScope`, `settingsSchema`, `slots`, `locale`, `remote`). Do not value-import `@deepseek-ai/dsh-client-ui-settings-models`: the client bundle purity rule forbids inlining other `@deepseek-ai/*` packages except platform modules in the shell’s frozen table.

## What's in this directory

| File | Role |
| --- | --- |
| [`index.ts`](./index.ts) | Registers zh/en copy and `settings.section` (id `effort-declare`, order 15); refreshes on settings, adapter, and connection-reset events. |
| [`EffortDeclareSection.tsx`](./EffortDeclareSection.tsx) | Route cards, presets, Off tri-state, advanced protocol switches, save and cancel. |
| [`locales.ts`](./locales.ts) | Copy namespace `plugin-effort-declare`. |
| [`effort-declare.module.css`](./effort-declare.module.css) | `--dsw-alias-*` tokens only, so dark theme stays correct. |
| [`schema-ops.ts`](./schema-ops.ts) | Binds `settingsSchema` as plain callbacks so the service identity is not passed into React. |

Visual language follows the official Models page, not `--ds-*` variables with light-mode fallbacks.
